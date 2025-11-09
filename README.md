# Manda-Kasaayam

A simple daily note-taking tool that automatically commits and pushes your previous day's notes.

## Features

- **Daily Notes Management**
  - Automatically creates dated markdown files (YYYY-MM-DD.md)
  - Commits and pushes the previous day's notes when you open today's note
  - Works with your preferred editor (defaults to nvim)
  - Git-backed for version control and synchronization
  - Works with notes in any subdirectory of a git repository

- **Time Tracking & Organization**
  - Automatic timestamp entries (HH:MM format) when opening notes
  - Timestamps are added as markdown wikilinks: `[[HH:MM]]`
  - Automatic separator lines (`---`) between entries
  - Smart entry detection: only adds new entries if previous one has content
  - Automatic timestamps on h2 headers (`##`) when saving notes

- **Task Management**
  - Automatic rollover of incomplete tasks from previous day
  - Tasks carry source file references for context (e.g., `[[2025-11-08.md]]`)
  - Interactive TUI for task management with collapsible sections
  - Toggle task completion status ([ ] ↔ [x])
  - Delete tasks interactively
  - Navigate with arrow keys or Vim-style (j/k/h/l)
  - Collapse/expand task sections by header (h/l/c keys)
  - Dual-mode navigation: header selection (h) and task selection (l)

## Installation

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd manda-kasaayam
   ```

2. Run the install script:
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

3. Restart your terminal or run:
   ```bash
   source ~/.zshrc
   ```

## Usage

### Basic Usage

Open today's note:

```bash
manda
# or
mk
```

This will:
- Create today's note file if it doesn't exist
- Commit and push yesterday's note if it exists and has changes
- Copy incomplete tasks from yesterday's note to today's note (with source file links)
- Add a new timestamped entry (`[[HH:MM]]`) if the previous entry has content
- Open today's note in your configured editor
- Automatically add a separator line (`---`) after you exit the editor (if content was added)

### Interactive Task Management

View and manage tasks interactively:

```bash
manda do
# or
mk do
```

This opens an interactive TUI where you can:
- Navigate tasks with arrow keys (`↑↓`) or Vim-style keys (`j`/`k`)
- Switch between header and task selection modes (`h` for headers, `l` for tasks)
- Toggle task completion with `space` (in task mode)
- Collapse/expand header sections with `c` (in header mode) or `space` (in header mode)
- Delete tasks with `d` (in task mode)
- Quit with `q`

**Navigation Modes:**
- **Header Mode** (press `h`): Navigate and collapse/expand sections
- **Task Mode** (press `l`): Navigate and modify individual tasks

Headers show collapse state with symbols:
- `▼` = expanded (tasks visible)
- `▶` = collapsed (tasks hidden)

### Add Timestamps to Specific File

Process any markdown file to add timestamps to h2 headers without opening it:

```bash
manda /path/to/file.md
# or
mk /path/to/file.md
```

This will add `@HH:MM` timestamps to all h2 headers (`## Header`) that don't already have one.

### Help

Display help information:

```bash
manda --help
# or
manda -h
# or
mk --help
```

### Configuration

You can configure the tool with these environment variables:

- `MANDA_DIR`: Directory for your notes (required - must be set or passed as argument)
- `EDITOR`: Your preferred text editor (default: nvim)
- `BRANCH`: Git branch to use (default: main)
- `REMOTE`: Git remote to use (default: origin)

You must either set the `MANDA_DIR` environment variable or pass the directory as an argument:

```bash
# Set MANDA_DIR environment variable (recommended)
export MANDA_DIR=/path/to/notes
manda

# Or pass directory as argument
manda /path/to/alternative/notes
# or
mk /path/to/alternative/notes
```

### Examples

```bash
# Open today's note (requires MANDA_DIR to be set)
manda

# Open today's note in a custom directory
manda ~/my-notes

# Manage tasks interactively (header and task navigation)
manda do

# Manage tasks in a custom directory
manda do ~/my-notes

# Add @HH:MM timestamps to h2 headers in a specific file
manda 2025-11-07.md

# Process a file in a specific directory
manda ~/my-notes/2025-11-08.md

# Show help
manda --help

# Using the shorter alias
mk
mk do
mk --help
```

## How It Works

### Daily Note Workflow

1. **Opening a note**: When you run `manda`, it:
   - Checks if today's note exists
   - If not, commits and pushes yesterday's note (if it has changes)
   - Copies incomplete tasks from yesterday to today (with source links like `[[YYYY-MM-DD.md]]`)
   - Creates today's note with date header (`# YYYY-MM-DD`)
   - Adds a timestamped entry (`[[HH:MM]]`) if needed
   - Opens in your editor

2. **During editing**: 
   - Add content under timestamp entries
   - Create h2 headers (`## Header`) for organization
   - Add tasks as markdown checkboxes (`- [ ] task` or `- [x] done`)

3. **After closing**: The script automatically:
   - Adds a separator line (`---`) if you added content
   - Prepares for the next entry

### Task Rollover

Incomplete tasks (`- [ ] task`) are automatically:
- Extracted from the previous day's note
- Grouped by their h2 headers
- Tagged with source file reference (e.g., `## Header [[2025-11-08.md]]`)
- Added to the top of the new day's note
- Placed above the first timestamp entry

### Timestamp Entries

The script creates structured daily logs with:
- Timestamp links: `[[HH:MM]]` marking when you opened the note
- Content sections between timestamps
- Separators (`---`) between entries
- Smart detection: no new entry if previous one is empty

## Directory Structure

- `src/`: Contains the main script
- `bin/`: Contains the symlinks to the script (manda and mk)
- `notes/`: Default location for your notes

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.