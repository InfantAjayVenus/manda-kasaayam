/**
 * Centralized error handling system for Manda Kasaayam
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly context?: ErrorContext;
  public readonly timestamp: Date;
  public readonly originalError?: Error;

  constructor(message: string, code: string, context?: ErrorContext, originalError?: Error) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
    this.originalError = originalError;
  }

  /**
   * Get a formatted error message with context
   */
  getFormattedMessage(): string {
    let message = this.message;

    if (this.context && Object.keys(this.context).length > 0) {
      const contextStr = Object.entries(this.context)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(', ');
      message = `${message} (Context: ${contextStr})`;
    }

    if (this.originalError) {
      message = `${message} (Original: ${this.originalError.message})`;
    }

    return `[${this.code}] ${message}`;
  }

  /**
   * Convert error to JSON for logging
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      originalError: this.originalError
        ? {
            name: this.originalError.name,
            message: this.originalError.message,
            stack: this.originalError.stack,
          }
        : undefined,
      stack: this.stack,
    };
  }
}

/**
 * Error codes for different types of errors
 */
export enum ErrorCode {
  // File system errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  FILE_PERMISSION_DENIED = 'FILE_PERMISSION_DENIED',
  FILE_NOT_ACCESSIBLE = 'FILE_NOT_ACCESSIBLE',
  FILE_INVALID_PATH = 'FILE_INVALID_PATH',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',

  // Configuration errors
  CONFIG_INVALID = 'CONFIG_INVALID',
  CONFIG_MISSING = 'CONFIG_MISSING',
  CONFIG_PARSE_ERROR = 'CONFIG_PARSE_ERROR',

  // Editor errors
  EDITOR_NOT_FOUND = 'EDITOR_NOT_FOUND',
  EDITOR_FAILED = 'EDITOR_FAILED',
  EDITOR_TIMEOUT = 'EDITOR_TIMEOUT',

  // Git errors
  GIT_NOT_REPO = 'GIT_NOT_REPO',
  GIT_OPERATION_FAILED = 'GIT_OPERATION_FAILED',
  GIT_AUTHENTICATION_FAILED = 'GIT_AUTHENTICATION_FAILED',
  GIT_NETWORK_ERROR = 'GIT_NETWORK_ERROR',

  // Note service errors
  NOTE_PARSE_ERROR = 'NOTE_PARSE_ERROR',
  NOTE_INVALID_FORMAT = 'NOTE_INVALID_FORMAT',
  NOTE_TASK_TOGGLE_FAILED = 'NOTE_TASK_TOGGLE_FAILED',
  NOTE_LINK_INVALID = 'NOTE_LINK_INVALID',

  // Command errors
  COMMAND_INVALID_ARGS = 'COMMAND_INVALID_ARGS',
  COMMAND_EXECUTION_FAILED = 'COMMAND_EXECUTION_FAILED',
  COMMAND_TIMEOUT = 'COMMAND_TIMEOUT',

  // UI errors
  UI_RENDER_ERROR = 'UI_RENDER_ERROR',
  UI_NAVIGATION_ERROR = 'UI_NAVIGATION_ERROR',
  UI_INPUT_ERROR = 'UI_INPUT_ERROR',

  // Network errors
  NETWORK_CONNECTION_FAILED = 'NETWORK_CONNECTION_FAILED',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_SERVER_ERROR = 'NETWORK_SERVER_ERROR',

  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  VALIDATION_INVALID_DATE = 'VALIDATION_INVALID_DATE',
  VALIDATION_INVALID_PATH = 'VALIDATION_INVALID_PATH',
  VALIDATION_INVALID_INPUT = 'VALIDATION_INVALID_INPUT',

  // System errors
  SYSTEM_MEMORY_ERROR = 'SYSTEM_MEMORY_ERROR',
  SYSTEM_DISK_SPACE_ERROR = 'SYSTEM_DISK_SPACE_ERROR',
  SYSTEM_PERMISSION_ERROR = 'SYSTEM_PERMISSION_ERROR',

  // Unknown error
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error context interface
 */
export interface ErrorContext {
  operation?: string;
  filePath?: string;
  command?: string;
  userAction?: string;
  severity?: ErrorSeverity;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  systemState?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  additionalData?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args?: any[];
  field?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
}
