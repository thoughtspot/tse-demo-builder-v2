"use client";

import { useEffect } from "react";
import { ThoughtSpotContent } from "../types/thoughtspot";
import ThoughtSpotEmbed from "./ThoughtSpotEmbed";
import { useAppContext } from "./Layout";

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
  const context = useAppContext();

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
        {(!context.stylingConfig.embedDisplay?.hideTitle ||
          (content.description &&
            !context.stylingConfig.embedDisplay?.hideDescription)) && (
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
              {!context.stylingConfig.embedDisplay?.hideTitle && (
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600" }}>
                  {content.name}
                </h2>
              )}
              {content.description &&
                !context.stylingConfig.embedDisplay?.hideDescription && (
                  <p
                    style={{
                      margin: context.stylingConfig.embedDisplay?.hideTitle
                        ? "0"
                        : "4px 0 0 0",
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
        )}

        {/* Content */}
        <div
          style={{
            flex: 1,
            padding: "24px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Close button when header is hidden */}
          {context.stylingConfig.embedDisplay?.hideTitle &&
            (!content.description ||
              context.stylingConfig.embedDisplay?.hideDescription) && (
              <button
                onClick={onClose}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  background: "rgba(255, 255, 255, 0.9)",
                  border: "1px solid #e2e8f0",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#4a5568",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  zIndex: 10,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.9)";
                }}
              >
                ×
              </button>
            )}
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
