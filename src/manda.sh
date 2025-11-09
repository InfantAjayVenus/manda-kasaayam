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
  local in_timestamp_entry=false

  # Parse tasks and headers
  while IFS= read -r line; do
    # Check if we're entering a timestamp entry
    if [[ "$line" =~ ^\[\[[0-9][0-9]:[0-9][0-9]\]\]$ ]]; then
      in_timestamp_entry=true
      current_header=""  # Reset header when entering new timestamp entry
    # Check if we hit a separator (end of timestamp entry)
    elif [[ "$line" =~ ^---$ ]]; then
      in_timestamp_entry=false
      current_header=""
    elif [[ "$line" =~ ^##[[:space:]] ]]; then
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

  # Build list of unique headers and track collapsed state
  # Using parallel arrays instead of associative arrays for bash 3.2 compatibility
  declare -a unique_headers
  declare -a collapsed_state  # 0 = expanded, 1 = collapsed
  local last_header=""
  for header in "${headers[@]}"; do
    if [ "$header" != "$last_header" ]; then
      if [ -n "$header" ]; then
        unique_headers+=("$header")
        collapsed_state+=(0)  # 0 = expanded, 1 = collapsed
      fi
      last_header="$header"
    fi
  done

  local selected=0
  local selecting_header=false  # true if selecting a header, false if selecting a task
  local selected_header_index=0

  # Helper function to check if a header is collapsed
  is_collapsed() {
    local target_header="$1"
    for h_idx in "${!unique_headers[@]}"; do
      if [ "${unique_headers[$h_idx]}" = "$target_header" ]; then
        return ${collapsed_state[$h_idx]}
      fi
    done
    return 0  # Default to expanded
  }

  # Helper function to toggle collapse state
  toggle_collapse() {
    local h_idx=$1
    if [ "${collapsed_state[$h_idx]}" = "0" ]; then
      collapsed_state[$h_idx]=1
    else
      collapsed_state[$h_idx]=0
    fi
  }

  # Function to draw the screen
  draw_screen() {
    clear
    echo "=== Task List (q: quit, ↑↓/jk: navigate, space: toggle, d: delete, c: collapse/expand) ==="
    echo ""

    local display_index=0
    local last_header=""
    
    # First, display all headers with their collapse state
    for h_idx in "${!unique_headers[@]}"; do
      local header="${unique_headers[$h_idx]}"
      local collapse_symbol="▼"
      if [ "${collapsed_state[$h_idx]}" = "1" ]; then
        collapse_symbol="▶"
      fi
      
      if [ "$selecting_header" = true ] && [ $h_idx -eq $selected_header_index ]; then
        echo -e "\033[7m> $collapse_symbol $header\033[0m"
      else
        echo "  $collapse_symbol $header"
      fi
      
      # Show tasks under this header if not collapsed
      if [ "${collapsed_state[$h_idx]}" = "0" ]; then
        for i in "${!tasks[@]}"; do
          if [ "${headers[$i]}" = "$header" ]; then
            if [ "$selecting_header" = false ] && [ $i -eq $selected ]; then
              echo -e "\033[7m    > ${tasks[$i]}\033[0m"
            else
              echo "      ${tasks[$i]}"
            fi
          fi
        done
      fi
    done
    
    # Display tasks without headers
    local has_headerless_tasks=false
    for i in "${!tasks[@]}"; do
      if [ -z "${headers[$i]}" ]; then
        if ! $has_headerless_tasks; then
          has_headerless_tasks=true
          echo ""
        fi
        if [ "$selecting_header" = false ] && [ $i -eq $selected ]; then
          echo -e "\033[7m> ${tasks[$i]}\033[0m"
        else
          echo "  ${tasks[$i]}"
        fi
      fi
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
        if [ "$selecting_header" = true ]; then
          ((selected_header_index > 0)) && ((selected_header_index--))
        else
          ((selected > 0)) && ((selected--))
        fi
        ;;
      '[B' | '[C') # Down arrow
        if [ "$selecting_header" = true ]; then
          ((selected_header_index < ${#unique_headers[@]} - 1)) && ((selected_header_index++))
        else
          ((selected < ${#tasks[@]} - 1)) && ((selected++))
        fi
        ;;
      esac
      ;;
    'k' | 'K') # Vi-style up
      if [ "$selecting_header" = true ]; then
        ((selected_header_index > 0)) && ((selected_header_index--))
      else
        ((selected > 0)) && ((selected--))
      fi
      ;;
    'j' | 'J') # Vi-style down
      if [ "$selecting_header" = true ]; then
        ((selected_header_index < ${#unique_headers[@]} - 1)) && ((selected_header_index++))
      else
        ((selected < ${#tasks[@]} - 1)) && ((selected++))
      fi
      ;;
    'h' | 'H') # Switch to header selection mode
      selecting_header=true
      ;;
    'l' | 'L') # Switch to task selection mode
      selecting_header=false
      # Uncollapse the header that contains the currently selected task
      if [ ${#tasks[@]} -gt 0 ]; then
        local task_header="${headers[$selected]}"
        for h_idx in "${!unique_headers[@]}"; do
          if [ "${unique_headers[$h_idx]}" = "$task_header" ]; then
            collapsed_state[$h_idx]=0  # Uncollapse
            break
          fi
        done
      fi
      ;;
    'c' | 'C' | ' ') # Space or 'c' to toggle collapse/expand or task completion
      if [ "$selecting_header" = true ] && [ ${#unique_headers[@]} -gt 0 ]; then
        # In header mode: toggle collapse
        toggle_collapse $selected_header_index
      elif [ "$selecting_header" = false ]; then
        # In task mode: toggle task completion
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
      fi
      ;;
    'd' | 'D') # Delete task
      if [ "$selecting_header" = false ]; then
        unset 'tasks[$selected]'
        unset 'headers[$selected]'
        tasks=("${tasks[@]}") # Re-index array
        headers=("${headers[@]}")
        if [ ${#tasks[@]} -eq 0 ]; then
          update_file_with_tasks "$file"
          echo "All tasks processed!"
          return
        fi
        ((selected >= ${#tasks[@]})) && ((selected--))
        update_file_with_tasks "$file"
      fi
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

# Function to preview markdown with formatting
preview_markdown() {
  local file="$1"
  
  # Check if file exists
  if [ ! -f "$file" ]; then
    echo "Error: File not found: $file"
    return 1
  fi
  
  # Create a temporary file for preprocessed markdown
  local temp_file=$(mktemp)
  
  # Set up trap to clean up temp file on exit
  trap "rm -f '$temp_file'" EXIT INT TERM
  
  # Preprocess the markdown to improve rendering:
  # 1. Convert wiki-style timestamp links [[HH:MM]] to bold with emoji
  # 2. Convert wiki-style file links in headers to italic references
  # 3. Convert standalone wiki-style links to italic
  sed -E \
    -e 's/\[\[([0-9][0-9]:[0-9][0-9])\]\]/🕐 **\1**/g' \
    -e 's/## (.+) \[\[([^]]+\.md)\]\]/## \1 _[\2]_/g' \
    -e 's/\[\[([^]]+)\]\]/_\1_/g' \
    "$file" > "$temp_file"
  
  # Try different markdown previewers in order of preference
  if command -v bat &>/dev/null; then
    # bat has excellent syntax highlighting and works reliably in scripts
    bat --paging=always --style=numbers,grid --language=markdown --theme="TwoDark" "$temp_file"
  elif command -v glow &>/dev/null; then
    # glow with pager mode - works if TTY is available
    glow -p "$temp_file"
  elif command -v mdcat &>/dev/null; then
    mdcat "$temp_file" | less -R
  else
    # Fallback to less with line numbers
    less -N "$temp_file"
  fi
  
  # Cleanup handled by trap
}

# Function to display help
show_help() {
  cat <<EOF
manda — open today's note; on new-day create new and commit+push previous note

Usage:
  manda [notes_dir]            Open today's note file in \$EDITOR
  manda do [notes_dir]         Interactive task list view (toggle/delete tasks)
  manda see [notes_dir]        Preview today's note with markdown formatting
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
  manda see                    Preview today's note with markdown formatting
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

# Check if first argument is "see" to preview today's note
if [[ $# -gt 0 && "$1" == "see" ]]; then
  # Config setup for accessing the correct files
  MANDA_DIR="${2:-${MANDA_DIR:-}}"

  # Check if MANDA_DIR is set
  if [ -z "$MANDA_DIR" ]; then
    echo "Error: Notes directory not specified."
    echo "Set MANDA_DIR environment variable or pass the directory as an argument:"
    echo "  manda see /path/to/notes"
    exit 1
  fi

  TODAY="$(date +"%Y-%m-%d")"
  TODAY_FILE="$MANDA_DIR/$TODAY.md"

  # Check if today's file exists
  if [ -f "$TODAY_FILE" ]; then
    preview_markdown "$TODAY_FILE"
  else
    echo "Today's note file doesn't exist yet."
    echo "Run 'manda' to create it."
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

# Add timestamp as a link and separator only if previous entry has content
# Get current time in HH:MM format
current_time="$(date +"$TIME_FMT")"

# Check if the file has content after the header and tasks section
# Look for the last timestamp entry and check if there's content after it
last_timestamp_line=$(grep -n "^\[\[[0-9][0-9]:[0-9][0-9]\]\]$" "$TODAY_FILE" 2>/dev/null | tail -1 | cut -d: -f1 || echo "0")

# Determine if we should add a new entry
should_add_entry=true

if [ "$last_timestamp_line" != "0" ]; then
  # Get content after the last timestamp
  content_after_timestamp=$(tail -n +$((last_timestamp_line + 1)) "$TODAY_FILE" | sed '/^$/d; /^---$/d')
  
  # If there's no content after the last timestamp, don't add a new entry
  if [ -z "$content_after_timestamp" ]; then
    should_add_entry=false
  fi
fi

if [ "$should_add_entry" = true ]; then
  # Check if the last line is empty or if we need to add spacing
  last_line=$(tail -n 1 "$TODAY_FILE" 2>/dev/null || echo "")
  
  # Add appropriate spacing before timestamp
  if [ -n "$last_line" ]; then
    echo "" >> "$TODAY_FILE"
  fi
  
  # Add timestamp as a markdown link
  echo "[[${current_time}]]" >> "$TODAY_FILE"
  echo "" >> "$TODAY_FILE"
fi

# Open today's file in editor
"$EDITOR" "$TODAY_FILE"

# Add line separator after editor exits only if content was added
# Find the last timestamp in the file (whether it was just added or already existed)
last_timestamp_line_after=$(grep -n "^\[\[[0-9][0-9]:[0-9][0-9]\]\]$" "$TODAY_FILE" 2>/dev/null | tail -1 | cut -d: -f1 || echo "0")

if [ "$last_timestamp_line_after" != "0" ]; then
  # Get content after the last timestamp
  content_after_edit=$(tail -n +$((last_timestamp_line_after + 1)) "$TODAY_FILE" | sed '/^$/d; /^---$/d')
  
  # Get the last line of the file
  last_line_of_file=$(tail -n 1 "$TODAY_FILE" 2>/dev/null || echo "")
  
  # Only add separator if there's actual content and the last line is not already a separator
  if [ -n "$content_after_edit" ] && [ "$last_line_of_file" != "---" ]; then
    echo "" >> "$TODAY_FILE"
    echo "---" >> "$TODAY_FILE"
    echo "" >> "$TODAY_FILE"
  fi
fi
