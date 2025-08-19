"use client";

import { ThoughtSpotContent } from "../types/thoughtspot";
import MaterialIcon from "./MaterialIcon";

interface ContentCardProps {
  content: ThoughtSpotContent;
  onOpen: (content: ThoughtSpotContent) => void;
}

export default function ContentCard({ content, onOpen }: ContentCardProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "liveboard":
        return (
          <MaterialIcon
            icon="dashboard"
            size={24}
            style={{ color: "#4f46e5" }}
          />
        );
      case "answer":
        return (
          <MaterialIcon
            icon="analytics"
            size={24}
            style={{ color: "#10b981" }}
          />
        );
      case "model":
        return (
          <MaterialIcon icon="search" size={24} style={{ color: "#6b7280" }} />
        );
      default:
        return (
          <MaterialIcon
            icon="description"
            size={24}
            style={{ color: "#6b7280" }}
          />
        );
    }
  };

  const formatLastAccessed = (timestamp?: number) => {
    if (!timestamp) return "Never accessed";

    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days < 7) return `${days} days ago`;

    return new Date(timestamp).toLocaleDateString();
  };

  const handleOpen = async () => {
    if (content.type === "model") {
      // For models, we'll need to handle differently or show a message
      alert("Model embedding not yet implemented");
      return;
    }

    // Call the parent's onOpen handler
    onOpen(content);
  };

  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "6px",
        border: "1px solid #e2e8f0",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div
          style={{ marginRight: "12px", display: "flex", alignItems: "center" }}
        >
          {getIcon(content.type)}
        </div>
        <h3 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>
          {content.name}
        </h3>
      </div>

      <p
        style={{
          color: "#4a5568",
          fontSize: "14px",
          marginBottom: "12px",
          minHeight: "40px",
        }}
      >
        {content.description || "No description available"}
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "12px", color: "#718096" }}>
          Last accessed: {formatLastAccessed(content.lastAccessed)}
        </span>
        <button
          style={{
            padding: "6px 12px",
            backgroundColor: "#3182ce",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onOpen(content);
          }}
        >
          Open
        </button>
      </div>
    </div>
  );
}
