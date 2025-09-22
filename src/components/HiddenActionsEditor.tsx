"use client";

import { useState } from "react";
import { HiddenActionsConfig } from "../types/thoughtspot";

// Common ThoughtSpot actions using the actual Action enum values from the SDK
const COMMON_ACTIONS = [
  { name: "Add to Favorites", value: "addToFavorites" },
  { name: "Add to Watchlist", value: "addToWatchlist" },
  { name: "Answer Chart Switcher", value: "answerChartSwitcher" },
  { name: "Answer Delete", value: "onDeleteAnswer" },
  { name: "Ask AI", value: "AskAi" },
  { name: "Choose Data Sources", value: "chooseDataSources" },
  { name: "Collapse Data Panel", value: "collapseDataPanel" },
  { name: "Collapse Data Sources", value: "collapseDataSources" },
  { name: "Copy and Edit", value: "copyAEdit" },
  { name: "Create Liveboard", value: "createLiveboard" },
  { name: "Create Monitor", value: "createMonitor" },
  { name: "Download", value: "download" },
  { name: "Download as CSV", value: "downloadAsCSV" },
  { name: "Download as PDF", value: "downloadAsPdf" },
  { name: "Download as PNG", value: "downloadAsPng" },
  { name: "Download as XLSX", value: "downloadAsXLSX" },
  { name: "Drill Down", value: "DRILL" },
  { name: "Edit", value: "edit" },
  { name: "Edit a Copy", value: "editACopy" },
  { name: "Edit Sage Answer", value: "editSageAnswer" },
  { name: "Edit Title", value: "editTitle" },
  { name: "Edit TML", value: "editTSL" },
  { name: "Explain Insight", value: "explainInsight" },
  { name: "Explore", value: "explore" },
  { name: "Export TML", value: "exportTSL" },
  { name: "Import TML", value: "importTSL" },
  { name: "Insert Into Slide", value: "insertInToSlide" },
  { name: "Liveboard Info", value: "pinboardInfo" },
  { name: "Make a Copy", value: "makeACopy" },
  { name: "Manage Monitor", value: "manageMonitor" },
  { name: "Manage Pipelines", value: "manage-pipeline" },
  { name: "Mark as Verified", value: "markAsVerified" },
  { name: "Modify Sage Answer", value: "modifySageAnswer" },
  { name: "Pin", value: "pin" },
  { name: "Present", value: "present" },
  { name: "Query Details Buttons", value: "queryDetailsButtons" },
  { name: "Relate", value: "relate" },
  { name: "Save", value: "save" },
  { name: "Save as View", value: "saveAsView" },
  { name: "Schedule", value: "subscription" },
  { name: "Schedules List", value: "schedule-list" },
  { name: "Search on Top", value: "searchOnTop" },
  { name: "Share", value: "share" },
  { name: "Share Visualization", value: "shareViz" },
  { name: "Show Sage Query", value: "showSageQuery" },
  { name: "Show Underlying Data", value: "showUnderlyingData" },
  { name: "SpotIQ Analyze", value: "spotIQAnalyze" },
  { name: "SpotIQ Follow", value: "spotIQFollow" },
  { name: "Sync to Other Apps", value: "sync-to-other-apps" },
  { name: "Sync to Sheets", value: "sync-to-sheets" },
  { name: "Sync to Slack", value: "syncToSlack" },
  { name: "Sync to Teams", value: "syncToTeams" },
  { name: "TML", value: "tml" },
  { name: "Update", value: "update" },
  { name: "Update TML", value: "updateTSL" },
];

interface HiddenActionsEditorProps {
  config: HiddenActionsConfig;
  onChange: (config: HiddenActionsConfig) => void;
}

export default function HiddenActionsEditor({
  config,
  onChange,
}: HiddenActionsEditorProps) {
  const [customAction, setCustomAction] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleToggleEnabled = () => {
    onChange({
      ...config,
      enabled: !config.enabled,
    });
  };

  const handleToggleAction = (actionValue: string) => {
    const newActions = config.actions.includes(actionValue)
      ? config.actions.filter((a) => a !== actionValue)
      : [...config.actions, actionValue];

    onChange({
      ...config,
      actions: newActions,
    });
  };

  const handleAddCustomAction = () => {
    if (customAction.trim() && !config.actions.includes(customAction.trim())) {
      onChange({
        ...config,
        actions: [...config.actions, customAction.trim()],
      });
      setCustomAction("");
      setShowCustomInput(false);
    }
  };

  const handleRemoveCustomAction = (actionValue: string) => {
    onChange({
      ...config,
      actions: config.actions.filter((a) => a !== actionValue),
    });
  };

  const isCustomAction = (actionValue: string) => {
    return !COMMON_ACTIONS.some((a) => a.value === actionValue);
  };

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={handleToggleEnabled}
            style={{ margin: 0 }}
          />
          <span style={{ fontWeight: "bold" }}>
            Enable Hidden Actions Configuration
          </span>
        </label>
        <p style={{ margin: "8px 0 0 0", fontSize: "14px", color: "#666" }}>
          When enabled, selected actions will be hidden from the user in
          ThoughtSpot embeds. By default, all actions are visible.
        </p>
      </div>

      {config.enabled && (
        <div>
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "16px" }}>
              Common Actions
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                gap: "8px",
                maxHeight: "300px",
                overflowY: "auto",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "12px",
              }}
            >
              {COMMON_ACTIONS.map((action) => (
                <label
                  key={action.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "4px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={config.actions.includes(action.value)}
                    onChange={() => handleToggleAction(action.value)}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: "14px" }}>{action.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "16px" }}>
              Custom Actions
            </h4>
            <div style={{ marginBottom: "12px" }}>
              {!showCustomInput ? (
                <button
                  onClick={() => setShowCustomInput(true)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#3182ce",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Add Custom Action
                </button>
              ) : (
                <div
                  style={{ display: "flex", gap: "8px", alignItems: "center" }}
                >
                  <input
                    type="text"
                    value={customAction}
                    onChange={(e) => setCustomAction(e.target.value)}
                    placeholder="Enter custom action string"
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddCustomAction();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddCustomAction}
                    disabled={!customAction.trim()}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#3182ce",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px",
                      opacity: customAction.trim() ? 1 : 0.5,
                    }}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomAction("");
                    }}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#e2e8f0",
                      color: "#4a5568",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {config.actions.filter(isCustomAction).length > 0 && (
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "12px",
                  backgroundColor: "#f7fafc",
                }}
              >
                {config.actions.filter(isCustomAction).map((actionValue) => (
                  <div
                    key={actionValue}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px",
                      backgroundColor: "white",
                      borderRadius: "4px",
                      marginBottom: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span style={{ fontSize: "14px", fontFamily: "monospace" }}>
                      {actionValue}
                    </span>
                    <button
                      onClick={() => handleRemoveCustomAction(actionValue)}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#e53e3e",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
