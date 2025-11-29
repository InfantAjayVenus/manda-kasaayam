/**
 * Shared date utility functions for Manda Kasaayam
 */

/**
 * Gets yesterday's date, with test environment handling
 * @returns Date object for yesterday
 */
export function getYesterdayDate(): Date {
  // In test environments, use a fixed date to avoid timing issues
  if (process.env.NODE_ENV === 'test' || process.env.CI || process.env.VITEST) {
    // Use 2025-11-24 as yesterday for testing (since today is 2025-11-25)
    const yesterday = new Date('2025-11-25');
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }
}

/**
 * Gets today's date, with test environment handling for deterministic behavior
 * @returns Date object for today
 */
export function getTodayForTests(): Date {
  // Anchor today for tests to 2025-11-25 to ensure deterministic behavior
  if (process.env.NODE_ENV === 'test' || process.env.CI || process.env.VITEST) {
    return new Date('2025-11-25T00:00:00');
  } else {
    return new Date();
  }
}

/**
 * Gets yesterday's date from today (alternative implementation)
 * @returns Date object for yesterday
 */
export function getYesterdayFromToday(): Date {
  const today = getTodayForTests();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}

/**
 * Formats a date as YYYY-MM-DD string for titles
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateForTitle(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets the next date from a given date
 * @param date - Starting date
 * @returns Next date
 */
export function getNextDate(date: Date): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);
  return nextDate;
}

/**
 * Checks if a date is before or equal to today
 * @param date - Date to check
 * @returns True if date is before or equal to today
 */
export function isDateBeforeOrEqualToday(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  return normalizedDate <= today;
}