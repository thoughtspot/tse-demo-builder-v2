"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAppContext } from "../../../components/Layout";
import ContentGrid from "../../../components/ContentGrid";
import ThoughtSpotEmbed from "../../../components/ThoughtSpotEmbed";
import { ThoughtSpotContent } from "../../../types/thoughtspot";

type ContentType = "all" | "answer" | "liveboard";

function CustomMenuPageContent() {
  const params = useParams();
  const router = useRouter();
  const { customMenus, stylingConfig } = useAppContext();
  const [mounted, setMounted] = useState(false);
  const [selectedContentType, setSelectedContentType] =
    useState<ContentType>("all");
  const [selectedContent, setSelectedContent] =
    useState<ThoughtSpotContent | null>(null);
  const [showContentDirectly, setShowContentDirectly] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const menuId = params?.id as string;
  const customMenu = customMenus.find((menu) => menu.id === menuId);

  const handleBackClick = () => {
    router.back();
  };

  const handleContentOpen = (content: ThoughtSpotContent) => {
    setSelectedContent(content);
    setShowContentDirectly(true);
  };

  const handleBackToGrid = () => {
    setShowContentDirectly(false);
    setSelectedContent(null);
  };

  const getTabLabels = () => [
    { id: "all" as ContentType, label: "All", count: null },
    { id: "answer" as ContentType, label: "Answers", count: null },
    { id: "liveboard" as ContentType, label: "Liveboards", count: null },
  ];

  const getDynamicSubtitle = () => {
    // Check if this is a direct embed menu
    if (customMenu?.contentSelection?.type === "direct") {
      const embedType = customMenu.contentSelection.directEmbed?.type;
      if (embedType === "liveboard") {
        return "Liveboard";
      } else if (embedType === "answer") {
        return "Answer";
      } else if (embedType === "spotter") {
        return "Spotter";
      }
    }

    if (selectedContentType === "all") {
      return "Liveboards and Answers";
    } else if (selectedContentType === "answer") {
      return "Answers Only";
    } else {
      return "Liveboards Only";
    }
  };

  const getDynamicDescription = () => {
    // Check if this is a direct embed menu
    if (customMenu?.contentSelection?.type === "direct") {
      return (
        customMenu.contentSelection.directEmbed?.contentDescription ||
        `Direct ${
          customMenu.contentSelection.directEmbed?.type || "content"
        } embed`
      );
    }

    if (selectedContentType === "all") {
      return "Content selected for this custom menu.";
    } else if (selectedContentType === "answer") {
      return "Answers selected for this custom menu.";
    } else {
      return "Liveboards selected for this custom menu.";
    }
  };

  // Show loading state until component is mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div>
        <div style={{ marginBottom: "24px" }}>
          <button
            onClick={handleBackClick}
            style={{
              padding: "8px 16px",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            ← Back
          </button>
        </div>
        <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (!customMenu) {
    return (
      <div>
        <div style={{ marginBottom: "24px" }}>
          <button
            onClick={handleBackClick}
            style={{
              padding: "8px 16px",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            ← Back
          </button>
        </div>
        <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
          <h1>Custom Menu Not Found</h1>
          <p>The requested custom menu could not be found.</p>
        </div>
      </div>
    );
  }

  const contentTypeTabs = getTabLabels();

  // Handle direct embed menus - show the embed directly without grid
  if (
    customMenu?.contentSelection?.type === "direct" &&
    customMenu.contentSelection.directEmbed
  ) {
    const directEmbed = customMenu.contentSelection.directEmbed;
    const directContent: ThoughtSpotContent = {
      id: directEmbed.contentId,
      name: directEmbed.contentName || customMenu.name,
      description: directEmbed.contentDescription || customMenu.description,
      type: directEmbed.type === "spotter" ? "model" : directEmbed.type,
    };

    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          height: "100%",
          overflow: "hidden",
        }}
      >
        {!stylingConfig.embedDisplay?.hideTitle ||
        (directContent.description &&
          !stylingConfig.embedDisplay?.hideDescription) ? (
          <div
            style={{
              backgroundColor:
                stylingConfig.application.backgrounds?.cardBackground ||
                "#f7fafc",
              padding: "24px",
              borderRadius: "8px",
              border: `1px solid ${
                stylingConfig.application.backgrounds?.borderColor || "#e2e8f0"
              }`,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "auto",
              minHeight: 0,
            }}
          >
            {!stylingConfig.embedDisplay?.hideTitle && (
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "600",
                  marginBottom: "16px",
                }}
              >
                {directContent.name}
              </h2>
            )}
            {directContent.description &&
              !stylingConfig.embedDisplay?.hideDescription && (
                <p
                  style={{
                    color: "#4a5568",
                    lineHeight: "1.6",
                    marginBottom: stylingConfig.embedDisplay?.hideTitle
                      ? "0"
                      : "24px",
                  }}
                >
                  {directContent.description}
                </p>
              )}
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                backgroundColor: "white",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                overflow: "auto",
              }}
            >
              <ThoughtSpotEmbed
                content={directContent}
                width="100%"
                height="100%"
                onLoad={() => {}}
                onError={(error) =>
                  console.error(
                    "Direct embed load error for",
                    directContent.name,
                    ":",
                    error
                  )
                }
              />
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "auto",
              minHeight: 0,
            }}
          >
            <ThoughtSpotEmbed
              content={directContent}
              width="100%"
              height="100%"
              onLoad={() => {}}
              onError={(error) =>
                console.error(
                  "Direct embed load error for",
                  directContent.name,
                  ":",
                  error
                )
              }
            />
          </div>
        )}
      </div>
    );
  }

  // If showing content directly, render the content view with proper space utilization
  if (showContentDirectly && selectedContent) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          height: "100%",
          overflow: "hidden",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <button
            onClick={handleBackToGrid}
            style={{
              padding: "8px 16px",
              backgroundColor:
                stylingConfig.application.buttons?.secondary?.backgroundColor ||
                "#6b7280",
              color:
                stylingConfig.application.buttons?.secondary?.foregroundColor ||
                "white",
              border: `1px solid ${
                stylingConfig.application.buttons?.secondary?.borderColor ||
                "#6b7280"
              }`,
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            ← Back to {customMenu?.name || "Content"}
          </button>
        </div>
        {!stylingConfig.embedDisplay?.hideTitle ||
        (selectedContent.description &&
          !stylingConfig.embedDisplay?.hideDescription) ? (
          <div
            style={{
              backgroundColor:
                stylingConfig.application.backgrounds?.cardBackground ||
                "#f7fafc",
              padding: "24px",
              borderRadius: "8px",
              border: `1px solid ${
                stylingConfig.application.backgrounds?.borderColor || "#e2e8f0"
              }`,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "auto",
              minHeight: 0,
            }}
          >
            {!stylingConfig.embedDisplay?.hideTitle && (
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "600",
                  marginBottom: "16px",
                }}
              >
                {selectedContent.name}
              </h2>
            )}
            {selectedContent.description &&
              !stylingConfig.embedDisplay?.hideDescription && (
                <p
                  style={{
                    color: "#4a5568",
                    lineHeight: "1.6",
                    marginBottom: stylingConfig.embedDisplay?.hideTitle
                      ? "0"
                      : "24px",
                  }}
                >
                  {selectedContent.description}
                </p>
              )}
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                backgroundColor: "white",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                overflow: "auto",
              }}
            >
              <ThoughtSpotEmbed
                content={selectedContent}
                width="100%"
                height="100%"
                onLoad={() => {}}
                onError={(error) =>
                  console.error(
                    "Content load error for",
                    selectedContent.name,
                    ":",
                    error
                  )
                }
              />
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "auto",
              minHeight: 0,
            }}
          >
            <ThoughtSpotEmbed
              content={selectedContent}
              width="100%"
              height="100%"
              onLoad={() => {}}
              onError={(error) =>
                console.error(
                  "Content load error for",
                  selectedContent.name,
                  ":",
                  error
                )
              }
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Content Type Selector Tabs */}
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e5e7eb",
            gap: "0",
          }}
        >
          {contentTypeTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedContentType(tab.id)}
              style={{
                padding: "12px 24px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                color: selectedContentType === tab.id ? "#1f2937" : "#6b7280",
                borderBottom:
                  selectedContentType === tab.id
                    ? "2px solid #3b82f6"
                    : "2px solid transparent",
                transition: "all 0.2s ease",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (selectedContentType !== tab.id) {
                  e.currentTarget.style.color = "#374151";
                  e.currentTarget.style.borderBottomColor = "#d1d5db";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedContentType !== tab.id) {
                  e.currentTarget.style.color = "#6b7280";
                  e.currentTarget.style.borderBottomColor = "transparent";
                }
              }}
            >
              {tab.label}
              {tab.count !== null && (
                <span
                  style={{
                    marginLeft: "8px",
                    padding: "2px 8px",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <ContentGrid
        title={customMenu.name}
        subtitle={getDynamicSubtitle()}
        description={getDynamicDescription()}
        emptyMessage="No content found for this custom menu. Please check the configuration."
        showDirectContent={true}
        onContentOpen={handleContentOpen}
        onBackClick={handleBackClick}
        customContent={{
          ...customMenu,
          contentSelection: {
            ...customMenu.contentSelection,
            // Don't apply content type filtering here - let the custom menu's content selection work
            // The tabs will filter the content that's already fetched
          },
        }}
        tabContentType={
          selectedContentType === "all" ? undefined : selectedContentType
        }
      />
    </div>
  );
}

export default function CustomMenuPage() {
  return <CustomMenuPageContent />;
}
