"use client";

import { useState, useEffect } from "react";
import ContentCard from "./ContentCard";
import EmbedModal from "./EmbedModal";
import ThoughtSpotEmbed from "./ThoughtSpotEmbed";
import { ThoughtSpotContent } from "../types/thoughtspot";

interface ContentGridProps {
  title: string;
  subtitle: string;
  description: string;
  emptyMessage: string;
  onContentOpen?: (content: ThoughtSpotContent) => void;
  fetchFavorites?: boolean;
  fetchUserContent?: boolean;
  favoritesConfig?: {
    contentType?: "Answer" | "Liveboard";
    namePattern?: string;
  };
  userContentConfig?: {
    contentType?: "Answer" | "Liveboard";
    namePattern?: string;
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
    };
  };
}

export default function ContentGrid({
  title,
  subtitle,
  description,
  emptyMessage,
  onContentOpen,
  fetchFavorites = false,
  fetchUserContent = false,
  favoritesConfig,
  userContentConfig,
  showDirectContent = false,
  onBackClick,
  customContent,
}: ContentGridProps) {
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
        } else if (fetchUserContent) {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            const userContent = await fetchUserContentWithStats(
              currentUser.name
            );
            liveboards = userContent.liveboards;
            answers = userContent.answers;
          }
        } else if (fetchFavorites) {
          const favoritesContent = await fetchFavoritesWithStats();
          liveboards = favoritesContent.liveboards;
          answers = favoritesContent.answers;
        } else {
          const allContent = await fetchAllThoughtSpotContentWithStats();
          liveboards = allContent.liveboards;
          answers = allContent.answers;
        }

        // Combine liveboards and answers, excluding models
        let allContent = [...liveboards, ...answers];

        // Apply favorites configuration filtering if provided
        if (fetchFavorites && favoritesConfig) {
          // Filter by content type if specified
          if (favoritesConfig.contentType) {
            const contentType = favoritesConfig.contentType.toLowerCase();
            allContent = allContent.filter((item) => {
              if (contentType === "answer") return item.type === "answer";
              if (contentType === "liveboard") return item.type === "liveboard";
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

        // Apply user content configuration filtering if provided
        if (fetchUserContent && userContentConfig) {
          // Filter by content type if specified
          if (userContentConfig.contentType) {
            const contentType = userContentConfig.contentType.toLowerCase();
            allContent = allContent.filter((item) => {
              if (contentType === "answer") return item.type === "answer";
              if (contentType === "liveboard") return item.type === "liveboard";
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
    favoritesConfig,
    userContentConfig,
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
      <div>
        <div style={{ marginBottom: "24px" }}>
          <button
            onClick={handleBackToGrid}
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
            ← Back to {title}
          </button>
        </div>
        <div
          style={{
            backgroundColor: "#f7fafc",
            padding: "24px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "600",
              marginBottom: "16px",
            }}
          >
            {selectedContent.name}
          </h2>
          {selectedContent.description && (
            <p
              style={{
                color: "#4a5568",
                lineHeight: "1.6",
                marginBottom: "24px",
              }}
            >
              {selectedContent.description}
            </p>
          )}
          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "16px",
              backgroundColor: "white",
              minHeight: "400px",
            }}
          >
            <ThoughtSpotEmbed
              content={selectedContent}
              width="100%"
              height="600px"
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
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        {title && (
          <h1
            style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "24px" }}
          >
            {title}
          </h1>
        )}

        <div
          style={{
            backgroundColor: "#f7fafc",
            padding: "24px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "600",
              marginBottom: "16px",
            }}
          >
            {subtitle}
          </h2>

          <p
            style={{
              color: "#4a5568",
              lineHeight: "1.6",
              marginBottom: "24px",
            }}
          >
            {description}
          </p>

          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ color: "#4a5568" }}>Loading content...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        {title && (
          <h1
            style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "24px" }}
          >
            {title}
          </h1>
        )}

        <div
          style={{
            backgroundColor: "#f7fafc",
            padding: "24px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "600",
              marginBottom: "16px",
            }}
          >
            {subtitle}
          </h2>

          <p
            style={{
              color: "#4a5568",
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
    <div>
      {title && (
        <h1
          style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "24px" }}
        >
          {title}
        </h1>
      )}

      <div
        style={{
          backgroundColor: "#f7fafc",
          padding: "24px",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "600",
            marginBottom: "16px",
          }}
        >
          {subtitle}
        </h2>

        <p
          style={{
            color: "#4a5568",
            lineHeight: "1.6",
            marginBottom: "24px",
          }}
        >
          {description}
        </p>

        {((fetchFavorites &&
          favoritesConfig &&
          (favoritesConfig.contentType || favoritesConfig.namePattern)) ||
          (fetchUserContent &&
            userContentConfig &&
            (userContentConfig.contentType ||
              userContentConfig.namePattern))) && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "#f0f9ff",
              border: "1px solid #0ea5e9",
              borderRadius: "6px",
              marginBottom: "24px",
              fontSize: "14px",
              color: "#0369a1",
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
          </div>
        )}

        {content.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "#4a5568", marginBottom: "16px" }}>
              {(fetchFavorites &&
                favoritesConfig &&
                (favoritesConfig.contentType || favoritesConfig.namePattern)) ||
              (fetchUserContent &&
                userContentConfig &&
                (userContentConfig.contentType ||
                  userContentConfig.namePattern))
                ? "No items match your current filters. Try adjusting the content type or name pattern in settings."
                : emptyMessage}
            </p>
            <button
              style={{
                padding: "12px 24px",
                backgroundColor: "#38a169",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Browse All Items
            </button>
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
