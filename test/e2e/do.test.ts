import { execSync } from 'child_process';
import { expect, test } from 'vitest';
import path from 'path';
import fs from 'fs';

// Set test environment
process.env.NODE_ENV = 'test';

// Helper to create a temporary notes directory for testing
const createTempNotesDir = (content: string, fileName?: string) => {
  const tempDir = fs.mkdtempSync(
    path.join(process.env.GEMINI_TEMP_DIR || '/tmp', 'manda-do-test-'),
  );
  // Use the same fixed date as the application uses in tests
  const testDate = '2025-11-25';
  const today = fileName || testDate;
  const filePath = path.join(tempDir, `${today}.md`);
  fs.writeFileSync(filePath, content);
  return tempDir;
};

test('running "manda do" should display incomplete tasks from today\'s note', () => {
  // Setup: Create a dummy notes directory and a today.md file with tasks
  const notesDir = createTempNotesDir(`
## My Tasks
- [ ] Buy milk
- [x] Call mom
- [ ] Write report

## Other Notes
- Some random text
`);

  try {
    // Execute the CLI command
    const output = execSync(`MANDA_DIR=${notesDir} pnpm tsx src/main.ts do`, {
      encoding: 'utf-8',
      timeout: 5000,
      killSignal: 'SIGTERM',
      env: { ...process.env, NODE_ENV: 'test', CI: 'true' },
    });

    // Assert: Check if the output contains the expected incomplete tasks
    expect(output).toContain('My Tasks');
    expect(output).toContain('Buy milk');
    expect(output).toContain('Write report');
    expect(output).toContain('[✓] Call mom'); // Completed task should be shown with checkmark
    expect(output).not.toContain('Other Notes'); // Other sections should not be shown
  } finally {
    // Teardown: Clean up the temporary directory
    fs.rmSync(notesDir, { recursive: true, force: true });
  }
});

test('running "manda do" should display empty message when no tasks found', () => {
  // Setup: Create a dummy notes directory with a note that has no tasks
  const notesDir = createTempNotesDir(`
# ${new Date().toISOString().slice(0, 10)}

## Notes
Just some regular content without any tasks.

## More Notes
- This is not a task
- [invalid] This is also not a task
`);

  try {
    // Execute the CLI command
    const output = execSync(`MANDA_DIR=${notesDir} pnpm tsx src/main.ts do`, {
      encoding: 'utf-8',
      timeout: 5000,
      killSignal: 'SIGTERM',
    });

    // Assert: Check if the output shows no tasks found
    expect(output).toContain('No tasks found in this note');
  } finally {
    // Teardown: Clean up the temporary directory
    fs.rmSync(notesDir, { recursive: true, force: true });
  }
});

test('running "manda do --yester" should display yesterday\'s tasks', () => {
  // Setup: Create a dummy notes directory with yesterday's note
  const notesDir = createTempNotesDir(
    `
## Yesterday's Tasks
- [ ] Review code
- [x] Update docs
- [ ] Plan meeting
`,
    '2025-11-24',
  );

  try {
    // Execute the CLI command with --yester flag
    const output = execSync(`MANDA_DIR=${notesDir} pnpm tsx src/main.ts do --yester`, {
      encoding: 'utf-8',
      timeout: 5000,
      killSignal: 'SIGTERM',
      env: { ...process.env, NODE_ENV: 'test' },
    });

    // Assert: Check if the output contains yesterday's incomplete tasks
    expect(output).toContain("Yesterday's Tasks");
    expect(output).toContain('Review code');
    expect(output).toContain('Plan meeting');
    expect(output).toContain('[✓] Update docs'); // Completed task should be shown with checkmark
  } finally {
    // Teardown: Clean up the temporary directory
    fs.rmSync(notesDir, { recursive: true, force: true });
  }
});

test('running "manda do" without MANDA_DIR should fail gracefully', () => {
  // Remove MANDA_DIR from environment
  const originalMandaDir = process.env.MANDA_DIR;
  delete process.env.MANDA_DIR;

  try {
    // Execute the CLI command - it should fail with an appropriate error message
    expect(() => {
      execSync('pnpm tsx src/main.ts do', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' },
      });
    }).toThrow();
  } finally {
    // Restore original MANDA_DIR
    if (originalMandaDir) {
      process.env.MANDA_DIR = originalMandaDir;
    }
  }
});
