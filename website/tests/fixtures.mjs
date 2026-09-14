// Workspaces that can be built twice: once as the sandbox filesystem the
// browser engine walks, and once as real directories with real git
// repositories for the parity test. Anything that lives here has to be
// reproducible with plain `git init`, so the two sides can be compared
// character for character.

import { dir, file, link, repo, workspace } from '../assets/js/engine/fs.js';

/** The directory the sandbox pretends to run in. */
export const ROOT = '/home/dev/work';

/**
 * @typedef {object} Fixture
 * @property {string} name
 * @property {string} summary
 * @property {Entry[]} entries
 */

/**
 * @typedef {object} Entry
 * @property {'repo'|'dir'|'file'|'link'|'worktree'} kind
 * @property {string} name
 * @property {string} [branch]
 * @property {{x: string, y: string, path: string}[]} [changes]
 * @property {Entry[]} [children]
 * @property {string} [target]
 * @property {string} [of]      For a worktree: the repository it belongs to.
 * @property {boolean} [detached]
 * @property {boolean} [unreadable]
 */

/** @type {Fixture[]} */
export const FIXTURES = [
  {
    name: 'mixed',
    summary: 'Six repositories, one of them with an unstaged change and one on another branch.',
    entries: [
      { kind: 'repo', name: 'api-gateway', branch: 'main' },
      { kind: 'repo', name: 'billing-worker', branch: 'main' },
      { kind: 'repo', name: 'docs-site', branch: 'main' },
      { kind: 'repo', name: 'infra-scripts', branch: 'main' },
      { kind: 'repo', name: 'web-console', branch: 'main', changes: [{ x: ' ', y: 'M', path: 'src/main.rs' }] },
      { kind: 'repo', name: 'web-console-hotfix', branch: 'hotfix' },
    ],
  },
  {
    name: 'nested',
    summary: 'A second level that only --depth 2 reaches, plus a repository that is not descended into.',
    entries: [
      { kind: 'repo', name: 'api-gateway', branch: 'main' },
      {
        kind: 'dir',
        name: 'vendor',
        children: [
          { kind: 'repo', name: 'legacy-auth', branch: 'main' },
          { kind: 'repo', name: 'legacy-billing', branch: 'release/1.x' },
        ],
      },
      {
        kind: 'repo',
        name: 'web-console',
        branch: 'main',
        // git reports the nested checkout as one untracked directory, which is
        // also the proof that mgit stopped at web-console and never walked in.
        changes: [{ x: '?', y: '?', path: 'inner-do-not-find-me/' }],
        children: [{ kind: 'repo', name: 'inner-do-not-find-me', branch: 'main' }],
      },
      { kind: 'dir', name: 'notes' },
      { kind: 'file', name: 'README.md' },
    ],
  },
  {
    name: 'case-order',
    summary: 'Names that sort the same on every platform only because the comparison folds case. A case insensitive filesystem cannot hold two names that differ only in case, so the fixture does not use a pair like that.',
    entries: [
      { kind: 'repo', name: 'Alpha', branch: 'main' },
      { kind: 'repo', name: 'alpha-two', branch: 'main' },
      { kind: 'repo', name: 'Beta', branch: 'main' },
      { kind: 'repo', name: 'beta-two', branch: 'main' },
      { kind: 'repo', name: 'Zulu', branch: 'main' },
      { kind: 'repo', name: 'apex', branch: 'main' },
    ],
  },
  {
    name: 'symlink',
    summary: 'A symbolic link next to its target: both names are reported, and the link is not walked twice.',
    entries: [
      { kind: 'repo', name: 'api-gateway', branch: 'main' },
      { kind: 'link', name: 'gateway-link', target: 'api-gateway' },
      { kind: 'dir', name: 'nested', children: [{ kind: 'repo', name: 'deep', branch: 'main' }] },
      { kind: 'link', name: 'nested-link', target: 'nested' },
    ],
  },
  {
    name: 'worktree',
    summary: 'A linked worktree, whose .git is a file rather than a directory.',
    entries: [
      { kind: 'repo', name: 'api-gateway', branch: 'main' },
      { kind: 'worktree', name: 'api-gateway-hotfix', of: 'api-gateway', branch: 'hotfix' },
    ],
  },
  {
    name: 'empty',
    summary: 'A directory with no repository at all.',
    entries: [
      { kind: 'dir', name: 'notes' },
      { kind: 'file', name: 'TODO.md' },
    ],
  },
  {
    name: 'inside-a-repo',
    summary: 'The working directory is itself a repository and has no repositories below it.',
    entries: [
      { kind: 'dir', name: 'src' },
      { kind: 'file', name: 'Cargo.toml' },
    ],
    rootIsRepo: { branch: 'main', changes: [{ x: ' ', y: 'M', path: 'src/lib.rs' }] },
  },
  {
    name: 'dirty-many',
    summary: 'Several kinds of working tree change at once.',
    entries: [
      {
        kind: 'repo',
        name: 'web-console',
        branch: 'main',
        changes: [
          { x: 'A', y: ' ', path: 'src/added.rs' },
          { x: ' ', y: 'M', path: 'src/main.rs' },
          { x: '?', y: '?', path: 'scratch.txt' },
        ],
      },
      { kind: 'repo', name: 'api-gateway', branch: 'main' },
    ],
  },
];

/** Build the sandbox filesystem for a fixture. */
export function buildSandbox(fixture) {
  const nodes = fixture.entries.map(toNode);
  const fs = workspace(nodes);
  if (fixture.rootIsRepo) {
    const found = fs.lookup(ROOT);
    found.node.repo = repo('work', {
      branch: fixture.rootIsRepo.branch,
      changes: fixture.rootIsRepo.changes || [],
    }).repo;
  }
  return fs;
}

function toNode(entry) {
  switch (entry.kind) {
    case 'repo':
    case 'worktree':
      return repo(entry.name, {
        branch: entry.detached ? '' : entry.branch || 'main',
        changes: entry.changes || [],
        dotGitIsFile: entry.kind === 'worktree',
        commits: [{ hash: 'aaaaaaa', subject: 'Initial commit' }],
      }, { children: (entry.children || []).map(toNode) });
    case 'dir':
      return dir(entry.name, (entry.children || []).map(toNode),
        entry.unreadable ? { unreadable: 'Permission denied (os error 13)' } : {});
    case 'link':
      return link(entry.name, ROOT + '/' + entry.target);
    case 'file':
    default:
      return file(entry.name);
  }
}

/** The command lines both sides are asked to run. */
export const PARITY_COMMANDS = [
  { argv: ['--version'] },
  { argv: ['--help'] },
  { argv: [] },
  { argv: ['--summary'] },
  { argv: ['--list'] },
  { argv: ['-l'] },
  { argv: ['--list', '--depth', '2'] },
  { argv: ['-d2'] },
  { argv: ['--depth', '3', '--summary'] },
  { argv: ['--quiet'] },
  { argv: ['-q', '--summary'] },
  { argv: ['--ascii', '--summary'] },
  { argv: ['--color=always', '--summary'] },
  { argv: ['--color', 'never', '--summary'] },
  { argv: ['--no-color'] },
  { argv: ['--fail-fast', '--summary'] },
  { argv: ['--allow-empty'] },
  { argv: ['--allow-empty', '--summary'] },
  { argv: ['status', '-s'] },
  { argv: ['status', '--short'] },
  { argv: ['--summary', 'status', '-s'] },
  { argv: ['branch', '--show-current'] },
  { argv: ['--depth', '2', '--list'] },
  { argv: ['--depth', '9'] },
  { argv: ['-d'] },
  { argv: ['--depth', 'zero'] },
  { argv: ['--depth', '0'] },
  { argv: ['--color', 'chartreuse'] },
  { argv: ['--nonsense-option'], describe: 'an unknown option goes to git' },
  { argv: ['--', '--version'], describe: 'after -- everything belongs to git' },
  { argv: ['--summary'], env: { MGIT_COLOR: 'always' } },
  { argv: ['--summary'], env: { MGIT_COLOR: 'never', CLICOLOR_FORCE: '1' } },
  { argv: ['--summary'], env: { CLICOLOR_FORCE: '1' } },
  { argv: ['--summary'], env: { CLICOLOR_FORCE: '1', NO_COLOR: '1' } },
  { argv: ['--summary'], env: { MGIT_ASCII: '1' } },
  { argv: ['--summary'], env: { LC_ALL: 'C' } },
  { argv: ['--summary'], env: { LC_ALL: 'C', MGIT_ASCII: '0' } },
];
