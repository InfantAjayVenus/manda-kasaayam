#!/usr/bin/env bash
# manda — open today's note; on new-day create new and commit+push previous note
# Usage: manda [notes_dir]
#        manda do - lists all task items grouped by headers
# First run: you can pass the path to your git-backed notes repo or set MANDA_DIR env var.
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
  done <"$file"
}

# Function to extract incomplete tasks from a file and write them to the output
extract_incomplete_tasks() {
  local file="$1"
  local output_file="$2"
  local current_header=""
  local has_incomplete_tasks=false
  local temp_output=""

  # Extract the filename from the full path
  local source_filename="$(basename "$file")"

  # Read the file line by line
  while IFS= read -r line; do
    # Check if the line is a header (## level)
    if [[ "$line" =~ ^##[[:space:]] ]]; then
      # If we had incomplete tasks under the previous header, write them
      if [[ "$has_incomplete_tasks" == true && -n "$current_header" ]]; then
        echo "" >>"$output_file"
        echo "$current_header [[${source_filename}]]" >>"$output_file"
        echo "" >>"$output_file"
        echo "$temp_output" >>"$output_file"
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
  done <"$file"

  # Write any remaining incomplete tasks at the end of the file
  if [[ "$has_incomplete_tasks" == true && -n "$current_header" ]]; then
    echo "" >>"$output_file"
    echo "$current_header [[${source_filename}]]" >>"$output_file"
    echo "" >>"$output_file"
    echo "$temp_output" >>"$output_file"
  fi
}

# Function to display tasks in an interactive TUI
interactive_task_view() {
  local file="$1"
  local tasks=()
  local headers=()
  local current_header=""

  # Parse tasks and headers
  while IFS= read -r line; do
    if [[ "$line" =~ ^##[[:space:]] ]]; then
      current_header="$line"
    elif [[ "$line" =~ ^[[:space:]]*-[[:space:]]*\[[[:space:]xX]?\] ]]; then
      tasks+=("$line")
      headers+=("$current_header")
    fi
  done <"$file"

  # Exit if no tasks found
  if [ ${#tasks[@]} -eq 0 ]; then
    echo "No tasks found in today's file."
    return
  fi

  local selected=0
  local total=${#tasks[@]}

  # Function to draw the screen
  draw_screen() {
    clear
    echo "=== Task List (q: quit, ↑↓/jk: navigate, space: toggle, d: delete) ==="
    echo ""

    for i in "${!tasks[@]}"; do
      if [ $i -eq $selected ]; then
        echo -e "\033[7m> ${headers[$i]}\033[0m" # Reverse video for selection
        echo -e "\033[7m  ${tasks[$i]}\033[0m"
      else
        echo "  ${headers[$i]}"
        echo "    ${tasks[$i]}"
      fi
      echo ""
    done
  }

  # Main loop
  while true; do
    draw_screen

    # Read single character
    IFS= read -rsn1 key

    case "$key" in
    $'\x1b') # Escape sequence
      read -rsn2 -t 0.1 key
      case "$key" in
      '[A' | '[D') # Up arrow
        ((selected > 0)) && ((selected--))
        ;;
      '[B' | '[C') # Down arrow
        ((selected < total - 1)) && ((selected++))
        ;;
      esac
      ;;
    'k' | 'K') # Vi-style up
      ((selected > 0)) && ((selected--))
      ;;
    'j' | 'J') # Vi-style down
      ((selected < total - 1)) && ((selected++))
      ;;
    ' ') # Space to toggle task
      local task="${tasks[$selected]}"
      if [[ "$task" =~ \[[[:space:]]\] ]]; then
        # Mark as complete
        tasks[$selected]="${task//\[ \]/[x]}"
      elif [[ "$task" =~ \[[xX]\] ]]; then
        # Mark as incomplete
        tasks[$selected]="${task//\[[xX]\]/[ ]}"
      fi
      # Update the file
      update_file_with_tasks "$file"
      ;;
    'd' | 'D') # Delete task
      unset 'tasks[$selected]'
      unset 'headers[$selected]'
      tasks=("${tasks[@]}") # Re-index array
      headers=("${headers[@]}")
      total=${#tasks[@]}
      if [ $total -eq 0 ]; then
        update_file_with_tasks "$file"
        echo "All tasks processed!"
        return
      fi
      ((selected >= total)) && ((selected--))
      update_file_with_tasks "$file"
      ;;
    'q' | 'Q') # Quit
      clear
      return
      ;;
    esac
  done
}

# Function to update the file with modified tasks
update_file_with_tasks() {
  local file="$1"

  # Create a temporary file with updated content
  local temp_file=$(mktemp)
  local current_header=""
  local in_task_section=false

  # First, write everything from the original file except task lines
  while IFS= read -r line; do
    if [[ "$line" =~ ^##[[:space:]] ]]; then
      current_header="$line"
      echo "$line" >>"$temp_file"
      in_task_section=true
    elif [[ "$line" =~ ^[[:space:]]*-[[:space:]]*\[[[:space:]xX]?\] ]]; then
      # Skip task lines, we'll add them back from our arrays
      continue
    else
      if [ "$in_task_section" = true ] && [ -z "$line" ]; then
        # This is the blank line after tasks, write updated tasks first
        for i in "${!headers[@]}"; do
          if [ "${headers[$i]}" = "$current_header" ]; then
            echo "${tasks[$i]}" >>"$temp_file"
          fi
        done
        in_task_section=false
      fi
      echo "$line" >>"$temp_file"
    fi
  done <"$file"

  # Handle tasks at the end of file (no trailing blank line)
  if [ "$in_task_section" = true ]; then
    for i in "${!headers[@]}"; do
      if [ "${headers[$i]}" = "$current_header" ]; then
        echo "${tasks[$i]}" >>"$temp_file"
      fi
    done
  fi

  # Replace original file
  mv "$temp_file" "$file"
}

# Function to display help
show_help() {
  cat <<EOF
manda — open today's note; on new-day create new and commit+push previous note

Usage:
  manda [notes_dir]            Open today's note file in \$EDITOR
  manda do [notes_dir]         Interactive task list view (toggle/delete tasks)
  manda <file.md>              Add timestamps to headers in specified file
  manda -h, --help             Show this help message

Options:
  notes_dir                    Path to git-backed notes directory
                               Can also be set via MANDA_DIR environment variable
                               (Required if MANDA_DIR is not set)

Environment Variables:
  MANDA_DIR                    Notes directory path (required)
  EDITOR                       Editor to use (default: nvim)
  BRANCH                       Git branch to push to (default: main)
  REMOTE                       Git remote to push to (default: origin)

Examples:
  manda                        Open today's note with default settings
  manda ~/my-notes             Open today's note in ~/my-notes
  manda do                     View and manage tasks interactively
  manda 2025-11-07.md          Add timestamps to specified file
  
First run: Create a git-backed notes directory and initialize it with git, or
pass the path to your existing notes repo.

EOF
}

# Check for help flag
if [[ $# -gt 0 && ("$1" == "-h" || "$1" == "--help") ]]; then
  show_help
  exit 0
fi

# Check if first argument is "do" to list tasks
if [[ $# -gt 0 && "$1" == "do" ]]; then
  # Config setup for accessing the correct files
  MANDA_DIR="${2:-${MANDA_DIR:-}}"

  # Check if MANDA_DIR is set
  if [ -z "$MANDA_DIR" ]; then
    echo "Error: Notes directory not specified."
    echo "Set MANDA_DIR environment variable or pass the directory as an argument:"
    echo "  manda do /path/to/notes"
    exit 1
  fi

  TODAY="$(date +"%Y-%m-%d")"
  TODAY_FILE="$MANDA_DIR/$TODAY.md"

  # Check if today's file exists
  if [ -f "$TODAY_FILE" ]; then
    interactive_task_view "$TODAY_FILE"
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

# Config: MANDA_DIR can be passed as first arg, or via env MANDA_DIR
MANDA_DIR="${1:-${MANDA_DIR:-}}"

# Check if MANDA_DIR is set
if [ -z "$MANDA_DIR" ]; then
  echo "Error: Notes directory not specified."
  echo ""
  echo "Set MANDA_DIR environment variable or pass the directory as an argument:"
  echo "  export MANDA_DIR=/path/to/notes"
  echo "  manda /path/to/notes"
  echo ""
  echo "See 'manda --help' for more information."
  exit 1
fi

EDITOR="${EDITOR:-nvim}"
BRANCH="${BRANCH:-main}"
REMOTE="${REMOTE:-origin}"
DATE_FMT="%Y-%m-%d"
TIME_FMT="%H:%M"
TODAY="$(date +"$DATE_FMT")"
TODAY_FILE="$MANDA_DIR/$TODAY.md"

# Ensure notes dir exists
if [ ! -d "$MANDA_DIR" ]; then
  echo "Notes dir not found: $MANDA_DIR"
  echo "Create it and initialize a git repo (git init; git remote add origin ...), or run this script with an existing repo path."
  exit 1
fi

# Check if MANDA_DIR is within a git repo (not necessarily the root)
GIT_DIR="$MANDA_DIR"
GIT_ROOT=""

# Walk up the directory tree to find .git
while [ "$GIT_DIR" != "/" ] && [ ! -d "$GIT_DIR/.git" ]; do
  GIT_DIR="$(dirname "$GIT_DIR")"
done

if [ -d "$GIT_DIR/.git" ]; then
  GIT_ROOT="$GIT_DIR"
else
  echo "No git repository found for: $MANDA_DIR"
  echo "Please ensure $MANDA_DIR is within a git repository."
  exit 1
fi

# Find the most recent markdown file (not including today) sorted by name (ISO dates work)
# Using ls instead of find with -printf which is GNU-specific and not available on macOS
prev_file="$(cd "$MANDA_DIR" && ls -1 ????-??-??.md 2>/dev/null | grep -v "$TODAY.md" | sort -r | head -n1 || true)"
prev_path=""
if [ -n "$prev_file" ]; then
  prev_path="$MANDA_DIR/$prev_file"
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
  mkdir -p "$MANDA_DIR"
  printf "# %s\n\n" "$TODAY" >"$TODAY_FILE"

  # Extract incomplete tasks from the previous file if it exists
  if [ -n "$prev_path" ] && [ -f "$prev_path" ]; then
    extract_incomplete_tasks "$prev_path" "$TODAY_FILE"
    echo "" >> "$TODAY_FILE"
    echo "---" >> "$TODAY_FILE"
    echo "" >> "$TODAY_FILE"
  fi
fi

# Add timestamp as a link
# Get current time in HH:MM format
current_time="$(date +"$TIME_FMT")"

# Check if the last line is empty or if we need to add spacing
last_line=$(tail -n 1 "$TODAY_FILE" 2>/dev/null || echo "")

# Add appropriate spacing before timestamp
if [ -n "$last_line" ]; then
  echo "" >> "$TODAY_FILE"
fi

# Add timestamp as a markdown link
echo "[[${current_time}]]" >> "$TODAY_FILE"
echo "" >> "$TODAY_FILE"

# Open today's file in editor
"$EDITOR" "$TODAY_FILE"

# Add line separator after editor exits
echo "" >> "$TODAY_FILE"
echo "---" >> "$TODAY_FILE"
echo "" >> "$TODAY_FILE"
