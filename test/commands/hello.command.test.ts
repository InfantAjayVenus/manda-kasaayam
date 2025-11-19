import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest';
import { HelloCommand } from '../../src/commands/hello.command.js';
import * as ink from 'ink';

vi.mock('ink', async () => {
  const actual = await vi.importActual('ink');
  return {
    ...actual,
    render: vi.fn(() => ({ unmount: vi.fn(), waitUntilExit: vi.fn() })),
  };
});

describe('HelloCommand', () => {
  let renderSpy: any;

  beforeEach(() => {
    renderSpy = vi.mocked(ink.render);
    renderSpy.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('should render Hello component with default name', () => {
    const command = new HelloCommand();
    command.execute({});

    expect(renderSpy).toHaveBeenCalledTimes(1);
    const callArgs = renderSpy.mock.calls[0][0];
    expect(callArgs.type.name).toBe('Hello');
    expect(callArgs.props.name).toBeUndefined();
  });

  test('should render Hello component with provided name', () => {
    const command = new HelloCommand();
    command.execute({ name: 'Alice' });

    expect(renderSpy).toHaveBeenCalledTimes(1);
    const callArgs = renderSpy.mock.calls[0][0];
    expect(callArgs.type.name).toBe('Hello');
    expect(callArgs.props.name).toBe('Alice');
  });
});
