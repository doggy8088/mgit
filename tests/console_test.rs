//! Unit tests for the terminal capability decisions.
//!
//! Every decision is a pure function of the parsed options, the environment and
//! a [`Capabilities`] value, so the behaviour is identical on every platform
//! and can be tested without a real terminal.

use mgit::cli::{AsciiChoice, ColorChoice};
use mgit::console::{Capabilities, Platform, decide_color, decide_glyphs, locale_supports_utf8};
use mgit::env::EnvVars;
use mgit::report::GlyphSet;

fn vars(pairs: &[(&str, &str)]) -> EnvVars {
    EnvVars::from_iter(pairs.iter().map(|(key, value)| (*key, *value)))
}

fn unix(tty: bool) -> Capabilities {
    Capabilities {
        platform: Platform::Unix,
        stdout_is_terminal: tty,
        ansi_supported: true,
        utf8_console: true,
    }
}

fn windows(tty: bool, utf8_console: bool) -> Capabilities {
    Capabilities {
        platform: Platform::Windows,
        stdout_is_terminal: tty,
        ansi_supported: true,
        utf8_console,
    }
}

#[test]
fn color_is_on_for_a_plain_terminal() {
    assert!(decide_color(ColorChoice::Auto, &vars(&[]), &unix(true)));
}

#[test]
fn color_is_off_when_the_output_is_redirected() {
    assert!(!decide_color(ColorChoice::Auto, &vars(&[]), &unix(false)));
}

#[test]
fn explicit_choices_win_over_the_environment() {
    let no_color = vars(&[("NO_COLOR", "1")]);
    assert!(decide_color(ColorChoice::Always, &no_color, &unix(true)));
    let force = vars(&[("CLICOLOR_FORCE", "1")]);
    assert!(!decide_color(ColorChoice::Never, &force, &unix(false)));
}

#[test]
fn no_color_disables_color_on_a_terminal() {
    assert!(!decide_color(
        ColorChoice::Auto,
        &vars(&[("NO_COLOR", "1")]),
        &unix(true)
    ));
}

#[test]
fn an_empty_no_color_does_not_disable_color() {
    assert!(decide_color(
        ColorChoice::Auto,
        &vars(&[("NO_COLOR", "")]),
        &unix(true)
    ));
    assert!(decide_color(
        ColorChoice::Auto,
        &vars(&[("NO_COLOR", "0")]),
        &unix(true)
    ));
}

#[test]
fn clicolor_force_enables_color_without_a_terminal() {
    assert!(decide_color(
        ColorChoice::Auto,
        &vars(&[("CLICOLOR_FORCE", "1")]),
        &unix(false)
    ));
    assert!(!decide_color(
        ColorChoice::Auto,
        &vars(&[("CLICOLOR_FORCE", "0")]),
        &unix(false)
    ));
}

#[test]
fn clicolor_zero_disables_color() {
    assert!(!decide_color(
        ColorChoice::Auto,
        &vars(&[("CLICOLOR", "0")]),
        &unix(true)
    ));
    assert!(decide_color(
        ColorChoice::Auto,
        &vars(&[("CLICOLOR", "1")]),
        &unix(true)
    ));
}

#[test]
fn mgit_color_overrides_the_detection() {
    assert!(decide_color(
        ColorChoice::Auto,
        &vars(&[("MGIT_COLOR", "always")]),
        &unix(false)
    ));
    assert!(!decide_color(
        ColorChoice::Auto,
        &vars(&[("MGIT_COLOR", "NEVER")]),
        &unix(true)
    ));
    assert!(decide_color(
        ColorChoice::Auto,
        &vars(&[("MGIT_COLOR", "auto")]),
        &unix(true)
    ));
    // An unknown value falls back to the automatic detection.
    assert!(!decide_color(
        ColorChoice::Auto,
        &vars(&[("MGIT_COLOR", "bogus")]),
        &unix(false)
    ));
}

#[test]
fn mgit_color_wins_over_no_color() {
    assert!(decide_color(
        ColorChoice::Auto,
        &vars(&[("MGIT_COLOR", "always"), ("NO_COLOR", "1")]),
        &unix(false)
    ));
}

#[test]
fn color_is_off_on_windows_when_ansi_cannot_be_enabled() {
    let caps = Capabilities {
        platform: Platform::Windows,
        stdout_is_terminal: true,
        ansi_supported: false,
        utf8_console: false,
    };
    assert!(!decide_color(ColorChoice::Auto, &vars(&[]), &caps));
    assert!(decide_color(ColorChoice::Always, &vars(&[]), &caps));
}

#[test]
fn unicode_glyphs_are_the_default() {
    assert_eq!(
        decide_glyphs(AsciiChoice::Auto, &vars(&[]), &unix(true)),
        GlyphSet::Unicode
    );
}

#[test]
fn explicit_ascii_choices_win() {
    assert_eq!(
        decide_glyphs(
            AsciiChoice::Always,
            &vars(&[("MGIT_ASCII", "0")]),
            &unix(true)
        ),
        GlyphSet::Ascii
    );
    assert_eq!(
        decide_glyphs(
            AsciiChoice::Never,
            &vars(&[("MGIT_ASCII", "1")]),
            &unix(true)
        ),
        GlyphSet::Unicode
    );
}

#[test]
fn mgit_ascii_switches_the_glyphs() {
    assert_eq!(
        decide_glyphs(
            AsciiChoice::Auto,
            &vars(&[("MGIT_ASCII", "1")]),
            &unix(true)
        ),
        GlyphSet::Ascii
    );
    assert_eq!(
        decide_glyphs(
            AsciiChoice::Auto,
            &vars(&[("MGIT_ASCII", "0")]),
            &unix(true)
        ),
        GlyphSet::Unicode
    );
}

#[test]
fn mgit_ascii_beats_the_locale_heuristic() {
    let env = vars(&[("MGIT_ASCII", "0"), ("LC_ALL", "C")]);
    assert_eq!(
        decide_glyphs(AsciiChoice::Auto, &env, &unix(true)),
        GlyphSet::Unicode
    );
}

#[test]
fn a_non_utf8_locale_falls_back_to_ascii() {
    for value in ["C", "POSIX", "en_US.ISO8859-1"] {
        let env = vars(&[("LANG", value)]);
        assert_eq!(
            decide_glyphs(AsciiChoice::Auto, &env, &unix(true)),
            GlyphSet::Ascii,
            "LANG={value}"
        );
    }
}

#[test]
fn a_utf8_locale_keeps_the_unicode_glyphs() {
    for value in ["en_US.UTF-8", "zh_TW.utf8", "C.UTF-8"] {
        let env = vars(&[("LANG", value)]);
        assert_eq!(
            decide_glyphs(AsciiChoice::Auto, &env, &unix(true)),
            GlyphSet::Unicode,
            "LANG={value}"
        );
    }
}

#[test]
fn locale_precedence_is_lc_all_then_lc_ctype_then_lang() {
    let env = vars(&[
        ("LC_ALL", "C"),
        ("LC_CTYPE", "en_US.UTF-8"),
        ("LANG", "en_US.UTF-8"),
    ]);
    assert_eq!(
        decide_glyphs(AsciiChoice::Auto, &env, &unix(true)),
        GlyphSet::Ascii
    );
    let env = vars(&[("LC_ALL", ""), ("LC_CTYPE", "C"), ("LANG", "en_US.UTF-8")]);
    assert_eq!(
        decide_glyphs(AsciiChoice::Auto, &env, &unix(true)),
        GlyphSet::Ascii
    );
    let env = vars(&[("LC_CTYPE", "C"), ("LANG", "en_US.UTF-8")]);
    assert_eq!(
        decide_glyphs(AsciiChoice::Auto, &env, &unix(true)),
        GlyphSet::Ascii
    );
}

#[test]
fn locale_helper_reports_utf8_support() {
    assert!(locale_supports_utf8(&vars(&[])));
    assert!(locale_supports_utf8(&vars(&[("LANG", "en_US.UTF-8")])));
    assert!(!locale_supports_utf8(&vars(&[("LANG", "C")])));
    assert!(!locale_supports_utf8(&vars(&[("LC_ALL", "POSIX")])));
}

#[test]
fn a_legacy_windows_console_falls_back_to_ascii() {
    assert_eq!(
        decide_glyphs(AsciiChoice::Auto, &vars(&[]), &windows(true, false)),
        GlyphSet::Ascii
    );
    assert_eq!(
        decide_glyphs(AsciiChoice::Auto, &vars(&[]), &windows(true, true)),
        GlyphSet::Unicode
    );
}

#[test]
fn redirected_windows_output_keeps_the_unicode_glyphs() {
    assert_eq!(
        decide_glyphs(AsciiChoice::Auto, &vars(&[]), &windows(false, false)),
        GlyphSet::Unicode
    );
}

#[test]
fn windows_ignores_the_posix_locale_heuristic() {
    let env = vars(&[("LANG", "C")]);
    assert_eq!(
        decide_glyphs(AsciiChoice::Auto, &env, &windows(true, true)),
        GlyphSet::Unicode
    );
}

#[test]
fn capability_detection_does_not_panic() {
    let caps = Capabilities::detect();
    let _ = decide_color(ColorChoice::Auto, &EnvVars::from_process(), &caps);
    let _ = decide_glyphs(AsciiChoice::Auto, &EnvVars::from_process(), &caps);
    assert_eq!(
        caps.platform,
        if cfg!(windows) {
            Platform::Windows
        } else {
            Platform::Unix
        }
    );
}
