"use client";

import { useState, useEffect } from "react";

interface SpotterIcon {
  name: string;
  displayName: string;
  url: string;
  previewUrl: string;
  filename: string;
}

interface SpotterIconPickerProps {
  selectedIcon?: string;
  onIconSelect: (iconUrl: string) => void;
  onMenuIconUpdate?: (iconUrl: string) => void;
  title?: string;
  description?: string;
}

export default function SpotterIconPicker({
  selectedIcon,
  onIconSelect,
  onMenuIconUpdate,
  title = "Spotter Icon Selection",
  description = "Choose an icon for your Spotter embed",
}: SpotterIconPickerProps) {
  const [icons, setIcons] = useState<SpotterIcon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIcons = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch the list of icons from GitHub API
        const response = await fetch(
          "https://api.github.com/repos/thoughtspot/tse-demo-builders-pre-built/contents/icons/spotter"
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch icons: ${response.statusText}`);
        }

        const data = await response.json();

        // Process the icons - exclude preview files from the selectable list
        const customIcons = data
          .filter(
            (item: { name: string }) =>
              item.name.endsWith(".svg") && !item.name.includes("-preview-")
          )
          .map((item: { name: string }) => {
            // Convert filename to display name
            // Remove .svg extension and version numbers (-01, -02, etc.)
            const displayName = item.name
              .replace(/\.svg$/, "")
              .replace(/-\d+$/, "")
              .replace(/-/g, " ")
              .split(" ")
              .map(
                (word: string) => word.charAt(0).toUpperCase() + word.slice(1)
              )
              .join(" ");

            // Create preview URL for standalone version and original URL for embed
            // Convert "generic-02.svg" to "generic-preview-02.svg"
            const previewName = item.name.replace(
              /(\w+)-(\d+)\.svg/,
              "$1-preview-$2.svg"
            );
            const previewUrl = `https://cdn.jsdelivr.net/gh/thoughtspot/tse-demo-builders-pre-built/icons/spotter/${previewName}`;
            const originalUrl = `https://cdn.jsdelivr.net/gh/thoughtspot/tse-demo-builders-pre-built/icons/spotter/${item.name}`;

            return {
              name: item.name,
              displayName,
              url: originalUrl, // This will be used for the actual embed configuration
              previewUrl: previewUrl, // This will be used for display in the picker
              filename: item.name,
            };
          });

        const processedIcons: SpotterIcon[] = [
          // Add a default "None" option first
          {
            name: "Default",
            displayName: "Default (No Custom Icon)",
            url: "", // Empty URL means no custom icon
            previewUrl: "", // No preview for default
          },
          ...customIcons,
        ].sort((a: SpotterIcon, b: SpotterIcon) =>
          a.displayName.localeCompare(b.displayName)
        );

        console.log("Processed icons:", processedIcons);
        setIcons(processedIcons);
      } catch (err) {
        console.error("Failed to fetch Spotter icons:", err);
        setError(err instanceof Error ? err.message : "Failed to load icons");
      } finally {
        setLoading(false);
      }
    };

    fetchIcons();
  }, []);

  // Check if current selectedIcon is a custom image (not one of our predefined icons)
  const isCustomImage =
    selectedIcon && !icons.find((icon) => icon.url === selectedIcon);
  const isImageValue =
    selectedIcon && selectedIcon.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i);

  const handleIconSelect = (icon: SpotterIcon) => {
    onIconSelect(icon.url);

    // Also update the navigation menu icon if callback is provided
    if (onMenuIconUpdate) {
      if (icon.url === "") {
        // Default option - use the default spotter icon
        onMenuIconUpdate("/icons/spotter-custom.svg");
      } else {
        // Convert the original URL to preview URL for menu display
        const menuIconUrl = icon.url.replace(
          /(\w+)-(\d+)\.svg/,
          "$1-preview-$2.svg"
        );
        onMenuIconUpdate(menuIconUrl);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div style={{ color: "#6b7280", fontSize: "14px" }}>
          Loading available icons...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#fed7d7",
            border: "1px solid #feb2b2",
            borderRadius: "6px",
            color: "#c53030",
            fontSize: "14px",
          }}
        >
          <strong>Error loading icons:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h4
        style={{
          fontSize: "16px",
          fontWeight: "600",
          marginBottom: "8px",
          color: "#1f2937",
        }}
      >
        {title}
      </h4>
      <p
        style={{
          fontSize: "14px",
          color: "#6b7280",
          marginBottom: "16px",
        }}
      >
        {description}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "8px",
          maxWidth: "100%",
        }}
      >
        {icons.map((icon) => {
          const isSelected = selectedIcon === icon.url;

          return (
            <div
              key={icon.name}
              onClick={() => handleIconSelect(icon)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "12px 8px",
                border: isSelected ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                borderRadius: "8px",
                backgroundColor: isSelected ? "#eff6ff" : "white",
                cursor: "pointer",
                transition: "all 0.2s ease",
                minHeight: "80px",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = "#f9fafb";
                  e.currentTarget.style.borderColor = "#d1d5db";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = "white";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {icon.previewUrl ? (
                  <img
                    src={icon.previewUrl}
                    alt={icon.displayName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                    onError={(e) => {
                      // Fallback to letter if preview image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div style="background-color: #f3f4f6; border-radius: 4px; font-size: 10px; color: #6b7280; font-weight: bold; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">${
                          icon.name.includes("generic") ? "G" : "S"
                        }</div>`;
                      }
                    }}
                  />
                ) : (
                  // Default option - show a "no icon" indicator
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "#f3f4f6",
                      borderRadius: "4px",
                      fontSize: "10px",
                      color: "#6b7280",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    —
                  </div>
                )}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: isSelected ? "600" : "500",
                  color: isSelected ? "#1d4ed8" : "#374151",
                  textAlign: "center",
                  lineHeight: "1.2",
                  wordBreak: "break-word",
                }}
              >
                {icon.displayName}
              </div>
            </div>
          );
        })}
      </div>

      {selectedIcon && (
        <div
          style={{
            marginTop: "12px",
            padding: "8px 12px",
            backgroundColor: isCustomImage ? "#fef3c7" : "#f0f9ff",
            border: `1px solid ${isCustomImage ? "#f59e0b" : "#0ea5e9"}`,
            borderRadius: "6px",
            fontSize: "14px",
            color: isCustomImage ? "#92400e" : "#0369a1",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {isCustomImage && isImageValue ? (
              <img
                src={
                  selectedIcon.startsWith("data:")
                    ? selectedIcon
                    : `/icons/${selectedIcon}`
                }
                alt="Custom icon"
                style={{
                  width: 24,
                  height: 24,
                  objectFit: "contain",
                }}
                onError={(e) => {
                  // Fallback if custom image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div style="background-color: #f3f4f6; border-radius: 4px; font-size: 10px; color: #6b7280; font-weight: bold; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;">?</div>`;
                  }
                }}
              />
            ) : null}
            <div>
              <strong>Selected:</strong>{" "}
              {isCustomImage
                ? "Custom Image"
                : icons.find((icon) => icon.url === selectedIcon)
                    ?.displayName || "Custom icon"}
              {isCustomImage && (
                <div
                  style={{ fontSize: "12px", marginTop: "4px", opacity: 0.8 }}
                >
                  This custom image was selected from the style configuration
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
