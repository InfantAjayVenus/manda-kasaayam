import path from 'path';
import { FileSystemService } from '../services/file-system.service.js';

export class NoteService {
  constructor(private fileSystemService: FileSystemService) {}

  getTodayFileName(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}.md`;
  }

  getNotePath(notesDir: string): string {
    const fileName = this.getTodayFileName();
    return path.join(notesDir, fileName);
  }

  async ensureNoteExists(notePath: string): Promise<void> {
    const exists = await this.fileSystemService.fileExists(notePath);
    if (!exists) {
      await this.fileSystemService.writeFile(notePath, '');
    }
  }

  async ensureNotesDirExists(notesDir: string): Promise<void> {
    await this.fileSystemService.ensureDirectoryExists(notesDir);
  }

  getCurrentTimeString(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private hasContentAfterLastTimestamp(content: string): boolean {
    const timestampRegex = /\[\d{2}:\d{2}\]/g;
    const matches = content.match(timestampRegex);
    
    if (!matches) {
      return true; // No timestamps found, so there's "content" after last timestamp
    }
    
    const lastTimestampIndex = content.lastIndexOf(matches[matches.length - 1]);
    const contentAfterLastTimestamp = content.substring(lastTimestampIndex + matches[matches.length - 1].length);
    
    // Check if there's any non-whitespace content after the last timestamp
    return contentAfterLastTimestamp.trim().length > 0;
  }

  async appendTimestampLink(notePath: string): Promise<void> {
    const timestamp = this.getCurrentTimeString();
    const timestampLink = `[${timestamp}]`;
    
    const exists = await this.fileSystemService.fileExists(notePath);
    let content = '';
    
    if (exists) {
      content = await this.fileSystemService.readFile(notePath);
    }
    
    if (!content) {
      // Empty file, just add timestamp
      content = timestampLink + '\n';
    } else if (this.hasContentAfterLastTimestamp(content)) {
      // Add timestamp link to the end of the file
      // If file doesn't end with newline, add one first
      if (!content.endsWith('\n')) {
        content += '\n';
      }
      content += timestampLink + '\n';
    } else {
      // Replace the last timestamp
      const timestampRegex = /\[\d{2}:\d{2}\]/g;
      const matches = content.match(timestampRegex);
      
      if (matches && matches.length > 0) {
        const lastTimestamp = matches[matches.length - 1];
        const lastTimestampIndex = content.lastIndexOf(lastTimestamp);
        
        // Replace the last timestamp with the new one
        content = content.substring(0, lastTimestampIndex) + timestampLink + content.substring(lastTimestampIndex + lastTimestamp.length);
      } else {
        // No timestamps found, just append
        if (!content.endsWith('\n')) {
          content += '\n';
        }
        content += timestampLink + '\n';
      }
    }
    
    await this.fileSystemService.writeFile(notePath, content);
  }
}
