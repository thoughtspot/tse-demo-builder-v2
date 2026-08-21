"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import PinToLiveboardDialog from "./PinToLiveboardDialog";
import { useAppContext } from "./Layout";
import MeetingSchedulerView from "./MeetingSchedulerView";
export type SearchPanelType = "search" | "ai";

interface PaymentModalProps {
  maxQueries: number;
  planName: string;
  price: number;
  currency: string;
  accountManager: string;
  onPay: () => void;
}

function SidePanelPaymentModal({ maxQueries, planName, price, currency, accountManager, onPay }: PaymentModalProps) {
  const [processing, setProcessing] = useState(false);
  const [view, setView] = useState<"pay" | "schedule">("pay");

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onPay();
    }, 1500);
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "20px",
          width: "300px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔒</div>
        <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#111827", margin: "0 0 6px 0" }}>
          Query Limit Reached
        </h3>
        <p style={{ fontSize: "11px", color: "#6b7280", margin: "0 0 14px 0" }}>
          You&apos;ve used all your queries on the <strong>{planName}</strong> plan.
        </p>

        {/* Plan summary */}
        <div
          style={{
            backgroundColor: "#f0f9ff",
            border: "1px solid #bae6fd",
            borderRadius: "8px",
            padding: "10px",
            marginBottom: "14px",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: "600", color: "#0369a1" }}>
            Query Pack — {maxQueries} queries
          </div>
          <div style={{ fontSize: "16px", fontWeight: "700", color: "#0369a1", marginTop: "2px" }}>
            {currency}{price}
          </div>
        </div>

        {/* Option toggle */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
          <button
            onClick={() => setView("pay")}
            style={{
              flex: 1,
              padding: "8px 4px",
              backgroundColor: view === "pay" ? "#2563eb" : "#f3f4f6",
              color: view === "pay" ? "#ffffff" : "#374151",
              border: "none",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background-color 0.15s",
            }}
          >
            💳 Pay Now
          </button>
          <button
            onClick={() => setView("schedule")}
            style={{
              flex: 1,
              padding: "8px 4px",
              backgroundColor: view === "schedule" ? "#2563eb" : "#f3f4f6",
              color: view === "schedule" ? "#ffffff" : "#374151",
              border: "none",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background-color 0.15s",
            }}
          >
            📅 Schedule
          </button>
        </div>

        {/* Pay view */}
        {view === "pay" && (
          <>
            <button
              onClick={handlePay}
              disabled={processing}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: processing ? "#93c5fd" : "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: processing ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              {processing ? "Processing..." : `💳 Pay ${currency}${price} Now`}
            </button>
            <p style={{ fontSize: "10px", color: "#9ca3af", marginTop: "8px", marginBottom: 0 }}>
              Demo only — no real charge
            </p>
          </>
        )}

        {/* Schedule view */}
        {view === "schedule" && (
          <MeetingSchedulerView
            accountManager={accountManager}
            durationMinutes={30}
            onSchedule={onPay}
            compact
          />
        )}
      </div>
    </div>
  );
}

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

  // Pricing state (AI mode only)
  const pricingConfig = context.appConfig.spotterPricing;
  const pricingEnabled = type === "ai" && (pricingConfig?.enabled ?? false);
  const initialQueries = pricingConfig?.initialQueries ?? 500;
  const queriesPerPack = pricingConfig?.queriesPerPack ?? 500;
  const pricingLabel = pricingConfig?.label ?? "Spotter Queries";
  const [remainingQueries, setRemainingQueries] = useState(initialQueries);
  const [currentMax, setCurrentMax] = useState(initialQueries);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    setRemainingQueries(initialQueries);
    setCurrentMax(initialQueries);
    setShowPaymentModal(false);
  }, [initialQueries, queriesPerPack, pricingEnabled]);

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
          const rawSpotterFlags = context.stylingConfig.embedFlags?.spotterEmbed || {};
          const {
            visibleActions: _va,
            hiddenActions: _ha,
            disabledActions: _da,
            ...spotterFlags
          } = rawSpotterFlags as Record<string, unknown>;
          const cfg = {
            ...baseConfig,
            ...spotterFlags,
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

          if (pricingEnabled) {
            instance.on(EmbedEvent.SpotterQueryTriggered, () => {
              setRemainingQueries((prev) => {
                const next = prev - 1;
                if (next <= 0) {
                  setShowPaymentModal(true);
                  return 0;
                }
                return next;
              });
            });
          }
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
      <div style={{ flex: 1, overflow: "hidden", minHeight: 0, position: "relative" }}>
        <div ref={embedRef} style={{ width: "100%", height: "100%" }} />
        {pricingEnabled && showPaymentModal && (
          <SidePanelPaymentModal
            maxQueries={queriesPerPack}
            planName={pricingConfig?.planName || "Starter"}
            price={pricingConfig?.pricePerPack ?? 500}
            currency={pricingConfig?.currency || "$"}
            accountManager={pricingConfig?.accountManager || "Brian"}
            onPay={() => {
              setRemainingQueries(queriesPerPack);
              setCurrentMax(queriesPerPack);
              setShowPaymentModal(false);
            }}
          />
        )}
      </div>

      {/* Query counter bar for AI mode */}
      {pricingEnabled && (
        <div
          style={{
            padding: "6px 12px",
            borderTop: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: "11px", color: "#374151", whiteSpace: "nowrap", fontWeight: "500" }}>
            {pricingLabel}
          </span>
          <div
            style={{
              flex: 1,
              height: "5px",
              backgroundColor: "#e5e7eb",
              borderRadius: "3px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${currentMax > 0 ? (remainingQueries / currentMax) * 100 : 0}%`,
                backgroundColor:
                  remainingQueries / currentMax <= 0.2
                    ? "#ef4444"
                    : remainingQueries / currentMax <= 0.5
                    ? "#f59e0b"
                    : "#10b981",
                borderRadius: "3px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: "600",
              color: remainingQueries / currentMax <= 0.2 ? "#dc2626" : "#374151",
              whiteSpace: "nowrap",
            }}
          >
            {remainingQueries}/{currentMax}
          </span>
        </div>
      )}

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
