//! Wiring: from parsed arguments to an exit code.

use std::io::{self, Write};
use std::path::PathBuf;

use crate::cli::{self, Args, Mode};
use crate::color::Painter;
use crate::discovery::{self, Repository};
use crate::gitcmd::GitRunner;
use crate::report::{self, Failure, Glyphs, Summary};

/// The exit codes that `mgit` documents.
pub mod exit {
    /// Everything succeeded.
    pub const OK: i32 = 0;
    /// A repository failed, or no repository was found.
    pub const FAILURE: i32 = 1;
    /// The command line could not be parsed.
    pub const USAGE: i32 = 2;
    /// The git executable could not be started.
    pub const NOT_FOUND: i32 = 127;
    /// The run was interrupted.
    pub const INTERRUPTED: i32 = 130;
    /// The consumer of the output went away.
    pub const BROKEN_PIPE: i32 = 141;
}

/// One run of `mgit`.
pub struct App<'a> {
    /// The parsed command line.
    pub args: &'a Args,
    /// The directory that is searched for repositories.
    pub root: PathBuf,
    /// How the output is styled.
    pub paint: Painter,
    /// Which glyphs the output uses.
    pub glyphs: Glyphs,
    /// How git is called.
    pub runner: &'a dyn GitRunner,
    /// Where the results go.
    pub out: &'a mut dyn Write,
    /// Where the diagnostics go.
    pub err: &'a mut dyn Write,
}

impl<'a> App<'a> {
    /// Create an application from its parts, with plain styling.
    pub fn new(
        args: &'a Args,
        root: PathBuf,
        runner: &'a dyn GitRunner,
        out: &'a mut dyn Write,
        err: &'a mut dyn Write,
    ) -> Self {
        Self {
            args,
            root,
            paint: Painter::new(false),
            glyphs: Glyphs::UNICODE,
            runner,
            out,
            err,
        }
    }

    /// Run and return the process exit code.
    pub fn run(&mut self) -> i32 {
        match self.run_inner() {
            Ok(code) => code,
            Err(error) if error.kind() == io::ErrorKind::BrokenPipe => exit::BROKEN_PIPE,
            Err(error) => {
                // A diagnostic that cannot be written must not turn into a
                // panic, so the error is swallowed here.
                let _ = writeln!(self.err, "mgit: {error}");
                exit::FAILURE
            }
        }
    }

    fn run_inner(&mut self) -> io::Result<i32> {
        match self.args.mode {
            Mode::Help => {
                self.print(&cli::help_text())?;
                return Ok(exit::OK);
            }
            Mode::Version => {
                self.print(&format!("{}\n", cli::version_text()))?;
                return Ok(exit::OK);
            }
            Mode::List | Mode::Run => {}
        }

        let found = discovery::discover(&self.root, self.args.depth)?;
        for warning in &found.warnings {
            self.eprint(warning)?;
        }

        if found.repositories.is_empty() {
            return self.without_repositories();
        }

        if self.args.mode == Mode::List {
            for repository in &found.repositories {
                self.print(&format!("{}\n", repository.path.display()))?;
            }
            return Ok(exit::OK);
        }

        self.run_repositories(&found.repositories)
    }

    /// Handle a directory that holds no repository of its own.
    fn without_repositories(&mut self) -> io::Result<i32> {
        let root_is_repository = discovery::is_repository(&self.root);

        if self.args.mode == Mode::List {
            if root_is_repository {
                self.print(&format!("{}\n", self.root.display()))?;
                return Ok(exit::OK);
            }
        } else if root_is_repository {
            // Without subdirectories `mgit` behaves like plain `git`.
            return self.run_here();
        }

        self.eprint(&report::missing_repository_warning(
            &self.root,
            self.args.depth,
        ))?;
        Ok(if self.args.allow_empty {
            exit::OK
        } else {
            exit::FAILURE
        })
    }

    /// Run git in the current directory, exactly like the shell version did.
    fn run_here(&mut self) -> io::Result<i32> {
        self.flush()?;
        match self.runner.run_here(&self.args.effective_git_args()) {
            Ok(outcome) if outcome.is_interrupt() => Ok(exit::INTERRUPTED),
            Ok(outcome) => Ok(outcome.exit_code()),
            Err(error) if error.kind() == io::ErrorKind::NotFound => self.report_missing_git(),
            Err(error) => Err(error),
        }
    }

    /// Run git in every repository that was found.
    fn run_repositories(&mut self, repositories: &[Repository]) -> io::Result<i32> {
        let git_args = self.args.effective_git_args();

        if let Err(missing) = self.runner.probe() {
            self.eprint(&missing.message())?;
            return Ok(exit::NOT_FOUND);
        }

        let mut succeeded = 0usize;
        let mut failures: Vec<Failure> = Vec::new();
        let mut first_failure: Option<i32> = None;

        for repository in repositories {
            if !self.args.quiet {
                let branch = self.runner.branch(&repository.path);
                let header =
                    report::repo_header(&repository.name, &branch, &self.paint, &self.glyphs);
                self.print(&header)?;
                self.flush()?;
            }

            let outcome = match self.runner.run(&repository.path, &git_args) {
                Ok(outcome) => outcome,
                Err(error) if error.kind() == io::ErrorKind::NotFound => {
                    return self.report_missing_git();
                }
                Err(error) => return Err(error),
            };

            // Ctrl+C is reported to the whole process group, so a signalled
            // git means "stop now" rather than "this repository failed".
            if outcome.is_interrupt() {
                return Ok(exit::INTERRUPTED);
            }

            self.print("\n")?;
            if outcome.exit_code() == 0 {
                succeeded += 1;
            } else {
                let code = outcome.exit_code();
                first_failure.get_or_insert(code);
                failures.push(Failure {
                    name: repository.name.clone(),
                    exit_code: code,
                });
                if self.args.fail_fast {
                    break;
                }
            }
        }

        let skipped = repositories.len() - succeeded - failures.len();
        if self.args.summary || !failures.is_empty() {
            let block = report::summary_block(
                &Summary {
                    succeeded,
                    skipped,
                    failures: &failures,
                },
                &self.paint,
                &self.glyphs,
            );
            if self.args.summary {
                self.print(&block)?;
            } else {
                self.eprint(&block)?;
            }
        }

        Ok(first_failure.unwrap_or(exit::OK))
    }

    fn report_missing_git(&mut self) -> io::Result<i32> {
        let missing = crate::gitcmd::GitMissing::new(self.runner.program().to_os_string());
        self.eprint(&missing.message())?;
        Ok(exit::NOT_FOUND)
    }

    fn print(&mut self, text: &str) -> io::Result<()> {
        self.out.write_all(text.as_bytes())
    }

    fn eprint(&mut self, text: &str) -> io::Result<()> {
        self.err.write_all(text.as_bytes())
    }

    fn flush(&mut self) -> io::Result<()> {
        self.out.flush()
    }
}
