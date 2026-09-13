# mgit

`mgit` is a cross-platform command line tool written in Rust that runs **one** Git command across **every** Git repository in the current directory.

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

Type it once and you see the state of every checkout; `mgit pull`, `mgit log -n 1` and `mgit fetch --all` work exactly the same way.

- **One Rust binary** for macOS, Linux and Windows: the same code and the same test suite on every platform, instead of a Bash script and a PowerShell script that drift apart.
- **Zero runtime dependencies**: no Python, no Node.js, no package manager. Download and run.
- **Safe**: releases ship SHA-256 checksums, the official installers verify them before touching your `PATH`, and every git argument is passed as an argument vector — never through a shell.

---

## Installation

### One line

**macOS / Linux (POSIX sh)**

```sh
curl -fsSL https://raw.githubusercontent.com/doggy8088/mgit/main/install.sh | sh
```

**Windows PowerShell (also works in PowerShell 7+ on macOS and Linux)**

```powershell
irm https://raw.githubusercontent.com/doggy8088/mgit/main/install.ps1 | iex
```

The installers detect your operating system and CPU, download the matching archive, verify its SHA-256 checksum and only then install the binary. They also tell you if the install directory is missing from your `PATH`.

### Manual download

Grab the archive for your platform from [GitHub Releases](https://github.com/doggy8088/mgit/releases):

| Platform | Asset |
| --- | --- |
| Linux x86_64 (static, runs everywhere) | `mgit-x86_64-unknown-linux-musl.tar.gz` |
| Linux aarch64 (static) | `mgit-aarch64-unknown-linux-musl.tar.gz` |
| Linux x86_64 (glibc) | `mgit-x86_64-unknown-linux-gnu.tar.gz` |
| Linux aarch64 (glibc) | `mgit-aarch64-unknown-linux-gnu.tar.gz` |
| macOS Apple Silicon | `mgit-aarch64-apple-darwin.tar.gz` |
| macOS Intel | `mgit-x86_64-apple-darwin.tar.gz` |
| Windows x64 | `mgit-x86_64-pc-windows-msvc.zip` |
| Windows on ARM | `mgit-aarch64-pc-windows-msvc.zip` |

Every archive has a matching `.sha256` file, and all of them are collected in `SHA256SUMS.txt`:

```sh
shasum -a 256 -c mgit-aarch64-apple-darwin.tar.gz.sha256    # macOS
sha256sum -c mgit-x86_64-unknown-linux-musl.tar.gz.sha256    # Linux
```

### From source

Rust 1.85 or newer is required (the `rust-version` field is declared and CI verifies it):

```sh
git clone https://github.com/doggy8088/mgit.git
cd mgit
cargo build --release          # target/release/mgit (mgit.exe on Windows)
cargo install --path .         # or install into ~/.cargo/bin
```

---

## Usage

### Default behaviour

Without any argument `mgit` runs `git status -s` in every repository:

```sh
mgit
```

### Any git command

Everything after the first argument that is not an `mgit` option is handed to `git` verbatim:

```sh
mgit pull                       # git pull everywhere
mgit fetch --all --prune
mgit log --oneline -n 3
mgit checkout main
mgit -c core.pager=cat status   # git global options keep working
mgit -- --version               # after `--`, even mgit's own options go to git
```

> Parsing stops at the first argument that is not one of the documented options, so unknown options (`-c`, `--git-dir`, …) are forwarded to git exactly like the old shell script did. Use `--` when the first git argument collides with an option of `mgit` (for example `--version`).

### Options

| Option | Description |
| --- | --- |
| `-h`, `--help` | Print the help and exit |
| `-V`, `--version` | Print the version and exit |
| `-l`, `--list` | List the repositories that were found (one absolute path per line) |
| `-d`, `--depth <N>` | How many directory levels to search, default `1` |
| `-q`, `--quiet` | Suppress the per repository header |
| `--color <WHEN>` | `auto` (default), `always` or `never` |
| `--no-color` | The same as `--color=never` |
| `--ascii` | ASCII only glyphs, no emoji |
| `--summary` | Always print the closing summary |
| `-k`, `--keep-going` | Continue after a failing repository (default) |
| `--fail-fast` | Stop at the first repository that fails |
| `--allow-empty` | Exit with `0` when no repository was found |
| `--` | Everything that follows is passed to git verbatim |

### Examples

```sh
mgit --depth 2 fetch                  # also update repositories one level deeper
mgit --list                           # which directories will be touched?
mgit -q log --oneline -n 1            # quiet mode, one line of history per repository
mgit --fail-fast pull                 # stop at the first conflict
mgit --color=never status             # no colors when writing into a file or CI log
mgit --ascii                          # ASCII only output for legacy Windows consoles
```

---

## Platform behaviour

`mgit` handles the terminal differences of every platform on purpose:

| Situation | Behaviour |
| --- | --- |
| Output is redirected (pipe, file, CI log) | Colors are off, plain text only |
| Windows `cmd.exe` / Windows PowerShell 5.1 | Tries to enable virtual terminal processing for ANSI colors and disables colors when that is impossible |
| Windows console code page is not UTF-8 | Switches to ASCII glyphs (`Folder: … \| Branch: …`) so the emoji cannot turn into mojibake |
| PowerShell 7, Windows Terminal, macOS, Linux | Unicode glyphs (`📂`, `│`, `✗`, `─`) |
| Non UTF-8 POSIX locale (`LANG=C`, `LC_ALL=POSIX`) | ASCII glyphs, unless `MGIT_ASCII=0` forces Unicode |
| `NO_COLOR` / `CLICOLOR_FORCE` | Honoured, see the environment variables below |
| `mgit … \| head` | `SIGPIPE` is restored to its default, so a closed pipe ends the run quietly instead of panicking |
| `git` on Windows | Found on `PATH` (including `PATHEXT`) as `git.exe`; `MGIT_GIT` accepts a full path |

---

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Every repository succeeded (or nothing was found with `--allow-empty`) |
| `1` | A repository failed, or no repository was found |
| `2` | The command line could not be parsed |
| `127` | `git` could not be started |
| `130` | Interrupted with Ctrl+C (`SIGINT`/`SIGTERM`) |
| other | The exit code of the first failing git invocation, reported unchanged |

Results are aggregated: every repository runs by default (`--keep-going`) and the **first** failing exit code becomes the exit code of `mgit`. The summary goes to standard error, so `mgit status -s > status.txt` stays clean.

---

## Environment variables

| Variable | Description |
| --- | --- |
| `MGIT_GIT` | Name or path of the git executable (default `git`) |
| `MGIT_COLOR` | `auto`, `always` or `never`; overrides the terminal detection |
| `MGIT_ASCII` | `1` forces ASCII glyphs, `0` forces Unicode glyphs |
| `NO_COLOR` | Disables color when set to a non empty value ([no-color.org](https://no-color.org/)) |
| `CLICOLOR_FORCE` | Forces color when set to a non empty value other than `0` |
| `CLICOLOR` | `0` disables color |
| `MGIT_VERSION` | Release to install, for example `0.1.0` (default: the latest one) |
| `MGIT_INSTALL_DIR` | Install directory used by the installers |
| `MGIT_DOWNLOAD_BASE` | Base URL the installers download from (used by the tests) |

Precedence: command line → `MGIT_*` → `CLICOLOR_FORCE` → `NO_COLOR` → terminal detection.

---

## How repositories are found

1. The search starts in the current directory and walks down (level 1 by default, `--depth` goes deeper).
2. A directory counts as a repository when it holds a `.git` **directory** or a `.git` **file**, so `git worktree` and submodules are recognised.
3. The traversal never descends into a repository, so submodules and vendored checkouts are not reported twice.
4. Symbolic links are followed and reported under **every** name they are reachable by: `repo` next to `link -> repo` runs twice, exactly like the `*/` glob of the old shell script. Every real directory is still visited only once, so link loops terminate.
5. Repositories are sorted by name, ignoring the case, and the order is identical on macOS, Linux and Windows.
6. When no subdirectory holds a repository but the current directory itself does, `mgit` simply runs git there, exactly like calling `git` directly.

---

## Differences from the v0.0.x shell version

The previous release shipped `mgit` (Bash) and `mgit.ps1` (PowerShell); both are archived in [`archive/`](archive/README.md). The new version keeps the default behaviour and the output format and fixes the rough edges:

| Topic | Old | New (from 0.1.0) |
| --- | --- | --- |
| Implementation | Bash script + PowerShell script | One Rust binary shared by every platform |
| Default command | `git status -s` | unchanged |
| Output format | 80 `=`, `📂 Folder: … │ Branch: …` | unchanged (plus a switchable ASCII mode) |
| Nothing found | Silent, exit code `0` | Warning and exit code `1` (`--allow-empty` restores the old behaviour) |
| Exit code | Always `0` in multi-repository mode | Aggregated; the first failure is reported |
| Options | None, everything went to git | `--list`, `--depth`, `--quiet`, `--color`, `--ascii`, `--summary`, `--fail-fast`, `--allow-empty`; unknown options still go to git |
| Colors | Always emitted ANSI escapes | Decided from the terminal, honours `NO_COLOR`/`CLICOLOR_FORCE` |
| Website and installers | `public/`, shell installers | Website archived; installers download and verify official release assets |

---

## Development

### Layout

```
src/
  main.rs       entry point: parse, detect capabilities, build the App
  cli.rs        argument parsing (pure, never reads the environment)
  env.rs        the environment variables that change the defaults
  color.rs      ANSI painting (no escape sequences while disabled)
  console.rs    terminal capabilities and the color/glyph policies
  discovery.rs  finding Git repositories in a directory tree
  gitcmd.rs     the GitRunner abstraction and the SystemGit implementation
  report.rs     rendering (headers, summary)
  app.rs        orchestration and exit codes
  platform.rs   platform details (SIGPIPE)
tests/          per module integration tests and end to end tests
scripts/        version tooling
archive/        the legacy scripts, website and workflows
```

### Testing (TDD)

Every module started with its tests. There are four layers:

| Files | What they cover |
| --- | --- |
| `tests/cli_test.rs`, `env_test.rs`, `color_test.rs`, `console_test.rs`, `report_test.rs` | Pure functions and rendering, no terminal and no git needed |
| `tests/discovery_test.rs`, `app_test.rs` | Directory walking and the orchestration driven by a scripted fake `GitRunner` (exit codes, interrupts, broken pipes) |
| `tests/gitcmd_test.rs` | Integration against the real `git` (branch detection, worktrees, detached HEAD, signals) |
| `tests/e2e_test.rs`, `install_scripts_test.rs` | End to end runs of the compiled binary and of the installer scripts |

```sh
cargo test --all-targets
cargo clippy --all-targets -- -D warnings
cargo fmt --all -- --check
cargo llvm-cov --all-targets --summary-only    # coverage (CI requires ≥ 90%)
```

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs the whole suite on Ubuntu, macOS and Windows, verifies MSRV 1.85, cross compiles all eight release targets, runs shellcheck and actionlint, and enforces the coverage gate.

### Versioning and releases

Versions follow [SemVer](https://semver.org/) and start at `0.1.0`. `Cargo.toml`, `Cargo.lock` and the git tag must agree.

```sh
scripts/bump-version.sh patch      # 0.1.0 -> 0.1.1 (Cargo.toml and Cargo.lock)
scripts/bump-version.sh minor      # 0.1.1 -> 0.2.0
scripts/bump-version.sh 1.0.0-rc.1 # explicit version
scripts/bump-version.sh --dry-run patch

git add Cargo.toml Cargo.lock && git commit -m "chore(release): 0.1.1"
git tag -a v0.1.1 -m "mgit 0.1.1"
git push origin HEAD v0.1.1        # pushing the tag starts the release
```

[`.github/workflows/release.yml`](.github/workflows/release.yml) verifies the versions, runs the tests, builds the eight targets with checksums, publishes the GitHub release (including `SHA256SUMS.txt`) and finally installs the **published** release with the official installers on all three platforms. Versions with a `-` suffix (for example `0.2.0-rc.1`) are published as pre-releases.

The `Release` workflow can also be started manually with a version; it creates and pushes the matching tag for you.

---

## License

[MIT](LICENSE)
