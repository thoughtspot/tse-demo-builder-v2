"use client";

import React, { useState, useRef } from "react";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label: string;
  placeholder?: string;
  accept?: string;
  maxSizeMB?: number;
  maxWidth?: number;
  maxHeight?: number;
  useIndexedDB?: boolean; // New prop to enable IndexedDB storage
}

// IndexedDB utilities
const openImageDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ImageStorage", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images", { keyPath: "id" });
      }
    };
  });
};

const saveImageToIndexedDB = async (
  id: string,
  dataUrl: string
): Promise<void> => {
  const db = await openImageDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["images"], "readwrite");
    const store = transaction.objectStore("images");
    const request = store.put({ id, dataUrl, timestamp: Date.now() });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const getImageFromIndexedDB = async (id: string): Promise<string | null> => {
  try {
    const db = await openImageDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["images"], "readonly");
      const store = transaction.objectStore("images");
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result?.dataUrl || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn("Failed to get image from IndexedDB:", error);
    return null;
  }
};

const removeImageFromIndexedDB = async (id: string): Promise<void> => {
  try {
    const db = await openImageDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["images"], "readwrite");
      const store = transaction.objectStore("images");
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn("Failed to remove image from IndexedDB:", error);
  }
};

export default function ImageUpload({
  value,
  onChange,
  label,
  placeholder = "https://example.com/image.png",
  accept = "image/*",
  maxSizeMB = 0.5, // Default 500KB limit (much more conservative)
  maxWidth = 1200, // Default max width
  maxHeight = 800, // Default max height
  useIndexedDB = false, // Default to localStorage for backward compatibility
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate a unique ID for this image
  const generateImageId = (): string => {
    return `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Function to resize image
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw resized image
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to base64 with quality control - more aggressive compression
        const quality = 0.6; // 60% quality for better compression
        const dataUrl = canvas.toDataURL("image/jpeg", quality);

        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  // Function to check if data URL is too large
  const isDataUrlTooLarge = (dataUrl: string): boolean => {
    // Estimate size: base64 is ~33% larger than binary
    const sizeInBytes = Math.ceil((dataUrl.length * 3) / 4);
    const sizeInMB = sizeInBytes / (1024 * 1024);
    return sizeInMB > maxSizeMB;
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      // Check file size first
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSizeMB * 1.5) {
        // Allow 1.5x the limit for original file
        throw new Error(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      }

      // Resize and compress the image
      const resizedDataUrl = await resizeImage(file);

      // Check if the resized image is still too large
      if (isDataUrlTooLarge(resizedDataUrl)) {
        throw new Error(
          `Image is still too large after compression (${(
            (resizedDataUrl.length * 3) /
            4 /
            1024
          ).toFixed(1)}KB). Please use a smaller image or lower resolution.`
        );
      }

      // Additional safety check - if it's still over 400KB, reject it
      const finalSizeKB = (resizedDataUrl.length * 3) / 4 / 1024;
      if (finalSizeKB > 400) {
        throw new Error(
          `Image is still too large (${finalSizeKB.toFixed(
            1
          )}KB). Please use a smaller image.`
        );
      }

      if (useIndexedDB) {
        // Store in IndexedDB and return a reference
        const imageId = generateImageId();
        await saveImageToIndexedDB(imageId, resizedDataUrl);
        onChange(`indexeddb://${imageId}`);
      } else {
        // Use localStorage (original behavior)
        onChange(resizedDataUrl);
      }

      setIsUploading(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to upload image";
      setError(errorMessage);
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

  const handleRemoveImage = async () => {
    // If using IndexedDB, clean up the stored image
    if (useIndexedDB && value && value.startsWith("indexeddb://")) {
      const imageId = value.replace("indexeddb://", "");
      await removeImageFromIndexedDB(imageId);
    }

    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Function to get the actual image data for display
  const getImageData = async (imageRef: string): Promise<string | null> => {
    if (imageRef.startsWith("indexeddb://")) {
      const imageId = imageRef.replace("indexeddb://", "");
      return await getImageFromIndexedDB(imageId);
    }
    return imageRef;
  };

  // State for the actual image data to display
  const [displayImage, setDisplayImage] = useState<string | null>(null);

  // Load image data when value changes
  React.useEffect(() => {
    if (value) {
      getImageData(value).then(setDisplayImage);
    } else {
      setDisplayImage(null);
    }
  }, [value]);

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
      {displayImage && (
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
            {displayImage.startsWith("data:") ||
            displayImage.startsWith("http") ? (
              <img
                src={displayImage}
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
        Upload an image file (max {maxSizeMB}MB) or provide a URL. Large images
        will be automatically resized and compressed.
        {useIndexedDB && " Using IndexedDB for better storage capacity."}
      </p>
    </div>
  );
}
