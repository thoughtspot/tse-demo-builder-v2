"use client";

import React from "react";

interface FormattedMessageProps {
  content: string;
  className?: string;
}

export default function FormattedMessage({
  content,
  className = "",
}: FormattedMessageProps) {
  // Function to parse and format the content
  const formatContent = (text: string) => {
    // Split content into lines
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];
    let currentNumberedList: string[] = [];
    let listType: "bullet" | "numbered" | null = null;
    let key = 0;

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul
            key={`list-${key++}`}
            style={{
              margin: "12px 0",
              paddingLeft: "24px",
              listStyleType: "disc",
            }}
          >
            {currentList.map((item, index) => (
              <li
                key={index}
                style={{
                  margin: "6px 0",
                  lineHeight: "1.6",
                  color: "#374151",
                }}
              >
                {formatInlineText(item)}
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
      if (currentNumberedList.length > 0) {
        elements.push(
          <ol
            key={`numbered-${key++}`}
            style={{
              margin: "12px 0",
              paddingLeft: "24px",
              listStyleType: "decimal",
            }}
          >
            {currentNumberedList.map((item, index) => (
              <li
                key={index}
                style={{
                  margin: "6px 0",
                  lineHeight: "1.6",
                  color: "#374151",
                }}
              >
                {formatInlineText(item)}
              </li>
            ))}
          </ol>
        );
        currentNumberedList = [];
      }
    };

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // Check for bullet points (including indented ones)
      if (line.match(/^\s*[-•*]/)) {
        if (listType !== "bullet") {
          flushList();
          listType = "bullet";
        }
        currentList.push(trimmedLine.replace(/^[-•*]\s*/, ""));
        return;
      }

      // Check for numbered lists
      if (trimmedLine.match(/^\d+\./)) {
        if (listType !== "numbered") {
          flushList();
          listType = "numbered";
        }
        currentNumberedList.push(trimmedLine.replace(/^\d+\.\s*/, ""));
        return;
      }

      // If we hit a non-list line, flush any current list
      if (listType !== null) {
        flushList();
        listType = null;
      }

      // Handle empty lines as paragraph breaks
      if (trimmedLine === "") {
        if (
          elements.length > 0 &&
          elements[elements.length - 1] !== <br key={`br-${key++}`} />
        ) {
          elements.push(<br key={`br-${key++}`} />);
        }
        return;
      }

      // Regular paragraph
      elements.push(
        <p
          key={`p-${key++}`}
          style={{
            margin: "12px 0",
            lineHeight: "1.6",
            color: "#374151",
          }}
        >
          {formatInlineText(trimmedLine)}
        </p>
      );
    });

    // Flush any remaining lists
    flushList();

    return elements;
  };

  // Function to format inline text (bold, italic, code)
  const formatInlineText = (text: string): React.ReactNode => {
    // Handle bold text **text**
    const boldParts = text.split(/(\*\*.*?\*\*)/g);
    const boldFormatted = boldParts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const content = part.slice(2, -2);
        return (
          <strong key={`bold-${index}`} style={{ fontWeight: "bold" }}>
            {content}
          </strong>
        );
      }
      return part;
    });

    // Handle italic text *text* (but not **text**)
    const italicFormatted = boldFormatted.flatMap((part, partIndex) => {
      if (typeof part === "string") {
        const italicParts = part.split(/(\*[^*].*?\*)/g);
        return italicParts.map((italicPart, index) => {
          if (
            italicPart.startsWith("*") &&
            italicPart.endsWith("*") &&
            !italicPart.startsWith("**")
          ) {
            const content = italicPart.slice(1, -1);
            return (
              <em
                key={`italic-${partIndex}-${index}`}
                style={{ fontStyle: "italic" }}
              >
                {content}
              </em>
            );
          }
          return italicPart;
        });
      }
      return [part];
    });

    // Handle code text `text`
    const codeFormatted = italicFormatted.flatMap((part, partIndex) => {
      if (typeof part === "string") {
        const codeParts = part.split(/(`.*?`)/g);
        return codeParts.map((codePart, index) => {
          if (codePart.startsWith("`") && codePart.endsWith("`")) {
            const content = codePart.slice(1, -1);
            return (
              <code
                key={`code-${partIndex}-${index}`}
                style={{
                  backgroundColor: "#f1f5f9",
                  padding: "2px 4px",
                  borderRadius: "3px",
                  fontFamily: "monospace",
                  fontSize: "0.9em",
                }}
              >
                {content}
              </code>
            );
          }
          return codePart;
        });
      }
      return [part];
    });

    return codeFormatted;
  };

  return (
    <div className={className} style={{ whiteSpace: "pre-wrap" }}>
      {formatContent(content)}
    </div>
  );
}
