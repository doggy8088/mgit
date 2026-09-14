// Command line parsing, ported from src/cli.rs.
//
// Every rule here mirrors the Rust implementation: parsing stops at the first
// argument that is not one of mgit's own options (or at a bare `--`), and
// everything from that point on is forwarded to git untouched. The parity
// tests in website/tests/parity.test.mjs run the real binary against this port.

export const PROGRAM = 'mgit';
export const DEFAULT_DEPTH = 1;

/** @typedef {'auto'|'always'|'never'} ColorChoice */
/** @typedef {'auto'|'always'|'never'} AsciiChoice */
/** @typedef {'help'|'version'|'list'|'run'} Mode */

/** The default git command line when the user supplies none. */
export const DEFAULT_GIT_ARGS = ['status', '-s'];

/**
 * Parse the arguments that follow the program name.
 *
 * @param {string[]} argv
 * @returns {{ok: true, args: ParsedArgs} | {ok: false, message: string}}
 */
export function parse(argv) {
  /** @type {ParsedArgs} */
  const parsed = {
    mode: 'run',
    depth: DEFAULT_DEPTH,
    quiet: false,
    color: 'auto',
    ascii: 'auto',
    failFast: false,
    summary: false,
    allowEmpty: false,
    gitArgs: [],
  };

  let wantsHelp = false;
  let wantsVersion = false;

  const rest = argv.slice();
  const next = () => (rest.length > 0 ? rest.shift() : undefined);
  const drainInto = (first) => {
    parsed.gitArgs.push(first);
    while (rest.length > 0) parsed.gitArgs.push(rest.shift());
  };

  for (;;) {
    const arg = next();
    if (arg === undefined) break;

    if (arg === '--') {
      while (rest.length > 0) parsed.gitArgs.push(rest.shift());
      break;
    }

    if (arg.startsWith('--')) {
      const long = arg.slice(2);
      const equals = long.indexOf('=');
      const name = equals === -1 ? long : long.slice(0, equals);
      const inline = equals === -1 ? undefined : long.slice(equals + 1);

      if (name === 'help') { wantsHelp = true; continue; }
      if (name === 'version') { wantsVersion = true; continue; }
      if (name === 'list') { parsed.mode = 'list'; continue; }
      if (name === 'quiet') { parsed.quiet = true; continue; }
      if (name === 'ascii') { parsed.ascii = 'always'; continue; }
      if (name === 'fail-fast') { parsed.failFast = true; continue; }
      if (name === 'keep-going') { parsed.failFast = false; continue; }
      if (name === 'summary') { parsed.summary = true; continue; }
      if (name === 'allow-empty') { parsed.allowEmpty = true; continue; }
      if (name === 'no-color') { parsed.color = 'never'; continue; }
      if (name === 'color') {
        const taken = takeValue('--color', inline, next);
        if (!taken.ok) return taken;
        const color = parseColor(taken.value);
        if (!color.ok) return color;
        parsed.color = color.value;
        continue;
      }
      if (name === 'depth') {
        const taken = takeValue('-d`/`--depth', inline, next);
        if (!taken.ok) return taken;
        const depth = parseDepth(taken.value);
        if (!depth.ok) return depth;
        parsed.depth = depth.value;
        continue;
      }
      // Not one of our options: hand it, and everything that follows, to git.
      drainInto(arg);
      break;
    }

    if (arg.length > 1 && arg.startsWith('-')) {
      const short = arg.slice(1);
      if (short === 'h') { wantsHelp = true; continue; }
      if (short === 'V') { wantsVersion = true; continue; }
      if (short === 'l') { parsed.mode = 'list'; continue; }
      if (short === 'q') { parsed.quiet = true; continue; }
      if (short === 'k') { parsed.failFast = false; continue; }
      if (short.startsWith('d')) {
        const value = short.slice(1);
        const taken = takeValue('-d`/`--depth', value.length > 0 ? value : undefined, next);
        if (!taken.ok) return taken;
        const depth = parseDepth(taken.value);
        if (!depth.ok) return depth;
        parsed.depth = depth.value;
        continue;
      }
      drainInto(arg);
      break;
    }

    drainInto(arg);
    break;
  }

  if (wantsHelp) parsed.mode = 'help';
  else if (wantsVersion) parsed.mode = 'version';

  return { ok: true, args: parsed };
}

/** The git arguments of a parsed command line, or the built-in default. */
export function effectiveGitArgs(args) {
  return args.gitArgs.length > 0 ? args.gitArgs.slice() : DEFAULT_GIT_ARGS.slice();
}

function takeValue(name, inline, next) {
  if (inline !== undefined) return { ok: true, value: inline };
  const value = next();
  if (value === undefined) {
    return {
      ok: false,
      message: 'mgit: option `' + name + '` requires a value\nRun `mgit --help` for usage.\n',
    };
  }
  return { ok: true, value };
}

function parseDepth(value) {
  // Rust parses into usize: only plain decimal digits are accepted.
  if (/^[0-9]+$/.test(value)) {
    const depth = Number.parseInt(value, 10);
    if (Number.isSafeInteger(depth) && depth >= 1) return { ok: true, value: depth };
  }
  return {
    ok: false,
    message:
      'mgit: invalid value `' + value + '` for option `--depth`: expected a positive integer (>= 1)\n',
  };
}

function parseColor(value) {
  switch (value.toLowerCase()) {
    case 'auto': return { ok: true, value: 'auto' };
    case 'always': return { ok: true, value: 'always' };
    case 'never': return { ok: true, value: 'never' };
    default:
      return {
        ok: false,
        message:
          'mgit: invalid value `' + value + '` for option `--color`: expected `auto`, `always` or `never`\n',
      };
  }
}

/**
 * @typedef {object} ParsedArgs
 * @property {Mode} mode
 * @property {number} depth
 * @property {boolean} quiet
 * @property {ColorChoice} color
 * @property {AsciiChoice} ascii
 * @property {boolean} failFast
 * @property {boolean} summary
 * @property {boolean} allowEmpty
 * @property {string[]} gitArgs
 */
