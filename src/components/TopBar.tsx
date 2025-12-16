"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

interface TopBarProps {
  title: string;
  logoUrl?: string;
  showLogo?: boolean; // If false, hide the logo and only show the application name
  users?: Array<{ id: string; name: string; avatar?: string }>;
  currentUser?: { id: string; name: string; avatar?: string };
  onUserChange?: (userId: string) => void;
  backgroundColor?: string;
  foregroundColor?: string;
  onVizPickerClick?: () => void;
}

export default function TopBar({
  title,
  logoUrl = "/ts.svg",
  showLogo = true,
  users = [
    { id: "1", name: "John Doe" },
    { id: "2", name: "Jane Smith" },
    { id: "3", name: "Bob Johnson" },
  ],
  currentUser = { id: "1", name: "John Doe" },
  onUserChange,
  backgroundColor = "white",
  foregroundColor = "#1a202c",
  onVizPickerClick,
}: TopBarProps) {
  const [thoughtSpotVersion, setThoughtSpotVersion] = useState<string | null>(
    null
  );
  const [processedLogoUrl, setProcessedLogoUrl] = useState<string>("/ts.svg");
  const [isLogoProcessing, setIsLogoProcessing] = useState<boolean>(false);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const { fetchThoughtSpotVersion } = await import(
          "../services/thoughtspotApi"
        );
        const version = await fetchThoughtSpotVersion();
        setThoughtSpotVersion(version);
      } catch (error) {
        console.error("Failed to fetch ThoughtSpot version:", error);
      }
    };

    fetchVersion();
  }, []);

  // Process logo URL to handle IndexedDB URLs
  useEffect(() => {
    const processLogoUrl = async () => {
      console.log("[TopBar] Processing logo URL:", logoUrl);
      setIsLogoProcessing(true);

      try {
        if (!logoUrl || logoUrl === "/ts.svg") {
          console.log("[TopBar] Using default logo");
          setProcessedLogoUrl("/ts.svg");
          return;
        }

        if (logoUrl.startsWith("indexeddb://")) {
          console.log("[TopBar] Processing IndexedDB reference:", logoUrl);
          try {
            // Extract the image ID from the IndexedDB URL
            const imageId = logoUrl.replace("indexeddb://", "");

            // Get the image data from IndexedDB
            const { getImageFromIndexedDB } = await import(
              "../components/ImageUpload"
            );
            const imageData = await getImageFromIndexedDB(imageId);

            if (imageData) {
              console.log("[TopBar] Successfully loaded image from IndexedDB");
              setProcessedLogoUrl(imageData);
            } else {
              console.warn(
                "[TopBar] Failed to load image from IndexedDB:",
                imageId
              );
              setProcessedLogoUrl("/ts.svg");
            }
          } catch (error) {
            console.error(
              "[TopBar] Failed to load image from IndexedDB:",
              error
            );
            setProcessedLogoUrl("/ts.svg");
          }
        } else {
          // For other URL types, validate and use as-is
          console.log("[TopBar] Using logo URL as-is:", logoUrl);

          // Validate the URL to ensure it's safe
          try {
            if (
              logoUrl.startsWith("data:") ||
              logoUrl.startsWith("blob:") ||
              logoUrl.startsWith("/")
            ) {
              // These are safe to use directly
              setProcessedLogoUrl(logoUrl);
            } else if (logoUrl.startsWith("indexeddb://")) {
              // This shouldn't happen here, but just in case
              console.warn(
                "[TopBar] Unexpected IndexedDB reference, using default:",
                logoUrl
              );
              setProcessedLogoUrl("/ts.svg");
            } else if (logoUrl.startsWith("http")) {
              // Validate HTTP URLs
              new URL(logoUrl);
              setProcessedLogoUrl(logoUrl);
            } else {
              console.warn(
                "[TopBar] Invalid logo URL format, using default:",
                logoUrl
              );
              setProcessedLogoUrl("/ts.svg");
            }
          } catch (urlError) {
            console.error(
              "[TopBar] Invalid logo URL, using default:",
              logoUrl,
              urlError
            );
            setProcessedLogoUrl("/ts.svg");
          }
        }
      } finally {
        setIsLogoProcessing(false);
      }
    };

    processLogoUrl();
  }, [logoUrl]);

  // Debug: log when processedLogoUrl changes
  useEffect(() => {
    console.log("[TopBar] processedLogoUrl updated to:", processedLogoUrl);
  }, [processedLogoUrl]);

  return (
    <div
      style={{
        backgroundColor: backgroundColor,
        borderBottom: "1px solid #e2e8f0",
        padding: "12px 24px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Logo and Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {showLogo && (
          <>
            {isLogoProcessing ? (
              // Show loading state while processing logo
              <div
                style={{
                  height: "32px",
                  width: "32px",
                  backgroundColor: "#f3f4f6",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: "12px", color: "#9ca3af" }}>...</span>
              </div>
            ) : processedLogoUrl && processedLogoUrl !== "/ts.svg" ? (
              // Safety check: if processedLogoUrl is still an IndexedDB reference, something went wrong
              processedLogoUrl.startsWith("indexeddb://") ? (
                <img
                  src="/ts.svg"
                  alt="Logo (fallback)"
                  style={{ height: "32px", width: "auto" }}
                  onError={(e) => {
                    console.error("Fallback logo failed to load:", e);
                  }}
                />
              ) : processedLogoUrl.startsWith("data:") ||
                processedLogoUrl.startsWith("blob:") ? (
                // For data URLs and blob URLs, use regular img tag
                <img
                  src={processedLogoUrl}
                  alt="Logo"
                  style={{ height: "32px", width: "auto" }}
                  onError={(e) => {
                    console.error(
                      "Data/blob img failed to load:",
                      processedLogoUrl,
                      e
                    );
                  }}
                />
              ) : (
                // For regular URLs, use Next.js Image component
                <Image
                  src={processedLogoUrl}
                  alt="Logo"
                  height={32}
                  width={32}
                  style={{ height: "32px", width: "auto" }}
                  onError={(e) => {
                    console.error(
                      "Next.js Image failed to load:",
                      processedLogoUrl,
                      e
                    );
                  }}
                />
              )
            ) : (
              <img
                src={processedLogoUrl}
                alt="Logo"
                style={{ height: "32px", width: "auto" }}
                onError={(e) => {
                  console.error(
                    "Regular img failed to load:",
                    processedLogoUrl,
                    e
                  );
                }}
              />
            )}
          </>
        )}
        <h1
          style={{
            fontSize: "20px",
            fontWeight: "bold",
            color: foregroundColor,
            margin: 0,
          }}
        >
          {title}
        </h1>
      </div>

      {/* User Menu */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Viz Picker Button */}
        {onVizPickerClick && (
          <button
            onClick={onVizPickerClick}
            style={{
              background: "none",
              border: "2px solid #3b82f6",
              cursor: "pointer",
              padding: "8px 16px",
              borderRadius: "8px",
              backgroundColor: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "600",
              color: "#3b82f6",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#dbeafe";
              e.currentTarget.style.borderColor = "#2563eb";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#eff6ff";
              e.currentTarget.style.borderColor = "#3b82f6";
            }}
            title="Visualization Picker"
          >
            <span style={{ marginRight: "6px" }}>📊</span>
            Viz Picker
          </button>
        )}

        <div style={{ position: "relative" }}>
          <button
            onClick={() => {
              const menu = document.getElementById("user-menu");
              if (menu) {
                menu.style.display =
                  menu.style.display === "block" ? "none" : "block";
              }
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "50%",
              backgroundColor: "#e2e8f0",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            {currentUser.name.charAt(0)}
          </button>

          <div
            id="user-menu"
            style={{
              display: "none",
              position: "absolute",
              right: 0,
              top: "100%",
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              minWidth: "200px",
              zIndex: 1000,
            }}
          >
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => {
                  onUserChange?.(user.id);
                  const menu = document.getElementById("user-menu");
                  if (menu) menu.style.display = "none";
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  background:
                    currentUser.id === user.id ? "#ebf8ff" : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: "#e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  {user.name.charAt(0)}
                </div>
                <span>{user.name}</span>
              </button>
            ))}

            {/* Version display */}
            {thoughtSpotVersion && (
              <>
                <hr
                  style={{
                    margin: "8px 0",
                    border: "none",
                    borderTop: "1px solid #e2e8f0",
                  }}
                />
                <div
                  style={{
                    padding: "8px 16px",
                    fontSize: "12px",
                    color: "#6b7280",
                    textAlign: "center",
                  }}
                >
                  Version {thoughtSpotVersion}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
