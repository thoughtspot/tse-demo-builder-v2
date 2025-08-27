"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface EmbedFlagsEditorProps {
  embedFlags: {
    spotterEmbed?: Record<string, unknown>;
    liveboardEmbed?: Record<string, unknown>;
    searchEmbed?: Record<string, unknown>;
    appEmbed?: Record<string, unknown>;
  };
  embedDisplay?: {
    hideTitle?: boolean;
    hideDescription?: boolean;
  };
  onChange: (embedFlags: {
    spotterEmbed?: Record<string, unknown>;
    liveboardEmbed?: Record<string, unknown>;
    searchEmbed?: Record<string, unknown>;
    appEmbed?: Record<string, unknown>;
  }) => void;
  onEmbedDisplayChange: (embedDisplay: {
    hideTitle?: boolean;
    hideDescription?: boolean;
  }) => void;
}

export default function EmbedFlagsEditor({
  embedFlags,
  embedDisplay = {},
  onChange,
  onEmbedDisplayChange,
}: EmbedFlagsEditorProps) {
  const [localFlags, setLocalFlags] = useState({
    spotterEmbed: JSON.stringify(embedFlags.spotterEmbed || {}, null, 2),
    liveboardEmbed: JSON.stringify(embedFlags.liveboardEmbed || {}, null, 2),
    searchEmbed: JSON.stringify(embedFlags.searchEmbed || {}, null, 2),
    appEmbed: JSON.stringify(embedFlags.appEmbed || {}, null, 2),
  });

  const [errors, setErrors] = useState({
    spotterEmbed: "",
    liveboardEmbed: "",
    searchEmbed: "",
    appEmbed: "",
  });

  // Track which sections have unsaved changes
  const [unsavedChanges, setUnsavedChanges] = useState({
    spotterEmbed: false,
    liveboardEmbed: false,
    searchEmbed: false,
    appEmbed: false,
  });

  // Scroll position preservation
  const scrollPositionRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalFlags({
      spotterEmbed: JSON.stringify(embedFlags.spotterEmbed || {}, null, 2),
      liveboardEmbed: JSON.stringify(embedFlags.liveboardEmbed || {}, null, 2),
      searchEmbed: JSON.stringify(embedFlags.searchEmbed || {}, null, 2),
      appEmbed: JSON.stringify(embedFlags.appEmbed || {}, null, 2),
    });
    // Reset unsaved changes when props change
    setUnsavedChanges({
      spotterEmbed: false,
      liveboardEmbed: false,
      searchEmbed: false,
      appEmbed: false,
    });
  }, [embedFlags]);

  // Restore scroll position after re-render
  useEffect(() => {
    if (scrollPositionRef.current > 0 && containerRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = scrollPositionRef.current;
        }
      });
    }
  });

  // Save scroll position before any state changes
  const saveScrollPosition = useCallback(() => {
    if (containerRef.current) {
      scrollPositionRef.current = containerRef.current.scrollTop;
    }
  }, []);

  const validateAndUpdate = useCallback(
    (type: keyof typeof localFlags, value: string) => {
      // Save current scroll position before update
      saveScrollPosition();

      setLocalFlags((prev) => ({ ...prev, [type]: value }));

      // Mark as having unsaved changes
      setUnsavedChanges((prev) => ({ ...prev, [type]: true }));

      // Clear any existing error
      setErrors((prev) => ({ ...prev, [type]: "" }));
    },
    [saveScrollPosition]
  );

  const applyChanges = useCallback(
    (type: keyof typeof localFlags) => {
      const value = localFlags[type];

      try {
        let parsed;
        if (value.trim() === "") {
          parsed = {};
        } else {
          // Try JSON.parse first (for strict JSON), then try Function constructor (for JS object literals)
          try {
            parsed = JSON.parse(value);
          } catch {
            // If JSON.parse fails, try parsing as JavaScript object literal
            // Wrap in parentheses to ensure it's treated as an object literal
            const wrappedValue = `(${value})`;
            parsed = Function(`return ${wrappedValue}`)();
          }
        }

        setErrors((prev) => ({ ...prev, [type]: "" }));

        const newFlags = {
          ...embedFlags,
          [type]: parsed,
        };
        onChange(newFlags);

        // Mark as saved
        setUnsavedChanges((prev) => ({ ...prev, [type]: false }));
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          [type]:
            error instanceof Error
              ? error.message
              : "Invalid configuration format",
        }));
      }
    },
    [localFlags, embedFlags, onChange]
  );

  // Helper function to handle embed display changes with scroll preservation
  const handleEmbedDisplayChange = useCallback(
    (newEmbedDisplay: typeof embedDisplay) => {
      // Save current scroll position before update
      saveScrollPosition();
      onEmbedDisplayChange(newEmbedDisplay);
    },
    [onEmbedDisplayChange, saveScrollPosition]
  );

  const embedTypes = [
    {
      key: "spotterEmbed" as const,
      name: "Spotter Embed",
      description: "Flags specific to SpotterEmbed configuration",
    },
    {
      key: "liveboardEmbed" as const,
      name: "Liveboard Embed",
      description: "Flags specific to LiveboardEmbed configuration",
    },
    {
      key: "searchEmbed" as const,
      name: "Search Embed",
      description: "Flags specific to SearchEmbed configuration",
    },
    {
      key: "appEmbed" as const,
      name: "App Embed",
      description: "Flags specific to AppEmbed configuration",
    },
  ];

  return (
    <div ref={containerRef}>
      {/* Embed Display Configuration */}
      <div
        style={{
          marginBottom: "32px",
          padding: "20px",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          backgroundColor: "#fafafa",
        }}
      >
        <h4
          style={{
            fontSize: "18px",
            fontWeight: "600",
            marginBottom: "16px",
            color: "#2d3748",
          }}
        >
          Embed Display Options
        </h4>
        <p
          style={{
            fontSize: "14px",
            color: "#6b7280",
            marginBottom: "20px",
          }}
        >
          Configure how embedded content titles and descriptions are displayed.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              fontSize: "14px",
              color: "#374151",
            }}
          >
            <input
              type="checkbox"
              checked={embedDisplay.hideTitle || false}
              onChange={(e) =>
                handleEmbedDisplayChange({
                  ...embedDisplay,
                  hideTitle: e.target.checked,
                })
              }
              style={{
                marginRight: "8px",
                width: "16px",
                height: "16px",
              }}
            />
            Hide embedded content title
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              fontSize: "14px",
              color: "#374151",
            }}
          >
            <input
              type="checkbox"
              checked={embedDisplay.hideDescription || false}
              onChange={(e) =>
                handleEmbedDisplayChange({
                  ...embedDisplay,
                  hideDescription: e.target.checked,
                })
              }
              style={{
                marginRight: "8px",
                width: "16px",
                height: "16px",
              }}
            />
            Hide embedded content description
          </label>
        </div>

        <p
          style={{
            marginTop: "12px",
            fontSize: "12px",
            color: "#6b7280",
            fontStyle: "italic",
          }}
        >
          Note: If both title and description are hidden, the entire header
          container will be hidden.
        </p>
      </div>

      <h4
        style={{
          fontSize: "18px",
          fontWeight: "600",
          marginBottom: "20px",
        }}
      >
        Embed-Specific Flags
      </h4>
      <p
        style={{
          fontSize: "14px",
          color: "#6b7280",
          marginBottom: "24px",
        }}
      >
        Configure flags specific to each embed type. Enter valid JSON or
        JavaScript object literal syntax. Click &quot;Apply&quot; to save
        changes for each section.
      </p>

      {embedTypes.map(({ key, name, description }) => (
        <div
          key={key}
          style={{
            marginBottom: "24px",
            padding: "16px",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            backgroundColor: "#fafafa",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <h5
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#2d3748",
                margin: 0,
              }}
            >
              {name}
            </h5>
            <button
              onClick={() => applyChanges(key)}
              disabled={!unsavedChanges[key]}
              style={{
                padding: "6px 12px",
                backgroundColor: unsavedChanges[key] ? "#10b981" : "#9ca3af",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: unsavedChanges[key] ? "pointer" : "not-allowed",
                fontSize: "12px",
                fontWeight: "500",
              }}
            >
              {unsavedChanges[key] ? "Apply" : "Applied"}
            </button>
          </div>
          <p
            style={{
              fontSize: "12px",
              color: "#6b7280",
              marginBottom: "12px",
            }}
          >
            {description}
          </p>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
                fontSize: "14px",
                color: "#374151",
              }}
            >
              Configuration (JSON)
            </label>
            <textarea
              value={localFlags[key]}
              onChange={(e) => validateAndUpdate(key, e.target.value)}
              onKeyDown={(e) => {
                // Prevent form submission on Enter
                if (e.key === "Enter" && e.ctrlKey) {
                  e.preventDefault();
                  applyChanges(key);
                }
              }}
              placeholder={`Enter configuration for ${name}...\nExample:\n{\n  dataPanelV2: true\n}\nor\n{\n  &quot;dataPanelV2&quot;: true\n}\n\nPress Ctrl+Enter to apply changes.`}
              rows={6}
              style={{
                width: "100%",
                padding: "12px",
                border: errors[key] ? "1px solid #ef4444" : "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "13px",
                fontFamily: "monospace",
                resize: "vertical",
                backgroundColor: errors[key] ? "#fef2f2" : "#ffffff",
              }}
            />
            {errors[key] && (
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "12px",
                  color: "#ef4444",
                }}
              >
                Error: {errors[key]}
              </p>
            )}
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "12px",
                color: "#6b7280",
              }}
            >
              Enter valid JSON or JavaScript object literal syntax. Click
              &quot;Apply&quot; to save changes.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
