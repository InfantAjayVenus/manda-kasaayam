import { beforeEach, describe, expect, test, vi } from 'vitest';
import { GitService } from '../../src/services/git.service.js';

// Mock simple-git
const mockCheckIsRepo = vi.fn();
const mockAdd = vi.fn();
const mockStatus = vi.fn();
const mockCommit = vi.fn();
const mockPush = vi.fn();

vi.mock('simple-git', () => ({
  default: vi.fn(() => ({
    checkIsRepo: mockCheckIsRepo,
    add: mockAdd,
    status: mockStatus,
    commit: mockCommit,
    push: mockPush,
  })),
}));

describe('GitService', () => {
  let gitService: GitService;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    gitService = new GitService();
  });

  test('should skip git operations if not in a git repository', async () => {
    mockCheckIsRepo.mockResolvedValue(false);

    await gitService.commitAndPush('/path/to/note.md', 'test commit');

    expect(mockCheckIsRepo).toHaveBeenCalled();
    expect(mockAdd).not.toHaveBeenCalled();
    expect(mockStatus).not.toHaveBeenCalled();
    expect(mockCommit).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test('should skip commit if no changes to commit', async () => {
    mockCheckIsRepo.mockResolvedValue(true);
    mockAdd.mockResolvedValue(undefined);
    mockStatus.mockResolvedValue({
      staged: [],
      modified: [],
    });

    await gitService.commitAndPush('/path/to/note.md', 'test commit');

    expect(mockCheckIsRepo).toHaveBeenCalled();
    expect(mockAdd).toHaveBeenCalledWith('/path/to/note.md');
    expect(mockStatus).toHaveBeenCalled();
    expect(mockCommit).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test('should commit and push when there are changes', async () => {
    mockCheckIsRepo.mockResolvedValue(true);
    mockAdd.mockResolvedValue(undefined);
    mockStatus.mockResolvedValue({
      staged: ['note.md'],
      modified: [],
    });
    mockCommit.mockResolvedValue(undefined);
    mockPush.mockResolvedValue(undefined);

    await gitService.commitAndPush('/path/to/note.md', 'test commit');

    expect(mockCheckIsRepo).toHaveBeenCalled();
    expect(mockAdd).toHaveBeenCalledWith('/path/to/note.md');
    expect(mockStatus).toHaveBeenCalled();
    expect(mockCommit).toHaveBeenCalledWith('test commit');
    expect(mockPush).toHaveBeenCalled();
  });

  test('should handle git operation errors gracefully', async () => {
    mockCheckIsRepo.mockRejectedValue(new Error('Git error'));

    // Should not throw
    await expect(
      gitService.commitAndPush('/path/to/note.md', 'test commit'),
    ).resolves.toBeUndefined();
  });

  test('getCurrentTimestampCommitMessage should return formatted timestamp', () => {
    // Mock Date to return a fixed local date (avoid timezone issues)
    const fixedDate = new Date(2025, 10, 19, 10, 30, 45); // Nov 19, 2025, 10:30:45 local time
    vi.useFakeTimers();
    vi.setSystemTime(fixedDate);

    const message = gitService.getCurrentTimestampCommitMessage();

    expect(message).toBe('2025-11-19 10:30:45'); // Matches the fake timer setting

    // Restore timers
    vi.useRealTimers();
  });
});
