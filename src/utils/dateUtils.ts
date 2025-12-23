/**
 * Shared date utility functions for Manda Kasaayam
 */
import { AppConfig, formatNoteDate, isTestEnvironment } from '../config/index.js';

/**
 * Gets yesterday's date, with test environment handling
 * @returns Date object for yesterday
 */
export function getYesterdayDate(): Date {
  if (isTestEnvironment()) {
    // Use configured test date for deterministic behavior
    const testDate = new Date(AppConfig.dates.testFixedDate);
    testDate.setDate(testDate.getDate() - 1);
    return testDate;
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
  if (isTestEnvironment()) {
    return new Date(AppConfig.dates.testFixedDate);
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
  return formatNoteDate(date);
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
