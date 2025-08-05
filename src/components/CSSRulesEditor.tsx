"use client";

import { useState, useEffect } from "react";

interface CSSRulesEditorProps {
  rules: Record<string, Record<string, string>>;
  onChange: (rules: Record<string, Record<string, string>>) => void;
  title: string;
  description?: string;
}

export default function CSSRulesEditor({
  rules,
  onChange,
  title,
  description,
}: CSSRulesEditorProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const jsonString = JSON.stringify(rules, null, 2);
      setJsonInput(jsonString);
      setIsValid(true);
      setError(null);
    } catch (err) {
      setError("Failed to format rules");
    }
  }, [rules]);

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
      // Try to parse as JavaScript object first (allows single quotes)
      let parsed;
      try {
        // Use Function constructor to safely evaluate JavaScript object syntax
        parsed = new Function(`return ${newValue}`)();
      } catch (jsError) {
        // If JavaScript parsing fails, try strict JSON
        parsed = JSON.parse(newValue);
      }

      console.log("Parsed object:", parsed);
      console.log("Type:", typeof parsed);
      console.log("Is Array:", Array.isArray(parsed));

      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        // Validate that all values are objects with string values
        const isValidObject = Object.values(parsed).every((value) => {
          const isObject =
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value);
          const hasStringValues =
            isObject &&
            Object.values(value).every((v) => typeof v === "string");
          console.log(
            "Value:",
            value,
            "isObject:",
            isObject,
            "hasStringValues:",
            hasStringValues
          );
          return isObject && hasStringValues;
        });

        if (isValidObject) {
          setIsValid(true);
          setError(null);
          onChange(parsed);
        } else {
          setIsValid(false);
          setError("All values must be objects with string properties");
        }
      } else {
        setIsValid(false);
        setError("Must be a valid object (not an array)");
      }
    } catch (err) {
      console.error("Parse error:", err);
      setIsValid(false);
      setError("Invalid object format. Use JavaScript object syntax or JSON.");
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
    const defaultRules = {
      '[data-testid="list-item-v2-label"]': {
        color: "red",
      },
    };
    onChange(defaultRules);
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
  '[data-testid="list-item-v2-label"]': {
    color: "red"
  },
  '.custom-class': {
    "background-color": "#f0f0f0",
    "font-size": "14px"
  }
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
        Enter CSS rules as a JavaScript object with CSS selectors as keys and
        style objects as values. Supports both JavaScript object syntax and
        JSON.
      </p>
    </div>
  );
}
