"use client";

import { useState, useEffect, useRef } from "react";
import { useAppContext } from "../Layout";
import { ThoughtSpotSearchEmbedConfig } from "../../types/thoughtspot";

interface SearchPageProps {
  searchDataSource?: string;
  searchTokenString?: string;
  runSearch?: boolean;
}

export default function SearchPage({
  searchDataSource: propSearchDataSource,
  searchTokenString: propSearchTokenString,
  runSearch: propRunSearch,
}: SearchPageProps = {}) {
  const [iframeError, setIframeError] = useState<string | null>(null);
  const [runSearch, setRunSearch] = useState<boolean>(propRunSearch || false);
  const embedRef = useRef<HTMLDivElement>(null);
  const embedInstanceRef = useRef<{ destroy?: () => void } | null>(null);

  // Get context
  const context = useAppContext();

  // Try to get configuration from context if not provided as props
  let contextSearchDataSource: string | undefined;
  let contextSearchTokenString: string | undefined;
  let contextRunSearch: boolean | undefined;
  let contextEmbedFlags: Record<string, unknown> | undefined;

  try {
    const searchMenu = context.standardMenus.find(
      (m: {
        id: string;
        searchDataSource?: string;
        searchTokenString?: string;
        runSearch?: boolean;
      }) => m.id === "search"
    );
    contextSearchDataSource = searchMenu?.searchDataSource;
    contextSearchTokenString = searchMenu?.searchTokenString;
    contextRunSearch = searchMenu?.runSearch;
    contextEmbedFlags = context.stylingConfig.embedFlags?.searchEmbed;
  } catch (error) {
    // Context not available, use props or defaults
  }

  // Use props first, then context, then undefined
  const finalSearchDataSource = propSearchDataSource || contextSearchDataSource;
  const finalSearchTokenString =
    propSearchTokenString || contextSearchTokenString;
  const finalRunSearch =
    propRunSearch !== undefined
      ? propRunSearch
      : contextRunSearch !== undefined
      ? contextRunSearch
      : runSearch;
  const finalEmbedFlags = contextEmbedFlags || {};

  // Handle ThoughtSpot embed
  useEffect(() => {
    if (!finalSearchDataSource) return;

    let embedInstance: { destroy?: () => void } | null = null;

    const initEmbed = async () => {
      try {
        setIframeError(null);

        // Dynamically import ThoughtSpot SDK to avoid SSR issues
        const { SearchEmbed, Action } = await import(
          "@thoughtspot/visual-embed-sdk"
        );

        if (embedRef.current) {
          // Get hidden actions for current user
          const currentUser = context.userConfig.users.find(
            (u) => u.id === context.userConfig.currentUserId
          );
          const hiddenActionsStrings = currentUser?.access.hiddenActions
            ?.enabled
            ? currentUser.access.hiddenActions.actions
            : [];

          // Convert string action values to Action enum values
          const hiddenActions = hiddenActionsStrings
            .map((actionString) => {
              // Find the Action enum value that matches the string
              const actionKey = Object.keys(Action).find(
                (key) => Action[key as keyof typeof Action] === actionString
              );
              return actionKey
                ? Action[actionKey as keyof typeof Action]
                : null;
            })
            .filter((action) => action !== null) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

          // Get current user's locale
          const userLocale = currentUser?.locale || "en";

          // Get custom CSS configuration from styling config
          const customCSS = context.stylingConfig.embeddedContent.customCSS;
          const cssUrl = context.stylingConfig.embeddedContent.cssUrl;
          const strings = context.stylingConfig.embeddedContent.strings;
          const stringIDs = context.stylingConfig.embeddedContent.stringIDs;

          // Filter out visibleActions from embed flags to prevent conflicts with hiddenActions
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { visibleActions, ...filteredEmbedFlags } = finalEmbedFlags;

          const embedConfig: ThoughtSpotSearchEmbedConfig = {
            frameParams: {},
            dataSource: finalSearchDataSource,
            dataPanelV2: true,
            collapseDataSources: !!(
              finalSearchTokenString && finalSearchTokenString.trim()
            ),
            locale: userLocale,
            ...filteredEmbedFlags,
            ...(hiddenActions.length > 0 && { hiddenActions }),
            customizations: {
              content: {
                strings: strings || {},
                stringIDs: stringIDs || {},
              },
              style: {
                customCSSUrl: cssUrl || undefined,
                customCSS: {
                  variables: customCSS.variables || {},
                  rules_UNSTABLE: customCSS.rules_UNSTABLE || {},
                },
              },
            },
          };

          // Only add searchOptions if searchTokenString is provided
          if (finalSearchTokenString && finalSearchTokenString.trim()) {
            embedConfig.searchOptions = {
              searchTokenString: finalSearchTokenString.trim(),
              executeSearch: finalRunSearch,
            };
          }

          embedInstance = new SearchEmbed(embedRef.current, embedConfig);
          embedInstanceRef.current = embedInstance;
          await (embedInstance as { render: () => Promise<void> }).render();
        }
      } catch (error) {
        console.error("Failed to initialize ThoughtSpot Search embed:", error);
        setIframeError("Failed to load Search content");
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
    context.appConfig.thoughtspotUrl, // Add cluster URL to dependencies
    context.lastClusterChangeTime, // Add cluster change timestamp to dependencies
    context.configVersion, // Add config version to force re-initialization on config changes
    finalSearchDataSource,
    finalSearchTokenString,
    finalRunSearch,
    context.stylingConfig.embeddedContent.customCSS,
    context.stylingConfig.embeddedContent.cssUrl,
    context.stylingConfig.embeddedContent.strings,
    context.stylingConfig.embeddedContent.stringIDs,
    context.userConfig.currentUserId,
    context.userConfig.users,
  ]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {!finalSearchDataSource ? (
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
            🔍 Search Configuration Required
          </h3>
          <p
            style={{
              color: "#4a5568",
              fontSize: "16px",
              marginBottom: "20px",
            }}
          >
            Please configure a search datasource in the settings to start
            searching your data.
          </p>
          <button
            onClick={() => {
              if (context?.openSettingsWithTab) {
                context.openSettingsWithTab("configuration", "search");
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
            <span>Configure Search Settings</span>
          </button>
        </div>
      ) : (
        <div
          style={{ height: "100%", display: "flex", flexDirection: "column" }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "16px",
              padding: "0 0 16px 0",
            }}
          >
            Search your data
            {finalSearchTokenString && (
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "400",
                  color: "#6b7280",
                  marginLeft: "12px",
                }}
              >
                - Starting with: &quot;{finalSearchTokenString}&quot;
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
                ⚠️ Search Error
              </h4>
              <p style={{ margin: 0, fontSize: "14px" }}>{iframeError}</p>
            </div>
          ) : (
            <div
              key={`search-embed-${context.appConfig.thoughtspotUrl}-${
                context.lastClusterChangeTime
              }-${JSON.stringify(context.stylingConfig.embeddedContent)}`}
              ref={embedRef}
              style={{
                width: "100%",
                flex: 1,
                minHeight: "600px",
                overflow: "hidden",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
