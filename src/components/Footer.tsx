"use client";

import { useState, useEffect } from "react";
import { getCurrentUser } from "../services/thoughtspotApi";
import { useAppContext } from "./Layout";

interface ThoughtSpotUser {
  name: string;
  display_name: string;
}

interface FooterProps {
  backgroundColor?: string;
  foregroundColor?: string;
}

export default function Footer({
  backgroundColor = "#f7fafc",
  foregroundColor = "#4a5568",
}: FooterProps = {}) {
  const [user, setUser] = useState<ThoughtSpotUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { appConfig } = useAppContext();
  const thoughtspotUrl =
    appConfig.thoughtspotUrl ||
    "https://se-thoughtspot-cloud.thoughtspot.cloud";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setError("Could not retrieve user information");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Helper function to create a hover color that's consistent with the foreground color
  const getHoverColor = (baseColor: string) => {
    // Convert hex to RGB for manipulation
    const hex = baseColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Create a slightly lighter version for hover (increase brightness by 20%)
    const brightness = 0.2;
    const newR = Math.min(255, r + (255 - r) * brightness);
    const newG = Math.min(255, g + (255 - g) * brightness);
    const newB = Math.min(255, b + (255 - b) * brightness);

    return `rgb(${Math.round(newR)}, ${Math.round(newG)}, ${Math.round(newB)})`;
  };

  const hoverColor = getHoverColor(foregroundColor);

  return (
    <footer
      style={{
        padding: "8px 16px",
        backgroundColor: backgroundColor,
        borderTop: "1px solid #e2e8f0",
        fontSize: "12px",
        color: foregroundColor,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      <div>
        <span>TS URL: </span>
        <a
          href={thoughtspotUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: foregroundColor,
            textDecoration: "none",
            transition: "color 0.2s ease, text-decoration 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = hoverColor;
            e.currentTarget.style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = foregroundColor;
            e.currentTarget.style.textDecoration = "none";
          }}
        >
          {thoughtspotUrl}
        </a>
      </div>

      <div>
        <span>User: </span>
        {loading ? (
          <span>Loading...</span>
        ) : error ? (
          <span style={{ color: "#e53e3e" }}>Could not retrieve</span>
        ) : user ? (
          <span>{user.display_name}</span>
        ) : (
          <span style={{ color: "#e53e3e" }}>Unknown</span>
        )}
      </div>
    </footer>
  );
}
