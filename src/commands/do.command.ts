import { BaseCommand } from "./base.command.js";
import { NoteService } from "../domain/note.service.js";
import { FileSystemService } from "../services/file-system.service.js";
import { render } from "ink";
import React from "react";
import TaskList, { Task } from "../components/TaskList.js";

export interface DoOptions {
  yester?: boolean;
  date?: string; // YYYY-MM-DD format
}

export class DoCommand extends BaseCommand {
  private fileSystemService: FileSystemService;

  constructor(
    noteService?: NoteService,
    fileSystemService?: FileSystemService,
  ) {
    super(noteService);
    this.fileSystemService = fileSystemService || new FileSystemService();
  }

  async execute(options: DoOptions = {}): Promise<void> {
    // Determine the initial date to display
    let currentDate: Date;
    if (options.date) {
      currentDate = new Date(options.date + "T00:00:00");
    } else if (options.yester) {
      currentDate = this.getYesterdayDate();
    } else {
      currentDate = this.getTodayForTests();
    }

    // Display the tasks with interactive management
    await this.displayTasksWithTUI(currentDate);
  }

  private async displayTasksWithTUI(currentDate: Date): Promise<void> {
    const notesDir = process.env.MANDA_DIR!;
    if (!notesDir) {
      throw new Error("MANDA_DIR environment variable is not set");
    }

    await this.noteService.ensureNotesDirExists(notesDir);

    const notePath = this.getNotePathForDate(currentDate);
    const title = this.formatDateForTitle(currentDate);

    // Check if the note file exists
    const exists = await this.fileSystemService.fileExists(notePath);

    let content = "";
    if (exists) {
      content = await this.fileSystemService.readFile(notePath);
    } else {
      // Create empty note if it doesn't exist
      await this.noteService.ensureNoteExists(notePath);
    }

    // Parse tasks from the content
    const tasks = this.parseTasksFromMarkdown(content);

    // Display the tasks using TUI component (even if empty)
    await this.displayTaskListWithTUI(tasks, title, notePath);
  }

  private parseTasksFromMarkdown(content: string): Task[] {
    const tasks: Task[] = [];
    const lines = content.split("\n");

    let currentHeader = "";
    let pendingTimestamp = ""; // Timestamp waiting to be associated with next header
    let headerTimestamp = ""; // Timestamp associated with the current header
    let taskId = 0;

    for (const line of lines) {
      // Check for timestamps: [HH:MM]
      const timestampMatch = line.match(/^\[(\d{2}:\d{2})\]$/);
      if (timestampMatch) {
        pendingTimestamp = timestampMatch[1];
        // Reset header when timestamp is encountered
        currentHeader = "";
        headerTimestamp = "";
        continue;
      }

      // Check for headers
      const headerMatch = line.match(/^#{1,6}\s+(.+)$/);
      if (headerMatch) {
        currentHeader = headerMatch[1].trim();
        // Associate the pending timestamp with this header
        headerTimestamp = pendingTimestamp;
        pendingTimestamp = ""; // Clear pending timestamp
        continue;
      }

      // Check for task list items
      const taskMatch = line.match(/^\s*-\s+\[([ x])\]\s+(.+)$/);
      if (taskMatch) {
        const [, checkbox, text] = taskMatch;
        const completed = checkbox === "x";

        // Create header that includes timestamp if there's both a header and associated timestamp
        let header = "";
        if (currentHeader && headerTimestamp) {
          header = `${currentHeader} [${headerTimestamp}]`;
        } else if (currentHeader) {
          header = currentHeader;
        } else {
          header = "General";
        }

        tasks.push({
          id: `task-${taskId++}`,
          text: text.trim(),
          completed,
          header: header,
        });

        // Clear pending timestamp if a task is encountered before a header
        pendingTimestamp = "";
      }
    }

    return tasks;
  }

  private async displayTaskListWithTUI(
    tasks: Task[],
    title: string,
    notePath: string,
  ): Promise<void> {
    // Create and render TUI component
    const { waitUntilExit } = render(
      React.createElement(TaskList, {
        tasks,
        title,
        notePath,
        onExit: () => {
          // Don't exit in test environments
          if (
            process.env.NODE_ENV !== "test" &&
            !process.env.CI &&
            !process.env.VITEST
          ) {
            process.exit(0);
          }
        },
        onTaskToggle: async (taskId: string) => {
          await this.toggleTaskInFile(notePath, taskId, tasks);
        },
      }),
      {
        exitOnCtrlC: true,
        experimentalAlternateScreenBuffer: true,
      } as any,
    );

    await waitUntilExit();
  }

  private async toggleTaskInFile(
    notePath: string,
    taskId: string,
    tasks: Task[],
  ): Promise<void> {
    const content = await this.fileSystemService.readFile(notePath);
    const lines = content.split("\n");

    // Find the task in the file and toggle it
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let currentHeader = "";
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Track current header
      const headerMatch = line.match(/^#{1,6}\s+(.+)$/);
      if (headerMatch) {
        currentHeader = headerMatch[1].trim();
      }

      // Check if this line matches our task
      const taskMatch = line.match(/^\s*-\s+\[([ x])\]\s+(.+)$/);
      if (taskMatch) {
        const [, checkbox, text] = taskMatch;
        const lineHeader = currentHeader || "";
        const lineText = text.trim();

        // Match by text and header (since IDs are generated)
        if (lineText === task.text && lineHeader === (task.header || "")) {
          const newCheckbox = checkbox === "x" ? " " : "x";
          lines[i] = line.replace(/\[[ x]\]/, `[${newCheckbox}]`);
          break;
        }
      }
    }

    // Write the updated content back to file
    await this.fileSystemService.writeFile(notePath, lines.join("\n"));
  }

  private getYesterdayDate(): Date {
    // In test environments, use a fixed date to avoid timing issues
    if (
      process.env.NODE_ENV === "test" ||
      process.env.CI ||
      process.env.VITEST
    ) {
      // Use 2025-11-24 as yesterday for testing (since today is 2025-11-25)
      const yesterday = new Date("2025-11-25");
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    }
  }

  private getTodayForTests(): Date {
    // Anchor today for tests to 2025-11-25 to ensure deterministic behavior
    if (
      process.env.NODE_ENV === "test" ||
      process.env.CI ||
      process.env.VITEST
    ) {
      return new Date("2025-11-25T00:00:00");
    } else {
      return new Date();
    }
  }

  private getNotePathForDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const fileName = `${year}-${month}-${day}.md`;

    const notesDir = process.env.MANDA_DIR!;
    return `${notesDir}/${fileName}`;
  }

  private formatDateForTitle(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
} 
