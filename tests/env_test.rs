//! Unit tests for the environment variable model.

use std::ffi::{OsStr, OsString};

use mgit::env::EnvVars;

fn env(pairs: &[(&str, &str)]) -> EnvVars {
    EnvVars::from_iter(pairs.iter().map(|(key, value)| (*key, *value)))
}

#[test]
fn unset_variables_are_missing() {
    let env = env(&[]);
    assert!(env.get("NO_COLOR").is_none());
    assert_eq!(env.flag("NO_COLOR"), None);
    assert_eq!(env.get_lossy("NO_COLOR"), None);
}

#[test]
fn common_truthy_values_are_recognised() {
    for value in ["1", "2", "yes", "true", "TRUE", "on", "always", "anything"] {
        let env = env(&[("NO_COLOR", value)]);
        assert_eq!(env.flag("NO_COLOR"), Some(true), "value {value:?}");
    }
}

#[test]
fn common_falsy_values_are_recognised() {
    for value in ["", "0", "false", "FALSE", "no", "off"] {
        let env = env(&[("NO_COLOR", value)]);
        assert_eq!(env.flag("NO_COLOR"), Some(false), "value {value:?}");
    }
}

#[test]
fn only_watched_variables_are_kept() {
    let env = env(&[("PATH", "/usr/bin"), ("NO_COLOR", "1")]);
    assert!(env.get("PATH").is_none());
    assert_eq!(env.get("NO_COLOR"), Some(OsStr::new("1")));
}

#[test]
fn lookups_ignore_the_case_of_the_name() {
    let env = env(&[("no_color", "1")]);
    assert_eq!(env.get("NO_COLOR"), Some(OsStr::new("1")));
    assert_eq!(env.flag("no_color"), Some(true));
}

#[test]
fn watched_names_are_upper_case() {
    for name in EnvVars::WATCHED {
        assert_eq!(name, name.to_ascii_uppercase(), "{name} must be upper case");
    }
}

#[test]
fn lossy_lookups_return_strings() {
    let env = env(&[("MGIT_COLOR", "always")]);
    assert_eq!(env.get_lossy("MGIT_COLOR").as_deref(), Some("always"));
}

#[test]
fn non_utf8_values_are_still_visible_as_os_strings() {
    let env = EnvVars::from_iter(vec![(OsString::from("MGIT_COLOR"), non_utf8_value())]);
    assert!(env.get("MGIT_COLOR").is_some());
    assert_eq!(env.get_lossy("MGIT_COLOR"), None);
    assert_eq!(env.flag("MGIT_COLOR"), Some(true));
}

#[test]
fn from_process_does_not_panic() {
    let env = EnvVars::from_process();
    // Whatever the surrounding environment holds, the accessors must work.
    let _ = env.get("NO_COLOR");
    let _ = env.flag("CLICOLOR_FORCE");
    let _ = env.get_lossy("LANG");
}

#[cfg(unix)]
fn non_utf8_value() -> OsString {
    use std::os::unix::ffi::OsStringExt;
    OsString::from_vec(vec![0xFF, 0xFE])
}

#[cfg(windows)]
fn non_utf8_value() -> OsString {
    use std::os::windows::ffi::OsStringExt;
    OsString::from_wide(&[0xD800, 0x0061])
}
