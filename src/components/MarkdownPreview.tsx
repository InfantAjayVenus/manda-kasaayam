import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { marked } from 'marked';

interface MarkdownPreviewProps {
  content: string;
  title?: string;
  onExit?: () => void;
}

interface MarkdownToken {
  type: string;
  text?: string;
  tokens?: MarkdownToken[];
  depth?: number;
  raw?: string;
  items?: any[];
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, title, onExit }) => {
  const [offset, setOffset] = useState(0);

  // Parse markdown into tokens
  const tokens = marked.lexer(content) as MarkdownToken[];

  // Handle keyboard input
  useInput((input, key) => {
    if (input === 'q' || key.escape || (key.ctrl && input === 'c')) {
      if (onExit) {
        onExit();
      } else {
        process.exit(0);
      }
      return;
    }

    if (key.upArrow || input === 'k') {
      setOffset(prev => Math.max(0, prev - 1));
    } else if (key.downArrow || input === 'j') {
      setOffset(prev => prev + 1);
    } else if (key.pageUp) {
      setOffset(prev => Math.max(0, prev - 10));
    } else if (key.pageDown) {
      setOffset(prev => prev + 10);
    }
  });

  const renderToken = useCallback((token: MarkdownToken, index: number): React.ReactNode => {
    switch (token.type) {
      case 'heading':
        const headingSize = token.depth || 1;
        const headingColor = headingSize === 1 ? 'blueBright' : 
                          headingSize === 2 ? 'cyan' : 
                          headingSize === 3 ? 'yellow' : 'white';
        return (
          <Box key={index} marginBottom={1}>
            <Text color={headingColor} bold>
              {'#'.repeat(headingSize)} {token.text}
            </Text>
          </Box>
        );

      case 'paragraph':
        return (
          <Box key={index} marginBottom={1}>
            <Text>{token.text}</Text>
          </Box>
        );

      case 'list':
        return (
          <Box key={index} marginBottom={1} paddingLeft={2}>
            {(token as any).items?.map((listItem: any, listIndex: number) => renderToken(listItem, listIndex))}
          </Box>
        );

      case 'list_item':
        return (
          <Box key={index} marginBottom={1}>
            <Text color="gray">• </Text>
            <Text>{token.text}</Text>
          </Box>
        );

      case 'text':
        return <Text key={index}>{token.text}</Text>;

      case 'code':
        return (
          <Box key={index} marginBottom={1}>
            <Text color="green">{token.text}</Text>
          </Box>
        );

      case 'codespan':
        return <Text key={index} color="green">`{token.text}`</Text>;

      case 'blockquote':
        return (
          <Box key={index} marginBottom={1} paddingLeft={2} borderStyle="single" borderLeft>
            <Text color="gray" italic>
              {token.text}
            </Text>
          </Box>
        );

      case 'strong':
        return (
          <Text key={index} bold>
            {token.text}
          </Text>
        );

      case 'em':
        return (
          <Text key={index} italic>
            {token.text}
          </Text>
        );

      case 'hr':
        return (
          <Box key={index} marginBottom={1}>
            <Text color="gray">{'─'.repeat(50)}</Text>
          </Box>
        );

      case 'space':
        return <Text key={index}> </Text>;

      default:
        if (token.text) {
          return <Text key={index}>{token.text}</Text>;
        }
        return null;
    }
  }, []);

  // Calculate visible content based on offset
  const visibleTokens = tokens.slice(offset);
  const hasMore = offset + visibleTokens.length < tokens.length;

  return (
    <Box flexDirection="column" height="100%">
      {title && (
        <Box marginBottom={1}>
          <Text color="blue" bold underline>
            {title}
          </Text>
        </Box>
      )}
      
      <Box flexDirection="column" flexGrow={1}>
        {visibleTokens.map((token, index) => renderToken(token, index))}
      </Box>

      {hasMore && (
        <Box>
          <Text color="gray" dimColor>
            -- More -- (Scroll down for more content)
          </Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          Keys: ↑↓ or j/k: scroll | q/ESC: exit | Home/End: jump to top/bottom
        </Text>
      </Box>
    </Box>
  );
};

export default MarkdownPreview;