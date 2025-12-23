import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

describe('Manda Command Integration Tests', () => {
  let tempDir: string;
  let notesDir: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(process.env.TMPDIR || '/tmp', 'manda-test-'));
    notesDir = path.join(tempDir, 'notes');
    await fs.mkdir(notesDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up the temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const runMandaCommand = () => {
    const env = {
      ...process.env,
      MANDA_DIR: notesDir,
      EDITOR: 'echo', // Use echo as fake editor to avoid hanging
      CI: 'true', // Disable Ink raw mode for CI/testing
    };
    return execSync('pnpm tsx src/main.ts', {
      env,
      cwd: process.cwd(),
      encoding: 'utf8',
    });
  };

  const getTodayFileName = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}.md`;
  };

  const readNoteFile = async () => {
    const notePath = path.join(notesDir, getTodayFileName());
    return await fs.readFile(notePath, 'utf8');
  };

  test('should create new note with timestamp when file does not exist', async () => {
    runMandaCommand();

    const content = await readNoteFile();
    expect(content).toMatch(/^# \d{4}-\d{2}-\d{2}\n\n\[\d{2}:\d{2}\]\n$/);
  });

  test('should append timestamp when note has content after last timestamp', async () => {
    // Create initial note with content
    const notePath = path.join(notesDir, getTodayFileName());
    await fs.writeFile(notePath, '# Meeting Notes\n[10:30]\nDiscussion about project\n');

    runMandaCommand();

    const content = await readNoteFile();
    const lines = content.split('\n');
    expect(lines).toContain('# Meeting Notes');
    expect(lines).toContain('[10:30]');
    expect(lines).toContain('Discussion about project');
    // Should have a new timestamp appended
    expect(content).toMatch(/\n\[\d{2}:\d{2}\]\n$/);
  });
  test('should replace last timestamp when there is no content after it', async () => {
    // Create initial note with timestamp at the end
    const notePath = path.join(notesDir, getTodayFileName());
    await fs.writeFile(notePath, '# Meeting Notes\n[10:30]\n');

    runMandaCommand();

    const content = await readNoteFile();
    const lines = content.split('\n');
    expect(lines).toContain('# Meeting Notes');
    // Should have only one timestamp (the old one replaced)
    const timestampMatches = content.match(/\[\d{2}:\d{2}\]/g);
    expect(timestampMatches).toHaveLength(1);
    // The timestamp should not be [10:30] anymore
    expect(content).not.toContain('[10:30]');
  });

  test('should replace last timestamp when it is at the end of file without newline', async () => {
    // Create initial note with timestamp at the end (no newline)
    const notePath = path.join(notesDir, getTodayFileName());
    await fs.writeFile(notePath, '# Meeting Notes\n[10:30]');

    runMandaCommand();

    const content = await readNoteFile();
    const lines = content.split('\n');
    expect(lines).toContain('# Meeting Notes');
    // Should have only one timestamp (the old one replaced)
    const timestampMatches = content.match(/\[\d{2}:\d{2}\]/g);
    expect(timestampMatches).toHaveLength(1);
    expect(content).not.toContain('[10:30]');
  });

  test('should replace last timestamp when there is only whitespace after it', async () => {
    // Create initial note with timestamp followed by whitespace
    const notePath = path.join(notesDir, getTodayFileName());
    await fs.writeFile(notePath, '# Meeting Notes\n[10:30]\n   \n  \n');

    runMandaCommand();

    const content = await readNoteFile();
    expect(content).toContain('# Meeting Notes');
    // Should have only one timestamp (the old one replaced)
    const timestampMatches = content.match(/\[\d{2}:\d{2}\]/g);
    expect(timestampMatches).toHaveLength(1);
    expect(content).not.toContain('[10:30]');
    // Whitespace should be preserved
    expect(content).toContain('   \n  \n');
  });

  test('should append new timestamp when there is content after last timestamp', async () => {
    // Create initial note with content after timestamp
    const notePath = path.join(notesDir, getTodayFileName());
    await fs.writeFile(notePath, '# Meeting Notes\n[10:30]\nDiscussion points\nAction items');

    runMandaCommand();

    const content = await readNoteFile();
    expect(content).toContain('# Meeting Notes');
    expect(content).toContain('[10:30]');
    expect(content).toContain('Discussion points');
    expect(content).toContain('Action items');
    // Should have both timestamps
    const timestampMatches = content.match(/\[\d{2}:\d{2}\]/g);
    expect(timestampMatches).toHaveLength(2);
    // New timestamp should be at the end
    expect(content).toMatch(/\n\[\d{2}:\d{2}\]\n$/);
  });

  test('should handle multiple timestamps correctly', async () => {
    // Create note with multiple timestamps
    const notePath = path.join(notesDir, getTodayFileName());
    await fs.writeFile(
      notePath,
      '# Daily Log\n[09:00]\nMorning routine\n[12:30]\nLunch meeting\n[15:45]',
    );

    runMandaCommand();

    const content = await readNoteFile();
    expect(content).toContain('# Daily Log');
    expect(content).toContain('[09:00]');
    expect(content).toContain('[12:30]');
    expect(content).toContain('Morning routine');
    expect(content).toContain('Lunch meeting');
    // Should have 3 timestamps (last one replaced)
    const timestampMatches = content.match(/\[\d{2}:\d{2}\]/g);
    expect(timestampMatches).toHaveLength(3);
    expect(content).not.toContain('[15:45]');
  });

  test('should handle empty note file', async () => {
    // Create empty note file
    const notePath = path.join(notesDir, getTodayFileName());
    await fs.writeFile(notePath, '');

    runMandaCommand();

    const content = await readNoteFile();
    expect(content).toMatch(/^\[\d{2}:\d{2}\]\n$/);
  });

  test('should preserve existing content structure when replacing timestamp', async () => {
    // Create note with complex structure
    const notePath = path.join(notesDir, getTodayFileName());
    await fs.writeFile(
      notePath,
      `# Project Status

## Completed Tasks
- [x] Setup repository
- [x] Initial commit

## Current Work
[14:20]

## Notes
Some important notes here`,
    );

    runMandaCommand();

    const content = await readNoteFile();
    expect(content).toContain('# Project Status');
    expect(content).toContain('## Completed Tasks');
    expect(content).toContain('- [x] Setup repository');
    expect(content).toContain('- [x] Initial commit');
    expect(content).toContain('## Current Work');
    expect(content).toContain('## Notes');
    expect(content).toContain('Some important notes here');
    // Should have two timestamps (appended since there's content after the last one)
    const timestampMatches = content.match(/\[\d{2}:\d{2}\]/g);
    expect(timestampMatches).toHaveLength(2);
    expect(content).toContain('[14:20]'); // Original timestamp should remain
    // New timestamp should be at the end
    expect(content).toMatch(/\n\[\d{2}:\d{2}\]\n$/);
  });
});
