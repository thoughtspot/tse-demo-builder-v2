"use client";

import { useState, useRef, useEffect } from "react";

import { ThoughtSpotContent } from "../types/thoughtspot";
import { useAppContext } from "./Layout";

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
  const embedRef = useRef<HTMLDivElement>(null);
  const embedInstanceRef = useRef<{ destroy?: () => void } | null>(null);
  const context = useAppContext();

  useEffect(() => {
    const initEmbed = async () => {
      if (!embedRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        const { LiveboardEmbed, SearchEmbed } = await import(
          "@thoughtspot/visual-embed-sdk"
        );

        let embedInstance;

        // Get embed flags based on content type
        const embedFlags =
          content.type === "liveboard"
            ? context.stylingConfig.embedFlags?.liveboardEmbed || {}
            : context.stylingConfig.embedFlags?.searchEmbed || {};

        if (content.type === "liveboard") {
          embedInstance = new LiveboardEmbed(embedRef.current, {
            liveboardId: content.id,
            frameParams: {
              width,
              height,
            },
            ...embedFlags,
          });
        } else if (content.type === "answer") {
          embedInstance = new SearchEmbed(embedRef.current, {
            answerId: content.id,
            frameParams: {
              width,
              height,
            },
            ...embedFlags,
          });
        } else if (content.type === "model") {
          // For models, use SearchEmbed with dataSource
          embedInstance = new SearchEmbed(embedRef.current, {
            dataSource: content.id,
            frameParams: {
              width,
              height,
            },
            ...embedFlags,
          });
        }

        if (embedInstance) {
          embedInstanceRef.current = embedInstance;
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
  }, [content.id, content.type, width, height, onLoad, onError]);

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
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      />
    </div>
  );
}
