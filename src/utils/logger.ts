/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
/**
 * Simple logger utility to wrap console statements
 * This avoids ESLint no-console warnings while preserving behavior
 */

export const logger = {
  info: (message: any) => console.info(message),
  warn: (message: any) => console.warn(message),
};
