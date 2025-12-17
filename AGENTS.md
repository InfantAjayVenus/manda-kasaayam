# Application Setup with Outside-In TDD

This document outlines the current setup for developing a Terminal User Interface (TUI) application, following an Outside-In Test Driven Development (TDD) approach.

### Technology Stack

- **Language:** **TypeScript**
- **TUI Framework:** **[Ink](https://github.com/vadimdemedes/ink)**
- **Testing:** **[Vitest](https://vitest.dev/)** and **[ink-testing-library](https://github.com/vadimdemedes/ink-testing-library)**
- **CLI Parsing:** **[Commander.js](https://github.com/tj/commander.js)**
- **Git Integration:** **[simple-git](https://github.com/steveukx/git-js)**

### Proposed Project Structure

A layered architecture is recommended to ensure clear separation of concerns, enhance modularity, and simplify testing.

```
.
├── src/
│   ├── components/      # Reusable Ink UI components (e.g., TaskList, NoteViewer)
│   ├── commands/        # Logic for each CLI command (do, see, etc.)
│   ├── domain/          # Core business logic (e.g., Note, Task models and services)
│   ├── services/        # External dependencies (e.g., FileSystemService, GitService)
│   └── main.ts          # Application entry point, CLI setup
├── test/
│   ├── commands/        # Unit tests for command handlers
│   ├── domain/          # Unit tests for domain logic and services
│   ├── services/        # Unit tests for infrastructure services
│   └── e2e/             # High-level end-to-end acceptance tests
└── package.json
```

### Outside-In TDD Workflow Example: `manda do` Feature

This example demonstrates how to apply an Outside-In TDD workflow for implementing the `manda do` feature, which displays incomplete tasks.

**1. The Outer Loop (Acceptance Test)**

Begin by writing a high-level acceptance test that describes the desired behavior from the user's perspective. This test will execute your compiled CLI tool as a child process and assert against its standard output.

- **File:** `test/e2e/do.test.ts`
- **Content:**

  ```typescript
  import { execSync } from 'child_process';
  import { test, expect } from 'vitest';
  import path from 'path';
  import fs from 'fs';

  // Helper to create a temporary notes directory for testing
  const createTempNotesDir = (content: string) => {
    const tempDir = fs.mkdtempSync(path.join(process.env.GEMINI_TEMP_DIR || '/tmp', 'manda-notes-'));
    const today = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(path.join(tempDir, `${today}.md`), content);
    return tempDir;
  };

  test('running "manda do" should display incomplete tasks from today's note', () => {
    // Setup: Create a dummy notes directory and a today.md file with tasks
    const notesDir = createTempNotesDir(`
  ```

# ${new Date().toISOString().slice(0, 10)}

## My Tasks

- [ ] Buy milk
- [x] Call mom
- [ ] Write report

## Other Notes

- Some random text
  `);

        try {
          // Execute the CLI command
          const output = execSync(`MANDA_DIR=${notesDir} pnpm tsx src/main.ts do`).toString();

          // Assert: Check if the output contains the expected incomplete tasks
          expect(output).toContain('## My Tasks');
          expect(output).toContain('- [ ] Buy milk');
          expect(output).toContain('- [ ] Write report');
          expect(output).not.toContain('- [x] Call mom'); // Completed task should not be shown
          expect(output).not.toContain('Other Notes'); // Other sections should not be shown
        } finally {
          // Teardown: Clean up the temporary directory
          fs.rmSync(notesDir, { recursive: true, force: true });
        }
      });
      ```
      *Initially, this test will fail because the application logic is not yet implemented.*

**2. The Inner Loop (Unit/Integration Tests)**

Once the outer loop test fails, you move inwards, implementing the necessary application logic layer by layer, driven by unit and integration tests.

- **Step 2a: The Command Handler**
  Define the `do` command handler and write a test for it. This test will initially fail as the underlying services are not yet implemented.
  - **File:** `test/commands/do.command.test.ts`
  - **Content (Conceptual):**

    ```typescript
    import { test, expect, vi } from 'vitest';
    import { DoCommand } from '../../src/commands/do.command';
    import { NoteService } from '../../src/domain/note.service';
    import { render } from 'ink-testing-library';
    import React from 'react';
    import TaskList from '../../src/components/TaskList';

    vi.mock('../../src/domain/note.service');
    vi.mock('../../src/components/TaskList');

    test('DoCommand should fetch incomplete tasks and render them using TaskList component', async () => {
      const mockTasks = [
        { id: '1', text: 'Buy milk', completed: false, header: '## Groceries' },
        { id: '2', text: 'Call mom', completed: true, header: '## Family' },
      ];
      vi.mocked(NoteService.prototype.getIncompleteTasks).mockResolvedValue(mockTasks);

      // Mock the Ink render function to capture props
      const mockRender = vi.fn(() => ({ lastFrame: () => '', unmount: () => {} }));
      vi.mock('ink', async importOriginal => {
        const actual = await importOriginal();
        return {
          ...actual,
          render: mockRender,
        };
      });

      const doCommand = new DoCommand(new NoteService());
      await doCommand.execute('/path/to/notes');

      expect(NoteService.prototype.getIncompleteTasks).toHaveBeenCalledWith('/path/to/notes');
      expect(mockRender).toHaveBeenCalledWith(
        React.createElement(TaskList, { tasks: mockTasks }),
        expect.any(Object),
      );
    });
    ```

- **Step 2b: The Domain Service (`NoteService`)**
  The `DoCommand` will depend on a `NoteService` to retrieve and parse notes. Write tests for `NoteService` that mock the file system interactions.
  - **File:** `test/domain/note.service.test.ts`
  - **Content (Conceptual):**

    ```typescript
    import { test, expect, vi } from 'vitest';
    import { NoteService } from '../../src/domain/note.service';
    import { FileSystemService } from '../../src/services/file-system.service';

    vi.mock('../../src/services/file-system.service');

    test('NoteService.getIncompleteTasks should read a file and parse incomplete tasks', async () => {
      const mockFileContent = `
    ```

# 2025-11-19

## Daily Tasks

- [ ] Buy groceries
- [x] Finish report
- [ ] Call client

## Ideas

- [ ] Brainstorm new features
      `;
      vi.mocked(FileSystemService.prototype.readFile).mockResolvedValue(mockFileContent);

            const noteService = new NoteService(new FileSystemService());
            const tasks = await noteService.getIncompleteTasks('/path/to/notes/2025-11-19.md');

            expect(tasks).toHaveLength(3);
            expect(tasks[0]).toEqual(expect.objectContaining({ text: 'Buy groceries', completed: false, header: '## Daily Tasks' }));
            expect(tasks[1]).toEqual(expect.objectContaining({ text: 'Call client', completed: false, header: '## Daily Tasks' }));
            expect(tasks[2]).toEqual(expect.objectContaining({ text: 'Brainstorm new features', completed: false, header: '## Ideas' }));
          });
          ```

* **Step 2c: The Infrastructure Service (`FileSystemService`)**
  The `NoteService` relies on a `FileSystemService` to abstract file system operations. Implement this service and write basic tests for it, or rely on the higher-level tests to cover its functionality.
  - **File:** `test/services/file-system.service.test.ts`
  - **Content (Conceptual):**

    ```typescript
    import { test, expect, vi } from 'vitest';
    import { FileSystemService } from '../../src/services/file-system.service';
    import fs from 'fs/promises';

    vi.mock('fs/promises');

    test('FileSystemService.readFile should read content from a file', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('file content');
      const fileSystemService = new FileSystemService();
      const content = await fileSystemService.readFile('/test/file.txt');
      expect(content).toBe('file content');
      expect(fs.readFile).toHaveBeenCalledWith('/test/file.txt', 'utf-8');
    });
    ```

* **Step 2d: The UI Component (`TaskList`)**
  Finally, create the Ink component responsible for rendering the tasks and test it in isolation using `ink-testing-library`.
  - **File:** `test/components/TaskList.test.tsx`
  - **Content (Conceptual):**

    ```typescript
    import React from 'react';
    import { render } from 'ink-testing-library';
    import { test, expect } from 'vitest';
    import TaskList from '../../src/components/TaskList';

    test('TaskList should render a list of tasks grouped by headers', () => {
      const tasks = [
        { id: '1', text: 'Buy milk', completed: false, header: '## Groceries' },
        { id: '2', text: 'Call mom', completed: true, header: '## Family' },
        { id: '3', text: 'Write report', completed: false, header: '## Work' },
      ];
      const { lastFrame } = render(<TaskList tasks={tasks} />);

      expect(lastFrame()).toContain('## Groceries');
      expect(lastFrame()).toContain('- [ ] Buy milk');
      expect(lastFrame()).toContain('## Family');
      expect(lastFrame()).toContain('- [x] Call mom');
      expect(lastFrame()).toContain('## Work');
      expect(lastFrame()).toContain('- [ ] Write report');
    });
    ```

By following this "red-green-refactor" cycle from the outside in, you use tests to drive the design of your application, ensuring that every piece of code is written to fulfill a specific, tested requirement. This approach helps in building a well-structured, maintainable, and thoroughly tested TUI application.

### Avoiding Brittle Tests

Tests should be robust and not fail due to environmental factors like time, timezone, or execution context. Common pitfalls and best practices:

- **Time-Dependent Tests**: Avoid hardcoding timestamps or relying on current time. Use proper mocking with `vi.useFakeTimers()` and ensure timezone consistency (e.g., use local time or explicit UTC). Mock `Date.now()` or `new Date()` at the source to prevent real-time dependencies.

- **TUI/E2E Tests in Non-Interactive Environments**: Do not run interactive TUI components (e.g., via Ink) in e2e tests using `execSync` if stdin/stdout isn't a TTY. This causes "Raw mode not supported" errors. Instead, mock the TUI rendering or use unit tests for components. For e2e, focus on CLI output without interactivity, or set up proper TTY simulation.

- **Environment-Specific Assumptions**: Tests should work in CI/CD (e.g., headless) and local environments. Avoid assumptions about file paths, permissions, or external services without proper mocking.

- **Hardcoded Values**: Use relative paths, avoid absolute dates/times, and prefer dynamic assertions over exact string matches where possible.

If tests fail due to these issues, refactor them to be more resilient before committing.

### Pull Request Format

When creating pull requests, use the following structured format for the description to ensure clarity and consistency:

```
## Description

[Brief overview of what the PR does and why it's needed]

## Changes

### [Emoji] Category Name
- **Specific change**: Description of what was changed and why.
- **Another change**: Additional details.

### [Emoji] Another Category
- **Change details**: More information.

## Technical Details

- **Implementation notes**: Any technical decisions or complexities.
- **Breaking changes**: If applicable.

## Testing

- **Test coverage**: What was tested.
- **Manual testing**: If applicable.
- **CI status**: Expected outcomes.

## Related Issues

- Closes #issue-number
- Related to #issue-number
```

#### Category Emojis

- 🧪 **Test**: Test-related changes
- 🔧 **Code Quality**: Linting, refactoring, etc.
- 📚 **Documentation**: Docs, comments, README
- 🔄 **CI/CD**: Build, deployment, automation
- ✨ **Features**: New functionality
- 🐛 **Bug Fixes**: Bug resolutions
- 📦 **Dependencies**: Package updates
- 🎨 **UI/UX**: Interface changes
