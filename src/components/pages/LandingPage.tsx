"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  listConfigurations,
  getPreviewUrl,
  DemoListing,
} from "../../services/githubApi";

function DemoTile({
  demo,
  onClick,
}: {
  demo: DemoListing;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const previewUrl = getPreviewUrl(demo.name);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        border: hovered ? "2px solid #3182ce" : "2px solid #e2e8f0",
        borderRadius: "12px",
        overflow: "hidden",
        cursor: "pointer",
        backgroundColor: "white",
        boxShadow: hovered
          ? "0 8px 24px rgba(49, 130, 206, 0.15)"
          : "0 2px 8px rgba(0, 0, 0, 0.06)",
        transition: "all 0.18s ease",
        transform: hovered ? "translateY(-2px)" : "none",
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "16/9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          overflow: "hidden",
        }}
      >
        {!imgError ? (
          <img
            src={previewUrl}
            alt={demo.name}
            onError={() => setImgError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "30px",
              color: "white",
              fontWeight: "700",
            }}
          >
            {demo.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid #f0f4f8",
          backgroundColor: hovered ? "#ebf4ff" : "#fafbfc",
          transition: "background-color 0.18s ease",
        }}
      >
        <p
          style={{
            margin: 0,
            textAlign: "center",
            fontSize: "14px",
            fontWeight: "600",
            color: hovered ? "#2b6cb0" : "#2d3748",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {demo.name}
        </p>
      </div>
    </div>
  );
}


const spinKeyframes = `@keyframes ts-land-spin { to { transform: rotate(360deg); } }`;

function Spinner({ size = 20 }: { size?: number }) {
  return (
    <>
      <style>{spinKeyframes}</style>
      <div
        style={{
          width: size,
          height: size,
          border: "2px solid #e2e8f0",
          borderTopColor: "#3182ce",
          borderRadius: "50%",
          animation: "ts-land-spin 0.8s linear infinite",
          flexShrink: 0,
        }}
      />
    </>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [demos, setDemos] = useState<DemoListing[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    listConfigurations()
      .then(setDemos)
      .catch((err) =>
        setFetchError(
          err instanceof Error
            ? err.message
            : "Failed to load demos from GitHub",
        ),
      )
      .finally(() => setIsFetching(false));
  }, []);

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
      }}
    >
      <div style={{ padding: "48px 56px", flex: 1, overflowY: "auto" }}>
        <div style={{ marginBottom: "36px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: "26px",
                fontWeight: "700",
                color: "#1a202c",
              }}
            >
              Choose a Demo
            </h1>
            <button
              onClick={() => router.push("/?demo=manual")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                backgroundColor: "#3182ce",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "16px", lineHeight: "1" }}>+</span>
              New Configuration
            </button>
          </div>
          <p style={{ margin: 0, fontSize: "15px", color: "#718096" }}>
            Select a pre-built industry demo to load, or start fresh. All
            pre-built demos run against the PMM instance in the Prod org.
          </p>
          {fetchError && (
            <p
              style={{
                margin: "12px 0 0 0",
                padding: "10px 14px",
                backgroundColor: "#fff5f5",
                border: "1px solid #fed7d7",
                borderRadius: "6px",
                color: "#c53030",
                fontSize: "13px",
              }}
            >
              {fetchError}
            </p>
          )}
        </div>

        {isFetching ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#718096",
            }}
          >
            <Spinner />
            <span style={{ fontSize: "14px" }}>Loading demos from GitHub…</span>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "20px",
            }}
          >
            {demos.map((demo) => (
              <DemoTile
                key={demo.filename}
                demo={demo}
                onClick={() =>
                  router.push(`/?demo=${encodeURIComponent(demo.name)}`)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
