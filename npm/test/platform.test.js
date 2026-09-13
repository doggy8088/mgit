'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  BUNDLED_TARGETS,
  TARGETS,
  binaryFor,
  describeSupport,
  targetFor,
} = require('../lib/platform.js');

test('every bundled platform maps to a release target', () => {
  const expected = {
    'darwin-arm64': 'aarch64-apple-darwin',
    'darwin-x64': 'x86_64-apple-darwin',
    'linux-arm64': 'aarch64-unknown-linux-musl',
    'linux-x64': 'x86_64-unknown-linux-musl',
    'win32-arm64': 'aarch64-pc-windows-msvc',
    'win32-x64': 'x86_64-pc-windows-msvc',
  };

  assert.deepEqual(Object.keys(TARGETS).sort(), Object.keys(expected).sort());
  for (const [key, target] of Object.entries(expected)) {
    const [platform, arch] = key.split('-');
    assert.equal(targetFor(platform, arch).target, target, key);
  }
});

test('linux uses the statically linked musl build', () => {
  for (const arch of ['x64', 'arm64']) {
    assert.match(targetFor('linux', arch).target, /-musl$/);
  }
});

test('windows binaries keep their .exe suffix', () => {
  assert.equal(targetFor('win32', 'x64').binary, 'mgit.exe');
  assert.equal(targetFor('win32', 'arm64').binary, 'mgit.exe');
  assert.equal(targetFor('darwin', 'arm64').binary, 'mgit');
  assert.equal(targetFor('linux', 'x64').binary, 'mgit');
});

test('unsupported platforms are reported instead of guessed', () => {
  assert.equal(targetFor('freebsd', 'x64'), null);
  assert.equal(targetFor('linux', 'ia32'), null);
  assert.equal(targetFor('win32', 'ia32'), null);
});

test('the bundled target list matches the table', () => {
  assert.equal(BUNDLED_TARGETS.length, Object.keys(TARGETS).length);
  assert.ok(BUNDLED_TARGETS.includes('aarch64-apple-darwin'));
  assert.ok(describeSupport().includes('x86_64-unknown-linux-musl'));
});

test('the binary is resolved from the vendor directory', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mgit-npm-'));
  try {
    const resolved = binaryFor({ platform: 'linux', arch: 'x64', root, env: {} });
    assert.equal(resolved.unsupported, false);
    assert.equal(resolved.target, 'x86_64-unknown-linux-musl');
    assert.equal(
      resolved.path,
      path.join(root, 'vendor', 'x86_64-unknown-linux-musl', 'mgit'),
    );
    assert.equal(resolved.exists, false, 'nothing is vendored yet');
    assert.equal(resolved.fromEnvironment, false);

    fs.mkdirSync(path.join(root, 'vendor', 'x86_64-unknown-linux-musl'), { recursive: true });
    fs.writeFileSync(resolved.path, '#!/bin/sh\n');
    assert.equal(binaryFor({ platform: 'linux', arch: 'x64', root, env: {} }).exists, true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('windows binaries are looked up with their extension', () => {
  const root = path.join(path.sep, 'nowhere');
  const resolved = binaryFor({ platform: 'win32', arch: 'arm64', root, env: {} });
  assert.equal(resolved.binary, 'mgit.exe');
  assert.equal(resolved.path, path.join(root, 'vendor', 'aarch64-pc-windows-msvc', 'mgit.exe'));
});

test('an unsupported platform returns a marker instead of a path', () => {
  const resolved = binaryFor({ platform: 'freebsd', arch: 'x64', env: {} });
  assert.equal(resolved.unsupported, true);
  assert.equal(resolved.platform, 'freebsd');
  assert.equal(resolved.arch, 'x64');
});

test('MGIT_BINARY overrides the bundled binary', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mgit-npm-'));
  try {
    const fake = path.join(root, 'my-own-mgit');
    fs.writeFileSync(fake, '#!/bin/sh\n');
    const resolved = binaryFor({
      platform: 'linux',
      arch: 'x64',
      root,
      env: { MGIT_BINARY: fake },
    });
    assert.equal(resolved.path, fake);
    assert.equal(resolved.exists, true);
    assert.equal(resolved.fromEnvironment, true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('an empty MGIT_BINARY is ignored', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mgit-npm-'));
  try {
    const resolved = binaryFor({
      platform: 'darwin',
      arch: 'arm64',
      root,
      env: { MGIT_BINARY: '' },
    });
    assert.equal(resolved.fromEnvironment, false);
    assert.equal(resolved.target, 'aarch64-apple-darwin');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
