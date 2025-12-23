# Manda Kasaayam

> தமிழ் பதிப்புக்கு [README.md](./README.md) பார்க்கவும்

**Manda Kasaayam** is a Terminal User Interface (TUI) application for managing daily notes with automatic organization and task tracking. It helps you maintain a clean, organized notes system while ensuring you never lose track of incomplete tasks.

## Features

- **Daily Notes:** Creates a new markdown file for each day in `YYYY-MM-DD.md` format
- **Automatic Organization:** Moves previous day's notes to organized `YYYY/MM/` directory structure
- **Task Continuity:** Automatically carries forward incomplete tasks (`- [ ]`) from previous days
- **Timestamp Tracking:** Adds timestamps `[HH:MM]` each time you open a note
- **Interactive TUI:** Terminal-based interface for managing tasks with `manda do`
- **Markdown Preview:** View your notes without opening an editor with `manda see`
- **Git Integration:** Automatically commits and pushes changes to your notes repository
- **Navigation Support:** Browse through notes with keyboard navigation in preview mode

## Installation

### Option 1: Install from npm (Recommended)

```bash
# Install globally
npm install -g manda-kasaayam

# Or install with pnpm
pnpm add -g manda-kasaayam

# Or install with yarn
yarn global add manda-kasaayam
```

### Option 2: Install from Source

1. Clone this repository:

```bash
git clone https://github.com/yourusername/manda-kasaayam.git
cd manda-kasaayam
```

2. Install dependencies:

```bash
pnpm install
```

3. Build the application:

```bash
pnpm build
```

4. Set up the environment variables (see Configuration below)

5. Add to your shell path (optional):

```bash
export PATH="$PATH:/path/to/manda-kasaayam/bin"
```

### Option 3: Development Installation

For local development and testing:

```bash
# Clone and install
git clone https://github.com/yourusername/manda-kasaayam.git
cd manda-kasaayam
pnpm install

# Link globally for testing
pnpm link --global

# When done, unlink
pnpm unlink --global
```

## Usage

### Basic Usage

Open today's note:

```bash
manda
```

### Task Management

Launch the interactive task manager:

```bash
manda do
```

**Task Manager Controls:**

- `↑↓` or `j/k`: Navigate between tasks
- `Space` or `Enter`: Toggle task completion
- `g/G`: Jump to first/last task
- `q` or `ESC`: Exit

### Note Preview

Preview today's note:

```bash
manda see
```

Preview yesterday's note:

```bash
manda see --yester
```

Preview a specific date:

```bash
manda see --date 2025-11-25
```

**Preview Controls:**

- `↑↓` or `j/k`: Scroll content
- `←` or `h`: Previous day
- `→` or `l`: Next day
- `e`: Edit note (today's note only)
- `g/G`: Jump to top/bottom
- `q` or `ESC`: Exit

### Help

Show help information:

```bash
manda --help
```

## Configuration

Set these environment variables in your `.zshrc`, `.bashrc`, or shell profile:

### Required

- `MANDA_DIR`: **(Required)** Full path to your notes directory

### Optional

- `EDITOR`: Your preferred text editor (default: `nvim`)
- `BRANCH`: Git branch name (default: `main`)
- `REMOTE`: Git remote name (default: `origin`)

**Example:**

```bash
export MANDA_DIR="/Users/your_username/Documents/notes"
export EDITOR="vim"
export BRANCH="main"
export REMOTE="origin"
```

## Directory Structure

The application automatically organizes your notes:

```
notes/
├── 2025-11-29.md          # Today's note (in root)
├── 2025/
│   ├── 01/
│   │   ├── 2025-01-31.md  # January notes
│   │   └── 2025-01-30.md
│   ├── 02/
│   │   └── 2025-02-28.md  # February notes
│   └── 11/
│       ├── 2025-11-28.md  # Yesterday's note (moved here)
│       └── 2025-11-27.md
└── .git/                  # Git repository
```

## Note Format

### Daily Note Structure

```markdown
# 2025-11-29

[2025-11-28](2025-11-28.md)

- [ ] Incomplete task from yesterday

---

[09:00]
Morning meeting notes

[10:30]
Work on project X

## Tasks

- [ ] New task for today
- [x] Completed task
```

### Task Format

Use standard GitHub Flavored Markdown task lists:

```markdown
- [ ] Incomplete task
- [x] Completed task
```

### Timestamps

The app automatically adds timestamps when you open a note:

```markdown
[09:00]
[10:30]
[14:45]
```

## Workflow

1. **Start Your Day:** Run `manda` to open today's note
2. **Review Tasks:** Incomplete tasks from yesterday are automatically included
3. **Add Timestamps:** Each time you open the note, a timestamp is added
4. **Track Progress:** Use `manda do` to interactively manage tasks
5. **Preview Notes:** Use `manda see` to quickly review notes without editing
6. **Automatic Organization:** Previous day's notes are moved to `YYYY/MM/` directories
7. **Git Sync:** All changes are automatically committed and pushed

## Development

### Tech Stack

- **Language:** TypeScript
- **TUI Framework:** [Ink](https://github.com/vadimdemedes/ink)
- **CLI Parsing:** [Commander.js](https://github.com/tj/commander.js)
- **Git Integration:** [simple-git](https://github.com/steveukx/git-js)
- **Testing:** [Vitest](https://vitest.dev/) and [ink-testing-library](https://github.com/vadimdemedes/ink-testing-library)

### Quick Start for Development

```bash
# Clone and setup
git clone https://github.com/yourusername/manda-kasaayam.git
cd manda-kasaayam
pnpm install

# Set up environment
export MANDA_DIR="./dump"  # Test directory
export EDITOR="code"       # Or your preferred editor

# Run in development
pnpm dev

# Or run directly
pnpm start -- --help
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test test/domain/note.service.test.ts

# Run tests with coverage
pnpm test --coverage
```

### Building

```bash
# Build the application
pnpm build

# Run in development mode
pnpm dev

# Test the built CLI
node dist/main.js --help
```

### Testing CLI Installation

```bash
# Test local package
./test-cli.sh

# Or test manually
npm pack
mkdir test-install && cd test-install
pnpm add ../manda-kasaayam-1.0.0.tgz
npx manda --help
cd .. && rm -rf test-install
```

## Architecture

The application follows a layered architecture:

```
src/
├── commands/        # CLI command handlers
├── components/      # React TUI components
├── domain/          # Business logic and services
├── services/        # External service integrations
└── main.ts          # Application entry point
```

### Key Components

- **Commands:** Handle CLI input and coordinate services
- **Domain:** Core business logic for note management
- **Services:** External integrations (file system, git, editor)
- **Components:** Reusable TUI components built with React and Ink

## CI/CD and Publishing

This project uses GitHub Actions for automated testing and publishing to npm.

### Workflow Features

- **Automated Testing**: Runs tests on Node.js 18, 20, and 22
- **Automated Publishing**: Publishes to npm when creating GitHub releases
- **Dependency Caching**: Faster builds with pnpm cache
- **Security**: Uses npm tokens stored in GitHub secrets

### Publishing Process

1. Update version in `package.json`:

   ```bash
   npm version patch  # or minor, major
   ```

2. Push changes and tags:

   ```bash
   git push origin main --tags
   ```

3. Create a new release on GitHub:
   - Go to Releases → Create a new release
   - Choose the tag that was created
   - The workflow will automatically publish to npm

### Setup for Publishing

See [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md) for detailed setup instructions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines

- Follow the existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Use TypeScript strictly
- Follow the Outside-In TDD approach described in [AGENTS.md](./AGENTS.md)

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Troubleshooting

### Common Issues

**"MANDA_DIR environment variable is not set"**

- Make sure you've set the `MANDA_DIR` environment variable
- Restart your shell after adding it to your profile

**"Command not found: manda"**

- Make sure the application is built (`pnpm build`)
- Add the project directory to your PATH (for source installation)
- Or use `npx manda` if installed via npm

**Git push fails**

- Check your git remote configuration
- Ensure you have push access to the repository
- Verify the `REMOTE` environment variable is correct

### Getting Help

- Check the existing issues on GitHub
- Create a new issue with details about your problem
- Include your OS, shell, and relevant configuration
- Use `manda --help` for command-line assistance

## Version History

See the [GitHub Releases](https://github.com/yourusername/manda-kasaayam/releases) page for detailed version history.

## Related Documentation

- [AGENTS.md](./AGENTS.md) - Development methodology and TDD approach
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Detailed development setup
- [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md) - CI/CD setup guide
- [INSTALL.md](./INSTALL.md) - Installation troubleshooting
- [REBUILD.md](./REBUILD.md) - Rebuild instructions
