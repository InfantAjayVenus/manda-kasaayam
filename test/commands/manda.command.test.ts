import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest';
import { MandaCommand } from '../../src/commands/manda.command.js';
import { NoteService } from '../../src/domain/note.service.js';
import { EditorService } from '../../src/services/editor.service.js';

vi.mock('../../src/domain/note.service.js');
vi.mock('../../src/services/editor.service.js');

describe('MandaCommand', () => {
  let command: MandaCommand;
  let mockNoteService: NoteService;
  let mockEditorService: EditorService;
  let originalMandaDir: string | undefined;

  beforeEach(() => {
    mockNoteService = new NoteService(null as any);
    mockEditorService = new EditorService();
    command = new MandaCommand(mockNoteService, mockEditorService);
    
    originalMandaDir = process.env.MANDA_DIR;
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalMandaDir !== undefined) {
      process.env.MANDA_DIR = originalMandaDir;
    } else {
      delete process.env.MANDA_DIR;
    }
  });

  test('should throw error if MANDA_DIR is not set', async () => {
    delete process.env.MANDA_DIR;

    await expect(command.execute()).rejects.toThrow('MANDA_DIR environment variable is not set');
  });

  test('should ensure notes directory exists', async () => {
    process.env.MANDA_DIR = '/test/notes';
    vi.mocked(mockNoteService.ensureNotesDirExists).mockResolvedValue(undefined);
    vi.mocked(mockNoteService.getNotePath).mockReturnValue('/test/notes/2025-11-19.md');
    vi.mocked(mockNoteService.ensureNoteExists).mockResolvedValue(undefined);
    vi.mocked(mockEditorService.openFile).mockResolvedValue(undefined);

    await command.execute();

    expect(mockNoteService.ensureNotesDirExists).toHaveBeenCalledWith('/test/notes');
  });

  test('should get note path for today', async () => {
    process.env.MANDA_DIR = '/test/notes';
    vi.mocked(mockNoteService.ensureNotesDirExists).mockResolvedValue(undefined);
    vi.mocked(mockNoteService.getNotePath).mockReturnValue('/test/notes/2025-11-19.md');
    vi.mocked(mockNoteService.ensureNoteExists).mockResolvedValue(undefined);
    vi.mocked(mockEditorService.openFile).mockResolvedValue(undefined);

    await command.execute();

    expect(mockNoteService.getNotePath).toHaveBeenCalledWith('/test/notes');
  });

  test('should ensure note file exists', async () => {
    process.env.MANDA_DIR = '/test/notes';
    vi.mocked(mockNoteService.ensureNotesDirExists).mockResolvedValue(undefined);
    vi.mocked(mockNoteService.getNotePath).mockReturnValue('/test/notes/2025-11-19.md');
    vi.mocked(mockNoteService.ensureNoteExists).mockResolvedValue(undefined);
    vi.mocked(mockEditorService.openFile).mockResolvedValue(undefined);

    await command.execute();

    expect(mockNoteService.ensureNoteExists).toHaveBeenCalledWith('/test/notes/2025-11-19.md');
  });

  test('should open note file in editor', async () => {
    process.env.MANDA_DIR = '/test/notes';
    vi.mocked(mockNoteService.ensureNotesDirExists).mockResolvedValue(undefined);
    vi.mocked(mockNoteService.getNotePath).mockReturnValue('/test/notes/2025-11-19.md');
    vi.mocked(mockNoteService.ensureNoteExists).mockResolvedValue(undefined);
    vi.mocked(mockEditorService.openFile).mockResolvedValue(undefined);

    await command.execute();

    expect(mockEditorService.openFile).toHaveBeenCalledWith('/test/notes/2025-11-19.md');
  });

  test('should execute all steps in correct order', async () => {
    process.env.MANDA_DIR = '/test/notes';
    const callOrder: string[] = [];

    vi.mocked(mockNoteService.ensureNotesDirExists).mockImplementation(async () => {
      callOrder.push('ensureNotesDirExists');
    });
    vi.mocked(mockNoteService.getNotePath).mockImplementation(() => {
      callOrder.push('getNotePath');
      return '/test/notes/2025-11-19.md';
    });
    vi.mocked(mockNoteService.ensureNoteExists).mockImplementation(async () => {
      callOrder.push('ensureNoteExists');
    });
    vi.mocked(mockEditorService.openFile).mockImplementation(async () => {
      callOrder.push('openFile');
    });

    await command.execute();

    expect(callOrder).toEqual([
      'ensureNotesDirExists',
      'getNotePath',
      'ensureNoteExists',
      'openFile',
    ]);
  });
});
