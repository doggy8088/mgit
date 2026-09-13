//! ANSI escape sequence helpers.

use std::ffi::OsStr;

const RESET: &str = "\u{1b}[0m";

/// The ANSI styles that `mgit` uses.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Style {
    /// No styling at all.
    Plain,
    /// The section rules and labels.
    Cyan,
    /// The repository name.
    BoldYellow,
    /// The branch name.
    BoldGreen,
    /// Errors and failures.
    Red,
    /// Emphasised text.
    Bold,
}

impl Style {
    /// The escape sequence that starts this style, if it has one.
    fn code(self) -> Option<&'static str> {
        match self {
            Style::Plain => None,
            Style::Cyan => Some("\u{1b}[0;36m"),
            Style::BoldYellow => Some("\u{1b}[1;33m"),
            Style::BoldGreen => Some("\u{1b}[1;32m"),
            Style::Red => Some("\u{1b}[0;31m"),
            Style::Bold => Some("\u{1b}[1m"),
        }
    }
}

/// Writes text with ANSI escape sequences, or verbatim when color is off.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Painter {
    enabled: bool,
}

impl Painter {
    /// Create a painter.
    pub fn new(enabled: bool) -> Self {
        Self { enabled }
    }

    /// Whether the painter emits escape sequences.
    pub fn enabled(self) -> bool {
        self.enabled
    }

    /// Paint `text` with `style`.
    pub fn paint(&self, style: Style, text: &str) -> String {
        match (self.enabled, style.code()) {
            (true, Some(code)) => {
                let mut painted = String::with_capacity(text.len() + code.len() + RESET.len());
                painted.push_str(code);
                painted.push_str(text);
                painted.push_str(RESET);
                painted
            }
            _ => text.to_owned(),
        }
    }

    /// Paint an `OsStr`, replacing invalid Unicode with the lossy form.
    pub fn paint_os(&self, style: Style, text: &OsStr) -> String {
        self.paint(style, &text.to_string_lossy())
    }
}
