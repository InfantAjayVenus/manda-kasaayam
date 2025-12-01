/**
 * Error handling utilities for Manda Kasaayam
 */
import { AppError, ErrorCode, ErrorContext, ErrorSeverity } from '../errors/index.js';
import { AppConfig, isTestEnvironment } from '../config/index.js';

/**
 * Logger utility with different levels based on environment
 */
export class Logger {
  private message: string;
  public code: string;
  public context?: ErrorContext;
  public timestamp: Date;
  public originalError?: Error;

  constructor(message: string, code: string, context?: ErrorContext, originalError?: Error) {
    this.message = message;
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
    this.originalError = originalError;
  }

  private static log(level: string, message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      environment: process.env.NODE_ENV || 'development',
    };

    if (isTestEnvironment()) {
      // In test environment, don't log to console
      return;
    }

    // In development, log detailed information
    if (AppConfig.development.enableDebugLogs) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(logEntry, null, 2));
    } else {
      // In production, log structured errors only
      if (level === 'ERROR' || level === 'CRITICAL') {
        // eslint-disable-next-line no-console
        console.error(JSON.stringify(logEntry, null, 2));
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static debug(message: string, data?: any): void {
    this.log('DEBUG', message, data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static info(message: string, data?: any): void {
    this.log('INFO', message, data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static warn(message: string, data?: any): void {
    this.log('WARN', message, data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static error(message: string, error?: Error | AppError, data?: any): void {
    const errorData =
      error instanceof AppError
        ? error.toJSON()
        : {
            name: error?.name,
            message: error?.message,
            stack: error?.stack,
          };

    this.log('ERROR', message, { ...errorData, ...data });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static critical(message: string, error?: Error | AppError, data?: any): void {
    const errorData =
      error instanceof AppError
        ? error.toJSON()
        : {
            name: error?.name,
            message: error?.message,
            stack: error?.stack,
          };

    this.log('CRITICAL', message, { ...errorData, ...data });
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
      name: this.constructor.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
      originalError: this.originalError
        ? {
            name: this.originalError.constructor.name,
            message: this.originalError.message,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            stack: (this.originalError as any).stack,
          }
        : undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stack: (this as any).stack,
    };
  }
}

/**
 * Error handler utility for consistent error processing
 */
export class ErrorHandler {
  /**
   * Handle and log errors consistently
   */
  static handle(
    error: Error | AppError,
    context?: Partial<ErrorContext>,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  ): AppError {
    // Merge context with severity
    const fullContext: Partial<ErrorContext> = {
      ...context,
      severity,
    };

    // If it's already an AppError, just add context and re-throw
    if (error instanceof AppError) {
      const mergedContext: ErrorContext = {
        ...error.context,
        ...fullContext,
      };

      const updatedError = new AppError(
        error.message,
        error.code,
        mergedContext,
        error.originalError,
      );

      Logger.error(error.message, updatedError);
      return updatedError;
    }

    // Convert regular Error to AppError
    const appError = new AppError(
      error.message,
      this.getErrorCodeFromError(error),
      fullContext,
      error,
    );

    Logger.error(appError.message, appError);
    return appError;
  }

  /**
   * Handle file system errors
   */
  static handleFileError(error: Error | AppError, operation: string, filePath?: string): AppError {
    const context: ErrorContext = {
      operation,
      filePath,
      userAction: 'file operation',
    };

    return this.handle(error, context, ErrorSeverity.HIGH);
  }

  /**
   * Handle editor errors
   */
  static handleEditorError(
    error: Error | AppError,
    operation: string,
    filePath?: string,
  ): AppError {
    const context: ErrorContext = {
      operation,
      filePath,
      userAction: 'editor operation',
    };

    return this.handle(error, context, ErrorSeverity.MEDIUM);
  }

  /**
   * Handle git errors
   */
  static handleGitError(error: Error | AppError, operation: string): AppError {
    const context: ErrorContext = {
      operation,
      userAction: 'git operation',
    };

    return this.handle(error, context, ErrorSeverity.LOW);
  }

  /**
   * Handle validation errors
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static handleValidationError(error: Error | AppError, field: string, value: any): AppError {
    const context: ErrorContext = {
      operation: 'validation',
      userAction: 'input validation',
      field,
      value,
    };

    return this.handle(error, context, ErrorSeverity.MEDIUM);
  }

  /**
   * Handle command execution errors
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static handleCommandError(error: Error | AppError, command: string, args?: any[]): AppError {
    const context: ErrorContext = {
      operation: 'command execution',
      command,
      args,
      userAction: 'command execution',
    };

    return this.handle(error, context, ErrorSeverity.HIGH);
  }

  /**
   * Get error code from error type
   */
  private static getErrorCodeFromError(error: Error): ErrorCode {
    if (error.message.includes('ENOENT')) return ErrorCode.FILE_NOT_FOUND;
    if (error.message.includes('EACCES')) return ErrorCode.FILE_PERMISSION_DENIED;
    if (error.message.includes('EMFILE')) return ErrorCode.FILE_TOO_LARGE;
    if (error.message.includes('Editor')) return ErrorCode.EDITOR_FAILED;
    if (error.message.includes('Git')) return ErrorCode.GIT_OPERATION_FAILED;

    return ErrorCode.UNKNOWN_ERROR;
  }

  /**
   * Create a recovery suggestion for the user
   */
  static getRecoverySuggestion(error: AppError): string {
    switch (error.code) {
      case ErrorCode.FILE_NOT_FOUND:
        return 'Check if the file path is correct and the file exists.';
      case ErrorCode.FILE_PERMISSION_DENIED:
        return 'Check file permissions and try running with appropriate access rights.';
      case ErrorCode.EDITOR_NOT_FOUND:
        return `Install one of the preferred editors: ${AppConfig.editors.preferredOrder.join(', ')}`;
      case ErrorCode.VALIDATION_INVALID_DATE:
        return 'Please provide a valid date in YYYY-MM-DD format.';
      case ErrorCode.COMMAND_INVALID_ARGS:
        return 'Check the command arguments and try again.';
      default:
        return 'An unexpected error occurred. Please try again or check the logs for details.';
    }
  }
}
