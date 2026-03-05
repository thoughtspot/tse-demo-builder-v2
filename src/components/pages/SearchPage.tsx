"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAppContext } from "../Layout";
import {
  ThoughtSpotSearchEmbedConfig,
  VizPointDoubleClickEvent,
  CustomActionTarget,
  CustomActionPosition,
} from "../../types/thoughtspot";
import { TabularData, VizPointClickData } from "tse-data-classes";
import DoubleClickModal from "../DoubleClickModal";
import {
  executeCustomActionHandler,
  CustomActionPayload,
  getPrebuiltHandler,
} from "../../services/customActionHandlers";
import { getStandardActionDefinitions } from "../StandardActionsEditor";

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

  // Handle custom action events (both custom and standard actions)
  const handleCustomAction = useCallback(
    (payload: unknown) => {
      const customActions = context.stylingConfig.customActions || [];
      const standardActions = context.stylingConfig.standardActions || [];

      // Get the action ID from the payload
      const actionPayload = payload as CustomActionPayload;
      const actionId = actionPayload.id || actionPayload.data?.id;

      if (!actionId) {
        console.warn(
          "[SearchPage] Custom action triggered without ID:",
          payload
        );
        return;
      }

      // First check if this is a standard action
      const standardActionConfig = standardActions.find(
        (action) => action.standardActionId === actionId && action.enabled
      );

      if (standardActionConfig) {
        // Find the standard action definition to get the handler ID
        const definition = getStandardActionDefinitions().find(
          (d) => d.id === standardActionConfig.standardActionId
        );

        if (definition) {
          console.log(
            "[SearchPage] Executing standard action:",
            actionId,
            standardActionConfig
          );

          // Get the handler and execute it with the configured params
          const handler = getPrebuiltHandler(definition.handlerId);
          if (handler) {
            // Merge default params with configured params
            const params = {
              ...definition.defaultParams,
              ...standardActionConfig.params,
            };

            // Enhance the payload with the current content context
            const enhancedPayload = {
              ...actionPayload,
              embedContext: {
                contentType: "search",
                thoughtSpotUrl: context.appConfig.thoughtspotUrl,
              },
              thoughtSpotUrl: context.appConfig.thoughtspotUrl,
            };

            // Wrap in Promise.resolve to handle both sync and async handlers
            Promise.resolve(
              handler(
                enhancedPayload as CustomActionPayload,
                params,
                embedInstanceRef.current
              )
            ).catch((error: unknown) => {
              console.error(
                `[SearchPage] Error executing standard action handler for ${actionId}:`,
                error
              );
            });
            return;
          } else {
            console.error(
              `[SearchPage] Handler not found for standard action: ${definition.handlerId}`
            );
          }
        }
        return;
      }

      // Find the matching custom action configuration
      const actionConfig = customActions.find(
        (action) => action.id === actionId && action.enabled
      );

      if (!actionConfig) {
        console.log(
          `[SearchPage] No enabled custom action found for ID: ${actionId}`
        );
        return;
      }

      console.log(
        "[SearchPage] Executing custom action:",
        actionId,
        actionConfig
      );

      // Execute the handler
      executeCustomActionHandler(
        actionConfig.handler,
        actionPayload,
        embedInstanceRef.current
      ).catch((error) => {
        console.error(
          `[SearchPage] Error executing custom action handler for ${actionId}:`,
          error
        );
      });
    },
    [
      context.stylingConfig.customActions,
      context.stylingConfig.standardActions,
      context.appConfig.thoughtspotUrl,
    ]
  );

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
        const { SearchEmbed, Action, EmbedEvent } = await import(
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

          // Build custom actions for the SDK
          const configuredCustomActions =
            context.stylingConfig.customActions || [];
          const configuredStandardActions =
            context.stylingConfig.standardActions || [];

          // Get standard action definitions
          const standardActionDefinitions = getStandardActionDefinitions();

          // Build SDK actions from standard actions (filter for ANSWER target)
          const sdkStandardActions = configuredStandardActions
            .filter((action) => {
              if (!action.enabled) return false;
              // Include actions targeting ANSWER (for SearchEmbed)
              return action.target === CustomActionTarget.ANSWER;
            })
            .map((action) => {
              const definition = standardActionDefinitions.find(
                (d) => d.id === action.standardActionId
              );

              const sdkAction: Record<string, unknown> = {
                name: definition?.name || action.standardActionId,
                id: action.standardActionId,
                position: action.position || CustomActionPosition.MENU,
                target: action.target || CustomActionTarget.ANSWER,
              };

              if (action.metadataIds) {
                sdkAction.metadataIds = action.metadataIds;
              }

              return sdkAction;
            });

          // Filter and transform custom actions for the SDK (filter for ANSWER target)
          const sdkCustomActions = configuredCustomActions
            .filter((action) => {
              if (!action.enabled) return false;
              // Include actions targeting ANSWER (for SearchEmbed)
              return action.target === CustomActionTarget.ANSWER;
            })
            .map((action) => {
              const sdkAction: Record<string, unknown> = {
                name: action.name,
                id: action.id,
                position: action.position,
                target: action.target,
              };

              if (action.metadataIds) {
                sdkAction.metadataIds = action.metadataIds;
              }
              if (action.dataModelIds) {
                sdkAction.dataModelIds = {
                  modelIds: action.dataModelIds.modelIds,
                  modelColumnNames: action.dataModelIds.columnNames,
                };
              }
              if (action.orgIds && action.orgIds.length > 0) {
                sdkAction.orgIds = action.orgIds;
              }
              if (action.groupIds && action.groupIds.length > 0) {
                sdkAction.groupIds = action.groupIds;
              }

              return sdkAction;
            });

          // Combine standard and custom actions
          const allSdkActions = [...sdkStandardActions, ...sdkCustomActions];

          console.log(
            "[SearchPage] Actions for SDK (standard + custom):",
            allSdkActions
          );

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
            ...(allSdkActions.length > 0 && { customActions: allSdkActions }),
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

          // Register double-click event handler if enabled
          const doubleClickConfig =
            context.stylingConfig.doubleClickHandling;
          if (doubleClickConfig?.enabled) {
            (embedInstance as any).on( // eslint-disable-line @typescript-eslint/no-explicit-any
              EmbedEvent.VizPointDoubleClick,
              handleDoubleClickEvent
            );
          }

          // Add custom action event listener if there are any actions
          if (allSdkActions.length > 0) {
            (
              embedInstance as unknown as {
                on: (event: string, handler: (payload: unknown) => void) => void;
              }
            ).on(EmbedEvent.CustomAction, handleCustomAction);
            console.log(
              "[SearchPage] Custom action event listener registered for",
              allSdkActions.length,
              "actions"
            );
          }

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
    context.stylingConfig.doubleClickHandling,
    context.stylingConfig.customActions,
    context.stylingConfig.standardActions,
    context.userConfig.currentUserId,
    context.userConfig.users,
    handleDoubleClickEvent,
    handleCustomAction,
    finalEmbedFlags,
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
