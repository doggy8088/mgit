//! Unit tests for the ANSI painter.

use std::ffi::OsStr;

use mgit::color::{Painter, Style};

#[test]
fn a_disabled_painter_returns_the_text_untouched() {
    let paint = Painter::new(false);
    assert!(!paint.enabled());
    for style in [
        Style::Plain,
        Style::Cyan,
        Style::BoldYellow,
        Style::BoldGreen,
        Style::Red,
        Style::Bold,
    ] {
        assert_eq!(paint.paint(style, "hello"), "hello", "{style:?}");
    }
}

#[test]
fn an_enabled_painter_wraps_the_text_in_escape_sequences() {
    let paint = Painter::new(true);
    assert!(paint.enabled());
    assert_eq!(paint.paint(Style::Cyan, "x"), "\u{1b}[0;36mx\u{1b}[0m");
    assert_eq!(
        paint.paint(Style::BoldYellow, "x"),
        "\u{1b}[1;33mx\u{1b}[0m"
    );
    assert_eq!(paint.paint(Style::BoldGreen, "x"), "\u{1b}[1;32mx\u{1b}[0m");
    assert_eq!(paint.paint(Style::Red, "x"), "\u{1b}[0;31mx\u{1b}[0m");
    assert_eq!(paint.paint(Style::Bold, "x"), "\u{1b}[1mx\u{1b}[0m");
}

#[test]
fn the_plain_style_never_emits_escape_sequences() {
    let paint = Painter::new(true);
    assert_eq!(paint.paint(Style::Plain, "x"), "x");
}

#[test]
fn painting_is_utf8_safe() {
    let paint = Painter::new(true);
    let painted = paint.paint(Style::BoldGreen, "資料夾");
    assert!(painted.contains("資料夾"));
    assert!(painted.starts_with('\u{1b}'));
    assert!(painted.ends_with("\u{1b}[0m"));
}

#[test]
fn os_strings_are_painted_lossily() {
    let paint = Painter::new(false);
    assert_eq!(paint.paint_os(Style::Cyan, OsStr::new("repo")), "repo");
    let paint = Painter::new(true);
    assert_eq!(
        paint.paint_os(Style::Cyan, OsStr::new("repo")),
        "\u{1b}[0;36mrepo\u{1b}[0m"
    );
}
