import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { NoteService } from '../../src/domain/note.service.js';
import { FileSystemService } from '../../src/services/file-system.service.js';

vi.mock('../../src/services/file-system.service.js');

describe('NoteService', () => {
  let service: NoteService;
  let mockFileSystemService: FileSystemService;

  beforeEach(() => {
    mockFileSystemService = new FileSystemService();
    service = new NoteService(mockFileSystemService);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getTodayFileName', () => {
    test('should return file name in YYYY-MM-DD.md format', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-11-19T10:00:00Z'));

      const fileName = service.getTodayFileName();

      expect(fileName).toBe('2025-11-19.md');
    });

    test('should pad single digit month and day with zero', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-05T10:00:00Z'));

      const fileName = service.getTodayFileName();

      expect(fileName).toBe('2025-01-05.md');
    });
  });

  describe('getNotePath', () => {
    test("should return full path to today's note", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-11-19T10:00:00Z'));

      const notePath = service.getNotePath('/notes');

      expect(notePath).toBe('/notes/2025-11-19.md');
    });
  });

  describe('ensureNoteExists', () => {
    test("should create note file with incomplete tasks if it does not exist and is today's note", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-11-19T10:00:00Z'));

      vi.mocked(mockFileSystemService.fileExists).mockImplementation(async (path: string) => {
        if (path === '/notes/2025-11-19.md') return false;
        if (path === '/notes/2025-11-18.md') return true;
        return false;
      });
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue(`# 2025-11-18

## Tasks
- [ ] Incomplete task
`);
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.ensureNoteExists('/notes/2025-11-19.md');

      expect(mockFileSystemService.fileExists).toHaveBeenCalledWith('/notes/2025-11-19.md');
      expect(mockFileSystemService.fileExists).toHaveBeenCalledWith('/notes/2025-11-18.md');
      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        '/notes/2025-11-19.md',
        '# 2025-11-19\n\n[2025-11-18](2025-11-18.md)\n\n- [ ] Incomplete task\n\n---\n\n',
      );
    });

    test("should create empty note file if it does not exist and is not today's note", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-11-19T10:00:00Z'));

      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(false);
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.ensureNoteExists('/notes/2025-11-18.md');

      expect(mockFileSystemService.fileExists).toHaveBeenCalledWith('/notes/2025-11-18.md');
      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith('/notes/2025-11-18.md', '');
    });

    test('should not create note file if it already exists', async () => {
      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);

      await service.ensureNoteExists('/notes/2025-11-19.md');

      expect(mockFileSystemService.fileExists).toHaveBeenCalledWith('/notes/2025-11-19.md');
      expect(mockFileSystemService.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('generateNoteWithIncompleteTasks', () => {
    test("should generate note content with incomplete tasks from yesterday's note", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-11-19T10:00:00Z'));

      // Mock yesterday's note with incomplete tasks
      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue(`# 2025-11-18

## Tasks
- [x] Completed task
- [ ] Incomplete task 1
- [ ] Incomplete task 2

## Notes
Some notes here.`);

      const result = await (service as any).generateNoteWithIncompleteTasks('/notes/2025-11-19.md');

      expect(result).toContain('[2025-11-18](2025-11-18.md)');
      expect(result).toContain('- [ ] Incomplete task 1');
      expect(result).toContain('- [ ] Incomplete task 2');
      expect(result).not.toContain('- [x] Completed task');
      expect(result).toContain('---');
      expect(result).toContain('# 2025-11-19');
    });

    test('should preserve existing date links when extracting tasks', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-11-19T10:00:00Z'));

      // Mock fileExists to return true for any file
      vi.mocked(mockFileSystemService.fileExists).mockImplementation((_filePath: string) => {
        return Promise.resolve(true);
      });

      // Mock readFile to return different content based on file path
      vi.mocked(mockFileSystemService.readFile).mockImplementation((filePath: string) => {
        if (filePath.includes('2025-11-18.md')) {
          return Promise.resolve(`# 2025-11-18

[2025-11-17](2025-11-17.md)

- [ ] Task from two days ago
- [x] Completed task from two days ago

- [ ] Task from yesterday
- [x] Completed task from yesterday`);
        } else if (filePath.includes('2025-11-17.md')) {
          return Promise.resolve(`# 2025-11-17

- [ ] Task from three days ago
- [x] Completed task from three days ago`);
        }
        return Promise.resolve('');
      });

      const result = await (service as any).generateNoteWithIncompleteTasks('/notes/2025-11-19.md');

      expect(result).toContain('[2025-11-17](2025-11-17.md)');
      expect(result).toContain('- [ ] Task from two days ago');
      expect(result).not.toContain('- [x] Completed task from two days ago');
      expect(result).toContain('- [ ] Task from yesterday');
      expect(result).not.toContain('- [x] Completed task from yesterday');
      expect(result).toContain('- [ ] Task from three days ago');
      expect(result).toContain('---');
    });

    test("should return empty string when yesterday's note has no incomplete tasks", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-11-19T10:00:00Z'));

      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue(`# 2025-11-18

## Tasks
- [x] Completed task 1
- [x] Completed task 2

## Notes
Some notes.`);

      const result = await (service as any).generateNoteWithIncompleteTasks('/notes/2025-11-19.md');

      expect(result).toBe('# 2025-11-19\n\n');
    });

    test("should return empty string when yesterday's note does not exist", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-11-19T10:00:00Z'));

      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(false);

      const result = await (service as any).generateNoteWithIncompleteTasks('/notes/2025-11-19.md');

      expect(result).toBe('# 2025-11-19\n\n');
    });
  });

  describe('extractIncompleteTasks', () => {
    test('should extract incomplete tasks from markdown content', () => {
      const content = `# Note

## Tasks
- [x] Completed task
- [ ] Incomplete task 1
- [ ] Incomplete task 2
  - [ ] Nested incomplete task

## Notes
Some notes here.

- [ ] Another incomplete task
`;

      const result = (service as any).extractIncompleteTasks(content);

      expect(result).toEqual([
        '- [ ] Incomplete task 1',
        '- [ ] Incomplete task 2',
        '- [ ] Nested incomplete task',
        '- [ ] Another incomplete task',
      ]);
    });

    test('should return empty array when no incomplete tasks', () => {
      const content = `# Note

## Tasks
- [x] Completed task 1
- [x] Completed task 2

## Notes
Some notes.`;

      const result = (service as any).extractIncompleteTasks(content);

      expect(result).toEqual([]);
    });
  });

  describe('extractIncompleteTasksGroupedByDate', () => {
    test('should extract tasks grouped by date links', () => {
      const content = `# 2025-11-18

[2025-11-17](2025-11-17.md)

- [ ] Task from two days ago
- [x] Completed task from two days ago

- [ ] Task from yesterday
- [x] Completed task from yesterday

[2025-11-16](2025-11-16.md)

- [ ] Task from three days ago`;

      const result = (service as any).extractIncompleteTasksGroupedByDate(content);

      expect(result).toEqual([
        ['2025-11-17', ['- [ ] Task from two days ago', '- [ ] Task from yesterday']],
        ['2025-11-16', ['- [ ] Task from three days ago']],
      ]);
    });

    test('should handle content without date links', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-11-19T10:00:00Z'));

      const content = `# 2025-11-18

## Tasks
- [ ] Task 1
- [x] Completed task

## Notes
Some notes.`;

      const result = (service as any).extractIncompleteTasksGroupedByDate(content);

      expect(result).toEqual([['2025-11-18', ['- [ ] Task 1']]]);
    });

    test('should return empty array when no incomplete tasks', () => {
      const content = `# Note

[2025-11-17](2025-11-17.md)

- [x] Completed task 1
- [x] Completed task 2

## Notes
Some notes.`;

      const result = (service as any).extractIncompleteTasksGroupedByDate(content);

      expect(result).toEqual([]);
    });
  });

  describe('ensureNotesDirExists', () => {
    test('should ensure notes directory exists', async () => {
      vi.mocked(mockFileSystemService.ensureDirectoryExists).mockResolvedValue(undefined);

      await service.ensureNotesDirExists('/notes');

      expect(mockFileSystemService.ensureDirectoryExists).toHaveBeenCalledWith('/notes');
    });
  });

  describe('moveYesterdaysNoteToOrganizedStructure', () => {
    test("should move yesterday's note to organized directory structure", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-11-19T10:00:00Z'));

      // Mock yesterday's note exists
      vi.mocked(mockFileSystemService.fileExists).mockImplementation(async (path: string) => {
        return path === '/notes/2025-11-18.md';
      });
      vi.mocked(mockFileSystemService.ensureDirectoryExists).mockResolvedValue(undefined);
      vi.mocked(mockFileSystemService.moveFile).mockResolvedValue(undefined);

      await (service as any).moveYesterdaysNoteToOrganizedStructure('/notes/2025-11-19.md');

      expect(mockFileSystemService.fileExists).toHaveBeenCalledWith('/notes/2025-11-18.md');
      expect(mockFileSystemService.ensureDirectoryExists).toHaveBeenCalledWith('/notes/2025/11');
      expect(mockFileSystemService.moveFile).toHaveBeenCalledWith(
        '/notes/2025-11-18.md',
        '/notes/2025/11/2025-11-18.md',
      );
    });

    test("should not move note if yesterday's note does not exist", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-11-19T10:00:00Z'));

      // Mock yesterday's note does not exist
      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(false);

      await (service as any).moveYesterdaysNoteToOrganizedStructure('/notes/2025-11-19.md');

      expect(mockFileSystemService.fileExists).toHaveBeenCalledWith('/notes/2025-11-18.md');
      expect(mockFileSystemService.ensureDirectoryExists).not.toHaveBeenCalled();
      expect(mockFileSystemService.moveFile).not.toHaveBeenCalled();
    });

    test('should create correct directory structure with padded month', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-05T10:00:00Z'));

      // Mock yesterday's note exists (2025-01-04)
      vi.mocked(mockFileSystemService.fileExists).mockImplementation(async (path: string) => {
        return path === '/notes/2025-01-04.md';
      });
      vi.mocked(mockFileSystemService.ensureDirectoryExists).mockResolvedValue(undefined);
      vi.mocked(mockFileSystemService.moveFile).mockResolvedValue(undefined);

      await (service as any).moveYesterdaysNoteToOrganizedStructure('/notes/2025-01-05.md');

      expect(mockFileSystemService.ensureDirectoryExists).toHaveBeenCalledWith('/notes/2025/01');
      expect(mockFileSystemService.moveFile).toHaveBeenCalledWith(
        '/notes/2025-01-04.md',
        '/notes/2025/01/2025-01-04.md',
      );
    });
  });

  describe('getCurrentTimeString', () => {
    test('should return current time in HH:mm format', () => {
      const timeString = service.getCurrentTimeString();

      // Should match HH:mm format
      expect(timeString).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe('hasContentAfterLastTimestamp', () => {
    test('should return true when no timestamps exist', () => {
      const content = '# Note without timestamps\nSome content here';

      // Access private method through type assertion
      const hasContent = (service as any).hasContentAfterLastTimestamp(content);

      expect(hasContent).toBe(true);
    });

    test('should return true when there is content after last timestamp', () => {
      const content = '# Note\n[10:30]\nSome content after timestamp';

      const hasContent = (service as any).hasContentAfterLastTimestamp(content);

      expect(hasContent).toBe(true);
    });

    test('should return false when there is only whitespace after last timestamp', () => {
      const content = '# Note\n[10:30]\n   \n  ';

      const hasContent = (service as any).hasContentAfterLastTimestamp(content);

      expect(hasContent).toBe(false);
    });

    test('should return false when timestamp is at the end of file', () => {
      const content = '# Note\n[10:30]';

      const hasContent = (service as any).hasContentAfterLastTimestamp(content);

      expect(hasContent).toBe(false);
    });

    test('should return false when timestamp is followed only by newline', () => {
      const content = '# Note\n[10:30]\n';

      const hasContent = (service as any).hasContentAfterLastTimestamp(content);

      expect(hasContent).toBe(false);
    });

    test('should handle multiple timestamps correctly', () => {
      const content = '# Note\n[09:00]\nMorning content\n[10:30]';

      const hasContent = (service as any).hasContentAfterLastTimestamp(content);

      expect(hasContent).toBe(false);
    });

    test('should return true when last timestamp has content after it', () => {
      const content = '# Note\n[09:00]\nMorning content\n[10:30]\nAfternoon content';

      const hasContent = (service as any).hasContentAfterLastTimestamp(content);

      expect(hasContent).toBe(true);
    });
  });

  describe('appendTimestampLink', () => {
    test('should append timestamp link to existing file', async () => {
      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue(
        '# Existing Note\n\nSome content',
      );
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.appendTimestampLink('/notes/2025-11-19.md');

      expect(mockFileSystemService.fileExists).toHaveBeenCalledWith('/notes/2025-11-19.md');
      expect(mockFileSystemService.readFile).toHaveBeenCalledWith('/notes/2025-11-19.md');
      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        '/notes/2025-11-19.md',
        expect.stringContaining('# Existing Note'),
      );
      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        '/notes/2025-11-19.md',
        expect.stringContaining('Some content'),
      );
      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        '/notes/2025-11-19.md',
        expect.stringMatching(/\[\d{2}:\d{2}\]/),
      );
    });

    test('should append timestamp link to empty file', async () => {
      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue('');
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.appendTimestampLink('/notes/2025-11-19.md');

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        '/notes/2025-11-19.md',
        expect.stringMatching(/^\[\d{2}:\d{2}\]\n$/),
      );
    });

    test('should create file and append timestamp link if file does not exist', async () => {
      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(false);
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.appendTimestampLink('/notes/2025-11-19.md');

      expect(mockFileSystemService.fileExists).toHaveBeenCalledWith('/notes/2025-11-19.md');
      expect(mockFileSystemService.readFile).not.toHaveBeenCalled();
      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        '/notes/2025-11-19.md',
        expect.stringMatching(/^\[\d{2}:\d{2}\]\n$/),
      );
    });

    test('should add newline before timestamp if file content does not end with newline', async () => {
      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue('# Note without newline at end');
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.appendTimestampLink('/notes/2025-11-19.md');

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        '/notes/2025-11-19.md',
        expect.stringMatching(/^# Note without newline at end\s+\[\d{2}:\d{2}\]\n$/),
      );
    });

    test('should not add extra newline if file already ends with newline', async () => {
      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue('# Note ending with newline\n');
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.appendTimestampLink('/notes/2025-11-19.md');

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        '/notes/2025-11-19.md',
        expect.stringMatching(/^# Note ending with newline\s+\[\d{2}:\d{2}\]\n$/),
      );
    });

    test('should replace last timestamp when there is no content after it', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 10, 19, 14, 30, 0)); // Local time to avoid timezone issues

      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue('# Note\n[10:30]');
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.appendTimestampLink('/notes/2025-11-19.md');

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        '/notes/2025-11-19.md',
        '# Note\n[14:30]',
      );

      vi.useRealTimers();
    });

    test('should replace last timestamp when there is only whitespace after it', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 10, 19, 14, 30, 0)); // Local time

      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue('# Note\n[10:30]\n   \n  ');
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.appendTimestampLink('/notes/2025-11-19.md');

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        '/notes/2025-11-19.md',
        '# Note\n[14:30]\n   \n  ',
      );

      vi.useRealTimers();
    });

    test('should replace last timestamp when it is followed only by newline', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 10, 19, 14, 30, 0)); // Local time

      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue('# Note\n[10:30]\n');
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.appendTimestampLink('/notes/2025-11-19.md');

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        '/notes/2025-11-19.md',
        '# Note\n[14:30]\n',
      );

      vi.useRealTimers();
    });

    test('should append new timestamp when there is content after last timestamp', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 10, 19, 14, 30, 0)); // Local time

      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue(
        '# Note\n[10:30]\nSome content here',
      );
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.appendTimestampLink('/notes/2025-11-19.md');

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        '/notes/2025-11-19.md',
        '# Note\n[10:30]\nSome content here\n[14:30]\n',
      );

      vi.useRealTimers();
    });

    test('should replace the last timestamp when there are multiple timestamps and no content after the last one', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 10, 19, 14, 30, 0)); // Local time

      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue(
        '# Note\n[09:00]\nMorning content\n[10:30]',
      );
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.appendTimestampLink('/notes/2025-11-19.md');

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        '/notes/2025-11-19.md',
        '# Note\n[09:00]\nMorning content\n[14:30]',
      );

      vi.useRealTimers();
    });

    test('should append new timestamp when there are multiple timestamps with content after the last one', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 10, 19, 14, 30, 0)); // Local time

      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue(
        '# Note\n[09:00]\nMorning content\n[10:30]\nAfternoon content',
      );
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.appendTimestampLink('/notes/2025-11-19.md');

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        '/notes/2025-11-19.md',
        '# Note\n[09:00]\nMorning content\n[10:30]\nAfternoon content\n[14:30]\n',
      );

      vi.useRealTimers();
    });
  });

  describe('hasContentAddedBelowLastTimestamp', () => {
    test('should return false when no timestamps exist', () => {
      const before = '# Note without timestamps';
      const after = '# Note without timestamps\nSome content';

      const hasContent = (service as any).hasContentAddedBelowLastTimestamp(before, after);

      expect(hasContent).toBe(false);
    });

    test('should return false when timestamp count changed', () => {
      const before = '# Note\n[10:30]';
      const after = '# Note\n[10:30]\n[11:00] Some content';

      const hasContent = (service as any).hasContentAddedBelowLastTimestamp(before, after);

      expect(hasContent).toBe(false);
    });

    test('should return false when last timestamp changed', () => {
      const before = '# Note\n[10:30]';
      const after = '# Note\n[11:00]';

      const hasContent = (service as any).hasContentAddedBelowLastTimestamp(before, after);

      expect(hasContent).toBe(false);
    });

    test('should return true when content is added after last timestamp', () => {
      const before = '# Note\n[10:30]';
      const after = '# Note\n[10:30]\nSome new content';

      const hasContent = (service as any).hasContentAddedBelowLastTimestamp(before, after);

      expect(hasContent).toBe(true);
    });

    test('should return true when content is added after last timestamp with existing content', () => {
      const before = '# Note\n[10:30]\nExisting content';
      const after = '# Note\n[10:30]\nExisting content\nNew content';

      const hasContent = (service as any).hasContentAddedBelowLastTimestamp(before, after);

      expect(hasContent).toBe(true);
    });

    test('should return false when only whitespace is added after last timestamp', () => {
      const before = '# Note\n[10:30]';
      const after = '# Note\n[10:30]\n   \n  ';

      const hasContent = (service as any).hasContentAddedBelowLastTimestamp(before, after);

      expect(hasContent).toBe(false);
    });

    test('should return false when content is added before last timestamp', () => {
      const before = 'Content\n[10:30]';
      const after = 'New content\n[10:30]';

      const hasContent = (service as any).hasContentAddedBelowLastTimestamp(before, after);

      expect(hasContent).toBe(false);
    });
  });

  describe('postProcessAfterEdit', () => {
    test('should add separator when content is added below last timestamp', async () => {
      const before = '# Note\n[10:30]';
      const after = '# Note\n[10:30]\nSome new content';

      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.postProcessAfterEdit('/test/note.md', before, after);

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        '/test/note.md',
        '# Note\n[10:30]\nSome new content\n\n---\n\n',
      );
    });

    test('should not add separator when no content is added below last timestamp', async () => {
      const before = '# Note\n[10:30]';
      const after = '# Note\n[10:30]';

      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.postProcessAfterEdit('/test/note.md', before, after);

      expect(mockFileSystemService.writeFile).not.toHaveBeenCalled();
    });

    test('should not add separator when only whitespace is added below last timestamp', async () => {
      const before = '# Note\n[10:30]';
      const after = '# Note\n[10:30]\n   \n  ';

      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.postProcessAfterEdit('/test/note.md', before, after);

      expect(mockFileSystemService.writeFile).not.toHaveBeenCalled();
    });

    test('should not add separator when timestamp count changed', async () => {
      const before = '# Note\n[10:30]';
      const after = '# Note\n[10:30]\n[11:00] Some content';

      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.postProcessAfterEdit('/test/note.md', before, after);

      expect(mockFileSystemService.writeFile).not.toHaveBeenCalled();
    });

    test('should not add separator when last timestamp changed', async () => {
      const before = '# Note\n[10:30]';
      const after = '# Note\n[11:00]';

      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.postProcessAfterEdit('/test/note.md', before, after);

      expect(mockFileSystemService.writeFile).not.toHaveBeenCalled();
    });

    test('should not add separator when already present at end', async () => {
      const before = '# Note\n[10:30]\nSome content\n---\n\n';
      const after = '# Note\n[10:30]\nSome content\n---\n\n';

      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.postProcessAfterEdit('/test/note.md', before, after);

      // No new content added and separator already at end, so no modification needed
      expect(mockFileSystemService.writeFile).not.toHaveBeenCalled();
    });

    test('should add separator when content is added after existing separator', async () => {
      const before = '# Note\n[10:30]\nSome content\n---\n\n';
      const after = '# Note\n[10:30]\nSome content\n---\n\nAdditional content';

      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.postProcessAfterEdit('/test/note.md', before, after);

      // Content was added after existing separator, so new separator should be added
      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        '/test/note.md',
        '# Note\n[10:30]\nSome content\n---\n\nAdditional content\n\n---\n\n',
      );
    });

    test('should add separator when content does not end with newline', async () => {
      const before = '# Note\n[10:30]';
      const after = '# Note\n[10:30]\nSome new content';

      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.postProcessAfterEdit('/test/note.md', before, after);

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        '/test/note.md',
        '# Note\n[10:30]\nSome new content\n\n---\n\n',
      );
    });

    test('should add separator when content already ends with newline', async () => {
      const before = '# Note\n[10:30]';
      const after = '# Note\n[10:30]\nSome new content\n';

      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.postProcessAfterEdit('/test/note.md', before, after);

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        '/test/note.md',
        '# Note\n[10:30]\nSome new content\n\n---\n\n',
      );
    });
  });
});
