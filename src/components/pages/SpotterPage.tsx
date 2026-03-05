"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAppContext } from "../Layout";
import {
  ThoughtSpotEmbedConfig,
  VizPointDoubleClickEvent,
} from "../../types/thoughtspot";
import { TabularData, VizPointClickData } from "tse-data-classes";
import DoubleClickModal from "../DoubleClickModal";

interface SpotterPageProps {
  spotterModelId?: string;
  spotterSearchQuery?: string;
}

export default function SpotterPage({
  spotterModelId: propSpotterModelId,
  spotterSearchQuery: propSpotterSearchQuery,
}: SpotterPageProps = {}) {
  const [iframeError, setIframeError] = useState<string | null>(null);
  const [showDoubleClickModal, setShowDoubleClickModal] = useState(false);
  const [doubleClickEventData, setDoubleClickEventData] =
    useState<VizPointDoubleClickEvent | null>(null);
  const [vizPointClickData, setVizPointClickData] =
    useState<VizPointClickData | null>(null);
  const embedRef = useRef<HTMLDivElement>(null);
  const embedInstanceRef = useRef<{ destroy?: () => void } | null>(null);

  // Get context
  const context = useAppContext();

  const handleDoubleClickEvent = useCallback(
    (event: unknown) => {
      const doubleClickConfig = context.stylingConfig.doubleClickHandling;
      if (!doubleClickConfig?.enabled) return;

      const vizPointClick = TabularData.createFromJSON(
        event
      ) as VizPointClickData;

      setDoubleClickEventData(event as VizPointDoubleClickEvent);
      setVizPointClickData(vizPointClick);

      let modalElement: HTMLElement | null = null;
      if (
        doubleClickConfig.showDefaultModal ||
        doubleClickConfig.customJavaScript?.trim()
      ) {
        modalElement = document.createElement("div");
        modalElement.id = "double-click-modal";
        modalElement.style.cssText = `
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
        `;
        document.body.appendChild(modalElement);
      }

      if (
        doubleClickConfig.customJavaScript &&
        doubleClickConfig.customJavaScript.trim()
      ) {
        try {
          const customFunction = new Function(
            "tabularData",
            "modal",
            "embedInstance",
            doubleClickConfig.customJavaScript
          );
          customFunction(
            vizPointClick,
            modalElement,
            embedInstanceRef.current
          );
        } catch (error) {
          console.error(
            "Error executing custom double-click JavaScript:",
            error
          );
          if (doubleClickConfig.showDefaultModal) {
            setShowDoubleClickModal(true);
          }
        }
      } else if (doubleClickConfig.showDefaultModal) {
        setShowDoubleClickModal(true);
      }

      if (modalElement && !doubleClickConfig.customJavaScript?.trim()) {
        setTimeout(() => {
          if (modalElement && modalElement.parentNode) {
            modalElement.parentNode.removeChild(modalElement);
          }
        }, 100);
      }
    },
    [context.stylingConfig.doubleClickHandling]
  );

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
        const { SpotterEmbed, Action, EmbedEvent } = await import(
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
          const iconSpriteUrl =
            context.stylingConfig.embeddedContent.iconSpriteUrl;
          const strings = context.stylingConfig.embeddedContent.strings;
          const stringIDs = context.stylingConfig.embeddedContent.stringIDs;

          // Filter out visibleActions from embed flags to prevent conflicts with hiddenActions
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { visibleActions, ...filteredEmbedFlags } = finalEmbedFlags;

          const embedConfig: ThoughtSpotEmbedConfig = {
            locale: userLocale,
            worksheetId: finalSpotterModelId,
            frameParams: {
              width: "100%",
              height: "100%",
            },
            ...filteredEmbedFlags,
            ...(hiddenActions.length > 0 && {
              hiddenActions: hiddenActions,
            }),
            customizations: {
              iconSpriteUrl: iconSpriteUrl || undefined,
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
              hiddenActions: hiddenActions,
            };

            embedInstance = new SpotterEmbed(embedRef.current, spotterConfig);
          }
          embedInstanceRef.current = embedInstance;

          // Register double-click event handler if enabled
          if (embedInstance) {
            const doubleClickConfig =
              context.stylingConfig.doubleClickHandling;
            if (doubleClickConfig?.enabled) {
              (embedInstance as any).on( // eslint-disable-line @typescript-eslint/no-explicit-any
                EmbedEvent.VizPointDoubleClick,
                handleDoubleClickEvent
              );
            }
          }

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
    context.appConfig.thoughtspotUrl, // Add cluster URL to dependencies
    context.lastClusterChangeTime, // Add cluster change timestamp to dependencies
    context.configVersion, // Add config version to force re-initialization on config changes
    finalSpotterModelId,
    finalSpotterSearchQuery,
    finalEmbedFlags,
    context.stylingConfig.embeddedContent.customCSS,
    context.stylingConfig.embeddedContent.cssUrl,
    context.stylingConfig.embeddedContent.iconSpriteUrl,
    context.stylingConfig.embeddedContent.strings,
    context.stylingConfig.embeddedContent.stringIDs,
    context.stylingConfig.doubleClickHandling,
    context.userConfig.currentUserId,
    context.userConfig.users,
    handleDoubleClickEvent,
  ]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <DoubleClickModal
        isOpen={showDoubleClickModal}
        onClose={() => setShowDoubleClickModal(false)}
        eventData={doubleClickEventData}
        vizPointClickData={vizPointClickData}
        title={
          context.stylingConfig.doubleClickHandling?.modalTitle ||
          "Double-Click Event Data"
        }
      />
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
              key={`spotter-embed-${context.appConfig.thoughtspotUrl}-${
                context.lastClusterChangeTime
              }-${JSON.stringify(context.stylingConfig.embeddedContent)}`}
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
