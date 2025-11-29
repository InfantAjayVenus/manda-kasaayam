/**
 * Type definitions for Ink render options and markdown tokens
 */

/**
 * Ink render options interface
 */
export interface InkRenderOptions {
  exitOnCtrlC?: boolean;
  experimentalAlternateScreenBuffer?: boolean;
  debug?: boolean;
  stdout?: NodeJS.WriteStream;
  stdin?: NodeJS.ReadStream;
}

/**
 * Extended markdown token interfaces for better type safety
 */
export interface MarkdownToken {
  type: string;
  raw?: string;
  text?: string;
  tokens?: MarkdownToken[];
  depth?: number;
  ordered?: boolean;
  start?: number;
  task?: boolean;
  checked?: boolean;
  items?: MarkdownToken[];
  header?: any[];
  rows?: any[][];
}

export interface ListToken extends MarkdownToken {
  type: 'list';
  ordered?: boolean;
  start?: number;
  items?: MarkdownToken[];
}

export interface ListItemToken extends MarkdownToken {
  type: 'list_item';
  task?: boolean;
  checked?: boolean;
  text?: string;
  tokens?: MarkdownToken[];
}

export interface TableToken extends MarkdownToken {
  type: 'table';
  header?: any[];
  rows?: any[][];
}

export interface TaskToken extends MarkdownToken {
  task: boolean;
  checked: boolean;
}