
import { render } from 'ink-testing-library';
import { test, expect, vi, beforeEach, afterEach, describe } from 'vitest';
import MarkdownPreview from '../../src/components/MarkdownPreview';

// Mock the ink module
vi.mock('ink', () => ({
  Box: ({ children, ...props }: any) => ({ type: 'Box', props, children }),
  Text: ({ children, ...props }: any) => ({ type: 'Text', props, children }),
  useInput: vi.fn(),
}));

// Import after mocking
import { useInput } from 'ink';

describe('MarkdownPreview Keyboard Input Integration Tests', () => {
  let mockOnExit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnExit = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

   test('should call onExit when q key is pressed', async () => {
     const content = '# Test Content';

     render(<MarkdownPreview content={content} onExit={mockOnExit as () => void} />);

     // Get the useInput mock and simulate q key press
     expect(useInput).toHaveBeenCalled();

     // Get the callback function that was passed to useInput
     const inputCallback = (useInput as any).mock.calls[0][0];
    
    // Simulate pressing 'q'
    inputCallback('q', { 
      upArrow: false, downArrow: false, leftArrow: false, rightArrow: false,
      pageDown: false, pageUp: false, return: false, escape: false, 
      ctrl: false, shift: false, meta: false, tab: false, backspace: false, delete: false
    });
    
    expect(mockOnExit).toHaveBeenCalled();
  });

  test('should call onExit when ESC key is pressed', async () => {
    const content = '# Test Content';
    
    render(<MarkdownPreview content={content} onExit={mockOnExit as () => void} />);
    
     // Get the callback function
     const inputCallback = (useInput as any).mock.calls[0][0];
    
    // Simulate pressing ESC
    inputCallback('', { 
      upArrow: false, downArrow: false, leftArrow: false, rightArrow: false,
      pageDown: false, pageUp: false, return: false, escape: true, 
      ctrl: false, shift: false, meta: false, tab: false, backspace: false, delete: false
    });
    
    expect(mockOnExit).toHaveBeenCalled();
  });

  test('should handle navigation keys without calling onExit', async () => {
    const content = '# Test Content\n\n- Item 1\n- Item 2\n- Item 3';
    
    render(<MarkdownPreview content={content} onExit={mockOnExit as () => void} />);
    
     // Get the callback function
     const inputCallback = (useInput as any).mock.calls[0][0];
    
    // Simulate pressing down arrow
    inputCallback('', { 
      upArrow: false, downArrow: true, leftArrow: false, rightArrow: false,
      pageDown: false, pageUp: false, return: false, escape: false, 
      ctrl: false, shift: false, meta: false, tab: false, backspace: false, delete: false
    });
    
    // onExit should not be called for navigation
    expect(mockOnExit).not.toHaveBeenCalled();
    
    // Simulate pressing 'j' (down)
    inputCallback('j', { 
      upArrow: false, downArrow: false, leftArrow: false, rightArrow: false,
      pageDown: false, pageUp: false, return: false, escape: false, 
      ctrl: false, shift: false, meta: false, tab: false, backspace: false, delete: false
    });
    
    expect(mockOnExit).not.toHaveBeenCalled();
    
    // Simulate pressing 'k' (up)
    inputCallback('k', { 
      upArrow: false, downArrow: false, leftArrow: false, rightArrow: false,
      pageDown: false, pageUp: false, return: false, escape: false, 
      ctrl: false, shift: false, meta: false, tab: false, backspace: false, delete: false
    });
    
    expect(mockOnExit).not.toHaveBeenCalled();
  });

  test('should handle j/k navigation keys', async () => {
    const content = '# Test Content\n\n- Item 1\n- Item 2\n- Item 3';
    
    render(<MarkdownPreview content={content} onExit={mockOnExit as () => void} />);
    
     // Get the callback function
     const inputCallback = (useInput as any).mock.calls[0][0];
    
    // Simulate pressing 'j' (down)
    inputCallback('j', { 
      upArrow: false, downArrow: false, leftArrow: false, rightArrow: false,
      pageDown: false, pageUp: false, return: false, escape: false, 
      ctrl: false, shift: false, meta: false, tab: false, backspace: false, delete: false
    });
    
    // onExit should not be called for navigation
    expect(mockOnExit).not.toHaveBeenCalled();
    
    // Simulate pressing 'k' (up)
    inputCallback('k', { 
      upArrow: false, downArrow: false, leftArrow: false, rightArrow: false,
      pageDown: false, pageUp: false, return: false, escape: false, 
      ctrl: false, shift: false, meta: false, tab: false, backspace: false, delete: false
    });
    
    expect(mockOnExit).not.toHaveBeenCalled();
  });

  test('should handle page up/down navigation', async () => {
    const content = '# Test Content\n\n- Item 1\n- Item 2\n- Item 3';
    
    render(<MarkdownPreview content={content} onExit={mockOnExit as () => void} />);
    
     // Get the callback function
     const inputCallback = (useInput as any).mock.calls[0][0];
    
    // Simulate pressing page down
    inputCallback('', { pageDown: true });
    
    // onExit should not be called for navigation
    expect(mockOnExit).not.toHaveBeenCalled();
    
    // Simulate pressing page up
    inputCallback('', { pageUp: true });
    
    expect(mockOnExit).not.toHaveBeenCalled();
  });

   test('should handle Ctrl+C to exit', async () => {
     const content = '# Test Content';

     render(<MarkdownPreview content={content} onExit={mockOnExit as () => void} />);

     // Get the callback function
     const inputCallback = (useInput as any).mock.calls[0][0];

     // Simulate pressing Ctrl+C
     inputCallback('c', { ctrl: true });

     expect(mockOnExit).toHaveBeenCalled();
   });

  test('should handle home/end navigation', async () => {
    const content = '# Test Content\n\n- Item 1\n- Item 2\n- Item 3';
    
    render(<MarkdownPreview content={content} onExit={mockOnExit as () => void} />);
    
     // Get the callback function
     const inputCallback = (useInput as any).mock.calls[0][0];
    
    // Simulate pressing home
    inputCallback('', { home: true });
    
    // onExit should not be called for navigation
    expect(mockOnExit).not.toHaveBeenCalled();
    
    // Simulate pressing end
    inputCallback('', { end: true });
    
    expect(mockOnExit).not.toHaveBeenCalled();
  });

  test('should simulate full user interaction flow', async () => {
    const content = '# Test Document\n\n## Section 1\n\n- Item 1\n- Item 2\n\n## Section 2\n\n- Item 3\n- Item 4';
    
    render(<MarkdownPreview content={content} onExit={mockOnExit as () => void} />);
    
     // Get the callback function
     const inputCallback = (useInput as any).mock.calls[0][0];
    
    // Simulate user navigation
    inputCallback('j', {}); // down
    inputCallback('j', {}); // down
    inputCallback('k', {}); // up
    inputCallback('', { pageDown: true }); // page down
    inputCallback('', { pageUp: true }); // page up
    inputCallback('', { home: true }); // home
    inputCallback('', { end: true }); // end
    
    // Should not have exited yet
    expect(mockOnExit).not.toHaveBeenCalled();
    
    // User presses 'q' to exit
    inputCallback('q', {});
    
    // Now should have exited
    expect(mockOnExit).toHaveBeenCalledTimes(1);
  });
});