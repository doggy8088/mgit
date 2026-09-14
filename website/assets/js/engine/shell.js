// A very small shell for the sandbox.
//
// It exists for one reason: several of mgit's promises are only visible from a
// shell. That the summary goes to stderr is something you believe once
// `mgit --summary > status.txt` leaves a clean file behind; that NO_COLOR is
// honoured is something you see once you put it in front of the command. So
// the sandbox understands variable assignments, one redirect per stream, and a
// short list of filters after a pipe. Everything it does not understand it
// says so, rather than pretending.

import { absolute, baseName, dirName, joinPath, repo as makeRepo, dir as makeDir, file as makeFile, shortHash } from './fs.js';
import { run, streamText, EXIT } from './run.js';
import { stripAnsi } from './report.js';
import { TARGETS } from './console.js';
import { VERSION } from './help.js';

/** Variables the sandbox lets you set in front of a command. */
export const KNOWN_VARIABLES = [
  'MGIT_GIT', 'MGIT_COLOR', 'MGIT_ASCII', 'NO_COLOR', 'CLICOLOR', 'CLICOLOR_FORCE',
  'LANG', 'LC_ALL', 'LC_CTYPE',
];

/** The commands the sandbox implements besides mgit. */
export const BUILTINS = [
  'cd', 'ls', 'pwd', 'tree', 'cat', 'echo', 'env', 'export', 'clear', 'help',
  'git', 'mkdir', 'touch', 'which', 'history', 'reset',
];

/** The filters that may follow a pipe. */
export const FILTERS = ['head', 'tail', 'wc', 'grep', 'sort', 'uniq', 'cat'];

/**
 * Split a command line into tokens, honouring single and double quotes.
 * @returns {{ok: true, tokens: string[]}|{ok: false, message: string}}
 */
export function tokenize(line) {
  /** @type {string[]} */
  const tokens = [];
  let current = '';
  let quote = null;
  let started = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (quote) {
      if (character === quote) { quote = null; continue; }
      current += character;
      continue;
    }
    if (character === '"' || character === "'") { quote = character; started = true; continue; }
    if (character === '\\' && index + 1 < line.length) {
      current += line[index + 1];
      index += 1;
      started = true;
      continue;
    }
    if (/\s/.test(character)) {
      if (current.length > 0 || started) { tokens.push(current); current = ''; started = false; }
      continue;
    }
    current += character;
  }
  if (quote) return { ok: false, message: 'sandbox: unbalanced ' + quote + ' quote\n' };
  if (current.length > 0 || started) tokens.push(current);
  return { ok: true, tokens };
}

/**
 * Parse a tokenized line into assignments, a command, redirects and a filter.
 */
export function parseLine(tokens) {
  /** @type {Record<string, string>} */
  const assignments = {};
  /** @type {string[]} */
  const argv = [];
  const redirects = { stdout: null, stderr: null };
  /** @type {{name: string, args: string[]}|null} */
  let filter = null;
  let seenCommand = false;
  let inFilter = false;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (token === '|') {
      const name = tokens[index + 1];
      if (!name) return { ok: false, message: 'sandbox: a pipe needs a command after it\n' };
      filter = { name, args: tokens.slice(index + 2) };
      inFilter = true;
      break;
    }

    if (!seenCommand && /^[A-Za-z_][A-Za-z0-9_]*=/.test(token)) {
      const split = token.indexOf('=');
      assignments[token.slice(0, split)] = token.slice(split + 1);
      continue;
    }

    const redirect = matchRedirect(token, tokens, index);
    if (redirect) {
      if (!redirect.ok) return redirect;
      redirects[redirect.stream] = redirect.value;
      index += redirect.consumed;
      continue;
    }

    argv.push(token);
    seenCommand = true;
  }

  return { ok: true, assignments, argv, redirects, filter, inFilter };
}

function matchRedirect(token, tokens, index) {
  const patterns = [
    { prefix: '2>>', stream: 'stderr', append: true },
    { prefix: '2>', stream: 'stderr', append: false },
    { prefix: '>>', stream: 'stdout', append: true },
    { prefix: '>', stream: 'stdout', append: false },
  ];
  if (token === '2>&1') {
    return { ok: true, stream: 'stderr', value: { merge: true }, consumed: 0 };
  }
  for (const pattern of patterns) {
    if (!token.startsWith(pattern.prefix)) continue;
    const inline = token.slice(pattern.prefix.length);
    if (inline.length > 0) {
      return { ok: true, stream: pattern.stream, value: { path: inline, append: pattern.append }, consumed: 0 };
    }
    const next = tokens[index + 1];
    if (!next) return { ok: false, message: 'sandbox: ' + pattern.prefix + ' needs a file name\n' };
    return { ok: true, stream: pattern.stream, value: { path: next, append: pattern.append }, consumed: 1 };
  }
  return null;
}

/**
 * One sandbox session: a filesystem, a working directory, exported variables
 * and the output target.
 */
export class Session {
  constructor({ fs, cwd, env = {}, target = TARGETS['unix-tty'], gitAvailable = true }) {
    this.fs = fs;
    this.cwd = cwd;
    this.env = { ...env };
    this.target = target;
    this.gitAvailable = gitAvailable;
    this.lastExit = 0;
    /** @type {string[]} */
    this.history = [];
  }

  /**
   * Execute one line.
   * @returns {{lines: OutputLine[], exitCode: number, run?: object, cleared?: boolean, notes: string[]}}
   */
  execute(line) {
    const trimmed = line.trim();
    if (trimmed.length === 0) return { lines: [], exitCode: this.lastExit, notes: [] };
    this.history.push(trimmed);

    const tokenized = tokenize(trimmed);
    if (!tokenized.ok) return this.fail(tokenized.message);

    const parsed = parseLine(tokenized.tokens);
    if (!parsed.ok) return this.fail(parsed.message);

    const { assignments, argv, redirects, filter } = parsed;
    if (argv.length === 0) {
      // A bare assignment exports the variable for the rest of the session.
      Object.assign(this.env, assignments);
      return { lines: [], exitCode: 0, notes: [] };
    }

    const env = { ...this.env, ...assignments };
    const command = argv[0];
    const args = argv.slice(1);

    const result = command === 'mgit'
      ? this.runMgit(args, env)
      : this.runBuiltin(command, args, env);

    return this.deliver(result, redirects, filter);
  }

  /**
   * Re-run the line that is currently playing back, with Ctrl+C applied after
   * `interruptAfter` repositories. The caller restores the filesystem to the
   * state the run started from first, so the result is the run that would have
   * happened, not a second run on top of the first.
   *
   * @returns {{lines: OutputLine[], exitCode: number, run: object, notes: string[], animatable: false}|null}
   */
  executeInterrupted(line, interruptAfter) {
    const tokenized = tokenize(line);
    if (!tokenized.ok) return null;
    const parsed = parseLine(tokenized.tokens);
    if (!parsed.ok || parsed.argv[0] !== 'mgit') return null;

    const env = { ...this.env, ...parsed.assignments };
    const outcome = run({
      fs: this.fs,
      cwd: this.cwd,
      argv: parsed.argv.slice(1),
      env,
      target: this.target,
      gitAvailable: this.gitAvailable,
      interruptAfter,
    });
    this.lastExit = outcome.exitCode;
    return {
      lines: outcome.chunks,
      exitCode: outcome.exitCode,
      run: outcome,
      notes: [],
      animatable: false,
    };
  }

  runMgit(args, env) {
    const outcome = run({
      fs: this.fs,
      cwd: this.cwd,
      argv: args,
      env,
      target: this.target,
      gitAvailable: this.gitAvailable,
    });
    return {
      chunks: outcome.chunks,
      exitCode: outcome.exitCode,
      run: outcome,
      notes: outcome.trace.notes.map((command) => ({ kind: 'unmodelled', command })),
    };
  }

  runBuiltin(command, args, env) {
    switch (command) {
      case 'cd': return this.builtinCd(args);
      case 'pwd': return text(this.cwd + '\n');
      case 'ls': return this.builtinLs(args);
      case 'tree': return this.builtinTree(args);
      case 'cat': return this.builtinCat(args);
      case 'echo': return text(args.join(' ') + '\n');
      case 'env': return text(Object.entries(this.env).map(([key, value]) => key + '=' + value + '\n').join(''));
      case 'export': return this.builtinExport(args);
      case 'clear': return { chunks: [], exitCode: 0, cleared: true, notes: [] };
      case 'reset': return { chunks: [], exitCode: 0, reset: true, notes: [] };
      case 'help': return text(helpText());
      case 'history': return text(this.history.map((entry, index) => String(index + 1).padStart(4) + '  ' + entry + '\n').join(''));
      case 'git': return this.builtinGit(args, env);
      case 'mkdir': return this.builtinMkdir(args);
      case 'touch': return this.builtinTouch(args);
      case 'which': return this.builtinWhich(args);
      default:
        return {
          chunks: [{ fd: 2, text: 'sandbox: ' + command + ': command not found\n' }],
          exitCode: 127,
          notes: [{ kind: 'unknown-command', commands: BUILTINS.join(', ') }],
        };
    }
  }

  builtinCd(args) {
    const target = args[0] ? absolute(this.cwd, args[0]) : '/home/dev/work';
    const found = this.fs.lookup(target);
    if (!found) return err('cd: ' + (args[0] || target) + ': No such file or directory\n', 1);
    if (found.node.kind !== 'dir') return err('cd: ' + args[0] + ': Not a directory\n', 1);
    this.cwd = target;
    return { chunks: [], exitCode: 0, notes: [] };
  }

  builtinLs(args) {
    const paths = args.filter((arg) => !arg.startsWith('-'));
    const target = absolute(this.cwd, paths[0] || '.');
    const listing = this.fs.readDir(target);
    if (!listing.ok) {
      const single = this.fs.lookup(target);
      if (single && single.node.kind !== 'dir') return text(paths[0] + '\n');
      return err('ls: ' + (paths[0] || target) + ': No such file or directory\n', 1);
    }
    const long = args.some((arg) => arg.startsWith('-') && arg.includes('l'));
    const rows = listing.entries.map((entry) => {
      const node = this.fs.lookupNoFollow(entry.path);
      const isRepo = this.fs.isRepository(entry.path);
      const kind = node && node.node.kind === 'link'
        ? 'link'
        : node && node.node.kind === 'file' ? 'file' : 'dir';
      const name = entry.name + (kind === 'dir' ? '/' : '');
      if (!long) return name;
      const marker = isRepo
        ? (this.fs.lookup(entry.path).node.repo.dotGitIsFile ? '.git file ' : '.git dir  ')
        : '          ';
      const link = kind === 'link' ? ' -> ' + node.node.target : '';
      return marker + name + link;
    });
    return text(rows.length > 0 ? rows.join('\n') + '\n' : '');
  }

  builtinTree(args) {
    let limit = 2;
    const levelIndex = args.indexOf('-L');
    if (levelIndex >= 0) {
      const value = Number.parseInt(args[levelIndex + 1], 10);
      if (Number.isFinite(value)) limit = value;
    }
    const lines = [this.cwd];
    const walk = (path, prefix, level) => {
      const listing = this.fs.readDir(path);
      if (!listing.ok) return;
      listing.entries.forEach((entry, index) => {
        const last = index === listing.entries.length - 1;
        const node = this.fs.lookupNoFollow(entry.path);
        const isRepo = this.fs.isRepository(entry.path);
        const tag = isRepo
          ? '  [' + (this.fs.lookup(entry.path).node.repo.dotGitIsFile ? '.git file' : '.git') + ' · ' +
            (this.fs.lookup(entry.path).node.repo.branch || 'detached') + ']'
          : node && node.node.kind === 'link' ? '  -> ' + node.node.target : '';
        lines.push(prefix + (last ? '`-- ' : '|-- ') + entry.name + tag);
        if (!isRepo && level < limit && node && node.node.kind === 'dir') {
          walk(entry.path, prefix + (last ? '    ' : '|   '), level + 1);
        }
      });
    };
    walk(this.cwd, '', 1);
    return text(lines.join('\n') + '\n');
  }

  builtinCat(args) {
    if (args.length === 0) return err('cat: a file name is required\n', 1);
    const target = absolute(this.cwd, args[0]);
    const found = this.fs.lookup(target);
    if (!found) return err('cat: ' + args[0] + ': No such file or directory\n', 1);
    if (found.node.kind === 'dir') return err('cat: ' + args[0] + ': Is a directory\n', 1);
    return text(found.node.content || '');
  }

  builtinExport(args) {
    for (const arg of args) {
      const split = arg.indexOf('=');
      if (split > 0) this.env[arg.slice(0, split)] = arg.slice(split + 1);
    }
    return { chunks: [], exitCode: 0, notes: [] };
  }

  builtinGit(args, env) {
    const node = this.fs.repoAt(this.cwd);
    if (args[0] === 'init') {
      return this.builtinGitInit(args.slice(1));
    }
    if (!node) {
      return err('fatal: not a git repository (or any of the parent directories): .git\n', 128);
    }
    const { runGit } = gitModule;
    const result = runGit(node.repo, args, { name: node.name });
    const chunks = [];
    if (result.stdout) chunks.push({ fd: 1, text: result.stdout });
    if (result.stderr) chunks.push({ fd: 2, text: result.stderr });
    return {
      chunks,
      exitCode: result.exitCode,
      notes: result.note ? [{ kind: 'unmodelled', command: result.note }] : [],
    };
  }

  builtinGitInit(args) {
    const name = args.find((arg) => !arg.startsWith('-')) || '.';
    const target = absolute(this.cwd, name);
    const parent = this.fs.lookup(dirName(target));
    if (!parent || parent.node.kind !== 'dir') {
      return err('fatal: cannot mkdir ' + name + ': No such file or directory\n', 128);
    }
    const existing = parent.node.children.find((child) => child.name === baseName(target));
    if (existing && existing.repo) {
      return text('Reinitialized existing Git repository in ' + target + '/.git/\n');
    }
    if (existing) {
      existing.repo = makeRepo(existing.name).repo;
    } else {
      parent.node.children.push(makeRepo(baseName(target), { commits: [] }));
    }
    return text('Initialized empty Git repository in ' + target + '/.git/\n');
  }

  builtinMkdir(args) {
    const names = args.filter((arg) => !arg.startsWith('-'));
    if (names.length === 0) return err('mkdir: a directory name is required\n', 1);
    for (const name of names) {
      const target = absolute(this.cwd, name);
      const parent = this.fs.lookup(dirName(target));
      if (!parent || parent.node.kind !== 'dir') {
        return err('mkdir: ' + name + ': No such file or directory\n', 1);
      }
      if (parent.node.children.some((child) => child.name === baseName(target))) {
        return err('mkdir: ' + name + ': File exists\n', 1);
      }
      parent.node.children.push(makeDir(baseName(target)));
    }
    return { chunks: [], exitCode: 0, notes: [] };
  }

  builtinTouch(args) {
    for (const name of args) {
      this.writeFile(absolute(this.cwd, name), '', false);
    }
    return { chunks: [], exitCode: 0, notes: [] };
  }

  builtinWhich(args) {
    if (args[0] === 'mgit') return text('/usr/local/bin/mgit\n');
    if (args[0] === 'git') {
      return this.gitAvailable ? text('/usr/bin/git\n') : { chunks: [], exitCode: 1, notes: [] };
    }
    return { chunks: [], exitCode: 1, notes: [] };
  }

  /** Write a virtual file, so a redirect can be read back with `cat`. */
  writeFile(path, content, append) {
    const parent = this.fs.lookup(dirName(path));
    if (!parent || parent.node.kind !== 'dir') return false;
    const name = baseName(path);
    let node = parent.node.children.find((child) => child.name === name);
    if (!node) {
      node = makeFile(name);
      parent.node.children.push(node);
    }
    node.content = append ? (node.content || '') + content : content;
    return true;
  }

  fail(message) {
    this.lastExit = 2;
    return { lines: [{ fd: 2, text: message }], exitCode: 2, notes: [] };
  }

  /** Apply redirects and filters, and turn chunks into displayable lines. */
  deliver(result, redirects, filter) {
    let chunks = result.chunks.slice();
    const notes = (result.notes || []).slice();

    if (redirects.stderr && redirects.stderr.merge) {
      chunks = chunks.map((chunk) => ({ fd: 1, text: chunk.text }));
    }

    for (const stream of ['stdout', 'stderr']) {
      const redirect = redirects[stream];
      if (!redirect || redirect.merge) continue;
      const fd = stream === 'stdout' ? 1 : 2;
      const captured = stripAnsi(chunks.filter((chunk) => chunk.fd === fd).map((chunk) => chunk.text).join(''));
      chunks = chunks.filter((chunk) => chunk.fd !== fd);
      if (redirect.path === '/dev/null') continue;
      const path = absolute(this.cwd, redirect.path);
      if (!this.writeFile(path, captured, redirect.append)) {
        chunks.push({ fd: 2, text: 'sandbox: cannot write ' + redirect.path + '\n' });
      } else {
        notes.push({
          kind: 'redirect',
          stream: fd === 1 ? 'stdout' : 'stderr',
          path: redirect.path,
          lines: captured.split('\n').length - (captured.endsWith('\n') ? 1 : 0),
        });
      }
    }

    let exitCode = result.exitCode;
    if (filter) {
      const applied = applyFilter(filter, chunks);
      if (!applied.ok) {
        chunks.push({ fd: 2, text: applied.message });
        exitCode = 127;
      } else {
        chunks = applied.chunks;
        if (applied.note) notes.push(applied.note);
        exitCode = applied.exitCode;
      }
    }

    this.lastExit = exitCode;
    return {
      lines: chunks,
      exitCode,
      run: result.run,
      cleared: result.cleared,
      reset: result.reset,
      notes,
      // A run can only be played back repository by repository while nothing
      // has rearranged its output behind the scenes.
      animatable: !filter && !redirects.stdout && !redirects.stderr,
    };
  }
}

/** Run a filter over the standard output of a command, leaving stderr alone. */
export function applyFilter(filter, chunks) {
  if (!FILTERS.includes(filter.name)) {
    return { ok: false, message: 'sandbox: ' + filter.name + ': not one of the filters this sandbox knows (' + FILTERS.join(', ') + ')\n' };
  }
  const stdout = chunks.filter((chunk) => chunk.fd === 1).map((chunk) => chunk.text).join('');
  const passthrough = chunks.filter((chunk) => chunk.fd === 2);
  const lines = stdout.length === 0 ? [] : stdout.replace(/\n$/, '').split('\n');
  let result = lines;
  let note;

  switch (filter.name) {
    case 'head': {
      const count = numberArgument(filter.args, 10);
      result = lines.slice(0, count);
      if (lines.length > count) note = { kind: 'sigpipe', count };
      break;
    }
    case 'tail': result = lines.slice(-numberArgument(filter.args, 10)); break;
    case 'wc': result = [String(lines.length)]; break;
    case 'sort': result = lines.slice().sort(); break;
    case 'uniq': result = lines.filter((line, index) => index === 0 || line !== lines[index - 1]); break;
    case 'cat': break;
    case 'grep': {
      const pattern = filter.args.find((arg) => !arg.startsWith('-'));
      if (!pattern) return { ok: false, message: 'usage: grep <pattern>\n' };
      const invert = filter.args.includes('-v');
      const plain = stripAnsi(stdout).replace(/\n$/, '').split('\n');
      result = plain.filter((line) => line.includes(pattern) !== invert);
      break;
    }
    default: break;
  }

  const text = result.length > 0 ? result.join('\n') + '\n' : '';
  return {
    ok: true,
    chunks: (text ? [{ fd: 1, text }] : []).concat(passthrough),
    exitCode: 0,
    note,
  };
}

function numberArgument(args, fallback) {
  const flagIndex = args.indexOf('-n');
  if (flagIndex >= 0) {
    const value = Number.parseInt(args[flagIndex + 1], 10);
    if (Number.isFinite(value)) return value;
  }
  const short = args.find((arg) => /^-[0-9]+$/.test(arg));
  if (short) return Number.parseInt(short.slice(1), 10);
  return fallback;
}

function text(value) {
  return { chunks: value ? [{ fd: 1, text: value }] : [], exitCode: 0, notes: [] };
}

function err(message, exitCode) {
  return { chunks: [{ fd: 2, text: message }], exitCode, notes: [] };
}

function helpText() {
  return [
    'mgit sandbox ' + VERSION + ' — everything runs in this browser tab.',
    '',
    'mgit [OPTIONS] [--] [GIT_ARGS...]   the real argument parser, ported from the Rust source',
    '',
    'Also available:',
    '  cd DIR        move the working directory (this is the directory mgit searches)',
    '  ls [-l]       list entries; -l marks which of them hold a .git',
    '  tree [-L N]   show the workspace, with the branch of every repository',
    '  cat FILE      read a file back, for example one you redirected output into',
    '  git ...       run the sandbox git in the current directory',
    '  mkdir, touch, git init, echo, env, export, which, history, clear, reset, help',
    '',
    'Shell features: VAR=value in front of a command, > file, >> file, 2> file,',
    '2>/dev/null, 2>&1, and a pipe into ' + FILTERS.join(', ') + '.',
    '',
  ].join('\n') + '\n';
}

// Imported lazily so the module graph stays acyclic for the bundlers people
// might drop this into.
import * as gitModule from './git.js';

/** @typedef {{fd: 1|2, text: string}} OutputLine */
export { EXIT, streamText };
