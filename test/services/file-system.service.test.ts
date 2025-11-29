import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest';
import { FileSystemService } from '../../src/services/file-system.service.js';
import fs from 'fs/promises';

vi.mock('fs/promises');

describe('FileSystemService', () => {
  let service: FileSystemService;

  beforeEach(() => {
    service = new FileSystemService();
    vi.clearAllMocks();
  });

  describe('fileExists', () => {
    test('should return true if file exists', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const result = await service.fileExists('/test/file.txt');

      expect(result).toBe(true);
      expect(fs.access).toHaveBeenCalledWith('/test/file.txt');
    });

    test('should return false if file does not exist', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      const result = await service.fileExists('/test/nonexistent.txt');

      expect(result).toBe(false);
    });
  });

  describe('readFile', () => {
    test('should read file content', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('file content');

      const content = await service.readFile('/test/file.txt');

      expect(content).toBe('file content');
      expect(fs.readFile).toHaveBeenCalledWith('/test/file.txt', 'utf-8');
    });
  });

  describe('writeFile', () => {
    test('should write content to file', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await service.writeFile('/test/file.txt', 'new content');

      expect(fs.writeFile).toHaveBeenCalledWith('/test/file.txt', 'new content', 'utf-8');
    });
  });

  describe('createDirectory', () => {
    test('should create directory recursively', async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);

      await service.createDirectory('/test/nested/path');

      expect(fs.mkdir).toHaveBeenCalledWith('/test/nested/path', { recursive: true });
    });
  });

  describe('ensureDirectoryExists', () => {
    test('should create directory if it does not exist', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('Not found'));
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);

      await service.ensureDirectoryExists('/test/new-dir');

      expect(fs.access).toHaveBeenCalledWith('/test/new-dir');
      expect(fs.mkdir).toHaveBeenCalledWith('/test/new-dir', { recursive: true });
    });

    test('should not create directory if it already exists', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);

      await service.ensureDirectoryExists('/test/existing-dir');

      expect(fs.access).toHaveBeenCalledWith('/test/existing-dir');
      expect(fs.mkdir).not.toHaveBeenCalled();
    });
  });

  describe('moveFile', () => {
    test('should move file from source to destination', async () => {
      vi.mocked(fs.rename).mockResolvedValue(undefined);

      await service.moveFile('/source/file.txt', '/destination/file.txt');

      expect(fs.rename).toHaveBeenCalledWith('/source/file.txt', '/destination/file.txt');
    });
  });
});
