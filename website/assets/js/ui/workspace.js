// The workspace panel: what the working directory holds, and the controls that
// change it. Editing the workspace is the point — most of mgit's behaviour is
// a function of what is on disk, so the fastest way to understand a rule is to
// break it and run the command again.

const STATE_ORDER = ['blocked', 'dirty', 'behind', 'ahead', 'clean'];

export class WorkspaceView {
  /**
   * @param {HTMLElement} root
   * @param {{getFilesystem: () => import('../engine/fs.js').Filesystem, getCwd: () => string, onChange: () => void, labels: Record<string, string>}} options
   */
  constructor(root, options) {
    this.root = root;
    this.options = options;
    this.labels = options.labels || {};
    this.list = root.querySelector('[data-workspace-list]');
    this.summary = root.querySelector('[data-workspace-summary]');

    const addButton = root.querySelector('[data-workspace-add]');
    const addInput = root.querySelector('[data-workspace-name]');
    if (addButton && addInput) {
      addButton.addEventListener('click', () => this.addRepository(addInput));
      addInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          this.addRepository(addInput);
        }
      });
    }

    this.list.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const path = button.closest('[data-path]').dataset.path;
      this.applyAction(button.dataset.action, path);
    });
  }

  addRepository(input) {
    const name = input.value.trim();
    if (name.length === 0) return;
    if (!/^[A-Za-z0-9._-]+$/.test(name)) {
      input.setCustomValidity(this.labels.name_rule || 'Use letters, digits, dots, dashes or underscores.');
      input.reportValidity();
      return;
    }
    input.setCustomValidity('');
    const fs = this.options.getFilesystem();
    const parent = fs.lookup(this.options.getCwd());
    if (parent.node.children.some((child) => child.name === name)) {
      input.setCustomValidity(this.labels.name_taken || 'That name is already taken.');
      input.reportValidity();
      return;
    }
    parent.node.children.push(makeRepository(name));
    input.value = '';
    this.options.onChange();
  }

  applyAction(action, path) {
    const fs = this.options.getFilesystem();
    const found = fs.lookup(path);
    if (!found) return;
    const state = found.node.repo;

    switch (action) {
      case 'dirty':
        if (!state) break;
        state.changes = state.changes && state.changes.length > 0
          ? []
          : [{ x: ' ', y: 'M', path: 'src/main.rs' }];
        break;
      case 'behind':
        if (!state) break;
        if (!state.remote) {
          state.remote = { name: 'origin', url: 'git@github.com:acme/' + found.node.name + '.git', behind: 2, ahead: 0 };
        } else {
          state.remote.behind = state.remote.behind > 0 ? 0 : 2;
        }
        break;
      case 'block':
        if (!state) break;
        state.pullFails = state.pullFails ? null : 'dirty-rebase';
        if (state.pullFails && (!state.changes || state.changes.length === 0)) {
          state.changes = [{ x: ' ', y: 'M', path: 'src/main.rs' }];
        }
        break;
      case 'remove': {
        const parentPath = path.slice(0, path.lastIndexOf('/')) || '/';
        const parent = fs.lookup(parentPath);
        if (parent) {
          parent.node.children = parent.node.children.filter((child) => child.name !== found.node.name);
        }
        break;
      }
      default:
        break;
    }
    this.options.onChange();
  }

  render() {
    const fs = this.options.getFilesystem();
    const cwd = this.options.getCwd();
    this.list.textContent = '';

    const rootRepo = fs.repoAt(cwd);
    if (rootRepo) {
      this.list.append(this.row({
        name: '.',
        path: cwd,
        kind: 'repo',
        node: rootRepo,
        depth: 1,
        isRoot: true,
      }));
    }

    const listing = fs.readDir(cwd);
    let repositories = 0;
    if (listing.ok) {
      for (const entry of listing.entries) {
        const node = fs.lookupNoFollow(entry.path);
        if (!node) continue;
        const resolved = fs.lookup(entry.path);
        const isRepo = fs.isRepository(entry.path);
        if (isRepo) repositories += 1;
        this.list.append(this.row({
          name: entry.name,
          path: entry.path,
          kind: node.node.kind === 'link' ? 'link' : node.node.kind === 'file' ? 'file' : isRepo ? 'repo' : 'dir',
          node: isRepo ? resolved.node : node.node,
          depth: 1,
        }));
        if (!isRepo && node.node.kind === 'dir') {
          const inner = fs.readDir(entry.path);
          if (inner.ok) {
            for (const child of inner.entries) {
              const childNode = fs.lookupNoFollow(child.path);
              if (!childNode) continue;
              const childIsRepo = fs.isRepository(child.path);
              this.list.append(this.row({
                name: child.name,
                path: child.path,
                kind: childNode.node.kind === 'link' ? 'link' : childNode.node.kind === 'file' ? 'file' : childIsRepo ? 'repo' : 'dir',
                node: childIsRepo ? fs.lookup(child.path).node : childNode.node,
                depth: 2,
              }));
            }
          }
        }
      }
    }

    if (this.summary) {
      const template = this.labels.summary || '{repos} repositories at depth 1';
      this.summary.textContent = template.replace('{repos}', String(repositories));
    }
  }

  row({ name, path, kind, node, depth, isRoot }) {
    const item = document.createElement('li');
    const row = document.createElement('div');
    row.className = 'tree__row';
    row.dataset.kind = kind;
    row.dataset.depth = String(depth);
    row.dataset.path = path;

    const label = document.createElement('span');
    label.className = 'tree__name';
    label.textContent = isRoot ? (this.labels.here_is_repo || '. (this directory)') : name + (kind === 'dir' ? '/' : '');
    row.append(label);

    if (kind === 'link' && node.target) {
      const target = document.createElement('span');
      target.className = 'tree__branch';
      target.textContent = '→ ' + node.target.split('/').pop();
      row.append(target);
    }

    if (kind === 'repo' && node.repo) {
      const branch = document.createElement('span');
      branch.className = 'tree__branch';
      branch.textContent = node.repo.branch || node.repo.head;
      row.append(branch);

      const state = repositoryState(node.repo);
      const badge = document.createElement('span');
      badge.className = 'tree__state';
      badge.dataset.state = state === 'ahead' ? 'clean' : state;
      badge.textContent = this.labels['state_' + state] || state;
      row.append(badge);
      if (node.repo.dotGitIsFile) {
        badge.title = '.git ' + (this.labels.dot_git_file || 'file');
      }

      const actions = document.createElement('div');
      actions.className = 'tree__actions';
      for (const action of ['dirty', 'behind', 'block', 'remove']) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'tree__toggle';
        button.dataset.action = action;
        button.textContent = this.labels['action_' + action] || action;
        const description = (this.labels['action_title_' + action] || action) + ': ' + name;
        button.title = description;
        button.setAttribute('aria-label', description);
        actions.append(button);
      }
      row.append(actions);
      if (node.repo.dotGitIsFile) {
        const tag = document.createElement('span');
        tag.className = 'tree__state';
        tag.dataset.state = 'file';
        tag.textContent = '.git ' + (this.labels.dot_git_file || 'file');
        row.append(tag);
      }
    }

    if (kind === 'dir' && node.unreadable) {
      const tag = document.createElement('span');
      tag.className = 'tree__state';
      tag.dataset.state = 'blocked';
      tag.textContent = this.labels.unreadable || 'unreadable';
      row.append(tag);
    }

    item.append(row);
    return item;
  }
}

/** The one word that describes a repository right now. */
export function repositoryState(repo) {
  if (repo.pullFails) return 'blocked';
  if (repo.changes && repo.changes.length > 0) return 'dirty';
  if (repo.remote && repo.remote.behind > 0) return 'behind';
  if (repo.remote && repo.remote.ahead > 0) return 'ahead';
  return 'clean';
}

export { STATE_ORDER };

function makeRepository(name) {
  return {
    name,
    kind: 'dir',
    children: [],
    repo: {
      branch: 'main',
      head: '0000000',
      changes: [],
      commits: [{ hash: '0000000', subject: 'Initial commit' }],
      remote: { name: 'origin', url: 'git@github.com:acme/' + name + '.git', behind: 0, ahead: 0 },
      branches: ['main'],
      pullFails: null,
    },
  };
}
