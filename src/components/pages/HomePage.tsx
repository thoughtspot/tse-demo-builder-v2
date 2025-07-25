"use client";

import { useState, useEffect, useRef } from "react";
import { useAppContext } from "../Layout";

interface HomePageConfig {
  type: "image" | "html" | "iframe" | "liveboard" | "answer" | "spotter";
  value: string;
}

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
  const liveboardRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const spotterRef = useRef<HTMLDivElement>(null);

  // Use context if available, otherwise fall back to props
  let contextConfig: HomePageConfig | undefined;
  let contextUpdate: ((config: HomePageConfig) => void) | undefined;
  let appName = "TSE Demo Builder";

  try {
    const context = useAppContext();
    // Get home page configuration from standard menus
    const homeMenu = context.standardMenus.find((m) => m.id === "home");
    if (homeMenu && homeMenu.homePageType) {
      contextConfig = {
        type: homeMenu.homePageType,
        value: homeMenu.homePageValue || "",
      };
    } else {
      // Fallback to old homePageConfig if available
      contextConfig = context.homePageConfig;
    }
    contextUpdate = context.updateHomePageConfig;
    appName = context.appConfig.applicationName || "TSE Demo Builder";
  } catch (error) {
    // Context not available, use props
  }

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

  // Effect to handle ThoughtSpot embeds
  useEffect(() => {
    // Only run for ThoughtSpot content types and when there's a value
    if (
      !homePageConfig.value ||
      !homePageConfig.value.trim() ||
      !["liveboard", "answer", "spotter"].includes(homePageConfig.type)
    ) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let embedInstance: any = null;

    const initEmbed = async () => {
      try {
        // Dynamically import ThoughtSpot SDK to avoid SSR issues
        const { LiveboardEmbed, SearchEmbed, SpotterEmbed } = await import(
          "@thoughtspot/visual-embed-sdk"
        );

        switch (homePageConfig.type) {
          case "liveboard":
            if (liveboardRef.current) {
              embedInstance = new LiveboardEmbed(liveboardRef.current, {
                liveboardId: homePageConfig.value,
                frameParams: {
                  width: "100%",
                  height: "100%",
                },
              });
              await embedInstance.render();
            }
            break;

          case "answer":
            if (searchRef.current) {
              embedInstance = new SearchEmbed(searchRef.current, {
                answerId: homePageConfig.value,
                frameParams: {
                  width: "100%",
                  height: "600px",
                },
              });
              await embedInstance.render();
            }
            break;

          case "spotter":
            if (spotterRef.current) {
              embedInstance = new SpotterEmbed(spotterRef.current, {
                worksheetId: homePageConfig.value,
                frameParams: {
                  width: "100%",
                  height: "600px",
                },
              });
              await embedInstance.render();
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
  }, [homePageConfig.type, homePageConfig.value]);

  // Additional cleanup effect for when content becomes empty
  useEffect(() => {
    if (!homePageConfig.value || !homePageConfig.value.trim()) {
      // Clear any iframe errors when content is empty
      setIframeError(null);
    }
  }, [homePageConfig.value]);

  const renderContent = () => {
    switch (homePageConfig.type) {
      case "image":
        if (homePageConfig.value) {
          return (
            <div style={{ textAlign: "center" }}>
              <img
                src={homePageConfig.value}
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
                minHeight: "200px",
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

      case "iframe":
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
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
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

      case "liveboard":
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
                  ref={liveboardRef}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
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

      case "answer":
        if (homePageConfig.value && homePageConfig.value.trim()) {
          const answerContent = thoughtSpotContent.find(
            (c) => c.id === homePageConfig.value && c.type === "answer"
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
                  <h3 style={{ margin: "0 0 10px 0" }}>⚠️ Answer Error</h3>
                  <p style={{ margin: 0 }}>{iframeError}</p>
                </div>
              ) : (
                <div
                  ref={searchRef}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
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
              📈 Answer
            </h2>
            <p style={{ margin: "0 0 20px 0", color: "#4a5568" }}>
              Select an answer in the settings to display it on your home page.
            </p>
            {thoughtSpotContent.filter((c) => c.type === "answer").length ===
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
                No answers found in your ThoughtSpot instance.
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
              <strong>Tip:</strong> Answers provide single visualizations with
              focused insights.
            </div>
          </div>
        );

      case "spotter":
        if (homePageConfig.value && homePageConfig.value.trim()) {
          const spotterContent = thoughtSpotContent.find(
            (c) => c.id === homePageConfig.value && c.type === "model"
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
                  <h3 style={{ margin: "0 0 10px 0" }}>⚠️ Spotter Error</h3>
                  <p style={{ margin: 0 }}>{iframeError}</p>
                </div>
              ) : (
                <div
                  ref={spotterRef}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
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
              🔍 Spotter Model
            </h2>
            <p style={{ margin: "0 0 20px 0", color: "#4a5568" }}>
              Select a Spotter model in the settings to display it on your home
              page.
            </p>
            {thoughtSpotContent.filter((c) => c.type === "model").length ===
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
                No models found in your ThoughtSpot instance.
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
              <strong>Tip:</strong> Spotter models provide AI-powered data
              exploration and insights.
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
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {renderContent()}
      </div>
    </div>
  );
}
