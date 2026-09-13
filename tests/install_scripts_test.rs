//! Checks for the installer scripts.
//!
//! The heavy lifting (downloading a release, verifying the checksum and
//! installing the binary) runs in the `installers` job of the CI workflow
//! against a local HTTP server. These tests keep the scripts honest on every
//! platform: they must parse, they must explain themselves and they must
//! reject nonsense.

use std::path::PathBuf;
use std::process::{Command, Stdio};

fn manifest_directory() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
}

fn script(name: &str) -> PathBuf {
    let path = manifest_directory().join(name);
    assert!(path.is_file(), "{path:?} must exist");
    path
}

fn has_command(program: &str, args: &[&str]) -> bool {
    Command::new(program)
        .args(args)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .stdin(Stdio::null())
        .status()
        .map(|status| status.success())
        .unwrap_or(false)
}

fn output(program: &str, args: &[&str]) -> (i32, String, String) {
    let output = Command::new(program)
        .args(args)
        .output()
        .unwrap_or_else(|error| panic!("cannot run {program}: {error}"));
    (
        output.status.code().unwrap_or(-1),
        String::from_utf8_lossy(&output.stdout).into_owned(),
        String::from_utf8_lossy(&output.stderr).into_owned(),
    )
}

fn sh_available() -> bool {
    has_command("sh", &["-c", "exit 0"])
}

fn pwsh_available() -> bool {
    has_command("pwsh", &["-NoProfile", "-Command", "exit 0"])
}

fn is_release_target(text: &str) -> bool {
    ["-apple-darwin", "-unknown-linux-musl", "-pc-windows-msvc"]
        .iter()
        .any(|suffix| text.contains(suffix))
}

#[test]
fn install_sh_is_executable() {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mode = std::fs::metadata(script("install.sh"))
            .expect("metadata")
            .permissions()
            .mode();
        assert!(
            mode & 0o111 != 0,
            "install.sh must be executable, mode {mode:o}"
        );
    }
}

#[test]
fn install_sh_parses_as_a_posix_shell() {
    if !sh_available() {
        return;
    }
    let path = script("install.sh");
    let (code, _, err) = output("sh", &["-n", path.to_str().expect("utf-8 path")]);
    assert_eq!(code, 0, "{err}");
}

#[test]
fn install_sh_explains_itself() {
    if !sh_available() {
        return;
    }
    let path = script("install.sh");
    let (code, out, _) = output("sh", &[path.to_str().expect("utf-8 path"), "--help"]);
    assert_eq!(code, 0);
    for needle in [
        "USAGE:",
        "--version",
        "--dir",
        "--dry-run",
        "MGIT_INSTALL_DIR",
    ] {
        assert!(out.contains(needle), "the help must mention {needle}");
    }
}

#[test]
fn install_sh_rejects_unknown_options() {
    if !sh_available() {
        return;
    }
    let path = script("install.sh");
    let (code, _, err) = output(
        "sh",
        &[
            path.to_str().expect("utf-8 path"),
            "--definitely-not-an-option",
        ],
    );
    assert_eq!(code, 1);
    assert!(err.contains("unknown option"), "{err}");
}

#[test]
fn install_sh_dry_run_does_not_touch_the_network() {
    if !sh_available() {
        return;
    }
    let path = script("install.sh");
    let (code, out, err) = output(
        "sh",
        &[
            path.to_str().expect("utf-8 path"),
            "--dry-run",
            "--dir",
            "/tmp/mgit-dry-run",
        ],
    );
    assert_eq!(code, 0, "{err}");
    assert!(is_release_target(&out), "{out}");
    assert!(out.contains("/tmp/mgit-dry-run"), "{out}");
    assert!(!out.contains("Downloading"), "{out}");
}

#[test]
fn install_ps1_parses() {
    if !pwsh_available() {
        return;
    }
    let path = script("install.ps1");
    let command = format!(
        "$errors = $null; [void][System.Management.Automation.Language.Parser]::ParseFile('{}', [ref]$null, [ref]$errors); \
         if ($errors.Count -gt 0) {{ $errors[0].Message; exit 1 }}; exit 0",
        path.to_string_lossy().replace('\'', "''")
    );
    let (code, out, err) = output("pwsh", &["-NoProfile", "-Command", &command]);
    assert_eq!(code, 0, "{out}{err}");
}

#[test]
fn install_ps1_explains_itself() {
    if !pwsh_available() {
        return;
    }
    let path = script("install.ps1");
    let (code, out, err) = output(
        "pwsh",
        &[
            "-NoProfile",
            "-File",
            path.to_str().expect("utf-8 path"),
            "-Help",
        ],
    );
    assert_eq!(code, 0, "{err}");
    for needle in [
        "USAGE:",
        "-Version",
        "-InstallDir",
        "-DryRun",
        "MGIT_INSTALL_DIR",
    ] {
        assert!(out.contains(needle), "the help must mention {needle}");
    }
}

#[test]
fn install_ps1_dry_run_reports_the_target() {
    if !pwsh_available() {
        return;
    }
    let path = script("install.ps1");
    let (code, out, err) = output(
        "pwsh",
        &[
            "-NoProfile",
            "-File",
            path.to_str().expect("utf-8 path"),
            "-DryRun",
            "-Version",
            "0.1.0",
        ],
    );
    assert_eq!(code, 0, "{err}");
    assert!(is_release_target(&out), "{out}");
    assert!(out.contains("0.1.0"), "{out}");
}

#[test]
fn both_installers_document_the_same_environment_variables() {
    for name in ["MGIT_VERSION", "MGIT_INSTALL_DIR", "MGIT_DOWNLOAD_BASE"] {
        for script_name in ["install.sh", "install.ps1"] {
            let text = std::fs::read_to_string(script(script_name)).expect("read");
            assert!(text.contains(name), "{script_name} must document {name}");
        }
    }
}

#[test]
fn the_installers_download_from_the_repository() {
    for script_name in ["install.sh", "install.ps1"] {
        let text = std::fs::read_to_string(script(script_name)).expect("read");
        assert!(text.contains("doggy8088/mgit"), "{script_name}");
        assert!(text.contains("releases/latest/download"), "{script_name}");
        assert!(
            text.contains(".sha256"),
            "{script_name} must verify a checksum"
        );
    }
}

fn bump_script() -> PathBuf {
    let path = manifest_directory().join("scripts").join("bump-version.sh");
    assert!(path.is_file(), "{path:?} must exist");
    path
}

/// A copy of the manifests that the test may modify.
fn manifest_copy() -> (tempfile::TempDir, PathBuf, PathBuf) {
    let temp = tempfile::TempDir::new().expect("temporary directory");
    let manifest = temp.path().join("Cargo.toml");
    let lock = temp.path().join("Cargo.lock");
    std::fs::copy(manifest_directory().join("Cargo.toml"), &manifest).expect("copy Cargo.toml");
    std::fs::copy(manifest_directory().join("Cargo.lock"), &lock).expect("copy Cargo.lock");
    let npm_directory = temp.path().join("npm");
    std::fs::create_dir_all(&npm_directory).expect("create the npm directory");
    std::fs::copy(
        manifest_directory().join("npm").join("package.json"),
        npm_directory.join("package.json"),
    )
    .expect("copy npm/package.json");
    (temp, manifest, lock)
}

/// The version of the npm wrapper next to a copied manifest.
fn npm_version(manifest: &std::path::Path) -> String {
    let text = read(
        &manifest
            .parent()
            .expect("parent")
            .join("npm")
            .join("package.json"),
    );
    text.lines()
        .find_map(|line| line.trim().strip_prefix("\"version\": "))
        .map(|value| value.trim().trim_matches(',').trim_matches('"').to_owned())
        .expect("the npm manifest needs a version")
}

fn read(path: &std::path::Path) -> String {
    std::fs::read_to_string(path).expect("read")
}

/// The same content with `CRLF` folded to `LF`, so that the comparison does not
/// depend on the line endings a checkout happens to use (Windows checkouts used
/// to keep `CRLF`, and some `awk` builds drop the carriage return).
fn read_normalized(path: &std::path::Path) -> String {
    normalize(&read(path))
}

/// `CRLF` folded to `LF`.
fn normalize(text: &str) -> String {
    text.replace("\r\n", "\n")
}

fn lock_version(lock: &str) -> String {
    let mut in_mgit = false;
    for line in lock.lines() {
        if line.starts_with("[[package]]") {
            in_mgit = false;
        }
        if line.starts_with("name = ") && line.contains("\"mgit\"") {
            in_mgit = true;
        } else if in_mgit {
            if let Some(version) = line.strip_prefix("version = ") {
                return version.trim().trim_matches('"').to_owned();
            }
        }
    }
    panic!("the lock file has no mgit package");
}

/// The version of a copied `Cargo.toml`.
fn manifest_version(manifest: &std::path::Path) -> String {
    read(manifest)
        .lines()
        .find_map(|line| line.trim().strip_prefix("version = "))
        .map(|value| value.trim().trim_matches('"').to_owned())
        .expect("Cargo.toml needs a version")
}

/// The version that `bump-version.sh <part>` produces, so that the tests keep
/// working when the repository version changes.
fn next_version(current: &str, part: &str) -> String {
    let base = current.split('-').next().expect("a base version");
    let mut numbers: Vec<u64> = base
        .split('.')
        .map(|number| number.parse().expect("a numeric version part"))
        .collect();
    assert_eq!(numbers.len(), 3, "{current} must be MAJOR.MINOR.PATCH");
    match part {
        "major" => {
            numbers[0] += 1;
            numbers[1] = 0;
            numbers[2] = 0;
        }
        "minor" => {
            numbers[1] += 1;
            numbers[2] = 0;
        }
        "patch" => numbers[2] += 1,
        other => panic!("unknown version part {other}"),
    }
    format!("{}.{}.{}", numbers[0], numbers[1], numbers[2])
}

#[test]
fn bump_version_explains_itself() {
    if !sh_available() {
        return;
    }
    let path = bump_script();
    let (code, out, _) = output("sh", &[path.to_str().expect("utf-8 path"), "--help"]);
    assert_eq!(code, 0);
    for needle in ["USAGE:", "major", "minor", "patch", "--dry-run"] {
        assert!(out.contains(needle), "the help must mention {needle}");
    }
}

#[test]
fn bump_version_needs_an_argument() {
    if !sh_available() {
        return;
    }
    let path = bump_script();
    let (code, _, err) = output("sh", &[path.to_str().expect("utf-8 path")]);
    assert_eq!(code, 1);
    assert!(err.contains("major, minor, patch"), "{err}");
}

#[test]
fn bump_version_rejects_invalid_versions() {
    if !sh_available() {
        return;
    }
    let (_temp, manifest, _lock) = manifest_copy();
    let path = bump_script();
    for argument in ["bogus", "1.2", "v1.2.3", "1.2.3.4", "1.2.3-"] {
        let (code, _, err) = output(
            "sh",
            &[
                path.to_str().expect("utf-8 path"),
                "--manifest",
                manifest.to_str().expect("utf-8 path"),
                argument,
            ],
        );
        assert_eq!(code, 1, "{argument} must be rejected");
        assert!(
            err.contains("semantic version") || err.contains("is not"),
            "{argument}: {err}"
        );
    }
    assert!(
        read(&manifest).contains(&format!("version = \"{}\"", manifest_version(&manifest))),
        "the manifest must be untouched"
    );
}

#[test]
fn bump_version_dry_run_writes_nothing() {
    if !sh_available() {
        return;
    }
    let (_temp, manifest, lock) = manifest_copy();
    let before = read(&manifest);
    let current = manifest_version(&manifest);
    let expected = next_version(&current, "patch");
    let path = bump_script();
    let (code, out, err) = output(
        "sh",
        &[
            path.to_str().expect("utf-8 path"),
            "--manifest",
            manifest.to_str().expect("utf-8 path"),
            "--dry-run",
            "patch",
        ],
    );
    assert_eq!(code, 0, "{err}");
    assert!(out.contains(&format!("{current} -> {expected}")), "{out}");
    assert_eq!(read(&manifest), before);
    assert!(read(&lock).contains(&format!("version = \"{current}\"")));
}

#[test]
fn bump_version_updates_the_manifest_and_the_lock() {
    if !sh_available() {
        return;
    }
    let (_temp, manifest, lock) = manifest_copy();
    let path = bump_script();
    let manifest_argument = manifest.to_str().expect("utf-8 path").to_owned();
    let start = manifest_version(&manifest);

    let mut expected = String::new();
    for part in ["minor", "patch", "major"] {
        let current = manifest_version(&manifest);
        expected = next_version(&current, part);

        let (code, out, err) = output(
            "sh",
            &[
                path.to_str().expect("utf-8 path"),
                "--manifest",
                &manifest_argument,
                part,
            ],
        );
        assert_eq!(code, 0, "{err}");
        assert!(out.contains(&format!("{current} -> {expected}")), "{out}");
        assert!(read(&manifest).contains(&format!("version = \"{expected}\"")));
        assert_eq!(lock_version(&read(&lock)), expected);
        assert_eq!(npm_version(&manifest), expected);
    }

    // A major bump resets the lower parts.
    assert!(expected.ends_with(".0.0"), "{expected}");
    assert_ne!(start, expected);
}

#[test]
fn bump_version_accepts_an_explicit_version() {
    if !sh_available() {
        return;
    }
    let (_temp, manifest, lock) = manifest_copy();
    let path = bump_script();
    let (code, out, err) = output(
        "sh",
        &[
            path.to_str().expect("utf-8 path"),
            "--manifest",
            manifest.to_str().expect("utf-8 path"),
            "1.2.0-rc.1",
        ],
    );
    assert_eq!(code, 0, "{err}");
    assert!(out.contains("1.2.0-rc.1"), "{out}");
    assert!(read(&manifest).contains("version = \"1.2.0-rc.1\""));
    assert_eq!(lock_version(&read(&lock)), "1.2.0-rc.1");
    assert_eq!(npm_version(&manifest), "1.2.0-rc.1");
}

#[test]
fn bump_version_refuses_to_repeat_itself() {
    if !sh_available() {
        return;
    }
    let (_temp, manifest, _lock) = manifest_copy();
    let current = manifest_version(&manifest);
    let path = bump_script();
    let (code, _, err) = output(
        "sh",
        &[
            path.to_str().expect("utf-8 path"),
            "--manifest",
            manifest.to_str().expect("utf-8 path"),
            &current,
        ],
    );
    assert_eq!(code, 1);
    assert!(err.contains("already"), "{err}");
}

#[test]
fn bump_version_keeps_the_rest_of_the_manifest() {
    if !sh_available() {
        return;
    }
    let (_temp, manifest, lock) = manifest_copy();
    let original_manifest = read(&manifest);
    let original_lock = read(&lock);
    let npm_manifest = manifest
        .parent()
        .expect("parent")
        .join("npm")
        .join("package.json");
    let original_npm = read(&npm_manifest);
    let current = manifest_version(&manifest);
    let expected = next_version(&current, "patch");
    let path = bump_script();
    let (code, _, err) = output(
        "sh",
        &[
            path.to_str().expect("utf-8 path"),
            "--manifest",
            manifest.to_str().expect("utf-8 path"),
            "patch",
        ],
    );
    assert_eq!(code, 0, "{err}");

    // Only the version lines may change.
    let expected_manifest = original_manifest.replace(
        &format!("version = \"{current}\""),
        &format!("version = \"{expected}\""),
    );
    assert_ne!(expected_manifest, original_manifest);
    assert_eq!(read_normalized(&manifest), expected_manifest);

    let mut expected_lines: Vec<String> =
        original_lock.lines().map(|line| line.to_owned()).collect();
    for line in expected_lines.iter_mut() {
        if *line == format!("version = \"{current}\"") {
            *line = format!("version = \"{expected}\"");
        }
    }
    let expected_lock = expected_lines.join("\n") + "\n";
    assert_eq!(read_normalized(&lock), expected_lock);

    let expected_npm = original_npm.replace(
        &format!("\"version\": \"{current}\""),
        &format!("\"version\": \"{expected}\""),
    );
    assert_eq!(read_normalized(&npm_manifest), expected_npm);
    assert_ne!(
        original_npm, expected_npm,
        "the npm manifest must have a version line"
    );
}

#[test]
fn bump_version_handles_crlf_manifests() {
    if !sh_available() {
        return;
    }
    let (_temp, manifest, lock) = manifest_copy();
    let npm_manifest = manifest
        .parent()
        .expect("parent")
        .join("npm")
        .join("package.json");

    // A Windows checkout with core.autocrlf hands CRLF files to the script.
    for path in [&manifest, &lock, &npm_manifest] {
        let text = read(path).replace('\n', "\r\n");
        std::fs::write(path, text).expect("write the CRLF copy");
    }
    let original_manifest = read(&manifest);
    let original_npm = read(&npm_manifest);
    let current = manifest_version(&manifest);
    let expected = next_version(&current, "patch");

    let path = bump_script();
    let (code, out, err) = output(
        "sh",
        &[
            path.to_str().expect("utf-8 path"),
            "--manifest",
            manifest.to_str().expect("utf-8 path"),
            "patch",
        ],
    );

    assert_eq!(code, 0, "{err}");
    assert!(out.contains(&format!("{current} -> {expected}")), "{out}");
    assert!(read(&manifest).contains(&format!("version = \"{expected}\"")));
    assert_eq!(lock_version(&read_normalized(&lock)), expected);
    assert_eq!(npm_version(&manifest), expected);

    // Only the version line changes, whichever line endings awk happens to keep.
    assert_eq!(
        read_normalized(&manifest),
        normalize(&original_manifest).replace(
            &format!("version = \"{current}\""),
            &format!("version = \"{expected}\"")
        )
    );
    assert_eq!(
        read_normalized(&npm_manifest),
        normalize(&original_npm).replace(
            &format!("\"version\": \"{current}\""),
            &format!("\"version\": \"{expected}\"")
        )
    );
}
