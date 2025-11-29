import { BaseCommand } from './base.command.js';
import { NoteService } from '../domain/note.service.js';
import { FileSystemService } from '../services/file-system.service.js';
import { EditorService } from '../services/editor.service.js';
import { render } from 'ink';
import React from 'react';
import MarkdownPreview from '../components/MarkdownPreview.js';
import { 
  getYesterdayDate, 
  getTodayForTests, 
  formatDateForTitle, 
  getNextDate, 
  isDateBeforeOrEqualToday 
} from '../utils/dateUtils.js';
import { getNotePathForDate } from '../utils/fileUtils.js';
import { InkRenderOptions } from '../types/index.js';

export interface SeeOptions {
  yester?: boolean;
  date?: string; // YYYY-MM-DD format
}

export class SeeCommand extends BaseCommand {
  private fileSystemService: FileSystemService;
  private editorService: EditorService;
  private allowEditNotes?: boolean;

  constructor(noteService?: NoteService, fileSystemService?: FileSystemService, editorService?: EditorService) {
    super(noteService);
    this.fileSystemService = fileSystemService || new FileSystemService();
    this.editorService = editorService || new EditorService();
  }

  async execute(options: SeeOptions = {}): Promise<void> {
    // Determine the initial date to display
    let currentDate: Date;
    if (options.date) {
      currentDate = new Date(options.date + 'T00:00:00');
    } else if (options.yester) {
      currentDate = getYesterdayDate();
    } else {
      currentDate = getTodayForTests();
    }
    // Gate editing: allow when no explicit date is provided
    this.allowEditNotes = !options.date;

    // Display the note with navigation support
    await this.displayNoteWithNavigation(currentDate);
  }


  private async displayNoteWithNavigation(currentDate: Date): Promise<void> {
    const notesDir = process.env.MANDA_DIR!;
    if (!notesDir) {
      throw new Error('MANDA_DIR environment variable is not set');
    }

    await this.noteService.ensureNotesDirExists(notesDir);

    const navigateToDate = async (date: Date) => {
      await this.displayNoteWithNavigation(date);
    };

    const navigatePrevious = async () => {
      const previousDate = await this.findPreviousValidNote(currentDate);
      if (previousDate) {
        await navigateToDate(previousDate);
      }
    };

    const navigateNext = async () => {
      const nextDate = getNextDate(currentDate);
      if (isDateBeforeOrEqualToday(nextDate)) {
        // Allow navigation to any date before or equal to today, creating the note if needed
        await navigateToDate(nextDate);
      }
    };

    const onEdit = async () => {
      if (this.allowEditNotes) {
        // Open the note in editor
        const notePath = getNotePathForDate(currentDate);
        await this.editorService.openFile(notePath);
      }
      // Note: Editing is disabled for old notes - no action needed when allowEditNotes is false
    };

    const notePath = getNotePathForDate(currentDate);
    const title = formatDateForTitle(currentDate);

    // Check if the note file exists
    const exists = await this.fileSystemService.fileExists(notePath);

    let content = '';
    if (exists) {
      content = await this.fileSystemService.readFile(notePath);
    } else {
      // Create empty note if it doesn't exist
      await this.noteService.ensureNoteExists(notePath);
    }

    // Display the content using TUI markdown preview with navigation
    await this.displayMarkdownWithTUINavigation(content, title, currentDate, navigatePrevious, navigateNext, onEdit);
  }



  private async findOldestNote(): Promise<Date | null> {
    const notesDir = process.env.MANDA_DIR!;
    try {
      const files = await this.fileSystemService.listDirectory(notesDir);
      const noteFiles = files.filter((file: string) => file.endsWith('.md'));

      if (noteFiles.length === 0) {
        return null;
      }

      // Extract dates from filenames and find the oldest
      const dates = noteFiles
        .map((file: string) => file.replace('.md', ''))
        .filter((dateStr: string) => /^\d{4}-\d{2}-\d{2}$/.test(dateStr))
        .map((dateStr: string) => new Date(dateStr + 'T00:00:00'))
        .filter((date: Date) => !isNaN(date.getTime()))
        .sort((a: Date, b: Date) => a.getTime() - b.getTime());

      return dates.length > 0 ? dates[0] : null;
    } catch (error) {
      return null;
    }
  }

  private async findPreviousValidNote(currentDate: Date): Promise<Date | null> {
    const oldestNote = await this.findOldestNote();
    if (!oldestNote) {
      return null;
    }

    let checkDate = new Date(currentDate);
    checkDate.setDate(checkDate.getDate() - 1);

    // Don't go before the oldest note
    if (checkDate < oldestNote) {
      return null;
    }

    const notesDir = process.env.MANDA_DIR!;

    // Look backwards for an existing note
    while (checkDate >= oldestNote) {
      const notePath = getNotePathForDate(checkDate);
      const exists = await this.fileSystemService.fileExists(notePath);
      if (exists) {
        return checkDate;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return null;
  }



  private async displayMarkdownWithTUINavigation(
    content: string,
    title: string,
    currentDate: Date,
    navigatePrevious: () => Promise<void>,
    navigateNext: () => Promise<void>,
    onEdit?: () => Promise<void>
  ): Promise<void> {
    // Create and render TUI component with navigation
    const { waitUntilExit } = render(
      React.createElement(MarkdownPreview, {
        content,
        title: title,
        currentDate,
        onExit: () => {
          // Don't exit in test environments
          if (process.env.NODE_ENV !== 'test' && !process.env.CI && !process.env.VITEST) {
            process.exit(0);
          }
        },
        onNavigatePrevious: navigatePrevious,
        onNavigateNext: navigateNext,
        onEdit
      }),
      {
        exitOnCtrlC: true,
        experimentalAlternateScreenBuffer: true
      } as InkRenderOptions
    );

    await waitUntilExit();
  }
}