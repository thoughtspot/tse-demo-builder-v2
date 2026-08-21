"use client";

import React from "react";
import HomePage from "./HomePage";
import { useAppContext } from "../Layout";

const spinKeyframes = `@keyframes tsd-spin { to { transform: rotate(360deg); } }`;

export default function AppLoader() {
  const { isInitialLoadInProgress } = useAppContext();

  if (isInitialLoadInProgress) {
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
          Initializing…
        </p>
      </div>
    );
  }

  return <HomePage />;
}
