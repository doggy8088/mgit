// Finding the Git repositories below a directory, ported from src/discovery.rs.
//
// Breadth first, one level at a time; a directory that is a repository is
// recorded and never descended into; symbolic links are followed but every
// real directory is only entered once, so a link loop cannot spin forever.
// The result is sorted by name, case insensitively, with the exact spelling
// breaking ties, which is what makes the order identical on macOS, Linux and
// Windows.

import { baseName } from './fs.js';

/**
 * @param {import('./fs.js').Filesystem} fs
 * @param {string} root Absolute path of the directory to search.
 * @param {number} maxDepth
 * @returns {{repositories: {name: string, path: string}[], warnings: string[], trace: TraceStep[], error?: string}}
 */
export function discover(fs, root, maxDepth) {
  /** @type {{name: string, path: string}[]} */
  const repositories = [];
  /** @type {string[]} */
  const warnings = [];
  /** @type {TraceStep[]} */
  const trace = [];

  if (maxDepth === 0) return { repositories, warnings, trace };

  const visited = new Set([fs.canonical(root)]);
  /** @type {{path: string, level: number}[]} */
  const queue = [{ path: root, level: 1 }];

  while (queue.length > 0) {
    const { path, level } = queue.shift();
    const listing = fs.readDir(path);
    if (!listing.ok) {
      if (path === root) return { repositories: [], warnings, trace, error: listing.error };
      warnings.push('mgit: cannot read `' + path + '`: ' + listing.error + '\n');
      trace.push({ kind: 'unreadable', path, level, detail: listing.error });
      continue;
    }

    trace.push({ kind: 'scan', path, level, detail: String(listing.entries.length) });

    for (const entry of listing.entries) {
      if (!fs.isDirectory(entry.path)) {
        trace.push({ kind: 'skip-file', path: entry.path, level });
        continue;
      }

      if (fs.isRepository(entry.path)) {
        repositories.push({ name: entry.name, path: entry.path });
        trace.push({ kind: 'repository', path: entry.path, level });
        continue;
      }

      const identity = fs.canonical(entry.path);
      if (level >= maxDepth) {
        trace.push({ kind: 'depth-limit', path: entry.path, level });
        continue;
      }
      if (visited.has(identity)) {
        trace.push({ kind: 'already-visited', path: entry.path, level, detail: identity });
        continue;
      }
      visited.add(identity);
      queue.push({ path: entry.path, level: level + 1 });
      trace.push({ kind: 'descend', path: entry.path, level });
    }
  }

  repositories.sort((left, right) => compareKeys(sortKey(left.name), sortKey(right.name)));
  return { repositories, warnings, trace };
}

/** Whether the directory itself is a repository. */
export function isRepository(fs, path) {
  return fs.isRepository(path);
}

function sortKey(name) {
  return [name.toLowerCase(), name];
}

function compareKeys(left, right) {
  if (left[0] !== right[0]) return left[0] < right[0] ? -1 : 1;
  if (left[1] !== right[1]) return left[1] < right[1] ? -1 : 1;
  return 0;
}

/**
 * @typedef {object} TraceStep
 * @property {'scan'|'repository'|'descend'|'depth-limit'|'already-visited'|'skip-file'|'unreadable'} kind
 * @property {string} path
 * @property {number} level
 * @property {string} [detail]
 */

export { baseName };
