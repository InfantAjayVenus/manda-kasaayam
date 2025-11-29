import { render } from 'ink-testing-library';
import { test, expect, vi, describe, beforeEach, afterEach } from 'vitest';
import MarkdownPreview from '../../src/components/MarkdownPreview';

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

describe('MarkdownPreview Rich Content Integration Tests', () => {
  test('should render complex daily note with all features', () => {
    const content = `# Daily Notes - 2025-11-19

## Morning Tasks
- [x] Morning meditation
- [ ] Review emails
- [x] Team standup meeting
- [ ] Work on project documentation

## Code Review
\`\`\`typescript
interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

const updateTask = (id: string, updates: Partial<Task>): Task => {
  return { ...existingTask, ...updates };
};
\`\`\`

## Meeting Notes
Discussed the **new feature** implementation with *emphasis on performance*.

### Action Items
1. ~~Deprecated approach~~ - Use new method instead
2. [API Integration](https://api.example.com) - Connect to backend
3. Database optimization

### Project Status
| Component | Status | Priority | Assignee |
|-----------|--------|----------|----------|
| Frontend  | In Progress | High | Alice |
| Backend   | Review | Medium | Bob |
| Database  | Done | Low | Charlie |

> **Important:** Remember to update the documentation before deployment.

---

## Evening Reflection
Great progress today!

\`\`\`python
def process_data(data):
    processed = [item.upper() for item in data if item.strip()]
    return processed
\`\`\`

## Links
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)`;

    const { lastFrame } = render(<MarkdownPreview content={content} title="2025-11-19" />);

    // Title and headers
    expect(lastFrame()).toContain('2025-11-19');
    expect(lastFrame()).toContain('Daily Notes - 2025-11-19');
    expect(lastFrame()).toContain('Morning Tasks');
    expect(lastFrame()).toContain('Code Review');
    expect(lastFrame()).toContain('Meeting Notes');
    expect(lastFrame()).toContain('Evening Reflection');
    expect(lastFrame()).toContain('Links');

    // Task lists
    expect(lastFrame()).toContain('[✓] Morning meditation');
    expect(lastFrame()).toContain('[ ] Review emails');
    expect(lastFrame()).toContain('[✓] Team standup meeting');
    expect(lastFrame()).toContain('[ ] Work on project documentation');

    // Code blocks
    expect(lastFrame()).toContain('interface Task');
    expect(lastFrame()).toContain('def process_data');

    // Text formatting
    expect(lastFrame()).toContain('new feature');
    expect(lastFrame()).toContain('emphasis on performance');
    expect(lastFrame()).toContain('Deprecated approach');

    // Links
    expect(lastFrame()).toContain('API Integration');
    expect(lastFrame()).toContain('(https://api.example.com)');
    expect(lastFrame()).toContain('React Documentation');
    expect(lastFrame()).toContain('(https://react.dev)');

    // Tables
    expect(lastFrame()).toContain('Component');
    expect(lastFrame()).toContain('Status');
    expect(lastFrame()).toContain('Frontend');
    expect(lastFrame()).toContain('Alice');

    // Blockquotes
    expect(lastFrame()).toContain('Important:');
    expect(lastFrame()).toContain('Remember to update the documentation');
  });

  test('should handle task lists with mixed states', () => {
    const content = `## Task List
- [x] Completed task 1
- [ ] Incomplete task 1
- [x] Completed task 2
- [ ] Incomplete task 2
- [x] Completed task 3`;

    const { lastFrame } = render(<MarkdownPreview content={content} />);

    expect(lastFrame()).toContain('[✓] Completed task 1');
    expect(lastFrame()).toContain('[ ] Incomplete task 1');
    expect(lastFrame()).toContain('[✓] Completed task 2');
    expect(lastFrame()).toContain('[ ] Incomplete task 2');
    expect(lastFrame()).toContain('[✓] Completed task 3');
  });

  test('should render tables with proper structure', () => {
    const content = `| Name | Age | City |
|------|-----|------|
| John | 25  | NYC  |
| Jane | 30  | LA   |`;

    const { lastFrame } = render(<MarkdownPreview content={content} />);

    expect(lastFrame()).toContain('Name');
    expect(lastFrame()).toContain('Age');
    expect(lastFrame()).toContain('City');
    expect(lastFrame()).toContain('John');
    expect(lastFrame()).toContain('25');
    expect(lastFrame()).toContain('NYC');
    expect(lastFrame()).toContain('Jane');
    expect(lastFrame()).toContain('30');
    expect(lastFrame()).toContain('LA');
  });

  test('should handle strikethrough text correctly', () => {
    const content = `# Strikethrough Test
This is ~~strikethrough~~ text.
~~This entire paragraph is struck through~~
Normal text again.`;

    const { lastFrame } = render(<MarkdownPreview content={content} />);

    expect(lastFrame()).toContain('Strikethrough Test');
    expect(lastFrame()).toContain('strikethrough');
    expect(lastFrame()).toContain('This entire paragraph is struck through');
    expect(lastFrame()).toContain('Normal text again');
  });

  test('should render links with URLs visible', () => {
    const content = `# Links Test
Visit [OpenAI](https://openai.com) and [GitHub](https://github.com).
Email us at [contact@example.com](mailto:contact@example.com)`;

    const { lastFrame } = render(<MarkdownPreview content={content} />);

    expect(lastFrame()).toContain('Links Test');
    expect(lastFrame()).toContain('OpenAI');
    expect(lastFrame()).toContain('(https://openai.com)');
    expect(lastFrame()).toContain('GitHub');
    expect(lastFrame()).toContain('(https://github.com)');
    expect(lastFrame()).toContain('contact@example.com');
    expect(lastFrame()).toContain('(mailto:contact@example.com)');
  });

  test('should handle code blocks with different languages', () => {
    const content = `\`\`\`javascript
const hello = "world";
console.log(hello);
\`\`\`

\`\`\`python
def hello():
    print("world")
\`\`\`

\`\`\`
No language specified
\`\`\``;

    const { lastFrame } = render(<MarkdownPreview content={content} />);

    expect(lastFrame()).toContain('const hello');
    expect(lastFrame()).toContain('console.log(hello)');
    expect(lastFrame()).toContain('def hello()');
    expect(lastFrame()).toContain('print("world")');
    expect(lastFrame()).toContain('No language specified');
  });

  test('should handle mixed content correctly', () => {
    const content = `# Mixed Content Test

## Code and Text
Here's some JavaScript with \`inline code\` and **bold text**:

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting); // This is a comment
\`\`\`

## Lists and Links
- [x] Completed task with [link](https://example.com)
- [ ] Pending task with ~~strikethrough~~ text

> Blockquote with *italic* and **bold** text

| Simple | Table |
|--------|-------|
| Data   | Value |
`;

    const { lastFrame } = render(<MarkdownPreview content={content} />);

    expect(lastFrame()).toContain('Mixed Content Test');
    expect(lastFrame()).toContain('inline code');
    expect(lastFrame()).toContain('bold text');
    expect(lastFrame()).toContain('const greeting');
    expect(lastFrame()).toContain('console.log(greeting)');
    expect(lastFrame()).toContain('[✓] Completed task');
    expect(lastFrame()).toContain('(https://example.com)');
    expect(lastFrame()).toContain('[ ] Pending task');
    expect(lastFrame()).toContain('strikethrough');
    expect(lastFrame()).toContain('Blockquote with');
    expect(lastFrame()).toContain('italic');
    expect(lastFrame()).toContain('Simple');
    expect(lastFrame()).toContain('Table');
    expect(lastFrame()).toContain('Data');
    expect(lastFrame()).toContain('Value');
  });

  test('should handle edge cases gracefully', () => {
    const content = `# Edge Case Test

## Empty Elements
- [ ] 
- [x] 

## Code with empty lines
\`\`\`javascript

function empty() {
  
}

\`\`\`

## Table with empty cells
| A | B | C |
|---|---|---|
| 1 |   | 3 |
|   | 2 |   |

> 

---

## Links
[Empty title]()
[Missing href](

---

End of content`;

    const { lastFrame } = render(<MarkdownPreview content={content} />);

    // Should not crash and should render what it can
    expect(lastFrame()).toContain('Edge Case Test');
    expect(lastFrame()).toContain('Empty Elements');
    expect(lastFrame()).toContain('function empty()');
    expect(lastFrame()).toContain('A | B | C');
    expect(lastFrame()).toContain('1 |  | 3');
    expect(lastFrame()).toContain('End of content');
  });
});