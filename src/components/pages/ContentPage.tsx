"use client";

import { useState } from "react";
import ContentGrid from "../ContentGrid";
import ThoughtSpotEmbed from "../ThoughtSpotEmbed";
import { useAppContext } from "../Layout";
import { ThoughtSpotContent } from "../../types/thoughtspot";

type ContentType = "all" | "answer" | "liveboard";

interface ContentPageProps {
  pageType: "all-content" | "favorites" | "my-reports";
  title: string;
  subtitle: string;
  description: string;
  emptyMessage: string;
}

interface AllContentConfig {
  contentType?: "answer" | "liveboard";
  excludeSystemContent?: boolean;
  namePattern?: string;
  tagFilter?: string;
}

interface FavoritesConfig {
  contentType?: "answer" | "liveboard";
  namePattern?: string;
  tagFilter?: string;
}

interface UserContentConfig {
  contentType?: "answer" | "liveboard";
  namePattern?: string;
  tagFilter?: string;
}

export default function ContentPage({
  pageType,
  title,
  subtitle,
  description,
  emptyMessage,
}: ContentPageProps) {
  const { standardMenus, stylingConfig } = useAppContext();
  const [selectedContentType, setSelectedContentType] =
    useState<ContentType>("all");
  const [selectedContent, setSelectedContent] =
    useState<ThoughtSpotContent | null>(null);
  const [showContentDirectly, setShowContentDirectly] = useState(false);

  // Get configuration from standard menus
  const menu = standardMenus.find((m) => m.id === pageType);

  let config:
    | AllContentConfig
    | FavoritesConfig
    | UserContentConfig
    | undefined = undefined;
  let fetchProp: {
    fetchAllContent?: boolean;
    allContentConfig?: AllContentConfig;
    fetchFavorites?: boolean;
    favoritesConfig?: FavoritesConfig;
    fetchUserContent?: boolean;
    userContentConfig?: UserContentConfig;
  } = {};

  if (menu) {
    if (pageType === "all-content") {
      config = {
        contentType:
          selectedContentType === "all" ? undefined : selectedContentType,
        excludeSystemContent: menu.excludeSystemContent || false,
        namePattern: menu.namePattern,
        tagFilter: menu.tagFilter,
      };
      fetchProp = { fetchAllContent: true, allContentConfig: config };
    } else if (pageType === "favorites") {
      config = {
        contentType:
          selectedContentType === "all" ? undefined : selectedContentType,
        namePattern: menu.namePattern,
        tagFilter: menu.tagFilter,
      };
      fetchProp = { fetchFavorites: true, favoritesConfig: config };
    } else if (pageType === "my-reports") {
      config = {
        contentType:
          selectedContentType === "all" ? undefined : selectedContentType,
        namePattern: menu.namePattern,
        tagFilter: menu.tagFilter,
      };
      fetchProp = { fetchUserContent: true, userContentConfig: config };
    }
  }

  const handleContentOpen = (content: ThoughtSpotContent) => {
    setSelectedContent(content);
    setShowContentDirectly(true);
  };

  const handleBackToGrid = () => {
    setShowContentDirectly(false);
    setSelectedContent(null);
  };

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
            ← Back to {title || subtitle || "Content"}
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

  const getTabLabels = () => {
    switch (pageType) {
      case "all-content":
        return [
          { id: "all" as ContentType, label: "All Content", count: null },
          { id: "answer" as ContentType, label: "Answers", count: null },
          { id: "liveboard" as ContentType, label: "Liveboards", count: null },
        ];
      case "favorites":
        return [
          { id: "all" as ContentType, label: "All Favorites", count: null },
          {
            id: "answer" as ContentType,
            label: "Favorite Answers",
            count: null,
          },
          {
            id: "liveboard" as ContentType,
            label: "Favorite Liveboards",
            count: null,
          },
        ];
      case "my-reports":
        return [
          { id: "all" as ContentType, label: "All My Content", count: null },
          { id: "answer" as ContentType, label: "My Answers", count: null },
          {
            id: "liveboard" as ContentType,
            label: "My Liveboards",
            count: null,
          },
        ];
      default:
        return [];
    }
  };

  const contentTypeTabs = getTabLabels();

  const getDynamicSubtitle = () => {
    switch (pageType) {
      case "all-content":
        return selectedContentType === "all"
          ? "All Liveboards and Answers"
          : selectedContentType === "answer"
          ? "Answers Only"
          : "Liveboards Only";
      case "favorites":
        return selectedContentType === "all"
          ? "Your Favorite Items"
          : selectedContentType === "answer"
          ? "Your Favorite Answers"
          : "Your Favorite Liveboards";
      case "my-reports":
        return selectedContentType === "all"
          ? "Your Content"
          : selectedContentType === "answer"
          ? "Your Answers"
          : "Your Liveboards";
      default:
        return subtitle;
    }
  };

  const getDynamicDescription = () => {
    switch (pageType) {
      case "all-content":
        return `Browse ${
          selectedContentType === "all"
            ? "all available content"
            : selectedContentType === "answer"
            ? "answers"
            : "liveboards"
        } in your ThoughtSpot instance. Use the filters to narrow down by content type.`;

      case "favorites":
        return `Quick access to your favorite ${
          selectedContentType === "all"
            ? "liveboards and answers"
            : selectedContentType === "answer"
            ? "answers"
            : "liveboards"
        }. Click on any item to open it directly.`;
      case "my-reports":
        return `Access and manage ${
          selectedContentType === "all"
            ? "all your content"
            : selectedContentType === "answer"
            ? "your answers"
            : "your liveboards"
        }. Organize, share, and maintain your content.`;
      default:
        return description;
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
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
        title={title}
        subtitle={getDynamicSubtitle()}
        description={getDynamicDescription()}
        emptyMessage={emptyMessage}
        onContentOpen={handleContentOpen}
        showDirectContent={false}
        {...fetchProp}
      />
    </div>
  );
}
