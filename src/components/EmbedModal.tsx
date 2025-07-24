"use client";

import { useEffect } from "react";
import { ThoughtSpotContent } from "../types/thoughtspot";
import ThoughtSpotEmbed from "./ThoughtSpotEmbed";

interface EmbedModalProps {
  content: ThoughtSpotContent | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EmbedModal({
  content,
  isOpen,
  onClose,
}: EmbedModalProps) {
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !content) {
    return null;
  }

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
          backgroundColor: "white",
          borderRadius: "8px",
          width: "90vw",
          height: "90vh",
          maxWidth: "1200px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600" }}>
              {content.name}
            </h2>
            {content.description && (
              <p
                style={{
                  margin: "4px 0 0 0",
                  color: "#4a5568",
                  fontSize: "14px",
                }}
              >
                {content.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#4a5568",
              padding: "4px",
              borderRadius: "4px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f7fafc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "24px", overflow: "hidden" }}>
          <ThoughtSpotEmbed
            content={content}
            width="100%"
            height="100%"
            onError={(error) => {
              console.error("Embed error:", error);
            }}
          />
        </div>
      </div>
    </div>
  );
}
