/**
 * Centralized configuration for Manda Kasaayam application
 */

export const AppConfig = {
  // Application metadata
  app: {
    name: 'manda-kasaayam',
    version: '1.0.0',
    description: 'A Terminal User Interface (TUI) application for managing daily notes',
  },

  // File system configuration
  files: {
    noteExtension: '.md',
    dateFormat: 'YYYY-MM-DD',
    timestampFormat: 'YYYY-MM-DD HH:mm:ss',
  },

  // Editor configuration
  editors: {
    preferredOrder: ['micro', 'vim', 'vi', 'nano', 'code'],
    fallback: 'nano',
    envVar: 'EDITOR',
  },

  // Cache configuration (for future optimization)
  cache: {
    maxSize: 50,
    ttlMs: 30000, // 30 seconds
    enabled: true,
  },

  // Date configuration
  dates: {
    // Fixed test date for deterministic behavior
    testFixedDate: '2025-11-25T00:00:00',
    // Maximum days to search for notes
    maxSearchDays: 365,
    // Date validation regex
    validationRegex: /^\d{4}-\d{2}-\d{2}$/,
  },

  // Git configuration
  git: {
    enabled: true,
    autoCommit: false, // Disabled by default for privacy
    commitMessagePrefix: 'Update notes',
  },

  // UI configuration
  ui: {
    // TUI rendering options
    exitOnCtrlC: true,
    experimentalAlternateScreenBuffer: true,
    // Task list colors
    colors: {
      completed: 'green',
      incomplete: 'red',
      selected: 'cyan',
      header: 'yellow',
      title: 'blue',
      link: 'blue',
      code: 'gray',
    },
    // Pagination
    pageSize: 20,
  },

  // Development configuration
  development: {
    // Environment detection
    testEnvironments: ['test', 'CI', 'VITEST'],
    // Logging
    enableDebugLogs: false,
    // Performance monitoring
    enablePerformanceMetrics: false,
  },

  // Security configuration
  security: {
    // Input validation
    maxNoteSize: 10 * 1024 * 1024, // 10MB
    maxFileNameLength: 255,
    // Path validation
    allowedPaths: ['.', '..', '~'], // Relative paths only
  },
} as const;

// Type exports for better TypeScript support
export type AppConfigType = typeof AppConfig;

// Helper functions for configuration access
export const isTestEnvironment = (): boolean => {
  return AppConfig.development.testEnvironments.some(
    env => process.env.NODE_ENV === env || process.env[env] !== undefined,
  );
};

export const getEditorFromEnvironment = (): string | undefined => {
  return process.env[AppConfig.editors.envVar];
};

export const validateDateFormat = (dateString: string): boolean => {
  return AppConfig.dates.validationRegex.test(dateString);
};

export const formatNoteDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatTimestamp = (date?: Date): string => {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
