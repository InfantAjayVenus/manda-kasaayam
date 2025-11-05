# Brain-Dump

A simple daily note-taking tool that automatically commits and pushes your previous day's notes.

## Features

- Automatically creates dated markdown files (YYYY-MM-DD.md)
- Commits and pushes the previous day's notes when you open today's note
- Works with your preferred editor (defaults to vim)
- Git-backed for version control and synchronization
- Works with notes in any subdirectory of a git repository

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

Simply run the `dump` command:

```bash
dump
```

This will:
- Create today's note file if it doesn't exist
- Commit and push yesterday's note if it exists and has changes
- Open today's note in your configured editor

### Configuration

You can configure the tool with these environment variables:

- `DUMP_DIR`: Directory for your notes (default: ~/notes)
- `EDITOR`: Your preferred text editor (default: vim)
- `BRANCH`: Git branch to use (default: main)
- `REMOTE`: Git remote to use (default: origin)

You can also pass an alternative directory as an argument:

```bash
dump /path/to/alternative/notes
```

## Directory Structure

- `src/`: Contains the main script
- `bin/`: Contains the symlink to the script
- `dumps/`: Default location for your notes

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.