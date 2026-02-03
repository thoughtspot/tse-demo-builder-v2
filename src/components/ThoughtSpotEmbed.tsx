"use client";

import { useState, useRef, useEffect, useCallback } from "react";

import {
  ThoughtSpotContent,
  VizPointDoubleClickEvent,
  ThoughtSpotBaseEmbedConfig,
  CustomActionTarget,
  CustomActionPosition,
} from "../types/thoughtspot";
import { VizPointClickDataType, VizPointClickData } from "tse-data-classes";
import { useAppContext } from "./Layout";
import DoubleClickModal from "./DoubleClickModal";
import {
  executeCustomActionHandler,
  CustomActionPayload,
  getPrebuiltHandler,
} from "../services/customActionHandlers";
import { getStandardActionDefinitions } from "./StandardActionsEditor";

interface ThoughtSpotEmbedProps {
  content: ThoughtSpotContent;
  width?: string;
  height?: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

export default function ThoughtSpotEmbed({
  content,
  width = "100%",
  height = "600px",
  onLoad,
  onError,
}: ThoughtSpotEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDoubleClickModal, setShowDoubleClickModal] = useState(false);
  const [doubleClickEventData, setDoubleClickEventData] =
    useState<VizPointDoubleClickEvent | null>(null);
  const [vizPointClickData, setVizPointClickData] =
    useState<VizPointClickData | null>(null);
  const embedRef = useRef<HTMLDivElement>(null);
  const embedInstanceRef = useRef<{ destroy?: () => void } | null>(null);
  const context = useAppContext();

  const handleDoubleClickEvent = useCallback(
    (event: unknown) => {
      const doubleClickConfig = context.stylingConfig.doubleClickHandling;

      if (!doubleClickConfig?.enabled) return;

      // Create VizPointClickData instance from the event data
      const vizPointClick = VizPointClickData.createFromJSON(
        event as VizPointClickDataType
      );

      // Store the event data for potential modal display
      setDoubleClickEventData(event as VizPointDoubleClickEvent);
      setVizPointClickData(vizPointClick);

      // Create a modal element if showDefaultModal is true or custom JavaScript is provided
      let modalElement: HTMLElement | null = null;
      if (
        doubleClickConfig.showDefaultModal ||
        doubleClickConfig.customJavaScript?.trim()
      ) {
        modalElement = document.createElement("div");
        modalElement.id = "double-click-modal";
        modalElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      `;
        document.body.appendChild(modalElement);
      }

      // Execute custom JavaScript if provided
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
          customFunction(vizPointClick, modalElement, embedInstanceRef.current);
        } catch (error) {
          console.error(
            "Error executing custom double-click JavaScript:",
            error
          );
          // If custom JavaScript fails and showDefaultModal is true, show the default modal
          if (doubleClickConfig.showDefaultModal) {
            setShowDoubleClickModal(true);
          }
        }
      } else if (doubleClickConfig.showDefaultModal) {
        // If no custom JavaScript but showDefaultModal is true, show the default modal
        setShowDoubleClickModal(true);
      }

      // Clean up the modal element if it wasn't used by custom JavaScript
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
          "[ThoughtSpotEmbed] Custom action triggered without ID:",
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
            "[ThoughtSpotEmbed] Executing standard action:",
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
            // This ensures the handler has access to the liveboard/answer ID
            const enhancedPayload = {
              ...actionPayload,
              // Add the embed context so handlers know which content triggered the action
              embedContext: {
                contentId: content.id,
                contentType: content.type,
                contentName: content.name,
              },
              // Also add liveboardId directly for convenience
              ...(content.type === "liveboard" && { liveboardId: content.id }),
              ...(content.type === "answer" && { answerId: content.id }),
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
                `[ThoughtSpotEmbed] Error executing standard action handler for ${actionId}:`,
                error
              );
            });
            return;
          } else {
            console.error(
              `[ThoughtSpotEmbed] Handler not found for standard action: ${definition.handlerId}`
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
          `[ThoughtSpotEmbed] No enabled custom action found for ID: ${actionId}`
        );
        return;
      }

      console.log(
        "[ThoughtSpotEmbed] Executing custom action:",
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
          `[ThoughtSpotEmbed] Error executing custom action handler for ${actionId}:`,
          error
        );
      });
    },
    [
      context.stylingConfig.customActions,
      context.stylingConfig.standardActions,
      content.id,
      content.name,
      content.type,
    ]
  );

  useEffect(() => {
    let isMounted = true;

    const initEmbed = async () => {
      // Check if component is still mounted
      if (!isMounted) {
        console.log(
          "[ThoughtSpotEmbed] Component unmounted, skipping initialization"
        );
        return;
      }

      // Ensure the DOM element is available
      if (!embedRef.current) {
        console.warn(
          "[ThoughtSpotEmbed] embedRef.current is null, waiting for DOM..."
        );
        // Wait a bit more for the DOM to be ready
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (!embedRef.current || !isMounted) {
          if (isMounted) {
            setError("Failed to initialize: DOM element not available");
            setIsLoading(false);
          }
          return;
        }
      }

      try {
        // Check if component is still mounted
        if (!isMounted) {
          console.log(
            "[ThoughtSpotEmbed] Component unmounted during initialization, skipping"
          );
          return;
        }

        setIsLoading(true);
        setError(null);

        // Add a small delay to ensure ThoughtSpot SDK is properly initialized
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Check again after the delay
        if (!isMounted) {
          console.log(
            "[ThoughtSpotEmbed] Component unmounted after delay, skipping"
          );
          return;
        }

        const {
          LiveboardEmbed,
          SearchEmbed,
          SpotterEmbed,
          EmbedEvent,
          Action,
        } = await import("@thoughtspot/visual-embed-sdk");

        // Check if component is still mounted after SDK import
        if (!isMounted) {
          console.log(
            "[ThoughtSpotEmbed] Component unmounted after SDK import, skipping"
          );
          return;
        }

        console.log(
          "[ThoughtSpotEmbed] Initializing embed with cluster URL:",
          context.appConfig.thoughtspotUrl
        );
        console.log(
          "[ThoughtSpotEmbed] Content type:",
          content.type,
          "Content ID:",
          content.id
        );

        let embedInstance;

        // Get embed flags based on content type
        let embedFlags: Record<string, unknown> = {};
        if (content.type === "liveboard") {
          embedFlags = context.stylingConfig.embedFlags?.liveboardEmbed || {};
        } else if (content.type === "answer") {
          embedFlags = context.stylingConfig.embedFlags?.searchEmbed || {};
        } else if (content.type === "model") {
          embedFlags = context.stylingConfig.embedFlags?.spotterEmbed || {};
        }

        // Get current user
        const currentUser = context.userConfig.users.find(
          (u) => u.id === context.userConfig.currentUserId
        );

        // Get hidden actions for current user
        const hiddenActionsStrings = currentUser?.access.hiddenActions?.enabled
          ? currentUser.access.hiddenActions.actions
          : [];

        // Convert string action values to Action enum values
        const hiddenActions = hiddenActionsStrings
          .map((actionString) => {
            // Find the Action enum value that matches the string
            const actionKey = Object.keys(Action).find(
              (key) => Action[key as keyof typeof Action] === actionString
            );
            return actionKey ? Action[actionKey as keyof typeof Action] : null;
          })
          .filter((action) => action !== null) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

        // Get user locale
        const userLocale = currentUser?.locale || "en";

        // Get custom CSS configuration from styling config
        const customCSS = context.stylingConfig.embeddedContent.customCSS;
        const cssUrl = context.stylingConfig.embeddedContent.cssUrl;
        const iconSpriteUrl =
          context.stylingConfig.embeddedContent.iconSpriteUrl;
        const strings = context.stylingConfig.embeddedContent.strings;
        const stringIDs = context.stylingConfig.embeddedContent.stringIDs;

        console.log("ThoughtSpotEmbed: iconSpriteUrl =", iconSpriteUrl);
        console.log("ThoughtSpotEmbed: strings =", strings);
        console.log("ThoughtSpotEmbed: stringIDs =", stringIDs);

        // Filter out visibleActions from embed flags to prevent conflicts with hiddenActions
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { visibleActions, ...filteredEmbedFlags } = embedFlags;

        // Get runtime filters from current user
        const runtimeFilters = currentUser?.access.runtimeFilters || [];

        // Build custom actions for the SDK
        const configuredCustomActions =
          context.stylingConfig.customActions || [];
        const configuredStandardActions =
          context.stylingConfig.standardActions || [];

        // Map content type to CustomActionTarget for filtering
        const contentTypeToTarget: Record<string, CustomActionTarget> = {
          liveboard: CustomActionTarget.LIVEBOARD,
          answer: CustomActionTarget.ANSWER,
          model: CustomActionTarget.SPOTTER,
        };
        const currentTarget = contentTypeToTarget[content.type];

        // Get standard action definitions
        const standardActionDefinitions = getStandardActionDefinitions();

        // Build SDK actions from standard actions
        const sdkStandardActions = configuredStandardActions
          .filter((action) => {
            // Only include enabled actions
            if (!action.enabled) return false;

            // Filter by target type
            if (
              action.target === CustomActionTarget.VIZ &&
              content.type === "liveboard"
            ) {
              return true;
            }
            if (action.target !== currentTarget) return false;

            return true;
          })
          .map((action) => {
            // Get the definition to get the display name
            const definition = standardActionDefinitions.find(
              (d) => d.id === action.standardActionId
            );

            // Transform to SDK format
            const sdkAction: Record<string, unknown> = {
              name: definition?.name || action.standardActionId,
              id: action.standardActionId, // Use the standard action ID
              position: action.position || CustomActionPosition.MENU,
              target: action.target || CustomActionTarget.LIVEBOARD,
            };

            // Add optional scoping fields if present
            if (action.metadataIds) {
              sdkAction.metadataIds = action.metadataIds;
            }

            return sdkAction;
          });

        // Filter and transform custom actions for the SDK
        const sdkCustomActions = configuredCustomActions
          .filter((action) => {
            // Only include enabled actions
            if (!action.enabled) return false;

            // Filter by target type - include actions that match this content type
            // VIZ target applies to liveboard content
            if (
              action.target === CustomActionTarget.VIZ &&
              content.type === "liveboard"
            ) {
              return true;
            }
            if (action.target !== currentTarget) return false;

            return true;
          })
          .map((action) => {
            // Transform to SDK format
            const sdkAction: Record<string, unknown> = {
              name: action.name,
              id: action.id,
              position: action.position,
              target: action.target,
            };

            // Add optional scoping fields if present
            if (action.metadataIds) {
              sdkAction.metadataIds = action.metadataIds;
            }
            if (action.dataModelIds) {
              // Transform to SDK format
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
          "[ThoughtSpotEmbed] Actions for SDK (standard + custom):",
          allSdkActions
        );

        // Base embed configuration with customizations
        const baseEmbedConfig: ThoughtSpotBaseEmbedConfig = {
          frameParams: {
            width,
            height,
          },
          locale: userLocale,
          ...filteredEmbedFlags,
          ...(hiddenActions.length > 0 && { hiddenActions }),
          ...(runtimeFilters.length > 0 && { runtimeFilters }),
          ...(allSdkActions.length > 0 && {
            customActions: allSdkActions,
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

        console.log(
          "ThoughtSpotEmbed: baseEmbedConfig.customizations.content =",
          baseEmbedConfig.customizations.content
        );

        if (content.type === "liveboard") {
          console.log(
            "[ThoughtSpotEmbed] Creating LiveboardEmbed with config:",
            {
              liveboardId: content.id,
              vizId: content.vizId,
              ...baseEmbedConfig,
            }
          );
          embedInstance = new LiveboardEmbed(embedRef.current, {
            liveboardId: content.id,
            ...(content.vizId && { vizId: content.vizId }),
            ...baseEmbedConfig,
          });
        } else if (content.type === "answer") {
          console.log("[ThoughtSpotEmbed] Creating SearchEmbed with config:", {
            answerId: content.id,
            ...baseEmbedConfig,
          });
          embedInstance = new SearchEmbed(embedRef.current, {
            answerId: content.id,
            ...baseEmbedConfig,
          });
        } else if (content.type === "model") {
          // For models (Spotter), use SpotterEmbed with worksheetId
          console.log("[ThoughtSpotEmbed] Creating SpotterEmbed with config:", {
            worksheetId: content.id,
            ...baseEmbedConfig,
          });
          embedInstance = new SpotterEmbed(embedRef.current, {
            worksheetId: content.id,
            ...baseEmbedConfig,
          });
        }

        if (embedInstance) {
          // Check if component is still mounted before proceeding
          if (!isMounted) {
            console.log(
              "[ThoughtSpotEmbed] Component unmounted before embed setup, skipping"
            );
            return;
          }

          embedInstanceRef.current = embedInstance;

          // Add double-click event listener if enabled
          const doubleClickConfig = context.stylingConfig.doubleClickHandling;
          if (doubleClickConfig?.enabled) {
            embedInstance.on(
              EmbedEvent.VizPointDoubleClick,
              handleDoubleClickEvent
            );
          }

          // Add custom action event listener if there are any actions
          if (allSdkActions.length > 0) {
            embedInstance.on(EmbedEvent.CustomAction, handleCustomAction);
            console.log(
              "[ThoughtSpotEmbed] Custom action event listener registered for",
              allSdkActions.length,
              "actions"
            );
          }

          try {
            // Check if component is still mounted
            if (!isMounted) {
              console.log(
                "[ThoughtSpotEmbed] Component unmounted during render, skipping"
              );
              return;
            }

            // Ensure the DOM element is still available before rendering
            if (!embedRef.current) {
              console.warn(
                "[ThoughtSpotEmbed] DOM element was removed before render, skipping render"
              );
              if (isMounted) {
                setIsLoading(false);
              }
              return;
            }

            await embedInstance.render();
            if (isMounted) {
              setIsLoading(false);
              onLoad?.();
            }
          } catch (renderError) {
            console.error("Failed to render embed:", renderError);
            if (isMounted) {
              setError(
                `Render failed: ${
                  renderError instanceof Error
                    ? renderError.message
                    : "Unknown error"
                }`
              );
              setIsLoading(false);
            }
          }
        } else {
          throw new Error(`Failed to create ${content.type} embed instance`);
        }
      } catch (error) {
        console.error("Failed to initialize ThoughtSpot embed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load content";
        setError(errorMessage);
        setIsLoading(false);
        onError?.(errorMessage);
        // Don't re-throw the error to prevent it from bubbling up
      }
    };

    initEmbed();

    // Cleanup function
    return () => {
      isMounted = false;
      console.log(
        "[ThoughtSpotEmbed] Cleaning up embed instance for:",
        content.id
      );
      if (
        embedInstanceRef.current &&
        typeof embedInstanceRef.current.destroy === "function"
      ) {
        embedInstanceRef.current.destroy();
        console.log(
          "[ThoughtSpotEmbed] Embed instance destroyed for:",
          content.id
        );
      }
    };
  }, [
    content.id,
    content.type,
    content.vizId,
    width,
    height,
    onLoad,
    onError,
    context.appConfig.thoughtspotUrl, // Add cluster URL to dependencies
    context.lastClusterChangeTime, // Add cluster change timestamp to dependencies
    context.configVersion, // Add config version to force re-initialization on config changes
    context.stylingConfig.doubleClickHandling,
    context.stylingConfig.embedFlags?.liveboardEmbed,
    context.stylingConfig.embedFlags?.searchEmbed,
    context.stylingConfig.embedFlags?.spotterEmbed,
    context.stylingConfig.embeddedContent.customCSS,
    context.stylingConfig.embeddedContent.cssUrl,
    context.stylingConfig.embeddedContent.iconSpriteUrl,
    context.stylingConfig.embeddedContent.strings,
    context.stylingConfig.embeddedContent.stringIDs,
    context.userConfig.currentUserId,
    context.userConfig.users,
    context.stylingConfig.customActions,
    context.stylingConfig.standardActions,
    handleDoubleClickEvent,
    handleCustomAction,
  ]);

  if (error) {
    return (
      <div
        style={{
          padding: "20px",
          backgroundColor: "#fed7d7",
          border: "1px solid #feb2b2",
          borderRadius: "8px",
          color: "#c53030",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0" }}>⚠️ Embedding Error</h3>
        <p style={{ margin: 0 }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#f7fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <div style={{ color: "#4a5568" }}>Loading content...</div>
        </div>
      )}
      <div
        ref={embedRef}
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      />

      {/* Double-click modal */}
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
    </div>
  );
}
