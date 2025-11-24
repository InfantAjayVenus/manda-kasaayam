import React, { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { marked } from "marked";

interface MarkdownPreviewProps {
  content: string;
  title?: string;
  currentDate?: Date;
  onExit?: () => void;
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
  onEdit?: () => void;
}

interface MarkdownToken {
  type: string;
  text?: string;
  tokens?: MarkdownToken[];
  depth?: number;
  raw?: string;
  items?: any[];
  href?: string;
  title?: string;
  lang?: string;
  align?: string[];
  header?: boolean;
  cells?: string[][];
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  title,
  currentDate,
  onExit,
  onNavigatePrevious,
  onNavigateNext,
  onEdit,
}) => {
  const [offset, setOffset] = useState(0);

  // Configure marked for task lists
  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  // Parse markdown into tokens
  const tokens = marked.lexer(content) as MarkdownToken[];

  // Handle keyboard input
  useInput((input, key) => {
    if (input === "q" || key.escape || (key.ctrl && input === "c")) {
      if (onExit) {
        onExit();
      } else {
        process.exit(0);
      }
      return;
    }

    // Edit key
    if (input === "e") {
      if (onEdit) {
        onEdit();
        return;
      }
    }

    // Navigation keys
    if (key.leftArrow || input === "h") {
      if (onNavigatePrevious) {
        onNavigatePrevious();
        return;
      }
    } else if (key.rightArrow || input === "l") {
      if (onNavigateNext) {
        onNavigateNext();
        return;
      }
    }

    // Scrolling keys
    if (key.upArrow || input === "k") {
      setOffset((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow || input === "j") {
      setOffset((prev) => prev + 1);
    } else if (key.pageUp) {
      setOffset((prev) => Math.max(0, prev - 10));
    } else if (key.pageDown) {
      setOffset((prev) => prev + 10);
    } else if (input === "g") {
      setOffset(0);
    } else if (input === "G") {
      setOffset(Math.max(0, tokens.length - 20));
    } else if (key.ctrl && input === "d") {
      setOffset((prev) => prev + 15);
    } else if (key.ctrl && input === "u") {
      setOffset((prev) => Math.max(0, prev - 15));
    }
  });

  // Simple syntax highlighting for code
  const highlightCode = useCallback(
    (code: string, language?: string): React.ReactNode => {
      const lines = code.split("\n");
      return lines.map((line, lineIndex) => {
        let segments: React.ReactNode[] = [line];

        // Basic syntax highlighting patterns
        if (
          language === "javascript" ||
          language === "js" ||
          language === "typescript" ||
          language === "ts"
        ) {
          const keywords = line.match(
            /\b(function|const|let|var|if|else|for|while|return|class|extends|import|export|from|default)\b/g,
          );
          const strings = line.match(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g);
          const comments = line.match(/\/\/.*$/);

          if (keywords || strings || comments) {
            segments = [];
            let lastIndex = 0;

            // Add keyword highlighting
            if (keywords) {
              keywords.forEach((keyword) => {
                const index = line.indexOf(keyword, lastIndex);
                if (index > lastIndex) {
                  segments.push(line.substring(lastIndex, index));
                }
                segments.push(
                  <Text key={index} color="blueBright">
                    {keyword}
                  </Text>,
                );
                lastIndex = index + keyword.length;
              });
            }

            if (lastIndex < line.length) {
              segments.push(line.substring(lastIndex));
            }
          }
        } else if (language === "python" || language === "py") {
          const keywords = line.match(
            /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|lambda)\b/g,
          );
          const booleans = line.match(/\b(True|False|None)\b/g);
          const comments = line.match(/#.*$/);

          if (keywords || booleans || comments) {
            segments = [];
            let lastIndex = 0;

            // Add keyword highlighting
            if (keywords) {
              keywords.forEach((keyword) => {
                const index = line.indexOf(keyword, lastIndex);
                if (index > lastIndex) {
                  segments.push(line.substring(lastIndex, index));
                }
                segments.push(
                  <Text key={index} color="blueBright">
                    {keyword}
                  </Text>,
                );
                lastIndex = index + keyword.length;
              });
            }

            if (lastIndex < line.length) {
              segments.push(line.substring(lastIndex));
            }
          }
        }

        return (
          <Box key={lineIndex}>
            <Text color="gray" dimColor>
              {String(lineIndex + 1).padStart(2, " ")}{" "}
            </Text>
            <Text>{segments}</Text>
          </Box>
        );
      });
    },
    [],
  );

  const renderToken = useCallback(
    (token: MarkdownToken, index: number): React.ReactNode => {
      switch (token.type) {
        case "heading":
          const headingSize = token.depth || 1;
          const headingColor =
            headingSize === 1
              ? "blueBright"
              : headingSize === 2
                ? "cyan"
                : headingSize === 3
                  ? "yellow"
                  : "magenta";

          // Different styling based on header level to make them feel larger
          const getHeadingStyle = (level: number) => {
            switch (level) {
              case 1: // H1 - largest
                return {
                  borderStyle: "double" as const,
                  borderColor: "blueBright",
                  paddingX: 2,
                  paddingY: 1,
                  marginBottom: 2,
                  marginTop: 1,
                  alignSelf: "flex-start" as const,
                };
              case 2: // H2 - medium
                return {
                  borderStyle: "single" as const,
                  borderColor: "cyan",
                  paddingX: 1,
                  paddingY: 1,
                  marginBottom: 2,
                  alignSelf: "flex-start" as const,
                };
              case 3: // H3 - smaller
                return {
                  borderStyle: "round" as const,
                  borderColor: "yellow",
                  paddingX: 1,
                  paddingY: 0,
                  marginBottom: 1,
                  alignSelf: "flex-start" as const,
                };
              default: // H4+ - minimal
                return {
                  marginBottom: 1,
                };
            }
          };

          const style = getHeadingStyle(headingSize);

          return (
            <Box key={index} {...style}>
              <Text color={headingColor} bold>
                {token.text}
              </Text>
            </Box>
          );

        case "paragraph":
          return (
            <Box key={index} marginBottom={1}>
              {token.tokens?.map((childToken, childIndex) =>
                renderToken(childToken, childIndex),
              ) || <Text>{token.text}</Text>}
            </Box>
          );

        case "list":
          return (
            <Box
              key={index}
              marginBottom={1}
              paddingLeft={2}
              flexDirection="column"
            >
              {(token as any).items?.map((listItem: any, listIndex: number) =>
                renderToken(listItem, listIndex),
              )}
            </Box>
          );

        case "list_item":
          // Check if this is a task list item (GFM checkbox)
          if ((token as any).task) {
            const isChecked = (token as any).checked;
            const taskText = token.text || "";
            return (
              <Box key={index} marginBottom={1}>
                <Text color={isChecked ? "green" : "red"}>
                  [{isChecked ? "✓" : " "}]
                </Text>
                <Text color={isChecked ? "gray" : "white"} dimColor={isChecked}>
                  {" "}
                  {taskText}
                </Text>
              </Box>
            );
          }

          // Regular list item
          if (token.tokens && token.tokens.length > 0) {
            return (
              <Box key={index}>
                <Text color="gray">• </Text>
                {token.tokens.map((childToken, childIndex) =>
                  renderToken(childToken, childIndex),
                )}
              </Box>
            );
          } else {
            // If no tokens, parse the text content
            const textTokens = marked.lexer(
              token.text || "",
            ) as MarkdownToken[];
            return (
              <Box key={index}>
                <Text color="gray">• </Text>
                {textTokens.map((childToken, childIndex) =>
                  renderToken(childToken, childIndex),
                )}
              </Box>
            );
          }

        case "checkbox":
          // This is handled in list_item case
          return null;

        case "text":
          return <Text key={index}>{token.text}</Text>;

        case "code":
          return (
            <Box
              key={index}
              marginBottom={1}
              borderStyle="round"
              borderColor="gray"
            >
              {token.lang && (
                <Box backgroundColor="gray" paddingX={1}>
                  <Text color="white" bold>
                    {token.lang}
                  </Text>
                </Box>
              )}
              <Box flexDirection="column" paddingX={1}>
                {highlightCode(token.text || "", token.lang)}
              </Box>
            </Box>
          );

        case "codespan":
          return (
            <Text key={index} backgroundColor="gray" color="green">
              `{token.text}`
            </Text>
          );

        case "blockquote":
          return (
            <Box
              key={index}
              marginBottom={1}
              paddingLeft={2}
              borderStyle="single"
              borderLeft
              borderColor="cyan"
            >
              <Text color="cyan" italic>
                {token.text}
              </Text>
            </Box>
          );

        case "strong":
          return (
            <Text key={index} bold color="white">
              {token.tokens?.map((childToken, childIndex) =>
                renderToken(childToken, childIndex),
              ) || token.text}
            </Text>
          );

        case "em":
          return (
            <Text key={index} italic color="white">
              {token.tokens?.map((childToken, childIndex) =>
                renderToken(childToken, childIndex),
              ) || token.text}
            </Text>
          );

        case "link":
          return (
            <Text key={index} color="blue" underline>
              {token.text} ({token.href})
            </Text>
          );

        case "table":
          // Render table as simple text format
          const tableToken = token as any;
          let tableText = "";

          if (tableToken.header && Array.isArray(tableToken.header)) {
            // Header row
            tableText +=
              tableToken.header
                .map((h: any) => (typeof h === "string" ? h : h.text || h))
                .join(" | ") + "\n";
            // Separator
            tableText += tableToken.header.map(() => "---").join(" | ") + "\n";
          }

          if (tableToken.rows && Array.isArray(tableToken.rows)) {
            // Data rows
            tableToken.rows.forEach((row: any[]) => {
              tableText +=
                row
                  .map((cell: any) => {
                    if (typeof cell === "string") return cell;
                    if (cell && typeof cell === "object" && cell.text)
                      return cell.text;
                    return "";
                  })
                  .join(" | ") + "\n";
            });
          }

          return (
            <Box key={index} marginBottom={1}>
              <Text>{tableText}</Text>
            </Box>
          );

        case "del":
          return (
            <Text key={index} strikethrough color="gray" dimColor>
              {token.tokens?.map((childToken, childIndex) =>
                renderToken(childToken, childIndex),
              ) || token.text}
            </Text>
          );

        case "hr":
          return (
            <Box key={index} marginBottom={1}>
              <Text color="gray">
                {"─".repeat(Math.min(50, process.stdout.columns || 50))}
              </Text>
            </Box>
          );

        case "space":
          return <Text key={index}> </Text>;

        default:
          if (token.text) {
            return <Text key={index}>{token.text}</Text>;
          }
          if (token.tokens) {
            return (
              <Text key={index}>
                {token.tokens.map((childToken, childIndex) =>
                  renderToken(childToken, childIndex),
                )}
              </Text>
            );
          }
          return null;
      }
    },
    [highlightCode],
  );

  // Calculate visible content based on offset
  const visibleTokens = tokens.slice(offset);
  const hasMore = offset + visibleTokens.length < tokens.length;
  const scrollPercentage =
    tokens.length > 0 ? Math.round((offset / tokens.length) * 100) : 0;

  return (
    <Box flexDirection="column" height="100%">
      {title && (
        <Box marginBottom={1}>
          <Text color="blue" bold underline>
            {title}
            {currentDate && (
              <Text color="cyan">
                {" "}
                ({currentDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })})
              </Text>
            )}
          </Text>
        </Box>
      )}

      <Box flexDirection="column" flexGrow={1}>
        {visibleTokens.map((token, index) => renderToken(token, index))}
      </Box>

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          {hasMore && "-- More -- "}
          {tokens.length > 0 && `(${scrollPercentage}% scrolled) `}|
          {onNavigatePrevious && " ←/h: prev day "}
          {onNavigateNext && " →/l: next day | "}
          {onEdit && " e: edit | "}
          ↑↓/j/k: scroll | g/G: top/bottom | q/ESC: exit
        </Text>
      </Box>
    </Box>
  );
};

export default MarkdownPreview;
