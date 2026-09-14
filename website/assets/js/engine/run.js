// The orchestration, ported from src/app.rs: from a parsed command line to an
// exit code. The result is returned as ordered steps so the terminal can play
// a run back repository by repository, and as one flat chunk list so the
// parity tests can compare it against the bytes the real binary writes.

import { effectiveGitArgs, parse } from './cli.js';
import { decideColor, decideGlyphs, TARGETS } from './console.js';
import { discover } from './discovery.js';
import { runGit } from './git.js';
import { HELP_TEXT, VERSION_TEXT } from './help.js';
import {
  missingGitMessage,
  missingRepositoryWarning,
  Painter,
  repoHeader,
  summaryBlock,
} from './report.js';

/** The exit codes mgit documents. */
export const EXIT = {
  OK: 0,
  FAILURE: 1,
  USAGE: 2,
  NOT_FOUND: 127,
  INTERRUPTED: 130,
  BROKEN_PIPE: 141,
};

/**
 * Run mgit in the sandbox.
 *
 * @param {object} options
 * @param {import('./fs.js').Filesystem} options.fs
 * @param {string} options.cwd Absolute path of the working directory.
 * @param {string[]} options.argv Arguments after the program name.
 * @param {Record<string, string>} [options.env]
 * @param {object} [options.target] One of console.js TARGETS.
 * @param {boolean} [options.gitAvailable]
 * @param {string} [options.gitProgram]
 * @param {number|null} [options.interruptAfter] Repositories to finish before Ctrl+C.
 */
export function run(options) {
  const {
    fs,
    cwd,
    argv,
    env = {},
    target = TARGETS['unix-tty'],
    gitAvailable = true,
    interruptAfter = null,
  } = options;
  const gitProgram = options.gitProgram || env.MGIT_GIT || 'git';

  /** @type {Step[]} */
  const steps = [];
  const trace = {
    root: cwd,
    depth: 1,
    color: false,
    glyphs: 'unicode',
    discovery: [],
    repositories: [],
    gitRuns: [],
    notes: [],
    aggregation: null,
  };

  const parsed = parse(argv);
  if (!parsed.ok) {
    steps.push({ kind: 'usage', chunks: [{ fd: 2, text: parsed.message }] });
    return finish(steps, EXIT.USAGE, trace, null);
  }
  const args = parsed.args;
  trace.depth = args.depth;
  trace.parsed = args;

  const colorEnabled = decideColor(args.color, env, target);
  const glyphs = decideGlyphs(args.ascii, env, target);
  const painter = new Painter(colorEnabled);
  trace.color = colorEnabled;
  trace.glyphs = glyphs.folder === '' ? 'ascii' : 'unicode';

  if (args.mode === 'help') {
    steps.push({ kind: 'text', chunks: [{ fd: 1, text: HELP_TEXT }] });
    return finish(steps, EXIT.OK, trace, args);
  }
  if (args.mode === 'version') {
    steps.push({ kind: 'text', chunks: [{ fd: 1, text: VERSION_TEXT + '\n' }] });
    return finish(steps, EXIT.OK, trace, args);
  }

  const found = discover(fs, cwd, args.depth);
  trace.discovery = found.trace;
  if (found.error) {
    steps.push({ kind: 'error', chunks: [{ fd: 2, text: 'mgit: ' + found.error + '\n' }] });
    return finish(steps, EXIT.FAILURE, trace, args);
  }
  for (const warning of found.warnings) {
    steps.push({ kind: 'warning', chunks: [{ fd: 2, text: warning }] });
  }
  trace.repositories = found.repositories;

  if (found.repositories.length === 0) {
    return withoutRepositories({ fs, cwd, args, steps, trace, gitAvailable, gitProgram, target });
  }

  if (args.mode === 'list') {
    for (const repository of found.repositories) {
      steps.push({
        kind: 'list',
        repo: repository.name,
        chunks: [{ fd: 1, text: repository.path + '\n' }],
      });
    }
    return finish(steps, EXIT.OK, trace, args);
  }

  return runRepositories({
    fs, cwd, args, steps, trace, painter, glyphs,
    repositories: found.repositories, gitAvailable, gitProgram, target, interruptAfter,
  });
}

/** The directory holds no repository of its own. */
function withoutRepositories(context) {
  const { fs, cwd, args, steps, trace, gitAvailable, gitProgram, target } = context;
  const rootIsRepository = fs.isRepository(cwd);
  trace.rootIsRepository = rootIsRepository;

  if (args.mode === 'list') {
    if (rootIsRepository) {
      steps.push({ kind: 'list', chunks: [{ fd: 1, text: cwd + '\n' }] });
      return finish(steps, EXIT.OK, trace, args);
    }
  } else if (rootIsRepository) {
    // Without subdirectories mgit behaves like plain git.
    const node = fs.repoAt(cwd);
    if (!gitAvailable) {
      steps.push({
        kind: 'error',
        chunks: [{ fd: 2, text: missingGitMessage(gitProgram, target.platform) }],
      });
      return finish(steps, EXIT.NOT_FOUND, trace, args);
    }
    const gitArgs = effectiveGitArgs(args);
    const result = runGit(node.repo, gitArgs, { name: node.name });
    trace.ranHere = true;
    trace.gitRuns.push({ repo: node.name, argv: gitArgs, exitCode: result.exitCode, modelled: result.modelled, note: result.note });
    if (result.note) trace.notes.push(result.note);
    steps.push({ kind: 'git', repo: node.name, chunks: chunksOf(result) });
    return finish(steps, result.exitCode, trace, args);
  }

  steps.push({
    kind: 'warning',
    chunks: [{ fd: 2, text: missingRepositoryWarning(cwd, args.depth) }],
  });
  return finish(steps, args.allowEmpty ? EXIT.OK : EXIT.FAILURE, trace, args);
}

/** Run git in every repository that was found. */
function runRepositories(context) {
  const {
    fs, args, steps, trace, painter, glyphs, repositories,
    gitAvailable, gitProgram, target, interruptAfter,
  } = context;
  const gitArgs = effectiveGitArgs(args);
  trace.gitArgs = gitArgs;

  if (!gitAvailable) {
    steps.push({
      kind: 'error',
      chunks: [{ fd: 2, text: missingGitMessage(gitProgram, target.platform) }],
    });
    return finish(steps, EXIT.NOT_FOUND, trace, args);
  }

  let succeeded = 0;
  /** @type {{name: string, exitCode: number}[]} */
  const failures = [];
  let firstFailure = null;
  let visited = 0;

  for (const repository of repositories) {
    const node = fs.repoAt(repository.path);
    const branch = node && node.repo
      ? (node.repo.branch || node.repo.head || 'detached HEAD')
      : 'detached HEAD';

    /** @type {Chunk[]} */
    const chunks = [];
    if (!args.quiet) {
      chunks.push({ fd: 1, text: repoHeader(repository.name, branch, painter, glyphs) });
    }

    if (interruptAfter !== null && visited >= interruptAfter) {
      steps.push({ kind: 'repo', repo: repository.name, interrupted: true, chunks });
      trace.aggregation = { interrupted: true, succeeded, failures, exitCode: EXIT.INTERRUPTED };
      return finish(steps, EXIT.INTERRUPTED, trace, args);
    }

    const result = runGit(node.repo, gitArgs, { name: repository.name });
    trace.gitRuns.push({
      repo: repository.name,
      argv: gitArgs,
      exitCode: result.exitCode,
      modelled: result.modelled,
      note: result.note,
    });
    if (result.note && !trace.notes.includes(result.note)) trace.notes.push(result.note);
    for (const chunk of chunksOf(result)) chunks.push(chunk);
    chunks.push({ fd: 1, text: '\n' });

    steps.push({
      kind: 'repo',
      repo: repository.name,
      exitCode: result.exitCode,
      modelled: result.modelled,
      chunks,
    });

    visited += 1;
    if (result.exitCode === 0) {
      succeeded += 1;
    } else {
      if (firstFailure === null) firstFailure = result.exitCode;
      failures.push({ name: repository.name, exitCode: result.exitCode });
      if (args.failFast) break;
    }
  }

  const skipped = repositories.length - succeeded - failures.length;
  if (args.summary || failures.length > 0) {
    const block = summaryBlock({ succeeded, skipped, failures }, painter, glyphs);
    steps.push({
      kind: 'summary',
      chunks: [{ fd: args.summary ? 1 : 2, text: block }],
    });
  }
  trace.aggregation = {
    total: repositories.length,
    succeeded,
    skipped,
    failures,
    exitCode: firstFailure === null ? EXIT.OK : firstFailure,
    summaryStream: args.summary ? 'stdout' : (failures.length > 0 ? 'stderr' : 'none'),
  };

  return finish(steps, firstFailure === null ? EXIT.OK : firstFailure, trace, args);
}

function chunksOf(result) {
  /** @type {Chunk[]} */
  const chunks = [];
  if (result.stdout) chunks.push({ fd: 1, text: result.stdout });
  if (result.stderr) chunks.push({ fd: 2, text: result.stderr });
  return chunks;
}

function finish(steps, exitCode, trace, args) {
  /** @type {Chunk[]} */
  const chunks = [];
  for (const step of steps) {
    for (const chunk of step.chunks) chunks.push(chunk);
  }
  return { steps, chunks, exitCode, trace, args };
}

/** The text written to one stream, as a real redirect would capture it. */
export function streamText(chunks, fd) {
  return chunks.filter((chunk) => chunk.fd === fd).map((chunk) => chunk.text).join('');
}

/** Everything the terminal shows, in order, both streams interleaved. */
export function terminalText(chunks) {
  return chunks.map((chunk) => chunk.text).join('');
}

/**
 * @typedef {{fd: 1|2, text: string}} Chunk
 * @typedef {{kind: string, repo?: string, exitCode?: number, interrupted?: boolean, modelled?: boolean, chunks: Chunk[]}} Step
 */
