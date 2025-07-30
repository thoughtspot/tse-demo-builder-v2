"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label: string;
  placeholder?: string;
  accept?: string;
}

export default function ImageUpload({
  value,
  onChange,
  label,
  placeholder = "https://example.com/image.png",
  accept = "image/*",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      // In a real application, you would upload to a server
      // For now, we'll create a data URL for demonstration
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange(result);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Failed to upload image");
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleRemoveImage = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <label
        style={{
          display: "block",
          marginBottom: "4px",
          fontWeight: "500",
          fontSize: "14px",
        }}
      >
        {label}
      </label>

      {/* Image Preview */}
      {value && (
        <div
          style={{
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f9fafb",
            }}
          >
            {value.startsWith("data:") || value.startsWith("http") ? (
              <Image
                src={value}
                alt="Preview"
                width={60}
                height={60}
                style={{ objectFit: "contain" }}
              />
            ) : (
              <span style={{ fontSize: "12px", color: "#6b7280" }}>
                Invalid URL
              </span>
            )}
          </div>
          <button
            onClick={handleRemoveImage}
            style={{
              padding: "4px 8px",
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Remove
          </button>
        </div>
      )}

      {/* Upload Controls */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          style={{
            padding: "8px 12px",
            backgroundColor: isUploading ? "#9ca3af" : "#3182ce",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isUploading ? "not-allowed" : "pointer",
            fontSize: "14px",
            whiteSpace: "nowrap",
          }}
        >
          {isUploading ? "Uploading..." : "Upload Image"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
      </div>

      {/* URL Input */}
      <input
        type="url"
        value={value || ""}
        onChange={handleUrlChange}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "8px 12px",
          border: "1px solid #d1d5db",
          borderRadius: "4px",
          fontSize: "14px",
        }}
      />

      {error && (
        <p
          style={{
            margin: "4px 0 0 0",
            fontSize: "12px",
            color: "#dc2626",
          }}
        >
          {error}
        </p>
      )}

      <p
        style={{
          margin: "4px 0 0 0",
          fontSize: "12px",
          color: "#6b7280",
        }}
      >
        Upload an image file or provide a URL
      </p>
    </div>
  );
}
