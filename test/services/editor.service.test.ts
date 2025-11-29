import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest';
import { EditorService } from '../../src/services/editor.service.js';
import { spawn, execSync } from 'child_process';
import { EventEmitter } from 'events';

vi.mock('child_process');

describe('EditorService', () => {
  let service: EditorService;
  let mockProcess: EventEmitter;
  let originalEditor: string | undefined;
  let originalVisual: string | undefined;

  beforeEach(() => {
    service = new EditorService();
    mockProcess = new EventEmitter();
    vi.clearAllMocks();
    originalEditor = process.env.EDITOR;
    originalVisual = process.env.VISUAL;
  });

  afterEach(() => {
    if (originalEditor !== undefined) {
      process.env.EDITOR = originalEditor;
    } else {
      delete process.env.EDITOR;
    }
    if (originalVisual !== undefined) {
      process.env.VISUAL = originalVisual;
    } else {
      delete process.env.VISUAL;
    }
  });

  describe('getEditor', () => {
    test('should return EDITOR env variable if set and available', () => {
      process.env.EDITOR = 'code';
      vi.mocked(execSync).mockReturnValue(Buffer.from('/usr/bin/code'));

      const editor = service.getEditor();

      expect(editor).toBe('code');
      expect(execSync).toHaveBeenCalledWith('command -v code', { stdio: 'ignore' });
    });

    test('should skip EDITOR if command is not available and try defaults', () => {
      process.env.EDITOR = 'nonexistent';
      delete process.env.VISUAL;
      vi.mocked(execSync)
        .mockImplementationOnce(() => { throw new Error('not found'); }) // EDITOR fails
        .mockReturnValueOnce(Buffer.from('/usr/bin/micro')); // micro succeeds

      const editor = service.getEditor();

      expect(editor).toBe('micro');
    });

    test('should return VISUAL env variable if EDITOR is not set and available', () => {
      delete process.env.EDITOR;
      process.env.VISUAL = 'emacs';
      vi.mocked(execSync).mockReturnValue(Buffer.from('/usr/bin/emacs'));

      const editor = service.getEditor();

      expect(editor).toBe('emacs');
    });

    test('should return first available default editor if no env variables are set', () => {
      delete process.env.EDITOR;
      delete process.env.VISUAL;
      vi.mocked(execSync).mockReturnValue(Buffer.from('/usr/bin/micro'));

      const editor = service.getEditor();

      expect(editor).toBe('micro');
    });

    test('should try default editors in order until one is found', () => {
      delete process.env.EDITOR;
      delete process.env.VISUAL;
      vi.mocked(execSync)
        .mockImplementationOnce(() => { throw new Error('micro not found'); })
        .mockReturnValueOnce(Buffer.from('/usr/bin/vim'));

      const editor = service.getEditor();

      expect(editor).toBe('vim');
    });

    test('should fallback to micro if no editors are available', () => {
      delete process.env.EDITOR;
      delete process.env.VISUAL;
      vi.mocked(execSync).mockImplementation(() => { throw new Error('not found'); });

      const editor = service.getEditor();

      expect(editor).toBe('micro');
    });
  });

  describe('openFile', () => {
    beforeEach(() => {
      process.env.EDITOR = 'vim';
      vi.mocked(execSync).mockReturnValue(Buffer.from('/usr/bin/vim'));
    });

    test('should resolve immediately in test environment without spawning editor', async () => {
      const openPromise = service.openFile('/test/file.md');

      await expect(openPromise).resolves.toBeUndefined();
      expect(spawn).not.toHaveBeenCalled();
    });

    test('should spawn editor process with file path when not in test environment', async () => {
      // Temporarily set NODE_ENV to something other than 'test'
      const originalNodeEnv = process.env.NODE_ENV;
      const originalCi = process.env.CI;
      const originalVitest = process.env.VITEST;

      delete process.env.NODE_ENV;
      delete process.env.CI;
      delete process.env.VITEST;

      try {
        vi.mocked(spawn).mockReturnValue(mockProcess as any);

        const openPromise = service.openFile('/test/file.md');
        mockProcess.emit('exit', 0);

        await openPromise;

        expect(spawn).toHaveBeenCalledWith('vim', ['/test/file.md'], {
          stdio: 'inherit',
          shell: true,
        });
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
        process.env.CI = originalCi;
        process.env.VITEST = originalVitest;
      }
    });

    test('should resolve when editor exits with code 0 when not in test environment', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const originalCi = process.env.CI;
      const originalVitest = process.env.VITEST;

      delete process.env.NODE_ENV;
      delete process.env.CI;
      delete process.env.VITEST;

      try {
        vi.mocked(spawn).mockReturnValue(mockProcess as any);

        const openPromise = service.openFile('/test/file.md');
        mockProcess.emit('exit', 0);

        await expect(openPromise).resolves.toBeUndefined();
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
        process.env.CI = originalCi;
        process.env.VITEST = originalVitest;
      }
    });

    test('should resolve when editor exits with null code when not in test environment', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;

      try {
        vi.mocked(spawn).mockReturnValue(mockProcess as any);

        const openPromise = service.openFile('/test/file.md');
        mockProcess.emit('exit', null);

        await expect(openPromise).resolves.toBeUndefined();
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
      }
    });

    test('should reject when editor exits with non-zero code when not in test environment', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const originalCi = process.env.CI;
      const originalVitest = process.env.VITEST;

      delete process.env.NODE_ENV;
      delete process.env.CI;
      delete process.env.VITEST;

      try {
        vi.mocked(spawn).mockReturnValue(mockProcess as any);

        const openPromise = service.openFile('/test/file.md');
        mockProcess.emit('exit', 1);

        await expect(openPromise).rejects.toThrow('Editor exited with code 1');
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
        process.env.CI = originalCi;
        process.env.VITEST = originalVitest;
      }
    });

    test('should reject when editor process emits error when not in test environment', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const originalCi = process.env.CI;
      const originalVitest = process.env.VITEST;

      delete process.env.NODE_ENV;
      delete process.env.CI;
      delete process.env.VITEST;

      try {
        vi.mocked(spawn).mockReturnValue(mockProcess as any);
        const error = new Error('Failed to spawn');

        const openPromise = service.openFile('/test/file.md');
        mockProcess.emit('error', error);

        await expect(openPromise).rejects.toThrow('Failed to spawn');
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
        process.env.CI = originalCi;
        process.env.VITEST = originalVitest;
      }
    });
  });
});
