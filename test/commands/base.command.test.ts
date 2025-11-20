import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest';
import { BaseCommand } from '../../src/commands/base.command.js';
import { NoteService } from '../../src/domain/note.service.js';

vi.mock('../../src/domain/note.service.js');

class TestCommand extends BaseCommand {
  public async execute(): Promise<void> {
    // Test implementation
    await this.ensureTodaysNoteExists();
  }
}

describe('BaseCommand', () => {
  let mockNoteService: NoteService;
  let originalMandaDir: string | undefined;

  beforeEach(() => {
    mockNoteService = new NoteService(null as any);
    vi.mocked(mockNoteService.ensureNotesDirExists).mockResolvedValue(undefined);
    vi.mocked(mockNoteService.getNotePath).mockReturnValue('/test/notes/2025-11-19.md');
    vi.mocked(mockNoteService.ensureNoteExists).mockResolvedValue(undefined);

    originalMandaDir = process.env.MANDA_DIR;
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (originalMandaDir !== undefined) {
      process.env.MANDA_DIR = originalMandaDir;
    } else {
      delete process.env.MANDA_DIR;
    }
  });

  test('should throw error if MANDA_DIR is not set', async () => {
    delete process.env.MANDA_DIR;

    const command = new TestCommand(mockNoteService);
    await expect(command.execute()).rejects.toThrow('MANDA_DIR environment variable is not set');
  });

  test('should ensure notes directory exists', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new TestCommand(mockNoteService);
    await command.execute();

    expect(mockNoteService.ensureNotesDirExists).toHaveBeenCalledWith('/test/notes');
  });

  test('should get note path for today', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new TestCommand(mockNoteService);
    await command.execute();

    expect(mockNoteService.getNotePath).toHaveBeenCalledWith('/test/notes');
  });

  test('should ensure note file exists', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new TestCommand(mockNoteService);
    await command.execute();

    expect(mockNoteService.ensureNoteExists).toHaveBeenCalledWith('/test/notes/2025-11-19.md');
  });

  test('should return the note path from ensureTodaysNoteExists', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new TestCommand(mockNoteService);
    const notePath = await (command as any).ensureTodaysNoteExists();

    expect(notePath).toBe('/test/notes/2025-11-19.md');
  });
});