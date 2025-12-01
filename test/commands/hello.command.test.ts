import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest';
import { HelloCommand } from '../../src/commands/hello.command.js';
import { NoteService } from '../../src/domain/note.service.js';
import * as ink from 'ink';

vi.mock('ink', async () => {
  const actual = await vi.importActual('ink');
  return {
    ...actual,
    render: vi.fn(() => ({ unmount: vi.fn(), waitUntilExit: vi.fn() })),
  };
});

vi.mock('../../src/domain/note.service.js');

describe('HelloCommand', () => {
  let renderSpy: any;
  let mockNoteService: NoteService;
  let originalMandaDir: string | undefined;

  beforeEach(() => {
    renderSpy = vi.mocked(ink.render);
    renderSpy.mockClear();

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

    const command = new HelloCommand(mockNoteService);
    await expect(command.execute({})).rejects.toThrow('MANDA_DIR environment variable is not set');
  });

  test('should ensure notes directory exists', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new HelloCommand(mockNoteService);
    await command.execute({});

    expect(mockNoteService.ensureNotesDirExists).toHaveBeenCalledWith('/test/notes');
  });

  test('should get note path for today', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new HelloCommand(mockNoteService);
    await command.execute({});

    expect(mockNoteService.getNotePath).toHaveBeenCalledWith('/test/notes');
  });

  test('should ensure note file exists', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new HelloCommand(mockNoteService);
    await command.execute({});

    expect(mockNoteService.ensureNoteExists).toHaveBeenCalledWith('/test/notes/2025-11-19.md');
  });

  test('should render Hello component with default name', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new HelloCommand(mockNoteService);
    await command.execute({});

    expect(renderSpy).toHaveBeenCalledTimes(1);
    const callArgs = renderSpy.mock.calls[0][0];
    expect(callArgs.type.name).toBe('Hello');
    expect(callArgs.props.name).toBeUndefined();
  });

  test('should render Hello component with provided name', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new HelloCommand(mockNoteService);
    await command.execute({ name: 'Alice' });

    expect(renderSpy).toHaveBeenCalledTimes(1);
    const callArgs = renderSpy.mock.calls[0][0];
    expect(callArgs.type.name).toBe('Hello');
    expect(callArgs.props.name).toBe('Alice');
  });
});
