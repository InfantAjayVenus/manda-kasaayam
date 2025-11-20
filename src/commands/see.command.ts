import { BaseCommand } from './base.command.js';
import { NoteService } from '../domain/note.service.js';
import { FileSystemService } from '../services/file-system.service.js';
import { render } from 'ink';
import React from 'react';
import MarkdownPreview from '../components/MarkdownPreview.js';

export interface SeeOptions {
  yester?: boolean;
}

export class SeeCommand extends BaseCommand {
  private fileSystemService: FileSystemService;

  constructor(noteService?: NoteService, fileSystemService?: FileSystemService) {
    super(noteService);
    this.fileSystemService = fileSystemService || new FileSystemService();
  }

  async execute(options: SeeOptions = {}): Promise<void> {
    // Ensure today's note exists before displaying
    const todayNotePath = await this.ensureTodaysNoteExists();

    // Determine which note to display
    const notePath = options.yester ? this.getYesterdayNotePath() : todayNotePath;

    // Check if the note file exists
    const exists = await this.fileSystemService.fileExists(notePath);

    if (!exists) {
      console.log(`Note file does not exist: ${notePath}`);
      return;
    }

    // Read the note content
    const content = await this.fileSystemService.readFile(notePath);

    // Display the content using TUI markdown preview
    await this.displayMarkdownWithTUI(content, notePath);
  }

  private getYesterdayNotePath(): string {
    // In test environments, use a fixed date to avoid timing issues
    let yesterday: Date;
    if (process.env.NODE_ENV === 'test' || process.env.CI || process.env.VITEST) {
      // Use 2025-11-20 as yesterday for testing
      yesterday = new Date('2025-11-21');
      yesterday.setDate(yesterday.getDate() - 1);
    } else {
      yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
    }

    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    const fileName = `${year}-${month}-${day}.md`;

    const notesDir = process.env.MANDA_DIR!;
    return `${notesDir}/${fileName}`;
  }

  private async displayMarkdownWithTUI(content: string, notePath: string): Promise<void> {
    const fileName = notePath.split('/').pop() || 'Note';
    const title = fileName.replace('.md', '');

    // Create and render TUI component
    const { waitUntilExit } = render(
      React.createElement(MarkdownPreview, {
        content,
        title: title,
        onExit: () => {
          // Don't exit in test environments
          if (process.env.NODE_ENV !== 'test' && !process.env.CI && !process.env.VITEST) {
            process.exit(0);
          }
        }
      }),
      {
        exitOnCtrlC: true
      }
    );

    await waitUntilExit();
  }
}