#!/usr/bin/env bash
# Installation script for manda-kasaayam

set -euo pipefail

# Get absolute path to the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create necessary directories
mkdir -p "${PROJECT_DIR}/bin"
mkdir -p "${PROJECT_DIR}/notes"

# Make the script executable
chmod a+x "${PROJECT_DIR}/src/manda.sh"

# Create symlinks in bin directory
ln -sf "${PROJECT_DIR}/src/manda.sh" "${PROJECT_DIR}/bin/manda"
ln -sf "${PROJECT_DIR}/src/manda.sh" "${PROJECT_DIR}/bin/md"

# Add to PATH and set MANDA_DIR in shell config
SHELL_CONFIG="$HOME/.zshrc"

# Check if entries already exist to avoid duplicates
if ! grep -q "export PATH=\"${PROJECT_DIR}/bin:\$PATH\"" "$SHELL_CONFIG"; then
  echo "\n# Manda-kasaayam configuration" >>"$SHELL_CONFIG"
  echo "export PATH=\"${PROJECT_DIR}/bin:\$PATH\"" >>"$SHELL_CONFIG"
  echo "export MANDA_DIR=\"${PROJECT_DIR}/notes\"" >>"$SHELL_CONFIG"
  echo "Added manda-kasaayam to PATH and set MANDA_DIR in $SHELL_CONFIG"
else
  echo "PATH entry for manda-kasaayam already exists in $SHELL_CONFIG"
fi

echo "\nInstallation complete!"
echo "Please restart your terminal or run 'source $SHELL_CONFIG'"
echo "Then you can use 'manda' or 'md' command to manage your notes"
