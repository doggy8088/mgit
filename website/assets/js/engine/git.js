// The sandbox git.
//
// mgit itself never interprets a git command: it starts git once per
// repository and collects the exit code. The sandbox therefore needs a git
// that answers plausibly for the commands people actually try here. The
// responses below are modelled from real git output for the scripted
// repositories; anything outside the modelled set says so instead of
// inventing an answer.

const GIT_VERSION = 'git version 2.50.1';

/** Git subcommands that exist, so an unknown word can be told apart. */
const KNOWN_SUBCOMMANDS = new Set([
  'add', 'am', 'apply', 'archive', 'bisect', 'blame', 'branch', 'checkout', 'cherry-pick',
  'clean', 'clone', 'commit', 'config', 'describe', 'diff', 'fetch', 'gc', 'grep', 'init',
  'log', 'merge', 'mv', 'pull', 'push', 'rebase', 'reflog', 'remote', 'reset', 'restore',
  'revert', 'rev-parse', 'rm', 'shortlog', 'show', 'stash', 'status', 'submodule', 'switch',
  'symbolic-ref', 'tag', 'worktree',
]);

/** The subcommands the sandbox actually models. */
export const MODELLED = [
  'status', 'pull', 'fetch', 'log', 'branch', 'checkout', 'switch', 'rev-parse',
  'remote', 'diff', 'stash', 'add', 'commit', 'push', 'symbolic-ref', 'describe', 'tag',
];

/**
 * Run one git command inside one repository.
 *
 * @param {import('./fs.js').RepoState} repo mutated in place for commands that change state
 * @param {string[]} argv the arguments mgit hands to git, verbatim
 * @param {{name: string}} meta
 * @returns {{stdout: string, stderr: string, exitCode: number, modelled: boolean, note?: string}}
 */
export function runGit(repo, argv, meta = { name: 'repo' }) {
  const { subcommand, args } = splitGlobals(argv);

  if (subcommand === undefined) {
    return out('', usageText(), 1, true);
  }
  if (subcommand === '--version' || subcommand === '-v' || subcommand === 'version') {
    return out(GIT_VERSION + '\n', '', 0, true);
  }
  if (subcommand === '--help' || subcommand === '-h' || subcommand === 'help') {
    return out(usageText(), '', 0, true);
  }

  switch (subcommand) {
    case 'status': return gitStatus(repo, args);
    case 'pull': return gitPull(repo, args);
    case 'fetch': return gitFetch(repo, args);
    case 'log': return gitLog(repo, args);
    case 'branch': return gitBranch(repo, args);
    case 'checkout': return gitCheckout(repo, args, false);
    case 'switch': return gitCheckout(repo, args, true);
    case 'rev-parse': return gitRevParse(repo, args);
    case 'symbolic-ref': return gitSymbolicRef(repo, args);
    case 'remote': return gitRemote(repo, args);
    case 'diff': return gitDiff(repo, args);
    case 'stash': return gitStash(repo, args);
    case 'add': return gitAdd(repo, args);
    case 'commit': return gitCommit(repo, args, meta);
    case 'push': return gitPush(repo, args);
    case 'describe': return out(describe(repo) + '\n', '', 0, true);
    case 'tag': return out((repo.tags || []).join('\n') + ((repo.tags || []).length ? '\n' : ''), '', 0, true);
    default: break;
  }

  if (subcommand.startsWith('-')) {
    // git rejects an option it does not know before it looks for a command.
    return out('', 'unknown option: ' + subcommand + '\n' + usageText(), 129, true);
  }

  if (KNOWN_SUBCOMMANDS.has(subcommand)) {
    return {
      stdout: '',
      stderr: '',
      exitCode: 0,
      modelled: false,
      note: 'git ' + subcommand,
    };
  }
  return out(
    '',
    "git: '" + subcommand + "' is not a git command. See 'git --help'.\n",
    1,
    true,
  );
}

/** Skip git's own global options to find the subcommand. */
function splitGlobals(argv) {
  const args = argv.slice();
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '-c' || arg === '--git-dir' || arg === '--work-tree' || arg === '-C') {
      index += 1;
      continue;
    }
    if (arg.startsWith('--git-dir=') || arg.startsWith('--work-tree=') || arg === '--no-pager' || arg === '--paginate' || arg === '--bare') {
      continue;
    }
    return { subcommand: arg, args: args.slice(index + 1) };
  }
  return { subcommand: undefined, args: [] };
}

function out(stdout, stderr, exitCode, modelled) {
  return { stdout, stderr, exitCode, modelled };
}

/** git's own usage block, as it prints it when it cannot understand a word. */
export function usageText() {
  return 'usage: git [-v | --version] [-h | --help] [-C <path>] [-c <name>=<value>]\n' +
    '           [--exec-path[=<path>]] [--html-path] [--man-path] [--info-path]\n' +
    '           [-p | --paginate | -P | --no-pager] [--no-replace-objects] [--no-lazy-fetch]\n' +
    '           [--no-optional-locks] [--no-advice] [--bare] [--git-dir=<path>]\n' +
    '           [--work-tree=<path>] [--namespace=<name>] [--config-env=<name>=<envvar>]\n' +
    '           <command> [<args>]\n';
}

function shortStatusLines(repo) {
  return (repo.changes || []).map((change) => change.x + change.y + ' ' + change.path);
}

function gitStatus(repo, args) {
  const short = args.some((arg) => arg === '-s' || arg === '--short' || arg === '--porcelain');
  const withBranch = args.some((arg) => arg === '-b' || arg === '--branch');
  const lines = shortStatusLines(repo);

  if (short) {
    let text = '';
    if (withBranch) {
      text += '## ' + branchLine(repo) + '\n';
    }
    text += lines.map((line) => line + '\n').join('');
    return out(text, '', 0, true);
  }

  const head = repo.branch ? 'On branch ' + repo.branch + '\n' : 'HEAD detached at ' + repo.head + '\n';
  const tracking = repo.remote
    ? (repo.remote.behind > 0
        ? "Your branch is behind 'origin/" + repo.branch + "' by " + repo.remote.behind +
          ' commit' + (repo.remote.behind === 1 ? '' : 's') + ', and can be fast-forwarded.\n  (use "git pull" to update your local branch)\n'
        : repo.remote.ahead > 0
          ? "Your branch is ahead of 'origin/" + repo.branch + "' by " + repo.remote.ahead +
            ' commit' + (repo.remote.ahead === 1 ? '' : 's') + '.\n  (use "git push" to publish your local commits)\n'
          : "Your branch is up to date with 'origin/" + repo.branch + "'.\n")
    : '';

  if (lines.length === 0) {
    return out(head + tracking + '\nnothing to commit, working tree clean\n', '', 0, true);
  }

  const staged = (repo.changes || []).filter((change) => change.x !== ' ' && change.x !== '?');
  const unstaged = (repo.changes || []).filter((change) => change.y !== ' ' && change.x !== '?');
  const untracked = (repo.changes || []).filter((change) => change.x === '?');

  let text = head + tracking + '\n';
  if (staged.length > 0) {
    text += 'Changes to be committed:\n  (use "git restore --staged <file>..." to unstage)\n';
    for (const change of staged) text += '\t' + verb(change.x) + ':   ' + change.path + '\n';
    text += '\n';
  }
  if (unstaged.length > 0) {
    text += 'Changes not staged for commit:\n' +
      '  (use "git add <file>..." to update what will be committed)\n' +
      '  (use "git restore <file>..." to discard changes in working directory)\n';
    for (const change of unstaged) text += '\t' + verb(change.y) + ':   ' + change.path + '\n';
    text += '\n';
  }
  if (untracked.length > 0) {
    text += 'Untracked files:\n  (use "git add <file>..." to include in what will be committed)\n';
    for (const change of untracked) text += '\t' + change.path + '\n';
    text += '\n';
  }
  text += staged.length > 0
    ? ''
    : 'no changes added to commit (use "git add" and/or "git commit -a")\n';
  return out(text, '', 0, true);
}

function verb(code) {
  switch (code) {
    case 'M': return 'modified';
    case 'A': return 'new file';
    case 'D': return 'deleted';
    case 'R': return 'renamed';
    default: return 'modified';
  }
}

function branchLine(repo) {
  if (!repo.branch) return 'HEAD (no branch)';
  if (!repo.remote) return repo.branch;
  const marks = [];
  if (repo.remote.ahead > 0) marks.push('ahead ' + repo.remote.ahead);
  if (repo.remote.behind > 0) marks.push('behind ' + repo.remote.behind);
  return repo.branch + '...origin/' + repo.branch + (marks.length > 0 ? ' [' + marks.join(', ') + ']' : '');
}

function gitPull(repo, args) {
  const rebase = args.includes('--rebase') || repo.pullStrategy === 'rebase';
  if (!repo.remote) {
    return out('', 'There is no tracking information for the current branch.\n' +
      'Please specify which branch you want to merge with.\n', 1, true);
  }
  if (repo.pullFails === 'auth') {
    return out('', 'remote: Invalid username or token.\n' +
      "fatal: Authentication failed for 'https://github.com/acme/" + (repo.slug || 'repo') + ".git/'\n", 128, true);
  }
  if (repo.pullFails === 'dirty-rebase' && (repo.changes || []).some((change) => change.x !== '?')) {
    return out('', 'error: cannot pull with rebase: You have unstaged changes.\n' +
      'error: Please commit or stash them.\n', 128, true);
  }
  if (repo.pullFails === 'conflict' && repo.remote.behind > 0) {
    const from = repo.head;
    repo.head = nextHash(repo.head);
    repo.remote.behind = 0;
    repo.conflicted = true;
    return {
      stdout: 'Auto-merging ' + (repo.conflictPath || 'src/main.rs') + '\n',
      stderr: 'From github.com:acme/' + (repo.slug || 'repo') + '\n' +
        '   ' + from + '..' + repo.head + '  ' + repo.branch + '     -> origin/' + repo.branch + '\n' +
        'CONFLICT (content): Merge conflict in ' + (repo.conflictPath || 'src/main.rs') + '\n' +
        'Automatic merge failed; fix conflicts and then commit the result.\n',
      exitCode: 1,
      modelled: true,
    };
  }
  if (repo.remote.behind > 0) {
    const from = repo.head;
    const count = repo.remote.behind;
    repo.head = nextHash(repo.head);
    repo.remote.behind = 0;
    const files = Math.max(1, Math.min(9, count * 2));
    return {
      stdout: 'Updating ' + from + '..' + repo.head + '\n' +
        (rebase ? 'Successfully rebased and updated refs/heads/' + repo.branch + '.\n'
          : 'Fast-forward\n' + ' ' + files + ' file' + (files === 1 ? '' : 's') + ' changed, ' +
            (files * 7) + ' insertions(+), ' + (files * 2) + ' deletions(-)\n'),
      stderr: 'From github.com:acme/' + (repo.slug || 'repo') + '\n' +
        '   ' + from + '..' + repo.head + '  ' + repo.branch + '     -> origin/' + repo.branch + '\n',
      exitCode: 0,
      modelled: true,
    };
  }
  return out('Already up to date.\n', '', 0, true);
}

function gitFetch(repo, args) {
  if (!repo.remote) return out('', '', 0, true);
  if (repo.pullFails === 'auth') {
    return out('', 'remote: Invalid username or token.\n' +
      "fatal: Authentication failed for 'https://github.com/acme/" + (repo.slug || 'repo') + ".git/'\n", 128, true);
  }
  const prune = args.includes('--prune') || args.includes('-p');
  let stderr = '';
  if (repo.remote.behind > 0) {
    const from = repo.head;
    stderr += 'From github.com:acme/' + (repo.slug || 'repo') + '\n' +
      '   ' + from + '..' + nextHash(from) + '  ' + repo.branch + '     -> origin/' + repo.branch + '\n';
  }
  if (prune && repo.stalePrunable) {
    stderr += ' - [deleted]         (none)     -> origin/' + repo.stalePrunable + '\n';
    repo.stalePrunable = null;
  }
  return out('', stderr, 0, true);
}

function gitLog(repo, args) {
  const oneline = args.includes('--oneline');
  let limit = Number.POSITIVE_INFINITY;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '-n' || arg === '--max-count') {
      const value = Number.parseInt(args[index + 1], 10);
      if (Number.isFinite(value)) limit = value;
    } else if (/^-[0-9]+$/.test(arg)) {
      limit = Number.parseInt(arg.slice(1), 10);
    } else if (arg.startsWith('--max-count=')) {
      limit = Number.parseInt(arg.slice('--max-count='.length), 10);
    }
  }
  const commits = (repo.commits || []).slice(0, Number.isFinite(limit) ? limit : undefined);
  if (commits.length === 0) {
    return out('', 'fatal: your current branch \'' + (repo.branch || 'HEAD') +
      '\' does not have any commits yet\n', 128, true);
  }
  if (oneline) {
    return out(commits.map((commit) => commit.hash + ' ' + commit.subject + '\n').join(''), '', 0, true);
  }
  const text = commits.map((commit, index) =>
    'commit ' + longHash(commit.hash) + (index === 0 ? ' (HEAD -> ' + repo.branch + ')' : '') + '\n' +
    'Author: ' + (commit.author || 'Dev Sandbox <dev@example.com>') + '\n' +
    'Date:   ' + (commit.date || 'Mon Sep 14 09:0' + (index % 9) + ':11 2026 +0800') + '\n\n' +
    '    ' + commit.subject + '\n').join('\n');
  return out(text, '', 0, true);
}

function gitBranch(repo, args) {
  if (args.includes('--show-current')) {
    return out((repo.branch || '') + (repo.branch ? '\n' : ''), '', 0, true);
  }
  const all = args.includes('-a') || args.includes('--all');
  const names = (repo.branches && repo.branches.length > 0 ? repo.branches : [repo.branch]).filter(Boolean);
  let text = names.map((name) => (name === repo.branch ? '* ' : '  ') + name + '\n').join('');
  if (all && repo.remote) {
    text += names.map((name) => '  remotes/origin/' + name + '\n').join('');
  }
  return out(text, '', 0, true);
}

function gitCheckout(repo, args, isSwitch) {
  const create = args.includes('-b') || args.includes('-c') || args.includes('--create');
  const target = args.find((arg) => !arg.startsWith('-'));
  if (!target) {
    return out('', isSwitch ? 'fatal: missing branch or commit argument\n'
      : 'error: you must specify a branch name\n', 128, true);
  }
  repo.branches = repo.branches || [];
  if (create) {
    if (repo.branches.includes(target)) {
      return out('', "fatal: a branch named '" + target + "' already exists\n", 128, true);
    }
    repo.branches.push(target);
    repo.branch = target;
    return out('', "Switched to a new branch '" + target + "'\n", 0, true);
  }
  if (!repo.branches.includes(target)) {
    return out('', "error: pathspec '" + target + "' did not match any file(s) known to git\n", 1, true);
  }
  if (repo.branch === target) {
    return out('', "Already on '" + target + "'\n" +
      (repo.remote ? "Your branch is up to date with 'origin/" + target + "'.\n" : ''), 0, true);
  }
  repo.branch = target;
  return out('', "Switched to branch '" + target + "'\n" +
    (repo.remote ? "Your branch is up to date with 'origin/" + target + "'.\n" : ''), 0, true);
}

function gitRevParse(repo, args) {
  if (args.includes('--abbrev-ref')) {
    return out((repo.branch || 'HEAD') + '\n', '', 0, true);
  }
  if (args.includes('--show-toplevel')) {
    return out('/home/dev/work/' + (repo.slug || '') + '\n', '', 0, true);
  }
  const short = args.includes('--short');
  return out((short ? repo.head : longHash(repo.head)) + '\n', '', 0, true);
}

function gitSymbolicRef(repo, args) {
  if (!repo.branch) {
    return out('', 'fatal: ref HEAD is not a symbolic ref\n', 128, true);
  }
  const short = args.includes('--short');
  return out((short ? repo.branch : 'refs/heads/' + repo.branch) + '\n', '', 0, true);
}

function gitRemote(repo, args) {
  if (!repo.remote) return out('', '', 0, true);
  if (args.includes('-v') || args.includes('--verbose')) {
    return out(
      repo.remote.name + '\t' + repo.remote.url + ' (fetch)\n' +
      repo.remote.name + '\t' + repo.remote.url + ' (push)\n', '', 0, true);
  }
  return out(repo.remote.name + '\n', '', 0, true);
}

function gitDiff(repo, args) {
  const tracked = (repo.changes || []).filter((change) => change.x !== '?');
  if (tracked.length === 0) return out('', '', 0, true);
  if (args.includes('--name-only')) {
    return out(tracked.map((change) => change.path + '\n').join(''), '', 0, true);
  }
  if (args.includes('--stat')) {
    const width = Math.max(...tracked.map((change) => change.path.length));
    let text = tracked.map((change) =>
      ' ' + change.path.padEnd(width) + ' | ' + (3 + change.path.length % 5) + ' +++--\n').join('');
    text += ' ' + tracked.length + ' file' + (tracked.length === 1 ? '' : 's') + ' changed\n';
    return out(text, '', 0, true);
  }
  const text = tracked.map((change) =>
    'diff --git a/' + change.path + ' b/' + change.path + '\n' +
    'index ' + repo.head + '..' + nextHash(repo.head) + ' 100644\n' +
    '--- a/' + change.path + '\n+++ b/' + change.path + '\n' +
    '@@ -1,3 +1,3 @@\n-// before\n+// after\n').join('');
  return out(text, '', 0, true);
}

function gitStash(repo, args) {
  const action = args.find((arg) => !arg.startsWith('-')) || 'push';
  if (action === 'list') {
    return out((repo.stash || []).map((entry, index) =>
      'stash@{' + index + '}: WIP on ' + repo.branch + ': ' + entry + '\n').join(''), '', 0, true);
  }
  if (action === 'pop' || action === 'apply') {
    if (!repo.stash || repo.stash.length === 0) {
      return out('', 'No stash entries found.\n', 1, true);
    }
    repo.stash.pop();
    repo.changes = repo.stashedChanges || repo.changes;
    return out('', '', 0, true);
  }
  if ((repo.changes || []).filter((change) => change.x !== '?').length === 0) {
    return out('No local changes to save\n', '', 0, true);
  }
  repo.stash = repo.stash || [];
  repo.stash.push(repo.head + ' ' + ((repo.commits || [])[0] || { subject: 'work in progress' }).subject);
  repo.stashedChanges = repo.changes;
  repo.changes = (repo.changes || []).filter((change) => change.x === '?');
  return out('Saved working directory and index state WIP on ' + repo.branch + '\n', '', 0, true);
}

function gitAdd(repo, args) {
  const all = args.includes('.') || args.includes('-A') || args.includes('--all') || args.includes('-a');
  repo.changes = (repo.changes || []).map((change) => {
    if (!all && !args.includes(change.path)) return change;
    return { x: change.x === '?' ? 'A' : change.x === ' ' ? change.y : change.x, y: ' ', path: change.path };
  });
  return out('', '', 0, true);
}

function gitCommit(repo, args, meta) {
  const messageIndex = args.findIndex((arg) => arg === '-m');
  const message = messageIndex >= 0 ? args[messageIndex + 1] : 'work in progress';
  const all = args.includes('-a') || args.includes('--all');
  const staged = (repo.changes || []).filter((change) => change.x !== ' ' && change.x !== '?');
  const target = all ? (repo.changes || []).filter((change) => change.x !== '?') : staged;
  if (target.length === 0) {
    return out('On branch ' + repo.branch + '\nnothing to commit, working tree clean\n', '', 1, true);
  }
  repo.head = nextHash(repo.head);
  repo.commits = [{ hash: repo.head, subject: message }].concat(repo.commits || []);
  repo.changes = (repo.changes || []).filter((change) => !target.includes(change));
  if (repo.remote) repo.remote.ahead += 1;
  return out('[' + repo.branch + ' ' + repo.head + '] ' + message + '\n' +
    ' ' + target.length + ' file' + (target.length === 1 ? '' : 's') + ' changed\n', '', 0, true);
}

function gitPush(repo, args) {
  if (!repo.remote) {
    return out('', 'fatal: No configured push destination.\n', 128, true);
  }
  if (repo.remote.behind > 0) {
    return out('', 'To ' + repo.remote.url + '\n' +
      ' ! [rejected]        ' + repo.branch + ' -> ' + repo.branch + ' (fetch first)\n' +
      "error: failed to push some refs to '" + repo.remote.url + "'\n", 1, true);
  }
  if (repo.remote.ahead === 0) {
    return out('', 'Everything up-to-date\n', 0, true);
  }
  const count = repo.remote.ahead;
  repo.remote.ahead = 0;
  return out('', 'To ' + repo.remote.url + '\n' +
    '   ' + repo.head + '..' + nextHash(repo.head) + '  ' + repo.branch + ' -> ' + repo.branch +
    ' (' + count + ' commit' + (count === 1 ? '' : 's') + ')\n', 0, true);
}

function describe(repo) {
  const tag = (repo.tags || [])[0];
  return tag ? tag + '-' + (repo.commits || []).length + '-g' + repo.head : repo.head;
}

function nextHash(hash) {
  let value = Number.parseInt(hash, 16);
  if (!Number.isFinite(value)) value = 0x5eed;
  value = (Math.imul(value ^ 0x9e3779b9, 0x85ebca6b) >>> 0);
  return value.toString(16).padStart(7, '0').slice(0, 7);
}

function longHash(short) {
  let text = short;
  let seed = short;
  while (text.length < 40) {
    seed = nextHash(seed);
    text += seed;
  }
  return text.slice(0, 40);
}
