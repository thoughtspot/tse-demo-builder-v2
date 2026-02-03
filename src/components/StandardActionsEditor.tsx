"use client";

import { useState, useEffect, useCallback } from "react";
import {
  StandardActionConfig,
  StandardActionDefinition,
  CustomActionPosition,
  CustomActionTarget,
  ThoughtSpotContent,
} from "../types/thoughtspot";
import {
  fetchLiveboards,
  fetchAnswers,
  fetchVisualizationsForLiveboard,
} from "../services/thoughtspotApi";

interface StandardActionsEditorProps {
  standardActions: StandardActionConfig[];
  onChange: (standardActions: StandardActionConfig[]) => void;
}

// Registry of available standard actions
const STANDARD_ACTION_DEFINITIONS: StandardActionDefinition[] = [
  {
    id: "download-pdf",
    name: "Download PDF with Watermark",
    description:
      "Downloads the liveboard as a PDF file with a customizable watermark applied to each page. The watermark text is displayed diagonally across the page for visibility while remaining transparent enough to not obstruct content.",
    defaultPosition: CustomActionPosition.MENU,
    defaultTarget: CustomActionTarget.LIVEBOARD,
    handlerId: "download-pdf-watermark",
    defaultParams: {
      watermarkText: "CONFIDENTIAL",
      watermarkOpacity: "0.15",
      watermarkColor: "gray",
    },
    supportsMetadataFiltering: true,
  },
];

export function getStandardActionDefinitions(): StandardActionDefinition[] {
  return STANDARD_ACTION_DEFINITIONS;
}

export function registerStandardAction(
  definition: StandardActionDefinition
): void {
  const existingIndex = STANDARD_ACTION_DEFINITIONS.findIndex(
    (d) => d.id === definition.id
  );
  if (existingIndex >= 0) {
    STANDARD_ACTION_DEFINITIONS[existingIndex] = definition;
  } else {
    STANDARD_ACTION_DEFINITIONS.push(definition);
  }
}

export default function StandardActionsEditor({
  standardActions,
  onChange,
}: StandardActionsEditorProps) {
  const [configuringActionId, setConfiguringActionId] = useState<string | null>(
    null
  );
  const [liveboards, setLiveboards] = useState<ThoughtSpotContent[]>([]);
  const [answers, setAnswers] = useState<ThoughtSpotContent[]>([]);
  const [visualizations, setVisualizations] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedLiveboardForViz, setSelectedLiveboardForViz] =
    useState<string>("");
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Load metadata on mount
  useEffect(() => {
    const loadMetadata = async () => {
      setLoadingMetadata(true);
      try {
        const [lbs, ans] = await Promise.all([
          fetchLiveboards(),
          fetchAnswers(),
        ]);
        setLiveboards(lbs);
        setAnswers(ans);
      } catch (error) {
        console.error("Failed to load metadata:", error);
      } finally {
        setLoadingMetadata(false);
      }
    };
    loadMetadata();
  }, []);

  // Load visualizations when liveboard is selected
  const loadVisualizationsForLiveboard = useCallback(
    async (liveboardId: string) => {
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
    },
    []
  );

  useEffect(() => {
    if (selectedLiveboardForViz) {
      loadVisualizationsForLiveboard(selectedLiveboardForViz);
    }
  }, [selectedLiveboardForViz, loadVisualizationsForLiveboard]);

  // Get configuration for a standard action, creating default if not exists
  const getActionConfig = (
    definition: StandardActionDefinition
  ): StandardActionConfig => {
    const existing = standardActions.find(
      (a) => a.standardActionId === definition.id
    );
    if (existing) return existing;

    // Return default config with default params
    return {
      standardActionId: definition.id,
      enabled: false,
      position: definition.defaultPosition,
      target: definition.defaultTarget,
      params: definition.defaultParams
        ? { ...definition.defaultParams }
        : undefined,
    };
  };

  // Update a specific action's configuration
  const updateActionConfig = (
    actionId: string,
    updates: Partial<StandardActionConfig>
  ) => {
    const definition = STANDARD_ACTION_DEFINITIONS.find(
      (d) => d.id === actionId
    );
    if (!definition) return;

    const existingIndex = standardActions.findIndex(
      (a) => a.standardActionId === actionId
    );
    const currentConfig = getActionConfig(definition);
    const updatedConfig = { ...currentConfig, ...updates };

    if (existingIndex >= 0) {
      const newActions = [...standardActions];
      newActions[existingIndex] = updatedConfig;
      onChange(newActions);
    } else {
      onChange([...standardActions, updatedConfig]);
    }
  };

  // Toggle action enabled state
  const toggleAction = (actionId: string) => {
    const config = getActionConfig(
      STANDARD_ACTION_DEFINITIONS.find((d) => d.id === actionId)!
    );
    updateActionConfig(actionId, { enabled: !config.enabled });
  };

  // Position options
  const positionOptions = [
    { value: CustomActionPosition.PRIMARY, label: "Primary (Button)" },
    { value: CustomActionPosition.MENU, label: "More Menu" },
    { value: CustomActionPosition.CONTEXT_MENU, label: "Context Menu" },
  ];

  // Target options
  const targetOptions = [
    { value: CustomActionTarget.LIVEBOARD, label: "Liveboard" },
    { value: CustomActionTarget.VIZ, label: "Visualization" },
    { value: CustomActionTarget.ANSWER, label: "Answer" },
    { value: CustomActionTarget.SPOTTER, label: "Spotter" },
  ];

  if (STANDARD_ACTION_DEFINITIONS.length === 0) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "#6b7280",
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
          border: "1px dashed #d1d5db",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>📦</div>
        <h4 style={{ margin: "0 0 8px 0", color: "#374151", fontSize: "16px" }}>
          No Standard Actions Available
        </h4>
        <p style={{ margin: 0, fontSize: "14px" }}>
          Standard actions are pre-built actions with handlers. They will appear
          here when configured.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "#eff6ff",
          borderRadius: "8px",
          border: "1px solid #bfdbfe",
        }}
      >
        <p style={{ margin: 0, fontSize: "14px", color: "#1e40af" }}>
          Standard Actions are pre-built actions with handlers. Enable them and
          configure where they appear.
        </p>
      </div>

      {STANDARD_ACTION_DEFINITIONS.map((definition) => {
        const config = getActionConfig(definition);
        const isConfiguring = configuringActionId === definition.id;

        return (
          <div
            key={definition.id}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              border: config.enabled
                ? "1px solid #3b82f6"
                : "1px solid #e5e7eb",
              overflow: "hidden",
              transition: "border-color 0.2s ease",
            }}
          >
            {/* Action header row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "16px",
                backgroundColor: config.enabled ? "#eff6ff" : "#f9fafb",
                gap: "16px",
              }}
            >
              {/* Checkbox */}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={() => toggleAction(definition.id)}
                  style={{
                    width: "18px",
                    height: "18px",
                    cursor: "pointer",
                    accentColor: "#3b82f6",
                  }}
                />
              </label>

              {/* Name and description */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: "600",
                    fontSize: "14px",
                    color: config.enabled ? "#1e40af" : "#374151",
                  }}
                >
                  {definition.name}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginTop: "2px",
                  }}
                >
                  ID:{" "}
                  <code
                    style={{
                      backgroundColor: "#f3f4f6",
                      padding: "1px 4px",
                      borderRadius: "3px",
                    }}
                  >
                    {definition.id}
                  </code>
                </div>
              </div>

              {/* Configure button */}
              <button
                onClick={() =>
                  setConfiguringActionId(isConfiguring ? null : definition.id)
                }
                style={{
                  padding: "8px 16px",
                  backgroundColor: isConfiguring ? "#3b82f6" : "#ffffff",
                  color: isConfiguring ? "#ffffff" : "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "500",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                }}
              >
                <span>⚙️</span>
                Configure
              </button>
            </div>

            {/* Description row */}
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid #e5e7eb",
                backgroundColor: "#ffffff",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  color: "#6b7280",
                  lineHeight: "1.5",
                }}
              >
                {definition.description}
              </p>
            </div>

            {/* Configuration panel */}
            {isConfiguring && (
              <div
                style={{
                  padding: "20px",
                  borderTop: "1px solid #e5e7eb",
                  backgroundColor: "#f9fafb",
                }}
              >
                <h5
                  style={{
                    margin: "0 0 16px 0",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Configuration
                </h5>

                {/* Action-specific parameters for Download PDF */}
                {definition.id === "download-pdf" && (
                  <div
                    style={{
                      marginBottom: "20px",
                      padding: "16px",
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <h6
                      style={{
                        margin: "0 0 12px 0",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      Watermark Settings
                    </h6>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: "12px",
                      }}
                    >
                      {/* Watermark Text */}
                      <div style={{ gridColumn: "span 3" }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: "500",
                            color: "#6b7280",
                            marginBottom: "6px",
                          }}
                        >
                          Watermark Text
                        </label>
                        <input
                          type="text"
                          value={
                            (config.params?.watermarkText as string) ||
                            "CONFIDENTIAL"
                          }
                          onChange={(e) =>
                            updateActionConfig(definition.id, {
                              params: {
                                ...config.params,
                                watermarkText: e.target.value,
                              },
                            })
                          }
                          placeholder="Enter watermark text..."
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: "6px",
                            border: "1px solid #d1d5db",
                            backgroundColor: "#ffffff",
                            fontSize: "14px",
                            color: "#374151",
                            boxSizing: "border-box",
                          }}
                        />
                        <p
                          style={{
                            margin: "4px 0 0 0",
                            fontSize: "11px",
                            color: "#9ca3af",
                          }}
                        >
                          This text will appear diagonally across each page
                        </p>
                      </div>

                      {/* Watermark Opacity */}
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: "500",
                            color: "#6b7280",
                            marginBottom: "6px",
                          }}
                        >
                          Opacity
                        </label>
                        <select
                          value={
                            (config.params?.watermarkOpacity as string) ||
                            "0.15"
                          }
                          onChange={(e) =>
                            updateActionConfig(definition.id, {
                              params: {
                                ...config.params,
                                watermarkOpacity: e.target.value,
                              },
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: "6px",
                            border: "1px solid #d1d5db",
                            backgroundColor: "#ffffff",
                            fontSize: "14px",
                            color: "#374151",
                          }}
                        >
                          <option value="0.1">Very Light (10%)</option>
                          <option value="0.15">Light (15%)</option>
                          <option value="0.2">Medium (20%)</option>
                          <option value="0.3">Bold (30%)</option>
                        </select>
                      </div>

                      {/* Watermark Color */}
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: "500",
                            color: "#6b7280",
                            marginBottom: "6px",
                          }}
                        >
                          Color
                        </label>
                        <select
                          value={
                            (config.params?.watermarkColor as string) || "gray"
                          }
                          onChange={(e) =>
                            updateActionConfig(definition.id, {
                              params: {
                                ...config.params,
                                watermarkColor: e.target.value,
                              },
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: "6px",
                            border: "1px solid #d1d5db",
                            backgroundColor: "#ffffff",
                            fontSize: "14px",
                            color: "#374151",
                          }}
                        >
                          <option value="gray">Gray</option>
                          <option value="red">Red</option>
                          <option value="blue">Blue</option>
                          <option value="black">Black</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginBottom: "20px",
                  }}
                >
                  {/* Target - For Download PDF, this is fixed to LIVEBOARD */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      Target
                    </label>
                    {definition.id === "download-pdf" ? (
                      <>
                        <div
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: "6px",
                            border: "1px solid #e5e7eb",
                            backgroundColor: "#f3f4f6",
                            fontSize: "14px",
                            color: "#6b7280",
                          }}
                        >
                          Liveboard (fixed)
                        </div>
                        <p
                          style={{
                            margin: "4px 0 0 0",
                            fontSize: "11px",
                            color: "#9ca3af",
                          }}
                        >
                          This action only works on Liveboards
                        </p>
                      </>
                    ) : (
                      <>
                        <select
                          value={config.target}
                          onChange={(e) =>
                            updateActionConfig(definition.id, {
                              target: e.target.value as CustomActionTarget,
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: "6px",
                            border: "1px solid #d1d5db",
                            backgroundColor: "#ffffff",
                            fontSize: "14px",
                            color: "#374151",
                          }}
                        >
                          {targetOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <p
                          style={{
                            margin: "4px 0 0 0",
                            fontSize: "11px",
                            color: "#9ca3af",
                          }}
                        >
                          Where the action applies to
                        </p>
                      </>
                    )}
                  </div>

                  {/* Position - For Download PDF, only PRIMARY and MENU are allowed */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      Location
                    </label>
                    <select
                      value={config.position}
                      onChange={(e) =>
                        updateActionConfig(definition.id, {
                          position: e.target.value as CustomActionPosition,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db",
                        backgroundColor: "#ffffff",
                        fontSize: "14px",
                        color: "#374151",
                      }}
                    >
                      {definition.id === "download-pdf" ? (
                        <>
                          <option value={CustomActionPosition.PRIMARY}>
                            Primary (Button)
                          </option>
                          <option value={CustomActionPosition.MENU}>
                            More Menu
                          </option>
                        </>
                      ) : (
                        positionOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))
                      )}
                    </select>
                    <p
                      style={{
                        margin: "4px 0 0 0",
                        fontSize: "11px",
                        color: "#9ca3af",
                      }}
                    >
                      Where to display the action
                    </p>
                  </div>
                </div>

                {/* Metadata filtering section */}
                {definition.supportsMetadataFiltering && (
                  <div
                    style={{
                      borderTop: "1px solid #e5e7eb",
                      paddingTop: "16px",
                    }}
                  >
                    <h6
                      style={{
                        margin: "0 0 12px 0",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      {definition.id === "download-pdf"
                        ? "Limit to Specific Liveboards (Optional)"
                        : "Limit to Specific Content (Optional)"}
                    </h6>

                    {/* Liveboards */}
                    <div
                      style={{
                        marginBottom:
                          definition.id === "download-pdf" ? "0" : "16px",
                      }}
                    >
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: "500",
                          color: "#6b7280",
                          marginBottom: "6px",
                        }}
                      >
                        Liveboards
                      </label>
                      <select
                        multiple
                        value={config.metadataIds?.liveboardIds || []}
                        onChange={(e) => {
                          const selected = Array.from(
                            e.target.selectedOptions,
                            (opt) => opt.value
                          );
                          updateActionConfig(definition.id, {
                            metadataIds: {
                              ...config.metadataIds,
                              liveboardIds:
                                selected.length > 0 ? selected : undefined,
                            },
                          });
                        }}
                        style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: "6px",
                          border: "1px solid #d1d5db",
                          backgroundColor: "#ffffff",
                          fontSize: "13px",
                          minHeight: "80px",
                        }}
                      >
                        {loadingMetadata ? (
                          <option disabled>Loading...</option>
                        ) : (
                          liveboards.map((lb) => (
                            <option key={lb.id} value={lb.id}>
                              {lb.name}
                            </option>
                          ))
                        )}
                      </select>
                      <p
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: "11px",
                          color: "#9ca3af",
                        }}
                      >
                        {definition.id === "download-pdf"
                          ? "Select liveboards where this action should appear. Leave empty to show on all liveboards."
                          : "Ctrl/Cmd+Click to select multiple. Leave empty to show on all."}
                      </p>
                    </div>

                    {/* Answers - only show for non-Download PDF actions */}
                    {definition.id !== "download-pdf" && (
                      <div style={{ marginBottom: "16px" }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: "500",
                            color: "#6b7280",
                            marginBottom: "6px",
                          }}
                        >
                          Answers
                        </label>
                        <select
                          multiple
                          value={config.metadataIds?.answerIds || []}
                          onChange={(e) => {
                            const selected = Array.from(
                              e.target.selectedOptions,
                              (opt) => opt.value
                            );
                            updateActionConfig(definition.id, {
                              metadataIds: {
                                ...config.metadataIds,
                                answerIds:
                                  selected.length > 0 ? selected : undefined,
                              },
                            });
                          }}
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "6px",
                            border: "1px solid #d1d5db",
                            backgroundColor: "#ffffff",
                            fontSize: "13px",
                            minHeight: "80px",
                          }}
                        >
                          {loadingMetadata ? (
                            <option disabled>Loading...</option>
                          ) : (
                            answers.map((ans) => (
                              <option key={ans.id} value={ans.id}>
                                {ans.name}
                              </option>
                            ))
                          )}
                        </select>
                        <p
                          style={{
                            margin: "4px 0 0 0",
                            fontSize: "11px",
                            color: "#9ca3af",
                          }}
                        >
                          Ctrl/Cmd+Click to select multiple. Leave empty to show
                          on all.
                        </p>
                      </div>
                    )}

                    {/* Visualizations (with liveboard selector) - only show for non-Download PDF actions */}
                    {definition.id !== "download-pdf" && (
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: "500",
                            color: "#6b7280",
                            marginBottom: "6px",
                          }}
                        >
                          Visualizations
                        </label>
                        <div style={{ marginBottom: "8px" }}>
                          <select
                            value={selectedLiveboardForViz}
                            onChange={(e) =>
                              setSelectedLiveboardForViz(e.target.value)
                            }
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              border: "1px solid #d1d5db",
                              backgroundColor: "#ffffff",
                              fontSize: "13px",
                            }}
                          >
                            <option value="">
                              Select a liveboard to see visualizations...
                            </option>
                            {liveboards.map((lb) => (
                              <option key={lb.id} value={lb.id}>
                                {lb.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        {selectedLiveboardForViz && (
                          <select
                            multiple
                            value={config.metadataIds?.vizIds || []}
                            onChange={(e) => {
                              const selected = Array.from(
                                e.target.selectedOptions,
                                (opt) => opt.value
                              );
                              updateActionConfig(definition.id, {
                                metadataIds: {
                                  ...config.metadataIds,
                                  vizIds:
                                    selected.length > 0 ? selected : undefined,
                                },
                              });
                            }}
                            style={{
                              width: "100%",
                              padding: "8px",
                              borderRadius: "6px",
                              border: "1px solid #d1d5db",
                              backgroundColor: "#ffffff",
                              fontSize: "13px",
                              minHeight: "80px",
                            }}
                          >
                            {visualizations.length === 0 ? (
                              <option disabled>No visualizations found</option>
                            ) : (
                              visualizations.map((viz) => (
                                <option key={viz.id} value={viz.id}>
                                  {viz.name}
                                </option>
                              ))
                            )}
                          </select>
                        )}
                        <p
                          style={{
                            margin: "4px 0 0 0",
                            fontSize: "11px",
                            color: "#9ca3af",
                          }}
                        >
                          Ctrl/Cmd+Click to select multiple. Leave empty to show
                          on all.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
