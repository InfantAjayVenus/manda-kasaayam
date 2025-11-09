# Manda-Kasaayam

For when your brain is a sieve and you need to remember what you did yesterday. It's a simple script that wrangles your daily notes in a git repo, because who has time for GUIs?

It creates a new markdown file for you every day. When you start a new day, it sneakily commits yesterday's note, so you can't forget. It also yanks your unfinished todos over to the new file, because procrastination is a feature, not a bug.

## What it does

- **Daily Notes:** Creates a `YYYY-MM-DD.md` file for your daily thoughts.
- **Auto-Commit:** When you create a new day's note, it adds and commits the previous one. No more "WIP" commits at midnight.
- **Task Rollover:** Incomplete markdown tasks (`- [ ]`) from the previous day are carried over to the new note, complete with a link back to the original file.
- **Timestamps:** Adds `[[HH:MM]]` timestamps when you open the note, and can add `@HH:MM` to `## headers` in any markdown file on command.
- **Interactive TUI:** A `do` command that pops up a terminal UI for your tasks. You can check things off, delete them, and collapse headers if you're feeling overwhelmed. All with glorious keyboard navigation, of course.
- **Markdown Preview:** The `see` command lets you peek at your note without firing up your editor. It uses `bat`, `glow`, or `mdcat` if you have them, otherwise it falls back to `less`. Fancy.

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

### The "Oh, I forgot to timestamp this" command

```bash
# Adds @HH:MM to all H2 headers in a file that don't have one.
manda /path/to/any.md
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
