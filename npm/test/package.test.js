'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const packageRoot = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));

test('the package is published under the expected name', () => {
  assert.equal(manifest.name, '@willh/mgit');
  assert.match(manifest.version, /^\d+\.\d+\.\d+/);
  assert.equal(manifest.license, 'MIT');
});

test('the repository field matches the GitHub repository', () => {
  // npm trusted publishing requires repository.url to point at the exact
  // repository that runs the publish workflow.
  assert.equal(manifest.repository.type, 'git');
  assert.equal(manifest.repository.url, 'git+https://github.com/doggy8088/mgit.git');
});

test('the declared version stays in sync with Cargo.toml', () => {
  const cargo = path.join(packageRoot, '..', 'Cargo.toml');
  if (!fs.existsSync(cargo)) {
    return; // published packages have no Cargo.toml next to them
  }
  const text = fs.readFileSync(cargo, 'utf8');
  const section = text.split(/^\[/m).find((part) => part.startsWith('package]'));
  const version = /^version = "(?<version>[^"]+)"/m.exec(section ?? '').groups.version;
  assert.equal(
    manifest.version,
    version,
    'run scripts/bump-version.sh so that both stay in sync',
  );
});

test('the bin entry points at an executable launcher', () => {
  assert.deepEqual(Object.keys(manifest.bin), ['mgit']);
  const launcher = path.join(packageRoot, manifest.bin.mgit);
  const text = fs.readFileSync(launcher, 'utf8');
  assert.match(text, /^#!\/usr\/bin\/env node/);
});

test('the package ships the launcher, the library and the binaries', () => {
  for (const entry of ['bin/mgit.js', 'lib/', 'vendor/', 'README.md']) {
    assert.ok(manifest.files.includes(entry), `files must include ${entry}`);
  }
});

test('there is no install script', () => {
  // Everything is bundled, so `npm install --ignore-scripts`, pnpm and yarn
  // all work without running any code at install time.
  assert.equal(manifest.scripts.postinstall, undefined);
  assert.equal(manifest.scripts.preinstall, undefined);
});

test('the supported platforms and architectures are declared', () => {
  assert.deepEqual(manifest.os, ['darwin', 'linux', 'win32']);
  assert.deepEqual(manifest.cpu, ['x64', 'arm64']);
  assert.match(manifest.engines.node, />=/);
});

test('the package is published publicly to the public registry', () => {
  assert.equal(manifest.publishConfig.access, 'public');
  assert.equal(manifest.publishConfig.registry, 'https://registry.npmjs.org/');
});

test('the vendor script is executable and documented', () => {
  const script = path.join(packageRoot, 'scripts', 'vendor.sh');
  assert.match(fs.readFileSync(script, 'utf8'), /vendor_directory=/);
  if (process.platform !== 'win32') {
    const mode = fs.statSync(script).mode;
    assert.notEqual(mode & 0o111, 0, `${script} must be executable`);
  }
});
