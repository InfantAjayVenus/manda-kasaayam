import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest';
import { DoCommand } from '../../src/commands/do.command.js';
import { NoteService } from '../../src/domain/note.service.js';
import { FileSystemService } from '../../src/services/file-system.service.js';
import { render } from 'ink';

vi.mock('../../src/domain/note.service.js');
vi.mock('../../src/services/file-system.service.js');
vi.mock('ink', () => ({
  render: vi.fn(),
  useStdin: vi.fn(() => ({ stdin: null, setRawMode: vi.fn() }))
}));

describe('DoCommand', () => {
  let mockNoteService: NoteService;
  let mockFileSystemService: FileSystemService;
  let originalMandaDir: string | undefined;

  beforeEach(() => {
    mockFileSystemService = new FileSystemService();
    mockNoteService = new NoteService(mockFileSystemService);

    vi.mocked(mockNoteService.ensureNotesDirExists).mockResolvedValue(undefined);
    vi.mocked(mockNoteService.getNotePath).mockReturnValue('/test/notes/2025-11-21.md');
    vi.mocked(mockNoteService.ensureNoteExists).mockResolvedValue(undefined);

    vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
    vi.mocked(mockFileSystemService.readFile).mockResolvedValue(`# Daily Tasks

## Morning Tasks
- [ ] Wake up early
- [x] Brush teeth
- [ ] Make coffee

## Work Tasks
- [ ] Review pull requests
- [x] Update documentation
- [ ] Plan sprint`);

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

    const command = new DoCommand(mockNoteService);
    await expect(command.execute()).rejects.toThrow('MANDA_DIR environment variable is not set');
  });

  test('should ensure notes directory exists', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new DoCommand(mockNoteService);
    await command.execute();

    expect(mockNoteService.ensureNotesDirExists).toHaveBeenCalledWith('/test/notes');
  });

  test('should parse tasks from markdown content', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new DoCommand(mockNoteService, mockFileSystemService);
    await command.execute();

    // Should render TaskList component with parsed tasks
    expect(render).toHaveBeenCalledWith(
      expect.any(Object), // React element
      expect.objectContaining({
        exitOnCtrlC: true,
        experimentalAlternateScreenBuffer: true
      })
    );
  });

  test('should display message when no tasks found', async () => {
    process.env.MANDA_DIR = '/test/notes';
    vi.mocked(mockFileSystemService.readFile).mockResolvedValue('# Note without tasks\n\nJust some regular content.');

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const command = new DoCommand(mockNoteService, mockFileSystemService);
    await command.execute();

    expect(consoleSpy).toHaveBeenCalledWith('No tasks found in note: /test/notes/2025-11-21.md');

    consoleSpy.mockRestore();
  });

  test('should handle yesterday option correctly', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new DoCommand(mockNoteService, mockFileSystemService);
    await command.execute({ yester: true });

    // Should check for yesterday's note
    expect(mockFileSystemService.fileExists).toHaveBeenCalledWith('/test/notes/2025-11-20.md');
  });

  test('should handle date option correctly', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new DoCommand(mockNoteService, mockFileSystemService);
    await command.execute({ date: '2025-11-15' });

    // Should check for the specific date note
    expect(mockFileSystemService.fileExists).toHaveBeenCalledWith('/test/notes/2025-11-15.md');
  });

  test('should create empty note when file does not exist', async () => {
    process.env.MANDA_DIR = '/test/notes';
    vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(false);

    const command = new DoCommand(mockNoteService, mockFileSystemService);
    await command.execute();

    // Should create the note file
    expect(mockNoteService.ensureNoteExists).toHaveBeenCalledWith('/test/notes/2025-11-21.md');
  });

  test('should parse tasks with headers correctly', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const command = new DoCommand(mockNoteService, mockFileSystemService);
    await command.execute();

    // The render should be called with TaskList component containing parsed tasks
    expect(render).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.any(Function), // TaskList component
        props: expect.objectContaining({
          tasks: expect.arrayContaining([
            expect.objectContaining({
              text: 'Wake up early',
              completed: false,
              header: 'Morning Tasks'
            }),
            expect.objectContaining({
              text: 'Brush teeth',
              completed: true,
              header: 'Morning Tasks'
            }),
            expect.objectContaining({
              text: 'Review pull requests',
              completed: false,
              header: 'Work Tasks'
            })
          ])
        })
      }),
      expect.any(Object)
    );
  });

  test('should toggle task in file correctly', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const initialContent = `# Tasks
- [ ] Task 1
- [x] Task 2
- [ ] Task 3`;

    const expectedContent = `# Tasks
- [x] Task 1
- [x] Task 2
- [ ] Task 3`;

    vi.mocked(mockFileSystemService.readFile).mockResolvedValue(initialContent);
    vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

    const command = new DoCommand(mockNoteService, mockFileSystemService);

    // Parse tasks to get task IDs
    const tasks = command['parseTasksFromMarkdown'](initialContent);
    const taskToToggle = tasks.find(t => t.text === 'Task 1');

    // Toggle the task
    await command['toggleTaskInFile']('/test/notes/2025-11-21.md', taskToToggle!.id, tasks);

    // Should read the file first
    expect(mockFileSystemService.readFile).toHaveBeenCalledWith('/test/notes/2025-11-21.md');

    // Should write the updated content
    expect(mockFileSystemService.writeFile).toHaveBeenCalledWith('/test/notes/2025-11-21.md', expectedContent);
  });

  test('should handle task toggle when task text appears multiple times', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const initialContent = `# Tasks
## Section 1
- [ ] Same task
## Section 2
- [ ] Same task`;

    const expectedContent = `# Tasks
## Section 1
- [x] Same task
## Section 2
- [ ] Same task`;

    vi.mocked(mockFileSystemService.readFile).mockResolvedValue(initialContent);
    vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

    const command = new DoCommand(mockNoteService, mockFileSystemService);

    // Parse tasks to get task IDs
    const tasks = command['parseTasksFromMarkdown'](initialContent);
    const taskToToggle = tasks.find(t => t.header === 'Section 1');

    // Toggle the first occurrence
    await command['toggleTaskInFile']('/test/notes/2025-11-21.md', taskToToggle!.id, tasks);

    // Should write the updated content with only the first task toggled
    expect(mockFileSystemService.writeFile).toHaveBeenCalledWith('/test/notes/2025-11-21.md', expectedContent);
  });

  test('should parse various task formats correctly', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const content = `# Tasks

## Work
- [x] Completed task
- [ ] Incomplete task
- [ ] Task with - dashes - in text
- [x] Task with [brackets] in text

## Personal
- [ ] Multi line
- [x] Task with trailing spaces

## No header tasks
- [ ] Task without header
`;

    const command = new DoCommand(mockNoteService, mockFileSystemService);
    const tasks = command['parseTasksFromMarkdown'](content);

    expect(tasks).toHaveLength(7);
    expect(tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: 'Completed task',
          completed: true,
          header: 'Work'
        }),
        expect.objectContaining({
          text: 'Incomplete task',
          completed: false,
          header: 'Work'
        }),
        expect.objectContaining({
          text: 'Task with - dashes - in text',
          completed: false,
          header: 'Work'
        }),
        expect.objectContaining({
          text: 'Task with [brackets] in text',
          completed: true,
          header: 'Work'
        }),
        expect.objectContaining({
          text: 'Multi line',
          completed: false,
          header: 'Personal'
        }),
        expect.objectContaining({
          text: 'Task with trailing spaces',
          completed: true,
          header: 'Personal'
        }),
        expect.objectContaining({
          text: 'Task without header',
          completed: false,
          header: 'No header tasks'
        })
      ])
    );
  });

  test('should handle malformed task syntax gracefully', async () => {
    process.env.MANDA_DIR = '/test/notes';

    const content = `# Tasks
- [x] Valid task
- [invalid] Malformed task
- [ ] Another valid task
- Not a task at all
- [ ] Valid task
`;

    const command = new DoCommand(mockNoteService, mockFileSystemService);
    const tasks = command['parseTasksFromMarkdown'](content);

    // Should only parse valid task syntax
    expect(tasks).toHaveLength(3);
    expect(tasks[0]).toEqual(
      expect.objectContaining({
        text: 'Valid task',
        completed: true
      })
    );
    expect(tasks[1]).toEqual(
      expect.objectContaining({
        text: 'Another valid task',
        completed: false
      })
    );
    expect(tasks[2]).toEqual(
      expect.objectContaining({
        text: 'Valid task',
        completed: false
      })
    );
  });
});