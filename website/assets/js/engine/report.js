// Rendering of the human readable output, ported from src/report.rs and
// src/color.rs. The output is produced as text with the same escape sequences
// the real program writes, so the parity tests can compare it character for
// character and the terminal view can parse the very same stream.

export const HEADER_WIDTH = 80;

const ESC = '\x1b';
const RESET = ESC + '[0m';

/** The ANSI styles mgit uses, with the escape sequence of each. */
export const STYLE = {
  plain: null,
  cyan: ESC + '[0;36m',
  boldYellow: ESC + '[1;33m',
  boldGreen: ESC + '[1;32m',
  red: ESC + '[0;31m',
  bold: ESC + '[1m',
};

/** The Unicode glyph set. */
export const UNICODE_GLYPHS = { folder: '\u{1F4C2} ', branchSep: '│', failure: '✗', rule: '─' };
/** The ASCII glyph set, for terminals that cannot render more. */
export const ASCII_GLYPHS = { folder: '', branchSep: '|', failure: 'x', rule: '-' };

/** Writes text with ANSI escape sequences, or verbatim when color is off. */
export class Painter {
  constructor(enabled) {
    this.enabled = !!enabled;
  }

  paint(style, text) {
    const code = STYLE[style];
    if (!this.enabled || !code) return text;
    return code + text + RESET;
  }
}

/** The `====` framed header of one repository. */
export function repoHeader(name, branch, painter, glyphs) {
  const rule = '='.repeat(HEADER_WIDTH);
  return (
    painter.paint('cyan', rule) + '\n' +
    painter.paint('cyan', glyphs.folder + 'Folder: ') +
    painter.paint('boldYellow', name) +
    ' ' +
    painter.paint('cyan', glyphs.branchSep + ' Branch: ') +
    painter.paint('boldGreen', branch) + '\n' +
    painter.paint('cyan', rule) + '\n'
  );
}

/**
 * The closing summary block.
 * @param {{succeeded: number, skipped: number, failures: {name: string, exitCode: number}[]}} summary
 */
export function summaryBlock(summary, painter, glyphs) {
  const total = summary.succeeded + summary.skipped + summary.failures.length;
  const rule = glyphs.rule.repeat(HEADER_WIDTH);
  const counts = [
    total + ' ' + plural(total, 'repository', 'repositories') + ', ' + summary.succeeded + ' succeeded',
  ];
  if (summary.failures.length > 0) counts.push(summary.failures.length + ' failed');
  if (summary.skipped > 0) counts.push(summary.skipped + ' skipped');

  let out = painter.paint('cyan', rule) + '\n';
  const style = summary.failures.length === 0 ? 'boldGreen' : 'red';
  out += painter.paint(style, 'mgit: ' + counts.join(', ')) + '\n';
  for (const failure of summary.failures) {
    out += '  ' + painter.paint('red', glyphs.failure + ' ' + failure.name) +
      ' (exit code ' + failure.exitCode + ')\n';
  }
  return out;
}

/** The message that is printed when no repository was found. */
export function missingRepositoryWarning(root, depth) {
  return 'mgit: no Git repository found in `' + root + '` (searched ' + depth + ' ' +
    plural(depth, 'level', 'levels') + ')\n';
}

/** The message that is printed when the git executable cannot be started. */
export function missingGitMessage(program, platform) {
  const hint = platform === 'windows'
    ? '       Install it with `winget install --id Git.Git` or from https://git-scm.com/download/win.\n'
    : platform === 'macos'
      ? '       Install it with `xcode-select --install` or `brew install git`.\n'
      : '       Install it with your package manager, for example `sudo apt install git`.\n';
  return 'mgit: cannot run `' + program + '`: git was not found\n' + hint;
}

function plural(count, singular, many) {
  return count === 1 ? singular : many;
}

/** Remove every escape sequence, for copying the output as plain text. */
export function stripAnsi(text) {
  return text.replace(new RegExp(ESC + '\\[[0-9;]*m', 'g'), '');
}
