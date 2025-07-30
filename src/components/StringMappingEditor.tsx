"use client";

import { useState } from "react";

interface StringMapping {
  key: string;
  value: string;
}

interface StringMappingEditorProps {
  mappings: Record<string, string>;
  onChange: (mappings: Record<string, string>) => void;
  title: string;
  description?: string;
}

export default function StringMappingEditor({
  mappings,
  onChange,
  title,
  description,
}: StringMappingEditorProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleAddMapping = () => {
    if (newKey.trim() && newValue.trim()) {
      const updatedMappings = {
        ...mappings,
        [newKey.trim()]: newValue.trim(),
      };
      onChange(updatedMappings);
      setNewKey("");
      setNewValue("");
    }
  };

  const handleEditMapping = (key: string) => {
    setEditingKey(key);
    setEditingValue(mappings[key] || "");
  };

  const handleSaveEdit = () => {
    if (editingKey && editingValue.trim()) {
      const updatedMappings = {
        ...mappings,
        [editingKey]: editingValue.trim(),
      };
      onChange(updatedMappings);
      setEditingKey(null);
      setEditingValue("");
    }
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditingValue("");
  };

  const handleDeleteMapping = (key: string) => {
    const updatedMappings = { ...mappings };
    delete updatedMappings[key];
    onChange(updatedMappings);
  };

  const mappingsList = Object.entries(mappings);

  return (
    <div style={{ marginBottom: "24px" }}>
      <h4
        style={{
          fontSize: "16px",
          fontWeight: "600",
          marginBottom: "8px",
        }}
      >
        {title}
      </h4>
      {description && (
        <p
          style={{
            fontSize: "14px",
            color: "#6b7280",
            marginBottom: "16px",
          }}
        >
          {description}
        </p>
      )}

      {/* Add New Mapping */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr auto",
          gap: "8px",
          marginBottom: "16px",
          alignItems: "end",
        }}
      >
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="Key"
          style={{
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        />
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Value"
          style={{
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        />
        <button
          onClick={handleAddMapping}
          disabled={!newKey.trim() || !newValue.trim()}
          style={{
            padding: "8px 12px",
            backgroundColor:
              !newKey.trim() || !newValue.trim() ? "#9ca3af" : "#10b981",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor:
              !newKey.trim() || !newValue.trim() ? "not-allowed" : "pointer",
            fontSize: "14px",
          }}
        >
          Add
        </button>
      </div>

      {/* Existing Mappings */}
      {mappingsList.length > 0 ? (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          {mappingsList.map(([key, value]) => (
            <div
              key={key}
              style={{
                padding: "12px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              {editingKey === key ? (
                <>
                  <input
                    type="text"
                    value={key}
                    disabled
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "14px",
                      backgroundColor: "#f9fafb",
                    }}
                  />
                  <input
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  />
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editingValue.trim()}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: !editingValue.trim()
                        ? "#9ca3af"
                        : "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: !editingValue.trim() ? "not-allowed" : "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#6b7280",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "4px",
                      fontSize: "14px",
                      fontFamily: "monospace",
                    }}
                  >
                    {key}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  >
                    {value}
                  </div>
                  <button
                    onClick={() => handleEditMapping(key)}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#3182ce",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteMapping(key)}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#dc2626",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: "24px",
            textAlign: "center",
            color: "#6b7280",
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
          }}
        >
          No mappings configured
        </div>
      )}
    </div>
  );
}
