#!/bin/sh
#
# Vendor the release archives into npm/vendor/<target>/.
#
#   npm/scripts/vendor.sh <archive-directory> [target...]
#
# The archives are the assets of a GitHub release. Download them first, for
# example:
#
#   gh release download v0.1.0 --dir assets \
#     --pattern '*.tar.gz' --pattern '*.zip' --pattern '*.sha256'
#   npm/scripts/vendor.sh assets
#
# With no target argument every bundled target is vendored. Whenever a matching
# `.sha256` file sits next to an archive, the checksum is verified before the
# archive is unpacked.

set -eu

script_directory=$(unset CDPATH; cd -- "$(dirname -- "$0")" && pwd)
package_directory=$(dirname -- "$script_directory")
vendor_directory="$package_directory/vendor"

# Keep in sync with the TARGETS table in npm/lib/platform.js.
all_targets="x86_64-apple-darwin aarch64-apple-darwin \
x86_64-unknown-linux-musl aarch64-unknown-linux-musl \
x86_64-pc-windows-msvc aarch64-pc-windows-msvc"

# The release target that belongs to this machine, using the same mapping as
# install.sh: Linux runs the statically linked musl build.
host_target() {
    uname_s=$(uname -s 2> /dev/null || echo unknown)
    uname_m=$(uname -m 2> /dev/null || echo unknown)

    case "$uname_m" in
        x86_64 | amd64 | AMD64) architecture=x86_64 ;;
        arm64 | aarch64 | ARM64) architecture=aarch64 ;;
        *) die "unsupported architecture: $uname_m" ;;
    esac

    case "$uname_s" in
        Darwin) printf '%s\n' "$architecture-apple-darwin" ;;
        Linux) printf '%s\n' "$architecture-unknown-linux-musl" ;;
        MINGW* | MSYS* | CYGWIN*) printf '%s\n' "$architecture-pc-windows-msvc" ;;
        *) die "unsupported operating system: $uname_s" ;;
    esac
}

usage() {
    cat <<'USAGE'
Vendor the mgit release archives into npm/vendor/<target>/.

USAGE:
    npm/scripts/vendor.sh <archive-directory> [target...]
    npm/scripts/vendor.sh --host-target      Print the bundled target of this machine
    npm/scripts/vendor.sh --help

ARGUMENTS:
    <archive-directory>   Directory that holds the release archives
    target...             Release targets to vendor, `host` for this machine
                          (default: every bundled target)

TARGETS:
    x86_64-apple-darwin, aarch64-apple-darwin,
    x86_64-unknown-linux-musl, aarch64-unknown-linux-musl,
    x86_64-pc-windows-msvc, aarch64-pc-windows-msvc

EXIT CODES:
    0   every requested target was vendored
    1   an archive was missing, broken or had the wrong checksum
USAGE
}

die() {
    printf 'vendor: %s\n' "$*" >&2
    exit 1
}

if [ $# -ge 1 ]; then
    case "$1" in
        -h | --help)
            usage
            exit 0
            ;;
        --host-target)
            host_target
            exit 0
            ;;
    esac
fi

[ $# -ge 1 ] || die "usage: vendor.sh <archive-directory> [target...]"
archive_directory=$1
shift

if [ $# -gt 0 ]; then
    targets="$*"
else
    targets="$all_targets"
fi

[ -d "$archive_directory" ] || die "no such archive directory: $archive_directory"

binary_name() {
    case "$1" in
        *windows*) printf '%s\n' "mgit.exe" ;;
        *) printf '%s\n' "mgit" ;;
    esac
}

sha256_of() {
    if command -v sha256sum > /dev/null 2>&1; then
        sha256sum "$1" | awk '{print $1}'
    elif command -v shasum > /dev/null 2>&1; then
        shasum -a 256 "$1" | awk '{print $1}'
    elif command -v openssl > /dev/null 2>&1; then
        openssl dgst -sha256 "$1" | awk '{print $NF}'
    else
        die "no sha256 tool found (need sha256sum, shasum or openssl)"
    fi
}

verify_checksum() {
    archive="$1"
    checksum_file="$archive.sha256"

    if [ ! -f "$checksum_file" ]; then
        printf '  warning: no %s, skipping the checksum check\n' "$(basename "$checksum_file")"
        return 0
    fi

    expected=$(awk '{print $1}' "$checksum_file" | head -n 1)
    [ -n "$expected" ] || die "the checksum file $checksum_file is empty"
    actual=$(sha256_of "$archive")
    [ "$expected" = "$actual" ] ||
        die "checksum mismatch for $(basename "$archive"): expected $expected, got $actual"
}

mkdir -p "$vendor_directory"

for target in $targets; do
    if [ "$target" = "host" ]; then
        target=$(host_target)
    fi

    case " $all_targets " in
        *" $target "*) ;;
        *) die "unknown target: $target" ;;
    esac

    case "$target" in
        *windows*) archive="$archive_directory/mgit-$target.zip" ;;
        *) archive="$archive_directory/mgit-$target.tar.gz" ;;
    esac

    [ -f "$archive" ] || die "missing archive: $archive"
    verify_checksum "$archive"

    destination="$vendor_directory/$target"
    rm -rf "$destination"
    mkdir -p "$destination"

    case "$archive" in
        *.zip)
            command -v unzip > /dev/null 2>&1 ||
                die "unzip is required to extract $(basename "$archive")"
            unzip -q -o "$archive" -d "$destination"
            ;;
        *)
            tar -xzf "$archive" -C "$destination"
            ;;
    esac

    binary="$destination/$(binary_name "$target")"
    [ -f "$binary" ] || die "$(basename "$archive") does not contain $(binary_name "$target")"
    chmod +x "$binary"

    printf 'vendored %-28s <- %s\n' "$target" "$(basename "$archive")"
done
