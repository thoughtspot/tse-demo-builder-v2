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
          setSessionStatus({
            hasSession: true,
            isLoading: false,
            error: null,
          });
          onSessionStatusChange(true);
        } else {
          setSessionStatus({
            hasSession: false,
            isLoading: false,
            error: null,
          });
          onSessionStatusChange(false);
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

  const handleLogin = () => {
    if (thoughtspotUrl) {
      window.open(thoughtspotUrl, "_blank");
    }
  };

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

  if (!sessionStatus.hasSession) {
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
            maxWidth: "500px",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              marginBottom: "20px",
            }}
          >
            🔐
          </div>

          <h2
            style={{
              margin: "0 0 16px",
              color: "#2d3748",
              fontSize: "24px",
            }}
          >
            Authentication Required
          </h2>

          <p
            style={{
              margin: "0 0 24px",
              color: "#718096",
              lineHeight: "1.6",
            }}
          >
            {sessionStatus.error === "Server connection failed"
              ? "Unable to connect to your ThoughtSpot server. Please check your configuration."
              : sessionStatus.error === "No ThoughtSpot URL configured"
              ? "No ThoughtSpot URL is configured. Please set up your connection."
              : "You need to log into your ThoughtSpot server to continue. Please log in and then refresh this page."}
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {thoughtspotUrl &&
              sessionStatus.error !== "No ThoughtSpot URL configured" && (
                <button
                  onClick={handleLogin}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#3182ce",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Login to ThoughtSpot
                </button>
              )}

            <button
              onClick={handleRefresh}
              style={{
                padding: "12px 24px",
                backgroundColor: "#38a169",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Refresh Page
            </button>

            <button
              onClick={handleConfigure}
              style={{
                padding: "12px 24px",
                backgroundColor: "#6b7280",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Configure Settings
            </button>
          </div>

          {thoughtspotUrl && (
            <p
              style={{
                margin: "20px 0 0",
                fontSize: "12px",
                color: "#a0aec0",
              }}
            >
              ThoughtSpot URL: {thoughtspotUrl}
            </p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
