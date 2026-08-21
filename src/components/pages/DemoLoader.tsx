"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { clearAllConfigurations } from "@/services/configurationService";

const spinKeyframes = `@keyframes tsd-spin { to { transform: rotate(360deg); } }`;

export default function DemoLoader({ demo }: { demo: string }) {
  const [error, setError] = useState<string | null>(null);
  const didTrigger = useRef(false);

  const triggerLoad = useCallback(async (filename: string) => {
    const file = filename.endsWith(".json") ? filename : `${filename}.json`;
    type LoadFn = (src: { type: string; data: string }) => Promise<void>;
    for (let i = 0; i < 40; i++) {
      const fn = (window as unknown as { loadConfiguration?: LoadFn })
        .loadConfiguration;
      if (fn) {
        await fn({ type: "github", data: file });
        return;
      }
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error("Configuration loader unavailable");
  }, []);

  useEffect(() => {
    if (didTrigger.current) return;
    didTrigger.current = true;

    // Navigate to /?demo=<name>&loaded=1. For "manual" there is nothing to
    // load from GitHub — the app starts with whatever is already in storage.
    // For a named demo, trigger the GitHub load first, then navigate once the
    // config is saved. The window.location.reload() that loadConfigurationSimplified
    // schedules is abandoned when we navigate away.
    if (demo === "manual") {
      sessionStorage.setItem("currentDemo", "manual");
      clearAllConfigurations().finally(() => {
        window.location.href = `/?demo=manual&loaded=1`;
      });
      return;
    }

    triggerLoad(demo)
      .then(() => {
        sessionStorage.setItem("currentDemo", demo);
        window.location.href = `/?demo=${encodeURIComponent(demo)}&loaded=1`;
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
      });
  }, [demo, triggerLoad]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 1000,
        backgroundColor: "#f7fafc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
      }}
    >
      {error ? (
        <>
          <p
            style={{
              color: "#e53e3e",
              fontSize: "15px",
              margin: 0,
              maxWidth: 400,
              textAlign: "center",
            }}
          >
            Failed to load &ldquo;{demo}&rdquo;: {error}
          </p>
          <a href="/" style={{ fontSize: "14px", color: "#3182ce" }}>
            ← Back to demo picker
          </a>
        </>
      ) : (
        <>
          <style>{spinKeyframes}</style>
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid #e2e8f0",
              borderTopColor: "#3182ce",
              borderRadius: "50%",
              animation: "tsd-spin 0.8s linear infinite",
              flexShrink: 0,
            }}
          />
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: "500",
              color: "#4a5568",
            }}
          >
            Loading &ldquo;{demo}&rdquo;&hellip;
          </p>
        </>
      )}
    </div>
  );
}
