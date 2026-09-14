// Unit tests for the parts of the sandbox that the parity test cannot reach:
// the shell around mgit, the interrupt, the missing git executable, and the
// parsing corners that have no observable output of their own.

import test from 'node:test';
import assert from 'node:assert/strict';

import { parse, effectiveGitArgs } from '../assets/js/engine/cli.js';
import { decideColor, decideGlyphs, flag, TARGETS } from '../assets/js/engine/console.js';
import { discover } from '../assets/js/engine/discovery.js';
import { dir, file, link, repo, workspace } from '../assets/js/engine/fs.js';
import { runGit } from '../assets/js/engine/git.js';
import { ASCII_GLYPHS, stripAnsi, UNICODE_GLYPHS } from '../assets/js/engine/report.js';
import { EXIT, run, streamText, terminalText } from '../assets/js/engine/run.js';
import { Session, applyFilter, parseLine, tokenize } from '../assets/js/engine/shell.js';

const ROOT = '/home/dev/work';

function sandbox(nodes) {
  return workspace(nodes);
}

test('parsing', async (t) => {
  await t.test('an option value can be attached or separate', () => {
    assert.equal(parse(['-d2']).args.depth, 2);
    assert.equal(parse(['-d', '2']).args.depth, 2);
    assert.equal(parse(['--depth=3']).args.depth, 3);
    assert.equal(parse(['--depth', '3']).args.depth, 3);
  });

  await t.test('help wins over version, whatever the order', () => {
    assert.equal(parse(['--version', '--help']).args.mode, 'help');
    assert.equal(parse(['--help', '--version']).args.mode, 'help');
  });

  await t.test('a single dash is an argument for git, not an option', () => {
    assert.deepEqual(parse(['-']).args.gitArgs, ['-']);
  });

  await t.test('an unknown option hands over the rest of the line', () => {
    assert.deepEqual(parse(['-c', 'core.pager=cat', 'status']).args.gitArgs,
      ['-c', 'core.pager=cat', 'status']);
    assert.deepEqual(parse(['--git-dir=/tmp/x', 'log']).args.gitArgs, ['--git-dir=/tmp/x', 'log']);
  });

  await t.test('mgit options after the git command belong to git', () => {
    assert.deepEqual(parse(['log', '--quiet']).args.gitArgs, ['log', '--quiet']);
    assert.equal(parse(['log', '--quiet']).args.quiet, false);
  });

  await t.test('a bare -- forwards even an option mgit owns', () => {
    const parsed = parse(['--', '--version']);
    assert.equal(parsed.args.mode, 'run');
    assert.deepEqual(parsed.args.gitArgs, ['--version']);
  });

  await t.test('--keep-going undoes an earlier --fail-fast', () => {
    assert.equal(parse(['--fail-fast', '--keep-going']).args.failFast, false);
    assert.equal(parse(['--keep-going', '--fail-fast']).args.failFast, true);
  });

  await t.test('a depth that is not a positive integer is rejected', () => {
    for (const value of ['0', '-1', 'two', '1.5', '', ' 2']) {
      const parsed = parse(['--depth', value]);
      assert.equal(parsed.ok, false, 'depth ' + JSON.stringify(value) + ' must be rejected');
      assert.match(parsed.message, /expected a positive integer/);
    }
  });

  await t.test('no git arguments means git status -s', () => {
    assert.deepEqual(effectiveGitArgs(parse([]).args), ['status', '-s']);
    assert.deepEqual(effectiveGitArgs(parse(['log']).args), ['log']);
  });
});

test('the colour and glyph policies', async (t) => {
  const tty = TARGETS['unix-tty'];
  const piped = TARGETS.pipe;

  await t.test('the command line beats everything', () => {
    assert.equal(decideColor('always', { NO_COLOR: '1' }, piped), true);
    assert.equal(decideColor('never', { CLICOLOR_FORCE: '1' }, tty), false);
  });

  await t.test('the documented precedence holds', () => {
    assert.equal(decideColor('auto', { MGIT_COLOR: 'always', NO_COLOR: '1' }, piped), true);
    assert.equal(decideColor('auto', { CLICOLOR_FORCE: '1', NO_COLOR: '1' }, piped), true);
    assert.equal(decideColor('auto', { NO_COLOR: '1' }, tty), false);
    assert.equal(decideColor('auto', { CLICOLOR: '0' }, tty), false);
    assert.equal(decideColor('auto', {}, tty), true);
    assert.equal(decideColor('auto', {}, piped), false);
  });

  await t.test('an empty NO_COLOR does not disable colour', () => {
    assert.equal(flag(''), false);
    assert.equal(decideColor('auto', { NO_COLOR: '' }, tty), true);
  });

  await t.test('a console that cannot decode UTF-8 gets ASCII', () => {
    assert.equal(decideGlyphs('auto', {}, TARGETS['windows-legacy']), ASCII_GLYPHS);
    assert.equal(decideGlyphs('auto', {}, TARGETS['windows-terminal']), UNICODE_GLYPHS);
    assert.equal(decideGlyphs('auto', { LC_ALL: 'C' }, tty), ASCII_GLYPHS);
    assert.equal(decideGlyphs('auto', { LC_ALL: 'C', MGIT_ASCII: '0' }, tty), UNICODE_GLYPHS);
    assert.equal(decideGlyphs('auto', { LANG: 'zh_TW.UTF-8' }, tty), UNICODE_GLYPHS);
  });
});

test('discovery', async (t) => {
  await t.test('a repository is never descended into', () => {
    const fs = sandbox([repo('outer', {}, { children: [repo('inner')] })]);
    const found = discover(fs, ROOT, 5);
    assert.deepEqual(found.repositories.map((entry) => entry.name), ['outer']);
  });

  await t.test('both names of a linked repository are reported', () => {
    const fs = sandbox([repo('api-gateway'), link('gateway', ROOT + '/api-gateway')]);
    const found = discover(fs, ROOT, 1);
    assert.deepEqual(found.repositories.map((entry) => entry.name), ['api-gateway', 'gateway']);
  });

  await t.test('a link loop terminates', () => {
    const fs = sandbox([dir('a', [link('back', ROOT)])]);
    const found = discover(fs, ROOT, 9);
    assert.deepEqual(found.repositories, []);
  });

  await t.test('the order folds case and is stable', () => {
    const fs = sandbox([repo('Zulu'), repo('alpha'), repo('Beta'), repo('apex')]);
    const found = discover(fs, ROOT, 1);
    assert.deepEqual(found.repositories.map((entry) => entry.name), ['alpha', 'apex', 'Beta', 'Zulu']);
  });

  await t.test('a directory that cannot be read warns and the walk continues', () => {
    const fs = sandbox([
      dir('locked', [], { unreadable: 'Permission denied (os error 13)' }),
      repo('readable'),
    ]);
    const found = discover(fs, ROOT, 2);
    assert.deepEqual(found.repositories.map((entry) => entry.name), ['readable']);
    assert.match(found.warnings[0], /cannot read `\/home\/dev\/work\/locked`: Permission denied/);
  });

  await t.test('depth counts levels below the working directory', () => {
    const fs = sandbox([dir('one', [dir('two', [repo('deep')])])]);
    assert.equal(discover(fs, ROOT, 2).repositories.length, 0);
    assert.equal(discover(fs, ROOT, 3).repositories.length, 1);
  });
});

test('running', async (t) => {
  const mixed = () => sandbox([
    repo('api-gateway'),
    repo('web-console', { changes: [{ x: ' ', y: 'M', path: 'src/main.rs' }], pullFails: 'dirty-rebase' }),
    repo('zeta'),
  ]);

  await t.test('the exit code is the first failure, and the run keeps going', () => {
    const result = run({ fs: mixed(), cwd: ROOT, argv: ['pull'], target: TARGETS.pipe });
    assert.equal(result.exitCode, 128);
    assert.equal(result.trace.aggregation.succeeded, 2);
    assert.equal(result.trace.aggregation.failures.length, 1);
  });

  await t.test('--fail-fast stops and counts the rest as skipped', () => {
    const result = run({ fs: mixed(), cwd: ROOT, argv: ['--fail-fast', '--summary', 'pull'], target: TARGETS.pipe });
    assert.equal(result.trace.aggregation.skipped, 1);
    assert.match(streamText(result.chunks, 1), /3 repositories, 1 succeeded, 1 failed, 1 skipped/);
  });

  await t.test('the summary goes to stderr unless --summary asks for it', () => {
    const failing = run({ fs: mixed(), cwd: ROOT, argv: ['pull'], target: TARGETS.pipe });
    assert.match(streamText(failing.chunks, 2), /mgit: 3 repositories/);
    assert.doesNotMatch(streamText(failing.chunks, 1), /mgit: 3 repositories/);

    const asked = run({ fs: mixed(), cwd: ROOT, argv: ['--summary'], target: TARGETS.pipe });
    assert.match(streamText(asked.chunks, 1), /mgit: 3 repositories, 3 succeeded/);
    assert.equal(streamText(asked.chunks, 2), '');
  });

  await t.test('Ctrl+C stops at once and reports 130', () => {
    const result = run({ fs: mixed(), cwd: ROOT, argv: ['pull'], target: TARGETS.pipe, interruptAfter: 1 });
    assert.equal(result.exitCode, EXIT.INTERRUPTED);
    assert.equal(result.trace.aggregation.interrupted, true);
    assert.doesNotMatch(terminalText(result.chunks), /mgit: \d+ repositories/);
  });

  await t.test('a missing git executable is 127, with an install hint', () => {
    const result = run({ fs: mixed(), cwd: ROOT, argv: [], gitAvailable: false, target: TARGETS.pipe });
    assert.equal(result.exitCode, EXIT.NOT_FOUND);
    assert.match(streamText(result.chunks, 2), /cannot run `git`: git was not found/);
  });

  await t.test('an empty directory warns, and --allow-empty forgives it', () => {
    const empty = () => sandbox([dir('notes'), file('TODO.md')]);
    const plain = run({ fs: empty(), cwd: ROOT, argv: [], target: TARGETS.pipe });
    assert.equal(plain.exitCode, EXIT.FAILURE);
    assert.match(streamText(plain.chunks, 2), /no Git repository found in `\/home\/dev\/work` \(searched 1 level\)/);
    assert.equal(run({ fs: empty(), cwd: ROOT, argv: ['--allow-empty'], target: TARGETS.pipe }).exitCode, EXIT.OK);
  });

  await t.test('inside a repository with no children, mgit behaves like git', () => {
    const fs = sandbox([]);
    fs.lookup(ROOT).node.repo = repo('work', { changes: [{ x: ' ', y: 'M', path: 'src/lib.rs' }] }).repo;
    const result = run({ fs, cwd: ROOT, argv: [], target: TARGETS.pipe });
    assert.equal(terminalText(result.chunks), ' M src/lib.rs\n');
    assert.equal(result.exitCode, 0);
    assert.equal(result.trace.ranHere, true);
  });

  await t.test('--quiet drops the header but keeps the blank line between repositories', () => {
    const result = run({ fs: mixed(), cwd: ROOT, argv: ['--quiet'], target: TARGETS.pipe });
    assert.equal(streamText(result.chunks, 1), '\n M src/main.rs\n\n\n');
  });

  await t.test('a command mgit does not know is still handed to git', () => {
    const result = run({ fs: mixed(), cwd: ROOT, argv: ['--nonsense'], target: TARGETS.pipe });
    assert.equal(result.exitCode, 129);
    assert.match(streamText(result.chunks, 2), /unknown option: --nonsense/);
  });
});

test('the sandbox git', async (t) => {
  await t.test('pull is refused while a rebase would lose unstaged work', () => {
    const state = repo('web-console', {
      changes: [{ x: ' ', y: 'M', path: 'src/main.rs' }],
      pullFails: 'dirty-rebase',
    }).repo;
    const result = runGit(state, ['pull']);
    assert.equal(result.exitCode, 128);
    assert.match(result.stderr, /cannot pull with rebase/);
  });

  await t.test('a successful pull moves the branch and clears the backlog', () => {
    const state = repo('api-gateway', { remote: { name: 'origin', url: 'u', behind: 2, ahead: 0 } }).repo;
    const before = state.head;
    const result = runGit(state, ['pull']);
    assert.equal(result.exitCode, 0);
    assert.equal(state.remote.behind, 0);
    assert.notEqual(state.head, before);
    assert.match(result.stdout, /Fast-forward/);
    assert.match(runGit(state, ['pull']).stdout, /Already up to date/);
  });

  await t.test('checkout changes the branch, and refuses one that does not exist', () => {
    const state = repo('api-gateway', { branches: ['main', 'develop'] }).repo;
    assert.equal(runGit(state, ['checkout', 'develop']).exitCode, 0);
    assert.equal(state.branch, 'develop');
    const missing = runGit(state, ['checkout', 'nope']);
    assert.equal(missing.exitCode, 1);
    assert.match(missing.stderr, /did not match any file/);
  });

  await t.test('a git command the sandbox does not model says so instead of inventing output', () => {
    const result = runGit(repo('api-gateway').repo, ['bisect', 'start']);
    assert.equal(result.modelled, false);
    assert.equal(result.stdout, '');
    assert.equal(result.note, 'git bisect');
  });

  await t.test('a word that is not a git command fails the way git fails', () => {
    const result = runGit(repo('x').repo, ['frobnicate']);
    assert.equal(result.exitCode, 1);
    assert.match(result.stderr, /is not a git command/);
  });
});

test('the sandbox shell', async (t) => {
  const session = () => new Session({
    fs: sandbox([
      repo('api-gateway'),
      repo('web-console', { changes: [{ x: ' ', y: 'M', path: 'src/main.rs' }] }),
      dir('vendor', [repo('legacy-auth')]),
    ]),
    cwd: ROOT,
    target: TARGETS['unix-tty'],
  });

  await t.test('quotes hold a token together', () => {
    assert.deepEqual(tokenize('mgit log --format="one two"').tokens,
      ['mgit', 'log', '--format=one two']);
    assert.equal(tokenize("mgit 'unbalanced").ok, false);
  });

  await t.test('assignments in front of a command only apply to it', () => {
    const parsed = parseLine(['NO_COLOR=1', 'mgit', '--list']);
    assert.deepEqual(parsed.assignments, { NO_COLOR: '1' });
    assert.deepEqual(parsed.argv, ['mgit', '--list']);
  });

  await t.test('a redirect captures one stream and leaves the other on screen', () => {
    const shell = session();
    const result = shell.execute('mgit pull > out.txt');
    assert.equal(result.lines.filter((line) => line.fd === 1).length, 0);
    assert.equal(result.notes[0].kind, 'redirect');
    assert.equal(result.notes[0].stream, 'stdout');
    assert.equal(result.notes[0].path, 'out.txt');
    const back = shell.execute('cat out.txt');
    assert.match(back.lines[0].text, /Folder: api-gateway/);
  });

  await t.test('2>/dev/null throws the diagnostics away', () => {
    const shell = new Session({ fs: sandbox([dir('notes')]), cwd: ROOT });
    const result = shell.execute('mgit 2>/dev/null');
    assert.equal(result.lines.length, 0);
    assert.equal(result.exitCode, 1);
  });

  await t.test('2>&1 merges the streams', () => {
    const shell = new Session({ fs: sandbox([dir('notes')]), cwd: ROOT });
    const result = shell.execute('mgit 2>&1');
    assert.equal(result.lines.every((line) => line.fd === 1), true);
  });

  await t.test('head closing the pipe is reported, so SIGPIPE can be explained', () => {
    const shell = session();
    const result = shell.execute('mgit --list | head -n 1');
    assert.equal(result.lines.map((line) => line.text).join(''), '/home/dev/work/api-gateway\n');
    // Notes are data: the page decides what sentence to show for them.
    assert.deepEqual(result.notes, [{ kind: 'sigpipe', count: 1 }]);
  });

  await t.test('cd moves the directory mgit searches', () => {
    const shell = session();
    shell.execute('cd vendor');
    const result = shell.execute('mgit --list');
    assert.equal(result.lines[0].text, '/home/dev/work/vendor/legacy-auth\n');
  });

  await t.test('an unknown command is reported, not ignored', () => {
    const result = session().execute('kubectl get pods');
    assert.equal(result.exitCode, 127);
    assert.match(result.lines[0].text, /command not found/);
  });

  await t.test('a filter the sandbox does not have is named, not faked', () => {
    const applied = applyFilter({ name: 'awk', args: [] }, [{ fd: 1, text: 'x\n' }]);
    assert.equal(applied.ok, false);
    assert.match(applied.message, /not one of the filters/);
  });

  await t.test('git init makes a directory discoverable', () => {
    const shell = new Session({ fs: sandbox([dir('fresh')]), cwd: ROOT });
    assert.equal(shell.execute('mgit --list').exitCode, 1);
    shell.execute('git init fresh');
    const result = shell.execute('mgit --list');
    assert.equal(result.exitCode, 0);
    assert.equal(result.lines[0].text, '/home/dev/work/fresh\n');
  });
});

test('stripAnsi removes every escape sequence', () => {
  const escape = String.fromCharCode(27);
  const coloured = run({
    fs: sandbox([repo('api-gateway')]),
    cwd: ROOT,
    argv: ['--color=always'],
    target: TARGETS.pipe,
  });
  const text = terminalText(coloured.chunks);
  assert.ok(text.includes(escape + '[0;36m'), 'the colour escape has to be there to begin with');
  assert.ok(!stripAnsi(text).includes(escape), 'no escape may survive stripAnsi');
});
