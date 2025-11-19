import { execSync } from 'child_process';
import { test, expect, describe } from 'vitest';

describe('Hello World CLI', () => {
  test('running "manda manda" should display Hello, World!', () => {
    const output = execSync('pnpm tsx src/main.ts manda').toString();
    expect(output).toContain('Hello, World!');
  });

  test('running "manda manda --name Alice" should display Hello, Alice!', () => {
    const output = execSync('pnpm tsx src/main.ts manda --name Alice').toString();
    expect(output).toContain('Hello, Alice!');
  });
});
