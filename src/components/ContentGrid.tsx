"use client";

import { useState, useEffect } from "react";
import ContentCard from "./ContentCard";
import EmbedModal from "./EmbedModal";
import ThoughtSpotEmbed from "./ThoughtSpotEmbed";
import { ThoughtSpotContent } from "../types/thoughtspot";
import { useAppContext } from "./Layout";

interface ContentGridProps {
  title: string;
  subtitle: string;
  description: string;
  emptyMessage: string;
  onContentOpen?: (content: ThoughtSpotContent) => void;
  fetchFavorites?: boolean;
  fetchUserContent?: boolean;
  fetchAllContent?: boolean;
  favoritesConfig?: {
    contentType?: "answer" | "liveboard";
    namePattern?: string;
    tagFilter?: string;
  };
  userContentConfig?: {
    contentType?: "answer" | "liveboard";
    namePattern?: string;
    tagFilter?: string;
  };
  allContentConfig?: {
    contentType?: "answer" | "liveboard";
    excludeSystemContent?: boolean;
  };
  showDirectContent?: boolean;
  onBackClick?: () => void;
  customContent?: {
    contentSelection: {
      type: "specific" | "tag";
      specificContent?: {
        liveboards: string[];
        answers: string[];
      };
      tagIdentifiers?: string[];
      contentType?: "answer" | "liveboard";
    };
  };
  // For tab-based filtering in custom menus
  tabContentType?: "answer" | "liveboard";
}

export default function ContentGrid({
  title,
  subtitle,
  description,
  emptyMessage,
  onContentOpen,
  fetchFavorites = false,
  fetchUserContent = false,
  fetchAllContent = false,
  favoritesConfig,
  userContentConfig,
  allContentConfig,
  showDirectContent = false,
  onBackClick,
  customContent,
  tabContentType,
}: ContentGridProps) {
  const context = useAppContext();
  const [content, setContent] = useState<ThoughtSpotContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] =
    useState<ThoughtSpotContent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showContentDirectly, setShowContentDirectly] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          fetchAllThoughtSpotContentWithStats,
          fetchFavoritesWithStats,
          fetchUserContentWithStats,
          fetchContentByTags,
          fetchContentByIds,
          getCurrentUser,
        } = await import("../services/thoughtspotApi");

        let liveboards: ThoughtSpotContent[] = [];
        let answers: ThoughtSpotContent[] = [];

        if (customContent) {
          // Handle custom content based on selection type
          if (
            customContent.contentSelection.type === "tag" &&
            customContent.contentSelection.tagIdentifiers &&
            customContent.contentSelection.tagIdentifiers.length > 0
          ) {
            const tagContent = await fetchContentByTags(
              customContent.contentSelection.tagIdentifiers
            );
            liveboards = tagContent.liveboards;
            answers = tagContent.answers;
          } else if (
            customContent.contentSelection.type === "specific" &&
            customContent.contentSelection.specificContent
          ) {
            // For specific content, fetch only the selected content by IDs
            const specificContent = await fetchContentByIds(
              customContent.contentSelection.specificContent.liveboards,
              customContent.contentSelection.specificContent.answers
            );
            liveboards = specificContent.liveboards;
            answers = specificContent.answers;
          }
        } else if (fetchAllContent) {
          const allContent = await fetchAllThoughtSpotContentWithStats();
          liveboards = allContent.liveboards;
          answers = allContent.answers;
        } else if (fetchUserContent) {
          // Check if we need to filter by tags
          if (
            userContentConfig?.tagFilter &&
            userContentConfig.tagFilter.trim()
          ) {
            const tagFilter = userContentConfig.tagFilter.trim();
            const tagContent = await fetchContentByTags([tagFilter]);
            liveboards = tagContent.liveboards;
            answers = tagContent.answers;
          } else {
            const currentUser = await getCurrentUser();
            if (currentUser) {
              const userContent = await fetchUserContentWithStats(
                currentUser.name
              );
              liveboards = userContent.liveboards;
              answers = userContent.answers;
            }
          }
        } else if (fetchFavorites) {
          // Check if we need to filter by tags
          if (favoritesConfig?.tagFilter && favoritesConfig.tagFilter.trim()) {
            const tagFilter = favoritesConfig.tagFilter.trim();
            const tagContent = await fetchContentByTags([tagFilter]);
            liveboards = tagContent.liveboards;
            answers = tagContent.answers;
          } else {
            const favoritesContent = await fetchFavoritesWithStats();
            liveboards = favoritesContent.liveboards;
            answers = favoritesContent.answers;
          }
        } else {
          const allContent = await fetchAllThoughtSpotContentWithStats();
          liveboards = allContent.liveboards;
          answers = allContent.answers;
        }

        // Combine liveboards and answers, excluding models
        let allContent = [...liveboards, ...answers];

        // Apply custom content filtering if provided
        if (customContent && customContent.contentSelection.contentType) {
          allContent = allContent.filter((item) => {
            if (customContent.contentSelection.contentType === "answer")
              return item.type === "answer";
            if (customContent.contentSelection.contentType === "liveboard")
              return item.type === "liveboard";
            return true;
          });
        }

        // Apply tab-based filtering if provided (for custom menus)
        if (tabContentType) {
          allContent = allContent.filter((item) => {
            if (tabContentType === "answer") return item.type === "answer";
            if (tabContentType === "liveboard")
              return item.type === "liveboard";
            return true;
          });
        }

        // Apply favorites configuration filtering if provided
        if (fetchFavorites && favoritesConfig) {
          // Filter by content type if specified
          if (favoritesConfig.contentType) {
            allContent = allContent.filter((item) => {
              if (favoritesConfig.contentType === "answer")
                return item.type === "answer";
              if (favoritesConfig.contentType === "liveboard")
                return item.type === "liveboard";
              return true;
            });
          }

          // Filter by name pattern if specified
          if (
            favoritesConfig.namePattern &&
            favoritesConfig.namePattern.trim()
          ) {
            const pattern = favoritesConfig.namePattern.toLowerCase().trim();
            allContent = allContent.filter((item) =>
              item.name.toLowerCase().includes(pattern)
            );
          }
        }

        // Apply all content configuration filtering if provided
        if (fetchAllContent && allContentConfig) {
          console.log("All content config received:", allContentConfig);
          console.log(
            "Exclude system content setting:",
            allContentConfig.excludeSystemContent
          );
          // Filter by content type if specified
          if (allContentConfig.contentType) {
            console.log(
              "Filtering by content type:",
              allContentConfig.contentType
            );
            console.log(
              "Total items before content type filtering:",
              allContent.length
            );
            console.log(
              "Sample items before filtering:",
              allContent.slice(0, 3).map((item) => ({
                id: item.id,
                name: item.name,
                type: item.type,
              }))
            );

            allContent = allContent.filter((item) => {
              if (allContentConfig.contentType === "answer")
                return item.type === "answer";
              if (allContentConfig.contentType === "liveboard")
                return item.type === "liveboard";
              return true;
            });

            console.log(
              "Total items after content type filtering:",
              allContent.length
            );
            console.log(
              "Sample items after filtering:",
              allContent.slice(0, 3).map((item) => ({
                id: item.id,
                name: item.name,
                type: item.type,
              }))
            );
          }

          // Filter out system content if specified
          if (allContentConfig.excludeSystemContent) {
            console.log(
              "Filtering system content. Total items before filtering:",
              allContent.length
            );
            console.log(
              "Sample items with authorName:",
              allContent.slice(0, 3).map((item) => ({
                id: item.id,
                name: item.name,
                type: item.type,
                authorName: item.authorName,
                hasAuthorName: "authorName" in item,
              }))
            );

            allContent = allContent.filter((item) => {
              // Check if the item has authorName and exclude if it's "system"
              if (item.authorName === "system") {
                console.log("Excluding system content:", item.name, item.id);
                return false;
              }
              return true;
            });

            console.log(
              "Items after filtering system content:",
              allContent.length
            );
          }
        }

        // Apply user content configuration filtering if provided
        if (fetchUserContent && userContentConfig) {
          // Filter by content type if specified
          if (userContentConfig.contentType) {
            allContent = allContent.filter((item) => {
              if (userContentConfig.contentType === "answer")
                return item.type === "answer";
              if (userContentConfig.contentType === "liveboard")
                return item.type === "liveboard";
              return true;
            });
          }

          // Filter by name pattern if specified
          if (
            userContentConfig.namePattern &&
            userContentConfig.namePattern.trim()
          ) {
            const pattern = userContentConfig.namePattern.toLowerCase().trim();
            allContent = allContent.filter((item) =>
              item.name.toLowerCase().includes(pattern)
            );
          }
        }

        setContent(allContent);
      } catch (error) {
        console.error("Failed to fetch content:", error);
        setError("Failed to load content. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [
    fetchFavorites,
    fetchUserContent,
    fetchAllContent,
    favoritesConfig,
    userContentConfig,
    allContentConfig,
    customContent,
  ]);

  const handleContentOpen = (content: ThoughtSpotContent) => {
    if (showDirectContent) {
      setSelectedContent(content);
      setShowContentDirectly(true);
    } else {
      setSelectedContent(content);
      setIsModalOpen(true);
    }

    if (onContentOpen) {
      onContentOpen(content);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedContent(null);
  };

  const handleBackToGrid = () => {
    setShowContentDirectly(false);
    setSelectedContent(null);
  };

  // If showing content directly, render the content view
  if (showDirectContent && showContentDirectly && selectedContent) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <button
            onClick={handleBackToGrid}
            style={{
              padding: "8px 16px",
              backgroundColor:
                context.stylingConfig.application.buttons?.secondary
                  ?.backgroundColor || "#6b7280",
              color:
                context.stylingConfig.application.buttons?.secondary
                  ?.foregroundColor || "white",
              border: `1px solid ${
                context.stylingConfig.application.buttons?.secondary
                  ?.borderColor || "#6b7280"
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
        {!context.stylingConfig.embedDisplay?.hideTitle ||
        (selectedContent.description &&
          !context.stylingConfig.embedDisplay?.hideDescription) ? (
          <div
            style={{
              backgroundColor:
                context.stylingConfig.application.backgrounds?.cardBackground ||
                "#f7fafc",
              padding: "24px",
              borderRadius: "8px",
              border: `1px solid ${
                context.stylingConfig.application.backgrounds?.borderColor ||
                "#e2e8f0"
              }`,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "auto",
              minHeight: 0,
            }}
          >
            {!context.stylingConfig.embedDisplay?.hideTitle && (
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
              !context.stylingConfig.embedDisplay?.hideDescription && (
                <p
                  style={{
                    color: "#4a5568",
                    lineHeight: "1.6",
                    marginBottom: context.stylingConfig.embedDisplay?.hideTitle
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

  if (loading) {
    return (
      <div>
        <div
          style={{
            backgroundColor:
              context.stylingConfig.application.backgrounds?.cardBackground ||
              "#f7fafc",
            padding: "24px",
            borderRadius: "8px",
            border: `1px solid ${
              context.stylingConfig.application.backgrounds?.borderColor ||
              "#e2e8f0"
            }`,
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "600",
              marginBottom: "16px",
              color:
                context.stylingConfig.application.typography?.primaryColor ||
                "#1f2937",
            }}
          >
            {subtitle}
          </h2>

          <p
            style={{
              color:
                context.stylingConfig.application.typography?.secondaryColor ||
                "#4a5568",
              lineHeight: "1.6",
              marginBottom: "24px",
            }}
          >
            {description}
          </p>

          <div style={{ textAlign: "center", padding: "40px" }}>
            <div
              style={{
                color:
                  context.stylingConfig.application.typography
                    ?.secondaryColor || "#4a5568",
              }}
            >
              Loading content...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div
          style={{
            backgroundColor:
              context.stylingConfig.application.backgrounds?.cardBackground ||
              "#f7fafc",
            padding: "24px",
            borderRadius: "8px",
            border: `1px solid ${
              context.stylingConfig.application.backgrounds?.borderColor ||
              "#e2e8f0"
            }`,
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "600",
              marginBottom: "16px",
              color:
                context.stylingConfig.application.typography?.primaryColor ||
                "#1f2937",
            }}
          >
            {subtitle}
          </h2>

          <p
            style={{
              color:
                context.stylingConfig.application.typography?.secondaryColor ||
                "#4a5568",
              lineHeight: "1.6",
              marginBottom: "24px",
            }}
          >
            {description}
          </p>

          <div
            style={{
              padding: "20px",
              backgroundColor: "#fed7d7",
              border: "1px solid #feb2b2",
              borderRadius: "8px",
              color: "#c53030",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0" }}>⚠️ Error</h3>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <div
        style={{
          backgroundColor:
            context.stylingConfig.application.backgrounds?.cardBackground ||
            "#f7fafc",
          padding: "24px",
          borderRadius: "8px",
          border: `1px solid ${
            context.stylingConfig.application.backgrounds?.borderColor ||
            "#e2e8f0"
          }`,
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "600",
            marginBottom: "16px",
            color:
              context.stylingConfig.application.typography?.primaryColor ||
              "#1f2937",
          }}
        >
          {subtitle}
        </h2>

        <p
          style={{
            color:
              context.stylingConfig.application.typography?.secondaryColor ||
              "#4a5568",
            lineHeight: "1.6",
            marginBottom: "24px",
          }}
        >
          {description}
        </p>

        {((fetchFavorites &&
          favoritesConfig &&
          (favoritesConfig.contentType ||
            favoritesConfig.namePattern ||
            favoritesConfig.tagFilter)) ||
          (fetchUserContent &&
            userContentConfig &&
            (userContentConfig.contentType ||
              userContentConfig.namePattern))) && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor:
                context.stylingConfig.application.backgrounds?.cardBackground ||
                "#f0f9ff",
              border: `1px solid ${
                context.stylingConfig.application.backgrounds?.borderColor ||
                "#0ea5e9"
              }`,
              borderRadius: "6px",
              marginBottom: "24px",
              fontSize: "14px",
              color:
                context.stylingConfig.application.typography?.primaryColor ||
                "#0369a1",
            }}
          >
            <strong>Active Filters:</strong>
            {favoritesConfig?.contentType && (
              <span style={{ marginLeft: "8px" }}>
                Type: {favoritesConfig.contentType}
              </span>
            )}
            {userContentConfig?.contentType && (
              <span style={{ marginLeft: "8px" }}>
                Type: {userContentConfig.contentType}
              </span>
            )}
            {favoritesConfig?.namePattern && (
              <span style={{ marginLeft: "8px" }}>
                Name: &quot;{favoritesConfig.namePattern}&quot;
              </span>
            )}
            {userContentConfig?.namePattern && (
              <span style={{ marginLeft: "8px" }}>
                Name: &quot;{userContentConfig.namePattern}&quot;
              </span>
            )}
            {userContentConfig?.tagFilter && (
              <span style={{ marginLeft: "8px" }}>
                Tag: &quot;{userContentConfig.tagFilter}&quot;
              </span>
            )}
            {favoritesConfig?.tagFilter && (
              <span style={{ marginLeft: "8px" }}>
                Tag: &quot;{favoritesConfig.tagFilter}&quot;
              </span>
            )}
          </div>
        )}

        {content.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p
              style={{
                color:
                  context.stylingConfig.application.typography
                    ?.secondaryColor || "#4a5568",
                marginBottom: "16px",
              }}
            >
              {(fetchFavorites &&
                favoritesConfig &&
                (favoritesConfig.contentType ||
                  favoritesConfig.namePattern ||
                  favoritesConfig.tagFilter)) ||
              (fetchUserContent &&
                userContentConfig &&
                (userContentConfig.contentType ||
                  userContentConfig.namePattern ||
                  userContentConfig.tagFilter))
                ? "No items match your current filters. Try adjusting the content type, name pattern, or tag filter in settings."
                : emptyMessage}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "16px",
            }}
          >
            {content.map((item) => (
              <ContentCard
                key={item.id}
                content={item}
                onOpen={handleContentOpen}
              />
            ))}
          </div>
        )}
      </div>

      <EmbedModal
        content={selectedContent}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
}
