"use client";

import { useState, useEffect } from "react";

interface PinToLiveboardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPin: (name: string, description?: string) => void;
  isLoading?: boolean;
}

export default function PinToLiveboardDialog({
  isOpen,
  onClose,
  onPin,
  isLoading = false,
}: PinToLiveboardDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setDescription("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onPin(name.trim(), description.trim() || undefined);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid var(--border-color, #d1d5db)",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
    backgroundColor: "white",
    color: "#1f2937",
    fontFamily: "inherit",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10500,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "var(--radius-lg, 12px)",
          padding: "32px",
          maxWidth: "480px",
          width: "90%",
          boxShadow: "var(--shadow-lg, 0 20px 40px rgba(0,0,0,0.2))",
        }}
      >
        <h2
          style={{
            margin: "0 0 6px 0",
            fontSize: "20px",
            fontWeight: "600",
            color: "#1f2937",
          }}
        >
          Pin to Liveboard
        </h2>
        <p
          style={{
            margin: "0 0 24px 0",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          Add this visualization to the current liveboard.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "6px",
              }}
            >
              Visualization Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name"
              autoFocus
              required
              disabled={isLoading}
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor =
                  "var(--primary-button-bg, #3182ce)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(49,130,206,0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor =
                  "var(--border-color, #d1d5db)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{ marginBottom: "28px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "6px",
              }}
            >
              Description{" "}
              <span style={{ fontWeight: 400, color: "#9ca3af" }}>
                (optional)
              </span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description"
              disabled={isLoading}
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor =
                  "var(--primary-button-bg, #3182ce)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(49,130,206,0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor =
                  "var(--border-color, #d1d5db)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                padding: "8px 20px",
                borderRadius: "var(--radius-md, 6px)",
                border: "2px solid var(--secondary-button-border, #d1d5db)",
                backgroundColor:
                  "var(--secondary-button-bg, white)",
                color: "var(--secondary-button-text, #374151)",
                fontSize: "14px",
                fontWeight: "500",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
                transition: "all var(--transition-fast, 150ms) ease",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor =
                    "var(--secondary-button-hover-bg, #f9fafb)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--secondary-button-bg, white)";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              style={{
                padding: "8px 20px",
                borderRadius: "var(--radius-md, 6px)",
                border: "2px solid var(--primary-button-border, #3182ce)",
                backgroundColor:
                  "var(--primary-button-bg, #3182ce)",
                color: "var(--primary-button-text, white)",
                fontSize: "14px",
                fontWeight: "600",
                cursor:
                  isLoading || !name.trim() ? "not-allowed" : "pointer",
                opacity: isLoading || !name.trim() ? 0.6 : 1,
                transition: "all var(--transition-fast, 150ms) ease",
              }}
              onMouseEnter={(e) => {
                if (!isLoading && name.trim()) {
                  e.currentTarget.style.backgroundColor =
                    "var(--primary-button-hover-bg, #2c5aa0)";
                  e.currentTarget.style.borderColor =
                    "var(--primary-button-hover-bg, #2c5aa0)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--primary-button-bg, #3182ce)";
                e.currentTarget.style.borderColor =
                  "var(--primary-button-border, #3182ce)";
              }}
            >
              {isLoading ? "Pinning…" : "Pin to Liveboard"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
