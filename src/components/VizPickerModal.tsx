"use client";

import React, { useState, useEffect } from "react";
import {
  exportVisualizationTML,
  importVisualizationToLiveboard,
} from "../services/thoughtspotApi";
import ThoughtSpotEmbed from "./ThoughtSpotEmbed";

interface Visualization {
  id: string;
  name: string;
  vizType: string;
  size: string;
}

interface Liveboard {
  id: string;
  name: string;
}

interface VizPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  liveboards: Liveboard[];
  onFetchVisualizations: (liveboardId: string) => Promise<Visualization[]>;
}

export default function VizPickerModal({
  isOpen,
  onClose,
  liveboards,
  onFetchVisualizations,
}: VizPickerModalProps) {
  const [fromLiveboard, setFromLiveboard] = useState<string>("");
  const [toLiveboard, setToLiveboard] = useState<string>("");
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [selectedVizs, setSelectedVizs] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [showPreviews, setShowPreviews] = useState<boolean>(false);
  const [fromLiveboardFilter, setFromLiveboardFilter] = useState<string>("");
  const [toLiveboardFilter, setToLiveboardFilter] = useState<string>("");

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setFromLiveboard("");
      setToLiveboard("");
      setVisualizations([]);
      setSelectedVizs([]);
      setError(null);
      setSuccessMessage(null);
      setIsImporting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchVizs = async () => {
      if (fromLiveboard) {
        setLoading(true);
        setError(null);
        try {
          const vizs = await onFetchVisualizations(fromLiveboard);
          setVisualizations(vizs);
        } catch (err) {
          console.error("Error fetching visualizations:", err);
          setError("Failed to fetch visualizations. Please try again.");
          setVisualizations([]);
        } finally {
          setLoading(false);
        }
      } else {
        setVisualizations([]);
        setSelectedVizs([]);
      }
    };

    fetchVizs();
  }, [fromLiveboard, onFetchVisualizations]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
        zIndex: 9999,
      }}
      onClick={handleOverlayClick}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "1200px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              margin: 0,
              color: "#1a202c",
            }}
          >
            📊 Visualization Picker
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              padding: "4px 8px",
              color: "#6b7280",
            }}
          >
            ×
          </button>
        </div>

        {/* Dropdowns Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {/* From Liveboard */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "8px",
                color: "#374151",
              }}
            >
              From Liveboard
            </label>
            {/* Filter Input */}
            <input
              type="text"
              placeholder="Filter liveboards..."
              value={fromLiveboardFilter}
              onChange={(e) => setFromLiveboardFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "13px",
                marginBottom: "8px",
              }}
            />
            <select
              value={fromLiveboard}
              onChange={(e) => {
                setFromLiveboard(e.target.value);
                setSelectedVizs([]);
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "white",
                cursor: "pointer",
              }}
            >
              <option value="">Select a liveboard...</option>
              {liveboards
                .filter((lb) =>
                  lb.name
                    .toLowerCase()
                    .includes(fromLiveboardFilter.toLowerCase())
                )
                .map((lb) => (
                  <option key={lb.id} value={lb.id}>
                    {lb.name}
                  </option>
                ))}
            </select>
          </div>

          {/* To Liveboard */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "8px",
                color: "#374151",
              }}
            >
              To Liveboard
            </label>
            {/* Filter Input */}
            <input
              type="text"
              placeholder="Filter liveboards..."
              value={toLiveboardFilter}
              onChange={(e) => setToLiveboardFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "13px",
                marginBottom: "8px",
              }}
            />
            <select
              value={toLiveboard}
              onChange={(e) => setToLiveboard(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "white",
                cursor: "pointer",
              }}
            >
              <option value="">Select a liveboard...</option>
              {liveboards
                .filter(
                  (lb) =>
                    lb.id !== fromLiveboard &&
                    lb.name
                      .toLowerCase()
                      .includes(toLiveboardFilter.toLowerCase())
                )
                .map((lb) => (
                  <option key={lb.id} value={lb.id}>
                    {lb.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              color: "#dc2626",
              fontSize: "14px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div
            style={{
              padding: "16px 20px",
              backgroundColor: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: "8px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontSize: "20px" }}>✓</span>
              <span
                style={{
                  color: "#16a34a",
                  fontSize: "16px",
                  fontWeight: "600",
                }}
              >
                {successMessage}
              </span>
            </div>
            <div
              style={{
                color: "#15803d",
                fontSize: "14px",
                marginLeft: "28px",
              }}
            >
              The visualization has been added to the target liveboard. Navigate
              to &quot;My Reports&quot; or &quot;All Content&quot; to view the
              updated liveboard.
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div
            style={{
              padding: "48px",
              textAlign: "center",
              color: "#6b7280",
              fontSize: "14px",
            }}
          >
            Loading visualizations...
          </div>
        )}

        {/* Visualizations Grid */}
        {!loading && fromLiveboard && visualizations.length > 0 && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                Select Visualizations to Copy
              </div>
              <button
                onClick={() => setShowPreviews(!showPreviews)}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  backgroundColor: showPreviews ? "#eff6ff" : "white",
                  color: showPreviews ? "#3b82f6" : "#374151",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {showPreviews ? "👁️ Hide Previews" : "👁️ Show Previews"}
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: showPreviews
                  ? "repeat(auto-fit, minmax(300px, 1fr))"
                  : "repeat(auto-fit, minmax(250px, 1fr))",
                gap: showPreviews ? "24px" : "16px",
                marginBottom: "24px",
              }}
            >
              {visualizations.map((viz) => {
                const isSelected = selectedVizs.includes(viz.id);
                return (
                  <div
                    key={viz.id}
                    style={{
                      border: isSelected
                        ? "2px solid #3b82f6"
                        : "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "16px",
                      backgroundColor: "white",
                      transition: "all 0.2s",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Title */}
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#1a202c",
                        marginBottom: "12px",
                        wordBreak: "break-word",
                      }}
                    >
                      {viz.name}
                    </div>

                    {/* Embedded Visualization - Only show if previews are enabled */}
                    {showPreviews && (
                      <div
                        style={{
                          flex: 1,
                          minHeight: "300px",
                          marginBottom: "12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "4px",
                          overflow: "hidden",
                        }}
                      >
                        <ThoughtSpotEmbed
                          content={{
                            id: fromLiveboard,
                            name: viz.name,
                            type: "liveboard",
                            vizId: viz.id,
                          }}
                          height="300px"
                        />
                      </div>
                    )}

                    {/* Checkbox */}
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVizs((prev) => [...prev, viz.id]);
                          } else {
                            setSelectedVizs((prev) =>
                              prev.filter((id) => id !== viz.id)
                            );
                          }
                        }}
                        style={{
                          width: "18px",
                          height: "18px",
                          cursor: "pointer",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#374151",
                        }}
                      >
                        Select this visualization
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* No Visualizations Message */}
        {!loading && fromLiveboard && visualizations.length === 0 && !error && (
          <div
            style={{
              padding: "48px",
              textAlign: "center",
              color: "#6b7280",
              fontSize: "14px",
            }}
          >
            No visualizations found in this liveboard.
          </div>
        )}

        {/* No Selection Message */}
        {!fromLiveboard && (
          <div
            style={{
              padding: "48px",
              textAlign: "center",
              color: "#6b7280",
              fontSize: "14px",
            }}
          >
            Select a liveboard to view its visualizations.
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              backgroundColor: "white",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              color: "#374151",
            }}
          >
            Cancel
          </button>
          <button
            disabled={
              selectedVizs.length === 0 ||
              !toLiveboard ||
              loading ||
              isImporting ||
              !!successMessage
            }
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "8px",
              backgroundColor:
                selectedVizs.length > 0 &&
                toLiveboard &&
                !loading &&
                !isImporting &&
                !successMessage
                  ? "#3b82f6"
                  : "#d1d5db",
              cursor:
                selectedVizs.length > 0 &&
                toLiveboard &&
                !loading &&
                !isImporting &&
                !successMessage
                  ? "pointer"
                  : "not-allowed",
              fontSize: "14px",
              fontWeight: "600",
              color: "white",
            }}
            onClick={async () => {
              if (selectedVizs.length === 0 || !fromLiveboard || !toLiveboard)
                return;

              setLoading(true);
              setError(null);
              setSuccessMessage(null);

              try {
                let successCount = 0;
                let failCount = 0;

                // Process each selected visualization
                for (const vizId of selectedVizs) {
                  try {
                    // Export the visualization TML
                    const tml = await exportVisualizationTML(
                      fromLiveboard,
                      vizId
                    );
                    if (!tml) {
                      console.error("Failed to export viz:", vizId);
                      failCount++;
                      continue;
                    }

                    // Import it to the target liveboard
                    setIsImporting(true);
                    const result = await importVisualizationToLiveboard(
                      toLiveboard,
                      tml
                    );

                    if (result.success) {
                      successCount++;
                    } else {
                      console.error(
                        "Failed to import viz:",
                        vizId,
                        result.error
                      );
                      failCount++;
                    }
                  } catch (err) {
                    console.error("Error processing viz:", vizId, err);
                    failCount++;
                  }
                }

                // Show summary message
                if (successCount > 0 && failCount === 0) {
                  setSuccessMessage(
                    `${successCount} visualization${
                      successCount > 1 ? "s" : ""
                    } successfully copied!`
                  );
                } else if (successCount > 0 && failCount > 0) {
                  setSuccessMessage(
                    `${successCount} visualization${
                      successCount > 1 ? "s" : ""
                    } copied, ${failCount} failed`
                  );
                  setError(
                    `${failCount} visualization${
                      failCount > 1 ? "s" : ""
                    } failed to copy. Check console for details.`
                  );
                } else {
                  setError("Failed to copy visualizations");
                }
              } catch (err) {
                console.error("Error copying visualizations:", err);
                setError("Failed to copy visualizations");
              } finally {
                setLoading(false);
                setIsImporting(false);
              }
            }}
          >
            {loading && !isImporting
              ? "Exporting..."
              : isImporting
              ? "Importing..."
              : successMessage
              ? "✓ Copied"
              : selectedVizs.length > 1
              ? `Copy ${selectedVizs.length} Visualizations`
              : "Copy Visualization"}
          </button>
        </div>
      </div>
    </div>
  );
}
