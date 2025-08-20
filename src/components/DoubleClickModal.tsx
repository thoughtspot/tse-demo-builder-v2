"use client";

import React, { useState } from "react";
import { VizPointDoubleClickEvent } from "../types/thoughtspot";
import { VizPointClick } from "../types/data-classes";

interface DoubleClickModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventData: VizPointDoubleClickEvent | null;
  vizPointClickData: VizPointClick | null;
  title?: string;
}

export default function DoubleClickModal({
  isOpen,
  onClose,
  eventData,
  vizPointClickData,
  title = "Double-Click Event Data",
}: DoubleClickModalProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "tabular" | "json">(
    "summary"
  );

  if (!isOpen || !eventData || !vizPointClickData) return null;

  // Use the passed VizPointClick instance
  const vizPointClick = vizPointClickData;

  const formatValue = (value: string | number | boolean | object): string => {
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const renderSummaryView = () => {
    // Extract viz information from embedAnswerData
    const embedAnswerData = vizPointClick.getEmbedAnswerData() as {
      id?: string;
      name?: string;
    } | null;
    const vizId = embedAnswerData?.id || eventData.vizId || "Unknown";
    const vizName = embedAnswerData?.name || eventData.vizName || "Unknown";

    return (
      <div style={{ maxHeight: "400px", overflow: "auto" }}>
        <div style={{ marginBottom: "20px" }}>
          <h4
            style={{
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "10px",
            }}
          >
            Visualization Information
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr",
              gap: "8px",
              fontSize: "14px",
            }}
          >
            <span style={{ fontWeight: "500", color: "#6b7280" }}>Viz ID:</span>
            <span style={{ fontFamily: "monospace" }}>{vizId}</span>
            <span style={{ fontWeight: "500", color: "#6b7280" }}>
              Viz Name:
            </span>
            <span>{vizName}</span>
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h4
            style={{
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "10px",
            }}
          >
            Selected Points ({vizPointClick.nbrRows})
          </h4>
          {vizPointClick.nbrRows > 0 ? (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                padding: "12px",
                marginBottom: "10px",
                backgroundColor: "#f9fafb",
              }}
            >
              <h5
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                Point Data ({vizPointClick.nbrColumns} columns)
              </h5>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  fontSize: "12px",
                }}
              >
                <span style={{ fontWeight: "500" }}>Column Name</span>
                <span style={{ fontWeight: "500" }}>Value</span>
                {vizPointClick.columnNames.map((columnName, index) => {
                  const data = vizPointClick.getDataAsTable([columnName]);
                  const value = data.length > 0 ? data[0][0] : "N/A";
                  return (
                    <React.Fragment key={`column-${index}`}>
                      <span style={{ fontFamily: "monospace" }}>
                        {columnName}
                      </span>
                      <span style={{ fontFamily: "monospace" }}>
                        {formatValue(value)}
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "#6b7280",
                backgroundColor: "#f9fafb",
                borderRadius: "6px",
                border: "1px solid #e5e7eb",
              }}
            >
              No point data available
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTabularView = () => {
    // Extract viz information from embedAnswerData
    const embedAnswerData = vizPointClick.getEmbedAnswerData() as {
      id?: string;
      name?: string;
    } | null;
    const vizId = embedAnswerData?.id || vizPointClick.getVizId() || "Unknown";
    const vizName = embedAnswerData?.name || "Unknown";

    return (
      <div style={{ maxHeight: "400px", overflow: "auto" }}>
        <div style={{ marginBottom: "20px" }}>
          <h4
            style={{
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "10px",
            }}
          >
            Tabular Data
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr",
              gap: "8px",
              fontSize: "14px",
              marginBottom: "15px",
            }}
          >
            <span style={{ fontWeight: "500", color: "#6b7280" }}>
              Event Type:
            </span>
            <span style={{ fontFamily: "monospace" }}>
              {vizPointClick.getEventType()}
            </span>
            <span style={{ fontWeight: "500", color: "#6b7280" }}>Viz ID:</span>
            <span style={{ fontFamily: "monospace" }}>{vizId}</span>
            <span style={{ fontWeight: "500", color: "#6b7280" }}>
              Viz Name:
            </span>
            <span>{vizName}</span>
            <span style={{ fontWeight: "500", color: "#6b7280" }}>Rows:</span>
            <span>{vizPointClick.nbrRows}</span>
            <span style={{ fontWeight: "500", color: "#6b7280" }}>
              Columns:
            </span>
            <span>{vizPointClick.nbrColumns}</span>
          </div>
        </div>

        {vizPointClick.nbrRows > 0 && vizPointClick.nbrColumns > 0 ? (
          <div>
            <h5
              style={{
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "10px",
              }}
            >
              Data Table
            </h5>
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                overflow: "auto",
                maxWidth: "100%",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#f3f4f6" }}>
                    {vizPointClick.columnNames.map((columnName, index) => (
                      <th
                        key={index}
                        style={{
                          padding: "8px 12px",
                          textAlign: "left",
                          borderBottom: "1px solid #e5e7eb",
                          fontWeight: "600",
                          fontSize: "12px",
                        }}
                      >
                        {columnName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vizPointClick.getDataAsTable().map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      style={{
                        backgroundColor:
                          rowIndex % 2 === 0 ? "#ffffff" : "#f9fafb",
                      }}
                    >
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          style={{
                            padding: "8px 12px",
                            borderBottom: "1px solid #e5e7eb",
                            fontFamily: "monospace",
                            fontSize: "12px",
                          }}
                        >
                          {String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              color: "#6b7280",
              backgroundColor: "#f9fafb",
              borderRadius: "6px",
              border: "1px solid #e5e7eb",
            }}
          >
            No tabular data available
          </div>
        )}
      </div>
    );
  };

  const renderJsonView = () => {
    return (
      <div style={{ maxHeight: "400px", overflow: "auto" }}>
        <pre
          style={{
            backgroundColor: "#1f2937",
            color: "#f9fafb",
            padding: "16px",
            borderRadius: "6px",
            fontSize: "12px",
            lineHeight: "1.5",
            overflow: "auto",
            fontFamily: "monospace",
          }}
        >
          {JSON.stringify(vizPointClick.originalData, null, 2)}
        </pre>
      </div>
    );
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
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          width: "90%",
          maxWidth: "900px",
          maxHeight: "90vh",
          overflow: "hidden",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#6b7280",
              padding: "4px",
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
          }}
        >
          <button
            onClick={() => setActiveTab("summary")}
            style={{
              padding: "12px 20px",
              border: "none",
              background: activeTab === "summary" ? "#3b82f6" : "transparent",
              color: activeTab === "summary" ? "#ffffff" : "#6b7280",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab("tabular")}
            style={{
              padding: "12px 20px",
              border: "none",
              background: activeTab === "tabular" ? "#3b82f6" : "transparent",
              color: activeTab === "tabular" ? "#ffffff" : "#6b7280",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Tabular
          </button>
          <button
            onClick={() => setActiveTab("json")}
            style={{
              padding: "12px 20px",
              border: "none",
              background: activeTab === "json" ? "#3b82f6" : "transparent",
              color: activeTab === "json" ? "#ffffff" : "#6b7280",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            JSON
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px" }}>
          {activeTab === "summary" && renderSummaryView()}
          {activeTab === "tabular" && renderTabularView()}
          {activeTab === "json" && renderJsonView()}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              backgroundColor: "#6b7280",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
