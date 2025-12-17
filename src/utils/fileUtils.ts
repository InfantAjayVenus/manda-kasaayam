/**
 * Shared file path utility functions for Manda Kasaayam
 */
import path from 'path';
import { AppConfig, formatNoteDate } from '../config/index.js';
import type { FileSystemService } from '../services/file-system.service.js';

/**
 * Generates the note file path for a given date
 * @param date - Date to generate path for
 * @returns Full path to the note file
 */
export function getNotePathForDate(date: Date): string {
  const fileName = `${formatNoteDate(date)}${AppConfig.files.noteExtension}`;

  const notesDir = process.env.MANDA_DIR;
  if (!notesDir) {
    throw new Error('MANDA_DIR environment variable is not set');
  }
  return `${notesDir}/${fileName}`;
}

/**
 * Gets yesterday's note path
 * @returns Full path to yesterday's note file
 */
export function getYesterdayNotePath(): string {
  // Import getYesterdayDate to avoid circular dependency
  const { getYesterdayDate } = require('./dateUtils');
  const yesterday = getYesterdayDate();
  return getNotePathForDate(yesterday);
}

/**
 * Gets the organized note path for a date (YYYY/MM/YYYY-MM-DD.md structure)
 * @param date - Date to generate path for
 * @returns Full path to the organized note file
 */
export function getOrganizedNotePathForDate(date: Date): string {
  const notesDir = process.env.MANDA_DIR;
  if (!notesDir) {
    throw new Error('MANDA_DIR environment variable is not set');
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const fileName = `${formatNoteDate(date)}${AppConfig.files.noteExtension}`;

  return path.join(notesDir, String(year), month, fileName);
}

/**
 * Finds the actual path to an existing note for the given date
 * Checks both flat path (YYYY-MM-DD.md) and organized path (YYYY/MM/YYYY-MM-DD.md)
 * @param date - Date to find note for
 * @param fileSystemService - FileSystemService instance to check file existence
 * @returns The actual path if note exists, null otherwise
 */
export async function findNotePathForDate(
  date: Date,
  fileSystemService: FileSystemService,
): Promise<string | null> {
  // First check organized path (preferred for older notes)
  const organizedPath = getOrganizedNotePathForDate(date);
  if (await fileSystemService.fileExists(organizedPath)) {
    return organizedPath;
  }

  // Then check flat path (for recent/unorganized notes)
  const flatPath = getNotePathForDate(date);
  if (await fileSystemService.fileExists(flatPath)) {
    return flatPath;
  }

  return null;
}
