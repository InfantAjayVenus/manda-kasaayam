import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest';
import { MandaCommand } from '../../src/commands/manda.command.js';
import { NoteService } from '../../src/domain/note.service.js';
import { EditorService } from '../../src/services/editor.service.js';
import { GitService } from '../../src/services/git.service.js';

vi.mock('../../src/domain/note.service.js');
vi.mock('../../src/services/editor.service.js');
vi.mock('../../src/services/git.service.js');

describe('MandaCommand', () => {
  let command: MandaCommand;
  let mockNoteService: NoteService;
  let mockEditorService: EditorService;
  let mockGitService: GitService;
  let originalMandaDir: string | undefined;

  beforeEach(() => {
    mockNoteService = new NoteService(null as any);
    mockEditorService = new EditorService();
    mockGitService = new GitService();
    command = new MandaCommand(mockNoteService, mockEditorService, mockGitService);

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

  test('should append timestamp link to note', async () => {
    process.env.MANDA_DIR = '/test/notes';
    vi.mocked(mockNoteService.ensureNotesDirExists).mockResolvedValue(undefined);
    vi.mocked(mockNoteService.getNotePath).mockReturnValue('/test/notes/2025-11-19.md');
    vi.mocked(mockNoteService.ensureNoteExists).mockResolvedValue(undefined);
    vi.mocked(mockNoteService.appendTimestampLink).mockResolvedValue(undefined);
    vi.mocked(mockEditorService.openFile).mockResolvedValue(undefined);

    await command.execute();

    expect(mockNoteService.appendTimestampLink).toHaveBeenCalledWith('/test/notes/2025-11-19.md');
  });

  test('should read file content before and after editing', async () => {
    process.env.MANDA_DIR = '/test/notes';
    vi.mocked(mockNoteService.ensureNotesDirExists).mockResolvedValue(undefined);
    vi.mocked(mockNoteService.getNotePath).mockReturnValue('/test/notes/2025-11-19.md');
    vi.mocked(mockNoteService.ensureNoteExists).mockResolvedValue(undefined);
    vi.mocked(mockNoteService.readFileContent).mockResolvedValue('# Note\n[10:30]');
    vi.mocked(mockNoteService.appendTimestampLink).mockResolvedValue(undefined);
    vi.mocked(mockEditorService.openFile).mockResolvedValue(undefined);
    vi.mocked(mockNoteService.postProcessAfterEdit).mockResolvedValue(undefined);

    await command.execute();

    // Verify that readFileContent is called twice - once before editing, once after
    expect(mockNoteService.readFileContent).toHaveBeenCalledTimes(2);
    expect(mockNoteService.readFileContent).toHaveBeenCalledWith('/test/notes/2025-11-19.md');
  });

  test('should commit and push changes after editing', async () => {
    process.env.MANDA_DIR = '/test/notes';
    vi.mocked(mockNoteService.ensureNotesDirExists).mockResolvedValue(undefined);
    vi.mocked(mockNoteService.getNotePath).mockReturnValue('/test/notes/2025-11-19.md');
    vi.mocked(mockNoteService.ensureNoteExists).mockResolvedValue(undefined);
    vi.mocked(mockNoteService.readFileContent).mockResolvedValue('# Note\n[10:30]');
    vi.mocked(mockNoteService.appendTimestampLink).mockResolvedValue(undefined);
    vi.mocked(mockEditorService.openFile).mockResolvedValue(undefined);
    vi.mocked(mockNoteService.postProcessAfterEdit).mockResolvedValue(undefined);
    vi.mocked(mockGitService.getCurrentTimestampCommitMessage).mockReturnValue('2025-11-19 10:30:00');
    vi.mocked(mockGitService.commitAndPush).mockResolvedValue(undefined);

    await command.execute();

    expect(mockGitService.getCurrentTimestampCommitMessage).toHaveBeenCalled();
    expect(mockGitService.commitAndPush).toHaveBeenCalledWith('/test/notes/2025-11-19.md', '2025-11-19 10:30:00');
  });
});
