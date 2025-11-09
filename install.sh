#!/usr/bin/env bash
# Installation script for manda-kasaayam

set -euo pipefail

# Get absolute path to the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Prompt for notes directory
echo "Manda-kasaayam Installation"
echo "============================"
echo ""
echo "Please enter the path where you want to store your notes."
echo "This directory will be used as MANDA_DIR."
echo ""
read -p "Notes directory path (press Enter for ${PROJECT_DIR}/notes): " NOTES_DIR

# Use default if empty
if [ -z "$NOTES_DIR" ]; then
  NOTES_DIR="${PROJECT_DIR}/notes"
fi

# Expand tilde to home directory if present
NOTES_DIR="${NOTES_DIR/#\~/$HOME}"

# Convert to absolute path
if [[ "$NOTES_DIR" != /* ]]; then
  NOTES_DIR="$(cd "$(dirname "$NOTES_DIR")" 2>/dev/null && pwd)/$(basename "$NOTES_DIR")" || NOTES_DIR="$PWD/$NOTES_DIR"
fi

echo ""
echo "Using notes directory: $NOTES_DIR"

# Create the notes directory if it doesn't exist
if [ ! -d "$NOTES_DIR" ]; then
  read -p "Directory doesn't exist. Create it? (y/n): " CREATE_DIR
  if [[ "$CREATE_DIR" =~ ^[Yy]$ ]]; then
    mkdir -p "$NOTES_DIR"
    echo "Created directory: $NOTES_DIR"
  else
    echo "Installation cancelled."
    exit 1
  fi
fi

# Check if it's a git repository
if [ ! -d "$NOTES_DIR/.git" ]; then
  echo ""
  echo "Warning: $NOTES_DIR is not a git repository."
  read -p "Initialize git repository? (y/n): " INIT_GIT
  if [[ "$INIT_GIT" =~ ^[Yy]$ ]]; then
    (cd "$NOTES_DIR" && git init)
    echo "Initialized git repository in $NOTES_DIR"
    echo "Don't forget to add a remote: git remote add origin <url>"
  fi
fi

# Create bin directory
mkdir -p "${PROJECT_DIR}/bin"

# Make the script executable
chmod a+x "${PROJECT_DIR}/src/manda.sh"

# Create symlinks in bin directory
ln -sf "${PROJECT_DIR}/src/manda.sh" "${PROJECT_DIR}/bin/manda"
ln -sf "${PROJECT_DIR}/src/manda.sh" "${PROJECT_DIR}/bin/mk"

# Add to PATH and set MANDA_DIR in shell config
SHELL_CONFIG="$HOME/.zshrc"

# Check if entries already exist to avoid duplicates
if ! grep -q "export PATH=\"${PROJECT_DIR}/bin:\$PATH\"" "$SHELL_CONFIG"; then
  echo ""
  echo "Adding configuration to $SHELL_CONFIG..."
  echo "" >>"$SHELL_CONFIG"
  echo "# Manda-kasaayam configuration" >>"$SHELL_CONFIG"
  echo "export PATH=\"${PROJECT_DIR}/bin:\$PATH\"" >>"$SHELL_CONFIG"
  echo "export MANDA_DIR=\"${NOTES_DIR}\"" >>"$SHELL_CONFIG"
  echo "Added manda-kasaayam to PATH and set MANDA_DIR in $SHELL_CONFIG"
else
  # Update existing MANDA_DIR if PATH already exists
  if grep -q "export MANDA_DIR=" "$SHELL_CONFIG"; then
    # Use different sed syntax for macOS
    if [[ "$(uname)" == "Darwin" ]]; then
      sed -i '' "s|export MANDA_DIR=.*|export MANDA_DIR=\"${NOTES_DIR}\"|g" "$SHELL_CONFIG"
    else
      sed -i "s|export MANDA_DIR=.*|export MANDA_DIR=\"${NOTES_DIR}\"|g" "$SHELL_CONFIG"
    fi
    echo "Updated MANDA_DIR in $SHELL_CONFIG"
  else
    echo "export MANDA_DIR=\"${NOTES_DIR}\"" >>"$SHELL_CONFIG"
    echo "Added MANDA_DIR to $SHELL_CONFIG"
  fi
fi

echo ""
echo "============================================"
echo "Installation complete!"
echo "============================================"
echo "Notes directory: $NOTES_DIR"
echo ""
echo "Please restart your terminal or run:"
echo "  source $SHELL_CONFIG"
echo ""
echo "Then you can use 'manda' or 'mk' command to manage your notes"
echo ""
