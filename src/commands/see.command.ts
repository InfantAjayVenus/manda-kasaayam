import { BaseCommand } from './base.command.js';
import { NoteService } from '../domain/note.service.js';
import { FileSystemService } from '../services/file-system.service.js';
import { EditorService } from '../services/editor.service.js';
import { render } from 'ink';
import React from 'react';
import MarkdownPreview from '../components/MarkdownPreview.js';
import {
  formatDateForTitle,
  getNextDate,
  getTodayForTests,
  getYesterdayDate,
  isDateBeforeOrEqualToday,
} from '../utils/dateUtils.js';
import { findNotePathForDate, getNotePathForDate } from '../utils/fileUtils.js';
import { AppConfig } from '../config/index.js';
import { InkRenderOptions } from '../types/index.js';
import { logger } from '../utils/logger.js';

export interface SeeOptions {
  yester?: boolean;
  date?: string; // YYYY-MM-DD format
}

export class SeeCommand extends BaseCommand {
  private fileSystemService: FileSystemService;
  private editorService: EditorService;
  private allowEditNotes?: boolean;

  constructor(
    noteService?: NoteService,
    fileSystemService?: FileSystemService,
    editorService?: EditorService,
  ) {
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
    const notesDir = process.env.MANDA_DIR;
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
    await this.displayMarkdownWithTUINavigation(
      content,
      title,
      currentDate,
      navigatePrevious,
      navigateNext,
      onEdit,
    );
  }

  private async findOldestNote(): Promise<Date | null> {
    const notesDir = process.env.MANDA_DIR;
    if (!notesDir) {
      return null;
    }

    try {
      // Start from 1 year ago and work forward to find the first existing note
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);

      const checkDate = new Date(startDate);
      const maxDays = AppConfig.dates.maxSearchDays; // Search up to 365 days back

      for (let i = 0; i < maxDays; i++) {
        const existingPath = await findNotePathForDate(checkDate, this.fileSystemService);
        if (existingPath) {
          return new Date(checkDate);
        }
        checkDate.setDate(checkDate.getDate() + 1);
      }

      return null;
    } catch (error) {
      logger.warn(error);
      return null;
    }
  }

  private async findPreviousValidNote(currentDate: Date): Promise<Date | null> {
    const oldestNote = await this.findOldestNote();
    if (!oldestNote) {
      return null;
    }

    const checkDate = new Date(currentDate);
    checkDate.setDate(checkDate.getDate() - 1);

    // Don't go before the oldest note
    if (checkDate < oldestNote) {
      return null;
    }

    // Look backwards for an existing note
    while (checkDate >= oldestNote) {
      const existingPath = await findNotePathForDate(checkDate, this.fileSystemService);
      if (existingPath) {
        return new Date(checkDate);
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
    onEdit?: () => Promise<void>,
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
        onEdit,
      }),
      {
        exitOnCtrlC: AppConfig.ui.exitOnCtrlC,
        experimentalAlternateScreenBuffer: AppConfig.ui.experimentalAlternateScreenBuffer,
      } as InkRenderOptions,
    );

    await waitUntilExit();
  }
}
