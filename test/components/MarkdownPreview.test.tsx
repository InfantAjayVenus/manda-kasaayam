import React from 'react';
import { render } from 'ink-testing-library';
import { test, expect } from 'vitest';
import MarkdownPreview from '../../src/components/MarkdownPreview';

test('MarkdownPreview should render headers with appropriate colors', () => {
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

test('MarkdownPreview should render inline code', () => {
  const content = `
Here is some \`inline code\` in a paragraph.
`;

  const { lastFrame } = render(<MarkdownPreview content={content} />);

  expect(lastFrame()).toContain('inline code');
});

test('MarkdownPreview should render code blocks', () => {
  const content = `
\`\`\`javascript
function hello() {
  console.log("Hello World");
}
\`\`\`
`;

  const { lastFrame } = render(<MarkdownPreview content={content} />);

  expect(lastFrame()).toContain('function hello()');
  expect(lastFrame()).toContain('console.log("Hello World")');
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

test('MarkdownPreview should handle complex markdown', () => {
  const content = `
# Complex Document

## Introduction
This is a **complex** document with *multiple* elements.

## Features
- \`Inline code\` support
- **Bold** and *italic* text
- Code blocks
- Blockquotes

\`\`\`javascript
const example = "Hello World";
console.log(example);
\`\`\`

> Important: This is a quote

---

## Conclusion
That's all!
`;

  const { lastFrame } = render(<MarkdownPreview content={content} />);

  expect(lastFrame()).toContain('Complex Document');
  expect(lastFrame()).toContain('Introduction');
  expect(lastFrame()).toContain('Features');
  expect(lastFrame()).toContain('Inline code');
  expect(lastFrame()).toContain('const example');
  expect(lastFrame()).toContain('Important: This is a quote');
  expect(lastFrame()).toContain('Conclusion');
});