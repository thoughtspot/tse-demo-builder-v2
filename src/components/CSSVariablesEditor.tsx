"use client";

import { useState, useEffect } from "react";

interface CSSVariablesEditorProps {
  variables: Record<string, string>;
  onChange: (variables: Record<string, string>) => void;
  title: string;
  description?: string;
}

export default function CSSVariablesEditor({
  variables,
  onChange,
  title,
  description,
}: CSSVariablesEditorProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const jsonString = JSON.stringify(variables, null, 2);
      setJsonInput(jsonString);
      setIsValid(true);
      setError(null);
    } catch (err) {
      setError("Failed to format variables");
    }
  }, [variables]);

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setJsonInput(newValue);

    if (newValue.trim() === "") {
      setIsValid(true);
      setError(null);
      onChange({});
      return;
    }

    try {
      const parsed = JSON.parse(newValue);
      if (typeof parsed === "object" && parsed !== null) {
        // Validate that all values are strings
        const isValidObject = Object.values(parsed).every(
          (value) => typeof value === "string"
        );

        if (isValidObject) {
          setIsValid(true);
          setError(null);
          onChange(parsed);
        } else {
          setIsValid(false);
          setError("All values must be strings");
        }
      } else {
        setIsValid(false);
        setError("Must be a valid JSON object");
      }
    } catch (err) {
      setIsValid(false);
      setError("Invalid JSON format");
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonInput(formatted);
      setIsValid(true);
      setError(null);
    } catch (err) {
      setError("Cannot format invalid JSON");
    }
  };

  const handleReset = () => {
    const defaultVariables = {
      "--ts-var-button--secondary-background": "#F0EBFF",
      "--ts-var-button--secondary--hover-background": "#E3D9FC",
      "--ts-var-root-background": "#F7F5FF",
    };
    onChange(defaultVariables);
  };

  const handleGenerateNavColors = () => {
    // This function demonstrates how the automatic color generation works
    const sampleBg = "#f7fafc";
    const sampleFg = "#4a5568";

    // Simple color generation logic (simplified version of what's in SideNav)
    const isLightBg = true; // Sample light background
    const hoverFactor = isLightBg ? -0.08 : 0.12;

    const exampleColors = {
      "Sample Background": sampleBg,
      "Sample Foreground": sampleFg,
      "Generated Hover": "#e2e8f0", // Simplified example
      "Generated Selected": "#3182ce",
      "Generated Selected Text": "#ffffff",
    };

    alert(
      `Automatic Navigation Color Generation Example:\n\n${Object.entries(
        exampleColors
      )
        .map(([key, value]) => `${key}: ${value}`)
        .join(
          "\n"
        )}\n\nHover colors are automatically generated based on your background color. For light backgrounds, hover is slightly darker. For dark backgrounds, hover is slightly lighter.`
    );
  };

  const handleClear = () => {
    setJsonInput("");
    onChange({});
  };

  return (
    <div style={{ marginBottom: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <h4
          style={{
            fontSize: "16px",
            fontWeight: "600",
            margin: 0,
          }}
        >
          {title}
        </h4>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleFormat}
            style={{
              padding: "4px 8px",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Format
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: "4px 8px",
              backgroundColor: "#f59e0b",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Reset
          </button>
          <button
            onClick={handleGenerateNavColors}
            style={{
              padding: "4px 8px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
            title="Learn about automatic navigation color generation"
          >
            Nav Colors
          </button>
          <button
            onClick={handleClear}
            style={{
              padding: "4px 8px",
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
            title="Clear all content"
          >
            Clear
          </button>
        </div>
      </div>

      {description && (
        <p
          style={{
            fontSize: "14px",
            color: "#6b7280",
            marginBottom: "16px",
          }}
        >
          {description}
        </p>
      )}

      <textarea
        value={jsonInput}
        onChange={handleJsonChange}
        onKeyDown={(e) => {
          // Allow Ctrl+A to select all
          if (e.ctrlKey && e.key === "a") {
            e.preventDefault();
            e.currentTarget.select();
          }
          // Allow Ctrl+V to paste and replace
          if (e.ctrlKey && e.key === "v") {
            // Let the default paste happen, then select all
            setTimeout(() => {
              e.currentTarget.select();
            }, 0);
          }
        }}
        placeholder={`{
  "--ts-var-button--secondary-background": "#F0EBFF",
  "--ts-var-button--secondary--hover-background": "#E3D9FC",
  "--ts-var-root-background": "#F7F5FF"
}`}
        style={{
          width: "100%",
          minHeight: "200px",
          padding: "12px",
          border: `1px solid ${isValid ? "#d1d5db" : "#dc2626"}`,
          borderRadius: "4px",
          fontSize: "14px",
          fontFamily: "monospace",
          resize: "vertical",
          lineHeight: "1.5",
          cursor: "text",
        }}
      />

      {error && (
        <p
          style={{
            margin: "4px 0 0 0",
            fontSize: "12px",
            color: "#dc2626",
          }}
        >
          {error}
        </p>
      )}

      <p
        style={{
          margin: "4px 0 0 0",
          fontSize: "12px",
          color: "#6b7280",
        }}
      >
        Enter CSS variables as a JSON object with string values
      </p>
    </div>
  );
}
