#!/bin/bash
set -e

# Target installation path
INSTALL_DIR="/usr/local/bin"

# Check if target directory is writable, otherwise fallback to ~/.local/bin
if [ ! -w "$INSTALL_DIR" ]; then
    INSTALL_DIR="$HOME/.local/bin"
    mkdir -p "$INSTALL_DIR"
fi

# Source URL for remote installations (assuming doggy8088/mgit)
REPO_URL="https://raw.githubusercontent.com/doggy8088/mgit/main"

echo "Installing mgit to $INSTALL_DIR..."

if [ -f "./mgit" ]; then
    # Local installation
    cp "./mgit" "$INSTALL_DIR/mgit"
else
    # Remote installation via curl
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "$REPO_URL/mgit" -o "$INSTALL_DIR/mgit"
    elif command -v wget >/dev/null 2>&1; then
        wget -qO "$INSTALL_DIR/mgit" "$REPO_URL/mgit"
    else
        echo "Error: curl or wget is required to download mgit." >&2
        exit 1
    fi
fi

# Make executable
chmod +x "$INSTALL_DIR/mgit"

echo "Successfully installed mgit to $INSTALL_DIR/mgit!"
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo "Warning: $INSTALL_DIR is not in your PATH."
    echo "You may need to add it to your shell configuration (e.g., ~/.bashrc or ~/.zshrc):"
    echo "  export PATH=\"\$PATH:$INSTALL_DIR\""
fi
