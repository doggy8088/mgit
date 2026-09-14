// The sandbox filesystem.
//
// A small, purely in-memory tree that is good enough for the rules mgit
// actually depends on: directories, symbolic links, and the presence of a
// `.git` entry (a directory for a normal clone, a file for a worktree or a
// submodule). Nothing here touches the real machine.

/**
 * @typedef {object} RepoState
 * @property {string} branch       Current branch, or '' when HEAD is detached.
 * @property {string} head         Short commit of HEAD.
 * @property {boolean} [dotGitIsFile] True for a worktree or submodule checkout.
 * @property {{x: string, y: string, path: string}[]} [changes] Porcelain status entries.
 * @property {{subject: string, hash: string}[]} [commits]
 * @property {{name: string, url: string, behind: number, ahead: number}|null} [remote]
 * @property {string[]} [branches]
 * @property {'dirty-rebase'|'conflict'|'no-upstream'|'auth'|null} [pullFails]
 */

/**
 * @typedef {object} Node
 * @property {string} name
 * @property {'dir'|'file'|'link'} kind
 * @property {string} [target]     Absolute path a link points at.
 * @property {RepoState} [repo]    Present when the directory is a repository.
 * @property {Node[]} [children]
 * @property {string} [unreadable] Reason a directory cannot be read.
 */

export const SANDBOX_HOME = '/home/dev';

/** Join path segments into one absolute POSIX path. */
export function joinPath(base, name) {
  if (base === '/') return '/' + name;
  return base + '/' + name;
}

/** Split an absolute path into its segments. */
export function segments(path) {
  return path.split('/').filter((part) => part.length > 0);
}

/** The last segment of a path. */
export function baseName(path) {
  const parts = segments(path);
  return parts.length > 0 ? parts[parts.length - 1] : '/';
}

/** The parent of a path. */
export function dirName(path) {
  const parts = segments(path);
  parts.pop();
  return parts.length === 0 ? '/' : '/' + parts.join('/');
}

/** Normalise `.`, `..` and duplicated separators against a working directory. */
export function absolute(cwd, path) {
  const start = path.startsWith('/') ? [] : segments(cwd);
  const parts = start.concat(segments(path));
  /** @type {string[]} */
  const out = [];
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') { out.pop(); continue; }
    out.push(part);
  }
  return out.length === 0 ? '/' : '/' + out.join('/');
}

/** Create a directory node. */
export function dir(name, children = [], extra = {}) {
  return { name, kind: 'dir', children, ...extra };
}

/** Create a repository node. */
export function repo(name, state = {}, extra = {}) {
  return {
    name,
    kind: 'dir',
    children: extra.children || [],
    repo: {
      branch: 'main',
      head: shortHash(name),
      changes: [],
      commits: [],
      remote: { name: 'origin', url: 'git@github.com:acme/' + name + '.git', behind: 0, ahead: 0 },
      branches: ['main'],
      pullFails: null,
      ...state,
    },
    ...extra,
  };
}

/** Create a symbolic link node. */
export function link(name, target) {
  return { name, kind: 'link', target };
}

/** Create a plain file node. */
export function file(name) {
  return { name, kind: 'file' };
}

/** A deterministic seven character hash for a name, so demos stay stable. */
export function shortHash(seed) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0').slice(0, 7);
}

/**
 * The filesystem: a root node plus lookup helpers.
 */
export class Filesystem {
  /** @param {Node} root */
  constructor(root) {
    this.root = root;
  }

  /**
   * Look a path up without following a trailing symbolic link.
   * @returns {{node: Node, path: string}|null}
   */
  lookupNoFollow(path) {
    const parts = segments(path);
    let node = this.root;
    let current = '/';
    for (const part of parts) {
      if (node.kind === 'link') {
        const resolved = this.lookup(node.target);
        if (!resolved) return null;
        node = resolved.node;
        current = resolved.path;
      }
      if (node.kind !== 'dir' || !node.children) return null;
      const child = node.children.find((entry) => entry.name === part);
      if (!child) return null;
      node = child;
      current = joinPath(current, part);
    }
    return { node, path: current };
  }

  /**
   * Look a path up and follow symbolic links, like `fs::metadata` does.
   * @returns {{node: Node, path: string}|null}
   */
  lookup(path, hops = 0) {
    if (hops > 40) return null;
    const found = this.lookupNoFollow(path);
    if (!found) return null;
    if (found.node.kind === 'link') return this.lookup(found.node.target, hops + 1);
    return found;
  }

  /** The real path a path resolves to, used to detect symbolic link loops. */
  canonical(path) {
    const found = this.lookup(path);
    return found ? found.path : path;
  }

  /** Whether the path is a directory once links are followed. */
  isDirectory(path) {
    const found = this.lookup(path);
    return !!found && found.node.kind === 'dir';
  }

  /**
   * Whether the directory holds a `.git` directory or a `.git` file, which is
   * exactly what `discovery::is_repository` checks.
   */
  isRepository(path) {
    const found = this.lookup(path);
    return !!found && found.node.kind === 'dir' && !!found.node.repo;
  }

  /** The repository state at a path, if there is one. */
  repoAt(path) {
    const found = this.lookup(path);
    return found && found.node.repo ? found.node : null;
  }

  /**
   * The entries of a directory, sorted by name, like `read_entries`.
   * @returns {{ok: true, entries: {name: string, path: string}[]}|{ok: false, error: string}}
   */
  readDir(path) {
    const found = this.lookup(path);
    if (!found || found.node.kind !== 'dir') {
      return { ok: false, error: 'Not a directory (os error 20)' };
    }
    if (found.node.unreadable) {
      return { ok: false, error: found.node.unreadable };
    }
    const entries = (found.node.children || [])
      .map((child) => ({ name: child.name, path: joinPath(path, child.name) }))
      .sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));
    return { ok: true, entries };
  }
}

/**
 * Build a filesystem whose `/home/dev/work` holds the given nodes.
 * @param {Node[]} nodes
 * @param {{cwdName?: string}} [options]
 */
export function workspace(nodes, options = {}) {
  const cwdName = options.cwdName || 'work';
  return new Filesystem(
    dir('/', [dir('home', [dir('dev', [dir(cwdName, nodes)])])]),
  );
}
