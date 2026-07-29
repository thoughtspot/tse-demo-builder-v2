"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CustomActionConfig,
  CustomActionPosition,
  CustomActionTarget,
  CustomActionHandlerConfig,
  PrebuiltHandlerDefinition,
  ThoughtSpotContent,
} from "../types/thoughtspot";
import {
  fetchLiveboards,
  fetchAnswers,
  fetchModels,
  fetchModelDetails,
  fetchOrgs,
  fetchGroups,
  fetchVisualizationsForLiveboard,
  ThoughtSpotOrg,
  ThoughtSpotGroup,
} from "../services/thoughtspotApi";
import { getPrebuiltHandlerDefinitions } from "../services/customActionHandlers";

interface CustomActionsEditorProps {
  customActions: CustomActionConfig[];
  onChange: (customActions: CustomActionConfig[]) => void;
}

// Helper to generate a unique ID
const generateId = () =>
  `ca-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Empty action template
const createEmptyAction = (): CustomActionConfig => ({
  id: generateId(),
  name: "",
  position: CustomActionPosition.MENU,
  target: CustomActionTarget.LIVEBOARD,
  enabled: true,
  handler: {
    type: "custom",
    customJavaScript: "",
  },
});

export default function CustomActionsEditor({
  customActions,
  onChange,
}: CustomActionsEditorProps) {
  const [editingAction, setEditingAction] = useState<CustomActionConfig | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);

  // Metadata state for dropdowns
  const [liveboards, setLiveboards] = useState<ThoughtSpotContent[]>([]);
  const [answers, setAnswers] = useState<ThoughtSpotContent[]>([]);
  const [models, setModels] = useState<ThoughtSpotContent[]>([]);
  const [orgs, setOrgs] = useState<ThoughtSpotOrg[]>([]);
  const [groups, setGroups] = useState<ThoughtSpotGroup[]>([]);
  const [visualizations, setVisualizations] = useState<
    { id: string; name: string }[]
  >([]);
  const [modelColumns, setModelColumns] = useState<
    { name: string; type: string }[]
  >([]);
  const [selectedLiveboardForViz, setSelectedLiveboardForViz] =
    useState<string>("");
  const [selectedModelForColumns, setSelectedModelForColumns] =
    useState<string>("");
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [prebuiltHandlers, setPrebuiltHandlers] = useState<
    PrebuiltHandlerDefinition[]
  >([]);

  // Load metadata on mount
  useEffect(() => {
    const loadMetadata = async () => {
      setLoadingMetadata(true);
      try {
        const [lbs, ans, mods, orgsData, groupsData] = await Promise.all([
          fetchLiveboards(),
          fetchAnswers(),
          fetchModels(),
          fetchOrgs(),
          fetchGroups(),
        ]);
        setLiveboards(lbs);
        setAnswers(ans);
        setModels(mods);
        setOrgs(orgsData);
        setGroups(groupsData);
      } catch (error) {
        console.error("Failed to load metadata:", error);
      } finally {
        setLoadingMetadata(false);
      }
    };
    loadMetadata();
    setPrebuiltHandlers(getPrebuiltHandlerDefinitions());
  }, []);

  // Load visualizations when liveboard is selected
  const loadVisualizations = useCallback(async (liveboardId: string) => {
    if (!liveboardId) {
      setVisualizations([]);
      return;
    }
    try {
      const vizs = await fetchVisualizationsForLiveboard(liveboardId);
      setVisualizations(vizs);
    } catch (error) {
      console.error("Failed to load visualizations:", error);
      setVisualizations([]);
    }
  }, []);

  // Load model columns when model is selected
  const loadModelColumns = useCallback(async (modelId: string) => {
    if (!modelId) {
      setModelColumns([]);
      return;
    }
    try {
      const details = await fetchModelDetails(modelId);
      setModelColumns(details?.columns || []);
    } catch (error) {
      console.error("Failed to load model columns:", error);
      setModelColumns([]);
    }
  }, []);

  const handleAddAction = () => {
    setEditingAction(createEmptyAction());
    setIsCreating(true);
  };

  const handleEditAction = (action: CustomActionConfig) => {
    setEditingAction({ ...action });
    setIsCreating(false);
    // Pre-load visualizations if target is VIZ and has liveboard selected
    if (
      action.target === CustomActionTarget.VIZ &&
      action.metadataIds?.liveboardIds?.[0]
    ) {
      setSelectedLiveboardForViz(action.metadataIds.liveboardIds[0]);
      loadVisualizations(action.metadataIds.liveboardIds[0]);
    }
    // Pre-load columns if dataModelIds has a model selected
    if (action.dataModelIds?.modelIds?.[0]) {
      setSelectedModelForColumns(action.dataModelIds.modelIds[0]);
      loadModelColumns(action.dataModelIds.modelIds[0]);
    }
  };

  const handleDeleteAction = (actionId: string) => {
    if (confirm("Are you sure you want to delete this custom action?")) {
      onChange(customActions.filter((a) => a.id !== actionId));
    }
  };

  const handleToggleEnabled = (actionId: string) => {
    onChange(
      customActions.map((a) =>
        a.id === actionId ? { ...a, enabled: !a.enabled } : a
      )
    );
  };

  const handleSaveAction = () => {
    if (!editingAction) return;

    // Validate required fields
    if (!editingAction.name.trim()) {
      alert("Name is required");
      return;
    }

    // Validate custom JavaScript if using custom handler
    if (
      editingAction.handler.type === "custom" &&
      editingAction.handler.customJavaScript
    ) {
      const code = editingAction.handler.customJavaScript;

      // Check for common mistakes - users don't need to create actionData themselves
      const forbiddenPatterns = [
        {
          pattern: /ActionData\.createFromJSON/i,
          message:
            "You don't need to create actionData - it's already provided as a variable.",
        },
        {
          pattern: /TabularData\.createFromJSON/i,
          message:
            "You don't need to create TabularData - use the provided actionData variable instead.",
        },
        {
          pattern: /import\s+.*from/i,
          message:
            "Import statements are not supported. Use the provided variables: actionData, payload, embedInstance.",
        },
        {
          pattern: /require\s*\(/i,
          message:
            "require() is not supported. Use the provided variables: actionData, payload, embedInstance.",
        },
      ];

      for (const { pattern, message } of forbiddenPatterns) {
        if (pattern.test(code)) {
          alert(
            `Warning: ${message}\n\nAvailable variables:\n- actionData: Pre-created ActionData instance\n- payload: Raw action payload\n- embedInstance: ThoughtSpot embed instance`
          );
          return;
        }
      }

      // Basic syntax validation
      try {
        new Function("actionData", "payload", "embedInstance", code);
      } catch (error) {
        alert(
          `JavaScript syntax error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        return;
      }
    }

    if (isCreating) {
      onChange([...customActions, editingAction]);
    } else {
      onChange(
        customActions.map((a) =>
          a.id === editingAction.id ? editingAction : a
        )
      );
    }
    setEditingAction(null);
    setIsCreating(false);
    setSelectedLiveboardForViz("");
    setSelectedModelForColumns("");
    setVisualizations([]);
    setModelColumns([]);
  };

  const handleCancelEdit = () => {
    setEditingAction(null);
    setIsCreating(false);
    setSelectedLiveboardForViz("");
    setSelectedModelForColumns("");
    setVisualizations([]);
    setModelColumns([]);
  };

  const updateEditingAction = (updates: Partial<CustomActionConfig>) => {
    if (editingAction) {
      setEditingAction({ ...editingAction, ...updates });
    }
  };

  const updateHandler = (updates: Partial<CustomActionHandlerConfig>) => {
    if (editingAction) {
      setEditingAction({
        ...editingAction,
        handler: { ...editingAction.handler, ...updates },
      });
    }
  };

  // Render the list of actions
  const renderActionsList = () => (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>
          Custom Actions ({customActions.length})
        </h4>
        <button
          onClick={handleAddAction}
          style={{
            padding: "8px 16px",
            backgroundColor: "#3182ce",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          + Add Custom Action
        </button>
      </div>

      {customActions.length === 0 ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            backgroundColor: "#f7fafc",
            borderRadius: "8px",
            border: "1px dashed #e2e8f0",
          }}
        >
          <p style={{ color: "#718096", marginBottom: "16px" }}>
            No custom actions configured yet.
          </p>
          <button
            onClick={handleAddAction}
            style={{
              padding: "8px 16px",
              backgroundColor: "#3182ce",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Create Your First Custom Action
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {customActions.map((action) => (
            <div
              key={action.id}
              style={{
                padding: "16px",
                backgroundColor: action.enabled ? "#ffffff" : "#f7fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                opacity: action.enabled ? 1 : 0.7,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ fontWeight: "600", fontSize: "15px" }}>
                      {action.name}
                    </span>
                    <span
                      style={{
                        padding: "2px 8px",
                        backgroundColor:
                          action.position === CustomActionPosition.PRIMARY
                            ? "#48bb78"
                            : action.position ===
                              CustomActionPosition.CONTEXT_MENU
                            ? "#ed8936"
                            : "#4299e1",
                        color: "white",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "500",
                      }}
                    >
                      {action.position}
                    </span>
                    <span
                      style={{
                        padding: "2px 8px",
                        backgroundColor: "#805ad5",
                        color: "white",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "500",
                      }}
                    >
                      {action.target}
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#718096", margin: 0 }}>
                    ID:{" "}
                    <code
                      style={{
                        backgroundColor: "#edf2f7",
                        padding: "1px 4px",
                        borderRadius: "3px",
                      }}
                    >
                      {action.id}
                    </code>
                    {action.handler.type === "prebuilt" && (
                      <span>
                        {" "}
                        | Handler:{" "}
                        {prebuiltHandlers.find(
                          (h) => h.id === action.handler.prebuiltHandlerId
                        )?.name || action.handler.prebuiltHandlerId}
                      </span>
                    )}
                    {action.handler.type === "custom" && (
                      <span> | Custom Code</span>
                    )}
                  </p>
                </div>
                <div
                  style={{ display: "flex", gap: "8px", alignItems: "center" }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={action.enabled}
                      onChange={() => handleToggleEnabled(action.id)}
                    />
                    <span style={{ fontSize: "13px" }}>Enabled</span>
                  </label>
                  <button
                    onClick={() => handleEditAction(action)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#edf2f7",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteAction(action.id)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#fed7d7",
                      color: "#c53030",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render the edit form
  const renderEditForm = () => {
    if (!editingAction) return null;

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleCancelEdit();
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            width: "90%",
            maxWidth: "800px",
            maxHeight: "90vh",
            overflow: "auto",
            padding: "24px",
          }}
        >
          <h3
            style={{
              margin: "0 0 24px 0",
              fontSize: "20px",
              fontWeight: "600",
            }}
          >
            {isCreating ? "Create Custom Action" : "Edit Custom Action"}
          </h3>

          {/* Basic Info Section */}
          <div style={{ marginBottom: "24px" }}>
            <h4
              style={{
                margin: "0 0 12px 0",
                fontSize: "14px",
                fontWeight: "600",
                color: "#4a5568",
              }}
            >
              Basic Information
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  Name *
                </label>
                <input
                  type="text"
                  value={editingAction.name}
                  onChange={(e) =>
                    updateEditingAction({ name: e.target.value })
                  }
                  placeholder="e.g., Export to CRM"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  ID *
                </label>
                <input
                  type="text"
                  value={editingAction.id}
                  onChange={(e) => updateEditingAction({ id: e.target.value })}
                  placeholder="e.g., export-to-crm"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontFamily: "monospace",
                  }}
                />
              </div>
            </div>
            <div style={{ marginTop: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "13px",
                  fontWeight: "500",
                }}
              >
                Description (optional)
              </label>
              <input
                type="text"
                value={editingAction.description || ""}
                onChange={(e) =>
                  updateEditingAction({ description: e.target.value })
                }
                placeholder="Brief description of what this action does"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>

          {/* Position and Target */}
          <div style={{ marginBottom: "24px" }}>
            <h4
              style={{
                margin: "0 0 12px 0",
                fontSize: "14px",
                fontWeight: "600",
                color: "#4a5568",
              }}
            >
              Position &amp; Target
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  Position *
                </label>
                <select
                  value={editingAction.position}
                  onChange={(e) =>
                    updateEditingAction({
                      position: e.target.value as CustomActionPosition,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: "white",
                  }}
                >
                  <option value={CustomActionPosition.PRIMARY}>
                    Primary (Main button)
                  </option>
                  <option value={CustomActionPosition.MENU}>
                    Menu (Dropdown menu)
                  </option>
                  <option value={CustomActionPosition.CONTEXT_MENU}>
                    Context Menu (Right-click)
                  </option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  Target *
                </label>
                <select
                  value={editingAction.target}
                  onChange={(e) => {
                    const newTarget = e.target.value as CustomActionTarget;
                    updateEditingAction({
                      target: newTarget,
                      metadataIds: undefined, // Reset metadata when target changes
                    });
                    setSelectedLiveboardForViz("");
                    setVisualizations([]);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: "white",
                  }}
                >
                  <option value={CustomActionTarget.LIVEBOARD}>
                    Liveboard
                  </option>
                  <option value={CustomActionTarget.VIZ}>Visualization</option>
                  <option value={CustomActionTarget.ANSWER}>Answer</option>
                  <option value={CustomActionTarget.SPOTTER}>Spotter</option>
                </select>
              </div>
            </div>
          </div>

          {/* Scoping Section */}
          <div style={{ marginBottom: "24px" }}>
            <h4
              style={{
                margin: "0 0 12px 0",
                fontSize: "14px",
                fontWeight: "600",
                color: "#4a5568",
              }}
            >
              Scoping (Optional)
            </h4>
            <p
              style={{
                fontSize: "12px",
                color: "#718096",
                marginBottom: "12px",
              }}
            >
              Limit where this action appears. Leave empty to show on all
              applicable content.
            </p>

            {/* Metadata IDs based on target */}
            {editingAction.target === CustomActionTarget.LIVEBOARD && (
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  Limit to Liveboards
                </label>
                <select
                  multiple
                  value={editingAction.metadataIds?.liveboardIds || []}
                  onChange={(e) => {
                    const selected = Array.from(
                      e.target.selectedOptions,
                      (opt) => opt.value
                    );
                    updateEditingAction({
                      metadataIds:
                        selected.length > 0
                          ? { liveboardIds: selected }
                          : undefined,
                    });
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    minHeight: "100px",
                  }}
                >
                  {liveboards.map((lb) => (
                    <option key={lb.id} value={lb.id}>
                      {lb.name}
                    </option>
                  ))}
                </select>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#718096",
                    marginTop: "4px",
                  }}
                >
                  Hold Ctrl/Cmd to select multiple. Leave empty for all
                  liveboards.
                </p>
              </div>
            )}

            {editingAction.target === CustomActionTarget.VIZ && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ marginBottom: "12px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      fontSize: "13px",
                      fontWeight: "500",
                    }}
                  >
                    Select Liveboard (for visualization scoping)
                  </label>
                  <select
                    value={selectedLiveboardForViz}
                    onChange={(e) => {
                      setSelectedLiveboardForViz(e.target.value);
                      loadVisualizations(e.target.value);
                      if (e.target.value) {
                        updateEditingAction({
                          metadataIds: {
                            liveboardIds: [e.target.value],
                            vizIds: [],
                          },
                        });
                      } else {
                        updateEditingAction({ metadataIds: undefined });
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "14px",
                      backgroundColor: "white",
                    }}
                  >
                    <option value="">-- Select a Liveboard --</option>
                    {liveboards.map((lb) => (
                      <option key={lb.id} value={lb.id}>
                        {lb.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedLiveboardForViz && (
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "4px",
                        fontSize: "13px",
                        fontWeight: "500",
                      }}
                    >
                      Limit to Visualizations
                    </label>
                    <select
                      multiple
                      value={editingAction.metadataIds?.vizIds || []}
                      onChange={(e) => {
                        const selected = Array.from(
                          e.target.selectedOptions,
                          (opt) => opt.value
                        );
                        updateEditingAction({
                          metadataIds: {
                            liveboardIds: [selectedLiveboardForViz],
                            vizIds: selected.length > 0 ? selected : undefined,
                          },
                        });
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                        fontSize: "14px",
                        minHeight: "100px",
                      }}
                    >
                      {visualizations.map((viz) => (
                        <option key={viz.id} value={viz.id}>
                          {viz.name}
                        </option>
                      ))}
                    </select>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#718096",
                        marginTop: "4px",
                      }}
                    >
                      Hold Ctrl/Cmd to select multiple. Leave empty for all
                      visualizations.
                    </p>
                  </div>
                )}
              </div>
            )}

            {editingAction.target === CustomActionTarget.ANSWER && (
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  Limit to Answers
                </label>
                <select
                  multiple
                  value={editingAction.metadataIds?.answerIds || []}
                  onChange={(e) => {
                    const selected = Array.from(
                      e.target.selectedOptions,
                      (opt) => opt.value
                    );
                    updateEditingAction({
                      metadataIds:
                        selected.length > 0
                          ? { answerIds: selected }
                          : undefined,
                    });
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    minHeight: "100px",
                  }}
                >
                  {answers.map((ans) => (
                    <option key={ans.id} value={ans.id}>
                      {ans.name}
                    </option>
                  ))}
                </select>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#718096",
                    marginTop: "4px",
                  }}
                >
                  Hold Ctrl/Cmd to select multiple. Leave empty for all answers.
                </p>
              </div>
            )}

            {/* Data Model Scoping */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "13px",
                  fontWeight: "500",
                }}
              >
                Limit to Data Models
              </label>
              <select
                value={selectedModelForColumns}
                onChange={(e) => {
                  setSelectedModelForColumns(e.target.value);
                  if (e.target.value) {
                    loadModelColumns(e.target.value);
                    updateEditingAction({
                      dataModelIds: { modelIds: [e.target.value] },
                    });
                  } else {
                    setModelColumns([]);
                    updateEditingAction({ dataModelIds: undefined });
                  }
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "14px",
                  backgroundColor: "white",
                }}
              >
                <option value="">-- No data model restriction --</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {selectedModelForColumns && modelColumns.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      fontSize: "13px",
                      fontWeight: "500",
                    }}
                  >
                    Limit to Columns (optional)
                  </label>
                  <select
                    multiple
                    value={editingAction.dataModelIds?.columnNames || []}
                    onChange={(e) => {
                      const selected = Array.from(
                        e.target.selectedOptions,
                        (opt) => opt.value
                      );
                      updateEditingAction({
                        dataModelIds: {
                          modelIds: [selectedModelForColumns],
                          columnNames:
                            selected.length > 0 ? selected : undefined,
                        },
                      });
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "14px",
                      minHeight: "80px",
                    }}
                  >
                    {modelColumns.map((col) => (
                      <option
                        key={col.name}
                        value={`${selectedModelForColumns}::${col.name}`}
                      >
                        {col.name} ({col.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Org and Group Scoping */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  Limit to Organizations
                </label>
                <select
                  multiple
                  value={editingAction.orgIds || []}
                  onChange={(e) => {
                    const selected = Array.from(
                      e.target.selectedOptions,
                      (opt) => opt.value
                    );
                    updateEditingAction({
                      orgIds: selected.length > 0 ? selected : undefined,
                    });
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    minHeight: "80px",
                  }}
                >
                  {orgs.map((org) => (
                    <option key={org.id} value={String(org.id)}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  Limit to Groups
                </label>
                <select
                  multiple
                  value={editingAction.groupIds || []}
                  onChange={(e) => {
                    const selected = Array.from(
                      e.target.selectedOptions,
                      (opt) => opt.value
                    );
                    updateEditingAction({
                      groupIds: selected.length > 0 ? selected : undefined,
                    });
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    minHeight: "80px",
                  }}
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.display_name || group.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Handler Section */}
          <div style={{ marginBottom: "24px" }}>
            <h4
              style={{
                margin: "0 0 12px 0",
                fontSize: "14px",
                fontWeight: "600",
                color: "#4a5568",
              }}
            >
              Action Handler
            </h4>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "13px",
                  fontWeight: "500",
                }}
              >
                Handler Type
              </label>
              <div style={{ display: "flex", gap: "16px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="handlerType"
                    checked={editingAction.handler.type === "prebuilt"}
                    onChange={() =>
                      updateHandler({
                        type: "prebuilt",
                        customJavaScript: undefined,
                      })
                    }
                  />
                  <span>Pre-built Handler</span>
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="handlerType"
                    checked={editingAction.handler.type === "custom"}
                    onChange={() =>
                      updateHandler({
                        type: "custom",
                        prebuiltHandlerId: undefined,
                        prebuiltHandlerParams: undefined,
                      })
                    }
                  />
                  <span>Custom Code</span>
                </label>
              </div>
            </div>

            {editingAction.handler.type === "prebuilt" && (
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  Select Pre-built Handler
                </label>
                <select
                  value={editingAction.handler.prebuiltHandlerId || ""}
                  onChange={(e) => {
                    const handlerId = e.target.value;
                    const handler = prebuiltHandlers.find(
                      (h) => h.id === handlerId
                    );
                    updateHandler({
                      prebuiltHandlerId: handlerId || undefined,
                      prebuiltHandlerParams: handler?.parameters?.reduce(
                        (acc, param) => {
                          if (param.defaultValue !== undefined) {
                            acc[param.name] = param.defaultValue;
                          }
                          return acc;
                        },
                        {} as Record<
                          string,
                          string | number | boolean | string[]
                        >
                      ),
                    });
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: "white",
                  }}
                >
                  <option value="">-- Select a handler --</option>
                  {prebuiltHandlers.map((handler) => (
                    <option key={handler.id} value={handler.id}>
                      {handler.name} - {handler.description}
                    </option>
                  ))}
                </select>

                {/* Handler Parameters */}
                {editingAction.handler.prebuiltHandlerId &&
                  (() => {
                    const handler = prebuiltHandlers.find(
                      (h) => h.id === editingAction.handler.prebuiltHandlerId
                    );
                    if (!handler?.parameters?.length) return null;

                    return (
                      <div
                        style={{
                          marginTop: "16px",
                          padding: "16px",
                          backgroundColor: "#f7fafc",
                          borderRadius: "6px",
                        }}
                      >
                        <h5
                          style={{
                            margin: "0 0 12px 0",
                            fontSize: "13px",
                            fontWeight: "600",
                          }}
                        >
                          Handler Parameters
                        </h5>
                        {handler.parameters.map((param) => (
                          <div
                            key={param.name}
                            style={{ marginBottom: "12px" }}
                          >
                            <label
                              style={{
                                display: "block",
                                marginBottom: "4px",
                                fontSize: "12px",
                                fontWeight: "500",
                              }}
                            >
                              {param.label} {param.required && "*"}
                            </label>
                            {param.type === "string" && (
                              <input
                                type="text"
                                value={
                                  (editingAction.handler
                                    .prebuiltHandlerParams?.[
                                    param.name
                                  ] as string) || ""
                                }
                                onChange={(e) =>
                                  updateHandler({
                                    prebuiltHandlerParams: {
                                      ...editingAction.handler
                                        .prebuiltHandlerParams,
                                      [param.name]: e.target.value,
                                    },
                                  })
                                }
                                placeholder={param.description}
                                style={{
                                  width: "100%",
                                  padding: "6px 10px",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "4px",
                                  fontSize: "13px",
                                }}
                              />
                            )}
                            {param.type === "boolean" && (
                              <label
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    (editingAction.handler
                                      .prebuiltHandlerParams?.[
                                      param.name
                                    ] as boolean) ?? param.defaultValue
                                  }
                                  onChange={(e) =>
                                    updateHandler({
                                      prebuiltHandlerParams: {
                                        ...editingAction.handler
                                          .prebuiltHandlerParams,
                                        [param.name]: e.target.checked,
                                      },
                                    })
                                  }
                                />
                                <span
                                  style={{ fontSize: "12px", color: "#718096" }}
                                >
                                  {param.description}
                                </span>
                              </label>
                            )}
                            {param.type === "select" && param.options && (
                              <select
                                value={
                                  (editingAction.handler
                                    .prebuiltHandlerParams?.[
                                    param.name
                                  ] as string) || ""
                                }
                                onChange={(e) =>
                                  updateHandler({
                                    prebuiltHandlerParams: {
                                      ...editingAction.handler
                                        .prebuiltHandlerParams,
                                      [param.name]: e.target.value,
                                    },
                                  })
                                }
                                style={{
                                  width: "100%",
                                  padding: "6px 10px",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "4px",
                                  fontSize: "13px",
                                  backgroundColor: "white",
                                }}
                              >
                                {param.options.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            )}
                            {param.description && param.type !== "boolean" && (
                              <p
                                style={{
                                  fontSize: "11px",
                                  color: "#718096",
                                  marginTop: "2px",
                                }}
                              >
                                {param.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
              </div>
            )}

            {editingAction.handler.type === "custom" && (
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  Custom JavaScript Code
                </label>
                <textarea
                  value={editingAction.handler.customJavaScript || ""}
                  onChange={(e) =>
                    updateHandler({ customJavaScript: e.target.value })
                  }
                  placeholder={`// Handle the custom action
// Available variables:
// - actionData: Pre-created ActionData instance from tse-data-classes
// - payload: Raw action payload (for advanced use)
// - embedInstance: Reference to the ThoughtSpot embed instance

// Example: Get column names
const columnNames = actionData.columnNames;
console.log('Columns:', columnNames);

// Example: Get data as a table
const table = actionData.getDataAsTable();
console.log('Rows:', table.length);

// Example: Get specific columns
const subset = actionData.getDataAsTable(['column1', 'column2']);

// Example: Open URL with data
const baseUrl = 'https://example.com/action';
const params = table.map(row => 'id=' + encodeURIComponent(row[0])).join('&');
window.open(baseUrl + '?' + params, '_blank');`}
                  style={{
                    width: "100%",
                    minHeight: "200px",
                    padding: "12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "monospace",
                    resize: "vertical",
                  }}
                />
                <p
                  style={{
                    fontSize: "11px",
                    color: "#718096",
                    marginTop: "4px",
                  }}
                >
                  Write JavaScript code to handle the action. The{" "}
                  <code>actionData</code> variable provides easy access to
                  columns and data via methods like <code>columnNames</code> and{" "}
                  <code>getDataAsTable()</code>.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              borderTop: "1px solid #e2e8f0",
              paddingTop: "16px",
            }}
          >
            <button
              onClick={handleCancelEdit}
              style={{
                padding: "10px 20px",
                backgroundColor: "#e2e8f0",
                color: "#4a5568",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAction}
              disabled={!editingAction.name.trim()}
              style={{
                padding: "10px 20px",
                backgroundColor: editingAction.name.trim()
                  ? "#3182ce"
                  : "#a0aec0",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: editingAction.name.trim() ? "pointer" : "not-allowed",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              {isCreating ? "Create Action" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h4
          style={{ fontSize: "16px", fontWeight: "600", marginBottom: "10px" }}
        >
          Code-based Custom Actions
        </h4>
        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "20px" }}>
          Define custom menu actions that appear in ThoughtSpot embeds. Each
          action can trigger a pre-built handler or execute custom JavaScript
          code when clicked.
        </p>
        {loadingMetadata && (
          <p style={{ fontSize: "13px", color: "#3182ce" }}>
            Loading metadata...
          </p>
        )}
      </div>

      {renderActionsList()}
      {renderEditForm()}
    </div>
  );
}
