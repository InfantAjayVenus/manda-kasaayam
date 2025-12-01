import { test, expect, describe, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { NoteService } from '../../src/domain/note.service.js';
import { FileSystemService } from '../../src/services/file-system.service.js';

describe('Note Moving E2E', () => {
  let testTempDir: string;

  beforeEach(() => {
    testTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'manda-move-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(testTempDir)) {
      fs.rmSync(testTempDir, { recursive: true, force: true });
    }
  });

  test('should move yesterday\'s note to organized directory structure when creating today\'s note', async () => {
    // Create yesterday's note file
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayFileName = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}.md`;
    const yesterdayFilePath = path.join(testTempDir, yesterdayFileName);
    const yesterdayContent = '# Yesterday\'s Note\n\nSome content from yesterday';
    fs.writeFileSync(yesterdayFilePath, yesterdayContent);

    // Create real services
    const realFileSystemService = new FileSystemService();
    const realNoteService = new NoteService(realFileSystemService);

    // Get today's note path
    const todayNotePath = realNoteService.getNotePath(testTempDir);

    // Call ensureNoteExists which should trigger the move
    await realNoteService.ensureNoteExists(todayNotePath);

    // Check that yesterday's note was moved to organized structure
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const organizedDir = path.join(testTempDir, String(year), month);
    const organizedFilePath = path.join(organizedDir, yesterdayFileName);

    expect(fs.existsSync(organizedFilePath)).toBe(true);
    expect(fs.existsSync(yesterdayFilePath)).toBe(false); // Should be moved, not copied
    expect(fs.readFileSync(organizedFilePath, 'utf-8')).toBe(yesterdayContent);
  });

  test('should not move note if yesterday\'s note does not exist', async () => {
    // Create real services
    const realFileSystemService = new FileSystemService();
    const realNoteService = new NoteService(realFileSystemService);

    // Get today's note path
    const todayNotePath = realNoteService.getNotePath(testTempDir);

    // Call ensureNoteExists
    await realNoteService.ensureNoteExists(todayNotePath);

    // Check that today's note was created
    expect(fs.existsSync(todayNotePath)).toBe(true);

    // Check that no organized directories were created
    const files = fs.readdirSync(testTempDir);
    expect(files.length).toBe(1); // Only today's note should exist
    expect(files[0]).toMatch(/\d{4}-\d{2}-\d{2}\.md$/);
  });
});