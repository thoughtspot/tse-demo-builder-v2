"use client";

import { useState, useEffect } from "react";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagFilterComponentProps {
  value: string;
  onChange: (value: string) => void;
  availableTags: Tag[];
  isLoading: boolean;
  error: string | null;
  label: string;
  description: string;
}

export default function TagFilterComponent({
  value,
  onChange,
  availableTags,
  isLoading,
  error,
  label,
  description,
}: TagFilterComponentProps) {
  const [searchFilter, setSearchFilter] = useState("");

  // Clear search filter when component mounts or when availableTags changes
  useEffect(() => {
    setSearchFilter("");
  }, [availableTags]);

  // Filter tags based on search input
  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div style={{ marginTop: "16px" }}>
      <label
        style={{
          display: "block",
          marginBottom: "4px",
          fontWeight: "500",
          fontSize: "14px",
        }}
      >
        {label}
      </label>
      {isLoading ? (
        <div
          style={{
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            fontSize: "14px",
            color: "#6b7280",
            backgroundColor: "#f9fafb",
          }}
        >
          Loading tags...
        </div>
      ) : error ? (
        <div
          style={{
            padding: "8px 12px",
            border: "1px solid #f87171",
            borderRadius: "4px",
            fontSize: "14px",
            color: "#dc2626",
            backgroundColor: "#fef2f2",
          }}
        >
          {error}
        </div>
      ) : (
        <div>
          <input
            type="text"
            placeholder="Search tags..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              fontSize: "14px",
              marginBottom: "8px",
            }}
          />
          <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              fontSize: "14px",
              maxHeight: "200px",
            }}
            size={Math.min(filteredTags.length + 1, 8)}
          >
            <option value="">All Tags</option>
            {filteredTags.map((tag) => (
              <option key={tag.id} value={tag.name}>
                {tag.name}
              </option>
            ))}
          </select>
          {filteredTags.length === 0 && searchFilter && (
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "12px",
                color: "#dc2626",
              }}
            >
              No tags found matching &quot;{searchFilter}&quot;
            </p>
          )}
        </div>
      )}
      <p
        style={{
          margin: "4px 0 0 0",
          fontSize: "12px",
          color: "#6b7280",
        }}
      >
        {description}
      </p>
    </div>
  );
}
