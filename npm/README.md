# mgit

> Run the same git command in **every** Git repository under the current directory.

This package ships the official `mgit` binaries for macOS, Linux and Windows, so
`npx` works without any build step and without running install scripts.

```console
$ mgit
================================================================================
📂 Folder: repo-a │ Branch: main
================================================================================
 M src/main.rs

================================================================================
📂 Folder: repo-b │ Branch: feature/login
================================================================================
(clean, no output)

================================================================================
```

## Install

```sh
npm install --global @willh/mgit     # or: pnpm add -g @willh/mgit, yarn global add @willh/mgit
npx @willh/mgit                      # run without installing
bunx @willh/mgit
```

Other ways to install (Homebrew-free one line installers, release archives,
`cargo install`) are documented in the
[main README](https://github.com/doggy8088/mgit#installation).

## Usage

```sh
mgit                       # git status -s in every repository
mgit pull                  # git pull in every repository
mgit fetch --all --prune
mgit log --oneline -n 3
mgit -q status             # quiet: no per repository headers
mgit --depth 2 fetch       # search two directory levels deep
mgit --list                # only list the repositories that were found
mgit --fail-fast pull      # stop at the first repository that fails
```

`--help` lists every option, `--version` prints the version. Anything that is
not an `mgit` option is handed to `git` verbatim, so `mgit -c core.pager=cat
status` works too.

See the [main README](https://github.com/doggy8088/mgit#readme) for the full
documentation (including the exit codes and the environment variables) and for
the [正體中文說明](https://github.com/doggy8088/mgit/blob/main/README.md).

## How this package works

* The tarball contains the release binaries for six targets:
  `aarch64-apple-darwin`, `x86_64-apple-darwin`,
  `aarch64-unknown-linux-musl`, `x86_64-unknown-linux-musl` (static, runs on
  every Linux distribution), `aarch64-pc-windows-msvc` and
  `x86_64-pc-windows-msvc`.
* `bin/mgit.js` spawns the binary for your platform with inherited stdio, so
  colours, pagers, `Ctrl+C` and interactive git prompts behave exactly like a
  native run.
* There is **no** `postinstall` script: installing the package never executes
  code and works with `--ignore-scripts`, pnpm, yarn and bun.
* Every release is published from GitHub Actions with
  [provenance](https://docs.npmjs.com/generating-provenance-statements), so you
  can verify where the binaries came from with `npm audit signatures`.

`MGIT_BINARY=/path/to/mgit` overrides the bundled binary, which is useful when
you build mgit yourself.

## Requirements

* Node.js 20 or newer
* `git` on `PATH` (mgit is a wrapper around your own git installation)

## License

[MIT](https://github.com/doggy8088/mgit/blob/main/LICENSE)
