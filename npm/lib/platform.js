'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * The release targets that are bundled in the `vendor/` directory, keyed by
 * `${platform}-${arch}`.
 *
 * Linux uses the statically linked musl build, which runs on every
 * distribution, including Alpine.
 */
const TARGETS = Object.freeze({
  'darwin-arm64': { target: 'aarch64-apple-darwin', binary: 'mgit' },
  'darwin-x64': { target: 'x86_64-apple-darwin', binary: 'mgit' },
  'linux-arm64': { target: 'aarch64-unknown-linux-musl', binary: 'mgit' },
  'linux-x64': { target: 'x86_64-unknown-linux-musl', binary: 'mgit' },
  'win32-arm64': { target: 'aarch64-pc-windows-msvc', binary: 'mgit.exe' },
  'win32-x64': { target: 'x86_64-pc-windows-msvc', binary: 'mgit.exe' },
});

/** Every target triple that the npm package ships. */
const BUNDLED_TARGETS = Object.freeze(
  Object.values(TARGETS).map((entry) => entry.target),
);

/**
 * The release target of a platform/architecture pair.
 *
 * @param {string} platform A Node.js `process.platform` value.
 * @param {string} arch A Node.js `process.arch` value.
 * @returns {{ target: string, binary: string } | null}
 */
function targetFor(platform, arch) {
  return TARGETS[`${platform}-${arch}`] ?? null;
}

/**
 * Resolve the native binary that belongs to this machine.
 *
 * `MGIT_BINARY` takes precedence, which is handy for development builds and
 * for the tests.
 *
 * @param {object} [options]
 * @returns {{
 *   unsupported: false,
 *   target: string,
 *   binary: string,
 *   path: string,
 *   exists: boolean,
 *   fromEnvironment: boolean,
 * } | { unsupported: true, platform: string, arch: string }}
 */
function binaryFor(options = {}) {
  const {
    platform = process.platform,
    arch = process.arch,
    root = path.join(__dirname, '..'),
    env = process.env,
  } = options;

  const override = env.MGIT_BINARY;
  if (typeof override === 'string' && override.length > 0) {
    return {
      unsupported: false,
      target: 'MGIT_BINARY',
      binary: path.basename(override),
      path: override,
      exists: fs.existsSync(override),
      fromEnvironment: true,
    };
  }

  const resolved = targetFor(platform, arch);
  if (resolved === null) {
    return { unsupported: true, platform, arch };
  }

  const binaryPath = path.join(root, 'vendor', resolved.target, resolved.binary);
  return {
    unsupported: false,
    target: resolved.target,
    binary: resolved.binary,
    path: binaryPath,
    exists: fs.existsSync(binaryPath),
    fromEnvironment: false,
  };
}

/** A human readable list of the bundled builds. */
function describeSupport() {
  return `Bundled builds: ${BUNDLED_TARGETS.join(', ')}.`;
}

module.exports = {
  TARGETS,
  BUNDLED_TARGETS,
  targetFor,
  binaryFor,
  describeSupport,
};
