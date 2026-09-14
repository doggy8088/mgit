// Build a fixture as real directories with real git repositories, so the same
// command can be handed to the compiled binary.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const GIT_ENV = {
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_SYSTEM: '/dev/null',
  GIT_AUTHOR_NAME: 'Sandbox',
  GIT_AUTHOR_EMAIL: 'sandbox@example.com',
  GIT_COMMITTER_NAME: 'Sandbox',
  GIT_COMMITTER_EMAIL: 'sandbox@example.com',
  GIT_AUTHOR_DATE: '2026-09-14T09:00:00+08:00',
  GIT_COMMITTER_DATE: '2026-09-14T09:00:00+08:00',
};

function git(cwd, args) {
  execFileSync('git', args, { cwd, env: GIT_ENV, stdio: 'pipe' });
}

/**
 * Create the fixture below a fresh temporary directory.
 * @returns {string} the real path of the working directory
 */
export function materialize(fixture) {
  const base = realpathSync(mkdtempSync(join(tmpdir(), 'mgit-parity-')));
  const root = join(base, 'work');
  mkdirSync(root);

  // The entries come first: a root repository commits whatever is already
  // there, so nothing shows up as an unexpected untracked file.
  createEntries(root, fixture.entries);
  if (fixture.rootIsRepo) {
    initRepository(root, {
      name: 'work',
      branch: fixture.rootIsRepo.branch,
      changes: fixture.rootIsRepo.changes,
    });
  }
  return root;
}

function createEntries(parent, entries) {
  // Worktrees have to come last: the repository they belong to must exist.
  const ordered = entries.slice().sort((left, right) =>
    (left.kind === 'worktree' ? 1 : 0) - (right.kind === 'worktree' ? 1 : 0));

  for (const entry of ordered) {
    const path = join(parent, entry.name);
    switch (entry.kind) {
      case 'repo':
        initRepository(path, entry);
        createEntries(path, entry.children || []);
        break;
      case 'worktree':
        git(join(parent, entry.of), ['worktree', 'add', '-q', '-b', entry.branch, path]);
        break;
      case 'dir':
        mkdirSync(path, { recursive: true });
        createEntries(path, entry.children || []);
        break;
      case 'link':
        symlinkSync(entry.target, path);
        break;
      case 'file':
      default:
        writeFileSync(path, 'placeholder\n');
        break;
    }
  }
}

function initRepository(path, entry) {
  mkdirSync(path, { recursive: true });
  git(path, ['init', '-q', '-b', entry.branch || 'main']);
  git(path, ['config', 'commit.gpgsign', 'false']);
  git(path, ['config', 'core.autocrlf', 'false']);

  const changes = entry.changes || [];
  const tracked = changes.filter((change) => change.x !== '?');
  mkdirSync(join(path, 'src'), { recursive: true });
  writeFileSync(join(path, 'README.md'), '# ' + entry.name + '\n');
  for (const change of tracked) {
    if (change.x === 'A') continue;
    if (change.path.endsWith('/')) continue;
    mkdirSync(join(path, change.path.split('/').slice(0, -1).join('/') || '.'), { recursive: true });
    writeFileSync(join(path, change.path), 'original\n');
  }
  git(path, ['add', '-A']);
  git(path, ['commit', '-q', '-m', 'Initial commit']);

  for (const change of changes) {
    const file = join(path, change.path);
    mkdirSync(join(path, change.path.split('/').slice(0, -1).join('/') || '.'), { recursive: true });
    if (change.x === '?') {
      // A trailing slash means the untracked entry is a directory that some
      // other part of the fixture creates.
      if (!change.path.endsWith('/')) writeFileSync(file, 'scratch\n');
    } else if (change.x === 'A') {
      writeFileSync(file, 'added\n');
      git(path, ['add', change.path]);
    } else if (change.y === 'M') {
      writeFileSync(file, 'changed\n');
    } else if (change.x === 'M') {
      writeFileSync(file, 'changed\n');
      git(path, ['add', change.path]);
    }
  }

  if (entry.detached) git(path, ['checkout', '-q', '--detach', 'HEAD']);
}

export { GIT_ENV };
