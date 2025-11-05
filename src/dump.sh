#!/usr/bin/env bash
# dump — open today's note; on new-day create new and commit+push previous note
# Usage: dump [dump_dir]
# First run: you can pass the path to your git-backed notes repo or set DUMP_DIR env var.

set -euo pipefail

# Config: DUMP_DIR can be passed as first arg, or via env DUMP_DIR, or defaults to ~/notes
DUMP_DIR="${1:-${DUMP_DIR:-$HOME/notes}}"
EDITOR="${EDITOR:-nvim}"
BRANCH="${BRANCH:-main}"
REMOTE="${REMOTE:-origin}"
DATE_FMT="%Y-%m-%d"
TODAY="$(date +"$DATE_FMT")"
TODAY_FILE="$DUMP_DIR/$TODAY.md"

# Ensure notes dir exists
if [ ! -d "$DUMP_DIR" ]; then
  echo "Notes dir not found: $DUMP_DIR"
  echo "Create it and initialize a git repo (git init; git remote add origin ...), or run this script with an existing repo path."
  exit 1
fi

# Check if DUMP_DIR is within a git repo (not necessarily the root)
GIT_DIR="$DUMP_DIR"
GIT_ROOT=""

# Walk up the directory tree to find .git
while [ "$GIT_DIR" != "/" ] && [ ! -d "$GIT_DIR/.git" ]; do
  GIT_DIR="$(dirname "$GIT_DIR")"
done

if [ -d "$GIT_DIR/.git" ]; then
  GIT_ROOT="$GIT_DIR"
else
  echo "No git repository found for: $DUMP_DIR"
  echo "Please ensure $DUMP_DIR is within a git repository."
  exit 1
fi

# Find the most recent markdown file (not including today) sorted by name (ISO dates work)
# Using ls instead of find with -printf which is GNU-specific and not available on macOS
prev_file="$(cd "$DUMP_DIR" && ls -1 ????-??-??.md 2>/dev/null | grep -v "$TODAY.md" | sort -r | head -n1 || true)"
prev_path=""
if [ -n "$prev_file" ]; then
  prev_path="$DUMP_DIR/$prev_file"
fi

# If today's file doesn't exist, commit & push the previous file (if any)
if [ ! -f "$TODAY_FILE" ]; then
  if [ -n "$prev_path" ] && [ -f "$prev_path" ]; then
    (
      # Use the git root directory for git operations
      cd "$GIT_ROOT"
      # Calculate the relative path from git root to the file
      REL_PATH="$(realpath --relative-to="$GIT_ROOT" "$prev_path")"
      git add -- "$REL_PATH"
      # only commit if there are staged changes
      if ! git diff --cached --quiet; then
        git commit -m "Auto: save $REL_PATH"
        # push, but do not fail the script if push fails (network etc.)
        git push "$REMOTE" "$BRANCH" || echo "git push failed (continuing)"
      fi
    )
  fi
  # create today's file with a header
  mkdir -p "$DUMP_DIR"
  printf "# %s\n\n" "$TODAY" >"$TODAY_FILE"
fi

# Open today's file in editor
"$EDITOR" "$TODAY_FILE"
