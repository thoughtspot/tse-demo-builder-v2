"use client";

import { useState, useEffect, useRef } from "react";
import {
  getImageFromIndexedDB,
  saveImageToIndexedDB,
  generateImageId,
} from "./ImageUpload";

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
  const [customPreview, setCustomPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchIcons = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          "https://api.github.com/repos/thoughtspot/tse-demo-builders-pre-built/contents/icons/spotter"
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch icons: ${response.statusText}`);
        }

        const data = await response.json();

        const customIcons = data
          .filter(
            (item: { name: string }) =>
              item.name.endsWith(".svg") && !item.name.includes("-preview-")
          )
          .map((item: { name: string }) => {
            const displayName = item.name
              .replace(/\.svg$/, "")
              .replace(/-\d+$/, "")
              .replace(/-/g, " ")
              .split(" ")
              .map(
                (word: string) => word.charAt(0).toUpperCase() + word.slice(1)
              )
              .join(" ");

            // Build preview URL (-preview- variant shown in UI) and actual URL (used by Spotter embed)
            const previewName = item.name.replace(
              /(\w+)-(\d+)\.svg/,
              "$1-preview-$2.svg"
            );
            const previewUrl = `https://cdn.jsdelivr.net/gh/thoughtspot/tse-demo-builders-pre-built/icons/spotter/${previewName}`;
            const originalUrl = `https://cdn.jsdelivr.net/gh/thoughtspot/tse-demo-builders-pre-built/icons/spotter/${item.name}`;

            return {
              name: item.name,
              displayName,
              url: originalUrl,
              previewUrl,
              filename: item.name,
            };
          });

        const processedIcons: SpotterIcon[] = [
          {
            name: "Default",
            displayName: "Default (No Custom Icon)",
            url: "",
            previewUrl: "",
            filename: "",
          },
          ...customIcons,
        ].sort((a: SpotterIcon, b: SpotterIcon) =>
          a.displayName.localeCompare(b.displayName)
        );

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

  // Resolve IndexedDB preview for uploaded images
  useEffect(() => {
    if (selectedIcon?.startsWith("indexeddb://")) {
      const id = selectedIcon.replace("indexeddb://", "");
      getImageFromIndexedDB(id)
        .then((data) => setCustomPreview(data))
        .catch(() => setCustomPreview(null));
    } else {
      setCustomPreview(null);
    }
  }, [selectedIcon]);

  const isIndexedDB = selectedIcon?.startsWith("indexeddb://");
  const isCustomImage =
    selectedIcon && !icons.find((icon) => icon.url === selectedIcon);

  const handleIconSelect = (icon: SpotterIcon) => {
    onIconSelect(icon.url);

    if (onMenuIconUpdate) {
      if (icon.url === "") {
        onMenuIconUpdate("/icons/spotter-custom.svg");
      } else {
        // Convert the actual URL to preview URL for menu display
        const menuIconUrl = icon.url.replace(
          /(\w+)-(\d+)\.svg/,
          "$1-preview-$2.svg"
        );
        onMenuIconUpdate(menuIconUrl);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    if (file.size > 1024 * 1024) {
      setUploadError("File too large (max 1 MB).");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const max = 128;
        const scale = Math.min(max / img.width, max / img.height, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const resized = canvas.toDataURL("image/png");
        const id = generateImageId();
        await saveImageToIndexedDB(id, resized);
        onIconSelect(`indexeddb://${id}`);
        if (onMenuIconUpdate) {
          onMenuIconUpdate(resized);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
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
          const isSelected = !isIndexedDB && selectedIcon === icon.url;

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

        {/* Custom uploaded image tile */}
        {isIndexedDB && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "12px 8px",
              border: "2px solid #3b82f6",
              borderRadius: "8px",
              backgroundColor: "#eff6ff",
              cursor: "default",
              minHeight: "80px",
              justifyContent: "center",
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
              {customPreview ? (
                <img
                  src={customPreview}
                  alt="Custom"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#e0e7ff",
                    borderRadius: "4px",
                    fontSize: "10px",
                    color: "#4338ca",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ...
                </div>
              )}
            </div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#1d4ed8",
                textAlign: "center",
                lineHeight: "1.2",
              }}
            >
              Custom
            </div>
          </div>
        )}
      </div>

      {/* Upload button */}
      <div
        style={{
          marginTop: "12px",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            padding: "5px 12px",
            fontSize: "13px",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            background: "transparent",
            color: "#374151",
            cursor: "pointer",
            outline: "none",
            whiteSpace: "nowrap",
          }}
        >
          Upload Image
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />
      </div>
      {uploadError && (
        <div style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>
          {uploadError}
        </div>
      )}

      {selectedIcon && !isIndexedDB && (
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
