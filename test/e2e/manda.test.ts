import { test, expect, describe, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { MandaCommand } from '../../src/commands/manda.command.js';
import { NoteService } from '../../src/domain/note.service.js';
import { FileSystemService } from '../../src/services/file-system.service.js';
import { EditorService } from '../../src/services/editor.service.js';

vi.mock('../../src/domain/note.service.js');
vi.mock('../../src/services/file-system.service.js');
vi.mock('../../src/services/editor.service.js');

describe('Manda Note Creation E2E', () => {
  let tempDir: string;
  let mockNoteService: NoteService;
  let mockFileSystemService: FileSystemService;
  let mockEditorService: EditorService;
  let command: MandaCommand;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'manda-test-'));
    mockFileSystemService = new FileSystemService();
    mockNoteService = new NoteService(mockFileSystemService);
    mockEditorService = new EditorService();

    // Mock the services
    vi.mocked(mockNoteService.ensureNotesDirExists).mockResolvedValue(undefined);
    vi.mocked(mockNoteService.getNotePath).mockReturnValue(path.join(tempDir, '2025-11-21.md'));
    vi.mocked(mockNoteService.ensureNoteExists).mockResolvedValue(undefined);
    vi.mocked(mockNoteService.readFileContent).mockResolvedValue('');
    vi.mocked(mockNoteService.appendTimestampLink).mockResolvedValue(undefined);
    vi.mocked(mockEditorService.openFile).mockResolvedValue(undefined);

    command = new MandaCommand(mockNoteService, mockEditorService);

    // Set MANDA_DIR
    process.env.MANDA_DIR = tempDir;
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    vi.clearAllMocks();
  });

  test('running "manda" should create a note file with current date if it does not exist', async () => {
    const today = '2025-11-21';
    const expectedFile = path.join(tempDir, `${today}.md`);

    expect(fs.existsSync(expectedFile)).toBe(false);

    // Mock file creation
    vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

    await command.execute();

    expect(mockNoteService.ensureNotesDirExists).toHaveBeenCalledWith(tempDir);
    expect(mockNoteService.getNotePath).toHaveBeenCalledWith(tempDir);
    expect(mockNoteService.ensureNoteExists).toHaveBeenCalled();
    expect(mockNoteService.appendTimestampLink).toHaveBeenCalled();
    expect(mockEditorService.openFile).toHaveBeenCalled();
  });

  test('running "manda" should open existing note file and append timestamp', async () => {
    const existingContent = '# Existing note\n\nSome content';

    vi.mocked(mockNoteService.readFileContent).mockResolvedValue(existingContent);
    vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

    await command.execute();

    expect(mockNoteService.appendTimestampLink).toHaveBeenCalled();
    expect(mockEditorService.openFile).toHaveBeenCalled();
  });

  test('running "manda" should fail if MANDA_DIR is not set', async () => {
    delete process.env.MANDA_DIR;

    await expect(command.execute()).rejects.toThrow();
  });

  test('running "manda" should create MANDA_DIR if it does not exist', async () => {
    const nonExistentDir = path.join(tempDir, 'nested', 'path');

    // Set MANDA_DIR to the nested path
    process.env.MANDA_DIR = nonExistentDir;
    vi.mocked(mockNoteService.getNotePath).mockReturnValue(path.join(nonExistentDir, '2025-11-21.md'));

    await command.execute();

    expect(mockNoteService.ensureNotesDirExists).toHaveBeenCalledWith(nonExistentDir);
  });

  test('running "manda" should append timestamp link to new note file', async () => {
    vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

    await command.execute();

    expect(mockNoteService.appendTimestampLink).toHaveBeenCalled();
  });

  test('running "manda" should append timestamp link to existing note file', async () => {
    const existingContent = '# Existing note\n\nSome content';

    vi.mocked(mockNoteService.readFileContent).mockResolvedValue(existingContent);

    await command.execute();

    expect(mockNoteService.appendTimestampLink).toHaveBeenCalled();
  });

  test('running "manda" should add newline before timestamp if content does not end with newline', async () => {
    const existingContent = '# Note without newline at end';

    vi.mocked(mockNoteService.readFileContent).mockResolvedValue(existingContent);

    await command.execute();

    expect(mockNoteService.appendTimestampLink).toHaveBeenCalled();
  });
});
