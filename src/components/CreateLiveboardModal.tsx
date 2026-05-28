"use client";

import React, { useState, useEffect, useRef } from "react";

interface CreateLiveboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (id: string, name: string, description?: string) => void;
  onCreate: (name: string, description?: string) => Promise<{ id: string; name: string } | null>;
}

export default function CreateLiveboardModal({
  isOpen,
  onClose,
  onCreated,
  onCreate,
}: CreateLiveboardModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setError(null);
      setIsCreating(false);
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isCreating) onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isCreating, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Liveboard name is required.");
      return;
    }

    setIsCreating(true);
    setError(null);

    const result = await onCreate(trimmedName, description.trim() || undefined);

    if (result) {
      onCreated(result.id, result.name, description.trim() || undefined);
    } else {
      setError("Failed to create liveboard. Please try again.");
      setIsCreating(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isCreating) onClose();
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
          padding: "32px",
          width: "480px",
          maxWidth: "90%",
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
              fontSize: "20px",
              fontWeight: "700",
              margin: 0,
              color: "#1a202c",
            }}
          >
            Create New Liveboard
          </h2>
          <button
            onClick={onClose}
            disabled={isCreating}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: isCreating ? "not-allowed" : "pointer",
              padding: "4px 8px",
              color: "#6b7280",
              opacity: isCreating ? 0.4 : 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "6px",
                color: "#374151",
              }}
            >
              Name <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter liveboard name"
              disabled={isCreating}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${error && !name.trim() ? "#ef4444" : "#d1d5db"}`,
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                backgroundColor: isCreating ? "#f9fafb" : "white",
                color: "#1a202c",
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "6px",
                color: "#374151",
              }}
            >
              Description{" "}
              <span style={{ fontSize: "12px", fontWeight: "400", color: "#9ca3af" }}>
                (optional)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description"
              disabled={isCreating}
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
                backgroundColor: isCreating ? "#f9fafb" : "white",
                color: "#1a202c",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                padding: "10px 14px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                color: "#dc2626",
                fontSize: "14px",
                marginBottom: "20px",
              }}
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              style={{
                padding: "10px 20px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                backgroundColor: "white",
                cursor: isCreating ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
                opacity: isCreating ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              style={{
                padding: "10px 20px",
                border: "none",
                borderRadius: "8px",
                backgroundColor:
                  !isCreating && name.trim() ? "#3b82f6" : "#d1d5db",
                cursor:
                  !isCreating && name.trim() ? "pointer" : "not-allowed",
                fontSize: "14px",
                fontWeight: "600",
                color: "white",
                minWidth: "120px",
              }}
            >
              {isCreating ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
