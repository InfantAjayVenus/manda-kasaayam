import { execSync, spawn } from 'child_process';
import { AppConfig, getEditorFromEnvironment, isTestEnvironment } from '../config/index.js';

export class EditorService {
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
    const envEditor = getEditorFromEnvironment();
    if (envEditor && this.isCommandAvailable(envEditor)) {
      return envEditor;
    }

    // Try VISUAL env variable
    if (process.env.VISUAL && this.isCommandAvailable(process.env.VISUAL)) {
      return process.env.VISUAL;
    }

    // Try preferred editors in order
    for (const editor of AppConfig.editors.preferredOrder) {
      if (this.isCommandAvailable(editor)) {
        return editor;
      }
    }

    // Fallback to configured fallback editor
    return AppConfig.editors.fallback;
  }

  async openFile(filePath: string): Promise<void> {
    // Skip opening editor in test environment
    if (isTestEnvironment()) {
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
