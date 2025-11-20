import { test, expect, describe, vi, beforeEach, afterEach } from "vitest";
import { NoteService } from "../../src/domain/note.service.js";
import { FileSystemService } from "../../src/services/file-system.service.js";

vi.mock("../../src/services/file-system.service.js");

describe("NoteService", () => {
  let service: NoteService;
  let mockFileSystemService: FileSystemService;

  beforeEach(() => {
    mockFileSystemService = new FileSystemService();
    service = new NoteService(mockFileSystemService);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getTodayFileName", () => {
    test("should return file name in YYYY-MM-DD.md format", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-11-19T10:00:00Z"));

      const fileName = service.getTodayFileName();

      expect(fileName).toBe("2025-11-19.md");
    });

    test("should pad single digit month and day with zero", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-05T10:00:00Z"));

      const fileName = service.getTodayFileName();

      expect(fileName).toBe("2025-01-05.md");
    });
  });

  describe("getNotePath", () => {
    test("should return full path to today's note", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-11-19T10:00:00Z"));

      const notePath = service.getNotePath("/notes");

      expect(notePath).toBe("/notes/2025-11-19.md");
    });
  });

  describe("ensureNoteExists", () => {
    test("should create note file if it does not exist", async () => {
      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(false);
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.ensureNoteExists("/notes/2025-11-19.md");

      expect(mockFileSystemService.fileExists).toHaveBeenCalledWith(
        "/notes/2025-11-19.md",
      );
      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        "/notes/2025-11-19.md",
        "",
      );
    });

    test("should not create note file if it already exists", async () => {
      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);

      await service.ensureNoteExists("/notes/2025-11-19.md");

      expect(mockFileSystemService.fileExists).toHaveBeenCalledWith(
        "/notes/2025-11-19.md",
      );
      expect(mockFileSystemService.writeFile).not.toHaveBeenCalled();
    });
  });

  describe("ensureNotesDirExists", () => {
    test("should ensure notes directory exists", async () => {
      vi.mocked(mockFileSystemService.ensureDirectoryExists).mockResolvedValue(
        undefined,
      );

      await service.ensureNotesDirExists("/notes");

      expect(mockFileSystemService.ensureDirectoryExists).toHaveBeenCalledWith(
        "/notes",
      );
    });
  });

  describe("getCurrentTimeString", () => {
    test("should return current time in HH:mm format", () => {
      const timeString = service.getCurrentTimeString();

      // Should match HH:mm format
      expect(timeString).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe("hasContentAfterLastTimestamp", () => {
    test("should return true when no timestamps exist", () => {
      const content = "# Note without timestamps\nSome content here";

      // Access private method through type assertion
      const hasContent = (service as any).hasContentAfterLastTimestamp(content);

      expect(hasContent).toBe(true);
    });

    test("should return true when there is content after last timestamp", () => {
      const content = "# Note\n[10:30]\nSome content after timestamp";

      const hasContent = (service as any).hasContentAfterLastTimestamp(content);

      expect(hasContent).toBe(true);
    });

    test("should return false when there is only whitespace after last timestamp", () => {
      const content = "# Note\n[10:30]\n   \n  ";

      const hasContent = (service as any).hasContentAfterLastTimestamp(content);

      expect(hasContent).toBe(false);
    });

    test("should return false when timestamp is at the end of file", () => {
      const content = "# Note\n[10:30]";

      const hasContent = (service as any).hasContentAfterLastTimestamp(content);

      expect(hasContent).toBe(false);
    });

    test("should return false when timestamp is followed only by newline", () => {
      const content = "# Note\n[10:30]\n";

      const hasContent = (service as any).hasContentAfterLastTimestamp(content);

      expect(hasContent).toBe(false);
    });

    test("should handle multiple timestamps correctly", () => {
      const content = "# Note\n[09:00]\nMorning content\n[10:30]";

      const hasContent = (service as any).hasContentAfterLastTimestamp(content);

      expect(hasContent).toBe(false);
    });

    test("should return true when last timestamp has content after it", () => {
      const content =
        "# Note\n[09:00]\nMorning content\n[10:30]\nAfternoon content";

      const hasContent = (service as any).hasContentAfterLastTimestamp(content);

      expect(hasContent).toBe(true);
    });
  });

  describe("appendTimestampLink", () => {
    test("should append timestamp link to existing file", async () => {
      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue(
        "# Existing Note\n\nSome content",
      );
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.appendTimestampLink("/notes/2025-11-19.md");

      expect(mockFileSystemService.fileExists).toHaveBeenCalledWith(
        "/notes/2025-11-19.md",
      );
      expect(mockFileSystemService.readFile).toHaveBeenCalledWith(
        "/notes/2025-11-19.md",
      );
      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        "/notes/2025-11-19.md",
        expect.stringContaining("# Existing Note"),
      );
      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        "/notes/2025-11-19.md",
        expect.stringContaining("Some content"),
      );
      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        "/notes/2025-11-19.md",
        expect.stringMatching(/\[\d{2}:\d{2}\]/),
      );
    });

    test("should append timestamp link to empty file", async () => {
      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue("");
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.appendTimestampLink("/notes/2025-11-19.md");

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        "/notes/2025-11-19.md",
        expect.stringMatching(/^\[\d{2}:\d{2}\]\n$/),
      );
    });

    test("should create file and append timestamp link if file does not exist", async () => {
      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(false);
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.appendTimestampLink("/notes/2025-11-19.md");

      expect(mockFileSystemService.fileExists).toHaveBeenCalledWith(
        "/notes/2025-11-19.md",
      );
      expect(mockFileSystemService.readFile).not.toHaveBeenCalled();
      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        "/notes/2025-11-19.md",
        expect.stringMatching(/^\[\d{2}:\d{2}\]\n$/),
      );
    });

    test("should add newline before timestamp if file content does not end with newline", async () => {
      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue(
        "# Note without newline at end",
      );
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.appendTimestampLink("/notes/2025-11-19.md");

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        "/notes/2025-11-19.md",
        expect.stringMatching(
          /^# Note without newline at end\s+\[\d{2}:\d{2}\]\n$/,
        ),
      );
    });

    test("should not add extra newline if file already ends with newline", async () => {
      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue(
        "# Note ending with newline\n",
      );
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.appendTimestampLink("/notes/2025-11-19.md");

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        "/notes/2025-11-19.md",
        expect.stringMatching(
          /^# Note ending with newline\s+\[\d{2}:\d{2}\]\n$/,
        ),
      );
    });

    test("should replace last timestamp when there is no content after it", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-11-19T14:30:00Z"));

      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue(
        "# Note\n[10:30]",
      );
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.appendTimestampLink("/notes/2025-11-19.md");

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        "/notes/2025-11-19.md",
        "# Note\n[20:00]",
      );
    });

    test("should replace last timestamp when there is only whitespace after it", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-11-19T14:30:00Z"));

      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue(
        "# Note\n[10:30]\n   \n  ",
      );
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.appendTimestampLink("/notes/2025-11-19.md");

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        "/notes/2025-11-19.md",
        "# Note\n[20:00]\n   \n  ",
      );
    });

    test("should replace last timestamp when it is followed only by newline", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-11-19T14:30:00Z"));

      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue(
        "# Note\n[10:30]\n",
      );
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.appendTimestampLink("/notes/2025-11-19.md");

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        "/notes/2025-11-19.md",
        "# Note\n[20:00]\n",
      );
    });

    test("should append new timestamp when there is content after last timestamp", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-11-19T14:30:00Z"));

      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue(
        "# Note\n[10:30]\nSome content here",
      );
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.appendTimestampLink("/notes/2025-11-19.md");

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        "/notes/2025-11-19.md",
        "# Note\n[10:30]\nSome content here\n[20:00]\n",
      );
    });

    test("should replace the last timestamp when there are multiple timestamps and no content after the last one", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-11-19T14:30:00Z"));

      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue(
        "# Note\n[09:00]\nMorning content\n[10:30]",
      );
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.appendTimestampLink("/notes/2025-11-19.md");

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        "/notes/2025-11-19.md",
        "# Note\n[09:00]\nMorning content\n[20:00]",
      );
    });

    test("should append new timestamp when there are multiple timestamps with content after the last one", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-11-19T14:30:00Z"));

      vi.mocked(mockFileSystemService.fileExists).mockResolvedValue(true);
      vi.mocked(mockFileSystemService.readFile).mockResolvedValue(
        "# Note\n[09:00]\nMorning content\n[10:30]\nAfternoon content",
      );
      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.appendTimestampLink("/notes/2025-11-19.md");

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        "/notes/2025-11-19.md",
        "# Note\n[09:00]\nMorning content\n[10:30]\nAfternoon content\n[20:00]\n",
      );
    });
  });

  describe("hasContentAddedBelowLastTimestamp", () => {
    test("should return false when no timestamps exist", () => {
      const before = "# Note without timestamps";
      const after = "# Note without timestamps\nSome content";

      const hasContent = (service as any).hasContentAddedBelowLastTimestamp(
        before,
        after,
      );

      expect(hasContent).toBe(false);
    });

    test("should return false when timestamp count changed", () => {
      const before = "# Note\n[10:30]";
      const after = "# Note\n[10:30]\n[11:00] Some content";

      const hasContent = (service as any).hasContentAddedBelowLastTimestamp(
        before,
        after,
      );

      expect(hasContent).toBe(false);
    });

    test("should return false when last timestamp changed", () => {
      const before = "# Note\n[10:30]";
      const after = "# Note\n[11:00]";

      const hasContent = (service as any).hasContentAddedBelowLastTimestamp(
        before,
        after,
      );

      expect(hasContent).toBe(false);
    });

    test("should return true when content is added after last timestamp", () => {
      const before = "# Note\n[10:30]";
      const after = "# Note\n[10:30]\nSome new content";

      const hasContent = (service as any).hasContentAddedBelowLastTimestamp(
        before,
        after,
      );

      expect(hasContent).toBe(true);
    });

    test("should return true when content is added after last timestamp with existing content", () => {
      const before = "# Note\n[10:30]\nExisting content";
      const after = "# Note\n[10:30]\nExisting content\nNew content";

      const hasContent = (service as any).hasContentAddedBelowLastTimestamp(
        before,
        after,
      );

      expect(hasContent).toBe(true);
    });

    test("should return false when only whitespace is added after last timestamp", () => {
      const before = "# Note\n[10:30]";
      const after = "# Note\n[10:30]\n   \n  ";

      const hasContent = (service as any).hasContentAddedBelowLastTimestamp(
        before,
        after,
      );

      expect(hasContent).toBe(false);
    });

    test("should return false when content is added before last timestamp", () => {
      const before = "Content\n[10:30]";
      const after = "New content\n[10:30]";

      const hasContent = (service as any).hasContentAddedBelowLastTimestamp(
        before,
        after,
      );

      expect(hasContent).toBe(false);
    });
  });

  describe("postProcessAfterEdit", () => {
    test("should add separator when content is added below last timestamp", async () => {
      const before = "# Note\n[10:30]";
      const after = "# Note\n[10:30]\nSome new content";

      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.postProcessAfterEdit("/test/note.md", before, after);

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        "/test/note.md",
        "# Note\n[10:30]\nSome new content\n\n---\n\n",
      );
    });

    test("should not add separator when no content is added below last timestamp", async () => {
      const before = "# Note\n[10:30]";
      const after = "# Note\n[10:30]";

      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.postProcessAfterEdit("/test/note.md", before, after);

      expect(mockFileSystemService.writeFile).not.toHaveBeenCalled();
    });

    test("should not add separator when only whitespace is added below last timestamp", async () => {
      const before = "# Note\n[10:30]";
      const after = "# Note\n[10:30]\n   \n  ";

      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.postProcessAfterEdit("/test/note.md", before, after);

      expect(mockFileSystemService.writeFile).not.toHaveBeenCalled();
    });

    test("should not add separator when timestamp count changed", async () => {
      const before = "# Note\n[10:30]";
      const after = "# Note\n[10:30]\n[11:00] Some content";

      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.postProcessAfterEdit("/test/note.md", before, after);

      expect(mockFileSystemService.writeFile).not.toHaveBeenCalled();
    });

    test("should not add separator when last timestamp changed", async () => {
      const before = "# Note\n[10:30]";
      const after = "# Note\n[11:00]";

      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.postProcessAfterEdit("/test/note.md", before, after);

      expect(mockFileSystemService.writeFile).not.toHaveBeenCalled();
    });

    test("should not add duplicate separator when already present", async () => {
      const before = "# Note\n[10:30]";
      const after = "# Note\n[10:30]\nSome new content\n---\n\n";

      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.postProcessAfterEdit("/test/note.md", before, after);

      // Content was added but separator already exists, so no modification needed
      expect(mockFileSystemService.writeFile).not.toHaveBeenCalled();
    });

    test("should add separator when content does not end with newline", async () => {
      const before = "# Note\n[10:30]";
      const after = "# Note\n[10:30]\nSome new content";

      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.postProcessAfterEdit("/test/note.md", before, after);

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        "/test/note.md",
        "# Note\n[10:30]\nSome new content\n\n---\n\n",
      );
    });

    test("should add separator when content already ends with newline", async () => {
      const before = "# Note\n[10:30]";
      const after = "# Note\n[10:30]\nSome new content\n";

      vi.mocked(mockFileSystemService.writeFile).mockResolvedValue(undefined);

      await service.postProcessAfterEdit("/test/note.md", before, after);

      expect(mockFileSystemService.writeFile).toHaveBeenCalledWith(
        "/test/note.md",
        "# Note\n[10:30]\nSome new content\n\n---\n\n",
      );
    });
  });
});
