import { test, expect, describe, vi, beforeEach, afterEach } from "vitest";
import { execSync } from "child_process";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

describe("Manda Command Separator Integration Tests", () => {
  let tempDir: string;
  let notesDir: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(
      path.join(process.env.TMPDIR || "/tmp", "manda-separator-test-"),
    );
    notesDir = path.join(tempDir, "notes");
    await fs.mkdir(notesDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up the temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const runMandaCommand = () => {
    const env = {
      ...process.env,
      MANDA_DIR: notesDir,
      EDITOR: "echo", // Use echo as fake editor to avoid hanging
    };
    return execSync(`node dist/main.js`, {
      env,
      cwd: process.cwd(),
      encoding: "utf8",
    });
  };

  const getTodayFileName = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}.md`;
  };

  const readNoteFile = async () => {
    const notePath = path.join(notesDir, getTodayFileName());
    return await fs.readFile(notePath, "utf8");
  };

  const writeNoteFile = async (content: string) => {
    const notePath = path.join(notesDir, getTodayFileName());
    await fs.writeFile(notePath, content, "utf8");
  };

  test("should add separator when content is added below timestamp", async () => {
    // Create initial note with timestamp
    await writeNoteFile("# Meeting Notes\n[10:30]");

    // Simulate user adding content after timestamp by directly modifying file
    const beforeContent = await readNoteFile();
    const afterContent = "# Meeting Notes\n[10:30]\nDiscussion about project";
    await writeNoteFile(afterContent);

    // Test post-processing directly
    const noteService = new (
      await import("../../src/domain/note.service.js")
    ).NoteService(
      new (
        await import("../../src/services/file-system.service.js")
      ).FileSystemService(),
    );
    await noteService.postProcessAfterEdit(
      path.join(notesDir, getTodayFileName()),
      beforeContent,
      afterContent,
    );

    const finalContent = await readNoteFile();
    expect(finalContent).toContain("# Meeting Notes");
    expect(finalContent).toContain("[10:30]");
    expect(finalContent).toContain("Discussion about project");
    expect(finalContent).toContain("---");
    expect(finalContent).toMatch(/\n\n---\n\n$/);
  });

  test("should not add separator when no content is added below timestamp", async () => {
    // Create initial note with timestamp
    await writeNoteFile("# Meeting Notes\n[10:30]");

    // Test post-processing directly
    const beforeContent = await readNoteFile();
    const afterContent = "# Meeting Notes\n[10:30]";

    const noteService = new (
      await import("../../src/domain/note.service.js")
    ).NoteService(
      new (
        await import("../../src/services/file-system.service.js")
      ).FileSystemService(),
    );
    await noteService.postProcessAfterEdit(
      path.join(notesDir, getTodayFileName()),
      beforeContent,
      afterContent,
    );

    const finalContent = await readNoteFile();
    expect(finalContent).toContain("# Meeting Notes");
    expect(finalContent).toContain("[10:30]");
    expect(finalContent).not.toContain("---");
  });

  test("should not add separator when only whitespace is added below timestamp", async () => {
    // Create initial note with timestamp
    await writeNoteFile("# Meeting Notes\n[10:30]");

    // Test post-processing directly
    const beforeContent = await readNoteFile();
    const afterContent = "# Meeting Notes\n[10:30]\n   \n  ";

    const noteService = new (
      await import("../../src/domain/note.service.js")
    ).NoteService(
      new (
        await import("../../src/services/file-system.service.js")
      ).FileSystemService(),
    );
    await noteService.postProcessAfterEdit(
      path.join(notesDir, getTodayFileName()),
      beforeContent,
      afterContent,
    );

    const finalContent = await readNoteFile();
    expect(finalContent).toContain("# Meeting Notes");
    expect(finalContent).toContain("[10:30]");
    expect(finalContent).not.toContain("---");
  });

  test("should not add separator when content is added before timestamp", async () => {
    // Create initial note with timestamp
    await writeNoteFile("# Meeting Notes\n[10:30]");

    // Test post-processing directly
    const beforeContent = await readNoteFile();
    const afterContent = "# Updated Meeting Notes\n[10:30]";
    await writeNoteFile(afterContent); // Write the modified content

    const noteService = new (
      await import("../../src/domain/note.service.js")
    ).NoteService(
      new (
        await import("../../src/services/file-system.service.js")
      ).FileSystemService(),
    );

    // Verify hasContentAddedBelowLastTimestamp returns false
    const hasContent = (noteService as any).hasContentAddedBelowLastTimestamp(
      beforeContent,
      afterContent,
    );
    expect(hasContent).toBe(false);

    await noteService.postProcessAfterEdit(
      path.join(notesDir, getTodayFileName()),
      beforeContent,
      afterContent,
    );

    const finalContent = await readNoteFile();
    expect(finalContent).toContain("# Updated Meeting Notes");
    expect(finalContent).toContain("[10:30]");
    expect(finalContent).not.toContain("---");
  });

  test("should not add separator when new timestamp is added", async () => {
    // Create initial note with timestamp
    await writeNoteFile("# Meeting Notes\n[10:30]");

    // Test post-processing directly
    const beforeContent = await readNoteFile();
    const afterContent = "# Meeting Notes\n[10:30]\n[11:00] More discussion";
    await writeNoteFile(afterContent); // Write the modified content

    const noteService = new (
      await import("../../src/domain/note.service.js")
    ).NoteService(
      new (
        await import("../../src/services/file-system.service.js")
      ).FileSystemService(),
    );

    // Verify hasContentAddedBelowLastTimestamp returns false (timestamp count changed)
    const hasContent = (noteService as any).hasContentAddedBelowLastTimestamp(
      beforeContent,
      afterContent,
    );
    expect(hasContent).toBe(false);

    await noteService.postProcessAfterEdit(
      path.join(notesDir, getTodayFileName()),
      beforeContent,
      afterContent,
    );

    const finalContent = await readNoteFile();
    expect(finalContent).toContain("# Meeting Notes");
    expect(finalContent).toContain("[10:30]");
    expect(finalContent).toContain("[11:00]");
    expect(finalContent).not.toContain("---");
  });

  test("should not add duplicate separator when already present", async () => {
    // Create initial note with timestamp and separator
    await writeNoteFile("# Meeting Notes\n[10:30]\nDiscussion\n\n---\n\n");

    // Test post-processing directly
    const beforeContent = await readNoteFile();
    const afterContent =
      "# Meeting Notes\n[10:30]\nDiscussion\n\n---\n\nAdditional notes";
    await writeNoteFile(afterContent); // Write the modified content

    const noteService = new (
      await import("../../src/domain/note.service.js")
    ).NoteService(
      new (
        await import("../../src/services/file-system.service.js")
      ).FileSystemService(),
    );

    // Verify hasContentAddedBelowLastTimestamp returns true but separator already exists
    const hasContent = (noteService as any).hasContentAddedBelowLastTimestamp(
      beforeContent,
      afterContent,
    );
    expect(hasContent).toBe(true);

    await noteService.postProcessAfterEdit(
      path.join(notesDir, getTodayFileName()),
      beforeContent,
      afterContent,
    );

    const finalContent = await readNoteFile();
    expect(finalContent).toContain("# Meeting Notes");
    expect(finalContent).toContain("[10:30]");
    expect(finalContent).toContain("Discussion");
    expect(finalContent).toContain("Additional notes");
    // Should have only one separator (the existing one)
    const separatorCount = (finalContent.match(/---/g) || []).length;
    expect(separatorCount).toBe(1);
  });

  test("should handle complex note structure correctly", async () => {
    // Create complex note structure
    await writeNoteFile(`# Project Status

## Completed Tasks
- [x] Setup repository
- [x] Initial commit

## Current Work
[14:20]

## Notes
Some important notes here`);

    // Test post-processing directly
    const beforeContent = await readNoteFile();
    const afterContent = `# Project Status

## Completed Tasks
- [x] Setup repository
- [x] Initial commit

## Current Work
[14:20]
Working on new feature implementation

## Notes
Some important notes here`;

    const noteService = new (
      await import("../../src/domain/note.service.js")
    ).NoteService(
      new (
        await import("../../src/services/file-system.service.js")
      ).FileSystemService(),
    );
    await noteService.postProcessAfterEdit(
      path.join(notesDir, getTodayFileName()),
      beforeContent,
      afterContent,
    );

    const finalContent = await readNoteFile();
    expect(finalContent).toContain("# Project Status");
    expect(finalContent).toContain("## Completed Tasks");
    expect(finalContent).toContain("- [x] Setup repository");
    expect(finalContent).toContain("- [x] Initial commit");
    expect(finalContent).toContain("## Current Work");
    expect(finalContent).toContain("[14:20]");
    expect(finalContent).toContain("Working on new feature implementation");
    expect(finalContent).toContain("## Notes");
    expect(finalContent).toContain("Some important notes here");
    expect(finalContent).toContain("---");
    expect(finalContent).toMatch(/\n\n---\n\n$/);
  });
});
