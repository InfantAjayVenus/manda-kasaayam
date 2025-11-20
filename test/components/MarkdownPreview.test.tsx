import React from 'react';
import { render } from 'ink-testing-library';
import { test, expect } from 'vitest';
import MarkdownPreview from '../../src/components/MarkdownPreview';

test('MarkdownPreview should render headers with appropriate colors without # symbols', () => {
  const content = `
# Main Title
## Subtitle
### Section
#### Subsection
`;

  const { lastFrame } = render(<MarkdownPreview content={content} />);

  expect(lastFrame()).toContain('Main Title');
  expect(lastFrame()).toContain('Subtitle');
  expect(lastFrame()).toContain('Section');
  expect(lastFrame()).toContain('Subsection');
  // Ensure # symbols are not rendered
  expect(lastFrame()).not.toContain('# Main Title');
  expect(lastFrame()).not.toContain('## Subtitle');
  expect(lastFrame()).not.toContain('### Section');
  expect(lastFrame()).not.toContain('#### Subsection');
});

test('MarkdownPreview should render headers as styled text without any # symbols', () => {
  const content = `
# H1 Header
## H2 Header  
### H3 Header
#### H4 Header
##### H5 Header
###### H6 Header
`;

  const { lastFrame } = render(<MarkdownPreview content={content} />);

  // Headers should be rendered as plain text without any # symbols
  expect(lastFrame()).toContain('H1 Header');
  expect(lastFrame()).toContain('H2 Header');
  expect(lastFrame()).toContain('H3 Header');
  expect(lastFrame()).toContain('H4 Header');
  expect(lastFrame()).toContain('H5 Header');
  expect(lastFrame()).toContain('H6 Header');
  
  // No # symbols should be present in the output
  expect(lastFrame()).not.toMatch(/#+\s+H[1-6] Header/);
  
  // The content should not contain any raw markdown header syntax
  expect(lastFrame()).not.toContain('# H1 Header');
  expect(lastFrame()).not.toContain('## H2 Header');
  expect(lastFrame()).not.toContain('### H3 Header');
  expect(lastFrame()).not.toContain('#### H4 Header');
  expect(lastFrame()).not.toContain('##### H5 Header');
  expect(lastFrame()).not.toContain('###### H6 Header');
});

test('MarkdownPreview should render paragraphs', () => {
  const content = `
This is a paragraph.

This is another paragraph.
`;

  const { lastFrame } = render(<MarkdownPreview content={content} />);

  expect(lastFrame()).toContain('This is a paragraph.');
  expect(lastFrame()).toContain('This is another paragraph.');
});

test('MarkdownPreview should render lists', () => {
  const content = `
- First item
- Second item
- Third item
`;

  const { lastFrame } = render(<MarkdownPreview content={content} />);

  expect(lastFrame()).toContain('First item');
  expect(lastFrame()).toContain('Second item');
  expect(lastFrame()).toContain('Third item');
});

test('MarkdownPreview should render task lists with checkboxes', () => {
  const content = `
- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task
`;

  const { lastFrame } = render(<MarkdownPreview content={content} />);

  expect(lastFrame()).toContain('[✓] Completed task');
  expect(lastFrame()).toContain('[ ] Incomplete task');
  expect(lastFrame()).toContain('[✓] Another completed task');
});

test('MarkdownPreview should render inline code', () => {
  const content = `
Here is some \`inline code\` in a paragraph.
`;

  const { lastFrame } = render(<MarkdownPreview content={content} />);

  expect(lastFrame()).toContain('inline code');
});

test('MarkdownPreview should render code blocks with syntax highlighting', () => {
  const content = `
\`\`\`javascript
function hello() {
  console.log("Hello World");
  return true;
}
\`\`\`
`;

  const { lastFrame } = render(<MarkdownPreview content={content} />);

  expect(lastFrame()).toContain('function hello()');
  expect(lastFrame()).toContain('console.log("Hello World")');
  expect(lastFrame()).toContain('return true');
  expect(lastFrame()).toContain('1 '); // Line numbers
});

test('MarkdownPreview should render Python code with syntax highlighting', () => {
  const content = `
\`\`\`python
def hello():
    print("Hello World")
    return True
\`\`\`
`;

  const { lastFrame } = render(<MarkdownPreview content={content} />);

  expect(lastFrame()).toContain('def hello()');
  expect(lastFrame()).toContain('print("Hello World")');
  expect(lastFrame()).toContain('return True');
});

test('MarkdownPreview should render blockquotes', () => {
  const content = `
> This is a blockquote
> with multiple lines
`;

  const { lastFrame } = render(<MarkdownPreview content={content} />);

  expect(lastFrame()).toContain('This is a blockquote');
  expect(lastFrame()).toContain('with multiple lines');
});

test('MarkdownPreview should render bold and italic text', () => {
  const content = `
This is **bold** text and this is *italic* text.
`;

  const { lastFrame } = render(<MarkdownPreview content={content} />);

  expect(lastFrame()).toContain('bold');
  expect(lastFrame()).toContain('italic');
});

test('MarkdownPreview should render strikethrough text', () => {
  const content = `
This is ~~strikethrough~~ text.
`;

  const { lastFrame } = render(<MarkdownPreview content={content} />);

  expect(lastFrame()).toContain('strikethrough');
});

test('MarkdownPreview should render links with URLs', () => {
  const content = `
Check out [OpenAI](https://openai.com) for more info.
`;

  const { lastFrame } = render(<MarkdownPreview content={content} />);

  expect(lastFrame()).toContain('OpenAI');
  expect(lastFrame()).toContain('(https://openai.com)');
});

test('MarkdownPreview should render tables', () => {
  const content = `
| Name | Age | City |
|------|-----|------|
| John | 25  | NYC  |
| Jane | 30  | LA   |
`;

  const { lastFrame } = render(<MarkdownPreview content={content} />);

  expect(lastFrame()).toContain('Name');
  expect(lastFrame()).toContain('Age');
  expect(lastFrame()).toContain('City');
  expect(lastFrame()).toContain('John');
  expect(lastFrame()).toContain('Jane');
});

test('MarkdownPreview should render horizontal rules', () => {
  const content = `
Above the rule

---

Below the rule
`;

  const { lastFrame } = render(<MarkdownPreview content={content} />);

  expect(lastFrame()).toContain('Above the rule');
  expect(lastFrame()).toContain('Below the rule');
});

test('MarkdownPreview should display title when provided', () => {
  const content = `# Simple Content`;

  const { lastFrame } = render(<MarkdownPreview content={content} title="2025-11-19" />);

  expect(lastFrame()).toContain('2025-11-19');
  expect(lastFrame()).toContain('Simple Content');
});

test('MarkdownPreview should handle empty content', () => {
  const { lastFrame } = render(<MarkdownPreview content="" />);

  // Should not crash and should render something
  expect(lastFrame()).toBeDefined();
});

test('MarkdownPreview should handle complex markdown with all features', () => {
  const content = `
# Complex Document

## Introduction
This is a **complex** document with *multiple* elements including ~~strikethrough~~ text.

## Task List
- [x] Completed feature
- [ ] Pending feature
- [x] Another completed task

## Features
- \`Inline code\` support
- **Bold** and *italic* text
- Code blocks with syntax highlighting
- Blockquotes
- Links like [GitHub](https://github.com)

\`\`\`javascript
const example = "Hello World";
console.log(example);
if (example) {
  return true;
}
\`\`\`

> Important: This is a quote with **emphasis**

| Feature | Status | Priority |
|---------|--------|----------|
| Tasks   | Done   | High     |
| Tables  | Done   | Medium   |

---

## Conclusion
That's all with rich formatting!
`;

  const { lastFrame } = render(<MarkdownPreview content={content} />);

  expect(lastFrame()).toContain('Complex Document');
  expect(lastFrame()).toContain('Introduction');
  expect(lastFrame()).toContain('Task List');
  expect(lastFrame()).toContain('[✓] Completed feature');
  expect(lastFrame()).toContain('[ ] Pending feature');
  expect(lastFrame()).toContain('Features');
  expect(lastFrame()).toContain('Inline code');
  expect(lastFrame()).toContain('const example');
  expect(lastFrame()).toContain('Important: This is a quote');
  expect(lastFrame()).toContain('Feature');
  expect(lastFrame()).toContain('Status');
  expect(lastFrame()).toContain('Done');
  expect(lastFrame()).toContain('Conclusion');
  expect(lastFrame()).toContain('(https://github.com)');
});