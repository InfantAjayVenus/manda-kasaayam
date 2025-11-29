/**
 * Shared file path utility functions for Manda Kasaayam
 */

/**
 * Generates the note file path for a given date
 * @param date - Date to generate path for
 * @returns Full path to the note file
 */
export function getNotePathForDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const fileName = `${year}-${month}-${day}.md`;

  const notesDir = process.env.MANDA_DIR!;
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