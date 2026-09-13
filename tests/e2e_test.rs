//! End to end tests that drive the compiled binary against real repositories.
//!
//! These tests only need a `git` on `PATH`; they are skipped otherwise.

use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output, Stdio};

use tempfile::TempDir;

const BINARY: &str = env!("CARGO_BIN_EXE_mgit");

/// An empty git configuration so that the tests never depend on the settings
/// of the machine they run on (`commit.gpgsign`, `init.defaultBranch`, ...).
fn empty_git_config() -> &'static str {
    static PATH: std::sync::OnceLock<String> = std::sync::OnceLock::new();
    PATH.get_or_init(|| {
        let directory = std::env::temp_dir().join("mgit-test-gitconfig");
        std::fs::create_dir_all(&directory).expect("create the config directory");
        let file = directory.join("empty.gitconfig");
        if !file.exists() {
            std::fs::write(&file, "").expect("write the empty config");
        }
        file.to_string_lossy().into_owned()
    })
}

fn git_available() -> bool {
    Command::new("git")
        .arg("--version")
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .map(|status| status.success())
        .unwrap_or(false)
}

/// Run git in `directory` with a clean configuration.
fn git(directory: &Path, args: &[&str]) -> Output {
    Command::new("git")
        .args(args)
        .current_dir(directory)
        .env("GIT_CONFIG_GLOBAL", empty_git_config())
        .env("GIT_CONFIG_SYSTEM", empty_git_config())
        .env("GIT_AUTHOR_NAME", "mgit tests")
        .env("GIT_AUTHOR_EMAIL", "mgit@example.com")
        .env("GIT_COMMITTER_NAME", "mgit tests")
        .env("GIT_COMMITTER_EMAIL", "mgit@example.com")
        .output()
        .expect("git must be runnable")
}

fn git_ok(directory: &Path, args: &[&str]) -> String {
    let output = git(directory, args);
    assert!(
        output.status.success(),
        "git {args:?} failed: {}",
        String::from_utf8_lossy(&output.stderr)
    );
    String::from_utf8_lossy(&output.stdout).trim().to_owned()
}

/// Create a repository with a single commit.
fn repository(root: &Path, name: &str) -> PathBuf {
    let path = root.join(name);
    fs::create_dir_all(&path).expect("create repository directory");
    git_ok(&path, &["-c", "init.defaultBranch=main", "init"]);
    fs::write(path.join("file.txt"), "hello\n").expect("write file");
    git_ok(&path, &["add", "file.txt"]);
    git_ok(&path, &["commit", "-m", "initial"]);
    path
}

fn directory(root: &Path, name: &str) -> PathBuf {
    let path = root.join(name);
    fs::create_dir_all(&path).expect("create directory");
    path
}

/// A command for the compiled binary with a deterministic environment.
fn mgit(root: &Path) -> Command {
    let mut command = Command::new(BINARY);
    command.current_dir(root);
    for name in [
        "NO_COLOR",
        "CLICOLOR",
        "CLICOLOR_FORCE",
        "MGIT_COLOR",
        "MGIT_ASCII",
        "MGIT_GIT",
    ] {
        command.env_remove(name);
    }
    command.env("LANG", "C.UTF-8");
    command.env("GIT_CONFIG_GLOBAL", empty_git_config());
    command.env("GIT_CONFIG_SYSTEM", empty_git_config());
    command
}

fn run(root: &Path, args: &[&str]) -> Run {
    let mut command = mgit(root);
    command.args(args);
    run_command(&mut command)
}

fn run_command(command: &mut Command) -> Run {
    let output = command.output().expect("the binary must run");
    Run {
        code: output.status.code().unwrap_or(-1),
        out: String::from_utf8_lossy(&output.stdout).into_owned(),
        err: String::from_utf8_lossy(&output.stderr).into_owned(),
    }
}

struct Run {
    code: i32,
    out: String,
    err: String,
}

fn temp() -> TempDir {
    TempDir::new().expect("temporary directory")
}

fn skip_without_git() -> Option<()> {
    if git_available() { Some(()) } else { None }
}

#[test]
fn the_default_command_shows_the_short_status() {
    if skip_without_git().is_none() {
        return;
    }
    let temp = temp();
    let repository = repository(temp.path(), "alpha");
    fs::write(repository.join("file.txt"), "changed\n").expect("modify file");
    fs::write(repository.join("untracked.txt"), "new\n").expect("add file");

    let run = run(temp.path(), &[]);

    assert_eq!(run.code, 0, "{}", run.err);
    assert!(
        run.out.contains("📂 Folder: alpha │ Branch: main"),
        "{}",
        run.out
    );
    assert!(run.out.contains(" M file.txt"), "{}", run.out);
    assert!(run.out.contains("?? untracked.txt"), "{}", run.out);
}

#[test]
fn a_clean_repository_produces_no_status_lines() {
    if skip_without_git().is_none() {
        return;
    }
    let temp = temp();
    repository(temp.path(), "alpha");
    let run = run(temp.path(), &[]);
    assert_eq!(run.code, 0);
    assert_eq!(run.out.lines().count(), 4, "{:?}", run.out);
}

#[test]
fn every_repository_is_visited_in_order() {
    if skip_without_git().is_none() {
        return;
    }
    let temp = temp();
    for name in ["zeta", "alpha", "middle"] {
        repository(temp.path(), name);
    }
    directory(temp.path(), "not-a-repository");

    let run = run(temp.path(), &["--list"]);

    assert_eq!(run.code, 0, "{}", run.err);
    let names: Vec<String> = run
        .out
        .lines()
        .map(|line| {
            Path::new(line)
                .file_name()
                .unwrap()
                .to_string_lossy()
                .into_owned()
        })
        .collect();
    assert_eq!(names, vec!["alpha", "middle", "zeta"]);
}

#[test]
fn the_branch_of_every_repository_is_shown() {
    if skip_without_git().is_none() {
        return;
    }
    let temp = temp();
    let alpha = repository(temp.path(), "alpha");
    let beta = repository(temp.path(), "beta");
    git_ok(&beta, &["checkout", "-b", "feature/multi"]);
    git_ok(&alpha, &["checkout", "--detach", "HEAD"]);
    let commit = git_ok(&alpha, &["rev-parse", "--short", "HEAD"]);

    let run = run(temp.path(), &[]);

    assert_eq!(run.code, 0, "{}", run.err);
    assert!(run.out.contains("Branch: feature/multi"), "{}", run.out);
    assert!(
        run.out.contains(&format!("Branch: {commit}")),
        "{}",
        run.out
    );
}

#[test]
fn a_repository_without_commits_is_not_an_error() {
    if skip_without_git().is_none() {
        return;
    }
    let temp = temp();
    let fresh = directory(temp.path(), "fresh");
    git_ok(&fresh, &["-c", "init.defaultBranch=main", "init"]);

    let run = run(temp.path(), &[]);
    assert_eq!(run.code, 0, "{}", run.err);
    assert!(run.out.contains("Branch: main"), "{}", run.out);
}

#[test]
fn a_git_file_worktree_is_recognised() {
    if skip_without_git().is_none() {
        return;
    }
    let temp = temp();
    let source = repository(temp.path(), "source");
    let worktree = temp.path().join("checkout");
    git_ok(
        &source,
        &["worktree", "add", "--detach", worktree.to_str().unwrap()],
    );
    assert!(
        worktree.join(".git").is_file(),
        "a linked worktree uses a .git file"
    );

    let listed = run(temp.path(), &["--list"]);
    assert_eq!(listed.code, 0, "{}", listed.err);
    assert!(listed.out.contains("checkout"), "{}", listed.out);
}

#[test]
fn a_failing_repository_is_reported_with_its_exit_code() {
    if skip_without_git().is_none() {
        return;
    }
    let temp = temp();
    repository(temp.path(), "alpha");
    repository(temp.path(), "beta");

    let run = run(
        temp.path(),
        &["rev-parse", "--verify", "--quiet", "refs/heads/missing"],
    );

    assert_eq!(run.code, 1, "{} / {}", run.out, run.err);
    assert!(run.err.contains("2 repositories"), "{}", run.err);
    assert!(run.err.contains("2 failed"), "{}", run.err);
    assert!(run.out.contains("Folder: alpha"), "{}", run.out);
    assert!(run.out.contains("Folder: beta"), "{}", run.out);
}

#[test]
fn fail_fast_stops_after_the_first_failure() {
    if skip_without_git().is_none() {
        return;
    }
    let temp = temp();
    for name in ["alpha", "beta", "gamma"] {
        repository(temp.path(), name);
    }

    let run = run(
        temp.path(),
        &[
            "--fail-fast",
            "rev-parse",
            "--verify",
            "--quiet",
            "refs/heads/missing",
        ],
    );

    assert_eq!(run.code, 1);
    assert!(run.out.contains("Folder: alpha"), "{}", run.out);
    assert!(!run.out.contains("Folder: beta"), "{}", run.out);
    assert!(run.err.contains("2 skipped"), "{}", run.err);
}

#[test]
fn a_directory_without_repositories_warns_and_fails() {
    if skip_without_git().is_none() {
        return;
    }
    let temp = temp();
    directory(temp.path(), "src");

    let failed = run(temp.path(), &[]);
    assert_eq!(failed.code, 1);
    assert!(failed.err.contains("no Git repository"), "{}", failed.err);
    assert!(failed.out.is_empty(), "{}", failed.out);

    let allowed = run(temp.path(), &["--allow-empty"]);
    assert_eq!(allowed.code, 0);
    assert!(allowed.err.contains("no Git repository"), "{}", allowed.err);
}

#[test]
fn the_current_directory_is_used_when_it_is_a_repository() {
    if skip_without_git().is_none() {
        return;
    }
    let temp = temp();
    let repository = repository(temp.path(), "single");
    fs::create_dir_all(repository.join("nested")).expect("create nested");

    let run = run(&repository, &["rev-parse", "--show-toplevel"]);

    assert_eq!(run.code, 0, "{}", run.err);
    let reported = PathBuf::from(run.out.trim());
    assert_eq!(
        fs::canonicalize(reported).expect("canonical"),
        fs::canonicalize(&repository).expect("canonical")
    );
    assert!(!run.out.contains("Folder:"), "{}", run.out);
}

#[test]
fn subdirectories_take_precedence_over_the_current_directory() {
    if skip_without_git().is_none() {
        return;
    }
    let temp = temp();
    let repository = repository(temp.path(), "single");
    git_ok(
        &repository,
        &["-c", "init.defaultBranch=main", "init", "child"],
    );
    let child = repository.join("child");
    fs::create_dir_all(child.join(".git")).expect("create inner .git");

    // `single` itself is a repository *and* has a child repository.
    let listed = run(&repository, &["--list"]);
    assert_eq!(listed.code, 0, "{}", listed.err);
    assert_eq!(
        fs::canonicalize(listed.out.trim()).expect("canonical"),
        fs::canonicalize(&child).expect("canonical")
    );
}

#[test]
fn the_depth_option_reaches_nested_repositories() {
    if skip_without_git().is_none() {
        return;
    }
    let temp = temp();
    let group = directory(temp.path(), "group");
    repository(&group, "nested");

    let shallow = run(temp.path(), &["--list"]);
    assert_eq!(shallow.code, 1, "{}", shallow.out);

    let deep = run(temp.path(), &["--list", "--depth", "2"]);
    assert_eq!(deep.code, 0, "{}", deep.err);
    assert!(deep.out.contains("nested"), "{}", deep.out);
}

#[test]
fn quiet_mode_prints_only_the_git_output() {
    if skip_without_git().is_none() {
        return;
    }
    let temp = temp();
    let repository = repository(temp.path(), "alpha");
    git_ok(&repository, &["checkout", "-b", "topic"]);

    let run = run(
        temp.path(),
        &["--quiet", "rev-parse", "--abbrev-ref", "HEAD"],
    );
    assert_eq!(run.code, 0, "{}", run.err);
    assert_eq!(run.out.trim(), "topic");
}

#[test]
fn the_summary_is_printed_when_it_is_requested() {
    if skip_without_git().is_none() {
        return;
    }
    let temp = temp();
    repository(temp.path(), "alpha");
    repository(temp.path(), "beta");

    let run = run(temp.path(), &["--summary"]);
    assert_eq!(run.code, 0, "{}", run.err);
    assert!(
        run.out.contains("2 repositories, 2 succeeded"),
        "{}",
        run.out
    );
}

#[test]
fn color_is_forced_and_suppressed() {
    if skip_without_git().is_none() {
        return;
    }
    let temp = temp();
    repository(temp.path(), "alpha");

    let colored = run(temp.path(), &["--color=always"]);
    assert!(colored.out.contains("\u{1b}[0;36m"), "{:?}", colored.out);
    assert!(
        colored.out.contains("\u{1b}[1;33malpha\u{1b}[0m"),
        "{:?}",
        colored.out
    );

    let plain = run(temp.path(), &["--color=never"]);
    assert!(!plain.out.contains('\u{1b}'), "{:?}", plain.out);

    let env = run_command(
        mgit(temp.path())
            .args(["--color=always"])
            .env("NO_COLOR", "1"),
    );
    assert!(env.out.contains("\u{1b}"), "an explicit choice wins");
}

#[test]
fn no_color_in_the_environment_disables_color() {
    if skip_without_git().is_none() {
        return;
    }
    let temp = temp();
    repository(temp.path(), "alpha");

    let run = run_command(mgit(temp.path()).env("NO_COLOR", "1"));
    assert!(!run.out.contains('\u{1b}'), "{:?}", run.out);
}

#[test]
fn ascii_glyphs_can_be_forced() {
    if skip_without_git().is_none() {
        return;
    }
    let temp = temp();
    repository(temp.path(), "alpha");

    let run = run(temp.path(), &["--ascii"]);
    assert!(run.out.is_ascii(), "{:?}", run.out);
    assert!(
        run.out.contains("Folder: alpha | Branch: main"),
        "{}",
        run.out
    );

    let lossy = run_command(mgit(temp.path()).env("LANG", "C"));
    assert!(lossy.out.is_ascii(), "{:?}", lossy.out);

    let forced = run_command(mgit(temp.path()).env("LANG", "C").env("MGIT_ASCII", "0"));
    assert!(forced.out.contains('📂'), "{:?}", forced.out);
}

#[test]
fn help_and_version_do_not_need_a_repository() {
    let temp = temp();
    let help = run(temp.path(), &["--help"]);
    assert_eq!(help.code, 0);
    assert!(help.out.contains("USAGE:"), "{}", help.out);

    let version = run(temp.path(), &["--version"]);
    assert_eq!(version.code, 0);
    assert_eq!(
        version.out.trim(),
        format!("mgit {}", env!("CARGO_PKG_VERSION"))
    );
}

#[test]
fn a_broken_command_line_exits_with_two() {
    let temp = temp();
    let run = run(temp.path(), &["--depth=zero"]);
    assert_eq!(run.code, 2);
    assert!(run.err.contains("depth"), "{}", run.err);
    assert!(run.out.is_empty(), "{}", run.out);
}

#[test]
fn git_options_are_forwarded_to_git() {
    if skip_without_git().is_none() {
        return;
    }
    let temp = temp();
    repository(temp.path(), "alpha");

    let passthrough = run(
        temp.path(),
        &["-c", "core.pager=cat", "status", "--porcelain"],
    );
    assert_eq!(passthrough.code, 0, "{}", passthrough.err);
    assert!(
        passthrough.out.contains("Folder: alpha"),
        "{}",
        passthrough.out
    );

    let version = run(temp.path(), &["--", "--version"]);
    assert_eq!(version.code, 0, "{}", version.err);
    assert!(version.out.contains("git version"), "{}", version.out);
}

#[test]
fn a_missing_git_binary_is_reported() {
    let temp = temp();
    repository(temp.path(), "alpha");
    let missing = if cfg!(windows) {
        "C:\\definitely\\not\\git.exe"
    } else {
        "/definitely/not/git"
    };

    let run = run_command(mgit(temp.path()).env("MGIT_GIT", missing));

    assert_eq!(run.code, 127);
    assert!(run.err.contains("git"), "{}", run.err);
}

#[test]
fn unusual_directory_names_are_handled() {
    if skip_without_git().is_none() {
        return;
    }
    let temp = temp();
    for name in ["-dashed", "with space", "unicode-資料夾"] {
        repository(temp.path(), name);
    }

    let listed = run(temp.path(), &["--list"]);
    assert_eq!(listed.code, 0, "{}", listed.err);
    assert_eq!(listed.out.lines().count(), 3, "{}", listed.out);

    let status = run(temp.path(), &["--quiet", "status", "--porcelain"]);
    assert_eq!(status.code, 0, "{}", status.err);
}

#[test]
fn a_closed_pipe_does_not_panic() {
    if !cfg!(unix) || skip_without_git().is_none() {
        return;
    }
    let temp = temp();
    repository(temp.path(), "alpha");
    let script = format!("'{BINARY}' --list | head -c 0");
    let output = Command::new("sh")
        .arg("-c")
        .arg(script)
        .current_dir(temp.path())
        .output()
        .expect("run the pipeline");
    let err = String::from_utf8_lossy(&output.stderr);
    assert!(!err.contains("panicked"), "{err}");
}
