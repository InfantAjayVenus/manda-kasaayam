#!/usr/bin/env bash
# Installation script for brain-dump

set -euo pipefail

# Get absolute path to the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create necessary directories
mkdir -p "${PROJECT_DIR}/bin"
mkdir -p "${PROJECT_DIR}/dumps"

# Make the script executable
chmod a+x "${PROJECT_DIR}/src/dump.sh"

# Create symlink in bin directory
ln -sf "${PROJECT_DIR}/src/dump.sh" "${PROJECT_DIR}/bin/dump"

# Add to PATH and set DUMP_DIR in shell config
SHELL_CONFIG="$HOME/.zshrc"

# Check if entries already exist to avoid duplicates
if ! grep -q "export PATH=\"${PROJECT_DIR}/bin:\$PATH\"" "$SHELL_CONFIG"; then
  echo "\n# Brain-dump configuration" >>"$SHELL_CONFIG"
  echo "export PATH=\"${PROJECT_DIR}/bin:\$PATH\"" >>"$SHELL_CONFIG"
  echo "export DUMP_DIR=\"${PROJECT_DIR}/dumps\"" >>"$SHELL_CONFIG"
  echo "Added brain-dump to PATH and set DUMP_DIR in $SHELL_CONFIG"
else
  echo "PATH entry for brain-dump already exists in $SHELL_CONFIG"
fi

echo "\nInstallation complete!"
echo "Please restart your terminal or run 'source $SHELL_CONFIG'"
echo "Then you can use 'dump' command to manage your notes"
