//! Tests for the real git integration layer. These run against the git binary
//! that is on `PATH`, so they are skipped when it is unavailable.

use std::ffi::OsString;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

use mgit::gitcmd::{GitRunner, Outcome, SystemGit};
use tempfile::TempDir;

fn git_available() -> bool {
    Command::new("git")
        .arg("--version")
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status()
        .map(|status| status.success())
        .unwrap_or(false)
}

fn git(directory: &Path, args: &[&str]) -> String {
    let output = Command::new("git")
        .args(args)
        .current_dir(directory)
        .env("GIT_CONFIG_GLOBAL", "/dev/null")
        .env("GIT_CONFIG_SYSTEM", "/dev/null")
        .env("GIT_AUTHOR_NAME", "mgit tests")
        .env("GIT_AUTHOR_EMAIL", "mgit@example.com")
        .env("GIT_COMMITTER_NAME", "mgit tests")
        .env("GIT_COMMITTER_EMAIL", "mgit@example.com")
        .output()
        .expect("run git");
    assert!(
        output.status.success(),
        "git {args:?} failed: {}",
        String::from_utf8_lossy(&output.stderr)
    );
    String::from_utf8_lossy(&output.stdout).trim().to_owned()
}

fn init_repository(path: &Path) -> PathBuf {
    fs::create_dir_all(path).expect("create directory");
    git(path, &["-c", "init.defaultBranch=main", "init"]);
    fs::write(path.join("file.txt"), "hello\n").expect("write file");
    git(path, &["add", "file.txt"]);
    git(path, &["commit", "-m", "initial"]);
    path.to_path_buf()
}

#[test]
fn probing_finds_the_real_git() {
    if !git_available() {
        return;
    }
    let git = SystemGit::new("git");
    assert_eq!(git.program(), std::ffi::OsStr::new("git"));
    git.probe().expect("git must be startable");
}

#[test]
fn probing_reports_a_missing_program() {
    let git = SystemGit::new(missing_program());
    let error = git.probe().expect_err("a missing program must fail");
    assert_eq!(error.program(), missing_program().as_os_str());
    let message = error.message();
    assert!(message.contains("git"), "{message}");
    assert!(message.contains(&missing_program().to_string_lossy().to_string()));
}

#[test]
fn the_branch_of_a_repository_is_reported() {
    if !git_available() {
        return;
    }
    let temp = TempDir::new().expect("temp");
    let repository = init_repository(&temp.path().join("repo"));
    let git = SystemGit::new("git");
    assert_eq!(git.branch(&repository), "main");
}

#[test]
fn a_detached_head_is_reported_as_the_short_commit() {
    if !git_available() {
        return;
    }
    let temp = TempDir::new().expect("temp");
    let repository = init_repository(&temp.path().join("repo"));
    git(&repository, &["checkout", "--detach", "HEAD"]);
    let expected = git(&repository, &["rev-parse", "--short", "HEAD"]);

    let git = SystemGit::new("git");
    let branch = git.branch(&repository);
    assert_eq!(branch, expected);
    assert!(!branch.is_empty());
    assert!(!branch.contains('\n'), "{branch:?} must be a single line");
}

#[test]
fn a_repository_without_commits_still_reports_its_branch() {
    if !git_available() {
        return;
    }
    let temp = TempDir::new().expect("temp");
    let repository = temp.path().join("empty");
    fs::create_dir_all(&repository).expect("create directory");
    git(&repository, &["-c", "init.defaultBranch=trunk", "init"]);

    let git = SystemGit::new("git");
    assert_eq!(git.branch(&repository), "trunk");
}

#[test]
fn a_directory_that_is_not_a_repository_falls_back_to_detached_head() {
    if !git_available() {
        return;
    }
    let temp = TempDir::new().expect("temp");
    let repository = temp.path().join("bogus");
    fs::create_dir_all(repository.join(".git")).expect("create directory");

    let git = SystemGit::new("git");
    assert_eq!(git.branch(&repository), "detached HEAD");
}

#[test]
fn a_successful_command_reports_exit_code_zero() {
    if !git_available() {
        return;
    }
    let temp = TempDir::new().expect("temp");
    let repository = init_repository(&temp.path().join("repo"));
    let git = SystemGit::new("git");
    let outcome = git
        .run(
            &repository,
            &[OsString::from("status"), OsString::from("--porcelain")],
        )
        .expect("run git");
    assert_eq!(outcome, Outcome::Exited(0));
    assert_eq!(outcome.exit_code(), 0);
    assert!(!outcome.is_interrupt());
}

#[test]
fn a_failing_command_reports_its_exit_code() {
    if !git_available() {
        return;
    }
    let temp = TempDir::new().expect("temp");
    let repository = init_repository(&temp.path().join("repo"));
    let git = SystemGit::new("git");
    let outcome = git
        .run(
            &repository,
            &[
                OsString::from("rev-parse"),
                OsString::from("--verify"),
                OsString::from("--quiet"),
                OsString::from("refs/heads/does-not-exist"),
            ],
        )
        .expect("run git");
    assert_eq!(outcome.exit_code(), 1);
}

#[test]
fn a_missing_program_is_reported_as_an_io_error() {
    let git = SystemGit::new(missing_program());
    let error = git
        .run(Path::new("/tmp"), &[OsString::from("status")])
        .expect_err("a missing program must fail");
    assert_eq!(error.kind(), std::io::ErrorKind::NotFound);
}

#[cfg(unix)]
#[test]
fn signals_are_mapped_to_the_posix_exit_code() {
    use std::process::Stdio;

    let status = Command::new("sh")
        .arg("-c")
        .arg("kill -TERM $$")
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .expect("spawn sh");
    let outcome = Outcome::from_status(&status);
    assert_eq!(outcome, Outcome::Signaled(15));
    assert_eq!(outcome.exit_code(), 143);
    assert!(outcome.is_interrupt());

    let status = Command::new("sh")
        .arg("-c")
        .arg("exit 7")
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .expect("spawn sh");
    let outcome = Outcome::from_status(&status);
    assert_eq!(outcome, Outcome::Exited(7));
    assert_eq!(outcome.exit_code(), 7);
    assert!(!outcome.is_interrupt());
}

#[test]
fn only_sigint_and_sigterm_count_as_an_interrupt() {
    assert!(Outcome::Signaled(2).is_interrupt());
    assert!(Outcome::Signaled(15).is_interrupt());
    assert!(!Outcome::Signaled(9).is_interrupt());
    assert!(!Outcome::Exited(130).is_interrupt());
}

#[test]
fn the_missing_git_message_contains_platform_advice() {
    let error = SystemGit::new("git").probe().err();
    if error.is_none() {
        // git exists here, so build the error by hand.
    }
    let missing = mgit::gitcmd::GitMissing::new("git");
    let message = missing.message();
    for needle in ["git", "install"] {
        assert!(message.contains(needle), "{message} must mention {needle}");
    }
}

#[cfg(windows)]
fn missing_program() -> OsString {
    OsString::from("definitely-not-a-real-program.exe")
}

#[cfg(not(windows))]
fn missing_program() -> OsString {
    OsString::from("/definitely/not/a/real/program")
}
