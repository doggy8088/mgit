#!/bin/sh
#
# Print the CHANGELOG section of one version.
#
#   scripts/release-notes.sh 2.0.1 [CHANGELOG.md]
#
# The release workflow uses this to build the GitHub Release body, so
# CHANGELOG.md stays the single source of truth for the release notes. A
# missing section is an error: the release must not ship without a record.

set -eu

usage() {
    cat <<'USAGE'
Print the CHANGELOG section of one version.

USAGE:
    scripts/release-notes.sh <version> [CHANGELOG.md]

ARGUMENTS:
    <version>        Version to extract, with or without the leading `v`
    [CHANGELOG.md]   Changelog to read (default: the repository CHANGELOG.md)

EXIT CODES:
    0   the section was printed on stdout
    1   the version has no section, or the changelog is missing
USAGE
}

die() {
    printf 'release-notes: %s\n' "$*" >&2
    exit 1
}

if [ $# -ge 1 ]; then
    case "$1" in
        -h | --help)
            usage
            exit 0
            ;;
    esac
fi

[ $# -ge 1 ] || die "usage: release-notes.sh <version> [CHANGELOG.md]"

version="${1#v}"
file="${2:-}"

if [ -z "$file" ]; then
    script_directory=$(unset CDPATH; cd -- "$(dirname -- "$0")" && pwd)
    file="$(dirname -- "$script_directory")/CHANGELOG.md"
fi

[ -f "$file" ] || die "no changelog at $file"

notes=$(
    awk -v heading="## [${version}]" '
        index($0, heading) == 1 { found = 1 }
        found && /^## \[/ && index($0, heading) != 1 { exit }
        found { print }
    ' "$file"
)

printf '%s' "$notes" | grep -q "^## \[${version}\]" ||
    die "$file has no '## [${version}]' section; add it before releasing"

printf '%s\n' "$notes"
