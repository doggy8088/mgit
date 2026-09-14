// The parity test: the same workspace, the same command line, once through the
// compiled binary and once through the browser engine. Argument parsing,
// repository discovery, the report framing and the exit codes all have to come
// out identical, character for character.
//
//   cargo build --release && node --test website/tests/
//
// Set MGIT_BINARY to test another build. Without a binary the test reports why
// it skipped rather than passing quietly.

import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildSandbox, FIXTURES, PARITY_COMMANDS, ROOT } from './fixtures.mjs';
import { materialize, GIT_ENV } from './materialize.mjs';
import { run, streamText } from '../assets/js/engine/run.js';
import { TARGETS } from '../assets/js/engine/console.js';

const here = dirname(fileURLToPath(import.meta.url));
const binary = process.env.MGIT_BINARY || join(here, '..', '..', 'target', 'release', 'mgit');
const available = existsSync(binary);

/**
 * Run the real binary and capture both streams and the exit code. Both streams
 * are pipes here, which is exactly the "output is redirected" case, so colour
 * is off unless the command line or the environment asks for it.
 */
export function runBinary(cwd, argv, env) {
  const result = spawnSync(binary, argv, {
    cwd,
    env: { ...GIT_ENV, ...env },
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.status === null ? 128 + 15 : result.status,
  };
}

/** Hide the details that legitimately differ between two machines. */
function normalize(text, realRoot) {
  return text
    .split(realRoot).join(ROOT)
    .replace(/git version [^\n]+/g, 'git version <version>');
}

test('the sandbox engine matches the compiled binary', { skip: available ? false : 'no binary at ' + binary + ' (run `cargo build --release`)' }, async (t) => {
  for (const fixture of FIXTURES) {
    await t.test(fixture.name + ': ' + fixture.summary, async (t) => {
      const realRoot = materialize(fixture);
      try {
        for (const command of PARITY_COMMANDS) {
          const label = 'mgit ' + command.argv.join(' ') +
            (command.env ? '   [' + Object.entries(command.env).map(([key, value]) => key + '=' + value).join(' ') + ']' : '');
          await t.test(label, () => {
            const env = command.env || {};
            const actual = runBinary(realRoot, command.argv, env);
            const simulated = run({
              fs: buildSandbox(fixture),
              cwd: ROOT,
              argv: command.argv,
              env,
              // The test captures both streams through a pipe, which is
              // exactly the "not a terminal" case.
              target: TARGETS.pipe,
            });

            assert.equal(
              normalize(actual.stdout, realRoot),
              normalize(streamText(simulated.chunks, 1), realRoot),
              'standard output differs',
            );
            assert.equal(
              normalize(actual.stderr, realRoot),
              normalize(streamText(simulated.chunks, 2), realRoot),
              'standard error differs',
            );
            assert.equal(actual.exitCode, simulated.exitCode, 'exit code differs');
          });
        }
      } finally {
        rmSync(realRoot, { recursive: true, force: true, maxRetries: 3 });
      }
    });
  }
});
