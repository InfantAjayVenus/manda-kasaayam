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

  async appendTimestampLink(notePath: string): Promise<void> {
    const timestamp = this.getCurrentTimeString();
    const timestampLink = `[${timestamp}]`;
    
    const exists = await this.fileSystemService.fileExists(notePath);
    let content = '';
    
    if (exists) {
      content = await this.fileSystemService.readFile(notePath);
    }
    
    // Add timestamp link to the end of the file
    // If file is empty or doesn't end with newline, add one first
    if (content && !content.endsWith('\n')) {
      content += '\n';
    }
    content += timestampLink + '\n';
    
    await this.fileSystemService.writeFile(notePath, content);
  }
}
