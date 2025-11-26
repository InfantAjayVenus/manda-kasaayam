import simpleGit, { SimpleGit } from 'simple-git';

export class GitService {
  private git: SimpleGit;

  constructor() {
    this.git = simpleGit();
  }

  async commitAndPush(notePath: string, commitMessage: string): Promise<void> {
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
      if (process.env.NODE_ENV !== 'test' && !process.env.CI && !process.env.VITEST) {
        console.warn('Git operation failed:', error);
      }
    }
  }

  getCurrentTimestampCommitMessage(): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const time = now.toISOString().slice(11, 19); // HH:MM:SS
    return `${date} ${time}`;
  }
}