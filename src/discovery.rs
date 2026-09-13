//! Finding the Git repositories below a directory.

use std::collections::{HashSet, VecDeque};
use std::ffi::OsString;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

/// One repository that was found.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Repository {
    /// The name of the directory, as it appears on disk.
    pub name: OsString,
    /// The absolute path of the directory.
    pub path: PathBuf,
}

/// The outcome of a search.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Discovery {
    /// The repositories that were found, sorted by name.
    pub repositories: Vec<Repository>,
    /// Directories that could not be read, in the order they were visited.
    pub warnings: Vec<String>,
}

/// Whether `path` itself is a repository, that is whether it holds a `.git`
/// directory or a `.git` file (worktrees and submodules use the latter).
pub fn is_repository(path: &Path) -> bool {
    match fs::metadata(path.join(".git")) {
        Ok(metadata) => metadata.is_dir() || metadata.is_file(),
        Err(_) => false,
    }
}

/// Search `root` for repositories, up to `max_depth` levels below it.
///
/// Level 1 is a direct child of `root`. Symlinked directories are followed and
/// the traversal never descends into a repository, so nested checkouts such as
/// submodules are not reported twice. A repository that is reachable through
/// several names (a symbolic link next to its target, for example) is reported
/// for every name, exactly like the `*/` glob of the shell version did.
pub fn discover(root: &Path, max_depth: usize) -> io::Result<Discovery> {
    let mut discovery = Discovery::default();
    if max_depth == 0 {
        return Ok(discovery);
    }

    let mut visited: HashSet<PathBuf> = HashSet::new();
    if let Ok(canonical) = fs::canonicalize(root) {
        visited.insert(canonical);
    }

    let mut queue: VecDeque<(PathBuf, usize)> = VecDeque::new();
    queue.push_back((root.to_path_buf(), 1));

    while let Some((directory, level)) = queue.pop_front() {
        let entries = match read_entries(&directory) {
            Ok(entries) => entries,
            Err(error) if directory == root => return Err(error),
            Err(error) => {
                discovery.warnings.push(format!(
                    "mgit: cannot read `{}`: {error}\n",
                    directory.display()
                ));
                continue;
            }
        };

        for entry in entries {
            let path = entry;
            if !is_directory(&path) {
                continue;
            }

            if is_repository(&path) {
                discovery.repositories.push(Repository {
                    name: file_name(&path),
                    path,
                });
                continue;
            }

            // Walking into the same real directory twice would loop forever on
            // symbolic links, so every directory is only visited once.
            let identity = fs::canonicalize(&path).unwrap_or_else(|_| path.clone());
            if level < max_depth && visited.insert(identity) {
                queue.push_back((path, level + 1));
            }
        }
    }

    discovery
        .repositories
        .sort_by_key(|repository| sort_key(&repository.name));
    Ok(discovery)
}

/// Read a directory and return its entries sorted by file name.
fn read_entries(directory: &Path) -> io::Result<Vec<PathBuf>> {
    let mut entries: Vec<PathBuf> = fs::read_dir(directory)?
        .map(|entry| entry.map(|entry| entry.path()))
        .collect::<io::Result<_>>()?;
    entries.sort_by(|left, right| left.file_name().cmp(&right.file_name()));
    Ok(entries)
}

fn is_directory(path: &Path) -> bool {
    fs::metadata(path)
        .map(|metadata| metadata.is_dir())
        .unwrap_or(false)
}

fn file_name(path: &Path) -> OsString {
    path.file_name()
        .map(OsString::from)
        .unwrap_or_else(|| OsString::from(path.as_os_str()))
}

/// Names are compared without their case so that the order looks natural on
/// case insensitive file systems, and the exact spelling breaks ties.
fn sort_key(name: &OsString) -> (String, String) {
    let lossy = name.to_string_lossy().into_owned();
    let folded: String = lossy
        .chars()
        .flat_map(|character| character.to_lowercase())
        .collect();
    (folded, lossy)
}
