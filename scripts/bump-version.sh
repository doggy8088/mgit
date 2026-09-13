#!/bin/sh
#
# Bump the mgit version in Cargo.toml and Cargo.lock.
#
#   scripts/bump-version.sh patch          # 0.1.0 -> 0.1.1
#   scripts/bump-version.sh minor          # 0.1.1 -> 0.2.0
#   scripts/bump-version.sh major          # 0.2.0 -> 1.0.0
#   scripts/bump-version.sh 1.0.0-rc.1     # explicit SemVer version
#
# The release workflow checks that the git tag and Cargo.toml agree, so the
# version has to be bumped before the tag is pushed.

set -eu

script_directory=$(unset CDPATH; cd -- "$(dirname -- "$0")" && pwd)
repository_root=$(dirname -- "$script_directory")
manifest="$repository_root/Cargo.toml"
dry_run=0
requested=""

usage() {
    cat <<'USAGE'
Bump the mgit version.

USAGE:
    scripts/bump-version.sh [OPTIONS] <major|minor|patch|VERSION>

ARGUMENTS:
    major           Increase the major version (1.2.3 -> 2.0.0)
    minor           Increase the minor version (1.2.3 -> 1.3.0)
    patch           Increase the patch version (1.2.3 -> 1.2.4)
    VERSION         Set an explicit semantic version, for example 1.0.0-rc.1

OPTIONS:
    --manifest <PATH>   Cargo.toml to update (default: <repository>/Cargo.toml)
    --dry-run           Print the new version without writing anything
    -h, --help          Print this help

A pre-release suffix is dropped when a part is increased, so 1.2.3-rc.1
becomes 1.2.4 with `patch`.
USAGE
}

die() {
    printf 'bump-version: %s\n' "$*" >&2
    exit 1
}

while [ $# -gt 0 ]; do
    case "$1" in
        -h | --help)
            usage
            exit 0
            ;;
        --dry-run)
            dry_run=1
            shift
            ;;
        --manifest)
            [ $# -ge 2 ] || die "--manifest requires a value"
            manifest="$2"
            shift 2
            ;;
        --manifest=*)
            manifest="${1#*=}"
            shift
            ;;
        -*)
            die "unknown option: $1 (run with --help)"
            ;;
        *)
            [ -z "$requested" ] || die "only one version argument is allowed"
            requested="$1"
            shift
            ;;
    esac
done

[ -n "$requested" ] || die "expected major, minor, patch or a version (run with --help)"
[ -f "$manifest" ] || die "$manifest does not exist"

current=$(awk -F'"' '/^\[/ { section = $0 } section == "[package]" && /^version = / { print $2; exit }' "$manifest")
[ -n "$current" ] || die "cannot read the version from $manifest"

next=""
case "$requested" in
    major | minor | patch)
        base="${current%%-*}"
        major="${base%%.*}"
        rest="${base#*.}"
        minor="${rest%%.*}"
        patch="${rest#*.}"
        case "$major" in '' | *[!0-9]*) die "$current is not a semantic version" ;; esac
        case "$minor" in '' | *[!0-9]*) die "$current is not a semantic version" ;; esac
        case "$patch" in '' | *[!0-9]*) die "$current is not a semantic version" ;; esac
        case "$requested" in
            major)
                major=$((major + 1))
                minor=0
                patch=0
                ;;
            minor)
                minor=$((minor + 1))
                patch=0
                ;;
            patch)
                patch=$((patch + 1))
                ;;
        esac
        next="$major.$minor.$patch"
        ;;
    *)
        next="$requested"
        ;;
esac

if ! printf '%s' "$next" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$'; then
    die "$next is not a semantic version (expected MAJOR.MINOR.PATCH)"
fi

[ "$next" != "$current" ] || die "the version is already $current"

if [ "$dry_run" -eq 1 ]; then
    printf '%s -> %s (dry run)\n' "$current" "$next"
    exit 0
fi

temporary="$manifest.tmp.$$"
awk -v new_version="$next" '
    /^\[/ { section = $0 }
    !updated && section == "[package]" && /^version = / {
        sub(/"[^"]*"/, "\"" new_version "\"")
        updated = 1
    }
    { print }
' "$manifest" > "$temporary"
mv -- "$temporary" "$manifest"

lock="$(dirname -- "$manifest")/Cargo.lock"
if [ -f "$lock" ]; then
    temporary="$lock.tmp.$$"
    awk -F'"' -v new_version="$next" '
        /^\[\[package\]\]/ { name = "" }
        /^name = / { name = $2 }
        !updated && name == "mgit" && /^version = / {
            sub(/"[^"]*"/, "\"" new_version "\"")
            updated = 1
        }
        { print }
    ' "$lock" > "$temporary"
    mv -- "$temporary" "$lock"
fi

# The npm wrapper mirrors the Rust version; trusted publishing and the publish
# workflow require all of them to agree.
npm_manifest="$(dirname -- "$manifest")/npm/package.json"
if [ -f "$npm_manifest" ]; then
    temporary="$npm_manifest.tmp.$$"
    # JSON puts the key first, so the quoting field separator is used to replace
    # the value (the fourth field) instead of the first quoted string.
    awk -F'"' -v OFS='"' -v new_version="$next" '
        !updated && /^[[:space:]]*"version":/ {
            $4 = new_version
            updated = 1
        }
        { print }
    ' "$npm_manifest" > "$temporary"
    mv -- "$temporary" "$npm_manifest"
fi

printf 'mgit %s -> %s\n' "$current" "$next"
printf '\n'
printf 'Next steps:\n'
printf '  cargo test --all-targets\n'
printf '  git add Cargo.toml Cargo.lock npm/package.json\n'
printf '  git commit -m "chore(release): %s"\n' "$next"
printf '  git tag -a v%s -m "mgit %s"\n' "$next" "$next"
printf '  git push origin HEAD v%s\n' "$next"
