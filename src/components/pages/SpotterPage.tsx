"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAppContext } from "../Layout";
import {
  ThoughtSpotEmbedConfig,
  VizPointDoubleClickEvent,
} from "../../types/thoughtspot";
import { TabularData, VizPointClickData } from "tse-data-classes";
import DoubleClickModal from "../DoubleClickModal";
import MeetingSchedulerView from "../MeetingSchedulerView";

interface SpotterPageProps {
  spotterModelId?: string;
  spotterSearchQuery?: string;
}

interface PaymentModalProps {
  maxQueries: number;
  planName: string;
  price: number;
  currency: string;
  accountManager: string;
  onPay: () => void;
}

function PaymentModal({ maxQueries, planName, price, currency, accountManager, onPay }: PaymentModalProps) {
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/28");
  const [cvv, setCvv] = useState("123");
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
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "32px",
          width: "420px",
          maxWidth: "90vw",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔒</div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#111827", margin: "0 0 8px 0" }}>
            Query Limit Reached
          </h2>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
            You&apos;ve used all your queries on the <strong>{planName}</strong> plan.
            Purchase more or schedule a call to continue.
          </p>
        </div>

        {/* Plan summary */}
        <div
          style={{
            backgroundColor: "#f0f9ff",
            border: "1px solid #bae6fd",
            borderRadius: "10px",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#0369a1" }}>
              Query Pack — {maxQueries} queries
            </span>
            <span style={{ fontSize: "18px", fontWeight: "700", color: "#0369a1" }}>
              {currency}{price}
            </span>
          </div>
          <p style={{ fontSize: "12px", color: "#0369a1", margin: 0 }}>
            Resets your counter to {maxQueries} queries immediately
          </p>
        </div>

        {/* Option toggle */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          <button
            onClick={() => setView("pay")}
            style={{
              flex: 1,
              padding: "10px",
              backgroundColor: view === "pay" ? "#2563eb" : "#f3f4f6",
              color: view === "pay" ? "#ffffff" : "#374151",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
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
              padding: "10px",
              backgroundColor: view === "schedule" ? "#2563eb" : "#f3f4f6",
              color: view === "schedule" ? "#ffffff" : "#374151",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background-color 0.15s",
            }}
          >
            📅 Schedule Meeting
          </button>
        </div>

        {/* Pay view */}
        {view === "pay" && (
          <>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>
                Card Number
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: "#111827",
                  boxSizing: "border-box",
                  fontFamily: "monospace",
                }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>
                  Expiry
                </label>
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#111827",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>
                  CVV
                </label>
                <input
                  type="text"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#111827",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
            <button
              onClick={handlePay}
              disabled={processing}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: processing ? "#93c5fd" : "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: processing ? "default" : "pointer",
                transition: "background-color 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                if (!processing) e.currentTarget.style.backgroundColor = "#1d4ed8";
              }}
              onMouseLeave={(e) => {
                if (!processing) e.currentTarget.style.backgroundColor = "#2563eb";
              }}
            >
              {processing ? (
                <><span style={{ fontSize: "16px" }}>⏳</span>Processing...</>
              ) : (
                <><span style={{ fontSize: "16px" }}>💳</span>Pay {currency}{price} Now</>
              )}
            </button>
            <p style={{ fontSize: "11px", color: "#9ca3af", textAlign: "center", marginTop: "12px", marginBottom: 0 }}>
              🔒 Secured by Stripe · This is a demo — no real charge will be made
            </p>
          </>
        )}

        {/* Schedule view */}
        {view === "schedule" && (
          <MeetingSchedulerView
            accountManager={accountManager}
            durationMinutes={30}
            onSchedule={onPay}
          />
        )}
      </div>
    </div>
  );
}

interface QueryCounterBarProps {
  remaining: number;
  max: number;
  label: string;
}

function QueryCounterBar({ remaining, max, label }: QueryCounterBarProps) {
  const pct = max > 0 ? remaining / max : 0;
  const isLow = pct <= 0.2;
  const barColor = isLow ? "#ef4444" : pct <= 0.5 ? "#f59e0b" : "#10b981";

  return (
    <div
      style={{
        padding: "8px 16px",
        borderTop: "1px solid #e5e7eb",
        backgroundColor: "#f9fafb",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: "12px", color: "#374151", whiteSpace: "nowrap", fontWeight: "500" }}>
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: "6px",
          backgroundColor: "#e5e7eb",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct * 100}%`,
            backgroundColor: barColor,
            borderRadius: "3px",
            transition: "width 0.3s ease, background-color 0.3s ease",
          }}
        />
      </div>
      <span
        style={{
          fontSize: "12px",
          fontWeight: "600",
          color: isLow ? "#dc2626" : "#374151",
          whiteSpace: "nowrap",
        }}
      >
        {remaining} / {max} remaining
      </span>
      {isLow && remaining > 0 && (
        <span style={{ fontSize: "11px", color: "#dc2626", whiteSpace: "nowrap" }}>
          ⚠ Running low
        </span>
      )}
    </div>
  );
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

  // Pricing state
  const pricingConfig = context.appConfig.spotterPricing;
  const pricingEnabled = pricingConfig?.enabled ?? false;
  const initialQueries = pricingConfig?.initialQueries ?? 500;
  const queriesPerPack = pricingConfig?.queriesPerPack ?? 500;
  const pricingLabel = pricingConfig?.label ?? "Spotter Queries";
  const [remainingQueries, setRemainingQueries] = useState(initialQueries);
  const [currentMax, setCurrentMax] = useState(initialQueries);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Reset counter when config changes
  useEffect(() => {
    setRemainingQueries(initialQueries);
    setCurrentMax(initialQueries);
    setShowPaymentModal(false);
  }, [initialQueries, queriesPerPack, pricingEnabled]);

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
          const currentUser = context.userConfig.users.find(
            (u) => u.id === context.userConfig.currentUserId
          );

          // Resolve SDK actions: user override takes precedence over global config
          const globalSdkActions = context.stylingConfig.sdkActions;
          const userSdkOverride = currentUser?.access.sdkActionsOverride;
          const activeSdkActions =
            userSdkOverride?.enabled
              ? userSdkOverride
              : globalSdkActions?.enabled
              ? globalSdkActions
              : null;

          // Convert action strings to Action enum values (by value, key, or pass through)
          const toActionEnums = (strings: string[]) =>
            strings.map((s) => {
              const byValue = Object.keys(Action).find(
                (key) => Action[key as keyof typeof Action] === s
              );
              if (byValue) return Action[byValue as keyof typeof Action];
              if (s in Action) return Action[s as keyof typeof Action];
              const byKey = Object.keys(Action).find(
                (key) => key.toLowerCase() === s.toLowerCase()
              );
              if (byKey) return Action[byKey as keyof typeof Action];
              return s;
            }) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

          const resolvedDisabledActions =
            activeSdkActions?.mode === "disabled"
              ? toActionEnums(activeSdkActions.actions)
              : [];
          const resolvedHiddenActions =
            activeSdkActions?.mode === "hidden"
              ? toActionEnums(activeSdkActions.actions)
              : [];
          const resolvedVisibleActions =
            activeSdkActions?.mode === "visible"
              ? toActionEnums(activeSdkActions.actions)
              : [];
          const resolvedDisabledReason =
            activeSdkActions?.mode === "disabled"
              ? activeSdkActions.disabledReason
              : undefined;

          // Get current user's locale
          const userLocale = currentUser?.locale || "en";

          // Get custom CSS configuration from styling config
          const customCSS = context.stylingConfig.embeddedContent.customCSS;
          const cssUrl = context.stylingConfig.embeddedContent.cssUrl;
          const iconSpriteUrl =
            context.stylingConfig.embeddedContent.iconSpriteUrl;
          const strings = context.stylingConfig.embeddedContent.strings;
          const stringIDs = context.stylingConfig.embeddedContent.stringIDs;

          // Strip action fields from embed flags — managed explicitly via sdkActions
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { visibleActions, hiddenActions: _fh, disabledActions: _fd, ...filteredEmbedFlags } =
            finalEmbedFlags as Record<string, unknown>;

          const embedConfig: ThoughtSpotEmbedConfig = {
            locale: userLocale,
            worksheetId: finalSpotterModelId,
            frameParams: {
              width: "100%",
              height: "100%",
            },
            ...filteredEmbedFlags,
            ...(resolvedDisabledActions.length > 0 && { disabledActions: resolvedDisabledActions }),
            ...(resolvedDisabledReason && { disabledActionReason: resolvedDisabledReason }),
            ...(resolvedHiddenActions.length > 0 && { hiddenActions: resolvedHiddenActions }),
            ...(resolvedVisibleActions.length > 0 && { visibleActions: resolvedVisibleActions }),
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
            embedInstance = new SpotterEmbed(embedRef.current, {
              ...embedConfig,
              worksheetId: embedConfig.worksheetId as string,
            } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
          }
          embedInstanceRef.current = embedInstance;

          if (embedInstance) {
            const doubleClickConfig =
              context.stylingConfig.doubleClickHandling;
            if (doubleClickConfig?.enabled) {
              (embedInstance as any).on( // eslint-disable-line @typescript-eslint/no-explicit-any
                EmbedEvent.VizPointDoubleClick,
                handleDoubleClickEvent
              );
            }

            // Listen for query events when pricing is enabled
            if (pricingEnabled) {
              (embedInstance as any).on( // eslint-disable-line @typescript-eslint/no-explicit-any
                EmbedEvent.SpotterQueryTriggered,
                () => {
                  setRemainingQueries((prev) => {
                    const next = prev - 1;
                    if (next <= 0) {
                      setShowPaymentModal(true);
                      return 0;
                    }
                    return next;
                  });
                }
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
    context.appConfig.thoughtspotUrl,
    context.lastClusterChangeTime,
    context.configVersion,
    finalSpotterModelId,
    finalSpotterSearchQuery,
    finalEmbedFlags,
    context.stylingConfig.embeddedContent.customCSS,
    context.stylingConfig.embeddedContent.cssUrl,
    context.stylingConfig.embeddedContent.iconSpriteUrl,
    context.stylingConfig.embeddedContent.strings,
    context.stylingConfig.embeddedContent.stringIDs,
    context.stylingConfig.doubleClickHandling,
    context.stylingConfig.sdkActions,
    context.userConfig.currentUserId,
    context.userConfig.users,
    handleDoubleClickEvent,
    pricingEnabled,
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
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, position: "relative" }}>
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
              {pricingEnabled && showPaymentModal && (
                <PaymentModal
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
              {pricingEnabled && (
                <QueryCounterBar remaining={remainingQueries} max={currentMax} label={pricingLabel} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
