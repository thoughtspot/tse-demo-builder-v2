"use client";

import { useState, useEffect, useRef } from "react";
import {
  getImageFromIndexedDB,
  saveImageToIndexedDB,
  generateImageId,
} from "./ImageUpload";

const REPO_OWNER = "thoughtspot";
const REPO_NAME = "tse-demo-builders-pre-built";
const TS_DEFAULT = "/ts.svg";

interface FaviconOption {
  id: string;
  label: string;
  url: string;
  previewUrl: string;
}

interface FaviconPickerProps {
  value?: string;
  onChange: (url: string) => void;
}

export default function FaviconPicker({ value, onChange }: FaviconPickerProps) {
  const [githubIcons, setGithubIcons] = useState<FaviconOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [customPreview, setCustomPreview] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const current = value || TS_DEFAULT;

  // Resolve IndexedDB preview for uploaded images
  useEffect(() => {
    if (current.startsWith("indexeddb://")) {
      const id = current.replace("indexeddb://", "");
      getImageFromIndexedDB(id)
        .then((data) => setCustomPreview(data))
        .catch(() => setCustomPreview(null));
    } else {
      setCustomPreview(null);
    }
  }, [current]);

  useEffect(() => {
    fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/icons/spotter`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "TSE-Demo-Builder",
        },
      }
    )
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then((data: { name: string }[]) => {
        const icons: FaviconOption[] = data
          .filter(
            (item) =>
              item.name.endsWith(".svg") && !item.name.includes("-preview-")
          )
          .map((item) => {
            const label = item.name
              .replace(/\.svg$/, "")
              .replace(/-\d+$/, "")
              .replace(/-/g, " ")
              .split(" ")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");
            const previewName = item.name.replace(
              /^(.+?)-(\d+)\.svg$/,
              "$1-preview-$2.svg"
            );
            const previewUrl = `https://cdn.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}/icons/spotter/${previewName}`;
            return {
              id: item.name,
              label,
              url: previewUrl,
              previewUrl,
            };
          });
        setGithubIcons(icons);
      })
      .catch((err) => setFetchError(err.message))
      .finally(() => setLoading(false));
  }, []);

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
        const max = 64;
        const scale = Math.min(max / img.width, max / img.height, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const resized = canvas.toDataURL("image/png");
        const id = generateImageId();
        await saveImageToIndexedDB(id, resized);
        onChange(`indexeddb://${id}`);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const allKnownUrls = new Set([TS_DEFAULT, ...githubIcons.map((i) => i.url)]);
  const isIndexedDB = current.startsWith("indexeddb://");
  const isCustomUrl =
    !isIndexedDB && !allKnownUrls.has(current) && current !== "";

  const renderTile = (
    id: string,
    url: string,
    previewUrl: string,
    label: string
  ) => {
    const isSelected = current === url;
    return (
      <button
        key={id}
        onClick={() => onChange(url)}
        title={label}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "5px",
          padding: "8px 4px",
          border: isSelected ? "2px solid #111827" : "1px solid #e5e7eb",
          borderRadius: "8px",
          background: isSelected ? "#f0f0f0" : "transparent",
          cursor: "pointer",
          outline: "none",
          transition: "border-color 0.15s ease, background 0.15s ease",
          minWidth: 0,
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.borderColor = "#9ca3af";
            e.currentTarget.style.background = "#f9fafb";
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.borderColor = "#e5e7eb";
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        <img
          src={previewUrl}
          alt={label}
          style={{ width: 32, height: 32, objectFit: "contain" }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.opacity = "0.25";
          }}
        />
        <span
          style={{
            fontSize: "11px",
            color: isSelected ? "#111827" : "#374151",
            textAlign: "center",
            lineHeight: "1.2",
            width: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </button>
    );
  };

  return (
    <div>
      <div
        style={{
          fontWeight: "500",
          fontSize: "14px",
          marginBottom: "10px",
          color: "var(--primary-text-color, #1f2937)",
        }}
      >
        Favicon
      </div>

      {loading && (
        <div
          style={{
            fontSize: "13px",
            color: "var(--secondary-text-color, #6b7280)",
            marginBottom: "10px",
          }}
        >
          Loading icons…
        </div>
      )}
      {fetchError && (
        <div
          style={{
            fontSize: "13px",
            color: "#ef4444",
            marginBottom: "10px",
          }}
        >
          Could not load icons: {fetchError}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        {renderTile("default", TS_DEFAULT, TS_DEFAULT, "ThoughtSpot")}
        {githubIcons.map((icon) =>
          renderTile(icon.id, icon.url, icon.previewUrl, icon.label)
        )}
        {(isIndexedDB || isCustomUrl) &&
          renderTile(
            "custom",
            current,
            isIndexedDB && customPreview ? customPreview : current,
            "Custom"
          )}
      </div>

      <div
        style={{
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
            border: "1px solid var(--border-color, #e5e7eb)",
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
          type="text"
          placeholder="or paste a URL…"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && urlInput.trim()) {
              onChange(urlInput.trim());
              setUrlInput("");
            }
          }}
          style={{
            flex: 1,
            minWidth: "140px",
            padding: "5px 10px",
            fontSize: "13px",
            border: "1px solid var(--border-color, #e5e7eb)",
            borderRadius: "6px",
            background: "transparent",
            color: "#374151",
            outline: "none",
          }}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />
      </div>
      {uploadError && (
        <div
          style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}
        >
          {uploadError}
        </div>
      )}
    </div>
  );
}
