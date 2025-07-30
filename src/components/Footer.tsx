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
            color: "#3182ce",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => {
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
