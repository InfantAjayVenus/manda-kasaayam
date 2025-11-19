import { execSync } from 'child_process';
import { test, expect, describe, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';

describe('Manda Note Creation E2E', () => {
  let tempDir: string;
  let originalEditor: string | undefined;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'manda-test-'));
    originalEditor = process.env.EDITOR;
    process.env.EDITOR = 'echo';
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    if (originalEditor) {
      process.env.EDITOR = originalEditor;
    } else {
      delete process.env.EDITOR;
    }
  });

  test('running "manda" should create a note file with current date if it does not exist', () => {
    const today = new Date().toISOString().slice(0, 10);
    const expectedFile = path.join(tempDir, `${today}.md`);

    expect(fs.existsSync(expectedFile)).toBe(false);

    execSync(`MANDA_DIR=${tempDir} pnpm tsx src/main.ts`, { stdio: 'pipe' });

    expect(fs.existsSync(expectedFile)).toBe(true);
  });

  test('running "manda" should open existing note file if it already exists', () => {
    const today = new Date().toISOString().slice(0, 10);
    const noteFile = path.join(tempDir, `${today}.md`);
    const existingContent = '# Existing note\n\nSome content';

    fs.writeFileSync(noteFile, existingContent);

    execSync(`MANDA_DIR=${tempDir} pnpm tsx src/main.ts`, { stdio: 'pipe' });

    const content = fs.readFileSync(noteFile, 'utf-8');
    expect(content).toBe(existingContent);
    expect(fs.existsSync(noteFile)).toBe(true);
  });

  test('running "manda" should fail if MANDA_DIR is not set', () => {
    expect(() => {
      execSync('pnpm tsx src/main.ts', { 
        stdio: 'pipe',
        env: { ...process.env, MANDA_DIR: '' }
      });
    }).toThrow();
  });

  test('running "manda" should create MANDA_DIR if it does not exist', () => {
    const nonExistentDir = path.join(tempDir, 'nested', 'path');
    expect(fs.existsSync(nonExistentDir)).toBe(false);

    execSync(`MANDA_DIR=${nonExistentDir} pnpm tsx src/main.ts`, { stdio: 'pipe' });

    expect(fs.existsSync(nonExistentDir)).toBe(true);
    const today = new Date().toISOString().slice(0, 10);
    const expectedFile = path.join(nonExistentDir, `${today}.md`);
    expect(fs.existsSync(expectedFile)).toBe(true);
  });
});
