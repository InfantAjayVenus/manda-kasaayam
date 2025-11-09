# Manda-Kasaayam

A simple daily note-taking tool that automatically commits and pushes your previous day's notes.

## Features

- Automatically creates dated markdown files (YYYY-MM-DD.md)
- Commits and pushes the previous day's notes when you open today's note
- Works with your preferred editor (defaults to nvim)
- Git-backed for version control and synchronization
- Works with notes in any subdirectory of a git repository
- Automatic timestamp addition to headers when saving notes
- Interactive task management with TUI (toggle, delete tasks)
- Automatic rollover of incomplete tasks to the next day

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
- Copy incomplete tasks from yesterday's note to today's note
- Open today's note in your configured editor
- Automatically add timestamps to headers when you save and exit

### Interactive Task Management

View and manage tasks interactively:

```bash
manda do
# or
mk do
```

This opens an interactive TUI where you can:
- Navigate tasks with arrow keys or `j`/`k`
- Toggle task completion with `space`
- Delete tasks with `d`
- Quit with `q`

### Add Timestamps to Specific File

Add timestamps to headers in any markdown file without opening it:

```bash
manda /path/to/file.md
# or
mk /path/to/file.md
```

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

# Manage tasks interactively
manda do

# Manage tasks in a custom directory
manda do ~/my-notes

# Add timestamps to a specific file
manda 2025-11-07.md

# Show help
manda --help

# Using the shorter alias
mk
mk do
mk --help
```

## Directory Structure

- `src/`: Contains the main script
- `bin/`: Contains the symlinks to the script (manda and mk)
- `notes/`: Default location for your notes

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.