import path from "path";
import { FileSystemService } from "../services/file-system.service.js";

export class NoteService {
  constructor(private fileSystemService: FileSystemService) { }

  getTodayFileName(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
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

      let content = "";
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

    if (incompleteTasks.length === 0) {
      return "";
    }

    // Format the tasks with links to source notes
    let content = "";
    for (const [date, tasks] of incompleteTasks) {
      content += `[${date}](${date}.md)\n\n`;
      for (const task of tasks) {
        content += `${task}\n`;
      }
      content += "\n";
    }

    return content;
  }

  private async collectIncompleteTasksFromPreviousNotes(notesDir: string): Promise<Array<[string, string[]]>> {
    // Only collect from yesterday's note
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const yesterdayFileName = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}.md`;
    const yesterdayNotePath = path.join(notesDir, yesterdayFileName);

    const result: Array<[string, string[]]> = [];

    try {
      const exists = await this.fileSystemService.fileExists(yesterdayNotePath);
      if (exists) {
        const content = await this.fileSystemService.readFile(yesterdayNotePath);
        const incompleteTasks = this.extractIncompleteTasks(content);

        if (incompleteTasks.length > 0) {
          const dateStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
          result.push([dateStr, incompleteTasks]);
        }
      }
    } catch (error) {
      // If there's an error reading yesterday's note, just skip it
      // This ensures the note creation doesn't fail
    }

    return result;
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

  async readFileContent(notePath: string): Promise<string> {
    return await this.fileSystemService.readFile(notePath);
  }

  getCurrentTimeString(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
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
    let content = "";

    if (exists) {
      content = await this.fileSystemService.readFile(notePath);
    }

    if (!content) {
      // Empty file, just add timestamp
      content = timestampLink + "\n";
    } else if (this.hasContentAfterLastTimestamp(content)) {
      // Add timestamp link to the end of the file
      // If file doesn't end with newline, add one first
      if (!content.endsWith("\n")) {
        content += "\n";
      }
      content += timestampLink + "\n";
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
        if (!content.endsWith("\n")) {
          content += "\n";
        }
        content += timestampLink + "\n";
      }
    }

    await this.fileSystemService.writeFile(notePath, content);
  }

  private hasContentAddedBelowLastTimestamp(
    beforeContent: string,
    afterContent: string,
  ): boolean {
    const timestampRegex = /\[\d{2}:\d{2}\]/g;
    const beforeMatches = beforeContent.match(timestampRegex);
    const afterMatches = afterContent.match(timestampRegex);

    // If timestamps count changed, we can't reliably detect
    if (
      !beforeMatches ||
      !afterMatches ||
      beforeMatches.length !== afterMatches.length
    ) {
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
    const lastTimestampIndex = afterContent.lastIndexOf(lastTimestampAfter);
    const contentAfterLastTimestamp = afterContent.substring(
      lastTimestampIndex + lastTimestampAfter.length,
    );

    // Check if there's meaningful content after the last timestamp that wasn't there before
    const contentAfterBefore = beforeContent.substring(
      lastTimestampIndex + lastTimestampAfter.length,
    );

    return (
      contentAfterLastTimestamp.trim().length > contentAfterBefore.trim().length
    );
  }

  async postProcessAfterEdit(
    notePath: string,
    beforeContent: string,
    afterContent: string,
  ): Promise<void> {
    if (this.hasContentAddedBelowLastTimestamp(beforeContent, afterContent)) {
      // Add separator line at the end of the document
      let updatedContent = afterContent;

      // Check if separator already exists anywhere in the content
      if (!updatedContent.includes("---")) {
        // Ensure content ends with exactly one newline, then add separator
        if (!updatedContent.endsWith("\n")) {
          updatedContent += "\n";
        }
        updatedContent += "\n---\n\n";
        await this.fileSystemService.writeFile(notePath, updatedContent);
      }
      // If separator already exists, no need to write
    }
  }
}
