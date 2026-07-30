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

function NewTile({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        border: hovered ? "2px solid #3182ce" : "2px dashed #cbd5e0",
        borderRadius: "12px",
        overflow: "hidden",
        cursor: "pointer",
        backgroundColor: hovered ? "#ebf4ff" : "white",
        boxShadow: hovered
          ? "0 8px 24px rgba(49, 130, 206, 0.15)"
          : "0 2px 8px rgba(0, 0, 0, 0.04)",
        transition: "all 0.18s ease",
        transform: hovered ? "translateY(-2px)" : "none",
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "16/9",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            border: `2px ${hovered ? "solid" : "dashed"} ${hovered ? "#3182ce" : "#a0aec0"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            color: hovered ? "#3182ce" : "#a0aec0",
            transition: "all 0.18s ease",
            lineHeight: "1",
          }}
        >
          +
        </div>
        <span
          style={{
            fontSize: "12px",
            color: hovered ? "#3182ce" : "#718096",
            fontWeight: "500",
            transition: "color 0.18s ease",
          }}
        >
          Create or upload
        </span>
      </div>
      <div
        style={{
          padding: "12px 16px",
          borderTop: `1px solid ${hovered ? "#bee3f8" : "#f0f4f8"}`,
          backgroundColor: hovered ? "#ebf4ff" : "#fafbfc",
          transition: "all 0.18s ease",
        }}
      >
        <p
          style={{
            margin: 0,
            textAlign: "center",
            fontSize: "14px",
            fontWeight: "600",
            color: hovered ? "#2b6cb0" : "#718096",
            transition: "color 0.18s ease",
          }}
        >
          New +
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
          err instanceof Error ? err.message : "Failed to load demos from GitHub"
        )
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
          <h1
            style={{
              margin: "0 0 8px 0",
              fontSize: "26px",
              fontWeight: "700",
              color: "#1a202c",
            }}
          >
            Choose a Demo
          </h1>
          <p style={{ margin: 0, fontSize: "15px", color: "#718096" }}>
            Select a pre-built demo to load, or start fresh.
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
            <NewTile onClick={() => router.push("/?demo=manual")} />
          </div>
        )}
      </div>
    </div>
  );
}
