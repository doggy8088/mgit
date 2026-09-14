// The workspaces the playground starts from.
//
// Every scenario is a working directory a developer could actually have, and
// each one exists to make one of mgit's rules visible: the depth limit, the
// worktree whose .git is a file, the link that is reported under both names,
// the directory that holds nothing at all.

import { dir, file, link, repo, workspace } from './fs.js';

export const CWD = '/home/dev/work';

/** Build the filesystem of a scenario by id, falling back to the first one. */
export function buildScenario(id) {
  const scenario = SCENARIOS.find((entry) => entry.id === id) || SCENARIOS[0];
  return { id: scenario.id, fs: scenario.build(), cwd: scenario.cwd || CWD };
}

/** A deep copy, so a run can be replayed from exactly where it started. */
export function snapshot(fs) {
  return JSON.parse(JSON.stringify(fs.root));
}

/** Put a snapshot back. */
export function restore(fs, saved) {
  fs.root = JSON.parse(JSON.stringify(saved));
}

const commit = (subject, hash) => ({ hash, subject });

export const SCENARIOS = [
  {
    id: 'workbench',
    demo: true,
    build: () => workspace([
      repo('api-gateway', {
        branch: 'main',
        head: '4f1a9c2',
        remote: { name: 'origin', url: 'git@github.com:acme/api-gateway.git', behind: 0, ahead: 0 },
        branches: ['main', 'develop'],
        commits: [commit('Rate limit the public routes', '4f1a9c2'), commit('Bump tonic to 0.12', 'd0c3b71')],
      }),
      repo('billing-worker', {
        branch: 'main',
        head: '8b21e04',
        remote: { name: 'origin', url: 'git@github.com:acme/billing-worker.git', behind: 0, ahead: 0 },
        branches: ['main'],
        commits: [commit('Retry the webhook once', '8b21e04')],
      }),
      repo('docs-site', {
        branch: 'main',
        head: 'c77a105',
        remote: { name: 'origin', url: 'git@github.com:acme/docs-site.git', behind: 3, ahead: 0 },
        branches: ['main'],
        commits: [commit('Describe the new limits', 'c77a105')],
      }),
      repo('infra-scripts', {
        branch: 'main',
        head: '2e9d640',
        remote: { name: 'origin', url: 'git@github.com:acme/infra-scripts.git', behind: 0, ahead: 1 },
        branches: ['main'],
        commits: [commit('Roll the staging certificates', '2e9d640')],
      }),
      repo('web-console', {
        branch: 'main',
        head: 'a0f4d18',
        changes: [{ x: ' ', y: 'M', path: 'src/main.rs' }],
        pullFails: 'dirty-rebase',
        remote: { name: 'origin', url: 'git@github.com:acme/web-console.git', behind: 2, ahead: 0 },
        branches: ['main', 'hotfix'],
        commits: [commit('Wire the session banner', 'a0f4d18')],
      }),
      repo('web-console-hotfix', {
        branch: 'hotfix',
        head: 'b5c2739',
        dotGitIsFile: true,
        remote: { name: 'origin', url: 'git@github.com:acme/web-console.git', behind: 0, ahead: 0 },
        branches: ['hotfix', 'main'],
        commits: [commit('Pin the console to 2.4.1', 'b5c2739')],
      }),
    ]),
    commands: ['mgit', 'mgit --summary', 'mgit pull', 'mgit --list', 'mgit log --oneline -n 1'],
  },
  {
    id: 'nested',
    build: () => workspace([
      repo('api-gateway', { branch: 'main', head: '4f1a9c2' }),
      dir('vendor', [
        repo('legacy-auth', { branch: 'main', head: '91ab30d' }),
        repo('legacy-billing', { branch: 'release/1.x', head: '7c40e52' }),
      ]),
      dir('notes', [file('roadmap.md')]),
      repo('web-console', {
        branch: 'main',
        head: 'a0f4d18',
        changes: [{ x: '?', y: '?', path: 'vendored-sdk/' }],
      }, { children: [repo('vendored-sdk', { branch: 'main', head: '1f7c8a4' })] }),
      file('README.md'),
    ]),
    commands: ['mgit --list', 'mgit --depth 2 --list', 'mgit --depth 2 --summary', 'mgit --depth 3 --list'],
  },
  {
    id: 'worktrees',
    build: () => workspace([
      repo('api-gateway', { branch: 'main', head: '4f1a9c2', branches: ['main', 'release'] }),
      repo('api-gateway-release', {
        branch: 'release',
        head: '4f1a9c2',
        dotGitIsFile: true,
        branches: ['release', 'main'],
      }),
      repo('shared-protos', {
        branch: 'main',
        head: '33bd90a',
        dotGitIsFile: true,
        remote: { name: 'origin', url: 'git@github.com:acme/shared-protos.git', behind: 0, ahead: 0 },
      }),
      dir('build-output', [file('bundle.js')]),
    ]),
    commands: ['mgit --list', 'mgit branch --show-current', 'mgit --summary'],
  },
  {
    id: 'links',
    build: () => workspace([
      repo('api-gateway', { branch: 'main', head: '4f1a9c2' }),
      link('gateway', CWD + '/api-gateway'),
      dir('projects', [repo('web-console', { branch: 'main', head: 'a0f4d18' })]),
      link('projects-link', CWD + '/projects'),
    ]),
    commands: ['mgit --list', 'mgit --depth 2 --list', 'mgit --depth 2 --summary'],
  },
  {
    id: 'empty',
    build: () => workspace([
      dir('notes', [file('todo.md')]),
      dir('downloads', []),
      file('scratch.txt'),
    ]),
    commands: ['mgit', 'mgit --allow-empty', 'mgit --depth 3', 'git init fresh-project'],
  },
  {
    id: 'inside-repo',
    build: () => {
      const fs = workspace([dir('src', [file('main.rs')]), file('Cargo.toml')]);
      fs.lookup(CWD).node.repo = repo('work', {
        branch: 'main',
        head: '6d2f0b8',
        changes: [{ x: ' ', y: 'M', path: 'src/main.rs' }],
        commits: [commit('Split the parser out', '6d2f0b8')],
      }).repo;
      return fs;
    },
    commands: ['mgit', 'mgit --list', 'mgit log --oneline -n 1'],
  },
  {
    id: 'locked',
    build: () => workspace([
      repo('api-gateway', { branch: 'main', head: '4f1a9c2' }),
      dir('restricted', [], { unreadable: 'Permission denied (os error 13)' }),
      dir('team', [repo('design-system', { branch: 'main', head: '5ac1d33' })]),
    ]),
    commands: ['mgit --depth 2 --list', 'mgit --depth 2 --summary', 'mgit --depth 2 2>/dev/null'],
  },
  {
    id: 'fleet',
    build: () => workspace([
      repo('acl-service', { branch: 'main', head: '11a0c3d' }),
      repo('api-gateway', { branch: 'main', head: '4f1a9c2', remote: { name: 'origin', url: 'u', behind: 1, ahead: 0 } }),
      repo('billing-worker', { branch: 'main', head: '8b21e04' }),
      repo('config-server', { branch: 'main', head: '2b7f109', changes: [{ x: ' ', y: 'M', path: 'config/prod.yaml' }], pullFails: 'dirty-rebase' }),
      repo('docs-site', { branch: 'main', head: 'c77a105', remote: { name: 'origin', url: 'u', behind: 3, ahead: 0 } }),
      repo('edge-proxy', { branch: 'main', head: '9d5e2a7' }),
      repo('infra-scripts', { branch: 'main', head: '2e9d640' }),
      repo('mobile-app', { branch: 'release/4.2', head: '0e6b4c1' }),
      repo('notification-hub', { branch: 'main', head: '7a3f8e2', pullFails: 'conflict', remote: { name: 'origin', url: 'u', behind: 1, ahead: 1 } }),
      repo('search-index', { branch: 'main', head: 'e41c907' }),
      repo('web-console', { branch: 'main', head: 'a0f4d18' }),
      repo('worker-pool', { branch: 'main', head: '3c8a5f0', remote: null }),
    ]),
    commands: ['mgit', 'mgit --summary', 'mgit pull', 'mgit --fail-fast pull', 'mgit fetch --all --prune'],
  },
];

/** Ids in order, for the scenario picker. */
export const SCENARIO_IDS = SCENARIOS.map((scenario) => scenario.id);
