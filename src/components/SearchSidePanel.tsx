"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import PinToLiveboardDialog from "./PinToLiveboardDialog";
import { useAppContext } from "./Layout";
export type SearchPanelType = "search" | "ai";

interface SearchSidePanelProps {
  type: SearchPanelType;
  activeLiveboardId: string;
  searchDataSource?: string;
  spotterModelId?: string;
  searchTokenString?: string;
  onClose: () => void;
}

const PIN_ACTION_ID = "pin-to-liveboard-side-panel";

export default function SearchSidePanel({
  type,
  activeLiveboardId,
  searchDataSource,
  spotterModelId,
  searchTokenString,
  onClose,
}: SearchSidePanelProps) {
  const embedRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const embedInstanceRef = useRef<any>(null);
  const latestSpotterVizIdRef = useRef<string | undefined>(undefined);
  const context = useAppContext();

  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [embedError, setEmbedError] = useState<string | null>(null);

  const handlePin = useCallback(
    async (name: string) => {
      if (!embedInstanceRef.current) return;
      setIsPinning(true);
      setPinError(null);

      try {
        const { HostEvent } = await import("@thoughtspot/visual-embed-sdk");

        const pinPayload: Record<string, unknown> = {
          newVizName: name,
          liveboardId: activeLiveboardId,
        };

        if (type === "ai" && latestSpotterVizIdRef.current) {
          pinPayload.vizId = latestSpotterVizIdRef.current;
        }

        const result = await embedInstanceRef.current.trigger(
          HostEvent.Pin,
          pinPayload,
        );

        if (result && typeof result === "object" && "error" in result) {
          setPinError(
            `Pin failed: ${(result as { error: string }).error}`,
          );
        } else {
          setIsPinDialogOpen(false);
          context.triggerLiveboardRefresh();
        }
      } catch (err) {
        setPinError(
          err instanceof Error ? err.message : "Failed to pin to liveboard",
        );
      } finally {
        setIsPinning(false);
      }
    },
    [activeLiveboardId, type],
  );

  useEffect(() => {
    if (!embedRef.current) return;

    let isMounted = true;

    const initEmbed = async () => {
      try {
        const {
          SearchEmbed,
          SpotterEmbed,
          Action,
          EmbedEvent,
          CustomActionsPosition,
          CustomActionTarget,
        } = await import("@thoughtspot/visual-embed-sdk");

        if (!isMounted || !embedRef.current) return;

        const pinCustomAction = {
          id: PIN_ACTION_ID,
          name: "Pin",
          position:
            type === "ai"
              ? CustomActionsPosition.MENU
              : CustomActionsPosition.PRIMARY,
          target:
            type === "ai"
              ? CustomActionTarget.SPOTTER
              : CustomActionTarget.ANSWER,
        };

        const ec = context.stylingConfig.embeddedContent;
        const baseConfig = {
          hiddenActions: type === "ai" ? [Action.Pin, Action.Save] : [Action.Pin],
          customActions: [pinCustomAction],
          customizations: {
            ...(ec?.iconSpriteUrl && { iconSpriteUrl: ec.iconSpriteUrl }),
            content: {
              strings: ec?.strings || {},
              stringIDs: ec?.stringIDs || {},
            },
            style: {
              ...(ec?.cssUrl && { customCSSUrl: ec.cssUrl }),
              customCSS: {
                variables: ec?.customCSS?.variables || {},
                rules_UNSTABLE: ec?.customCSS?.rules_UNSTABLE || {},
              },
            },
          },
        };

        let instance: typeof embedInstanceRef.current;

        if (type === "search") {
          const cfg = {
            ...baseConfig,
            ...(searchDataSource && { dataSources: [searchDataSource] }),
            ...(searchTokenString && { searchTokenString }),
            dataPanelV2: true,
            frameParams: { width: "100%", height: "100%" },
          };
          instance = new SearchEmbed(embedRef.current, cfg);
        } else {
          if (!spotterModelId) {
            setEmbedError(
              "No Spotter model configured. Set a worksheet/model GUID in Settings → New Content → New AI Search.",
            );
            return;
          }
          const cfg = {
            ...baseConfig,
            worksheetId: spotterModelId,
            frameParams: { width: "100%", height: "100%" },
          };
          instance = new SpotterEmbed(embedRef.current, cfg);

          instance.on(EmbedEvent.Data, (payload: unknown) => {
            const p = payload as { data?: { id?: string } };
            if (p?.data?.id) {
              latestSpotterVizIdRef.current = p.data.id;
            }
          });
        }

        instance.on(EmbedEvent.CustomAction, (payload: unknown) => {
          const p = payload as { id?: string; data?: { id?: string } };
          const actionId = p?.id || p?.data?.id;
          if (actionId === PIN_ACTION_ID) {
            setIsPinDialogOpen(true);
          }
        });

        instance.on(EmbedEvent.Error, (err: unknown) => {
          const e = err as { error?: unknown; message?: unknown };
          const raw = e?.error || e?.message;
          const msg = typeof raw === "string" ? raw : null;
          if (msg) {
            console.error("[SearchSidePanel] Embed error:", err);
            setEmbedError(msg);
          }
        });

        instance.render();
        embedInstanceRef.current = instance;
      } catch (err) {
        console.error("[SearchSidePanel] Failed to initialize embed:", err);
        if (isMounted) {
          setEmbedError("Failed to load embed. Check console for details.");
        }
      }
    };

    initEmbed();

    return () => {
      isMounted = false;
      if (embedInstanceRef.current?.destroy) {
        embedInstanceRef.current.destroy();
        embedInstanceRef.current = null;
      }
    };
    // Intentionally run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title = type === "search" ? "Search" : "AI Search";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor:
          context.stylingConfig.application.backgrounds?.contentBackground ||
          "#ffffff",
        borderLeft: `1px solid var(--border-color, #e2e8f0)`,
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      {/* Panel header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderBottom: `1px solid var(--border-color, #e2e8f0)`,
          flexShrink: 0,
          backgroundColor:
            context.stylingConfig.application.backgrounds?.cardBackground ||
            "#f7fafc",
        }}
      >
        <span
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color:
              context.stylingConfig.application.typography?.primaryColor ||
              "#1f2937",
          }}
        >
          {title}
        </span>
        <button
          onClick={onClose}
          title="Close panel"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 6px",
            borderRadius: "var(--radius-sm, 4px)",
            color:
              context.stylingConfig.application.typography?.secondaryColor ||
              "#6b7280",
            fontSize: "18px",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background var(--transition-fast, 150ms) ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          ✕
        </button>
      </div>

      {/* Error banner */}
      {(embedError || pinError) && (
        <div
          style={{
            padding: "10px 16px",
            backgroundColor: "#fef2f2",
            borderBottom: "1px solid #fecaca",
            color: "#b91c1c",
            fontSize: "13px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <span>{embedError || pinError}</span>
          <button
            onClick={() => {
              setEmbedError(null);
              setPinError(null);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#b91c1c",
              fontSize: "16px",
              padding: "0 2px",
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Embed container */}
      <div ref={embedRef} style={{ flex: 1, overflow: "hidden", minHeight: 0 }} />

      <PinToLiveboardDialog
        isOpen={isPinDialogOpen}
        onClose={() => {
          setIsPinDialogOpen(false);
          setPinError(null);
        }}
        onPin={handlePin}
        isLoading={isPinning}
      />
    </div>
  );
}
