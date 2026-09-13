#!/usr/bin/env node
'use strict';

const { spawn } = require('node:child_process');
const { constants } = require('node:os');

const { binaryFor, describeSupport } = require('../lib/platform.js');

const REPOSITORY = 'https://github.com/doggy8088/mgit';
const NATIVE_INSTALL =
  'Native installers: https://github.com/doggy8088/mgit#installation';

function fail(message) {
  process.stderr.write(`mgit: ${message}\n`);
  process.exit(1);
}

const binary = binaryFor();

if (binary.unsupported) {
  fail(
    [
      `there is no mgit build for ${binary.platform}-${binary.arch}.`,
      describeSupport(),
      `See ${REPOSITORY} for the supported platforms.`,
    ].join('\n'),
  );
}

if (!binary.exists) {
  fail(
    [
      `the ${binary.target} binary is missing from this installation.`,
      'This happens when the package was installed from a source checkout',
      'instead of from the registry.',
      'Reinstall it with:  npm install -g @willh/mgit',
      NATIVE_INSTALL,
    ].join('\n'),
  );
}

// `stdio: 'inherit'` keeps mgit a first class citizen of the terminal: colors,
// interactive git prompts and the pager all behave as if mgit had been started
// directly.
const child = spawn(binary.path, process.argv.slice(2), {
  stdio: 'inherit',
  windowsHide: false,
});

// Forward the signals that matter so that Ctrl+C reaches the git child and the
// exit status of the wrapper matches a native run.
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    try {
      child.kill(signal);
    } catch {
      // The child is already gone.
    }
  });
}

child.on('error', (error) => {
  process.stderr.write(`mgit: cannot run ${binary.path}: ${error.message}\n`);
  process.exit(127);
});

child.on('close', (code, signal) => {
  if (signal) {
    // Re-raise the signal so the shell reports the same status as a native run.
    try {
      process.kill(process.pid, signal);
    } catch {
      // Some signals cannot be raised on Windows.
    }
    process.exit(128 + (constants.signals[signal] ?? 0));
  }
  process.exit(code === null ? 1 : code);
});
