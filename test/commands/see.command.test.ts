import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest';
import { SeeCommand } from '../../src/commands/see.command.js';
import { NoteService } from '../../src/domain/note.service.js';
import { FileSystemService } from '../../src/services/file-system.service.js';
import { render } from 'ink';

vi.mock('../../src/domain/note.service.js');
vi.mock('../../src/services/file-system.service.js');
vi.mock('ink', () => ({
  render: vi.fn(),
  useStdin: vi.fn(() => ({ stdin: null, setRawMode: vi.fn() }))
}));

// Mock process.stdout.write
const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

describe('SeeCommand', () => {
  let mockNoteService: NoteService;
  let mockFileSystemService: FileSystemService;
  let originalMandaDir: string | undefined;

  beforeEach(() => {
    mockFileSystemService = new FileSystemService();
    mockNoteService = new NoteService(mockFileSystemService);

    vi.mocked(mockNoteService.ensureNotesDirExists).mockResolvedValue(undefined);
    vi.mocked(mockNoteService.getNotePath).mockReturnValue('/test/notes/2025-11-19.md');
    vi.mocked(mockNoteService.ensureNoteExists).mockResolvedValue(undefined);

    vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
    vi.mocked(mockFileSystemService.readFile).mockResolvedValue('# Test Note\n\nSome content here.');

    vi.mocked(render).mockImplementation((element: any) => {
      // Simulate calling onExit after a short delay to resolve the promise
      if (element?.props?.onExit) {
        setTimeout(() => element.props.onExit(), 10);
      }
      return {
        waitUntilExit: vi.fn().mockResolvedValue(undefined)
      } as any;
    });

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

    const command = new SeeCommand(mockNoteService);
    await expect(command.execute()).rejects.toThrow('MANDA_DIR environment variable is not set');
  });

  test('should ensure notes directory exists', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new SeeCommand(mockNoteService);
    await command.execute();

    expect(mockNoteService.ensureNotesDirExists).toHaveBeenCalledWith('/test/notes');
  });

  test('should ensure note file exists', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new SeeCommand(mockNoteService);
    await command.execute();

    expect(mockNoteService.ensureNoteExists).toHaveBeenCalledWith('/test/notes/2025-11-19.md');
  });

  test('should check if note file exists', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new SeeCommand(mockNoteService, mockFileSystemService);
    await command.execute();

    expect(mockFileSystemService.fileExists).toHaveBeenCalledWith('/test/notes/2025-11-19.md');
  });

  test('should read note content', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new SeeCommand(mockNoteService, mockFileSystemService);
    await command.execute();

    expect(mockFileSystemService.readFile).toHaveBeenCalledWith('/test/notes/2025-11-19.md');
  });

  test('should display message when note file does not exist', async () => {
    process.env.MANDA_DIR = '/test/notes';
    vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(false);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const command = new SeeCommand(mockNoteService, mockFileSystemService);
    await command.execute();

    expect(consoleSpy).toHaveBeenCalledWith('Note file does not exist: /test/notes/2025-11-19.md');

    consoleSpy.mockRestore();
  });

  test('should render markdown content using TUI component', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new SeeCommand(mockNoteService, mockFileSystemService);
    await command.execute();

    // Should render MarkdownPreview component with content
    expect(render).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.any(Function),
        props: expect.objectContaining({
          content: '# Test Note\n\nSome content here.',
          title: '2025-11-19',
          onExit: expect.any(Function)
        })
      }),
      expect.objectContaining({
        exitOnCtrlC: true
      })
    );
  });

  test('should render yesterday\'s note with correct title', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new SeeCommand(mockNoteService, mockFileSystemService);
    const getYesterdayPathSpy = vi.spyOn(command as any, 'getYesterdayNotePath')
      .mockReturnValue('/test/notes/2025-11-18.md');

    await command.execute({ yester: true });

    // Should render with yesterday's date as title
    expect(render).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          content: '# Test Note\n\nSome content here.',
          title: '2025-11-18',
          onExit: expect.any(Function)
        })
      }),
      expect.objectContaining({
        exitOnCtrlC: true
      })
    );

    getYesterdayPathSpy.mockRestore();
  });

  test('should wait for TUI rendering to complete', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new SeeCommand(mockNoteService, mockFileSystemService);
    await command.execute();

    // Test passes if execute completes without throwing
    expect(true).toBe(true);
  });

  test('should render yesterday\'s note with correct title', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new SeeCommand(mockNoteService, mockFileSystemService);
    const getYesterdayPathSpy = vi.spyOn(command as any, 'getYesterdayNotePath')
      .mockReturnValue('/test/notes/2025-11-18.md');

    await command.execute({ yester: true });

    // Should render with yesterday's date as title
    expect(render).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          content: '# Test Note\n\nSome content here.',
          title: '2025-11-18',
          onExit: expect.any(Function)
        })
      }),
      expect.objectContaining({
        exitOnCtrlC: true
      })
    );

    getYesterdayPathSpy.mockRestore();
  });

  test('should wait for TUI rendering to complete', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new SeeCommand(mockNoteService, mockFileSystemService);
    await command.execute();

    // Test passes if execute completes without throwing
    expect(true).toBe(true);
  });

  test('should display yesterday\'s note when --yester option is used', async () => {
    process.env.MANDA_DIR = '/test/notes';

    // Mock getYesterdayNotePath to return a predictable path
    const command = new SeeCommand(mockNoteService, mockFileSystemService);
    const getYesterdayPathSpy = vi.spyOn(command as any, 'getYesterdayNotePath')
      .mockReturnValue('/test/notes/2025-11-18.md');

    await command.execute({ yester: true });

    // Now it should check for yesterday's note
    expect(mockFileSystemService.fileExists).toHaveBeenCalledWith('/test/notes/2025-11-18.md');
    expect(mockFileSystemService.readFile).toHaveBeenCalledWith('/test/notes/2025-11-18.md');

    getYesterdayPathSpy.mockRestore();
  });
});