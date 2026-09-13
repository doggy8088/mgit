//! Terminal capability detection and the policies that depend on it.

use std::io::IsTerminal;

use crate::cli::{AsciiChoice, ColorChoice};
use crate::env::EnvVars;
use crate::report::GlyphSet;

/// The code page that makes a Windows console understand UTF-8.
#[cfg(windows)]
const UTF8_CODE_PAGE: u32 = 65001;

/// The family of operating systems that changes the console behaviour.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Platform {
    /// macOS, Linux and the other Unix systems.
    Unix,
    /// Windows, both for `cmd.exe` and for PowerShell.
    Windows,
}

/// What the attached console is able to do.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Capabilities {
    /// The platform the process runs on.
    pub platform: Platform,
    /// Whether stdout is connected to a terminal.
    pub stdout_is_terminal: bool,
    /// Whether ANSI escape sequences are understood.
    pub ansi_supported: bool,
    /// Whether the console decodes UTF-8 (Windows console code page 65001).
    pub utf8_console: bool,
}

impl Capabilities {
    /// Inspect the current process.
    ///
    /// On Windows this also tries to switch the console into virtual terminal
    /// mode, which is what makes `cmd.exe` and Windows PowerShell understand
    /// ANSI escape sequences.
    pub fn detect() -> Self {
        let stdout_is_terminal = std::io::stdout().is_terminal();

        #[cfg(windows)]
        {
            let (ansi_supported, utf8_console) = if stdout_is_terminal {
                (
                    windows_console::enable_virtual_terminal(),
                    windows_console::output_code_page() == UTF8_CODE_PAGE,
                )
            } else {
                // Redirected output is written as UTF-8 and only receives
                // escape sequences when the user asks for them explicitly.
                (true, true)
            };
            Self {
                platform: Platform::Windows,
                stdout_is_terminal,
                ansi_supported,
                utf8_console,
            }
        }

        #[cfg(not(windows))]
        {
            Self {
                platform: Platform::Unix,
                stdout_is_terminal,
                ansi_supported: true,
                utf8_console: true,
            }
        }
    }
}

/// Decide whether the output should be colorized.
///
/// The precedence is: the command line, then `MGIT_COLOR`, then
/// `CLICOLOR_FORCE`, then `NO_COLOR`/`CLICOLOR`, then the terminal detection.
pub fn decide_color(choice: ColorChoice, env: &EnvVars, caps: &Capabilities) -> bool {
    match choice {
        ColorChoice::Always => true,
        ColorChoice::Never => false,
        ColorChoice::Auto => {
            if let Some(value) = env.get_lossy("MGIT_COLOR") {
                match value.to_ascii_lowercase().as_str() {
                    "always" => return true,
                    "never" => return false,
                    _ => {}
                }
            }
            if env.flag("CLICOLOR_FORCE") == Some(true) {
                return true;
            }
            if env.flag("NO_COLOR") == Some(true) {
                return false;
            }
            if env.flag("CLICOLOR") == Some(false) {
                return false;
            }
            caps.stdout_is_terminal && caps.ansi_supported
        }
    }
}

/// Decide whether the ASCII only glyphs should be used.
pub fn decide_glyphs(choice: AsciiChoice, env: &EnvVars, caps: &Capabilities) -> GlyphSet {
    match choice {
        AsciiChoice::Always => return GlyphSet::Ascii,
        AsciiChoice::Never => return GlyphSet::Unicode,
        AsciiChoice::Auto => {}
    }

    match env.flag("MGIT_ASCII") {
        Some(true) => return GlyphSet::Ascii,
        Some(false) => return GlyphSet::Unicode,
        None => {}
    }

    match caps.platform {
        // A Windows console that does not decode UTF-8 would mangle the emoji,
        // so it gets the ASCII glyphs instead.
        Platform::Windows if caps.stdout_is_terminal && !caps.utf8_console => GlyphSet::Ascii,
        Platform::Windows => GlyphSet::Unicode,
        Platform::Unix if locale_supports_utf8(env) => GlyphSet::Unicode,
        Platform::Unix => GlyphSet::Ascii,
    }
}

/// Whether the POSIX locale can transport the Unicode glyphs.
pub fn locale_supports_utf8(env: &EnvVars) -> bool {
    let locale = ["LC_ALL", "LC_CTYPE", "LANG"]
        .iter()
        .find_map(|name| env.get_lossy(name).filter(|value| !value.is_empty()));

    match locale {
        // Most systems default to UTF-8 when nothing is configured.
        None => true,
        Some(locale) => locale.to_ascii_lowercase().contains("utf"),
    }
}

#[cfg(windows)]
mod windows_console {
    use std::ffi::c_void;

    const STD_OUTPUT_HANDLE: u32 = 0xFFFF_FFF5; // (DWORD)-11
    const ENABLE_VIRTUAL_TERMINAL_PROCESSING: u32 = 0x0004;
    const INVALID_HANDLE_VALUE: isize = -1;

    #[link(name = "kernel32")]
    unsafe extern "system" {
        fn GetStdHandle(std_handle: u32) -> *mut c_void;
        fn GetConsoleMode(handle: *mut c_void, mode: *mut u32) -> i32;
        fn SetConsoleMode(handle: *mut c_void, mode: u32) -> i32;
        fn GetConsoleOutputCP() -> u32;
    }

    /// Switch the attached console to virtual terminal mode.
    ///
    /// Returns `false` for legacy consoles that cannot be switched, in which
    /// case `mgit` falls back to plain output.
    pub(super) fn enable_virtual_terminal() -> bool {
        // SAFETY: every call only touches handles that the kernel hands out for
        // the current process and writes to a properly aligned local variable.
        unsafe {
            let handle = GetStdHandle(STD_OUTPUT_HANDLE);
            if handle.is_null() || handle as isize == INVALID_HANDLE_VALUE {
                return false;
            }
            let mut mode: u32 = 0;
            if GetConsoleMode(handle, &mut mode) == 0 {
                // Not a console handle (for example a pipe): nothing to do.
                return false;
            }
            if mode & ENABLE_VIRTUAL_TERMINAL_PROCESSING != 0 {
                return true;
            }
            SetConsoleMode(handle, mode | ENABLE_VIRTUAL_TERMINAL_PROCESSING) != 0
        }
    }

    /// The output code page of the attached console.
    pub(super) fn output_code_page() -> u32 {
        // SAFETY: the function has no arguments and no preconditions.
        unsafe { GetConsoleOutputCP() }
    }
}
