import simpleGit, { SimpleGit } from 'simple-git';
import { AppConfig, formatTimestamp, isTestEnvironment } from '../config/index.js';

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
      // If git operations fail, we don't want to break the note-taking flow
      // Just silently ignore git errors (don't log in test environments)
      if (!isTestEnvironment()) {
        console.warn('Git operation failed:', error);
      }
    }
  }

  getCurrentTimestampCommitMessage(): string {
    return formatTimestamp();
  }
}