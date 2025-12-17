# Quick Reference: Do I Need to Rebuild?

## Short Answer: **NO!** ❌

During development, use `pnpm start` - it runs TypeScript directly, no rebuild needed!

## When Do I Need to Rebuild?

| Scenario                          | Rebuild?   | Command                        |
| --------------------------------- | ---------- | ------------------------------ |
| 💻 Developing & testing code      | ❌ **NO**  | `pnpm start`                   |
| 🧪 Running tests                  | ❌ **NO**  | `pnpm test`                    |
| 📝 Editing source files           | ❌ **NO**  | Just save & run `pnpm start`   |
| 🔍 Testing global `manda` command | ✅ **YES** | `pnpm build` (once)            |
| 📦 Before publishing to npm       | ✅ **YES** | Auto-runs via `prepublishOnly` |
| 🆕 First time installation        | ✅ **YES** | `pnpm build && npm link`       |

## Common Workflows

### Daily Development (99% of the time)

```bash
# 1. Edit your code
vim src/commands/manda.command.ts

# 2. Test immediately
MANDA_DIR=/tmp/test pnpm start

# No rebuild needed! Changes are immediate.
```

### Testing Global Installation (rarely)

```bash
# 1. Edit your code
vim src/commands/manda.command.ts

# 2. Rebuild
pnpm build

# 3. Test global command
manda
```

### Running Tests (frequently)

```bash
# No rebuild needed!
pnpm test

# Run specific test
pnpm test test/commands/manda.command.test.ts
```

## Why This Works

- **`pnpm start`** → Uses `tsx` to run TypeScript directly
- **`manda`** → Uses compiled JavaScript in `dist/`

## Pro Tip

Create an alias for quick testing:

```bash
# Add to ~/.zshrc or ~/.bashrc
alias mdev='MANDA_DIR=$HOME/notes pnpm start'

# Now just run:
mdev
```

## Bottom Line

✅ Use `pnpm start` for development  
✅ Use `pnpm test` for testing  
✅ Use `pnpm build` only when needed

Save yourself time - skip the rebuild! 🚀
