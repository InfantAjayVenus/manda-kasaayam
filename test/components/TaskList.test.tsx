import React from 'react';
import { render } from 'ink-testing-library';
import { test, expect, vi } from 'vitest';
import TaskList, { Task } from '../../src/components/TaskList';

test('TaskList should render tasks with correct status indicators', () => {
  const tasks: Task[] = [
    { id: '1', text: 'Task 1', completed: false, header: 'Work' },
    { id: '2', text: 'Task 2', completed: true, header: 'Personal' },
    { id: '3', text: 'Task 3', completed: false }
  ];

  const { lastFrame } = render(<TaskList tasks={tasks} />);

  expect(lastFrame()).toContain('[ ] Task 1');
  expect(lastFrame()).toContain('[✓] Task 2');
  expect(lastFrame()).toContain('[ ] Task 3');
  expect(lastFrame()).toContain('(Work)');
  expect(lastFrame()).toContain('(Personal)');
});

test('TaskList should show progress information', () => {
  const tasks: Task[] = [
    { id: '1', text: 'Task 1', completed: true },
    { id: '2', text: 'Task 2', completed: false },
    { id: '3', text: 'Task 3', completed: true }
  ];

  const { lastFrame } = render(<TaskList tasks={tasks} />);

  expect(lastFrame()).toContain('Progress: 2/3 tasks completed');
});

test('TaskList should show navigation hints', () => {
  const tasks: Task[] = [
    { id: '1', text: 'Task 1', completed: false }
  ];

  const { lastFrame } = render(<TaskList tasks={tasks} />);

  expect(lastFrame()).toContain('↑↓/j/k: navigate');
  expect(lastFrame()).toContain('Space/Enter: toggle');
});

test('TaskList should handle empty task list', () => {
  const { lastFrame } = render(<TaskList tasks={[]} />);

  expect(lastFrame()).toContain('No tasks found in this note.');
});

test('TaskList should display title and note path', () => {
  const tasks: Task[] = [
    { id: '1', text: 'Task 1', completed: false }
  ];

  const { lastFrame } = render(
    <TaskList
      tasks={tasks}
      title="2025-11-21"
      notePath="/notes/2025-11-21.md"
    />
  );

  expect(lastFrame()).toContain('2025-11-21');
  expect(lastFrame()).toContain('Tasks from 2025-11-21.md');
});

test('TaskList should call onTaskToggle when task is toggled', () => {
  const onTaskToggle = vi.fn();
  const onExit = vi.fn();
  const tasks: Task[] = [
    { id: '1', text: 'Task 1', completed: false },
    { id: '2', text: 'Task 2', completed: true }
  ];

  const { stdin } = render(
    <TaskList
      tasks={tasks}
      onTaskToggle={onTaskToggle}
      onExit={onExit}
    />
  );

  // Toggle the first task (space on initial selection)
  stdin.write(' ');

  expect(onTaskToggle).toHaveBeenCalledWith('1');
});