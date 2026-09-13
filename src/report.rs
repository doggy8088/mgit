//! Rendering of the human readable output.

use std::ffi::{OsStr, OsString};
use std::path::Path;

use crate::color::{Painter, Style};

/// The width of the rules that frame the sections.
pub const HEADER_WIDTH: usize = 80;

/// The character set that is used for the decorative glyphs.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GlyphSet {
    /// Emoji and box drawing characters.
    Unicode,
    /// Plain ASCII replacements for terminals that cannot render more.
    Ascii,
}

/// The glyphs of one character set.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Glyphs {
    /// The prefix of the repository line, for example `📂 `.
    pub folder: &'static str,
    /// The separator between the repository and the branch, for example `│`.
    pub branch_sep: &'static str,
    /// The marker of a failing repository.
    pub failure: &'static str,
    /// The character used for the thin rule of the summary.
    pub rule: char,
}

impl Glyphs {
    /// The Unicode glyphs.
    pub const UNICODE: Self = Self {
        folder: "📂 ",
        branch_sep: "│",
        failure: "✗",
        rule: '─',
    };

    /// The ASCII glyphs.
    pub const ASCII: Self = Self {
        folder: "",
        branch_sep: "|",
        failure: "x",
        rule: '-',
    };

    /// The glyphs of a character set.
    pub fn for_set(set: GlyphSet) -> Self {
        match set {
            GlyphSet::Unicode => Self::UNICODE,
            GlyphSet::Ascii => Self::ASCII,
        }
    }
}

/// One repository that failed.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Failure {
    /// The directory name of the repository.
    pub name: OsString,
    /// The exit code that git reported.
    pub exit_code: i32,
}

/// The `====` framed header of a repository.
pub fn repo_header(name: &OsStr, branch: &str, paint: &Painter, glyphs: &Glyphs) -> String {
    let rule = "=".repeat(HEADER_WIDTH);
    let mut out = String::with_capacity(4 * HEADER_WIDTH);
    out.push_str(&paint.paint(Style::Cyan, &rule));
    out.push('\n');
    out.push_str(&paint.paint(Style::Cyan, &format!("{}Folder: ", glyphs.folder)));
    out.push_str(&paint.paint_os(Style::BoldYellow, name));
    out.push(' ');
    out.push_str(&paint.paint(Style::Cyan, &format!("{} Branch: ", glyphs.branch_sep)));
    out.push_str(&paint.paint(Style::BoldGreen, branch));
    out.push('\n');
    out.push_str(&paint.paint(Style::Cyan, &rule));
    out.push('\n');
    out
}

/// The counts of one run.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Summary<'a> {
    /// How many repositories finished successfully.
    pub succeeded: usize,
    /// How many repositories were not visited, for example with `--fail-fast`.
    pub skipped: usize,
    /// The repositories that failed.
    pub failures: &'a [Failure],
}

/// The closing summary block.
pub fn summary_block(summary: &Summary<'_>, paint: &Painter, glyphs: &Glyphs) -> String {
    let total = summary.succeeded + summary.skipped + summary.failures.len();
    let rule: String = std::iter::repeat_n(glyphs.rule, HEADER_WIDTH).collect();
    let mut counts = vec![format!(
        "{total} {}, {} succeeded",
        plural(total, "repository", "repositories"),
        summary.succeeded
    )];
    if !summary.failures.is_empty() {
        counts.push(format!("{} failed", summary.failures.len()));
    }
    if summary.skipped > 0 {
        counts.push(format!("{} skipped", summary.skipped));
    }

    let mut out = String::new();
    out.push_str(&paint.paint(Style::Cyan, &rule));
    out.push('\n');

    let style = if summary.failures.is_empty() {
        Style::BoldGreen
    } else {
        Style::Red
    };
    out.push_str(&paint.paint(style, &format!("mgit: {}", counts.join(", "))));
    out.push('\n');

    for failure in summary.failures {
        out.push_str("  ");
        out.push_str(&paint.paint(
            Style::Red,
            &format!("{} {}", glyphs.failure, display_name(&failure.name)),
        ));
        out.push_str(&format!(" (exit code {})\n", failure.exit_code));
    }

    out
}

/// The message that is printed when no repository was found.
pub fn missing_repository_warning(root: &Path, depth: usize) -> String {
    format!(
        "mgit: no Git repository found in `{}` (searched {} {})\n",
        root.display(),
        depth,
        plural(depth, "level", "levels")
    )
}

fn display_name(name: &OsStr) -> String {
    name.to_string_lossy().into_owned()
}

fn plural(count: usize, singular: &str, plural: &str) -> String {
    if count == 1 {
        singular.to_owned()
    } else {
        plural.to_owned()
    }
}
