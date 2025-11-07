# Brain-Dump

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
   cd brain-dump
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
dump
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
dump do
```

This opens an interactive TUI where you can:
- Navigate tasks with arrow keys or `j`/`k`
- Toggle task completion with `space`
- Delete tasks with `d`
- Quit with `q`

### Add Timestamps to Specific File

Add timestamps to headers in any markdown file without opening it:

```bash
dump /path/to/file.md
```

### Help

Display help information:

```bash
dump --help
# or
dump -h
```

### Configuration

You can configure the tool with these environment variables:

- `DUMP_DIR`: Directory for your notes (default: ~/notes)
- `EDITOR`: Your preferred text editor (default: nvim)
- `BRANCH`: Git branch to use (default: main)
- `REMOTE`: Git remote to use (default: origin)

You can also pass an alternative directory as an argument:

```bash
dump /path/to/alternative/notes
```

### Examples

```bash
# Open today's note with default settings
dump

# Open today's note in a custom directory
dump ~/my-notes

# Manage tasks interactively
dump do

# Manage tasks in a custom directory
dump do ~/my-notes

# Add timestamps to a specific file
dump 2025-11-07.md

# Show help
dump --help
```

## Directory Structure

- `src/`: Contains the main script
- `bin/`: Contains the symlink to the script
- `dumps/`: Default location for your notes

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.