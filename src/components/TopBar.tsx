"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import MaterialIcon from "./MaterialIcon";

export interface TopBarNavItem {
  id: string;
  name: string;
  icon: string;
  route: string;
}

interface TopBarProps {
  title: string;
  logoUrl?: string;
  showLogo?: boolean;
  users?: Array<{ id: string; name: string; avatar?: string }>;
  currentUser?: { id: string; name: string; avatar?: string };
  onUserChange?: (userId: string) => void;
  backgroundColor?: string;
  foregroundColor?: string;
  thoughtspotUrl?: string;
  onVizPickerClick?: () => void;
  onCreateLiveboardClick?: () => void;
  createLiveboardButtonLabel?: string;
  onSettingsClick?: () => void;
  height?: "compact" | "default" | "tall";
  navItems?: TopBarNavItem[];
  hideBorders?: boolean;
  showHelpButton?: boolean;
}

const HEIGHT_PADDING: Record<string, string> = {
  compact: "8px 24px",
  default: "12px 24px",
  tall:    "18px 24px",
};

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
  thoughtspotUrl,
  onVizPickerClick,
  onCreateLiveboardClick,
  createLiveboardButtonLabel = "New Liveboard",
  onSettingsClick,
  height = "default",
  navItems,
  hideBorders = false,
  showHelpButton = false,
}: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [thoughtSpotVersion, setThoughtSpotVersion] = useState<string | null>(
    null
  );
  const [processedLogoUrl, setProcessedLogoUrl] = useState<string>("/ts.svg");
  const [isLogoProcessing, setIsLogoProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (!thoughtspotUrl) {
      return;
    }

    const fetchVersion = async () => {
      try {
        const { fetchThoughtSpotVersion, setThoughtSpotBaseUrl } = await import(
          "../services/thoughtspotApi"
        );
        setThoughtSpotBaseUrl(thoughtspotUrl);
        const version = await fetchThoughtSpotVersion();
        setThoughtSpotVersion(version);
      } catch (error) {
        console.error("Failed to fetch ThoughtSpot version:", error);
      }
    };

    fetchVersion();
  }, [thoughtspotUrl]);

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

  const handleNavClick = (route: string) => {
    const demo =
      searchParams.get("demo") ||
      (typeof window !== "undefined" ? sessionStorage.getItem("currentDemo") : null);
    if (demo) {
      if (typeof window !== "undefined") sessionStorage.setItem("currentDemo", demo);
      const params = new URLSearchParams({ demo, loaded: "1" });
      router.push(`${route}?${params.toString()}`);
      return;
    }
    router.push(route);
  };

  const hasTopNav = navItems && navItems.length > 0;

  return (
    <div style={{ backgroundColor, borderBottom: hideBorders ? "none" : "1px solid #e2e8f0", boxShadow: "var(--shadow-topbar, 0 1px 3px rgba(0,0,0,0.1))" }}>
      {/* Brand bar */}
      <div
        style={{
          padding: HEIGHT_PADDING[height] ?? HEIGHT_PADDING.default,
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
        {/* Create Liveboard Button */}
        {onCreateLiveboardClick && (
          <button
            onClick={onCreateLiveboardClick}
            style={{
              border: "2px solid var(--primary-button-border, #3182ce)",
              cursor: "pointer",
              padding: "8px 16px",
              borderRadius: "var(--radius-md, 8px)",
              backgroundColor: "var(--primary-button-bg, #3182ce)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "600",
              color: "var(--primary-button-text, #ffffff)",
              transition: "all var(--transition-fast, 150ms) ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--primary-button-hover-bg, #2c5aa0)";
              e.currentTarget.style.borderColor = "var(--primary-button-hover-bg, #2c5aa0)";
              e.currentTarget.style.color = "var(--primary-button-hover-text, #ffffff)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--primary-button-bg, #3182ce)";
              e.currentTarget.style.borderColor = "var(--primary-button-border, #3182ce)";
              e.currentTarget.style.color = "var(--primary-button-text, #ffffff)";
            }}
            title={`Create New ${createLiveboardButtonLabel}`}
          >
            <span style={{ marginRight: "6px", fontSize: "16px" }}>+</span>
            {createLiveboardButtonLabel}
          </button>
        )}

        {/* Viz Picker Button */}
        {onVizPickerClick && (
          <button
            onClick={onVizPickerClick}
            style={{
              border: "2px solid var(--secondary-button-border, #d1d5db)",
              cursor: "pointer",
              padding: "8px 16px",
              borderRadius: "var(--radius-md, 8px)",
              backgroundColor: "var(--secondary-button-bg, #ffffff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "600",
              color: "var(--secondary-button-text, #374151)",
              transition: "all var(--transition-fast, 150ms) ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--secondary-button-hover-bg, #f9fafb)";
              e.currentTarget.style.borderColor = "var(--secondary-button-border, #d1d5db)";
              e.currentTarget.style.color = "var(--secondary-button-hover-text, #374151)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--secondary-button-bg, #ffffff)";
              e.currentTarget.style.borderColor = "var(--secondary-button-border, #d1d5db)";
              e.currentTarget.style.color = "var(--secondary-button-text, #374151)";
            }}
            title="Visualization Picker"
          >
            <span style={{ marginRight: "6px" }}>📊</span>
            Viz Picker
          </button>
        )}

        {showHelpButton && (
          <a
            href="https://developers.thoughtspot.com/docs/"
            target="_blank"
            rel="noopener noreferrer"
            title="Developer Documentation"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "2px solid",
              borderColor: "var(--secondary-button-border, #d1d5db)",
              backgroundColor: "transparent",
              cursor: "pointer",
              color: "inherit",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: "bold",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
            }}
          >
            ?
          </a>
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

            {/* Exit to demo picker */}
            <hr
              style={{
                margin: "8px 0",
                border: "none",
                borderTop: "1px solid #e2e8f0",
              }}
            />
            <button
              onClick={() => {
                window.location.href = "/";
              }}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#4a5568",
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
                  fontSize: "14px",
                }}
              >
                ←
              </div>
              <span>Exit to demo list</span>
            </button>

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
    {/* Horizontal nav bar — only rendered in top-nav mode */}
    {hasTopNav && (
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          borderTop: hideBorders ? "none" : "1px solid rgba(0,0,0,0.08)",
          overflowX: "auto",
          paddingLeft: "8px",
        }}
      >
        {navItems!.map((item) => {
          const isActive = pathname === item.route;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.route)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 16px",
                border: "none",
                borderBottom: isActive ? `2px solid ${foregroundColor}` : "2px solid transparent",
                background: "transparent",
                color: isActive ? foregroundColor : `${foregroundColor}99`,
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: isActive ? "600" : "400",
                whiteSpace: "nowrap",
                transition: "color var(--transition-fast, 150ms) ease, border-color var(--transition-fast, 150ms) ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = foregroundColor;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = `${foregroundColor}99`;
              }}
            >
              <MaterialIcon icon={item.icon} size={18} color="currentColor" />
              <span>{item.name}</span>
            </button>
          );
        })}
        {/* Settings link at end */}
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              marginLeft: "auto",
              border: "none",
              borderBottom: "2px solid transparent",
              background: "transparent",
              color: `${foregroundColor}99`,
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "400",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = foregroundColor; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = `${foregroundColor}99`; }}
          >
            <MaterialIcon icon="settings" size={18} color="currentColor" />
            <span>Settings</span>
          </button>
        )}
      </div>
    )}
  </div>
  );
}
