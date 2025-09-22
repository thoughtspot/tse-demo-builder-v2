"use client";

import { useState, useEffect } from "react";
import { DoubleClickHandlingConfig } from "../types/thoughtspot";

interface DoubleClickEditorProps {
  config: DoubleClickHandlingConfig;
  onChange: (config: DoubleClickHandlingConfig) => void;
}

export default function DoubleClickEditor({
  config,
  onChange,
}: DoubleClickEditorProps) {
  const [localConfig, setLocalConfig] = useState<DoubleClickHandlingConfig>({
    enabled: false,
    showDefaultModal: true,
    customJavaScript: "",
    modalTitle: "Double-Click Event Data",
  });

  const [errors, setErrors] = useState({
    customJavaScript: "",
  });

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleChange = (
    field: keyof DoubleClickHandlingConfig,
    value: string | boolean
  ) => {
    const newConfig = { ...localConfig, [field]: value };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  const validateJavaScript = (code: string) => {
    if (!code.trim()) return "";

    try {
      // Basic syntax validation
      new Function(code);
      return "";
    } catch (error) {
      return error instanceof Error
        ? error.message
        : "Invalid JavaScript syntax";
    }
  };

  const handleJavaScriptChange = (value: string) => {
    const error = validateJavaScript(value);
    setErrors({ ...errors, customJavaScript: error });
    handleChange("customJavaScript", value);
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h4
          style={{ fontSize: "16px", fontWeight: "600", marginBottom: "10px" }}
        >
          Double-Click Event Handling
        </h4>
        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "20px" }}>
          Configure how to handle double-click events on embedded
          visualizations.
        </p>
      </div>

      {/* Enable/Disable */}
      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <input
            type="checkbox"
            checked={localConfig.enabled}
            onChange={(e) => handleChange("enabled", e.target.checked)}
            style={{ marginRight: "8px" }}
          />
          <span style={{ fontSize: "14px", fontWeight: "500" }}>
            Enable double-click event handling
          </span>
        </label>
        <p style={{ fontSize: "12px", color: "#6b7280", marginLeft: "24px" }}>
          When enabled, double-clicking on visualization points will trigger
          custom actions.
        </p>
      </div>

      {localConfig.enabled && (
        <>
          {/* Show Default Modal */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <input
                type="checkbox"
                checked={localConfig.showDefaultModal}
                onChange={(e) =>
                  handleChange("showDefaultModal", e.target.checked)
                }
                style={{ marginRight: "8px" }}
              />
              <span style={{ fontSize: "14px", fontWeight: "500" }}>
                Show default modal with event data
              </span>
            </label>
            <p
              style={{ fontSize: "12px", color: "#6b7280", marginLeft: "24px" }}
            >
              Display a modal with the event data in JSON format when no custom
              JavaScript is provided.
            </p>
          </div>

          {/* Modal Title */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Modal Title
            </label>
            <input
              type="text"
              value={localConfig.modalTitle || ""}
              onChange={(e) => handleChange("modalTitle", e.target.value)}
              placeholder="Double-Click Event Data"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />
          </div>

          {/* Custom JavaScript */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Custom JavaScript Handler (Optional)
            </label>
            <textarea
              value={localConfig.customJavaScript || ""}
              onChange={(e) => handleJavaScriptChange(e.target.value)}
              placeholder={`// Custom JavaScript to handle double-click events
// Available variables:
// - event: The double-click event data
// - modal: Reference to the modal element (if showDefaultModal is true)
// - embedInstance: Reference to the ThoughtSpot embed instance

console.log('Double-click event:', event);

// Example: Show custom alert
// alert('Double-clicked on: ' + JSON.stringify(event.selectedPoints));

// Example: Update modal content
// if (modal) {
//   modal.innerHTML = '<h3>Custom Content</h3><p>You clicked on: ' + event.selectedPoints.length + ' points</p>';
// }`}
              style={{
                width: "100%",
                minHeight: "200px",
                padding: "12px",
                border: errors.customJavaScript
                  ? "1px solid #ef4444"
                  : "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                fontFamily: "monospace",
                resize: "vertical",
              }}
            />
            {errors.customJavaScript && (
              <p
                style={{ fontSize: "12px", color: "#ef4444", marginTop: "5px" }}
              >
                {errors.customJavaScript}
              </p>
            )}
            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "5px" }}>
              Write custom JavaScript to handle the double-click event. The
              tabular data will be passed as the first parameter.
            </p>
          </div>

          {/* Documentation */}
          <div
            style={{
              backgroundColor: "#f3f4f6",
              padding: "15px",
              borderRadius: "6px",
              border: "1px solid #e5e7eb",
            }}
          >
            <h5
              style={{
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "10px",
              }}
            >
              📖 Documentation
            </h5>
            <div
              style={{ fontSize: "12px", color: "#374151", lineHeight: "1.5" }}
            >
              <p style={{ marginBottom: "8px" }}>
                <strong>Available Variables:</strong>
              </p>
              <ul style={{ marginLeft: "20px", marginBottom: "8px" }}>
                <li>
                  <code>tabularData</code> - The VizPointClick tabular data
                  object
                </li>
                <li>
                  <code>modal</code> - Reference to the modal element (if
                  showDefaultModal is true)
                </li>
                <li>
                  <code>embedInstance</code> - Reference to the ThoughtSpot
                  embed instance
                </li>
              </ul>
              <p style={{ marginBottom: "8px" }}>
                <strong>Tabular Data Structure:</strong>
              </p>
              <pre
                style={{
                  fontSize: "11px",
                  backgroundColor: "#ffffff",
                  padding: "8px",
                  borderRadius: "4px",
                  overflow: "auto",
                  marginBottom: "8px",
                }}
              >
                {`tabularData.columnNames        // Array of column names
tabularData.nbrRows          // Number of rows
tabularData.nbrColumns       // Number of columns
tabularData.getDataAsTable() // Get data as 2D array
tabularData.getEventType()   // Event type (vizPointClick, etc.)
tabularData.getVizId()       // Visualization ID
tabularData.originalData     // Raw JSON data
`}
              </pre>
              <p style={{ marginBottom: "8px" }}>
                <strong>Note:</strong> If custom JavaScript is provided, it will
                run instead of the default modal (unless showDefaultModal is
                true). You can create your own modal using the provided modal
                element.
              </p>
              <div style={{ marginBottom: "8px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "5px",
                  }}
                >
                  <strong>Example Custom Modal:</strong>
                  <button
                    onClick={(event) => {
                      const button = event.currentTarget as HTMLButtonElement;
                      const exampleCode = `// Create modal content
if (modal) {
  const content = document.createElement('div');
  content.style.cssText = 'background: white; border-radius: 8px; padding: 20px; max-width: 600px; max-height: 80vh; overflow: auto; position: relative;';
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = 'position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 20px; cursor: pointer; color: #6b7280; padding: 4px; min-width: 24px; min-height: 24px;';
  closeBtn.setAttribute('type', 'button');
  closeBtn.onclick = function(event) {
    event.preventDefault();
    event.stopPropagation();
    var modalContainer = document.getElementById('double-click-modal');
    if (modalContainer && modalContainer.parentNode) {
      modalContainer.parentNode.removeChild(modalContainer);
    }
  };
  closeBtn.onmousedown = function(event) {
    event.preventDefault();
    event.stopPropagation();
  };
  
  const title = document.createElement('h3');
  title.textContent = 'Custom Modal';
  title.style.cssText = 'margin: 0 0 20px 0; font-size: 18px;';
  
  const info = document.createElement('p');
  info.textContent = 'You clicked on ' + tabularData.nbrRows + ' point(s) with ' + tabularData.nbrColumns + ' columns.';
  
  const columns = document.createElement('p');
  columns.textContent = 'Columns: ' + tabularData.columnNames.join(', ');
  
  content.appendChild(closeBtn);
  content.appendChild(title);
  content.appendChild(info);
  content.appendChild(columns);
  
  modal.appendChild(content);
}`;
                      navigator.clipboard
                        .writeText(exampleCode)
                        .then(() => {
                          // Show a brief "Copied!" message
                          const originalText = button.textContent;
                          button.textContent = "Copied!";
                          button.style.backgroundColor = "#10b981";
                          setTimeout(() => {
                            button.textContent = originalText;
                            button.style.backgroundColor = "#3b82f6";
                          }, 1000);
                        })
                        .catch((error) => {
                          console.error("Failed to copy to clipboard:", error);
                          // Fallback: show error message
                          const originalText = button.textContent;
                          button.textContent = "Error!";
                          button.style.backgroundColor = "#ef4444";
                          setTimeout(() => {
                            button.textContent = originalText;
                            button.style.backgroundColor = "#3b82f6";
                          }, 1000);
                        });
                    }}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "11px",
                      cursor: "pointer",
                      fontWeight: "500",
                    }}
                  >
                    Copy Code
                  </button>
                </div>
                <pre
                  style={{
                    fontSize: "11px",
                    backgroundColor: "#ffffff",
                    padding: "8px",
                    borderRadius: "4px",
                    overflow: "auto",
                    marginBottom: "8px",
                  }}
                >
                  {`// Create modal content
if (modal) {
  modal.innerHTML = \`
    <div style="
      background: white;
      border-radius: 8px;
      padding: 20px;
      max-width: 600px;
      max-height: 80vh;
      overflow: auto;
      position: relative;
    ">
      <button onclick="this.closest('[id=\\"double-click-modal\\"]').remove()" 
              style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: #6b7280;
              ">×</button>
      <h3 style="margin: 0 0 20px 0; font-size: 18px;">Custom Modal</h3>
      <p>You clicked on \${tabularData.nbrRows} point(s) with \${tabularData.nbrColumns} columns.</p>
      <p>Columns: \${tabularData.columnNames.join(', ')}</p>
    </div>
  \`;
}`}
                </pre>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
