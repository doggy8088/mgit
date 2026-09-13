#!/bin/sh
#
# mgit installer for macOS, Linux and the POSIX shells of Windows (MSYS/Cygwin).
#
#   curl -fsSL https://raw.githubusercontent.com/doggy8088/mgit/main/install.sh | sh
#
# The script downloads the release archive for this machine, verifies its
# SHA-256 checksum and installs the `mgit` binary.

set -eu

REPOSITORY="doggy8088/mgit"
PROGRAM="mgit"

version="${MGIT_VERSION:-latest}"
install_dir="${MGIT_INSTALL_DIR:-}"
download_base="${MGIT_DOWNLOAD_BASE:-}"
dry_run=0

usage() {
    cat <<'USAGE'
Install mgit from the GitHub releases.

USAGE:
    install.sh [OPTIONS]

OPTIONS:
    -v, --version <VERSION>     Release to install, for example 0.1.0 (default: latest)
    -d, --dir <DIRECTORY>       Directory that receives the binary
        --download-base <URL>   Base URL of the release assets (for testing)
        --dry-run               Print the plan and exit without downloading
    -h, --help                  Print this help

ENVIRONMENT:
    MGIT_VERSION         Same as --version
    MGIT_INSTALL_DIR     Same as --dir
    MGIT_DOWNLOAD_BASE   Same as --download-base

EXIT CODES:
    0   mgit was installed
    1   anything went wrong
USAGE
}

info() {
    printf '%s\n' "$*"
}

die() {
    printf 'mgit-install: %s\n' "$*" >&2
    exit 1
}

while [ $# -gt 0 ]; do
    case "$1" in
        -v | --version)
            [ $# -ge 2 ] || die "--version requires a value"
            version="$2"
            shift 2
            ;;
        --version=*)
            version="${1#*=}"
            shift
            ;;
        -d | --dir)
            [ $# -ge 2 ] || die "--dir requires a value"
            install_dir="$2"
            shift 2
            ;;
        --dir=*)
            install_dir="${1#*=}"
            shift
            ;;
        --download-base)
            [ $# -ge 2 ] || die "--download-base requires a value"
            download_base="$2"
            shift 2
            ;;
        --download-base=*)
            download_base="${1#*=}"
            shift
            ;;
        --dry-run)
            dry_run=1
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

# Releases are tagged with a leading `v`, users usually type the plain version.
case "$version" in
    v*) version="${version#v}" ;;
esac

detect_os() {
    uname_s=$(uname -s 2>/dev/null || echo unknown)
    case "$uname_s" in
        Darwin) echo "macos" ;;
        Linux) echo "linux" ;;
        MINGW* | MSYS* | CYGWIN*) echo "windows" ;;
        *) die "unsupported operating system: $uname_s" ;;
    esac
}

detect_architecture() {
    uname_m=$(uname -m 2>/dev/null || echo unknown)
    case "$uname_m" in
        x86_64 | amd64 | AMD64) echo "x86_64" ;;
        arm64 | aarch64 | ARM64) echo "aarch64" ;;
        *) die "unsupported architecture: $uname_m (mgit ships x86_64 and aarch64 builds)" ;;
    esac
}

# The target triple of the release assets.
detect_target() {
    os_name=$1
    architecture=$2
    case "$os_name" in
        macos) echo "$architecture-apple-darwin" ;;
        # The musl builds are static, so they run on every Linux distribution.
        linux) echo "$architecture-unknown-linux-musl" ;;
        windows) echo "$architecture-pc-windows-msvc" ;;
    esac
}

detect_archive() {
    case "$1" in
        windows) echo "zip" ;;
        *) echo "tar.gz" ;;
    esac
}

default_install_dir() {
    case "$1" in
        windows)
            printf '%s\n' "${USERPROFILE:-$HOME}/.local/bin"
            ;;
        *)
            if [ -d /usr/local/bin ] && [ -w /usr/local/bin ]; then
                printf '%s\n' "/usr/local/bin"
            else
                printf '%s\n' "$HOME/.local/bin"
            fi
            ;;
    esac
}

download() {
    url="$1"
    destination="$2"
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "$url" -o "$destination" || die "failed to download $url"
    elif command -v wget >/dev/null 2>&1; then
        wget -qO "$destination" "$url" || die "failed to download $url"
    else
        die "curl or wget is required to download mgit"
    fi
}

sha256_of() {
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$1" | awk '{print $1}'
    elif command -v shasum >/dev/null 2>&1; then
        shasum -a 256 "$1" | awk '{print $1}'
    elif command -v openssl >/dev/null 2>&1; then
        openssl dgst -sha256 "$1" | awk '{print $NF}'
    else
        die "no sha256 tool found (need sha256sum, shasum or openssl)"
    fi
}

verify_checksum() {
    archive="$1"
    checksum_file="$2"
    expected=$(awk '{print $1}' "$checksum_file" | head -n 1)
    [ -n "$expected" ] || die "the checksum file $checksum_file is empty"
    actual=$(sha256_of "$archive")
    [ "$expected" = "$actual" ] ||
        die "checksum mismatch for $archive: expected $expected, got $actual"
}

os_name=$(detect_os)
architecture=$(detect_architecture)
target=$(detect_target "$os_name" "$architecture")
archive=$(detect_archive "$os_name")

if [ -z "$install_dir" ]; then
    install_dir=$(default_install_dir "$os_name")
fi
case "$install_dir" in
    /*) ;;
    *) install_dir="$(pwd)/$install_dir" ;;
esac

binary_name="$PROGRAM"
[ "$os_name" = "windows" ] && binary_name="$PROGRAM.exe"
asset="$PROGRAM-$target.$archive"

if [ -z "$download_base" ]; then
    if [ "$version" = "latest" ]; then
        download_base="https://github.com/$REPOSITORY/releases/latest/download"
    else
        download_base="https://github.com/$REPOSITORY/releases/download/v$version"
    fi
fi

info "mgit installer"
info "  version:   $version"
info "  target:    $target"
info "  archive:   $asset"
info "  source:    $download_base"
info "  directory: $install_dir"

if [ "$dry_run" -eq 1 ]; then
    info "Dry run: nothing was downloaded."
    exit 0
fi

work_dir=$(mktemp -d 2>/dev/null || mktemp -d -t mgit) || die "cannot create a temporary directory"
trap 'rm -rf "$work_dir"' EXIT INT TERM

info ""
info "Downloading $asset ..."
download "$download_base/$asset" "$work_dir/$asset"
download "$download_base/$asset.sha256" "$work_dir/$asset.sha256"
verify_checksum "$work_dir/$asset" "$work_dir/$asset.sha256"
info "Checksum verified."

mkdir -p "$work_dir/extract"
case "$archive" in
    zip)
        command -v unzip >/dev/null 2>&1 || die "unzip is required to extract $asset"
        unzip -q "$work_dir/$asset" -d "$work_dir/extract" ||
            die "failed to extract $asset"
        ;;
    *)
        tar -xzf "$work_dir/$asset" -C "$work_dir/extract" ||
            die "failed to extract $asset"
        ;;
esac

[ -f "$work_dir/extract/$binary_name" ] ||
    die "the archive $asset does not contain $binary_name"

mkdir -p "$install_dir"
cp "$work_dir/extract/$binary_name" "$install_dir/$binary_name"
chmod +x "$install_dir/$binary_name"

info ""
info "Installed $PROGRAM to $install_dir/$binary_name"

case ":$PATH:" in
    *":$install_dir:"*) ;;
    *)
        info ""
        info "Warning: $install_dir is not in your PATH."
        info "Add it to your shell profile, for example:"
        info "  fish:  set -Ux PATH \$PATH $install_dir"
        info "  zsh:   echo 'export PATH=\"\$PATH:$install_dir\"' >> ~/.zshrc"
        info "  bash:  echo 'export PATH=\"\$PATH:$install_dir\"' >> ~/.bashrc"
        ;;
esac
