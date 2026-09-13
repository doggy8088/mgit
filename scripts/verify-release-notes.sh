#!/bin/sh
#
# Check that a GitHub Release's notes match CHANGELOG.md.
#
#   scripts/verify-release-notes.sh 2.0.1 --tag v2.0.1          # verify
#   scripts/verify-release-notes.sh 2.0.1 --tag v2.0.1 --fix    # repair and verify
#   scripts/verify-release-notes.sh 2.0.1 --body-file body.md   # offline check
#
# The expected notes are the CHANGELOG section of the version plus the install
# instructions from .github/release-install-section.md. GitHub appends a
# trailing newline to a release body, so both sides are normalised (trailing
# whitespace and trailing empty lines) before they are compared.

set -eu

usage() {
    cat <<'USAGE'
Check a GitHub Release's notes against CHANGELOG.md.

USAGE:
    scripts/verify-release-notes.sh <version> [OPTIONS]

ARGUMENTS:
    <version>            Version to check, with or without the leading `v`

OPTIONS:
    --tag <tag>          GitHub Release tag (default: v<version>)
    --body-file <file>   Compare against this file instead of querying GitHub
    --fix                Overwrite the release notes with the expected text
    -h, --help           Print this help

EXIT CODES:
    0   the release notes match
    1   they differ, the version has no CHANGELOG section, or GitHub failed
USAGE
}

die() {
    printf 'verify-release-notes: %s\n' "$*" >&2
    exit 1
}

script_directory=$(unset CDPATH; cd -- "$(dirname -- "$0")" && pwd)
repository_root=$(dirname -- "$script_directory")
changelog="$repository_root/CHANGELOG.md"
install_section="$repository_root/.github/release-install-section.md"
release_notes_script="$script_directory/release-notes.sh"

if [ $# -ge 1 ]; then
    case "$1" in
        -h | --help)
            usage
            exit 0
            ;;
    esac
fi

[ $# -ge 1 ] || die "usage: verify-release-notes.sh <version> [--tag <tag>] [--fix]"
version="${1#v}"
shift

tag="v$version"
body_file=""
fix=0

while [ $# -gt 0 ]; do
    case "$1" in
        --tag)
            [ $# -ge 2 ] || die "--tag requires a value"
            tag="$2"
            shift 2
            ;;
        --tag=*)
            tag="${1#*=}"
            shift
            ;;
        --body-file)
            [ $# -ge 2 ] || die "--body-file requires a value"
            body_file="$2"
            shift 2
            ;;
        --body-file=*)
            body_file="${1#*=}"
            shift
            ;;
        --fix)
            fix=1
            shift
            ;;
        -h | --help)
            usage
            exit 0
            ;;
        *)
            die "unknown option: $1 (run with --help)"
            ;;
    esac
done

[ -f "$install_section" ] || die "no install section at $install_section"

work_directory=$(mktemp -d 2> /dev/null || mktemp -d -t mgit-notes) ||
    die "cannot create a temporary directory"
trap 'rm -rf "$work_directory"' EXIT INT TERM

expected="$work_directory/expected.md"
actual="$work_directory/actual.md"
expected_normalised="$work_directory/expected.normalised.md"
actual_normalised="$work_directory/actual.normalised.md"

notes="$work_directory/notes.md"
sh "$release_notes_script" "$version" "$changelog" > "$notes" ||
    die "CHANGELOG.md has no section for $version"
cat "$notes" "$install_section" > "$expected"

if [ -n "$body_file" ]; then
    [ -f "$body_file" ] || die "no such body file: $body_file"
    cp "$body_file" "$actual"
else
    command -v gh > /dev/null 2>&1 || die "gh is required to read the release body"
    gh release view "$tag" --json body --jq .body > "$actual" ||
        die "cannot read the release notes of $tag"
fi

normalise() {
    sed -e 's/[[:space:]]*$//' "$1" |
        awk 'BEGIN { blank = 0 }
             /^[[:space:]]*$/ { blank++; next }
             { while (blank > 0) { print ""; blank-- } print }'
}

normalise "$expected" > "$expected_normalised"
normalise "$actual" > "$actual_normalised"

if diff -u "$expected_normalised" "$actual_normalised"; then
    printf 'release notes of %s match CHANGELOG.md [%s]\n' "$tag" "$version"
    exit 0
fi

if [ "$fix" -eq 0 ]; then
    printf 'verify-release-notes: the release notes of %s differ from CHANGELOG.md [%s]\n' \
        "$tag" "$version" >&2
    printf 'verify-release-notes: run again with --fix to overwrite them\n' >&2
    exit 1
fi

[ -n "$body_file" ] && die "--fix cannot be combined with --body-file"
gh release edit "$tag" --notes-file "$expected" ||
    die "cannot update the release notes of $tag"

gh release view "$tag" --json body --jq .body > "$actual"
normalise "$actual" > "$actual_normalised"
diff -u "$expected_normalised" "$actual_normalised" ||
    die "the release notes of $tag still differ after the update"

printf 'release notes of %s were updated from CHANGELOG.md [%s]\n' "$tag" "$version"
