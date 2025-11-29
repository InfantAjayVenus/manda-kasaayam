# Installation Guide

## Installation Methods

### Method 1: Install Globally with npm (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/manda-kasaayam.git
cd manda-kasaayam

# Install dependencies
pnpm install

# Build the project
pnpm build

# Install globally
npm link
# or
npm install -g .
```

After installation, the `manda` command will be available globally.

### Method 2: Install from npm Registry

Once published to npm:

```bash
npm install -g manda-kasaayam
# or
pnpm add -g manda-kasaayam
```

### Method 3: Run without Installation

```bash
# Using pnpm
pnpm start

# Using tsx directly
pnpm tsx src/main.ts
```

## Verify Installation

```bash
# Check version
manda --version

# Check help
manda --help
```

## Configuration

Set the required environment variable:

```bash
# Add to your ~/.bashrc, ~/.zshrc, or ~/.profile
export MANDA_DIR="$HOME/notes"

# Optional: Set your preferred editor
export EDITOR="code"  # VS Code
# or
export EDITOR="vim"   # Vim
# or
export EDITOR="nano"  # Nano
```

## Usage

```bash
# Open or create today's note
manda

# The note will be created as YYYY-MM-DD.md
# For example: 2025-11-19.md
```

## Uninstallation

```bash
# If installed with npm link
npm unlink -g manda-kasaayam

# If installed with npm install
npm uninstall -g manda-kasaayam
```

## Troubleshooting

### Command not found

If `manda` command is not found after installation:

1. Ensure npm global bin directory is in your PATH:
   ```bash
   npm bin -g
   # Add the output directory to your PATH if needed
   ```

2. Reload your shell:
   ```bash
   source ~/.bashrc  # or ~/.zshrc
   ```

### Editor not opening

If the editor doesn't open:

1. Set the EDITOR environment variable:
   ```bash
   export EDITOR="nano"
   ```

2. Ensure the editor is installed:
   ```bash
   which nano
   which vim
   which code
   ```

### MANDA_DIR not set error

Set the MANDA_DIR environment variable before running:

```bash
export MANDA_DIR="$HOME/notes"
manda
```

Or run with the variable inline:

```bash
MANDA_DIR="$HOME/notes" manda
```

## Development

If you're contributing or developing:

```bash
# Install dependencies
pnpm install

# Run in development mode (NO rebuild needed!)
pnpm start
# or
pnpm dev

# Run tests (watch mode)
pnpm test

# Run tests once
pnpm test run

# Build (only needed for testing the global CLI)
pnpm build

# Link for testing global installation
npm link
```

**Important**: During development, use `pnpm start` or `pnpm dev` - it runs TypeScript directly via `tsx`, so you don't need to rebuild after every change!

Only rebuild when you want to test the globally installed `manda` command or before publishing.

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development workflow.
