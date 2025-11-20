import fs from 'fs/promises';
import path from 'path';

export class FileSystemService {
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async readFile(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    await fs.writeFile(filePath, content, 'utf-8');
  }

  async createDirectory(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  async ensureDirectoryExists(dirPath: string): Promise<void> {
    const exists = await this.fileExists(dirPath);
    if (!exists) {
      await this.createDirectory(dirPath);
    }
  }

  async listDirectory(dirPath: string): Promise<string[]> {
    return await fs.readdir(dirPath);
  }
}
