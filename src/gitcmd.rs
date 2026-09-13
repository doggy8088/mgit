//! Talking to the `git` executable.

use std::ffi::{OsStr, OsString};
use std::io;
use std::path::Path;
use std::process::{Command, ExitStatus, Stdio};

/// `SIGINT` on every platform that has signals.
const SIGINT: i32 = 2;
/// `SIGTERM` on every platform that has signals.
const SIGTERM: i32 = 15;

/// `STATUS_CONTROL_C_EXIT`, the pseudo exit code that Windows reports when a
/// process is interrupted with Ctrl+C.
#[cfg(windows)]
const STATUS_CONTROL_C_EXIT: i32 = 0xC000_013A_u32 as i32;

/// How a git invocation ended.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Outcome {
    /// git exited on its own with this code.
    Exited(i32),
    /// git was terminated by this signal.
    Signaled(i32),
}

impl Outcome {
    /// The exit code that `mgit` reports for this outcome.
    ///
    /// Signals are mapped to `128 + signal`, the convention that every shell
    /// uses.
    pub fn exit_code(self) -> i32 {
        match self {
            Outcome::Exited(code) => code,
            Outcome::Signaled(signal) => 128 + signal,
        }
    }

    /// Whether this outcome means that the user interrupted the run.
    pub fn is_interrupt(self) -> bool {
        matches!(self, Outcome::Signaled(signal) if signal == SIGINT || signal == SIGTERM)
    }

    /// Translate the exit status of a child process.
    pub fn from_status(status: &ExitStatus) -> Self {
        #[cfg(unix)]
        {
            use std::os::unix::process::ExitStatusExt;
            match status.code() {
                Some(code) => Outcome::Exited(code),
                // Terminated by a signal: there is no exit code to report.
                None => Outcome::Signaled(status.signal().unwrap_or(SIGTERM)),
            }
        }

        #[cfg(windows)]
        {
            match status.code() {
                Some(code) if code == STATUS_CONTROL_C_EXIT => Outcome::Signaled(SIGINT),
                // Windows has no signals; a missing code can only be Ctrl+C.
                None => Outcome::Signaled(SIGINT),
                Some(code) => Outcome::Exited(code),
            }
        }
    }
}

/// The git executable could not be started.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GitMissing {
    program: OsString,
}

impl GitMissing {
    /// Create the error for a program name or path.
    pub fn new(program: impl Into<OsString>) -> Self {
        Self {
            program: program.into(),
        }
    }

    /// The program that could not be started.
    pub fn program(&self) -> &OsStr {
        &self.program
    }

    /// A message that tells the user how to install git.
    pub fn message(&self) -> String {
        format!(
            "mgit: cannot run `{}`: git was not found\n{}",
            self.program.to_string_lossy(),
            install_hint()
        )
    }
}

#[cfg(target_os = "macos")]
fn install_hint() -> &'static str {
    "       Install it with `xcode-select --install` or `brew install git`.\n"
}

#[cfg(all(unix, not(target_os = "macos")))]
fn install_hint() -> &'static str {
    "       Install it with your package manager, for example `sudo apt install git`.\n"
}

#[cfg(windows)]
fn install_hint() -> &'static str {
    "       Install it with `winget install --id Git.Git` or from https://git-scm.com/download/win.\n"
}

/// The git invocations that the application needs.
///
/// The trait exists so that the orchestration can be tested without starting
/// processes.
pub trait GitRunner {
    /// The name or path of the git executable.
    fn program(&self) -> &OsStr;

    /// Verify that git can be started at all.
    fn probe(&self) -> Result<(), GitMissing>;

    /// The current branch of a repository, its short commit when it is in a
    /// detached state, or `detached HEAD` when neither can be determined.
    fn branch(&self, repository: &Path) -> String;

    /// Run git inside a repository, with stdio inherited from `mgit`.
    fn run(&self, repository: &Path, args: &[OsString]) -> io::Result<Outcome>;

    /// Run git in the current working directory.
    ///
    /// This deliberately omits `-C` and `--no-pager` so that interactive
    /// commands and the user's pager configuration keep working.
    fn run_here(&self, args: &[OsString]) -> io::Result<Outcome>;
}

/// The real git executable.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SystemGit {
    program: OsString,
}

impl SystemGit {
    /// Use the given program name or path.
    pub fn new(program: impl Into<OsString>) -> Self {
        Self {
            program: program.into(),
        }
    }

    /// Run a command that only needs its standard output.
    fn capture(&self, repository: &Path, args: &[&str]) -> Option<String> {
        let output = Command::new(&self.program)
            .arg("--no-pager")
            .arg("-C")
            .arg(repository)
            .args(args)
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .output()
            .ok()?;

        if !output.status.success() {
            return None;
        }
        let text = String::from_utf8_lossy(&output.stdout).trim().to_owned();
        (!text.is_empty()).then_some(text)
    }
}

impl GitRunner for SystemGit {
    fn program(&self) -> &OsStr {
        &self.program
    }

    fn probe(&self) -> Result<(), GitMissing> {
        let started = Command::new(&self.program)
            .arg("--version")
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .is_ok();
        if started {
            Ok(())
        } else {
            Err(GitMissing::new(self.program.clone()))
        }
    }

    fn branch(&self, repository: &Path) -> String {
        self.capture(repository, &["symbolic-ref", "--short", "HEAD"])
            .or_else(|| self.capture(repository, &["rev-parse", "--short", "HEAD"]))
            .unwrap_or_else(|| "detached HEAD".to_owned())
    }

    fn run(&self, repository: &Path, args: &[OsString]) -> io::Result<Outcome> {
        let mut command = Command::new(&self.program);
        command
            .arg("--no-pager")
            .arg("-C")
            .arg(repository)
            .args(args);
        run_inherited(&mut command)
    }

    fn run_here(&self, args: &[OsString]) -> io::Result<Outcome> {
        let mut command = Command::new(&self.program);
        command.args(args);
        run_inherited(&mut command)
    }
}

/// Run a prepared command with the stdio of this process.
fn run_inherited(command: &mut Command) -> io::Result<Outcome> {
    command
        .stdin(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit());
    let status = command.status()?;
    Ok(Outcome::from_status(&status))
}
