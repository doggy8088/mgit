//! The `mgit` command line entry point.

use std::ffi::OsString;
use std::io::Write;

use mgit::app::{App, exit};
use mgit::cli;
use mgit::color::Painter;
use mgit::console::{Capabilities, decide_color, decide_glyphs};
use mgit::env::EnvVars;
use mgit::gitcmd::SystemGit;
use mgit::platform::reset_sigpipe;
use mgit::report::Glyphs;

fn main() {
    reset_sigpipe();

    let args = match cli::parse(std::env::args_os().skip(1)) {
        Ok(args) => args,
        Err(error) => {
            let _ = write!(std::io::stderr(), "{error}");
            std::process::exit(exit::USAGE);
        }
    };

    let root = match std::env::current_dir() {
        Ok(root) => root,
        Err(error) => {
            let _ = writeln!(
                std::io::stderr(),
                "mgit: cannot determine the current directory: {error}"
            );
            std::process::exit(exit::FAILURE);
        }
    };

    let environment = EnvVars::from_process();
    let capabilities = Capabilities::detect();
    let paint = Painter::new(decide_color(args.color, &environment, &capabilities));
    let glyphs = Glyphs::for_set(decide_glyphs(args.ascii, &environment, &capabilities));

    let program = environment
        .get("MGIT_GIT")
        .map(OsString::from)
        .unwrap_or_else(|| OsString::from("git"));
    let runner = SystemGit::new(program);

    let stdout = std::io::stdout();
    let stderr = std::io::stderr();
    let mut out = stdout.lock();
    let mut err = stderr.lock();

    let code = {
        let mut app = App::new(&args, root, &runner, &mut out, &mut err);
        app.paint = paint;
        app.glyphs = glyphs;
        app.run()
    };

    let _ = out.flush();
    std::process::exit(code);
}
