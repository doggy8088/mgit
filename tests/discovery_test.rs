//! Unit tests for repository discovery.

use std::fs;
use std::path::Path;

use mgit::discovery::{Discovery, discover, is_repository};
use tempfile::TempDir;

fn make_repo(path: &Path) {
    fs::create_dir_all(path.join(".git")).expect("create .git");
}

fn make_worktree_style_repo(path: &Path) {
    fs::create_dir_all(path).expect("create directory");
    fs::write(path.join(".git"), "gitdir: /elsewhere\n").expect("write .git file");
}

fn make_plain_dir(path: &Path) {
    fs::create_dir_all(path).expect("create directory");
}

fn names(discovery: &Discovery) -> Vec<String> {
    discovery
        .repositories
        .iter()
        .map(|repo| repo.name.to_string_lossy().into_owned())
        .collect()
}

fn temp() -> TempDir {
    TempDir::new().expect("temporary directory")
}

#[test]
fn an_empty_directory_has_no_repositories() {
    let temp = temp();
    let discovery = discover(temp.path(), 1).expect("discover");
    assert!(discovery.repositories.is_empty());
    assert!(discovery.warnings.is_empty());
}

#[test]
fn a_directory_with_a_git_directory_is_a_repository() {
    let temp = temp();
    make_repo(&temp.path().join("repo"));
    let discovery = discover(temp.path(), 1).expect("discover");
    assert_eq!(names(&discovery), vec!["repo"]);
}

#[test]
fn a_directory_with_a_git_file_is_a_repository() {
    let temp = temp();
    make_worktree_style_repo(&temp.path().join("linked"));
    let discovery = discover(temp.path(), 1).expect("discover");
    assert_eq!(names(&discovery), vec!["linked"]);
}

#[test]
fn plain_directories_are_ignored() {
    let temp = temp();
    make_plain_dir(&temp.path().join("src"));
    fs::write(temp.path().join("README.md"), "hello").expect("write file");
    let discovery = discover(temp.path(), 1).expect("discover");
    assert!(discovery.repositories.is_empty());
}

#[test]
fn repository_paths_are_absolute() {
    let temp = temp();
    make_repo(&temp.path().join("repo"));
    let discovery = discover(temp.path(), 1).expect("discover");
    let path = &discovery.repositories[0].path;
    assert!(path.is_absolute(), "{path:?} must be absolute");
    assert_eq!(path, &temp.path().join("repo"));
}

#[test]
fn hidden_directories_are_searched() {
    let temp = temp();
    make_repo(&temp.path().join(".hidden-repo"));
    let discovery = discover(temp.path(), 1).expect("discover");
    assert_eq!(names(&discovery), vec![".hidden-repo"]);
}

#[test]
fn repositories_are_sorted_by_name() {
    let temp = temp();
    for name in ["zeta", "Beta", "alpha"] {
        make_repo(&temp.path().join(name));
    }
    let discovery = discover(temp.path(), 1).expect("discover");
    // The order is case insensitive, which matches what users expect from a
    // file manager on every platform.
    assert_eq!(names(&discovery), vec!["alpha", "Beta", "zeta"]);
}

#[test]
fn repositories_that_only_differ_in_case_are_ordered_deterministically() {
    let temp = temp();
    make_repo(&temp.path().join("Alpha"));
    make_repo(&temp.path().join("alpha"));
    let entries = fs::read_dir(temp.path()).expect("read dir").count();
    if entries != 2 {
        // A case insensitive file system cannot hold both spellings.
        return;
    }
    let discovery = discover(temp.path(), 1).expect("discover");
    assert_eq!(names(&discovery), vec!["Alpha", "alpha"]);
}

#[test]
fn deeper_repositories_need_a_higher_depth() {
    let temp = temp();
    make_repo(&temp.path().join("group/nested"));
    assert!(names(&discover(temp.path(), 1).expect("discover")).is_empty());
    assert_eq!(
        names(&discover(temp.path(), 2).expect("discover")),
        vec!["nested"]
    );
    assert_eq!(
        names(&discover(temp.path(), 5).expect("discover")),
        vec!["nested"]
    );
}

#[test]
fn depth_zero_finds_nothing() {
    let temp = temp();
    make_repo(&temp.path().join("repo"));
    let discovery = discover(temp.path(), 0).expect("discover");
    assert!(discovery.repositories.is_empty());
}

#[test]
fn the_traversal_stops_at_repository_boundaries() {
    let temp = temp();
    make_repo(&temp.path().join("outer"));
    make_repo(&temp.path().join("outer/vendored"));
    let discovery = discover(temp.path(), 3).expect("discover");
    assert_eq!(names(&discovery), vec!["outer"]);
}

#[test]
fn a_missing_root_is_an_error() {
    let temp = temp();
    let missing = temp.path().join("does-not-exist");
    let err = discover(&missing, 1).expect_err("a missing root must fail");
    assert_eq!(err.kind(), std::io::ErrorKind::NotFound);
}

#[test]
fn a_file_as_root_is_an_error() {
    let temp = temp();
    let file = temp.path().join("file.txt");
    fs::write(&file, "x").expect("write");
    assert!(discover(&file, 1).is_err());
}

#[test]
fn detection_is_available_on_its_own() {
    let temp = temp();
    make_repo(&temp.path().join("repo"));
    make_plain_dir(&temp.path().join("other"));
    assert!(is_repository(&temp.path().join("repo")));
    assert!(!is_repository(&temp.path().join("other")));
    assert!(!is_repository(&temp.path().join("missing")));
    // A file that is simply called `.git` is not enough for a directory entry.
    fs::write(temp.path().join("notadir"), "x").expect("write");
    assert!(!is_repository(&temp.path().join("notadir")));
}

#[test]
fn a_symlinked_git_directory_is_a_repository() {
    let temp = temp();
    make_repo(&temp.path().join("real"));
    if symlink(
        &temp.path().join("real/.git"),
        &temp.path().join("alias.git"),
    )
    .is_err()
    {
        return; // symlinks are not available
    }
    make_plain_dir(&temp.path().join("linked"));
    fs::remove_dir_all(temp.path().join("linked")).expect("remove");
    fs::create_dir(temp.path().join("linked")).expect("create");
    let ok = symlink(
        &temp.path().join("alias.git"),
        &temp.path().join("linked/.git"),
    )
    .is_ok();
    if !ok {
        return;
    }
    assert!(is_repository(&temp.path().join("linked")));
}

#[cfg(unix)]
#[test]
fn symlinked_directories_are_followed() {
    let temp = temp();
    make_repo(&temp.path().join("real"));
    symlink(&temp.path().join("real"), &temp.path().join("alias")).expect("symlink");
    let discovery = discover(temp.path(), 1).expect("discover");
    // Both names are reported, just like the `*/` glob of the shell version.
    assert_eq!(names(&discovery), vec!["alias", "real"]);
}

#[cfg(unix)]
#[test]
fn symlink_loops_terminate() {
    let temp = temp();
    make_plain_dir(&temp.path().join("a/b"));
    symlink(temp.path(), &temp.path().join("a/b/loop")).expect("symlink");
    let discovery = discover(temp.path(), 10).expect("discover");
    assert!(discovery.repositories.is_empty());
}

#[cfg(unix)]
#[test]
fn symlink_aliases_are_reported_for_every_name() {
    use std::collections::HashSet;
    use std::path::PathBuf;

    let temp = temp();
    make_repo(&temp.path().join("one"));
    make_repo(&temp.path().join("two"));
    symlink(&temp.path().join("two"), &temp.path().join("group/link")).expect("symlink");
    let discovery = discover(temp.path(), 2).expect("discover");
    assert_eq!(names(&discovery), vec!["link", "one", "two"]);
    let paths: HashSet<PathBuf> = discovery
        .repositories
        .iter()
        .map(|repo| repo.path.clone())
        .collect();
    assert_eq!(paths.len(), 3, "every name keeps its own path");
}

#[cfg(unix)]
#[test]
fn unreadable_subdirectories_are_reported_as_warnings() {
    use std::os::unix::fs::PermissionsExt;

    let temp = temp();
    let locked = temp.path().join("locked");
    make_repo(&locked.join("repo"));
    fs::set_permissions(&locked, fs::Permissions::from_mode(0o000)).expect("chmod");

    // Skip the assertions when the process may ignore the permissions (root).
    let enforceable = fs::read_dir(&locked).is_err();
    let discovery = discover(temp.path(), 2).expect("discover");
    fs::set_permissions(&locked, fs::Permissions::from_mode(0o755)).expect("chmod back");

    if enforceable {
        assert_eq!(discovery.warnings.len(), 1, "{:?}", discovery.warnings);
        assert!(discovery.warnings[0].contains("locked"));
        assert!(discovery.repositories.is_empty());
    }
}

// Only Linux file systems allow byte sequences that are not valid UTF-8; APFS
// and NTFS reject such names outright.
#[cfg(target_os = "linux")]
#[test]
fn non_utf8_directory_names_are_preserved() {
    use std::ffi::OsString;
    use std::os::unix::ffi::OsStringExt;

    let temp = temp();
    let name = OsString::from_vec(b"weird-\x80-name".to_vec());
    make_repo(&temp.path().join(&name));
    let discovery = discover(temp.path(), 1).expect("discover");
    assert_eq!(discovery.repositories.len(), 1);
    assert_eq!(discovery.repositories[0].name, name);
    assert!(discovery.repositories[0].path.ends_with(&name));
    // The rendered name is the lossy variant and must not panic.
    assert!(
        discovery.repositories[0]
            .name
            .to_string_lossy()
            .contains("weird")
    );
}

#[cfg(unix)]
fn symlink(target: &Path, link: &Path) -> std::io::Result<()> {
    if let Some(parent) = link.parent() {
        fs::create_dir_all(parent)?;
    }
    std::os::unix::fs::symlink(target, link)
}

#[cfg(windows)]
fn symlink(target: &Path, link: &Path) -> std::io::Result<()> {
    if let Some(parent) = link.parent() {
        fs::create_dir_all(parent)?;
    }
    std::os::windows::fs::symlink_dir(target, link)
}
