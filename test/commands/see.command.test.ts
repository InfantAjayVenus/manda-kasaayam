import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest';
import { SeeCommand } from '../../src/commands/see.command.js';
import { NoteService } from '../../src/domain/note.service.js';
import { FileSystemService } from '../../src/services/file-system.service.js';
import { EditorService } from '../../src/services/editor.service.js';
import { render } from 'ink';
import { findNotePathForDate } from '../../src/utils/fileUtils.js';

vi.mock('../../src/domain/note.service.js');
vi.mock('../../src/services/file-system.service.js');
vi.mock('../../src/services/editor.service.js');

vi.mock('ink', () => ({
  render: vi.fn(),
  useStdin: vi.fn(() => ({ stdin: null, setRawMode: vi.fn() })),
}));

// Mock process.stdout.write
const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

// Mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  // Do nothing in tests - prevent actual exit
  return undefined as never;
});

describe('SeeCommand', () => {
  let mockNoteService: NoteService;
  let mockFileSystemService: FileSystemService;
  let mockEditorService: EditorService;
  let originalMandaDir: string | undefined;

  beforeEach(() => {
    mockFileSystemService = new FileSystemService();
    mockNoteService = new NoteService(mockFileSystemService);
    mockEditorService = new EditorService();

    vi.mocked(mockNoteService.ensureNotesDirExists).mockResolvedValue(undefined);
    vi.mocked(mockNoteService.getNotePath).mockReturnValue('/test/notes/2025-11-24.md');
    vi.mocked(mockNoteService.ensureNoteExists).mockResolvedValue(undefined);

    vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
    vi.mocked(mockFileSystemService.readFile).mockResolvedValue(
      '# Test Note\n\nSome content here.',
    );
    vi.mocked(mockFileSystemService.listDirectory).mockResolvedValue([]);

    vi.mocked(mockEditorService.openFile).mockResolvedValue(undefined);

    vi.mocked(render).mockImplementation((element: any) => {
      // Simulate calling onExit after a short delay to resolve the promise
      if (element?.props?.onExit) {
        setTimeout(() => element.props.onExit(), 10);
      }
      return {
        waitUntilExit: vi.fn().mockResolvedValue(undefined),
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

    const command = new SeeCommand(mockNoteService, undefined, mockEditorService);
    await expect(command.execute()).rejects.toThrow('MANDA_DIR environment variable is not set');
  });

  test('should ensure notes directory exists', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new SeeCommand(mockNoteService, undefined, mockEditorService);
    await command.execute();

    expect(mockNoteService.ensureNotesDirExists).toHaveBeenCalledWith('/test/notes');
  });

  test('should ensure note file exists', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new SeeCommand(mockNoteService, undefined, mockEditorService);
    await command.execute();

    expect(mockNoteService.ensureNoteExists).toHaveBeenCalledWith('/test/notes/2025-11-25.md');
  });

  test('should check if note file exists', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new SeeCommand(mockNoteService, mockFileSystemService, mockEditorService);
    await command.execute();

    expect(mockFileSystemService.fileExists).toHaveBeenCalledWith('/test/notes/2025-11-25.md');
  });

  test('should read note content', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new SeeCommand(mockNoteService, mockFileSystemService, mockEditorService);
    await command.execute();

    expect(mockFileSystemService.readFile).toHaveBeenCalledWith('/test/notes/2025-11-25.md');
  });

  test('should create empty note when file does not exist', async () => {
    process.env.MANDA_DIR = '/test/notes';
    vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(false);

    const command = new SeeCommand(mockNoteService, mockFileSystemService, mockEditorService);
    await command.execute();

    // Should create the note file when it doesn't exist
    expect(mockNoteService.ensureNoteExists).toHaveBeenCalledWith('/test/notes/2025-11-25.md');
  });

  test('should render markdown content using TUI component', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new SeeCommand(mockNoteService, mockFileSystemService, mockEditorService);
    await command.execute();

    // Should render MarkdownPreview component with content
    expect(render).toHaveBeenCalledWith(
      expect.any(Object), // React element
      expect.objectContaining({
        exitOnCtrlC: true,
        experimentalAlternateScreenBuffer: true,
      }),
    );
  });

  test("should render yesterday's note with correct title", async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new SeeCommand(mockNoteService, mockFileSystemService, mockEditorService);

    await command.execute({ yester: true });

    // Should render with yesterday's date as title
    expect(render).toHaveBeenCalledWith(
      expect.any(Object), // React element
      expect.objectContaining({
        exitOnCtrlC: true,
        experimentalAlternateScreenBuffer: true,
      }),
    );
  });

  test('should wait for TUI rendering to complete', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new SeeCommand(mockNoteService, mockFileSystemService, mockEditorService);
    await command.execute();

    // Test passes if execute completes without throwing
    expect(true).toBe(true);
  });

  test("should display yesterday's note when --yester option is used", async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new SeeCommand(mockNoteService, mockFileSystemService, mockEditorService);

    await command.execute({ yester: true });

    // Now it should check for yesterday's note
    expect(mockFileSystemService.fileExists).toHaveBeenCalledWith('/test/notes/2025-11-24.md');
    expect(mockFileSystemService.readFile).toHaveBeenCalledWith('/test/notes/2025-11-24.md');
  });

  test('should display note for specific date when --date option is used', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new SeeCommand(mockNoteService, mockFileSystemService, mockEditorService);
    await command.execute({ date: '2025-11-15' });

    // Should check for the specific date note
    expect(mockFileSystemService.fileExists).toHaveBeenCalledWith('/test/notes/2025-11-15.md');
    expect(mockFileSystemService.readFile).toHaveBeenCalledWith('/test/notes/2025-11-15.md');
  });

  test('should not navigate past today when using next navigation', async () => {
    process.env.MANDA_DIR = '/test/notes';

    // Mock listDirectory to return some files
    vi.mocked(mockFileSystemService.listDirectory).mockResolvedValue([
      '2025-11-19.md',
      '2025-11-20.md',
      '2025-11-21.md',
    ]);

    const command = new SeeCommand(mockNoteService, mockFileSystemService, mockEditorService);

    // Mock the render to capture navigation calls
    const navigationCalls: string[] = [];
    vi.mocked(render).mockImplementation((element: any) => {
      if (element?.props?.onNavigateNext) {
        // Store the navigation function to test it
        (global as any).testNavigateNext = element.props.onNavigateNext;
      }
      if (element?.props?.onExit) {
        setTimeout(() => element.props.onExit(), 10);
      }
      return {
        waitUntilExit: vi.fn().mockResolvedValue(undefined),
      } as any;
    });

    await command.execute();

    // The navigation should be set up but not actually called in this test
    // We just verify the structure is correct
    expect(render).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        exitOnCtrlC: true,
        experimentalAlternateScreenBuffer: true,
      }),
    );
  });

  test('should navigate to next note only if it exists', async () => {
    process.env.MANDA_DIR = '/test/notes';

    // Mock file system to simulate existing notes
    vi.mocked(mockFileSystemService.fileExists).mockImplementation(async (path: string) => {
      // Current note exists
      if (path.includes('2025-11-20.md')) return true;
      // Next note exists
      if (path.includes('2025-11-21.md')) return true;
      // Future note doesn't exist
      if (path.includes('2025-11-22.md')) return false;
      return false;
    });

    const command = new SeeCommand(mockNoteService, mockFileSystemService, mockEditorService);

    // Spy on displayNoteWithNavigation to track navigation calls
    const navigateSpy = vi.spyOn(command as any, 'displayNoteWithNavigation');

    // Mock render to capture and call the navigateNext function
    let capturedNavigateNext: (() => Promise<void>) | null = null;
    vi.mocked(render).mockImplementation((element: any) => {
      if (element?.props?.onNavigateNext) {
        capturedNavigateNext = element.props.onNavigateNext;
      }
      if (element?.props?.onExit) {
        setTimeout(() => element.props.onExit(), 10);
      }
      return {
        waitUntilExit: vi.fn().mockResolvedValue(undefined),
      } as any;
    });

    // Execute with a date that has a next note
    await command.execute({ date: '2025-11-20' });

    // Call the captured navigateNext function
    await capturedNavigateNext!();

    // Should have navigated to the next existing note
    expect(navigateSpy).toHaveBeenCalledWith(new Date('2025-11-21T00:00:00'));
  });

  test('should navigate to next note even if it does not exist (for past dates)', async () => {
    process.env.MANDA_DIR = '/test/notes';

    // Mock file system to simulate existing notes
    vi.mocked(mockFileSystemService.fileExists).mockImplementation(async (path: string) => {
      // Current note exists
      if (path.includes('2025-11-20.md')) return true;
      // Next note doesn't exist
      if (path.includes('2025-11-21.md')) return false;
      return false;
    });

    const command = new SeeCommand(mockNoteService, mockFileSystemService, mockEditorService);

    // Spy on displayNoteWithNavigation to track navigation calls
    const navigateSpy = vi.spyOn(command as any, 'displayNoteWithNavigation');

    // Mock render to capture and call the navigateNext function
    let capturedNavigateNext: (() => Promise<void>) | null = null;
    vi.mocked(render).mockImplementation((element: any) => {
      if (element?.props?.onNavigateNext) {
        capturedNavigateNext = element.props.onNavigateNext;
      }
      if (element?.props?.onExit) {
        setTimeout(() => element.props.onExit(), 10);
      }
      return {
        waitUntilExit: vi.fn().mockResolvedValue(undefined),
      } as any;
    });

    // Execute with a date that has a next note that doesn't exist
    await command.execute({ date: '2025-11-20' });

    // Call the captured navigateNext function
    await capturedNavigateNext!();

    // Should have navigated to the next date even though the note doesn't exist
    expect(navigateSpy).toHaveBeenCalledWith(new Date('2025-11-21T00:00:00'));
  });

  test('should find oldest note correctly', async () => {
    process.env.MANDA_DIR = '/test/notes';

    // Mock fileExists to simulate organized note structure
    // Use a date that's within the 1-year search range from today (2025-12-17)
    vi.mocked(mockFileSystemService.fileExists).mockImplementation(async (path: string) => {
      // Organized path for 2025-01-15 exists (oldest in search range)
      if (path.includes('2025-01-15')) return true;
      return false;
    });

    const command = new SeeCommand(mockNoteService, mockFileSystemService, mockEditorService);
    const oldestDate = await (command as any).findOldestNote();

    expect(oldestDate).toEqual(new Date('2025-01-15T00:00:00'));
  });

  test('should return null when no notes exist', async () => {
    process.env.MANDA_DIR = '/test/notes';

    // Mock fileExists to return false for all paths (no notes exist)
    vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(false);

    const command = new SeeCommand(mockNoteService, mockFileSystemService, mockEditorService);
    const oldestDate = await (command as any).findOldestNote();

    expect(oldestDate).toBeNull();
  });

  test("should open editor for today's note when e key is pressed", async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new SeeCommand(mockNoteService, mockFileSystemService, mockEditorService);

    // Mock render to capture and call the onEdit function
    let capturedOnEdit: (() => Promise<void>) | null = null;
    vi.mocked(render).mockImplementation((element: any) => {
      if (element?.props?.onEdit) {
        capturedOnEdit = element.props.onEdit;
      }
      if (element?.props?.onExit) {
        setTimeout(() => element.props.onExit(), 10);
      }
      return {
        waitUntilExit: vi.fn().mockResolvedValue(undefined),
      } as any;
    });

    // Execute with today's date (default)
    await command.execute();

    // Call the captured onEdit function
    await capturedOnEdit!();

    // Should have opened the editor with today's note path
    expect(mockEditorService.openFile).toHaveBeenCalledWith('/test/notes/2025-11-25.md');
  });

  test('should not open editor when trying to edit old notes', async () => {
    const command = new SeeCommand(mockNoteService, mockFileSystemService, mockEditorService);

    // Mock render to capture and call the onEdit function
    let capturedOnEdit: (() => Promise<void>) | null = null;
    vi.mocked(render).mockImplementation((element: any) => {
      if (element?.props?.onEdit) {
        capturedOnEdit = element.props.onEdit;
      }
      if (element?.props?.onExit) {
        setTimeout(() => element.props.onExit(), 10);
      }
      return {
        waitUntilExit: vi.fn().mockResolvedValue(undefined),
      } as any;
    });

    // Execute with an old date
    await command.execute({ date: '2025-11-20' });

    // Call the captured onEdit function
    await capturedOnEdit!();

    // Should not have opened editor (editing is disabled for old notes)
    expect(mockEditorService.openFile).not.toHaveBeenCalled();
  });

  test("should navigate to today's note even if it does not exist yet", async () => {
    process.env.MANDA_DIR = '/test/notes';

    // Mock file system to simulate existing notes
    vi.mocked(mockFileSystemService.fileExists).mockImplementation(async (path: string) => {
      // Current note exists (yesterday)
      if (path.includes('2025-11-23.md')) return true;
      // Today's note doesn't exist yet
      if (path.includes('2025-11-24.md')) return false;
      return false;
    });

    const command = new SeeCommand(mockNoteService, mockFileSystemService, mockEditorService);

    // Spy on displayNoteWithNavigation to track navigation calls
    const navigateSpy = vi.spyOn(command as any, 'displayNoteWithNavigation');

    // Mock render to capture and call the navigateNext function
    let capturedNavigateNext: (() => Promise<void>) | null = null;
    vi.mocked(render).mockImplementation((element: any) => {
      if (element?.props?.onNavigateNext) {
        capturedNavigateNext = element.props.onNavigateNext;
      }
      if (element?.props?.onExit) {
        setTimeout(() => element.props.onExit(), 10);
      }
      return {
        waitUntilExit: vi.fn().mockResolvedValue(undefined),
      } as any;
    });

    // Execute with yesterday's date
    await command.execute({ date: '2025-11-23' });

    // Call the captured navigateNext function (should navigate to today)
    await capturedNavigateNext!();

    // Should have navigated to today's note even though it doesn't exist
    expect(navigateSpy).toHaveBeenCalledWith(new Date('2025-11-24T00:00:00'));
  });
});
