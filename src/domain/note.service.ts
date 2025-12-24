import path from 'path';
import { FileSystemService } from '../services/file-system.service.js';
import { logger } from '../utils/logger.js';

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
      // Check if this is today's note
      const fileName = path.basename(notePath);
      const todayFileName = this.getTodayFileName();

      if (fileName === todayFileName) {
        // Move yesterday's note to organized directory structure
        await this.moveYesterdaysNoteToOrganizedStructure(notePath);
      }

      let content = '';
      if (fileName === todayFileName) {
        // For today's note, include incomplete tasks from previous notes
        content = await this.generateNoteWithIncompleteTasks(notePath);
      }

      await this.fileSystemService.writeFile(notePath, content);
    }
  }

  private async generateNoteWithIncompleteTasks(todayNotePath: string): Promise<string> {
    const notesDir = path.dirname(todayNotePath);
    const incompleteTasks = await this.collectIncompleteTasksFromPreviousNotes(notesDir);

    // Calculate today's date
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    let content = `# ${todayStr}\n\n`;

    if (incompleteTasks.length === 0) {
      return content;
    }

    // Format the tasks with links to source notes
    for (const [date, tasks] of incompleteTasks) {
      content += `[${date}](${date}.md)\n\n`;
      for (const task of tasks) {
        content += `${task}\n`;
      }
      content += '\n';
    }

    // Add separator after old tasks
    content += '---\n\n';

    return content;
  }

  private async collectIncompleteTasksFromPreviousNotes(
    notesDir: string,
  ): Promise<Array<[string, string[]]>> {
    // Only collect from yesterday's note
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const yesterdayFileName = `${yesterday.getFullYear()}-${String(
      yesterday.getMonth() + 1,
    ).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}.md`;
    const yesterdayNotePath = path.join(notesDir, yesterdayFileName);

    const result: Array<[string, string[]]> = [];
    const processedDates = new Set<string>();

    try {
      const exists = await this.fileSystemService.fileExists(yesterdayNotePath);
      if (exists) {
        const content = await this.fileSystemService.readFile(yesterdayNotePath);
        await this.extractIncompleteTasksGroupedByDateRecursive(
          content,
          notesDir,
          result,
          processedDates,
        );
      }
    } catch (error) {
      logger.info(error);
      // If there's an error reading yesterday's note, just skip it
      // This ensures the note creation doesn't fail
    }

    return result;
  }

  private extractIncompleteTasksGroupedByDate(content: string): Array<[string, string[]]> {
    const lines = content.split('\n');
    const result: Array<[string, string[]]> = [];

    let currentDate = '';
    let currentTasks: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for date link: [YYYY-MM-DD](YYYY-MM-DD.md)
      const dateLinkMatch = line.match(/^\[(\d{4}-\d{2}-\d{2})\]\((\d{4}-\d{2}-\d{2})\.md\)$/);
      if (dateLinkMatch) {
        // Save previous section if it had tasks
        if (currentDate && currentTasks.length > 0) {
          result.push([currentDate, [...currentTasks]]);
        }

        // Start new section
        currentDate = dateLinkMatch[1];
        currentTasks = [];

        // Skip the next line if it's empty (the line after the date link)
        if (i + 1 < lines.length && lines[i + 1].trim() === '') {
          i++;
        }
        continue;
      }

      // Look for incomplete tasks
      const taskMatch = line.match(/^\s*-\s*\[\s*\]\s*(.+)$/);
      if (taskMatch) {
        currentTasks.push(`- [ ] ${taskMatch[1].trim()}`);
      }
    }

    // Save the last section if it had tasks
    if (currentDate && currentTasks.length > 0) {
      result.push([currentDate, currentTasks]);
    }

    // If no date links were found, treat all tasks as belonging to yesterday
    if (result.length === 0) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(
        2,
        '0',
      )}-${String(yesterday.getDate()).padStart(2, '0')}`;

      const allTasks = this.extractIncompleteTasks(content);
      if (allTasks.length > 0) {
        result.push([yesterdayStr, allTasks]);
      }
    }

    return result;
  }

  private async extractIncompleteTasksGroupedByDateRecursive(
    content: string,
    notesDir: string,
    result: Array<[string, string[]]>,
    processedDates: Set<string>,
  ): Promise<void> {
    const lines = content.split('\n');

    let currentDate = '';
    let currentTasks: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for date link: [YYYY-MM-DD](YYYY-MM-DD.md)
      const dateLinkMatch = line.match(/^\[(\d{4}-\d{2}-\d{2})\]\((\d{4}-\d{2}-\d{2})\.md\)$/);
      if (dateLinkMatch) {
        // Save previous section if it had tasks
        if (currentDate && currentTasks.length > 0) {
          result.push([currentDate, [...currentTasks]]);
        }

        // Start new section
        currentDate = dateLinkMatch[1];
        currentTasks = [];

        // Recursively process linked date if not already processed
        if (!processedDates.has(currentDate)) {
          processedDates.add(currentDate);
          const linkedFilePath = path.join(notesDir, `${currentDate}.md`);

          try {
            const exists = await this.fileSystemService.fileExists(linkedFilePath);
            if (exists) {
              const linkedContent = await this.fileSystemService.readFile(linkedFilePath);
              await this.extractIncompleteTasksGroupedByDateRecursive(
                linkedContent,
                notesDir,
                result,
                processedDates,
              );
            }
          } catch (error) {
            logger.info(error);
            // Ignore errors reading linked files
          }
        }

        // Skip the next line if it's empty (the line after the date link)
        if (i + 1 < lines.length && lines[i + 1].trim() === '') {
          i++;
        }
        continue;
      }

      // Look for incomplete tasks
      const taskMatch = line.match(/^\s*-\s*\[\s*\]\s*(.+)$/);
      if (taskMatch) {
        currentTasks.push(`- [ ] ${taskMatch[1].trim()}`);
      }
    }

    // Save the last section if it had tasks
    if (currentDate && currentTasks.length > 0) {
      result.push([currentDate, currentTasks]);
    }

    // If no date links were found, treat all tasks as belonging to yesterday
    if (result.length === 0) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(
        2,
        '0',
      )}-${String(yesterday.getDate()).padStart(2, '0')}`;

      const allTasks = this.extractIncompleteTasks(content);
      if (allTasks.length > 0) {
        result.push([yesterdayStr, allTasks]);
      }
    }
  }

  private extractIncompleteTasks(content: string): string[] {
    const lines = content.split('\n');
    const incompleteTasks: string[] = [];

    for (const line of lines) {
      // Match incomplete task list items: - [ ] task text
      const taskMatch = line.match(/^\s*-\s*\[\s*\]\s*(.+)$/);
      if (taskMatch) {
        incompleteTasks.push(`- [ ] ${taskMatch[1].trim()}`);
      }
    }

    return incompleteTasks;
  }

  async ensureNotesDirExists(notesDir: string): Promise<void> {
    await this.fileSystemService.ensureDirectoryExists(notesDir);
  }

  private async moveYesterdaysNoteToOrganizedStructure(todayNotePath: string): Promise<void> {
    const notesDir = path.dirname(todayNotePath);

    // Calculate yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const yesterdayFileName = `${yesterday.getFullYear()}-${String(
      yesterday.getMonth() + 1,
    ).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}.md`;
    const yesterdayNotePath = path.join(notesDir, yesterdayFileName);

    // Check if yesterday's note exists in the root directory
    const yesterdayNoteExists = await this.fileSystemService.fileExists(yesterdayNotePath);
    if (!yesterdayNoteExists) {
      return; // No yesterday's note to move
    }

    // Create organized directory structure: YYYY/MM
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');

    const organizedDir = path.join(notesDir, String(year), month);
    await this.fileSystemService.ensureDirectoryExists(organizedDir);

    // Move yesterday's note to the organized directory
    const organizedNotePath = path.join(organizedDir, yesterdayFileName);
    await this.fileSystemService.moveFile(yesterdayNotePath, organizedNotePath);
  }

  async readFileContent(notePath: string): Promise<string> {
    return await this.fileSystemService.readFile(notePath);
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
    const contentAfterLastTimestamp = content.substring(
      lastTimestampIndex + matches[matches.length - 1].length,
    );

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
        content =
          content.substring(0, lastTimestampIndex) +
          timestampLink +
          content.substring(lastTimestampIndex + lastTimestamp.length);
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

  private hasContentAddedBelowLastTimestamp(beforeContent: string, afterContent: string): boolean {
    const timestampRegex = /\[\d{2}:\d{2}\]/g;
    const beforeMatches = beforeContent.match(timestampRegex);
    const afterMatches = afterContent.match(timestampRegex);

    // If timestamps count changed, we can't reliably detect
    if (!beforeMatches || !afterMatches || beforeMatches.length !== afterMatches.length) {
      return false;
    }

    // Find the last timestamp in both contents
    const lastTimestampBefore = beforeMatches[beforeMatches.length - 1];
    const lastTimestampAfter = afterMatches[afterMatches.length - 1];

    // If last timestamp is different, we can't reliably detect
    if (lastTimestampBefore !== lastTimestampAfter) {
      return false;
    }

    // Check if content was added after the last timestamp
    const lastTimestampIndexAfter = afterContent.lastIndexOf(lastTimestampAfter);
    const contentAfterLastTimestamp = afterContent.substring(
      lastTimestampIndexAfter + lastTimestampAfter.length,
    );

    // Check if there's meaningful content after the last timestamp that wasn't there before
    const lastTimestampIndexBefore = beforeContent.lastIndexOf(lastTimestampBefore);
    const contentAfterBefore = beforeContent.substring(
      lastTimestampIndexBefore + lastTimestampBefore.length,
    );

    return contentAfterLastTimestamp.trim().length > contentAfterBefore.trim().length;
  }

  async postProcessAfterEdit(
    notePath: string,
    beforeContent: string,
    afterContent: string,
  ): Promise<void> {
    if (this.hasContentAddedBelowLastTimestamp(beforeContent, afterContent)) {
      // Add separator line at the end of the document
      let updatedContent = afterContent;

      // Check if content already ends with separator
      if (!updatedContent.endsWith('\n---\n\n')) {
        // Ensure content ends with exactly one newline, then add separator
        if (!updatedContent.endsWith('\n')) {
          updatedContent += '\n';
        }
        updatedContent += '\n---\n\n';
        await this.fileSystemService.writeFile(notePath, updatedContent);
      }
      // If separator already exists at the end, no need to write
    }
  }
}
