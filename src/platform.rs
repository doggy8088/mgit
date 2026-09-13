//! Small platform specific bits that `std` does not cover.

/// Restore the default `SIGPIPE` behaviour on Unix.
///
/// Rust ignores `SIGPIPE` for the whole process. That turns a closed pipe into
/// an error inside `mgit`, and the ignored disposition would also be inherited
/// by the git processes that `mgit` starts, where it makes tools such as
/// `git log | head` misbehave. Restoring the default keeps `mgit` a normal
/// Unix citizen.
#[cfg(unix)]
pub fn reset_sigpipe() {
    /// `SIGPIPE` has the value 13 on every Unix that Rust supports.
    const SIGPIPE: i32 = 13;
    /// `SIG_DFL`, the default signal handler.
    const SIG_DFL: usize = 0;

    unsafe extern "C" {
        fn signal(signum: i32, handler: usize) -> usize;
    }

    // SAFETY: `signal` is called with two constants and its return value, the
    // previous handler, is intentionally dropped.
    unsafe {
        signal(SIGPIPE, SIG_DFL);
    }
}

/// Windows has no `SIGPIPE`, so there is nothing to restore.
#[cfg(windows)]
pub fn reset_sigpipe() {}
