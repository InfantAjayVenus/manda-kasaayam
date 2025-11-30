import simpleGit, { SimpleGit } from 'simple-git';
import { AppConfig, formatTimestamp, isTestEnvironment } from '../config/index.js';
import { ErrorHandler } from '../utils/errorHandler.js';

export class GitService {
  private git: SimpleGit;

  constructor() {
    this.git = simpleGit();
  }

  async commitAndPush(notePath: string, commitMessage: string): Promise<void> {
    // Skip git operations if disabled in config
    if (!AppConfig.git.enabled) {
      return;
    }

    try {
      // Check if we're in a git repository
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        // Not a git repository, skip git operations
        return;
      }

      // Add the note file to staging
      await this.git.add(notePath);

      // Check if there are any changes to commit
      const status = await this.git.status();
      if (status.staged.length === 0 && status.modified.length === 0) {
        // No changes to commit
        return;
      }

      // Commit the changes
      await this.git.commit(commitMessage);

      // Push to the default remote (origin) and current branch
      await this.git.push();
    } catch (error) {
      // For git operations, we want to log but not break the note-taking flow
      // Use centralized error handling but don't throw to avoid breaking note-taking
      const gitError = ErrorHandler.handleGitError(error as Error, 'commitAndPush');

      // Log the error but don't throw - git failures should not break note creation
      if (!isTestEnvironment()) {
        // eslint-disable-next-line no-console
        console.warn('Git operation failed:', gitError.message);
      }
      // In test environment, we silently ignore to avoid breaking tests
    }
  }

  getCurrentTimestampCommitMessage(): string {
    return formatTimestamp();
  }
}
