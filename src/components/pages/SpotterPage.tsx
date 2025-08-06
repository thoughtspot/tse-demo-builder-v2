"use client";

import { useState, useEffect, useRef } from "react";
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
  } catch (error) {
    // Context not available, use props or defaults
  }

  // Use props first, then context, then undefined
  const finalSpotterModelId = propSpotterModelId || contextSpotterModelId;
  const finalSpotterSearchQuery =
    propSpotterSearchQuery || contextSpotterSearchQuery;
  const finalEmbedFlags = contextEmbedFlags || {};

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
          const hiddenActions = currentUser?.access.hiddenActions?.enabled
            ? (currentUser.access.hiddenActions.actions as any[]) // eslint-disable-line @typescript-eslint/no-explicit-any
            : [];

          const embedConfig: ThoughtSpotEmbedConfig = {
            worksheetId: finalSpotterModelId,
            frameParams: {
              width: "100%",
              height: "400px",
            },
            ...finalEmbedFlags,
            ...(hiddenActions.length > 0 && { hiddenActions }),
          };

          // Only add searchOptions if searchQuery is provided
          if (finalSpotterSearchQuery && finalSpotterSearchQuery.trim()) {
            embedConfig.searchOptions = {
              searchQuery: finalSpotterSearchQuery.trim(),
            };
          }

          if (embedConfig.worksheetId) {
            embedInstance = new SpotterEmbed(
              embedRef.current,
              embedConfig as any
            ); // eslint-disable-line @typescript-eslint/no-explicit-any
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
  }, [finalSpotterModelId, finalSpotterSearchQuery]);

  return (
    <div>
      {!finalSpotterModelId ? (
        <div
          style={{
            backgroundColor: "#f7fafc",
            padding: "40px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            textAlign: "center",
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
          style={{
            backgroundColor: "white",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "12px",
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
                height: "400px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
