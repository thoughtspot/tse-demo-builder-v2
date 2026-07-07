"use client";

import { useRef, useState } from "react";
import { SDKActionsConfig, SDKActionsMode } from "../types/thoughtspot";

// Used only for autocomplete suggestions — not an exhaustive or authoritative list.
const SUGGESTIONS = [
  { label: "Add to Favorites", value: "addToFavorites" },
  { label: "Add to Watchlist", value: "addToWatchlist" },
  { label: "Answer Chart Switcher", value: "answerChartSwitcher" },
  { label: "Answer Delete", value: "onDeleteAnswer" },
  { label: "Ask AI", value: "AskAi" },
  { label: "Choose Data Sources", value: "chooseDataSources" },
  { label: "Collapse Data Panel", value: "collapseDataPanel" },
  { label: "Collapse Data Sources", value: "collapseDataSources" },
  { label: "Copy and Edit", value: "copyAEdit" },
  { label: "Create Liveboard", value: "createLiveboard" },
  { label: "Create Monitor", value: "createMonitor" },
  { label: "Download", value: "download" },
  { label: "Download as CSV", value: "downloadAsCSV" },
  { label: "Download as PDF", value: "downloadAsPdf" },
  { label: "Download as PNG", value: "downloadAsPng" },
  { label: "Download as XLSX", value: "downloadAsXLSX" },
  { label: "Drill Down", value: "DRILL" },
  { label: "Edit", value: "edit" },
  { label: "Edit a Copy", value: "editACopy" },
  { label: "Edit Sage Answer", value: "editSageAnswer" },
  { label: "Edit Title", value: "editTitle" },
  { label: "Edit TML", value: "editTSL" },
  { label: "Explain Insight", value: "explainInsight" },
  { label: "Explore", value: "explore" },
  { label: "Export TML", value: "exportTSL" },
  { label: "Import TML", value: "importTSL" },
  { label: "Insert Into Slide", value: "insertInToSlide" },
  { label: "Liveboard Info", value: "pinboardInfo" },
  { label: "Make a Copy", value: "makeACopy" },
  { label: "Manage Monitor", value: "manageMonitor" },
  { label: "Manage Pipelines", value: "manage-pipeline" },
  { label: "Mark as Verified", value: "markAsVerified" },
  { label: "Modify Sage Answer", value: "modifySageAnswer" },
  { label: "Pin", value: "pin" },
  { label: "Present", value: "present" },
  { label: "Query Details Buttons", value: "queryDetailsButtons" },
  { label: "Relate", value: "relate" },
  { label: "Save", value: "save" },
  { label: "Save as View", value: "saveAsView" },
  { label: "Schedule", value: "subscription" },
  { label: "Schedules List", value: "schedule-list" },
  { label: "Search on Top", value: "searchOnTop" },
  { label: "Share", value: "share" },
  { label: "Share Visualization", value: "shareViz" },
  { label: "Show Sage Query", value: "showSageQuery" },
  { label: "Show Underlying Data", value: "showUnderlyingData" },
  { label: "SpotIQ Analyze", value: "spotIQAnalyze" },
  { label: "SpotIQ Follow", value: "spotIQFollow" },
  { label: "Sync to Other Apps", value: "sync-to-other-apps" },
  { label: "Sync to Sheets", value: "sync-to-sheets" },
  { label: "Sync to Slack", value: "syncToSlack" },
  { label: "Sync to Teams", value: "syncToTeams" },
  { label: "TML", value: "tml" },
  { label: "Update", value: "update" },
  { label: "Update TML", value: "updateTSL" },
];

const MODE_OPTIONS: { value: SDKActionsMode; label: string; description: string }[] = [
  {
    value: "disabled",
    label: "Disabled",
    description: "Selected actions are grayed out and visible but non-interactive.",
  },
  {
    value: "hidden",
    label: "Hidden",
    description: "Selected actions are completely removed from the UI.",
  },
  {
    value: "visible",
    label: "Visible (allowlist)",
    description:
      "Only selected actions are shown; all others are hidden. Cannot be combined with Hidden.",
  },
];

function getMatchingLabel(value: string): string {
  return SUGGESTIONS.find((s) => s.value === value)?.label ?? value;
}

interface SDKActionsEditorProps {
  config: SDKActionsConfig;
  onChange: (config: SDKActionsConfig) => void;
  isOverride?: boolean;
}

export default function SDKActionsEditor({
  config,
  onChange,
  isOverride = false,
}: SDKActionsEditorProps) {
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = inputValue.trim()
    ? SUGGESTIONS.filter(
        (s) =>
          !config.actions.includes(s.value) &&
          (s.label.toLowerCase().includes(inputValue.toLowerCase()) ||
            s.value.toLowerCase().includes(inputValue.toLowerCase()))
      ).slice(0, 8)
    : [];

  const addAction = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !config.actions.includes(trimmed)) {
      onChange({ ...config, actions: [...config.actions, trimmed] });
    }
    setInputValue("");
    setShowDropdown(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const removeAction = (value: string) => {
    onChange({ ...config, actions: config.actions.filter((a) => a !== value) });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, filteredSuggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
        addAction(filteredSuggestions[highlightedIndex].value);
      } else if (inputValue.trim()) {
        addAction(inputValue.trim());
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setHighlightedIndex(-1);
    } else if (e.key === "Backspace" && !inputValue && config.actions.length > 0) {
      removeAction(config.actions[config.actions.length - 1]);
    }
  };

  const enableLabel = isOverride
    ? "Override Standard Actions for this User"
    : "Enable Standard Actions Configuration";

  const enableHint = isOverride
    ? "When enabled, this user's action visibility settings override the global defaults."
    : "When enabled, the selected actions will be disabled, hidden, or restricted to only visible actions in ThoughtSpot embeds.";

  return (
    <div style={{ padding: "16px" }}>
      {/* Enable toggle */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={() => onChange({ ...config, enabled: !config.enabled })}
            style={{ margin: 0 }}
          />
          <span style={{ fontWeight: "bold" }}>{enableLabel}</span>
        </label>
        <p style={{ margin: "8px 0 0 0", fontSize: "14px", color: "#666" }}>
          {enableHint}
        </p>
      </div>

      {config.enabled && (
        <div>
          {/* Mode selector */}
          <div
            style={{
              marginBottom: "20px",
              padding: "16px",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              backgroundColor: "#f7fafc",
            }}
          >
            <h4 style={{ margin: "0 0 12px 0", fontSize: "15px", fontWeight: "600" }}>
              Action Mode
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {MODE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    cursor: "pointer",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    backgroundColor:
                      config.mode === option.value ? "#ebf4ff" : "transparent",
                    border:
                      config.mode === option.value
                        ? "1px solid #90cdf4"
                        : "1px solid transparent",
                  }}
                >
                  <input
                    type="radio"
                    name={isOverride ? "sdk-actions-mode-override" : "sdk-actions-mode"}
                    value={option.value}
                    checked={config.mode === option.value}
                    onChange={() => onChange({ ...config, mode: option.value })}
                    style={{ margin: "2px 0 0 0", flexShrink: 0 }}
                  />
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: "600" }}>
                      {option.label}
                    </span>
                    <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#718096" }}>
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Disabled reason */}
          {config.mode === "disabled" && (
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Disabled Reason{" "}
                <span style={{ fontWeight: "400", color: "#718096" }}>(optional)</span>
              </label>
              <input
                type="text"
                value={config.disabledReason || ""}
                onChange={(e) => onChange({ ...config, disabledReason: e.target.value })}
                placeholder="e.g. Contact your administrator to enable this action"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#718096" }}>
                Shown to users when they hover over a disabled action.
              </p>
            </div>
          )}

          {/* Action tag input */}
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "600" }}>
              {config.mode === "visible" ? "Actions to Show" : "Actions"}
            </h4>
            <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#718096" }}>
              {config.mode === "visible"
                ? "Only these actions will be visible. All others are hidden."
                : config.mode === "hidden"
                ? "These actions will be completely removed from the UI."
                : "These actions will be grayed out and non-interactive."}
            </p>
            <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#718096" }}>
              Type an action name or SDK value and press <kbd style={{ padding: "1px 5px", border: "1px solid #cbd5e0", borderRadius: "3px", fontSize: "12px", backgroundColor: "#f7fafc" }}>Enter</kbd> to add it.
              For example, type <code style={{ fontSize: "12px", backgroundColor: "#f7fafc", padding: "1px 5px", borderRadius: "3px", border: "1px solid #e2e8f0" }}>download</code>,{" "}
              <code style={{ fontSize: "12px", backgroundColor: "#f7fafc", padding: "1px 5px", borderRadius: "3px", border: "1px solid #e2e8f0" }}>DRILL</code>, or{" "}
              <code style={{ fontSize: "12px", backgroundColor: "#f7fafc", padding: "1px 5px", borderRadius: "3px", border: "1px solid #e2e8f0" }}>editTSL</code>.
              The dropdown shows matching known actions as you type.
              <kbd style={{ marginLeft: "6px", padding: "1px 5px", border: "1px solid #cbd5e0", borderRadius: "3px", fontSize: "12px", backgroundColor: "#f7fafc" }}>Backspace</kbd> on an empty field removes the last tag.
            </p>

            {/* Tag input box */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                alignItems: "center",
                padding: "8px",
                border: "1px solid #cbd5e0",
                borderRadius: "8px",
                backgroundColor: "#fff",
                cursor: "text",
                minHeight: "44px",
              }}
              onClick={() => inputRef.current?.focus()}
            >
              {config.actions.map((value) => (
                <span
                  key={value}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "3px 8px",
                    backgroundColor: "#ebf4ff",
                    border: "1px solid #90cdf4",
                    borderRadius: "4px",
                    fontSize: "13px",
                    color: "#2b6cb0",
                    fontFamily: "monospace",
                    whiteSpace: "nowrap",
                  }}
                >
                  {value}
                  {getMatchingLabel(value) !== value && (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#4a90d9",
                        fontFamily: "sans-serif",
                        fontStyle: "italic",
                      }}
                    >
                      ({getMatchingLabel(value)})
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAction(value);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "0 0 0 2px",
                      color: "#4a90d9",
                      fontSize: "14px",
                      lineHeight: 1,
                      display: "flex",
                      alignItems: "center",
                    }}
                    aria-label={`Remove ${value}`}
                  >
                    ×
                  </button>
                </span>
              ))}

              {/* Autocomplete input */}
              <div style={{ position: "relative", flex: 1, minWidth: "160px" }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setShowDropdown(true);
                    setHighlightedIndex(-1);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => {
                    // Small delay so click on suggestion registers first
                    setTimeout(() => setShowDropdown(false), 150);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={config.actions.length === 0 ? "Type action name or value…" : ""}
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    fontSize: "14px",
                    padding: "2px 4px",
                    background: "transparent",
                  }}
                />

                {showDropdown && filteredSuggestions.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      right: 0,
                      minWidth: "260px",
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                      zIndex: 100,
                      maxHeight: "220px",
                      overflowY: "auto",
                    }}
                  >
                    {filteredSuggestions.map((s, i) => (
                      <div
                        key={s.value}
                        onMouseDown={() => addAction(s.value)}
                        onMouseEnter={() => setHighlightedIndex(i)}
                        style={{
                          padding: "8px 12px",
                          cursor: "pointer",
                          backgroundColor:
                            i === highlightedIndex ? "#ebf4ff" : "transparent",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <span style={{ fontSize: "14px", color: "#1a202c" }}>
                          {s.label}
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#718096",
                            fontFamily: "monospace",
                          }}
                        >
                          {s.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {config.actions.length > 0 && (
              <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#718096" }}>
                {config.actions.length} action{config.actions.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
