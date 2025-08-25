"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useAppContext } from "../Layout";
import { ThoughtSpotEmbedConfig } from "../../types/thoughtspot";

interface SpotterPageProps {
  spotterModelId?: string;
  spotterSearchQuery?: string;
}

export default function SpotterPage({
  spotterModelId: propSpotterModelId,
  spotterSearchQuery: propSpotterSearchQuery,
}: SpotterPageProps = {}) {
  const [iframeError, setIframeError] = useState<string | null>(null);
  const embedRef = useRef<HTMLDivElement>(null);
  const embedInstanceRef = useRef<{ destroy?: () => void } | null>(null);

  // Get context
  const context = useAppContext();

  // Try to get configuration from context if not provided as props
  let contextSpotterModelId: string | undefined;
  let contextSpotterSearchQuery: string | undefined;
  let contextEmbedFlags: Record<string, unknown> | undefined;

  try {
    const spotterMenu = context.standardMenus.find(
      (m: {
        id: string;
        spotterModelId?: string;
        spotterSearchQuery?: string;
      }) => m.id === "spotter"
    );
    contextSpotterModelId = spotterMenu?.spotterModelId;
    contextSpotterSearchQuery = spotterMenu?.spotterSearchQuery;
    contextEmbedFlags = context.stylingConfig.embedFlags?.spotterEmbed;
  } catch {
    // Context not available, use props or defaults
  }

  // Use props first, then context, then undefined
  const finalSpotterModelId = propSpotterModelId || contextSpotterModelId;
  const finalSpotterSearchQuery =
    propSpotterSearchQuery || contextSpotterSearchQuery;

  // Memoize finalEmbedFlags to prevent re-renders
  const finalEmbedFlags = useMemo(() => {
    return contextEmbedFlags || {};
  }, [contextEmbedFlags]);

  // Handle ThoughtSpot embed
  useEffect(() => {
    if (!finalSpotterModelId) return;

    let embedInstance: { destroy?: () => void } | null = null;

    const initEmbed = async () => {
      try {
        setIframeError(null);

        // Dynamically import ThoughtSpot SDK to avoid SSR issues
        const { SpotterEmbed } = await import("@thoughtspot/visual-embed-sdk");

        if (embedRef.current) {
          // Get hidden actions for current user
          const currentUser = context.userConfig.users.find(
            (u) => u.id === context.userConfig.currentUserId
          );
          const hiddenActionsStrings = currentUser?.access.hiddenActions
            ?.enabled
            ? currentUser.access.hiddenActions.actions
            : [];

          const embedConfig: ThoughtSpotEmbedConfig = {
            worksheetId: finalSpotterModelId,
            frameParams: {
              width: "100%",
              height: "100%",
            },
            ...finalEmbedFlags,
            ...(hiddenActionsStrings.length > 0 && {
              hiddenActions: hiddenActionsStrings,
            }),
          };

          // Only add searchOptions if searchQuery is provided
          if (finalSpotterSearchQuery && finalSpotterSearchQuery.trim()) {
            embedConfig.searchOptions = {
              searchQuery: finalSpotterSearchQuery.trim(),
            };
          }

          if (embedConfig.worksheetId) {
            // Convert hidden actions strings to Action enums for the SpotterEmbed
            const spotterConfig = {
              ...embedConfig,
              worksheetId: embedConfig.worksheetId as string,
            };

            // Remove hiddenActions from the config as we'll handle it separately
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { hiddenActions, ...configWithoutHiddenActions } =
              spotterConfig;

            embedInstance = new SpotterEmbed(
              embedRef.current,
              configWithoutHiddenActions
            );
          }
          embedInstanceRef.current = embedInstance;
          await (embedInstance as { render: () => Promise<void> }).render();
        }
      } catch (error) {
        console.error("Failed to initialize ThoughtSpot Spotter embed:", error);
        setIframeError("Failed to load Spotter content");
      }
    };

    initEmbed();

    // Cleanup function
    return () => {
      if (
        embedInstanceRef.current &&
        typeof embedInstanceRef.current.destroy === "function"
      ) {
        embedInstanceRef.current.destroy();
      }
    };
  }, [
    finalSpotterModelId,
    finalSpotterSearchQuery,
    finalEmbedFlags,
    context.userConfig.currentUserId,
    context.userConfig.users,
  ]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {!finalSpotterModelId ? (
        <div
          style={{
            backgroundColor: "#f7fafc",
            padding: "40px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            textAlign: "center",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <h3
            style={{
              fontSize: "20px",
              fontWeight: "600",
              marginBottom: "16px",
              color: "#2d3748",
            }}
          >
            🔍 Spotter Configuration Required
          </h3>
          <p
            style={{
              color: "#4a5568",
              fontSize: "16px",
              marginBottom: "20px",
            }}
          >
            Please configure a Spotter model in the settings to start exploring
            your data.
          </p>
          <button
            onClick={() => {
              if (context?.openSettingsWithTab) {
                context.openSettingsWithTab("configuration", "spotter");
              } else {
                console.error("Settings context not available");
              }
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              backgroundColor: "#3182ce",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              cursor: "pointer",
              fontWeight: "500",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#2c5aa0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#3182ce";
            }}
          >
            <span>⚙️</span>
            <span>Configure Spotter Settings</span>
          </button>
        </div>
      ) : (
        <div
          style={{ height: "100%", display: "flex", flexDirection: "column" }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "12px",
              padding: "0 0 12px 0",
            }}
          >
            AI Analyst
            {finalSpotterSearchQuery && (
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "400",
                  color: "#6b7280",
                  marginLeft: "12px",
                }}
              >
                - Starting with: &quot;{finalSpotterSearchQuery}&quot;
              </span>
            )}
          </h3>

          {iframeError ? (
            <div
              style={{
                padding: "20px",
                backgroundColor: "#fed7d7",
                border: "1px solid #feb2b2",
                borderRadius: "8px",
                color: "#c53030",
              }}
            >
              <h4 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
                ⚠️ Spotter Error
              </h4>
              <p style={{ margin: 0, fontSize: "14px" }}>{iframeError}</p>
            </div>
          ) : (
            <div
              key={`spotter-embed-${JSON.stringify(
                context.stylingConfig.embeddedContent
              )}`}
              ref={embedRef}
              style={{
                width: "100%",
                flex: 1,
                minHeight: "400px",
                overflow: "hidden",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
