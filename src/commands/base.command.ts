import { NoteService } from '../domain/note.service.js';
import { FileSystemService } from '../services/file-system.service.js';

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
      throw new Error('MANDA_DIR environment variable is not set');
    }

    await this.noteService.ensureNotesDirExists(notesDir);

    const notePath = this.noteService.getNotePath(notesDir);
    await this.noteService.ensureNoteExists(notePath);

    return notePath;
  }

  abstract execute(...args: any[]): Promise<void> | void;
}