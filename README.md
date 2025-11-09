# Manda-Kasaayam

For when your brain is a sieve and you need to remember what you did yesterday. It's a simple script that wrangles your daily notes in a git repo, because who has time for GUIs?

It creates a new markdown file for you every day. When you start a new day, it sneakily commits yesterday's note, so you can't forget. It also yanks your unfinished todos over to the new file, because procrastination is a feature, not a bug.

## What it does

- **Daily Notes:** Creates a `YYYY-MM-DD.md` file for your daily thoughts.
- **Auto-Commit:** When you open a new day's note, it commits and pushes the previous day's note automatically.
- **Auto-Archive:** Previous notes are automatically organized into `YYYY/MM/` directories (e.g., `2025/11/2025-11-07.md`), keeping your notes folder tidy.
- **Task Rollover:** Incomplete markdown tasks (`- [ ]`) from the previous day are carried over to the new note, with a reference link back to the original file (`## Header [[YYYY-MM-DD.md]]`).
- **Session Timestamps:** Adds `[[HH:MM]]` timestamps each time you open the note (only if you added content since last opening), separated by `---` dividers.
- **Header Timestamps:** Run `manda <file.md>` to add `@HH:MM` timestamps to all `## headers` that don't already have one.
- **Interactive TUI:** The `do` command launches a terminal UI for managing tasks. Toggle completion with space, delete with `d`, navigate with `j/k` or arrows, switch between headers (`h`) and tasks (`l`), and collapse/expand headers with `c`.
- **Markdown Preview:** The `see` command previews today's note without opening your editor. Uses `bat`, `glow`, or `mdcat` if available, otherwise falls back to `less`.

## Installation

1.  Clone the repo.
2.  `chmod +x install.sh && ./install.sh`
3.  `source ~/.zshrc` (or whatever your shell's rc file is).

## Usage

### The Basics

```bash
# Open today's note. This is the main event.
manda
# or use the alias
mk
```

### The Task Manager

```bash
# Fire up the interactive task manager for today's note.
manda do
mk do
```

In the TUI:
- `j/k` or `↑/↓` to navigate.
- `h` to select headers, `l` to select tasks.
- `space` or `c` to toggle task completion or collapse a header.
- `d` to delete a task.
- `q` to quit.

### The Quick Peek

```bash
# Preview today's note.
manda see
mk see
```

### Add Timestamps to Headers

```bash
# Adds @HH:MM to all ## headers in a file that don't already have one.
manda /path/to/any.md
# Example:
manda 2025-11-07.md
```

### Help

```bash
manda --help
```

## Configuration

Set these environment variables, probably in your `.zshrc` or `.bashrc`.

- `MANDA_DIR`: **(Required)** The absolute path to your notes directory. This directory must be inside a git repository.
- `EDITOR`: Your editor of choice (default: `nvim`).
- `BRANCH`: The git branch to push to (default: `main`).
- `REMOTE`: The git remote to push to (default: `origin`).

Example:
```bash
export MANDA_DIR="/Users/you/Documents/notes"
export EDITOR="vim"
```

You can also pass the notes directory as an argument, which will override the `MANDA_DIR` variable for that command.
```bash
manda /path/to/some/other/notes
```

## License

MIT. See [LICENSE](LICENSE).
