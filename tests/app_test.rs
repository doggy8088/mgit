//! Unit tests for the orchestration, driven by a scripted fake git.

use std::cell::RefCell;
use std::collections::BTreeMap;
use std::ffi::{OsStr, OsString};
use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};

use mgit::app::App;
use mgit::cli::{self, Args};
use mgit::color::Painter;
use mgit::gitcmd::{GitMissing, GitRunner, Outcome};
use mgit::report::{GlyphSet, Glyphs};
use tempfile::TempDir;

#[derive(Debug)]
struct FakeGit {
    missing: bool,
    branches: BTreeMap<PathBuf, String>,
    outcomes: BTreeMap<String, Outcome>,
    default_outcome: Outcome,
    here_outcome: Outcome,
    calls: RefCell<Vec<String>>,
    arguments: RefCell<Vec<Vec<OsString>>>,
    here_calls: RefCell<Vec<Vec<OsString>>>,
}

impl Default for FakeGit {
    fn default() -> Self {
        Self {
            missing: false,
            branches: BTreeMap::new(),
            outcomes: BTreeMap::new(),
            default_outcome: Outcome::Exited(0),
            here_outcome: Outcome::Exited(0),
            calls: RefCell::new(Vec::new()),
            arguments: RefCell::new(Vec::new()),
            here_calls: RefCell::new(Vec::new()),
        }
    }
}

impl FakeGit {
    fn calls(&self) -> Vec<String> {
        self.calls.borrow().clone()
    }

    fn arguments(&self) -> Vec<Vec<OsString>> {
        self.arguments.borrow().clone()
    }

    fn here_calls(&self) -> Vec<Vec<OsString>> {
        self.here_calls.borrow().clone()
    }
}

impl GitRunner for FakeGit {
    fn program(&self) -> &OsStr {
        OsStr::new("git")
    }

    fn probe(&self) -> Result<(), GitMissing> {
        if self.missing {
            Err(GitMissing::new("git"))
        } else {
            Ok(())
        }
    }

    fn branch(&self, repository: &Path) -> String {
        self.branches
            .get(repository)
            .cloned()
            .unwrap_or_else(|| "main".to_owned())
    }

    fn run(&self, repository: &Path, args: &[OsString]) -> io::Result<Outcome> {
        let name = repository
            .file_name()
            .map(|name| name.to_string_lossy().into_owned())
            .unwrap_or_default();
        self.calls.borrow_mut().push(name.clone());
        self.arguments.borrow_mut().push(args.to_vec());
        if self.missing {
            return Err(io::Error::new(
                io::ErrorKind::NotFound,
                "git is not available",
            ));
        }
        Ok(self
            .outcomes
            .get(&name)
            .copied()
            .unwrap_or(self.default_outcome))
    }

    fn run_here(&self, args: &[OsString]) -> io::Result<Outcome> {
        self.here_calls.borrow_mut().push(args.to_vec());
        if self.missing {
            return Err(io::Error::new(
                io::ErrorKind::NotFound,
                "git is not available",
            ));
        }
        Ok(self.here_outcome)
    }
}

struct Run {
    code: i32,
    out: String,
    err: String,
}

fn run_with(root: &Path, args: &Args, runner: &FakeGit, paint: Painter, glyphs: Glyphs) -> Run {
    let mut out: Vec<u8> = Vec::new();
    let mut err: Vec<u8> = Vec::new();
    let code = {
        let mut app = App::new(args, root.to_path_buf(), runner, &mut out, &mut err);
        app.paint = paint;
        app.glyphs = glyphs;
        app.run()
    };
    Run {
        code,
        out: String::from_utf8_lossy(&out).into_owned(),
        err: String::from_utf8_lossy(&err).into_owned(),
    }
}

fn run(root: &Path, argv: &[&str], runner: &FakeGit) -> Run {
    let args = parse(argv);
    run_with(
        root,
        &args,
        runner,
        Painter::new(false),
        Glyphs::for_set(GlyphSet::Unicode),
    )
}

fn parse(argv: &[&str]) -> Args {
    cli::parse(argv.iter().map(OsString::from)).expect("the arguments must parse")
}

fn temp() -> TempDir {
    TempDir::new().expect("temporary directory")
}

fn make_repo(path: &Path) {
    fs::create_dir_all(path.join(".git")).expect("create .git");
}

const WARNING: &str = "no Git repository";

#[test]
fn help_is_printed_and_succeeds() {
    let temp = temp();
    let run = run(temp.path(), &["--help"], &FakeGit::default());
    assert_eq!(run.code, 0);
    assert!(run.out.contains("USAGE:"));
    assert!(run.err.is_empty());
}

#[test]
fn version_is_printed_and_succeeds() {
    let temp = temp();
    let run = run(temp.path(), &["--version"], &FakeGit::default());
    assert_eq!(run.code, 0);
    assert_eq!(run.out.trim(), format!("mgit {}", cli::VERSION));
}

#[test]
fn every_repository_gets_a_header_and_the_command() {
    let temp = temp();
    make_repo(&temp.path().join("alpha"));
    make_repo(&temp.path().join("beta"));
    let fake = FakeGit::default();

    let run = run(temp.path(), &[], &fake);

    assert_eq!(run.code, 0, "{}", run.err);
    assert_eq!(fake.calls(), vec!["alpha", "beta"]);
    assert!(
        run.out.contains("Folder: alpha │ Branch: main"),
        "{}",
        run.out
    );
    assert!(
        run.out.contains("Folder: beta │ Branch: main"),
        "{}",
        run.out
    );
    assert!(run.err.is_empty());
}

#[test]
fn the_default_command_is_status_short() {
    let temp = temp();
    make_repo(&temp.path().join("alpha"));
    let fake = FakeGit::default();

    let run = run(temp.path(), &[], &fake);
    assert_eq!(run.code, 0);

    assert_eq!(
        fake.arguments(),
        vec![vec![OsString::from("status"), OsString::from("-s")]]
    );
}

#[test]
fn git_arguments_are_forwarded_verbatim() {
    let temp = temp();
    make_repo(&temp.path().join("alpha"));
    let fake = FakeGit::default();

    let run = run(temp.path(), &["log", "--oneline", "-n", "1"], &fake);
    assert_eq!(run.code, 0);
    assert_eq!(
        fake.arguments(),
        vec![vec![
            OsString::from("log"),
            OsString::from("--oneline"),
            OsString::from("-n"),
            OsString::from("1"),
        ]]
    );
}

#[test]
fn quiet_suppresses_the_headers() {
    let temp = temp();
    make_repo(&temp.path().join("alpha"));
    let fake = FakeGit::default();

    let run = run(temp.path(), &["--quiet"], &fake);
    assert_eq!(run.code, 0);
    assert!(!run.out.contains("Folder:"), "{}", run.out);
    assert_eq!(fake.calls(), vec!["alpha"]);
}

#[test]
fn the_branch_is_asked_for_and_rendered() {
    let temp = temp();
    let repository = temp.path().join("alpha");
    make_repo(&repository);
    let mut fake = FakeGit::default();
    fake.branches
        .insert(repository, "feature/rust-rewrite".to_owned());

    let run = run(temp.path(), &[], &fake);
    assert!(
        run.out.contains("Branch: feature/rust-rewrite"),
        "{}",
        run.out
    );
}

#[test]
fn a_failing_repository_reports_the_first_exit_code() {
    let temp = temp();
    make_repo(&temp.path().join("alpha"));
    make_repo(&temp.path().join("beta"));
    make_repo(&temp.path().join("gamma"));
    let mut fake = FakeGit::default();
    fake.outcomes.insert("beta".to_owned(), Outcome::Exited(3));

    let run = run(temp.path(), &[], &fake);

    assert_eq!(run.code, 3);
    assert_eq!(fake.calls(), vec!["alpha", "beta", "gamma"]);
    assert!(run.err.contains("1 failed"), "{}", run.err);
    assert!(run.err.contains("beta"), "{}", run.err);
    // The summary of a failed run goes to stderr, not into the results.
    assert!(!run.out.contains("failed"), "{}", run.out);
}

#[test]
fn the_summary_is_written_to_stdout_when_it_is_requested() {
    let temp = temp();
    make_repo(&temp.path().join("alpha"));
    let run = run(temp.path(), &["--summary"], &FakeGit::default());
    assert_eq!(run.code, 0);
    assert!(run.out.contains("1 repository, 1 succeeded"), "{}", run.out);
    assert!(run.err.is_empty());
}

#[test]
fn fail_fast_stops_after_the_first_failure() {
    let temp = temp();
    make_repo(&temp.path().join("alpha"));
    make_repo(&temp.path().join("beta"));
    make_repo(&temp.path().join("gamma"));
    let mut fake = FakeGit::default();
    fake.outcomes.insert("alpha".to_owned(), Outcome::Exited(1));

    let run = run(temp.path(), &["--fail-fast"], &fake);

    assert_eq!(run.code, 1);
    assert_eq!(fake.calls(), vec!["alpha"]);
    assert!(run.err.contains("2 skipped"), "{}", run.err);
}

#[test]
fn keep_going_is_the_default() {
    let temp = temp();
    for name in ["alpha", "beta", "gamma"] {
        make_repo(&temp.path().join(name));
    }
    let mut fake = FakeGit::default();
    fake.outcomes.insert("alpha".to_owned(), Outcome::Exited(1));

    let run = run(temp.path(), &["-k"], &fake);
    assert_eq!(run.code, 1);
    assert_eq!(fake.calls(), vec!["alpha", "beta", "gamma"]);
    assert!(run.err.contains("3 repositories"), "{}", run.err);
}

#[test]
fn an_interrupt_stops_the_run_immediately() {
    let temp = temp();
    make_repo(&temp.path().join("alpha"));
    make_repo(&temp.path().join("beta"));
    let mut fake = FakeGit::default();
    fake.outcomes
        .insert("alpha".to_owned(), Outcome::Signaled(2));

    let run = run(temp.path(), &[], &fake);

    assert_eq!(run.code, 130);
    assert_eq!(fake.calls(), vec!["alpha"]);
}

#[test]
fn a_missing_git_exits_with_127() {
    let temp = temp();
    make_repo(&temp.path().join("alpha"));
    let fake = FakeGit {
        missing: true,
        ..FakeGit::default()
    };

    let run = run(temp.path(), &[], &fake);

    assert_eq!(run.code, 127);
    assert!(run.err.contains("git"), "{}", run.err);
    assert!(!run.out.contains("Folder:"), "{}", run.out);
    assert!(fake.calls().is_empty(), "no repository must be visited");
}

#[test]
fn a_missing_git_exits_with_127_in_passthrough_mode() {
    let temp = temp();
    make_repo(temp.path());
    let fake = FakeGit {
        missing: true,
        ..FakeGit::default()
    };

    let run = run(temp.path(), &["pull"], &fake);
    assert_eq!(run.code, 127);
    assert!(run.err.contains("git"), "{}", run.err);
}

#[test]
fn an_empty_directory_warns_and_fails() {
    let temp = temp();
    let run = run(temp.path(), &[], &FakeGit::default());
    assert_eq!(run.code, 1);
    assert!(run.err.contains(WARNING), "{}", run.err);
    assert!(run.out.is_empty());
}

#[test]
fn allow_empty_makes_an_empty_directory_successful() {
    let temp = temp();
    let run = run(temp.path(), &["--allow-empty"], &FakeGit::default());
    assert_eq!(run.code, 0);
    assert!(run.err.contains(WARNING), "{}", run.err);
}

#[test]
fn the_current_directory_is_used_when_it_is_a_repository() {
    let temp = temp();
    make_repo(temp.path());
    let fake = FakeGit {
        here_outcome: Outcome::Exited(5),
        ..FakeGit::default()
    };

    let run = run(temp.path(), &["pull", "--ff-only"], &fake);

    assert_eq!(run.code, 5);
    assert_eq!(
        fake.here_calls(),
        vec![vec![OsString::from("pull"), OsString::from("--ff-only")]]
    );
    assert!(fake.calls().is_empty(), "no subdirectory may be visited");
    assert!(!run.out.contains("Folder:"), "{}", run.out);
    assert!(run.err.is_empty(), "{}", run.err);
}

#[test]
fn subdirectories_win_over_the_current_directory() {
    let temp = temp();
    make_repo(temp.path());
    make_repo(&temp.path().join("alpha"));
    let fake = FakeGit::default();

    let run = run(temp.path(), &[], &fake);
    assert_eq!(run.code, 0);
    assert_eq!(fake.calls(), vec!["alpha"]);
    assert!(fake.here_calls().is_empty());
}

#[test]
fn list_prints_the_absolute_paths() {
    let temp = temp();
    make_repo(&temp.path().join("alpha"));
    make_repo(&temp.path().join("beta"));
    let fake = FakeGit::default();

    let run = run(temp.path(), &["--list"], &fake);

    assert_eq!(run.code, 0);
    let lines: Vec<&str> = run.out.lines().collect();
    assert_eq!(lines.len(), 2, "{}", run.out);
    assert!(lines[0].ends_with("alpha"), "{}", run.out);
    assert!(lines[1].ends_with("beta"), "{}", run.out);
    assert!(fake.calls().is_empty(), "--list must not run git");
}

#[test]
fn list_of_an_empty_directory_warns_and_fails() {
    let temp = temp();
    let without_repositories = run(temp.path(), &["--list"], &FakeGit::default());
    assert_eq!(without_repositories.code, 1);
    assert!(
        without_repositories.err.contains(WARNING),
        "{}",
        without_repositories.err
    );

    let allowed = run(
        temp.path(),
        &["--list", "--allow-empty"],
        &FakeGit::default(),
    );
    assert_eq!(allowed.code, 0);
}

#[test]
fn list_includes_the_current_directory_when_it_is_a_repository() {
    let temp = temp();
    make_repo(temp.path());
    let run = run(temp.path(), &["--list"], &FakeGit::default());
    assert_eq!(run.code, 0);
    assert_eq!(run.out.trim(), temp.path().to_string_lossy());
}

#[test]
fn the_depth_is_forwarded_to_the_search() {
    let temp = temp();
    make_repo(&temp.path().join("group/nested"));
    let fake = FakeGit::default();

    let deep = run(temp.path(), &["--depth", "2"], &fake);
    assert_eq!(deep.code, 0, "{}", deep.err);
    assert_eq!(fake.calls(), vec!["nested"]);

    let shallow = run(temp.path(), &[], &fake);
    assert_eq!(shallow.code, 1, "the default depth must not find it");
}

#[test]
fn colors_are_used_when_the_painter_is_enabled() {
    let temp = temp();
    make_repo(&temp.path().join("alpha"));
    let args = parse(&[]);

    let run = run_with(
        temp.path(),
        &args,
        &FakeGit::default(),
        Painter::new(true),
        Glyphs::for_set(GlyphSet::Unicode),
    );

    assert!(run.out.contains("\u{1b}[0;36m"), "{}", run.out);
    assert!(
        run.out.contains("\u{1b}[1;33malpha\u{1b}[0m"),
        "{}",
        run.out
    );
}

#[test]
fn ascii_glyphs_are_used_when_they_are_selected() {
    let temp = temp();
    make_repo(&temp.path().join("alpha"));
    let args = parse(&[]);

    let run = run_with(
        temp.path(),
        &args,
        &FakeGit::default(),
        Painter::new(false),
        Glyphs::for_set(GlyphSet::Ascii),
    );

    assert!(run.out.is_ascii(), "{}", run.out);
    assert!(
        run.out.contains("Folder: alpha | Branch: main"),
        "{}",
        run.out
    );
}

#[test]
fn a_closed_stdout_stops_the_run_quietly() {
    struct Closed;

    impl Write for Closed {
        fn write(&mut self, _buffer: &[u8]) -> io::Result<usize> {
            Err(io::Error::new(io::ErrorKind::BrokenPipe, "closed"))
        }
        fn flush(&mut self) -> io::Result<()> {
            Err(io::Error::new(io::ErrorKind::BrokenPipe, "closed"))
        }
    }

    let temp = temp();
    make_repo(&temp.path().join("alpha"));
    let args = parse(&[]);
    let fake = FakeGit::default();
    let mut out = Closed;
    let mut err: Vec<u8> = Vec::new();

    let code = {
        let mut app = App::new(&args, temp.path().to_path_buf(), &fake, &mut out, &mut err);
        app.run()
    };

    assert_eq!(
        code, 141,
        "a closed pipe must not be reported as a git failure"
    );
    assert!(fake.calls().is_empty());
}

#[test]
fn an_unwritable_stderr_is_not_fatal() {
    struct Failing;

    impl Write for Failing {
        fn write(&mut self, _buffer: &[u8]) -> io::Result<usize> {
            Err(io::Error::other("nope"))
        }
        fn flush(&mut self) -> io::Result<()> {
            Ok(())
        }
    }

    let temp = temp();
    let args = parse(&[]);
    let fake = FakeGit::default();
    let mut out: Vec<u8> = Vec::new();
    let mut err = Failing;

    let code = {
        let mut app = App::new(&args, temp.path().to_path_buf(), &fake, &mut out, &mut err);
        app.run()
    };

    assert_ne!(code, 0, "an empty directory still fails");
}
