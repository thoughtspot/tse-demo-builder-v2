"use client";

import { useState, useEffect } from "react";
import { getCurrentUser } from "../services/thoughtspotApi";

interface SessionCheckerProps {
  children: React.ReactNode;
  thoughtspotUrl: string;
  onSessionStatusChange: (hasSession: boolean) => void;
  onConfigureSettings?: () => void;
}

interface SessionStatus {
  hasSession: boolean;
  isLoading: boolean;
  error: string | null;
}

// Session Warning Banner Component
function SessionWarningBanner({
  thoughtspotUrl,
  error,
  onRefresh,
  onConfigure,
}: {
  thoughtspotUrl: string;
  error: string | null;
  onRefresh: () => void;
  onConfigure: () => void;
}) {
  const getWarningMessage = () => {
    if (error === "Server connection failed") {
      return "Unable to connect to your ThoughtSpot server. You can still configure settings to change your cluster URL.";
    } else if (error === "No ThoughtSpot URL configured") {
      return "No ThoughtSpot URL is configured. Please set up your connection.";
    } else {
      return "You are not logged into your ThoughtSpot server. Some features may not work until you authenticate.";
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#fef3c7",
        borderBottom: "1px solid #f59e0b",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}
      >
        <span style={{ fontSize: "16px" }}>⚠️</span>
        <span
          style={{
            color: "#92400e",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          {getWarningMessage()}
        </span>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        {thoughtspotUrl && error !== "No ThoughtSpot URL configured" && (
          <button
            onClick={() => window.open(thoughtspotUrl, "_blank")}
            style={{
              padding: "6px 12px",
              backgroundColor: "#3182ce",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "500",
            }}
          >
            Go to TS
          </button>
        )}
        <button
          onClick={onRefresh}
          style={{
            padding: "6px 12px",
            backgroundColor: "#38a169",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "500",
          }}
        >
          Refresh
        </button>
        <button
          onClick={onConfigure}
          style={{
            padding: "6px 12px",
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "500",
          }}
        >
          Settings
        </button>
      </div>
    </div>
  );
}

export default function SessionChecker({
  children,
  thoughtspotUrl,
  onSessionStatusChange,
  onConfigureSettings,
}: SessionCheckerProps) {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>({
    hasSession: false,
    isLoading: true,
    error: null,
  });
  const [hasEverHadSession, setHasEverHadSession] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      if (!thoughtspotUrl) {
        setSessionStatus({
          hasSession: false,
          isLoading: false,
          error: "No ThoughtSpot URL configured",
        });
        onSessionStatusChange(false);
        return;
      }

      try {
        setSessionStatus((prev) => ({ ...prev, isLoading: true, error: null }));

        const user = await getCurrentUser();

        if (user) {
          setHasEverHadSession(true);
          setSessionStatus({
            hasSession: true,
            isLoading: false,
            error: null,
          });
          onSessionStatusChange(true);
        } else {
          // Only set hasSession to false if we haven't ever had a successful session
          if (!hasEverHadSession) {
            setSessionStatus({
              hasSession: false,
              isLoading: false,
              error: null,
            });
            onSessionStatusChange(false);
          } else {
            setSessionStatus({
              hasSession: true,
              isLoading: false,
              error: null,
            });
            onSessionStatusChange(true);
          }
        }
      } catch (error) {
        console.error("Session check failed:", error);

        // Check if it's a server connection error
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        const isServerError =
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("NetworkError") ||
          errorMessage.includes("404") ||
          errorMessage.includes("500");

        setSessionStatus({
          hasSession: false,
          isLoading: false,
          error: isServerError
            ? "Server connection failed"
            : "Authentication required",
        });
        onSessionStatusChange(false);
      }
    };

    checkSession();
  }, [thoughtspotUrl, onSessionStatusChange]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleConfigure = () => {
    if (onConfigureSettings) {
      onConfigureSettings();
    }
  };

  if (sessionStatus.isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#f7fafc",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #e2e8f0",
              borderTop: "4px solid #3182ce",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px",
            }}
          />
          <h2 style={{ margin: "0 0 10px", color: "#2d3748" }}>
            Checking Session...
          </h2>
          <p style={{ margin: 0, color: "#718096" }}>
            Verifying your ThoughtSpot connection
          </p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // Always render children, but show warning banner if no session and we've never had a successful session
  return (
    <>
      {false &&
        !sessionStatus.hasSession &&
        !sessionStatus.isLoading &&
        !hasEverHadSession && (
          <SessionWarningBanner
            thoughtspotUrl={thoughtspotUrl}
            error={sessionStatus.error}
            onRefresh={handleRefresh}
            onConfigure={handleConfigure}
          />
        )}
      {children}
    </>
  );
}
