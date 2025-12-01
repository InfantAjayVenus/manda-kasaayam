import { NoteService } from '../domain/note.service.js';
import { FileSystemService } from '../services/file-system.service.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { ErrorSeverity } from '../errors/index.js';

export abstract class BaseCommand {
  protected noteService: NoteService;

  constructor(noteService?: NoteService) {
    if (noteService) {
      this.noteService = noteService;
    } else {
      const fileSystemService = new FileSystemService();
      this.noteService = new NoteService(fileSystemService);
    }
  }

  protected async ensureTodaysNoteExists(): Promise<string> {
    const notesDir = process.env.MANDA_DIR;

    if (!notesDir) {
      throw ErrorHandler.handle(
        new Error('MANDA_DIR environment variable is not set'),
        {
          operation: 'configuration',
          userAction: 'environment setup',
          field: 'MANDA_DIR',
        },
        ErrorSeverity.HIGH,
      );
    }

    await this.noteService.ensureNotesDirExists(notesDir);

    const notePath = this.noteService.getNotePath(notesDir);
    await this.noteService.ensureNoteExists(notePath);

    return notePath;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract execute(...args: any[]): Promise<void> | void;
}
