import React from 'react';
import { render } from 'ink-testing-library';
import { test, expect, describe } from 'vitest';
import Hello from '../../src/components/Hello.js';

describe('Hello Component', () => {
  test('should render "Hello, World!" by default', () => {
    const { lastFrame } = render(<Hello />);
    expect(lastFrame()).toContain('Hello, World!');
  });

  test('should render "Hello, {name}!" when name is provided', () => {
    const { lastFrame } = render(<Hello name="Alice" />);
    expect(lastFrame()).toContain('Hello, Alice!');
  });
});
