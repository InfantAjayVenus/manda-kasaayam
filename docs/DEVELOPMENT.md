# Development Workflow

## TL;DR

**During development, you DON'T need to rebuild/reinstall!**

Use `pnpm start` or `pnpm dev` - it runs TypeScript directly with `tsx`.

## Development vs Production

### Development Mode (No rebuild needed) ✅

Run TypeScript directly without building:

```bash
# Option 1: Use pnpm scripts
pnpm start
pnpm dev

# Option 2: Direct tsx execution
pnpm tsx src/main.ts

# These all run the TypeScript source directly!
# Changes are picked up immediately on next run.
```

**When to use**: Daily development, testing changes, debugging

### Production Mode (Requires build)

For the global CLI command:

```bash
# Only rebuild when you want to test the installed CLI
pnpm build
npm link  # Only needed once, unless you change package.json
```

**When to use**: Testing the installed CLI, before publishing

## Workflow Recommendations

### 1. **Daily Development** (Recommended)

```bash
# Edit your code
vim src/commands/manda.command.ts

# Test immediately (no rebuild!)
MANDA_DIR=/tmp/test pnpm start

# Or run tests
pnpm test
```

### 2. **Testing with Environment Variables**

```bash
# Create an alias for quick testing
alias mdev='MANDA_DIR=$HOME/notes EDITOR=nano pnpm start'

# Now just run
mdev
```

### 3. **When to Rebuild**

You only need to rebuild when:

- ✅ You want to test the globally installed `manda` command
- ✅ You're preparing to publish to npm
- ✅ You want to share the compiled version

```bash
# Rebuild and update global installation
pnpm build
# npm link is persistent, no need to run again
```

### 4. **Testing Different Scenarios**

```bash
# Test with different configs without installing
MANDA_DIR=/path/to/notes EDITOR=vim pnpm start

# Test with arguments
pnpm start --version
pnpm start --help
pnpm start manda --name "Test"
```

## Quick Reference

| Task                        | Command           | Rebuild Needed?                       |
| --------------------------- | ----------------- | ------------------------------------- |
| Run during development      | `pnpm start`      | ❌ No                                 |
| Run tests                   | `pnpm test`       | ❌ No                                 |
| Test global `manda` command | `manda`           | ✅ Yes (first time only)              |
| Publish to npm              | `npm publish`     | ✅ Yes (automatic via prepublishOnly) |
| Add new dependency          | `pnpm add <pkg>`  | ❌ No                                 |
| Change package.json bin     | Edit package.json | ✅ Yes + `npm link`                   |

## Watch Mode for Tests

Run tests automatically on file changes:

```bash
pnpm test:watch
# or
pnpm test
# (vitest runs in watch mode by default)
```

## Adding Shell Aliases for Development

Add to your `.zshrc` or `.bashrc`:

```bash
# Quick development run
alias mdev='MANDA_DIR=$HOME/notes pnpm --dir=/path/to/manda-kasaayam start'

# Quick test run
alias mtest='MANDA_DIR=/tmp/test-notes pnpm --dir=/path/to/manda-kasaayam start'
```

## How It Works

### Development Mode (tsx)

```
Your edit → src/main.ts → tsx executes → Immediate feedback
```

No compilation step!

### Production Mode (built)

```
Your edit → src/main.ts → tsc compiles → dist/main.js → Global command
```

Requires rebuild.

## Pro Tips

1. **Use `pnpm start` for 99% of development**
   - It's faster (no build step)
   - Changes are immediate
   - Same TypeScript checking

2. **Only use global `manda` command for final testing**
   - Before committing
   - Before publishing
   - When testing installation instructions

3. **Create a test notes directory**

   ```bash
   mkdir -p ~/test-notes
   export MANDA_TEST_DIR="$HOME/test-notes"
   alias mtest='MANDA_DIR=$MANDA_TEST_DIR pnpm start'
   ```

4. **Use the built-in development tools**

   ```bash
   # TypeScript checking
   pnpm exec tsc --noEmit

   # Run specific test file
   pnpm test test/commands/manda.command.test.ts

   # Run tests once (no watch)
   pnpm test run
   ```

## Summary

✅ **Development**: `pnpm start` - No rebuild needed!  
✅ **Testing**: `pnpm test` - No rebuild needed!  
✅ **Production**: `pnpm build` - Only when needed!

You'll save tons of time by using `pnpm start` during development! 🚀
