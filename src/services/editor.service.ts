import { spawn, execSync } from 'child_process';

export class EditorService {
  private defaultEditors = ['micro', 'vim', 'vi'];

  private isCommandAvailable(command: string): boolean {
    try {
      execSync(`command -v ${command}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  getEditor(): string {
    // Try EDITOR env variable
    if (process.env.EDITOR && this.isCommandAvailable(process.env.EDITOR)) {
      return process.env.EDITOR;
    }

    // Try VISUAL env variable
    if (process.env.VISUAL && this.isCommandAvailable(process.env.VISUAL)) {
      return process.env.VISUAL;
    }

    // Try default editors in order
    for (const editor of this.defaultEditors) {
      if (this.isCommandAvailable(editor)) {
        return editor;
      }
    }

    // Fallback to micro (should always be available)
    return 'micro';
  }

  async openFile(filePath: string): Promise<void> {
    // Skip opening editor in test environment
    if (process.env.NODE_ENV === 'test' || process.env.CI || process.env.VITEST) {
      return Promise.resolve();
    }

    const editor = this.getEditor();

    return new Promise((resolve, reject) => {
      const editorProcess = spawn(editor, [filePath], {
        stdio: 'inherit',
        shell: true,
      });

      editorProcess.on('exit', (code: number | null) => {
        if (code === 0 || code === null) {
          resolve();
        } else {
          reject(new Error(`Editor exited with code ${code}`));
        }
      });

      editorProcess.on('error', (err: Error) => {
        reject(err);
      });
    });
  }
}
