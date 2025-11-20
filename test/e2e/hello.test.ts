import { execSync } from 'child_process';
import { test, expect, describe } from 'vitest';

describe('Hello World CLI', () => {
  test('running "manda hello" should display Hello, World!', () => {
    const output = execSync('pnpm tsx src/main.ts hello').toString();
    expect(output).toContain('Hello, World!');
  });

  test('running "manda hello --name Alice" should display Hello, Alice!', () => {
    const output = execSync('pnpm tsx src/main.ts hello --name Alice').toString();
    expect(output).toContain('Hello, Alice!');
  });
});
