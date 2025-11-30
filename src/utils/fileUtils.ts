/**
 * Shared file path utility functions for Manda Kasaayam
 */
import { AppConfig, formatNoteDate } from '../config/index.js';

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
