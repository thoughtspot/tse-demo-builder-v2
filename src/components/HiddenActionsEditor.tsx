"use client";

import { useState, useEffect } from "react";
import { HiddenActionsConfig } from "../types/thoughtspot";

// Common ThoughtSpot actions from the SDK Action enum
const COMMON_ACTIONS = [
  //{ name: "Add Column Set", value: "AddColumnSet" },
  //{ name: "Add Data Panel Objects", value: "AddDataPanelObjects" },
  //{ name: "Add Filter", value: "AddFilter" },
  //{ name: "Add Formula", value: "AddFormula" },
  //{ name: "Add Parameter", value: "AddParameter" },
  //{ name: "Add Query Set", value: "AddQuerySet" },
  //{ name: "Add Tab", value: "AddTab" },
  { name: "Add to Favorites", value: "AddToFavorites" },
  { name: "Add to Watchlist", value: "AddToWatchlist" },
  { name: "AI Highlights", value: "AIHighlights" },
  //{ name: "Analysis Info", value: "AnalysisInfo" },
  { name: "Answer Chart Switcher", value: "AnswerChartSwitcher" },
  { name: "Answer Delete", value: "AnswerDelete" },
  { name: "Ask AI", value: "AskAi" },
  //{ name: "Axis Menu Aggregate", value: "AxisMenuAggregate" },
  //{ name: "Axis Menu Conditional Format", value: "AxisMenuConditionalFormat" },
  //{ name: "Axis Menu Edit", value: "AxisMenuEdit" },
  //{ name: "Axis Menu Filter", value: "AxisMenuFilter" },
  //{ name: "Axis Menu Group", value: "AxisMenuGroup" },
  //{ name: "Axis Menu Number Format", value: "AxisMenuNumberFormat" },
  //{ name: "Axis Menu Position", value: "AxisMenuPosition" },
  //{ name: "Axis Menu Remove", value: "AxisMenuRemove" },
  //{ name: "Axis Menu Rename", value: "AxisMenuRename" },
  //{ name: "Axis Menu Sort", value: "AxisMenuSort" },
  //{ name: "Axis Menu Text Wrapping", value: "AxisMenuTextWrapping" },
  //{ name: "Axis Menu Time Bucket", value: "AxisMenuTimeBucket" },
  //{
  //name: "Change Filter Visibility in Tab",
  //value: "ChangeFilterVisibilityInTab",
  //},
  { name: "Choose Data Sources", value: "ChooseDataSources" },
  { name: "Collapse Data Panel", value: "CollapseDataPanel" },
  { name: "Collapse Data Sources", value: "CollapseDataSources" },
  //{ name: "Column Rename", value: "ColumnRename" },
  //{ name: "Configure Filter", value: "ConfigureFilter" },
  { name: "Copy and Edit", value: "CopyAndEdit" },
  //{ name: "Copy Link", value: "CopyLink" },
  //{ name: "Copy to Clipboard", value: "CopyToClipboard" },
  //{
  //name: "Cover and Filter Option in PDF",
  //value: "CoverAndFilterOptionInPDF",
  //},
  { name: "Create Liveboard", value: "CreateLiveboard" },
  { name: "Create Monitor", value: "CreateMonitor" },
  //{ name: "Cross Filter", value: "CrossFilter" },
  //{ name: "Customize Headlines", value: "CustomizeHeadlines" },
  //{ name: "Delete Previous Prompt", value: "DeletePreviousPrompt" },
  //{ name: "Delete Schedule Homepage", value: "DeleteScheduleHomepage" },
  //{ name: "Describe", value: "Describe" },
  //{ name: "Disable Chip Reorder", value: "DisableChipReorder" },
  { name: "Download", value: "Download" },
  { name: "Download as CSV", value: "DownloadAsCsv" },
  { name: "Download as PDF", value: "DownloadAsPdf" },
  { name: "Download as PNG", value: "DownloadAsPng" },
  { name: "Download as XLSX", value: "DownloadAsXlsx" },
  //{ name: "Download Embrace Queries", value: "DownloadEmbraceQueries" },
  //{ name: "Download Trace", value: "DownloadTrace" },
  { name: "Drill Down", value: "DrillDown" },
  //{ name: "Drill Edit", value: "DrillEdit" },
  //{ name: "Drill Exclude", value: "DrillExclude" },
  //{ name: "Drill Include", value: "DrillInclude" },
  { name: "Edit", value: "Edit" },
  { name: "Edit a Copy", value: "EditACopy" },
  //{ name: "Edit Details", value: "EditDetails" },
  //{ name: "Edit Measure", value: "EditMeasure" },
  //{ name: "Edit Previous Prompt", value: "EditPreviousPrompt" },
  { name: "Edit Sage Answer", value: "EditSageAnswer" },
  //{ name: "Edit Schedule Homepage", value: "EditScheduleHomepage" },
  { name: "Edit Title", value: "EditTitle" },
  { name: "Edit TML", value: "EditTML" },
  //{ name: "Edit Tokens", value: "EditTokens" },
  //{
  //name: "Enable Contextual Change Analysis",
  //value: "EnableContextualChangeAnalysis",
  //},
  //{
  //name: "Enable Iterative Change Analysis",
  //value: "EnableIterativeChangeAnalysis",
  //},
  { name: "Explain Insight", value: "ExplainInsight" },
  { name: "Explore", value: "Explore" },
  { name: "Export TML", value: "ExportTML" },
  { name: "Import TML", value: "ImportTML" },
  //{ name: "In Conversation Training", value: "InConversationTraining" },
  { name: "Insert Into Slide", value: "InsertInToSlide" },
  { name: "KPI Analysis CTA", value: "KPIAnalysisCTA" },
  { name: "Liveboard Info", value: "LiveboardInfo" },
  //{ name: "Liveboard Users", value: "LiveboardUsers" },
  { name: "Make a Copy", value: "MakeACopy" },
  { name: "Manage Monitor", value: "ManageMonitor" },
  { name: "Manage Pipelines", value: "ManagePipelines" },
  { name: "Manage Tags", value: "ManageTags" },
  { name: "Mark as Verified", value: "MarkAsVerified" },
  { name: "Modify Sage Answer", value: "ModifySageAnswer" },
  //{ name: "Move to Tab", value: "MoveToTab" },
  //{ name: "Organise Favourites", value: "OrganiseFavourites" },
  //{ name: "Pause Schedule Homepage", value: "PauseScheduleHomepage" },
  //{ name: "Personalised Views Dropdown", value: "PersonalisedViewsDropdown" },
  { name: "Pin", value: "Pin" },
  //{ name: "Pinboard Info", value: "PinboardInfo" },
  { name: "Present", value: "Present" },
  { name: "Preview Data Spotter", value: "PreviewDataSpotter" },
  { name: "Query Details Buttons", value: "QueryDetailsButtons" },
  { name: "Relate", value: "Relate" },
  //{ name: "Remove", value: "Remove" },
  //{ name: "Remove Cross Filter", value: "RemoveCrossFilter" },
  //{ name: "Remove from Watchlist", value: "RemoveFromWatchlist" },
  //{
  //name: "Rename Modal Title Description",
  //value: "RenameModalTitleDescription",
  //},
  //{ name: "Replay Search", value: "ReplaySearch" },
  //{ name: "Report Error", value: "ReportError" },
  //{ name: "Request Access", value: "RequestAccess" },
  //{ name: "Request Verification", value: "RequestVerification" },
  //{ name: "Reset Layout", value: "ResetLayout" },
  //{ name: "Reset Spotter Chat", value: "ResetSpotterChat" },
  //{ name: "Sage Answer Feedback", value: "SageAnswerFeedback" },
  { name: "Save", value: "Save" },
  { name: "Save as View", value: "SaveAsView" },
  //{ name: "Save Untitled", value: "SaveUntitled" },
  { name: "Schedule", value: "Schedule" },
  { name: "Schedules List", value: "SchedulesList" },
  { name: "Search on Top", value: "SearchOnTop" },
  //{ name: "Send Answer Feedback", value: "SendAnswerFeedback" },
  //{ name: "Separator", value: "Separator" },
  { name: "Share", value: "Share" },
  { name: "Share Visualization", value: "ShareViz" },
  { name: "Show Sage Query", value: "ShowSageQuery" },
  { name: "Show Underlying Data", value: "ShowUnderlyingData" },
  { name: "SpotIQ Analyze", value: "SpotIQAnalyze" },
  { name: "SpotIQ Follow", value: "SpotIQFollow" },
  //{ name: "Spotter Feedback", value: "SpotterFeedback" },
  //{ name: "Subscription", value: "Subscription" },
  { name: "Sync to Other Apps", value: "SyncToOtherApps" },
  { name: "Sync to Sheets", value: "SyncToSheets" },
  { name: "Sync to Slack", value: "SyncToSlack" },
  { name: "Sync to Teams", value: "SyncToTeams" },
  { name: "TML", value: "TML" },
  //{ name: "Toggle Size", value: "ToggleSize" },
  //{ name: "Ungroup", value: "Ungroup" },
  //{
  //name: "Unsubscribe Schedule Homepage",
  //value: "UnsubscribeScheduleHomepage",
  //},
  { name: "Update", value: "Update" },
  { name: "Update TML", value: "UpdateTML" },
  //{ name: "Verified Liveboard", value: "VerifiedLiveboard" },
  //{ name: "View Schedule Run Homepage", value: "ViewScheduleRunHomepage" },
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

  const getActionName = (actionValue: string) => {
    const commonAction = COMMON_ACTIONS.find((a) => a.value === actionValue);
    return commonAction ? commonAction.name : actionValue;
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
