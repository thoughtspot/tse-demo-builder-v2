"use client";

import { useState, useEffect, useRef } from "react";
import { useAppContext } from "../Layout";
import {
  ThoughtSpotEmbedInstance,
  HomePageConfig,
} from "../../types/thoughtspot";

// IndexedDB utilities for image handling
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

interface HomePageProps {
  config?: HomePageConfig;
  onConfigUpdate?: (config: HomePageConfig) => void;
}

interface ThoughtSpotContent {
  id: string;
  name: string;
  type: "liveboard" | "answer" | "model";
}

export default function HomePage({ config, onConfigUpdate }: HomePageProps) {
  const [iframeError, setIframeError] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const liveboardRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const spotterRef = useRef<HTMLDivElement>(null);

  // Always call the hook to follow React rules
  const context = useAppContext();

  // Use context if available, otherwise fall back to props
  let contextConfig: HomePageConfig | undefined;
  const contextUpdate: ((config: HomePageConfig) => void) | undefined =
    context.updateHomePageConfig;
  let appName = "TSE Demo Builder";

  // Get home page configuration from standard menus
  const homeMenu = context.standardMenus.find((m) => m.id === "home");
  if (homeMenu && homeMenu.homePageType) {
    // Map the homePageType to the correct HomePageConfig type
    let mappedType: "html" | "url" | "embed" = "html";
    if (
      homeMenu.homePageType === "html" ||
      homeMenu.homePageType === "url" ||
      homeMenu.homePageType === "embed"
    ) {
      mappedType = homeMenu.homePageType;
    } else if (homeMenu.homePageType === "iframe") {
      mappedType = "embed";
    } else {
      // For liveboard, answer, spotter, image - use embed type
      mappedType = "embed";
    }

    contextConfig = {
      type: mappedType,
      value: homeMenu.homePageValue || "",
    };
  } else {
    // Fallback to old homePageConfig if available
    contextConfig = context.homePageConfig;
  }
  appName = context.appConfig.applicationName || "TSE Demo Builder";

  // Use context config if available, otherwise use props, otherwise use default
  const homePageConfig = contextConfig ||
    config || {
      type: "html",
      value: `<div style='padding: 20px; text-align: center;'><h1>Welcome to ${appName}</h1><p>Configure your home page content in the settings.</p></div>`,
    };

  // ThoughtSpot content data - will be populated from API or fallback to mock data
  const [thoughtSpotContent, setThoughtSpotContent] = useState<
    ThoughtSpotContent[]
  >([]);

  // Fetch ThoughtSpot content on component mount
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { fetchAllThoughtSpotContent } = await import(
          "../../services/thoughtspotApi"
        );
        const { liveboards, answers, models } =
          await fetchAllThoughtSpotContent();

        const allContent = [
          ...liveboards.map(
            (item: {
              id: string;
              name: string;
              type: string;
              description?: string;
              authorName?: string;
              created?: number;
              modified?: number;
            }) => ({ ...item, type: "liveboard" as const })
          ),
          ...answers.map(
            (item: {
              id: string;
              name: string;
              type: string;
              description?: string;
              authorName?: string;
              created?: number;
              modified?: number;
            }) => ({ ...item, type: "answer" as const })
          ),
          ...models.map(
            (item: {
              id: string;
              name: string;
              type: string;
              description?: string;
              authorName?: string;
              created?: number;
              modified?: number;
            }) => ({ ...item, type: "model" as const })
          ),
        ];

        setThoughtSpotContent(allContent);
      } catch (error) {
        console.error("Failed to fetch ThoughtSpot content:", error);
        // Keep empty array on error
        setThoughtSpotContent([]);
      }
    };

    fetchContent();
  }, []);

  const handleIframeLoad = (event: React.SyntheticEvent<HTMLIFrameElement>) => {
    setIframeError(null);
  };

  const handleIframeError = () => {
    setIframeError(
      "Failed to load content. This may be due to Content Security Policy (CSP) restrictions or the site not allowing iframe embedding."
    );
  };

  // Effect to handle image loading from IndexedDB
  useEffect(() => {
    const loadImage = async () => {
      // Check if the value contains image data (either indexeddb:// or data:image)
      if (
        homePageConfig.value &&
        (homePageConfig.value.startsWith("indexeddb://") ||
          homePageConfig.value.startsWith("data:image"))
      ) {
        if (homePageConfig.value.startsWith("indexeddb://")) {
          const imageId = homePageConfig.value.replace("indexeddb://", "");
          const imageData = await getImageFromIndexedDB(imageId);
          setImageSrc(imageData);
        } else {
          setImageSrc(homePageConfig.value);
        }
      } else {
        setImageSrc(null);
      }
    };

    loadImage();
  }, [homePageConfig.value]);

  // Effect to handle ThoughtSpot embeds
  useEffect(() => {
    // Only run for embed type and when there's a value
    if (
      !homePageConfig.value ||
      !homePageConfig.value.trim() ||
      homePageConfig.type !== "embed"
    ) {
      return;
    }

    let embedInstance: ThoughtSpotEmbedInstance | null = null;

    const initEmbed = async () => {
      try {
        // Dynamically import ThoughtSpot SDK to avoid SSR issues
        const { LiveboardEmbed, SearchEmbed, SpotterEmbed } = await import(
          "@thoughtspot/visual-embed-sdk"
        );

        // Determine the content type from the original homePageType or from the value
        const homeMenu = context.standardMenus.find((m) => m.id === "home");
        const originalType = homeMenu?.homePageType;

        // Try to determine content type from original type or from value format
        let contentType = originalType;
        if (!contentType) {
          // Fallback: try to determine from value format
          if (homePageConfig.value.includes("liveboard")) {
            contentType = "liveboard";
          } else if (homePageConfig.value.includes("answer")) {
            contentType = "answer";
          } else if (homePageConfig.value.includes("spotter")) {
            contentType = "spotter";
          }
        }

        // Get current user's locale
        const currentUser = context.userConfig.users.find(
          (u) => u.id === context.userConfig.currentUserId
        );
        const userLocale = currentUser?.locale || "en";

        switch (contentType) {
          case "liveboard":
            if (liveboardRef.current) {
              embedInstance = new LiveboardEmbed(liveboardRef.current, {
                liveboardId: homePageConfig.value,
                locale: userLocale,
                frameParams: {
                  width: "100%",
                  height: "100%",
                },
              });
              if (embedInstance.render) {
                await embedInstance.render();
              }
            }
            break;

          case "answer":
            if (searchRef.current) {
              embedInstance = new SearchEmbed(searchRef.current, {
                answerId: homePageConfig.value,
                locale: userLocale,
                frameParams: {
                  width: "100%",
                  height: "600px",
                },
              });
              if (embedInstance.render) {
                await embedInstance.render();
              }
            }
            break;

          case "spotter":
            if (spotterRef.current) {
              embedInstance = new SpotterEmbed(spotterRef.current, {
                worksheetId: homePageConfig.value,
                locale: userLocale,
                frameParams: {
                  width: "100%",
                  height: "600px",
                },
              });
              if (embedInstance.render) {
                await embedInstance.render();
              }
            }
            break;
        }
      } catch (error) {
        console.error("Failed to initialize ThoughtSpot embed:", error);
        setIframeError("Failed to load ThoughtSpot content");
      }
    };

    initEmbed();

    // Cleanup function
    return () => {
      if (embedInstance && typeof embedInstance.destroy === "function") {
        embedInstance.destroy();
      }
    };
  }, [
    context.appConfig.thoughtspotUrl, // Add cluster URL to dependencies
    context.lastClusterChangeTime, // Add cluster change timestamp to dependencies
    context.configVersion, // Add config version to force re-initialization on config changes
    homePageConfig.type,
    homePageConfig.value,
    context.userConfig.currentUserId,
    context.userConfig.users,
  ]);

  // Additional cleanup effect for when content becomes empty
  useEffect(() => {
    if (!homePageConfig.value || !homePageConfig.value.trim()) {
      // Clear any iframe errors when content is empty
      setIframeError(null);
    }
  }, [homePageConfig.value]);

  const renderContent = () => {
    // Check if this is image content based on the value
    if (
      imageSrc ||
      (homePageConfig.value &&
        (homePageConfig.value.startsWith("indexeddb://") ||
          homePageConfig.value.startsWith("data:image")))
    ) {
      if (imageSrc) {
        return (
          <div style={{ textAlign: "center" }}>
            <img
              src={imageSrc}
              alt="Uploaded content"
              style={{
                maxWidth: "100%",
                maxHeight: "600px",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            />
          </div>
        );
      }
      return (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            backgroundColor: "#f7fafc",
            borderRadius: "8px",
            border: "2px dashed #cbd5e0",
          }}
        >
          <p style={{ color: "#4a5568", margin: 0 }}>No image uploaded</p>
        </div>
      );
    }

    switch (homePageConfig.type) {
      case "html":
        if (homePageConfig.value && homePageConfig.value.trim()) {
          return (
            <div
              dangerouslySetInnerHTML={{ __html: homePageConfig.value }}
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                height: "100%",
                overflow: "auto",
              }}
            />
          );
        }
        return (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              backgroundColor: "#f7fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            }}
          >
            <h2 style={{ margin: "0 0 16px 0", color: "#2d3748" }}>
              📝 HTML Content
            </h2>
            <p style={{ margin: "0 0 20px 0", color: "#4a5568" }}>
              Configure HTML content in the settings to display custom content
              on your home page.
            </p>
            <div
              style={{
                padding: "16px",
                backgroundColor: "#f0f9ff",
                border: "1px solid #0ea5e9",
                borderRadius: "6px",
                color: "#0369a1",
                fontSize: "14px",
              }}
            >
              <strong>Example:</strong> You can add custom HTML, CSS, and
              JavaScript to create personalized content.
            </div>
          </div>
        );

      case "url":
        if (homePageConfig.value && homePageConfig.value.trim()) {
          return (
            <div style={{ width: "100%", height: "100%", flex: 1 }}>
              {iframeError ? (
                <div
                  style={{
                    padding: "20px",
                    backgroundColor: "#fed7d7",
                    border: "1px solid #feb2b2",
                    borderRadius: "8px",
                    color: "#c53030",
                  }}
                >
                  <h3 style={{ margin: "0 0 10px 0" }}>⚠️ Embedding Error</h3>
                  <p style={{ margin: 0 }}>{iframeError}</p>
                  <p style={{ margin: "10px 0 0 0", fontSize: "14px" }}>
                    URL: <code>{homePageConfig.value}</code>
                  </p>
                </div>
              ) : (
                <iframe
                  src={homePageConfig.value}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  title="Embedded content"
                />
              )}
            </div>
          );
        }
        return (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              backgroundColor: "#f7fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            }}
          >
            <h2 style={{ margin: "0 0 16px 0", color: "#2d3748" }}>
              🌐 Website Embed
            </h2>
            <p style={{ margin: "0 0 20px 0", color: "#4a5568" }}>
              Configure a website URL in the settings to embed external content
              on your home page.
            </p>
            <div
              style={{
                padding: "16px",
                backgroundColor: "#f0f9ff",
                border: "1px solid #0ea5e9",
                borderRadius: "6px",
                color: "#0369a1",
                fontSize: "14px",
              }}
            >
              <strong>Note:</strong> The website must allow iframe embedding for
              this to work properly.
            </div>
          </div>
        );

      case "embed":
        if (homePageConfig.value && homePageConfig.value.trim()) {
          const liveboardContent = thoughtSpotContent.find(
            (c) => c.id === homePageConfig.value && c.type === "liveboard"
          );
          return (
            <div style={{ width: "100%", height: "100%", flex: 1 }}>
              {iframeError ? (
                <div
                  style={{
                    padding: "20px",
                    backgroundColor: "#fed7d7",
                    border: "1px solid #feb2b2",
                    borderRadius: "8px",
                    color: "#c53030",
                  }}
                >
                  <h3 style={{ margin: "0 0 10px 0" }}>⚠️ Liveboard Error</h3>
                  <p style={{ margin: 0 }}>{iframeError}</p>
                </div>
              ) : (
                <div
                  key={`home-liveboard-embed-${
                    context.appConfig.thoughtspotUrl
                  }-${context.lastClusterChangeTime}-${JSON.stringify(
                    context.stylingConfig.embeddedContent
                  )}`}
                  ref={liveboardRef}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                />
              )}
            </div>
          );
        }
        return (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              backgroundColor: "#f7fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            }}
          >
            <h2 style={{ margin: "0 0 16px 0", color: "#2d3748" }}>
              📊 Liveboard
            </h2>
            <p style={{ margin: "0 0 20px 0", color: "#4a5568" }}>
              Select a liveboard in the settings to display it on your home
              page.
            </p>
            {thoughtSpotContent.filter((c) => c.type === "liveboard").length ===
              0 && (
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #f87171",
                  borderRadius: "6px",
                  color: "#dc2626",
                  marginBottom: "20px",
                }}
              >
                No liveboards found in your ThoughtSpot instance.
              </div>
            )}
            <div
              style={{
                padding: "16px",
                backgroundColor: "#f0f9ff",
                border: "1px solid #0ea5e9",
                borderRadius: "6px",
                color: "#0369a1",
                fontSize: "14px",
              }}
            >
              <strong>Tip:</strong> Liveboards provide interactive dashboards
              with multiple visualizations.
            </div>
          </div>
        );

      default:
        return (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              backgroundColor: "#f7fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            }}
          >
            <p style={{ color: "#4a5568", margin: 0 }}>
              Please configure home page content
            </p>
          </div>
        );
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {renderContent()}
      </div>
    </div>
  );
}
