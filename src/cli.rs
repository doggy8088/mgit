//! Command line parsing.

use std::ffi::OsString;

/// The program name reported in help and version output.
pub const PROGRAM: &str = "mgit";

/// The version of this build, taken from `Cargo.toml`.
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Default maximum search depth (1 = direct subdirectories only).
pub const DEFAULT_DEPTH: usize = 1;

/// When to colorize the output.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum ColorChoice {
    /// Colorize when the output goes to a terminal that supports ANSI.
    #[default]
    Auto,
    /// Always colorize.
    Always,
    /// Never colorize.
    Never,
}

/// When to fall back to ASCII only glyphs.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum AsciiChoice {
    /// Decide from the environment (locale and console code page).
    #[default]
    Auto,
    /// Always use ASCII only glyphs.
    Always,
    /// Always use the Unicode glyphs.
    Never,
}

/// What the invocation is supposed to do.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Mode {
    /// Print the help text.
    Help,
    /// Print the version.
    Version,
    /// List the discovered repositories and exit.
    List,
    /// Run a git command in every discovered repository.
    Run,
}

/// A fully parsed command line.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Args {
    /// Requested operation.
    pub mode: Mode,
    /// Maximum directory depth that is searched, starting at 1.
    pub depth: usize,
    /// Suppress the per repository headers.
    pub quiet: bool,
    /// Color policy.
    pub color: ColorChoice,
    /// Glyph policy.
    pub ascii: AsciiChoice,
    /// Stop at the first repository that fails.
    pub fail_fast: bool,
    /// Always print the closing summary.
    pub summary: bool,
    /// Exit successfully when no repository was found.
    pub allow_empty: bool,
    /// Arguments handed over to `git` verbatim.
    pub git_args: Vec<OsString>,
}

impl Args {
    /// The arguments that are handed to `git`, or the built-in default
    /// (`git status -s`) when the user did not provide any.
    pub fn effective_git_args(&self) -> Vec<OsString> {
        if self.git_args.is_empty() {
            vec![OsString::from("status"), OsString::from("-s")]
        } else {
            self.git_args.clone()
        }
    }
}

/// A command line that could not be parsed.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CliError {
    message: String,
}

impl CliError {
    /// Create a new error with the given message.
    pub fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
        }
    }

    /// The human readable error message.
    pub fn message(&self) -> &str {
        &self.message
    }
}

impl std::fmt::Display for CliError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.message)
    }
}

impl std::error::Error for CliError {}

/// Parse the arguments that follow the program name.
///
/// Parsing stops at the first argument that is not one of mgit's own options
/// (or at a bare `--`); everything from that point on is forwarded to `git`
/// untouched. This keeps `mgit` transparent: `mgit log -n 1 -- path` behaves
/// exactly like `git log -n 1 -- path`, just in every repository, and options
/// that mgit does not know about (`-c`, `--git-dir`, ...) are passed through.
pub fn parse<I, T>(args: I) -> Result<Args, CliError>
where
    I: IntoIterator<Item = T>,
    T: Into<OsString>,
{
    let mut parsed = Args {
        mode: Mode::Run,
        depth: DEFAULT_DEPTH,
        quiet: false,
        color: ColorChoice::Auto,
        ascii: AsciiChoice::Auto,
        fail_fast: false,
        summary: false,
        allow_empty: false,
        git_args: Vec::new(),
    };

    let mut wants_help = false;
    let mut wants_version = false;
    let mut iter = args.into_iter().map(Into::into);

    while let Some(arg) = iter.next() {
        let Some(text) = arg.to_str() else {
            // An argument that is not valid Unicode can never be one of our
            // options, so it starts the git command line.
            parsed.git_args.push(arg);
            parsed.git_args.extend(iter);
            break;
        };

        if text == "--" {
            parsed.git_args.extend(iter);
            break;
        }

        if let Some(long) = text.strip_prefix("--") {
            let (name, inline) = match long.split_once('=') {
                Some((name, value)) => (name, Some(value.to_owned())),
                None => (long, None),
            };
            match name {
                "help" => wants_help = true,
                "version" => wants_version = true,
                "list" => parsed.mode = Mode::List,
                "quiet" => parsed.quiet = true,
                "ascii" => parsed.ascii = AsciiChoice::Always,
                "fail-fast" => parsed.fail_fast = true,
                "keep-going" => parsed.fail_fast = false,
                "summary" => parsed.summary = true,
                "allow-empty" => parsed.allow_empty = true,
                "no-color" => parsed.color = ColorChoice::Never,
                "color" => {
                    let value = take_value("--color", inline, &mut iter)?;
                    parsed.color = parse_color(&value)?;
                }
                "depth" => {
                    let value = take_value("-d`/`--depth", inline, &mut iter)?;
                    parsed.depth = parse_depth(&value)?;
                }
                _ => {
                    // Not one of our options: hand it (and everything that
                    // follows) over to git, exactly like the shell version did.
                    parsed.git_args.push(arg);
                    parsed.git_args.extend(iter);
                    break;
                }
            }
            continue;
        }

        if text.len() > 1 && text.starts_with('-') {
            match &text[..2] {
                "-h" => wants_help = true,
                "-V" => wants_version = true,
                "-l" => parsed.mode = Mode::List,
                "-q" => parsed.quiet = true,
                "-k" => parsed.fail_fast = false,
                "-d" => {
                    let inline = (text.len() > 2).then(|| text[2..].to_owned());
                    let value = take_value("-d`/`--depth", inline, &mut iter)?;
                    parsed.depth = parse_depth(&value)?;
                }
                _ => {
                    parsed.git_args.push(arg);
                    parsed.git_args.extend(iter);
                    break;
                }
            }
            continue;
        }

        parsed.git_args.push(arg);
        parsed.git_args.extend(iter);
        break;
    }

    if wants_help {
        parsed.mode = Mode::Help;
    } else if wants_version {
        parsed.mode = Mode::Version;
    }

    Ok(parsed)
}

/// Fetch the value of an option, either from `--option=value` or from the next
/// argument.
fn take_value<I>(name: &str, inline: Option<String>, rest: &mut I) -> Result<String, CliError>
where
    I: Iterator<Item = OsString>,
{
    if let Some(value) = inline {
        return Ok(value);
    }
    match rest.next() {
        Some(value) => value.into_string().map_err(|_| {
            CliError::new(format!(
                "mgit: the value of `{name}` must be valid Unicode\n"
            ))
        }),
        None => Err(CliError::new(format!(
            "mgit: option `{name}` requires a value\nRun `mgit --help` for usage.\n"
        ))),
    }
}

fn parse_depth(value: &str) -> Result<usize, CliError> {
    match value.parse::<usize>() {
        Ok(depth) if depth >= 1 => Ok(depth),
        _ => Err(CliError::new(format!(
            "mgit: invalid value `{value}` for option `--depth`: expected a positive integer (>= 1)\n"
        ))),
    }
}

fn parse_color(value: &str) -> Result<ColorChoice, CliError> {
    match value.to_ascii_lowercase().as_str() {
        "auto" => Ok(ColorChoice::Auto),
        "always" => Ok(ColorChoice::Always),
        "never" => Ok(ColorChoice::Never),
        _ => Err(CliError::new(format!(
            "mgit: invalid value `{value}` for option `--color`: expected `auto`, `always` or `never`\n"
        ))),
    }
}

/// The `--help` text.
pub fn help_text() -> String {
    format!(
        "\
{PROGRAM} {VERSION}
Run the same git command in every Git repository under the current directory.

USAGE:
    {PROGRAM} [OPTIONS] [--] [GIT_ARGS...]

    Parsing stops at the first argument that is not one of the options above,
    or at a bare `--`. Everything from that point on is forwarded to git, which
    also means that git options such as `-c` or `--git-dir` keep working.
    Without any git arguments `{PROGRAM}` runs `git status -s`.

OPTIONS:
    -h, --help            Print this help and exit
    -V, --version         Print the version and exit
    -l, --list            List the repositories that were found, one absolute
                          path per line, and exit
    -d, --depth <N>       Search up to N directory levels deep (default: 1)
    -q, --quiet           Suppress the per repository header
        --color <WHEN>    `auto` (default), `always` or `never`
        --no-color        The same as `--color=never`
        --ascii           Use ASCII only glyphs, no emoji
        --summary         Always print the closing summary
    -k, --keep-going      Continue after a failing repository (default)
        --fail-fast       Stop at the first repository that fails
        --allow-empty     Exit with 0 when no repository was found
        --                Everything that follows is passed to git verbatim

EXAMPLES:
    {PROGRAM}                        git status -s in every repository
    {PROGRAM} pull                   git pull in every repository
    {PROGRAM} --depth 2 fetch        search two directory levels deep
    {PROGRAM} -q log --oneline -n 1  quiet, one line of history per repository
    {PROGRAM} -- --version           hand --version over to git, not to {PROGRAM}

EXIT CODES:
    0     every repository succeeded
    1     a repository failed, or no repository was found
    2     the command line could not be parsed
    127   the git executable could not be started
    130   interrupted with Ctrl+C
    N     otherwise the exit code of the first failing git invocation

ENVIRONMENT:
    MGIT_GIT          Name or path of the git executable (default: git)
    MGIT_COLOR        auto, always or never; overrides the terminal detection
    MGIT_ASCII        1 forces ASCII glyphs, 0 forces the Unicode glyphs
    NO_COLOR          Disables color when it is set to a non empty value
    CLICOLOR_FORCE    Forces color when it is set to a non empty value but 0
"
    )
}

/// The `--version` text.
pub fn version_text() -> String {
    format!("{PROGRAM} {VERSION}")
}
