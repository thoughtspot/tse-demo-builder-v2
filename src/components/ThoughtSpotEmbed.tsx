"use client";

import { useState, useRef, useEffect, useCallback } from "react";

import {
  ThoughtSpotContent,
  VizPointDoubleClickEvent,
  ThoughtSpotBaseEmbedConfig,
} from "../types/thoughtspot";
import { VizPointClickDataType } from "../types/data-classes-types";
import { useAppContext } from "./Layout";
import DoubleClickModal from "./DoubleClickModal";
import { VizPointClick } from "../types/data-classes";

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
    useState<VizPointClick | null>(null);
  const embedRef = useRef<HTMLDivElement>(null);
  const embedInstanceRef = useRef<{ destroy?: () => void } | null>(null);
  const context = useAppContext();

  const handleDoubleClickEvent = useCallback(
    (event: unknown) => {
      const doubleClickConfig = context.stylingConfig.doubleClickHandling;

      if (!doubleClickConfig?.enabled) return;

      // Create VizPointClick instance from the event data
      const vizPointClick = VizPointClick.createFromJSON(
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
    [
      context.stylingConfig.doubleClickHandling,
      context.stylingConfig.embedFlags?.liveboardEmbed,
      context.stylingConfig.embedFlags?.searchEmbed,
      context.userConfig.currentUserId,
      context.userConfig.users,
    ]
  );

  useEffect(() => {
    const initEmbed = async () => {
      if (!embedRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        const { LiveboardEmbed, SearchEmbed, EmbedEvent } = await import(
          "@thoughtspot/visual-embed-sdk"
        );

        let embedInstance;

        // Get embed flags based on content type
        const embedFlags =
          content.type === "liveboard"
            ? context.stylingConfig.embedFlags?.liveboardEmbed || {}
            : context.stylingConfig.embedFlags?.searchEmbed || {};

        // Get hidden actions for current user
        const currentUser = context.userConfig.users.find(
          (u) => u.id === context.userConfig.currentUserId
        );
        const hiddenActions = currentUser?.access.hiddenActions?.enabled
          ? (currentUser.access.hiddenActions.actions as any[]) // eslint-disable-line @typescript-eslint/no-explicit-any
          : [];

        // Get custom CSS configuration from styling config
        const customCSS = context.stylingConfig.embeddedContent.customCSS;
        const cssUrl = context.stylingConfig.embeddedContent.cssUrl;
        const strings = context.stylingConfig.embeddedContent.strings;
        const stringIDs = context.stylingConfig.embeddedContent.stringIDs;

        // Base embed configuration with customizations
        const baseEmbedConfig: ThoughtSpotBaseEmbedConfig = {
          frameParams: {
            width,
            height,
          },
          ...embedFlags,
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

        if (content.type === "liveboard") {
          embedInstance = new LiveboardEmbed(embedRef.current, {
            liveboardId: content.id,
            ...baseEmbedConfig,
          });
        } else if (content.type === "answer") {
          embedInstance = new SearchEmbed(embedRef.current, {
            answerId: content.id,
            ...baseEmbedConfig,
          });
        } else if (content.type === "model") {
          // For models, use SearchEmbed with dataSource
          embedInstance = new SearchEmbed(embedRef.current, {
            dataSource: content.id,
            ...baseEmbedConfig,
          });
        }

        if (embedInstance) {
          embedInstanceRef.current = embedInstance;

          // Add double-click event listener if enabled
          const doubleClickConfig = context.stylingConfig.doubleClickHandling;
          if (doubleClickConfig?.enabled) {
            embedInstance.on(
              EmbedEvent.VizPointDoubleClick,
              handleDoubleClickEvent
            );
          }

          await embedInstance.render();
          setIsLoading(false);
          onLoad?.();
        }
      } catch (error) {
        console.error("Failed to initialize ThoughtSpot embed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load content";
        setError(errorMessage);
        setIsLoading(false);
        onError?.(errorMessage);
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
    content.id,
    content.type,
    width,
    height,
    onLoad,
    onError,
    context.stylingConfig.doubleClickHandling,
    context.stylingConfig.embedFlags?.liveboardEmbed,
    context.stylingConfig.embedFlags?.searchEmbed,
    context.stylingConfig.embeddedContent.customCSS,
    context.stylingConfig.embeddedContent.cssUrl,
    context.stylingConfig.embeddedContent.strings,
    context.stylingConfig.embeddedContent.stringIDs,
    context.userConfig.currentUserId,
    context.userConfig.users,
    handleDoubleClickEvent,
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
