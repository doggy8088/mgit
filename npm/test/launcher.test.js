'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const launcher = path.join(__dirname, '..', 'bin', 'mgit.js');
const packageRoot = path.join(__dirname, '..');
const repositoryRoot = path.join(packageRoot, '..');

/** The compiled Rust binary, if this checkout has one. */
function nativeBinary() {
  const candidates = [
    process.env.MGIT_TEST_BINARY,
    path.join(repositoryRoot, 'target', 'debug', process.platform === 'win32' ? 'mgit.exe' : 'mgit'),
    path.join(repositoryRoot, 'target', 'release', process.platform === 'win32' ? 'mgit.exe' : 'mgit'),
  ].filter((candidate) => typeof candidate === 'string');
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function runLauncher(args, env) {
  return spawnSync(process.execPath, [launcher, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

const binary = nativeBinary();
const binarySkip =
  binary === null ? 'build the Rust binary first (cargo build) or set MGIT_TEST_BINARY' : false;

test('the launcher runs the native binary', { skip: binarySkip }, () => {
  const result = runLauncher(['--version'], { MGIT_BINARY: binary });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout.trim(), /^mgit \d+\.\d+\.\d+/);
});

test('arguments are forwarded verbatim', { skip: binarySkip }, () => {
  const result = runLauncher(['--help'], { MGIT_BINARY: binary });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /USAGE:/);
  assert.match(result.stdout, /--depth/);
});

test('the exit code of the native binary is preserved', { skip: binarySkip }, () => {
  const result = runLauncher(['--depth=zero'], { MGIT_BINARY: binary });
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /depth/);
});

test('the standard error of the native binary is inherited', { skip: binarySkip }, () => {
  const result = runLauncher(['--depth=zero'], { MGIT_BINARY: binary });
  assert.notEqual(result.stderr.trim(), '');
});

test('a missing binary explains how to fix it', () => {
  const missing = path.join(packageRoot, 'vendor', 'does-not-exist', 'mgit');
  const result = runLauncher(['--version'], { MGIT_BINARY: missing });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /mgit/);
  assert.match(result.stderr, /npm install -g @willh\/mgit/);
});

test('the launcher refuses to run without a bundled binary', () => {
  // The repository checkout has no vendor/ directory, so the launcher must
  // report the missing binary instead of spawning something random.
  const vendored = path.join(packageRoot, 'vendor');
  if (fs.existsSync(vendored)) {
    return;
  }
  const env = { ...process.env };
  delete env.MGIT_BINARY;
  const result = spawnSync(process.execPath, [launcher, '--version'], { encoding: 'utf8', env });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing from this installation/);
});
