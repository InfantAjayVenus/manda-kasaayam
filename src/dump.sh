#!/usr/bin/env bash
# dump — open today's note; on new-day create new and commit+push previous note
# Usage: dump [dump_dir]
#        dump do - lists all task items grouped by headers
# First run: you can pass the path to your git-backed notes repo or set DUMP_DIR env var.
#
# Special case: If the first argument is a file path ending in .md, the script will
# just add timestamps to headers in that file without opening it in the editor.

set -euo pipefail

# Parse the file after editing and add timestamps to h2 headers
add_timestamps_to_headers() {
  local file="$1"
  local current_time
  current_time="$(date +"%H:%M")"

  # Use sed to find h2 headers (##) without timestamps and add timestamps
  # This looks for lines starting with ##, not followed by @ and a timestamp
  # Then adds the current time in HH:MM format after the header text
  if [[ "$(uname)" == "Darwin" ]]; then
    # macOS requires an empty string with -i to avoid creating a backup file
    sed -i '' -E 's/^(## [^@]+)$/\1 @'"$current_time"'/g' "$file"
  else
    # Linux version
    sed -i -E 's/^(## [^@]+)$/\1 @'"$current_time"'/g' "$file"
  fi

  echo "Timestamps added to headers in $file"
}

# Function to parse and display task list items grouped by headers
list_tasks() {
  local file="$1"
  local current_header=""
  local has_tasks=false

  # Read the file line by line
  while IFS= read -r line; do
    # Check if the line is a header
    if [[ "$line" =~ ^#+ ]]; then
      current_header="$line"
      # Reset the has_tasks flag for the new header
      has_tasks=false
    # Check if the line is a task list item
    elif [[ "$line" =~ ^[[:space:]]*-[[:space:]]*\[[[:space:]xX]?\] ]]; then
      # If this is the first task under this header, print the header
      if [[ "$has_tasks" == false && -n "$current_header" ]]; then
        echo "$current_header"
        has_tasks=true
      fi
      # Print the task with added indentation
      echo -e "\t$line"
    fi
  done < "$file"
}

# Function to extract incomplete tasks from a file and write them to the output
extract_incomplete_tasks() {
  local file="$1"
  local output_file="$2"
  local current_header=""
  local has_incomplete_tasks=false
  local temp_output=""

  # Read the file line by line
  while IFS= read -r line; do
    # Check if the line is a header (## level)
    if [[ "$line" =~ ^##[[:space:]] ]]; then
      # If we had incomplete tasks under the previous header, write them
      if [[ "$has_incomplete_tasks" == true && -n "$current_header" ]]; then
        echo "" >> "$output_file"
        echo "$current_header" >> "$output_file"
        echo "" >> "$output_file"
        echo "$temp_output" >> "$output_file"
      fi
      # Store the new header and reset flags
      current_header="$line"
      has_incomplete_tasks=false
      temp_output=""
    # Check if the line is an incomplete task (- [ ])
    elif [[ "$line" =~ ^[[:space:]]*-[[:space:]]*\[[[:space:]]\] ]]; then
      has_incomplete_tasks=true
      if [[ -z "$temp_output" ]]; then
        temp_output="$line"
      else
        temp_output="$temp_output"$'\n'"$line"
      fi
    fi
  done < "$file"

  # Write any remaining incomplete tasks at the end of the file
  if [[ "$has_incomplete_tasks" == true && -n "$current_header" ]]; then
    echo "" >> "$output_file"
    echo "$current_header" >> "$output_file"
    echo "" >> "$output_file"
    echo "$temp_output" >> "$output_file"
  fi
}

# Check if first argument is "do" to list tasks
if [[ $# -gt 0 && "$1" == "do" ]]; then
  # Config setup for accessing the correct files
  DUMP_DIR="${2:-${DUMP_DIR:-$HOME/notes}}"
  TODAY="$(date +"%Y-%m-%d")"
  TODAY_FILE="$DUMP_DIR/$TODAY.md"
  
  # Check if today's file exists
  if [ -f "$TODAY_FILE" ]; then
    list_tasks "$TODAY_FILE"
  else
    echo "Today's note file doesn't exist yet."
  fi
  exit 0
fi

# Check if first argument is a markdown file for direct timestamp processing
if [[ $# -gt 0 && "$1" == *.md && -f "$1" ]]; then
  add_timestamps_to_headers "$1"
  exit 0
fi

# Config: DUMP_DIR can be passed as first arg, or via env DUMP_DIR, or defaults to ~/notes
DUMP_DIR="${1:-${DUMP_DIR:-$HOME/notes}}"
EDITOR="${EDITOR:-nvim}"
BRANCH="${BRANCH:-main}"
REMOTE="${REMOTE:-origin}"
DATE_FMT="%Y-%m-%d"
TIME_FMT="%H:%M"
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
      REL_PATH="${prev_path#$GIT_ROOT/}"
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
  
  # Extract incomplete tasks from the previous file if it exists
  if [ -n "$prev_path" ] && [ -f "$prev_path" ]; then
    extract_incomplete_tasks "$prev_path" "$TODAY_FILE"
  fi
fi

# Open today's file in editor
"$EDITOR" "$TODAY_FILE"

# Run the timestamp function on the file after editor exits
add_timestamps_to_headers "$TODAY_FILE"
