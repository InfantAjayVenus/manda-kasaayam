import { NoteService } from '../domain/note.service.js';
import { EditorService } from '../services/editor.service.js';
import { FileSystemService } from '../services/file-system.service.js';

export class MandaCommand {
  private noteService: NoteService;
  private editorService: EditorService;

  constructor(
    noteService?: NoteService,
    editorService?: EditorService
  ) {
    const fileSystemService = new FileSystemService();
    this.noteService = noteService || new NoteService(fileSystemService);
    this.editorService = editorService || new EditorService();
  }

  async execute(): Promise<void> {
    const notesDir = process.env.MANDA_DIR;
    
    if (!notesDir) {
      throw new Error('MANDA_DIR environment variable is not set');
    }

    await this.noteService.ensureNotesDirExists(notesDir);
    
    const notePath = this.noteService.getNotePath(notesDir);
    await this.noteService.ensureNoteExists(notePath);
    
    // Store the content before opening editor to compare later
    const contentBeforeEdit = await this.noteService.readFileContent(notePath);
    
    // Append timestamp link to today's note
    await this.noteService.appendTimestampLink(notePath);
    
    // Open editor for user to edit
    await this.editorService.openFile(notePath);
    
    // After editor closes, check if content was added below latest timestamp
    const contentAfterEdit = await this.noteService.readFileContent(notePath);
    await this.noteService.postProcessAfterEdit(notePath, contentBeforeEdit, contentAfterEdit);
  }
}
