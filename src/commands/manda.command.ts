import { NoteService } from '../domain/note.service.js';
import { EditorService } from '../services/editor.service.js';
import { GitService } from '../services/git.service.js';
import { BaseCommand } from './base.command.js';

export class MandaCommand extends BaseCommand {
  private editorService: EditorService;
  private gitService: GitService;

  constructor(
    noteService?: NoteService,
    editorService?: EditorService,
    gitService?: GitService,
  ) {
    super(noteService);
    this.editorService = editorService || new EditorService();
    this.gitService = gitService || new GitService();
  }

  async execute(): Promise<void> {
    const notePath = await this.ensureTodaysNoteExists();

    // Store the content before opening editor to compare later
    const contentBeforeEdit = await this.noteService.readFileContent(notePath);

    // Append timestamp link to today's note
    await this.noteService.appendTimestampLink(notePath);

    // Open editor for user to edit
    await this.editorService.openFile(notePath);

    // After editor closes, check if content was added below latest timestamp
    const contentAfterEdit = await this.noteService.readFileContent(notePath);
    await this.noteService.postProcessAfterEdit(notePath, contentBeforeEdit, contentAfterEdit);

    // Commit and push changes to git
    const commitMessage = this.gitService.getCurrentTimestampCommitMessage();
    await this.gitService.commitAndPush(notePath, commitMessage);
  }
}
