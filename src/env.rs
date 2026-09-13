//! The environment variables that influence the defaults.

use std::collections::BTreeMap;
use std::ffi::{OsStr, OsString};

/// The environment variables `mgit` looks at.
#[derive(Debug, Clone, Default)]
pub struct EnvVars {
    map: BTreeMap<OsString, OsString>,
}

impl EnvVars {
    /// The variables that are read, everything else is ignored.
    pub const WATCHED: [&'static str; 9] = [
        "MGIT_GIT",
        "MGIT_COLOR",
        "MGIT_ASCII",
        "NO_COLOR",
        "CLICOLOR_FORCE",
        "CLICOLOR",
        "LC_ALL",
        "LC_CTYPE",
        "LANG",
    ];

    /// Read the watched variables from the process environment.
    pub fn from_process() -> Self {
        std::env::vars_os().collect()
    }
}

impl<K, V> FromIterator<(K, V)> for EnvVars
where
    K: Into<OsString>,
    V: Into<OsString>,
{
    /// Build a value from an arbitrary list of pairs, mostly for tests.
    ///
    /// Everything that is not one of [`EnvVars::WATCHED`] is ignored.
    fn from_iter<I: IntoIterator<Item = (K, V)>>(pairs: I) -> Self {
        let mut map = BTreeMap::new();
        for (key, value) in pairs {
            let key = key.into();
            if Self::WATCHED.contains(&key.to_string_lossy().to_ascii_uppercase().as_str()) {
                map.insert(normalize(&key), value.into());
            }
        }
        Self { map }
    }
}

impl EnvVars {
    /// The raw value of a watched variable.
    pub fn get(&self, key: &str) -> Option<&OsStr> {
        self.map
            .get(&normalize(OsStr::new(key)))
            .map(OsString::as_os_str)
    }

    /// The value of a watched variable as UTF-8, if it is valid Unicode.
    pub fn get_lossy(&self, key: &str) -> Option<String> {
        self.get(key).and_then(OsStr::to_str).map(str::to_owned)
    }

    /// Interpret a watched variable as a boolean flag.
    ///
    /// Returns `None` when the variable is not set at all. An empty value and
    /// the usual spellings of "no" count as `false`, everything else counts as
    /// `true`.
    pub fn flag(&self, key: &str) -> Option<bool> {
        self.get(key).map(|value| {
            let value = value.to_string_lossy();
            let value = value.trim();
            !value.is_empty()
                && !matches!(
                    value.to_ascii_lowercase().as_str(),
                    "0" | "false" | "no" | "off"
                )
        })
    }
}

/// Environment variable names are compared case insensitively, otherwise the
/// same lookups would behave differently on Windows.
fn normalize(name: &OsStr) -> OsString {
    OsString::from(name.to_string_lossy().to_ascii_uppercase())
}
