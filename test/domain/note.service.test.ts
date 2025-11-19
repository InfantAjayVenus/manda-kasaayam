import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest';
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
    test('should return full path to today\'s note', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-11-19T10:00:00Z'));

      const notePath = service.getNotePath('/notes');

      expect(notePath).toBe('/notes/2025-11-19.md');
    });
  });

  describe('ensureNoteExists', () => {
    test('should create note file if it does not exist', async () => {
      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(false);
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.ensureNoteExists('/notes/2025-11-19.md');

      expect(mockFileSystemService.fileExists).toHaveBeenCalledWith('/notes/2025-11-19.md');
      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith('/notes/2025-11-19.md', '');
    });

    test('should not create note file if it already exists', async () => {
      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);

      await service.ensureNoteExists('/notes/2025-11-19.md');

      expect(mockFileSystemService.fileExists).toHaveBeenCalledWith('/notes/2025-11-19.md');
      expect(mockFileSystemService.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('ensureNotesDirExists', () => {
    test('should ensure notes directory exists', async () => {
      vi.mocked(mockFileSystemService.ensureDirectoryExists).mockResolvedValue(undefined);

      await service.ensureNotesDirExists('/notes');

      expect(mockFileSystemService.ensureDirectoryExists).toHaveBeenCalledWith('/notes');
    });
  });
});
