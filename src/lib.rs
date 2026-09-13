//! `mgit` runs a single Git command across every Git repository found in the
//! subdirectories of the current working directory.
//!
//! The crate is split into small, side effect free building blocks so that each
//! piece of behaviour can be tested on its own:
//!
//! * [`cli`] parses the command line without touching the environment.
//! * [`env`] models the environment variables that influence the defaults.
//! * [`color`] contains the ANSI painting helpers.
//! * [`console`] decides which capabilities the attached terminal has.
//! * [`discovery`] finds the repositories inside a directory tree.
//! * [`gitcmd`] talks to the `git` executable.
//! * [`report`] renders the human readable output.
//! * [`app`] wires all of the above together and computes the exit code.

#![forbid(unsafe_op_in_unsafe_fn)]
#![deny(missing_docs)]

pub mod app;
pub mod cli;
pub mod color;
pub mod console;
pub mod discovery;
pub mod env;
pub mod gitcmd;
pub mod platform;
pub mod report;
