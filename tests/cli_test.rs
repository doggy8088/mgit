//! Unit tests for the command line parser.

use std::ffi::OsString;

use mgit::cli::{self, Args, AsciiChoice, CliError, ColorChoice, Mode, parse};

fn parse_strs(args: &[&str]) -> Result<Args, CliError> {
    parse(args.iter().map(OsString::from))
}

fn os(value: &str) -> OsString {
    OsString::from(value)
}

#[test]
fn empty_command_line_uses_defaults() {
    let args = parse_strs(&[]).expect("empty command line must parse");
    assert_eq!(args.mode, Mode::Run);
    assert_eq!(args.depth, cli::DEFAULT_DEPTH);
    assert_eq!(args.depth, 1);
    assert!(!args.quiet);
    assert_eq!(args.color, ColorChoice::Auto);
    assert_eq!(args.ascii, AsciiChoice::Auto);
    assert!(!args.fail_fast);
    assert!(!args.summary);
    assert!(!args.allow_empty);
    assert!(args.git_args.is_empty());
    assert_eq!(
        args.effective_git_args(),
        vec![os("status"), os("-s")],
        "the default git command must stay `status -s`"
    );
}

#[test]
fn trailing_arguments_become_the_git_command() {
    let args = parse_strs(&["pull"]).expect("parse");
    assert_eq!(args.mode, Mode::Run);
    assert_eq!(args.git_args, vec![os("pull")]);
    assert_eq!(args.effective_git_args(), vec![os("pull")]);
}

#[test]
fn everything_after_the_git_subcommand_is_forwarded_verbatim() {
    let args = parse_strs(&["log", "-n", "1", "--oneline", "--", "path"]).expect("parse");
    assert_eq!(
        args.git_args,
        vec![
            os("log"),
            os("-n"),
            os("1"),
            os("--oneline"),
            os("--"),
            os("path")
        ]
    );
}

#[test]
fn mgit_flags_are_not_reinterpreted_after_the_git_subcommand() {
    let args = parse_strs(&["status", "--quiet", "-q", "--depth", "3"]).expect("parse");
    assert!(!args.quiet);
    assert_eq!(args.depth, 1);
    assert_eq!(
        args.git_args,
        vec![
            os("status"),
            os("--quiet"),
            os("-q"),
            os("--depth"),
            os("3")
        ]
    );
}

#[test]
fn quiet_flag_can_be_short_or_long() {
    for flag in ["--quiet", "-q"] {
        let args = parse_strs(&[flag, "status"]).expect("parse");
        assert!(args.quiet, "{flag} must enable quiet mode");
        assert_eq!(args.git_args, vec![os("status")]);
    }
}

#[test]
fn repeated_flags_are_idempotent() {
    let args = parse_strs(&["-q", "--quiet", "-q"]).expect("parse");
    assert!(args.quiet);
}

#[test]
fn depth_accepts_all_documented_spellings() {
    for argv in [
        vec!["--depth", "3", "log"],
        vec!["--depth=3", "log"],
        vec!["-d", "3", "log"],
        vec!["-d3", "log"],
    ] {
        let args = parse_strs(&argv).expect("parse");
        assert_eq!(args.depth, 3, "{argv:?} must set the depth to 3");
        assert_eq!(args.git_args, vec![os("log")]);
    }
}

#[test]
fn depth_one_is_the_smallest_allowed_value() {
    let args = parse_strs(&["--depth=1"]).expect("parse");
    assert_eq!(args.depth, 1);
}

#[test]
fn depth_rejects_zero_and_garbage() {
    for argv in [
        vec!["--depth=0"],
        vec!["--depth", "0"],
        vec!["-d0"],
        vec!["--depth=abc"],
        vec!["--depth=-2"],
        vec!["--depth=1.5"],
        vec!["--depth=99999999999999999999999"],
    ] {
        let err = parse_strs(&argv).expect_err("{argv:?} must be rejected");
        assert!(
            err.message().contains("depth"),
            "{argv:?} must report the depth option, got: {}",
            err.message()
        );
    }
}

#[test]
fn depth_requires_a_value() {
    let err = parse_strs(&["--depth"]).expect_err("missing value");
    assert!(err.message().contains("depth"));
    let err = parse_strs(&["-d"]).expect_err("missing value");
    assert!(err.message().contains("depth"));
}

#[test]
fn color_accepts_all_documented_spellings() {
    for (argv, expected) in [
        (vec!["--color", "always"], ColorChoice::Always),
        (vec!["--color=always"], ColorChoice::Always),
        (vec!["--color=never"], ColorChoice::Never),
        (vec!["--color", "auto"], ColorChoice::Auto),
        (vec!["--no-color"], ColorChoice::Never),
    ] {
        let args = parse_strs(&argv).expect("parse");
        assert_eq!(args.color, expected, "{argv:?}");
    }
}

#[test]
fn color_rejects_unknown_values() {
    let err = parse_strs(&["--color=bogus"]).expect_err("bogus color");
    assert!(err.message().contains("color"));
    let err = parse_strs(&["--color"]).expect_err("missing color value");
    assert!(err.message().contains("color"));
}

#[test]
fn color_is_case_insensitive() {
    let args = parse_strs(&["--color=ALWAYS"]).expect("parse");
    assert_eq!(args.color, ColorChoice::Always);
}

#[test]
fn ascii_flag_forces_ascii_glyphs() {
    let args = parse_strs(&["--ascii"]).expect("parse");
    assert_eq!(args.ascii, AsciiChoice::Always);
}

#[test]
fn help_can_be_short_or_long_and_wins_over_everything_else() {
    for argv in [
        vec!["--help"],
        vec!["-h"],
        vec!["--version", "--help"],
        vec!["--depth=2", "-h", "log"],
    ] {
        let args = parse_strs(&argv).expect("parse");
        assert_eq!(args.mode, Mode::Help, "{argv:?}");
    }
}

#[test]
fn help_requested_after_the_git_subcommand_is_forwarded_to_git() {
    let args = parse_strs(&["log", "-h"]).expect("parse");
    assert_eq!(args.mode, Mode::Run);
    assert_eq!(args.git_args, vec![os("log"), os("-h")]);
}

#[test]
fn version_can_be_short_or_long() {
    for argv in [vec!["--version"], vec!["-V"]] {
        let args = parse_strs(&argv).expect("parse");
        assert_eq!(args.mode, Mode::Version, "{argv:?}");
    }
}

#[test]
fn help_wins_over_version() {
    let args = parse_strs(&["--version", "--help"]).expect("parse");
    assert_eq!(args.mode, Mode::Help);
    let args = parse_strs(&["--help", "--version"]).expect("parse");
    assert_eq!(args.mode, Mode::Help);
}

#[test]
fn list_can_be_short_or_long() {
    for argv in [vec!["--list"], vec!["-l"]] {
        let args = parse_strs(&argv).expect("parse");
        assert_eq!(args.mode, Mode::List, "{argv:?}");
    }
}

#[test]
fn list_keeps_the_other_options() {
    let args = parse_strs(&["-q", "--depth=2", "--list"]).expect("parse");
    assert_eq!(args.mode, Mode::List);
    assert!(args.quiet);
    assert_eq!(args.depth, 2);
}

#[test]
fn execution_flags_are_parsed() {
    let args = parse_strs(&["--fail-fast", "--summary", "--allow-empty", "pull"]).expect("parse");
    assert!(args.fail_fast);
    assert!(args.summary);
    assert!(args.allow_empty);
    assert_eq!(args.git_args, vec![os("pull")]);
}

#[test]
fn keep_going_is_the_default_and_clears_fail_fast() {
    let args = parse_strs(&["--fail-fast", "--keep-going"]).expect("parse");
    assert!(!args.fail_fast);
    let args = parse_strs(&["--keep-going", "-k"]).expect("parse");
    assert!(!args.fail_fast);
}

#[test]
fn double_dash_forwards_everything_verbatim() {
    let args = parse_strs(&["--", "--version", "-q", "--depth=7"]).expect("parse");
    assert_eq!(args.mode, Mode::Run);
    assert_eq!(args.depth, 1);
    assert!(!args.quiet);
    assert_eq!(
        args.git_args,
        vec![os("--version"), os("-q"), os("--depth=7")]
    );
}

#[test]
fn bare_double_dash_falls_back_to_the_default_command() {
    let args = parse_strs(&["--"]).expect("parse");
    assert!(args.git_args.is_empty());
    assert_eq!(args.effective_git_args(), vec![os("status"), os("-s")]);
}

#[test]
fn double_dash_after_options_keeps_them() {
    let args = parse_strs(&["--depth", "2", "--"]).expect("parse");
    assert_eq!(args.depth, 2);
    assert!(args.git_args.is_empty());
}

#[test]
fn unknown_long_options_are_forwarded_to_git() {
    let args = parse_strs(&["--color=always", "--nope", "status"]).expect("parse");
    assert_eq!(args.color, ColorChoice::Always);
    assert_eq!(args.git_args, vec![os("--nope"), os("status")]);

    let args = parse_strs(&["--git-dir=/tmp/x", "status"]).expect("parse");
    assert_eq!(args.git_args, vec![os("--git-dir=/tmp/x"), os("status")]);
}

#[test]
fn unknown_short_options_are_forwarded_to_git() {
    let args = parse_strs(&["-c", "core.pager=cat", "status"]).expect("parse");
    assert_eq!(
        args.git_args,
        vec![os("-c"), os("core.pager=cat"), os("status")]
    );
    let args = parse_strs(&["-x"]).expect("parse");
    assert_eq!(args.git_args, vec![os("-x")]);
}

#[test]
fn a_lone_dash_is_forwarded_to_git() {
    let args = parse_strs(&["-"]).expect("parse");
    assert_eq!(args.git_args, vec![os("-")]);
}

#[test]
fn flags_may_be_followed_by_git_options_that_look_like_flags() {
    let args = parse_strs(&["--depth=2", "-n", "1"]).expect("parse");
    assert_eq!(args.depth, 2);
    assert_eq!(args.git_args, vec![os("-n"), os("1")]);
}

#[test]
fn non_utf8_arguments_reach_git_unchanged() {
    // A non UTF-8 argument cannot be a mgit flag, so it starts the git command.
    let weird = non_utf8_os_string();
    let args = parse(vec![weird.clone(), os("status")]).expect("parse");
    assert_eq!(args.git_args, vec![weird, os("status")]);
}

#[test]
fn non_utf8_options_after_the_subcommand_are_kept() {
    let weird = non_utf8_os_string();
    let args = parse(vec![os("log"), weird.clone()]).expect("parse");
    assert_eq!(args.git_args, vec![os("log"), weird]);
}

#[cfg(unix)]
fn non_utf8_os_string() -> OsString {
    use std::os::unix::ffi::OsStringExt;
    OsString::from_vec(vec![b'r', 0x80, b'x'])
}

#[cfg(windows)]
fn non_utf8_os_string() -> OsString {
    use std::os::windows::ffi::OsStringExt;
    // An unpaired UTF-16 surrogate cannot be represented as UTF-8.
    OsString::from_wide(&[0xD800, 0x0061])
}

#[test]
fn help_text_documents_every_option() {
    let help = cli::help_text();
    for needle in [
        "USAGE:",
        "--help",
        "--version",
        "--list",
        "--depth",
        "--quiet",
        "--color",
        "--ascii",
        "--fail-fast",
        "--keep-going",
        "--summary",
        "--allow-empty",
        "EXIT CODES",
        "ENVIRONMENT",
    ] {
        assert!(help.contains(needle), "the help text must mention {needle}");
    }
    assert!(help.contains(cli::PROGRAM));
}

#[test]
fn help_text_is_plain_ascii() {
    assert!(
        cli::help_text().is_ascii(),
        "the help text must survive every console"
    );
}

#[test]
fn help_text_lists_the_exit_codes() {
    let help = cli::help_text();
    for code in ["0", "1", "2", "127", "130"] {
        assert!(help.contains(code), "exit code {code} must be documented");
    }
}

#[test]
fn version_text_contains_the_program_and_version() {
    assert_eq!(cli::version_text(), format!("mgit {}", cli::VERSION));
    assert_eq!(cli::VERSION, env!("CARGO_PKG_VERSION"));
}

#[test]
fn error_display_matches_the_message() {
    let err = CliError::new("boom");
    assert_eq!(err.to_string(), "boom");
    assert_eq!(err.message(), "boom");
}

#[test]
fn parsed_args_are_comparable_and_cloneable() {
    let args = parse_strs(&["status"]).expect("parse");
    let clone = args.clone();
    assert_eq!(args, clone);
    assert!(format!("{args:?}").contains("Args"));
}
