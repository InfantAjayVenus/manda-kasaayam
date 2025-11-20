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

  test('running "manda" should open existing note file and append timestamp', () => {
    const today = new Date().toISOString().slice(0, 10);
    const noteFile = path.join(tempDir, `${today}.md`);
    const existingContent = '# Existing note\n\nSome content';

    fs.writeFileSync(noteFile, existingContent);

    execSync(`MANDA_DIR=${tempDir} pnpm tsx src/main.ts`, { stdio: 'pipe' });

    const content = fs.readFileSync(noteFile, 'utf-8');
    expect(content).toContain(existingContent);
    expect(fs.existsSync(noteFile)).toBe(true);
    
    // Should contain timestamp link
    const timestampRegex = /\[\d{2}:\d{2}\]/;
    expect(content).toMatch(timestampRegex);
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

  test('running "manda" should append timestamp link to new note file', () => {
    const today = new Date().toISOString().slice(0, 10);
    const expectedFile = path.join(tempDir, `${today}.md`);

    execSync(`MANDA_DIR=${tempDir} pnpm tsx src/main.ts`, { stdio: 'pipe' });

    expect(fs.existsSync(expectedFile)).toBe(true);
    const content = fs.readFileSync(expectedFile, 'utf-8');
    
    // Should contain timestamp link in [HH:mm] format
    const timestampRegex = /\[\d{2}:\d{2}\]/;
    expect(content).toMatch(timestampRegex);
    
    // Should end with newline
    expect(content).toMatch(/\n$/);
  });

  test('running "manda" should append timestamp link to existing note file', () => {
    const today = new Date().toISOString().slice(0, 10);
    const noteFile = path.join(tempDir, `${today}.md`);
    const existingContent = '# Existing note\n\nSome content';

    fs.writeFileSync(noteFile, existingContent);

    execSync(`MANDA_DIR=${tempDir} pnpm tsx src/main.ts`, { stdio: 'pipe' });

    const content = fs.readFileSync(noteFile, 'utf-8');
    
    // Should contain original content
    expect(content).toContain(existingContent);
    
    // Should contain timestamp link in [HH:mm] format
    const timestampRegex = /\[\d{2}:\d{2}\]/;
    expect(content).toMatch(timestampRegex);
    
    // Should end with newline
    expect(content).toMatch(/\n$/);
  });

  test('running "manda" should add newline before timestamp if content does not end with newline', () => {
    const today = new Date().toISOString().slice(0, 10);
    const noteFile = path.join(tempDir, `${today}.md`);
    const existingContent = '# Note without newline at end';

    fs.writeFileSync(noteFile, existingContent);

    execSync(`MANDA_DIR=${tempDir} pnpm tsx src/main.ts`, { stdio: 'pipe' });

    const content = fs.readFileSync(noteFile, 'utf-8');
    
    // Should contain original content
    expect(content).toContain(existingContent);
    
    // Should contain timestamp link immediately after content
    const timestampRegex = /# Note without newline at end\n\[\d{2}:\d{2}\]\n$/;
    expect(content).toMatch(timestampRegex);
  });
});
