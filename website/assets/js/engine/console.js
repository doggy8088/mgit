// Terminal capability detection and the policies that depend on it, ported
// from src/console.rs. In the sandbox the "terminal" is whichever output
// target the visitor picked, which turns the platform behaviour table in the
// documentation into something you can try instead of something you read.

import { ASCII_GLYPHS, UNICODE_GLYPHS } from './report.js';

/**
 * The output targets the playground can pretend to write to.
 */
export const TARGETS = {
  'unix-tty': { id: 'unix-tty', platform: 'macos', stdoutIsTerminal: true, ansiSupported: true, utf8Console: true },
  'pipe': { id: 'pipe', platform: 'macos', stdoutIsTerminal: false, ansiSupported: true, utf8Console: true },
  'windows-terminal': { id: 'windows-terminal', platform: 'windows', stdoutIsTerminal: true, ansiSupported: true, utf8Console: true },
  'windows-legacy': { id: 'windows-legacy', platform: 'windows', stdoutIsTerminal: true, ansiSupported: true, utf8Console: false },
};

/**
 * Decide whether the output is colorized.
 * Precedence: the command line, then MGIT_COLOR, then CLICOLOR_FORCE, then
 * NO_COLOR / CLICOLOR, then the terminal detection.
 */
export function decideColor(choice, env, caps) {
  if (choice === 'always') return true;
  if (choice === 'never') return false;

  const mgitColor = env.MGIT_COLOR;
  if (typeof mgitColor === 'string') {
    const value = mgitColor.toLowerCase();
    if (value === 'always') return true;
    if (value === 'never') return false;
  }
  if (flag(env.CLICOLOR_FORCE) === true) return true;
  if (flag(env.NO_COLOR) === true) return false;
  if (flag(env.CLICOLOR) === false) return false;
  return caps.stdoutIsTerminal && caps.ansiSupported;
}

/** Decide whether the ASCII only glyphs are used. */
export function decideGlyphs(choice, env, caps) {
  if (choice === 'always') return ASCII_GLYPHS;
  if (choice === 'never') return UNICODE_GLYPHS;

  const ascii = flag(env.MGIT_ASCII);
  if (ascii === true) return ASCII_GLYPHS;
  if (ascii === false) return UNICODE_GLYPHS;

  if (caps.platform === 'windows') {
    return caps.stdoutIsTerminal && !caps.utf8Console ? ASCII_GLYPHS : UNICODE_GLYPHS;
  }
  return localeSupportsUtf8(env) ? UNICODE_GLYPHS : ASCII_GLYPHS;
}

/** Whether the POSIX locale can transport the Unicode glyphs. */
export function localeSupportsUtf8(env) {
  const locale = ['LC_ALL', 'LC_CTYPE', 'LANG']
    .map((name) => env[name])
    .find((value) => typeof value === 'string' && value.length > 0);
  if (locale === undefined) return true;
  return locale.toLowerCase().includes('utf');
}

/**
 * Interpret an environment variable as a boolean flag: unset is `undefined`,
 * an empty value and the usual spellings of "no" are false, anything else is
 * true.
 */
export function flag(value) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  return !['0', 'false', 'no', 'off'].includes(trimmed.toLowerCase());
}
