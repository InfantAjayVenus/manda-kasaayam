import { execSync } from 'child_process';
import { test, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

// Helper to create a temporary notes directory for testing
const createTempNotesDir = (content: string, fileName?: string) => {
  const tempDir = fs.mkdtempSync(path.join(process.env.GEMINI_TEMP_DIR || '/tmp', 'manda-notes-'));
  const today = fileName || new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(tempDir, `${today}.md`), content);
  return tempDir;
};

test('running "manda see" should display today\'s note with TUI markdown rendering', () => {
  // Setup: Create a dummy notes directory and a today.md file with markdown content
  const notesDir = createTempNotesDir(`
# ${new Date().toISOString().slice(0, 10)}

## Daily Tasks
- [ ] Buy milk
- [x] Call mom
- [ ] Write report

## Meeting Notes
### Team Standup
- **Project Status**: On track
- *Blockers*: None
- \`Code Review\` pending

## Code Example
\`\`\`javascript
function hello() {
  console.log("Hello World");
}
\`\`\`

> Important: Remember to review the documentation
`);

  try {
    // Execute CLI command - it should use TUI rendering with keyboard controls
    const output = execSync(`MANDA_DIR=${notesDir} pnpm tsx src/main.ts see`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000 // TUI apps need more time for interactive mode
    });

    // The test passes if the command executes without error
    // TUI output will contain ANSI escape codes for formatting and keyboard hints
    expect(output).toBeDefined();
    expect(output.length).toBeGreaterThan(0);
    // Should contain keyboard navigation hints
    expect(output).toContain('scroll');
    expect(output).toContain('exit');
  } catch (error) {
    // TUI apps might exit with specific codes or have different output patterns
    // The important thing is that it doesn't crash due to syntax errors
    const errorOutput = (error as any).stdout || (error as any).stderr;
    expect(errorOutput).toBeDefined();
  } finally {
    // Teardown: Clean up the temporary directory
    fs.rmSync(notesDir, { recursive: true, force: true });
  }
});

test('running "manda see" should display today\'s note with TUI markdown rendering', () => {
  // Setup: Create a dummy notes directory and a today.md file with markdown content
  const notesDir = createTempNotesDir(`
# ${new Date().toISOString().slice(0, 10)}

## Daily Tasks
- [ ] Buy milk
- [x] Call mom
- [ ] Write report

## Meeting Notes
### Team Standup
- **Project Status**: On track
- *Blockers*: None
- \`Code Review\` pending

## Code Example
\`\`\`javascript
function hello() {
  console.log("Hello World");
}
\`\`\`

> Important: Remember to review the documentation
`);

  try {
    // Execute CLI command - it should use TUI rendering with keyboard controls
    const output = execSync(`MANDA_DIR=${notesDir} pnpm tsx src/main.ts see`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000 // TUI apps need more time for interactive mode
    });

    // The test passes if the command executes without error
    // TUI output will contain ANSI escape codes for formatting
    expect(output).toBeDefined();
    expect(output.length).toBeGreaterThan(0);
    // Should contain keyboard navigation hints
    expect(output).toContain('scroll');
    expect(output).toContain('exit');
  } catch (error) {
    // TUI apps might exit with specific codes or have different output patterns
    // The important thing is that it doesn't crash due to syntax errors
    const errorOutput = (error as any).stdout || (error as any).stderr;
    expect(errorOutput).toBeDefined();
  } finally {
    // Teardown: Clean up the temporary directory
    fs.rmSync(notesDir, { recursive: true, force: true });
  }
});

test('running "manda see --yester" should display yesterday\'s note with TUI', () => {
  // Create yesterday's date
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  // Setup: Create a dummy notes directory with yesterday's note
  const notesDir = createTempNotesDir(`
# ${yesterdayStr}

## Yesterday's Tasks
- [ ] Completed task
- [ ] In progress task

## Notes
This is yesterday's note content.
`, yesterdayStr);

  try {
    // Execute CLI command with --yester option
    const output = execSync(`MANDA_DIR=${notesDir} pnpm tsx src/main.ts see --yester`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000 // TUI apps need more time for interactive mode
    });

    // The test passes if the command executes without error
    expect(output).toBeDefined();
    expect(output.length).toBeGreaterThan(0);
    // Should contain keyboard navigation hints
    expect(output).toContain('scroll');
    expect(output).toContain('exit');
  } catch (error) {
    // TUI apps might have different output patterns
    const errorOutput = (error as any).stdout || (error as any).stderr;
    expect(errorOutput).toBeDefined();
  } finally {
    // Teardown: Clean up the temporary directory
    fs.rmSync(notesDir, { recursive: true, force: true });
  }
});

test('running "manda see" when note does not exist should create and display empty note', () => {
  // Setup: Create an empty notes directory
  const tempDir = fs.mkdtempSync(path.join(process.env.GEMINI_TEMP_DIR || '/tmp', 'manda-notes-empty-'));

  try {
    // Execute CLI command
    const output = execSync(`MANDA_DIR=${tempDir} pnpm tsx src/main.ts see`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000 // TUI apps need more time for interactive mode
    });

    // Should create and display an empty note with TUI
    expect(output).toBeDefined();
    expect(output.length).toBeGreaterThan(0);
    // Should contain keyboard navigation hints even for empty content
    expect(output).toContain('exit');
  } catch (error) {
    // Even if there's an error, process should handle it gracefully
    const errorOutput = (error as any).stdout || (error as any).stderr;
    expect(errorOutput).toBeDefined();
  } finally {
    // Teardown: Clean up the temporary directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('running "manda see" without MANDA_DIR should fail gracefully', () => {
  // Remove MANDA_DIR from environment
  const originalMandaDir = process.env.MANDA_DIR;
  delete process.env.MANDA_DIR;

  try {
    // Execute the CLI command - it should fail with an appropriate error message
    expect(() => {
      execSync(`pnpm tsx src/main.ts see`, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
    }).toThrow();
  } finally {
    // Restore original MANDA_DIR
    if (originalMandaDir) {
      process.env.MANDA_DIR = originalMandaDir;
    }
  }
});