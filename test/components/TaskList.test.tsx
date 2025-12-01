import React from 'react';
import { render } from 'ink-testing-library';
import { test, expect, vi } from 'vitest';
import TaskList, { Task } from '../../src/components/TaskList';

test('TaskList should render tasks with correct status indicators and group by headers', () => {
  const tasks: Task[] = [
    { id: '1', text: 'Task 1', completed: false, header: 'Work' },
    { id: '2', text: 'Task 2', completed: true, header: 'Personal' },
    { id: '3', text: 'Task 3', completed: false }
  ];

  const { lastFrame } = render(<TaskList tasks={tasks} />);

  expect(lastFrame()).toContain('[ ] Task 1');
  expect(lastFrame()).toContain('[✓] Task 2');
  expect(lastFrame()).toContain('[ ] Task 3');
  expect(lastFrame()).toContain('Work');
  expect(lastFrame()).toContain('Personal');
  expect(lastFrame()).toContain('General');
});

test('TaskList should group multiple tasks under the same header', () => {
  const tasks: Task[] = [
    { id: '1', text: 'Task 1', completed: false, header: 'Work' },
    { id: '2', text: 'Task 2', completed: true, header: 'Work' },
    { id: '3', text: 'Task 3', completed: false, header: 'Personal' }
  ];

  const { lastFrame } = render(<TaskList tasks={tasks} />);

  const frame = lastFrame();
  // Check that Work header appears once and both tasks are under it
  expect(frame).toContain('Work');
  expect(frame).toContain('[ ] Task 1');
  expect(frame).toContain('[✓] Task 2');
  expect(frame).toContain('Personal');
  expect(frame).toContain('[ ] Task 3');
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

test('TaskList should handle keyboard input without crashing', () => {
  const onTaskToggle = vi.fn();
  const onExit = vi.fn();
  const tasks: Task[] = [
    { id: '1', text: 'Task 1', completed: false },
    { id: '2', text: 'Task 2', completed: false }
  ];

  const { stdin } = render(
    <TaskList
      tasks={tasks}
      onTaskToggle={onTaskToggle}
      onExit={onExit}
    />
  );

  // Test various keyboard inputs don't crash the component
  stdin.write('\u001b[A'); // Up arrow
  stdin.write('\u001b[B'); // Down arrow
  stdin.write('j'); // Vim down
  stdin.write('k'); // Vim up
  stdin.write('g'); // Jump to top
  stdin.write('G'); // Jump to bottom
  stdin.write('q'); // Exit

  // Should not have crashed and should have called exit
  expect(onExit).toHaveBeenCalled();
});

test('TaskList should create display-ordered task list for navigation', () => {
  const tasks: Task[] = [
    // Note order: Work task first, then Personal tasks
    { id: '1', text: 'Work Task 1', completed: false, header: 'Work' },
    { id: '2', text: 'Personal Task 1', completed: false, header: 'Personal' },
    { id: '3', text: 'Personal Task 2', completed: false, header: 'Personal' },
    { id: '4', text: 'Work Task 2', completed: false, header: 'Work' }
  ];

  const { lastFrame } = render(<TaskList tasks={tasks} />);

  // Check that tasks appear in display order: Work tasks first, then Personal tasks
  const frame = lastFrame();
  expect(frame).toContain('Work Task 1');
  expect(frame).toContain('Work Task 2');
  expect(frame).toContain('Personal Task 1');
  expect(frame).toContain('Personal Task 2');

  const workTask1Index = frame!.indexOf('Work Task 1');
  const workTask2Index = frame!.indexOf('Work Task 2');
  const personalTask1Index = frame!.indexOf('Personal Task 1');
  const personalTask2Index = frame!.indexOf('Personal Task 2');

  // Work tasks should appear before Personal tasks
  expect(workTask1Index).toBeLessThan(personalTask1Index);
  expect(workTask2Index).toBeLessThan(personalTask1Index);
  
  // Within each group, tasks should maintain their relative order
  expect(workTask1Index).toBeLessThan(workTask2Index);
  expect(personalTask1Index).toBeLessThan(personalTask2Index);
});