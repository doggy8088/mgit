//! Unit tests for the rendered output.

use std::ffi::OsStr;
use std::path::Path;

use mgit::color::Painter;
use mgit::report::{
    Failure, GlyphSet, Glyphs, HEADER_WIDTH, Summary, missing_repository_warning, repo_header,
    summary_block,
};

fn plain() -> Painter {
    Painter::new(false)
}

fn colored() -> Painter {
    Painter::new(true)
}

fn eq_rule() -> String {
    "=".repeat(HEADER_WIDTH)
}

#[test]
fn the_rule_is_eighty_characters_wide() {
    assert_eq!(HEADER_WIDTH, 80);
    assert_eq!(eq_rule().len(), 80);
}

#[test]
fn the_plain_header_is_three_lines() {
    let header = repo_header(
        OsStr::new("mgit"),
        "main",
        &plain(),
        &Glyphs::for_set(GlyphSet::Unicode),
    );
    assert_eq!(
        header,
        format!(
            "{}\n📂 Folder: mgit │ Branch: main\n{}\n",
            eq_rule(),
            eq_rule()
        )
    );
}

#[test]
fn the_ascii_header_avoids_non_ascii_glyphs() {
    let header = repo_header(
        OsStr::new("mgit"),
        "main",
        &plain(),
        &Glyphs::for_set(GlyphSet::Ascii),
    );
    assert!(header.is_ascii(), "the ASCII header must be pure ASCII");
    assert_eq!(
        header,
        format!(
            "{}\nFolder: mgit | Branch: main\n{}\n",
            eq_rule(),
            eq_rule()
        )
    );
}

#[test]
fn the_colored_header_uses_the_documented_styles() {
    let header = repo_header(
        OsStr::new("mgit"),
        "main",
        &colored(),
        &Glyphs::for_set(GlyphSet::Unicode),
    );
    assert!(header.starts_with("\u{1b}[0;36m"), "{header:?}");
    assert!(header.contains("\u{1b}[1;33mmgit\u{1b}[0m"), "{header:?}");
    assert!(header.contains("\u{1b}[1;32mmain\u{1b}[0m"), "{header:?}");
    assert!(header.contains("│ Branch: "), "{header:?}");
    assert_eq!(header.matches("\u{1b}[0m").count(), 6, "{header:?}");
    assert_eq!(header.lines().count(), 3);
}

#[test]
fn the_header_keeps_unusual_repository_names_intact() {
    let header = repo_header(
        OsStr::new("my repo with spaces"),
        "feature/ünicode",
        &plain(),
        &Glyphs::for_set(GlyphSet::Unicode),
    );
    assert!(header.contains("my repo with spaces"));
    assert!(header.contains("feature/ünicode"));
}

#[test]
fn the_summary_counts_every_repository() {
    let failures = vec![Failure {
        name: "broken".into(),
        exit_code: 1,
    }];
    let summary = summary_block(
        &Summary {
            succeeded: 2,
            skipped: 0,
            failures: &failures,
        },
        &plain(),
        &Glyphs::for_set(GlyphSet::Unicode),
    );
    assert!(summary.contains("3 repositories"), "{summary}");
    assert!(summary.contains("2 succeeded"), "{summary}");
    assert!(summary.contains("1 failed"), "{summary}");
    assert!(summary.contains("✗ broken (exit code 1)"), "{summary}");
    assert!(summary.ends_with('\n'));
}

#[test]
fn a_successful_summary_mentions_no_failures() {
    let summary = summary_block(
        &Summary {
            succeeded: 3,
            skipped: 0,
            failures: &[],
        },
        &plain(),
        &Glyphs::for_set(GlyphSet::Unicode),
    );
    assert!(summary.contains("3 repositories, 3 succeeded"), "{summary}");
    assert!(!summary.contains("failed"), "{summary}");
}

#[test]
fn the_summary_uses_a_thin_rule() {
    let summary = summary_block(
        &Summary {
            succeeded: 1,
            skipped: 0,
            failures: &[],
        },
        &plain(),
        &Glyphs::for_set(GlyphSet::Unicode),
    );
    let first = summary.lines().next().expect("a rule line");
    assert_eq!(first.chars().count(), HEADER_WIDTH);
    assert!(first.chars().all(|c| c == '─'), "{first}");
    assert!(!first.contains('='));

    let summary = summary_block(
        &Summary {
            succeeded: 1,
            skipped: 0,
            failures: &[],
        },
        &plain(),
        &Glyphs::for_set(GlyphSet::Ascii),
    );
    let first = summary.lines().next().expect("a rule line");
    assert_eq!(first, "-".repeat(HEADER_WIDTH));
}

#[test]
fn the_ascii_summary_is_pure_ascii() {
    let failures = vec![Failure {
        name: "broken".into(),
        exit_code: 128,
    }];
    let summary = summary_block(
        &Summary {
            succeeded: 1,
            skipped: 0,
            failures: &failures,
        },
        &plain(),
        &Glyphs::for_set(GlyphSet::Ascii),
    );
    assert!(summary.is_ascii(), "{summary}");
    assert!(summary.contains("x broken (exit code 128)"), "{summary}");
}

#[test]
fn a_colored_summary_marks_failures_in_red() {
    let failures = vec![Failure {
        name: "broken".into(),
        exit_code: 1,
    }];
    let summary = summary_block(
        &Summary {
            succeeded: 0,
            skipped: 0,
            failures: &failures,
        },
        &colored(),
        &Glyphs::for_set(GlyphSet::Unicode),
    );
    assert!(summary.contains("\u{1b}[0;31m"), "{summary:?}");
    assert!(summary.contains("\u{1b}[0;36m"), "{summary:?}");
}

#[test]
fn skipped_repositories_are_reported() {
    let summary = summary_block(
        &Summary {
            succeeded: 1,
            skipped: 2,
            failures: &[],
        },
        &plain(),
        &Glyphs::for_set(GlyphSet::Unicode),
    );
    assert!(
        summary.contains("3 repositories, 1 succeeded, 2 skipped"),
        "{summary}"
    );
}

#[test]
fn the_missing_repository_warning_explains_what_was_searched() {
    let warning = missing_repository_warning(Path::new("/tmp/work"), 2);
    assert!(warning.contains("/tmp/work"), "{warning}");
    assert!(warning.contains("2"), "{warning}");
    assert!(warning.contains("no Git repository"), "{warning}");
}

#[test]
fn the_warning_survives_non_utf8_paths() {
    #[cfg(unix)]
    let path = {
        use std::ffi::OsString;
        use std::os::unix::ffi::OsStringExt;
        std::path::PathBuf::from(OsString::from_vec(vec![b'/', 0x80]))
    };
    #[cfg(windows)]
    let path = {
        use std::ffi::OsString;
        use std::os::windows::ffi::OsStringExt;
        std::path::PathBuf::from(OsString::from_wide(&[0xD800]))
    };
    let warning = missing_repository_warning(&path, 1);
    assert!(warning.contains("no Git repository"), "{warning}");
}
