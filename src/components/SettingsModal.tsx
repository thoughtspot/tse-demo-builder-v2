"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import HomePage from "./pages/HomePage";
import FavoritesPage from "./pages/FavoritesPage";
import MyReportsPage from "./pages/MyReportsPage";
import SpotterPage from "./pages/SpotterPage";
import SearchPage from "./pages/SearchPage";
import FullAppPage from "./pages/FullAppPage";
import ReportsPage from "./pages/ReportsPage";
import IconPicker from "./IconPicker";
import MaterialIcon from "./MaterialIcon";
import ColorPicker from "./ColorPicker";
import ImageUpload from "./ImageUpload";
import StringMappingEditor from "./StringMappingEditor";
import CSSVariablesEditor from "./CSSVariablesEditor";
import CSSRulesEditor from "./CSSRulesEditor";
import EmbedFlagsEditor from "./EmbedFlagsEditor";
import DoubleClickEditor from "./DoubleClickEditor";
import {
  User,
  UserConfig,
  HiddenActionsConfig,
  SavedConfiguration,
} from "../types/thoughtspot";
import HiddenActionsEditor from "./HiddenActionsEditor";
import TagFilterComponent from "./TagFilterComponent";
import SearchableDropdown from "./SearchableDropdown";
import {
  fetchSavedConfigurations,
  loadConfigurationFromGitHub,
} from "../services/githubApi";

// Import StandardMenu from Layout to avoid duplication
import { StandardMenu } from "./Layout";

interface HomePageConfig {
  type: "image" | "html" | "iframe" | "liveboard" | "answer" | "spotter";
  value: string;
}

interface AppConfig {
  thoughtspotUrl: string;
  applicationName: string;
  logo: string;
  earlyAccessFlags: string;
  favicon?: string;
  showFooter: boolean;
}

interface FullAppConfig {
  showPrimaryNavbar: boolean;
  hideHomepageLeftNav: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  standardMenus: StandardMenu[];
  updateStandardMenu: (
    id: string,
    field: string,
    value: string | boolean
  ) => void;
  homePageConfig: HomePageConfig;
  updateHomePageConfig: (config: HomePageConfig) => void;
  appConfig: AppConfig;
  updateAppConfig: (config: AppConfig) => void;
  fullAppConfig: FullAppConfig;
  updateFullAppConfig: (config: FullAppConfig) => void;
  customMenus: CustomMenu[];
  addCustomMenu: (menu: CustomMenu) => void;
  updateCustomMenu: (id: string, menu: CustomMenu) => void;
  deleteCustomMenu: (id: string) => void;
  stylingConfig: StylingConfig;
  updateStylingConfig: (config: StylingConfig) => void;
  userConfig: UserConfig;
  updateUserConfig: (config: UserConfig) => void;
  setMenuOrder?: (order: string[]) => void;
  clearAllConfigurations?: () => void;
  exportConfiguration?: (customName?: string) => void;
  importConfiguration?: (file: File) => Promise<{
    success: boolean;
    error?: string;
  }>;
  initialTab?: string;
  initialSubTab?: string;
  onTabChange?: (tab: string, subTab?: string) => void;
}

interface Tab {
  id: string;
  name: string;
  content: React.ReactNode;
}

interface CustomMenu {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  contentSelection: {
    type: "specific" | "tag";
    specificContent?: {
      liveboards: string[];
      answers: string[];
    };
    tagIdentifiers?: string[];
  };
}

interface StylingConfig {
  application: {
    topBar: {
      backgroundColor: string;
      foregroundColor: string;
      logoUrl?: string;
    };
    sidebar: {
      backgroundColor: string;
      foregroundColor: string;
    };
    footer: {
      backgroundColor: string;
      foregroundColor: string;
    };
    dialogs: {
      backgroundColor: string;
      foregroundColor: string;
    };
  };
  embeddedContent: {
    strings: Record<string, string>;
    stringIDs: Record<string, string>;
    cssUrl?: string;
    customCSS: {
      variables?: Record<string, string>;
      rules_UNSTABLE?: Record<string, Record<string, string>>;
    };
  };
  embedFlags?: {
    spotterEmbed?: Record<string, unknown>;
    liveboardEmbed?: Record<string, unknown>;
    searchEmbed?: Record<string, unknown>;
    appEmbed?: Record<string, unknown>;
  };
  doubleClickHandling?: {
    enabled: boolean;
    showDefaultModal: boolean;
    customJavaScript?: string;
    modalTitle?: string;
  };
}

// Add this component before the StandardMenusContent function
function ModelSearchInput({
  onApply,
  placeholder = "Search models...",
}: {
  onApply: (value: string) => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const value = inputRef.current?.value || "";
      onApply(value);
    }
  };

  return (
    <div style={{ position: "relative", marginBottom: "8px" }}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        defaultValue=""
        onKeyPress={handleKeyPress}
        style={{
          width: "100%",
          padding: "8px 12px",
          paddingRight: "32px",
          border: "1px solid #d1d5db",
          borderRadius: "4px",
          fontSize: "14px",
        }}
      />
      <button
        onClick={() => {
          const value = inputRef.current?.value || "";
          onApply(value);
        }}
        style={{
          position: "absolute",
          right: "4px",
          top: "50%",
          transform: "translateY(-50%)",
          padding: "4px 8px",
          backgroundColor: "transparent",
          color: "#6b7280",
          border: "none",
          cursor: "pointer",
          fontSize: "12px",
          borderRadius: "2px",
        }}
        title="Press Enter or click to search"
      >
        ↵
      </button>
    </div>
  );
}

// Search query input with enter functionality and no preview updates while typing
function SearchQueryInput({
  value,
  onChange,
  placeholder,
  onCommit,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onCommit?: (value: string) => void;
}) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleCommit = () => {
    onChange(localValue);
    onCommit?.(localValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCommit();
    }
  };

  const handleBlur = () => {
    handleCommit();
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyPress={handleKeyPress}
        onBlur={handleBlur}
        style={{
          width: "100%",
          padding: "8px 12px",
          paddingRight: "32px",
          border: "1px solid #d1d5db",
          borderRadius: "4px",
          fontSize: "14px",
        }}
      />
      <button
        onClick={handleCommit}
        style={{
          position: "absolute",
          right: "4px",
          top: "50%",
          transform: "translateY(-50%)",
          padding: "4px 8px",
          backgroundColor: "transparent",
          color: "#6b7280",
          border: "none",
          cursor: "pointer",
          fontSize: "12px",
          borderRadius: "2px",
        }}
        title="Press Enter or click to apply"
      >
        ↵
      </button>
    </div>
  );
}

function StandardMenusContent({
  standardMenus,
  updateStandardMenu,
  initialSubTab,
  fullAppConfig,
  updateFullAppConfig,
  onSubTabChange,
}: {
  standardMenus: StandardMenu[];
  updateStandardMenu: (
    id: string,
    field: string,
    value: string | boolean
  ) => void;
  initialSubTab?: string;
  fullAppConfig: FullAppConfig;
  updateFullAppConfig: (config: FullAppConfig) => void;
  onSubTabChange?: (subTab: string) => void;
}) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "home");
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

  const [modelOptions, setModelOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [worksheetOptions, setWorksheetOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [combinedOptions, setCombinedOptions] = useState<
    Array<{ id: string; name: string; type: string }>
  >([]);
  const [thoughtSpotContent, setThoughtSpotContent] = useState<
    Array<{ id: string; name: string; type: string }>
  >([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingWorksheets, setIsLoadingWorksheets] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [worksheetsError, setWorksheetsError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);

  // Fetch models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoadingModels(true);
        setModelsError(null);
        const { fetchModels } = await import("../services/thoughtspotApi");
        const modelsData = await fetchModels();
        setModelOptions(
          modelsData.map((model) => ({ id: model.id, name: model.name }))
        );
      } catch (error) {
        console.error("Failed to fetch models:", error);
        setModelsError("Failed to load models");
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, []);

  // Fetch worksheets on component mount
  useEffect(() => {
    const fetchWorksheets = async () => {
      try {
        setIsLoadingWorksheets(true);
        setWorksheetsError(null);
        const { fetchWorksheets } = await import("../services/thoughtspotApi");
        const worksheetsData = await fetchWorksheets();
        setWorksheetOptions(
          worksheetsData.map((worksheet) => ({
            id: worksheet.id,
            name: worksheet.name,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch worksheets:", error);
        setWorksheetsError("Failed to load worksheets");
      } finally {
        setIsLoadingWorksheets(false);
      }
    };

    fetchWorksheets();
  }, []);

  // Fetch ThoughtSpot content (liveboards, answers, models) for home page configuration
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoadingContent(true);
        setContentError(null);
        const { fetchAllThoughtSpotContent } = await import(
          "../services/thoughtspotApi"
        );
        const { liveboards, answers, models } =
          await fetchAllThoughtSpotContent();

        const allContent = [
          ...liveboards.map((item: { id: string; name: string }) => ({
            ...item,
            type: "liveboard",
          })),
          ...answers.map((item: { id: string; name: string }) => ({
            ...item,
            type: "answer",
          })),
          ...models.map((item: { id: string; name: string }) => ({
            ...item,
            type: "model",
          })),
        ];

        setThoughtSpotContent(allContent);
      } catch (error) {
        console.error("Failed to fetch ThoughtSpot content:", error);
        setContentError("Failed to load ThoughtSpot content");
        // Fallback to mock data
        setThoughtSpotContent([
          { id: "lb_001", name: "Sales Dashboard", type: "liveboard" },
          { id: "lb_002", name: "Marketing Analytics", type: "liveboard" },
          { id: "ans_001", name: "Monthly Revenue Trend", type: "answer" },
          { id: "ans_002", name: "Customer Acquisition Cost", type: "answer" },
          { id: "model_001", name: "Sales Model", type: "model" },
          { id: "model_002", name: "Marketing Model", type: "model" },
        ]);
      } finally {
        setIsLoadingContent(false);
      }
    };

    fetchContent();
  }, []);

  // Fetch tags on component mount
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setIsLoadingTags(true);
        setTagsError(null);
        const { fetchTags } = await import("../services/thoughtspotApi");
        const tagsData = await fetchTags();
        setAvailableTags(tagsData);
      } catch (error) {
        console.error("Failed to fetch tags:", error);
        setTagsError("Failed to load tags");
      } finally {
        setIsLoadingTags(false);
      }
    };

    fetchTags();
  }, []);

  // Combine models and worksheets into a single list (treating worksheets as models)
  useEffect(() => {
    // Create a map to track unique items by ID
    const uniqueMap = new Map();

    // Add models first
    modelOptions.forEach((option) => {
      uniqueMap.set(option.id, { ...option, type: "Model" });
    });

    // Add worksheets, but only if not already present (models take precedence)
    worksheetOptions.forEach((option) => {
      if (!uniqueMap.has(option.id)) {
        uniqueMap.set(option.id, { ...option, type: "Model" });
      }
    });

    // Convert map values to array and sort
    const combined = Array.from(uniqueMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    setCombinedOptions(combined);
  }, [modelOptions, worksheetOptions]);

  // Remove debounce - only use Apply button to prevent preview updates

  // Icon picker state is no longer needed for the new IconPicker component

  const getPageComponent = (menuId: string) => {
    switch (menuId) {
      case "home":
        return <HomePage />;
      case "favorites":
        return <FavoritesPage />;
      case "my-reports":
        return <MyReportsPage />;
      case "spotter":
        const spotterMenu = standardMenus.find((m) => m.id === "spotter");
        return (
          <SpotterPage
            spotterModelId={spotterMenu?.spotterModelId}
            spotterSearchQuery={spotterMenu?.spotterSearchQuery}
          />
        );
      case "search":
        const searchMenu = standardMenus.find((m) => m.id === "search");
        return (
          <SearchPage
            searchDataSource={searchMenu?.searchDataSource}
            searchTokenString={searchMenu?.searchTokenString}
            runSearch={searchMenu?.runSearch}
          />
        );
      case "full-app":
        return <FullAppPage />;
      default:
        return <div>Page not found</div>;
    }
  };

  const subTabs = [
    {
      id: "home",
      name: "Home",
      icon: standardMenus.find((m) => m.id === "home")?.icon || "🏠",
    },
    {
      id: "favorites",
      name: "Favorites",
      icon: standardMenus.find((m) => m.id === "favorites")?.icon || "⭐",
    },
    {
      id: "my-reports",
      name: "My Reports",
      icon: standardMenus.find((m) => m.id === "my-reports")?.icon || "📊",
    },
    {
      id: "spotter",
      name: "Spotter",
      icon: standardMenus.find((m) => m.id === "spotter")?.icon || "🔍",
    },
    {
      id: "search",
      name: "Search",
      icon: standardMenus.find((m) => m.id === "search")?.icon || "🔎",
    },
    {
      id: "full-app",
      name: "Full App",
      icon: standardMenus.find((m) => m.id === "full-app")?.icon || "🌐",
    },
  ];

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h3
        style={{
          marginBottom: "24px",
          fontSize: "20px",
          fontWeight: "bold",
        }}
      >
        Standard Menus Configuration
      </h3>

      {/* Sub-tabs - Always visible */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #e2e8f0",
          marginBottom: "24px",
          flexShrink: 0,
        }}
      >
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={(e) => {
              e.preventDefault();
              setActiveSubTab(tab.id);
              onSubTabChange?.(tab.id);
              // Prevent auto-scroll by ensuring container stays at top
              const container = e.currentTarget.closest('[style*="overflow"]');
              if (container) {
                container.scrollTop = 0;
              }
            }}
            style={{
              padding: "12px 20px",
              border: "none",
              background: activeSubTab === tab.id ? "#3182ce" : "transparent",
              color: activeSubTab === tab.id ? "white" : "#4a5568",
              cursor: "pointer",
              fontWeight: activeSubTab === tab.id ? "600" : "400",
              borderBottom:
                activeSubTab === tab.id ? "2px solid #3182ce" : "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {tab.icon.startsWith("data:") ? (
              <img
                src={tab.icon}
                alt="Tab icon"
                style={{
                  width: "16px",
                  height: "16px",
                  objectFit: "contain",
                }}
              />
            ) : tab.icon.startsWith("/") ? (
              <img
                src={tab.icon}
                alt="Tab icon"
                style={{
                  width: "16px",
                  height: "16px",
                  objectFit: "contain",
                }}
              />
            ) : (
              <MaterialIcon
                icon={tab.icon}
                style={{
                  fontSize: "16px",
                  width: "16px",
                  height: "16px",
                }}
              />
            )}
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Main content area */}
      {isPreviewExpanded ? (
        /* Expanded preview mode */
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Preview header with collapse button */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              flexShrink: 0,
            }}
          >
            <h4
              style={{
                fontSize: "16px",
                fontWeight: "600",
                margin: 0,
              }}
            >
              Page Preview (Expanded)
            </h4>
            <button
              onClick={() => setIsPreviewExpanded(false)}
              style={{
                padding: "8px",
                backgroundColor: "#6b7280",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
              }}
              title="Collapse preview"
            >
              ↙
            </button>
          </div>

          {/* Full preview area */}
          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "16px",
              backgroundColor: "white",
              flex: 1,
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {getPageComponent(activeSubTab)}
            </div>
          </div>
        </div>
      ) : (
        /* Normal mode with preview and configuration side by side */
        <div
          style={{
            display: "flex",
            gap: "24px",
            height: "650px",
            flex: 1,
          }}
        >
          {/* Page Preview */}
          <div style={{ flex: 2, display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  margin: 0,
                }}
              >
                Page Preview
              </h4>
              <button
                onClick={() => setIsPreviewExpanded(true)}
                style={{
                  padding: "8px",
                  backgroundColor: "#3182ce",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                }}
                title="Expand preview"
              >
                ↗
              </button>
            </div>
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "16px",
                backgroundColor: "white",
                flex: 1,
                overflow: "auto",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                {getPageComponent(activeSubTab)}
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <h4
              style={{
                fontSize: "16px",
                fontWeight: "600",
                marginBottom: "16px",
              }}
            >
              Configuration
            </h4>
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "20px",
                backgroundColor: "#f9fafb",
                flex: 1,
                overflow: "auto",
              }}
            >
              {(() => {
                const menu = standardMenus.find((m) => m.id === activeSubTab);
                if (!menu) return null;

                return (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "auto 1fr",
                        gap: "16px",
                        marginBottom: "16px",
                      }}
                    >
                      <div style={{ minWidth: "200px" }}>
                        <IconPicker
                          value={menu.icon}
                          onChange={(icon) =>
                            updateStandardMenu(menu.id, "icon", icon)
                          }
                          label="Icon"
                          placeholder="Search icons..."
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "4px",
                            fontWeight: "500",
                            fontSize: "14px",
                          }}
                        >
                          Name
                        </label>
                        <input
                          type="text"
                          value={menu.name}
                          onChange={(e) =>
                            updateStandardMenu(menu.id, "name", e.target.value)
                          }
                          style={{
                            width: "100%",
                            minWidth: "150px",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px",
                            fontSize: "14px",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={menu.enabled}
                          onChange={(e) =>
                            updateStandardMenu(
                              menu.id,
                              "enabled",
                              e.target.checked
                            )
                          }
                          style={{ transform: "scale(1.2)" }}
                        />
                        <span style={{ fontSize: "14px" }}>
                          Show in navigation
                        </span>
                      </label>
                    </div>

                    {/* Additional configuration for specific menus */}
                    {menu.id === "favorites" && (
                      <div style={{ marginBottom: "16px" }}>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "16px",
                          }}
                        >
                          <div>
                            <label
                              style={{
                                display: "block",
                                marginBottom: "4px",
                                fontWeight: "500",
                                fontSize: "14px",
                              }}
                            >
                              Content Type
                            </label>
                            <select
                              value={menu.contentType || ""}
                              onChange={(e) =>
                                updateStandardMenu(
                                  menu.id,
                                  "contentType",
                                  e.target.value
                                )
                              }
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #d1d5db",
                                borderRadius: "4px",
                                fontSize: "14px",
                              }}
                            >
                              <option value="">All Types</option>
                              <option value="Answer">Answer</option>
                              <option value="Liveboard">Liveboard</option>
                            </select>
                          </div>

                          <div>
                            <label
                              style={{
                                display: "block",
                                marginBottom: "4px",
                                fontWeight: "500",
                                fontSize: "14px",
                              }}
                            >
                              Name Pattern
                            </label>
                            <input
                              type="text"
                              value={menu.namePattern || ""}
                              onChange={(e) =>
                                updateStandardMenu(
                                  menu.id,
                                  "namePattern",
                                  e.target.value
                                )
                              }
                              placeholder="Enter name pattern (e.g., 'Sales', 'Q1')"
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #d1d5db",
                                borderRadius: "4px",
                                fontSize: "14px",
                              }}
                            />
                            <p
                              style={{
                                margin: "4px 0 0 0",
                                fontSize: "12px",
                                color: "#6b7280",
                              }}
                            >
                              Filter favorites by name pattern
                              (case-insensitive)
                            </p>
                          </div>
                        </div>

                        <TagFilterComponent
                          value={menu.tagFilter || ""}
                          onChange={(value) =>
                            updateStandardMenu(menu.id, "tagFilter", value)
                          }
                          availableTags={availableTags}
                          isLoading={isLoadingTags}
                          error={tagsError}
                          label="Tag Filter"
                          description="Filter favorites by tag"
                        />
                      </div>
                    )}

                    {menu.id === "my-reports" && (
                      <div style={{ marginBottom: "16px" }}>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "16px",
                          }}
                        >
                          <div>
                            <label
                              style={{
                                display: "block",
                                marginBottom: "4px",
                                fontWeight: "500",
                                fontSize: "14px",
                              }}
                            >
                              Content Type
                            </label>
                            <select
                              value={menu.contentType || ""}
                              onChange={(e) =>
                                updateStandardMenu(
                                  menu.id,
                                  "contentType",
                                  e.target.value
                                )
                              }
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #d1d5db",
                                borderRadius: "4px",
                                fontSize: "14px",
                              }}
                            >
                              <option value="">All Types</option>
                              <option value="Answer">Answer</option>
                              <option value="Liveboard">Liveboard</option>
                            </select>
                          </div>

                          <div>
                            <label
                              style={{
                                display: "block",
                                marginBottom: "4px",
                                fontWeight: "500",
                                fontSize: "14px",
                              }}
                            >
                              Name Pattern
                            </label>
                            <input
                              type="text"
                              value={menu.namePattern || ""}
                              onChange={(e) =>
                                updateStandardMenu(
                                  menu.id,
                                  "namePattern",
                                  e.target.value
                                )
                              }
                              placeholder="Enter name pattern (e.g., 'Sales', 'Q1')"
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #d1d5db",
                                borderRadius: "4px",
                                fontSize: "14px",
                              }}
                            />
                            <p
                              style={{
                                margin: "4px 0 0 0",
                                fontSize: "12px",
                                color: "#6b7280",
                              }}
                            >
                              Filter reports by name pattern (case-insensitive)
                            </p>
                          </div>
                        </div>

                        <TagFilterComponent
                          value={menu.tagFilter || ""}
                          onChange={(value) =>
                            updateStandardMenu(menu.id, "tagFilter", value)
                          }
                          availableTags={availableTags}
                          isLoading={isLoadingTags}
                          error={tagsError}
                          label="Tag Filter"
                          description="Filter reports by tag"
                        />
                      </div>
                    )}

                    {menu.id === "home" && (
                      <div
                        style={{
                          marginTop: "24px",
                          paddingTop: "24px",
                          borderTop: "1px solid #e5e7eb",
                        }}
                      >
                        <h5
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            marginBottom: "16px",
                            color: "#374151",
                          }}
                        >
                          Home Page Content Configuration
                        </h5>

                        <div style={{ marginBottom: "16px" }}>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              fontWeight: "500",
                              fontSize: "14px",
                            }}
                          >
                            Content Type
                          </label>
                          <select
                            value={menu.homePageType || "html"}
                            onChange={(e) => {
                              const newType = e.target.value as
                                | "image"
                                | "html"
                                | "iframe"
                                | "liveboard"
                                | "answer"
                                | "spotter";
                              updateStandardMenu(
                                menu.id,
                                "homePageType",
                                newType
                              );
                              // Clear the value when changing type
                              updateStandardMenu(menu.id, "homePageValue", "");
                            }}
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                              fontSize: "14px",
                            }}
                          >
                            <option value="image">Image Upload</option>
                            <option value="html">HTML Content</option>
                            <option value="iframe">Website (iframe)</option>
                            <option value="liveboard">
                              ThoughtSpot Liveboard
                            </option>
                            <option value="answer">ThoughtSpot Answer</option>
                            <option value="spotter">
                              ThoughtSpot Spotter Model
                            </option>
                          </select>
                        </div>

                        {menu.homePageType === "image" && (
                          <div style={{ marginBottom: "16px" }}>
                            <label
                              style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: "500",
                                fontSize: "14px",
                              }}
                            >
                              Image URL
                            </label>
                            <input
                              type="url"
                              value={menu.homePageValue || ""}
                              onChange={(e) =>
                                updateStandardMenu(
                                  menu.id,
                                  "homePageValue",
                                  e.target.value
                                )
                              }
                              placeholder="https://example.com/image.jpg"
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #d1d5db",
                                borderRadius: "4px",
                                fontSize: "14px",
                              }}
                            />
                          </div>
                        )}

                        {menu.homePageType === "html" && (
                          <div style={{ marginBottom: "16px" }}>
                            <label
                              style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: "500",
                                fontSize: "14px",
                              }}
                            >
                              HTML Content
                            </label>
                            <textarea
                              value={menu.homePageValue || ""}
                              onChange={(e) =>
                                updateStandardMenu(
                                  menu.id,
                                  "homePageValue",
                                  e.target.value
                                )
                              }
                              placeholder="<div>Your HTML content here</div>"
                              rows={6}
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #d1d5db",
                                borderRadius: "4px",
                                fontSize: "14px",
                                fontFamily: "monospace",
                                resize: "vertical",
                              }}
                            />
                          </div>
                        )}

                        {menu.homePageType === "iframe" && (
                          <div style={{ marginBottom: "16px" }}>
                            <label
                              style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: "500",
                                fontSize: "14px",
                              }}
                            >
                              Website URL
                            </label>
                            <input
                              type="url"
                              value={menu.homePageValue || ""}
                              onChange={(e) =>
                                updateStandardMenu(
                                  menu.id,
                                  "homePageValue",
                                  e.target.value
                                )
                              }
                              placeholder="https://example.com"
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #d1d5db",
                                borderRadius: "4px",
                                fontSize: "14px",
                              }}
                            />
                          </div>
                        )}

                        {(menu.homePageType === "liveboard" ||
                          menu.homePageType === "answer" ||
                          menu.homePageType === "spotter") && (
                          <div style={{ marginBottom: "16px" }}>
                            <label
                              style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: "500",
                                fontSize: "14px",
                              }}
                            >
                              {menu.homePageType === "liveboard"
                                ? "Liveboard"
                                : menu.homePageType === "answer"
                                ? "Answer"
                                : "Spotter Model"}
                            </label>
                            <select
                              value={menu.homePageValue || ""}
                              onChange={(e) =>
                                updateStandardMenu(
                                  menu.id,
                                  "homePageValue",
                                  e.target.value
                                )
                              }
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #d1d5db",
                                borderRadius: "4px",
                                fontSize: "14px",
                              }}
                            >
                              <option value="">
                                Select a{" "}
                                {menu.homePageType === "liveboard"
                                  ? "liveboard"
                                  : menu.homePageType === "answer"
                                  ? "answer"
                                  : "model"}
                              </option>
                              {isLoadingContent ? (
                                <option value="">Loading content...</option>
                              ) : contentError ? (
                                <option value="">Error loading content</option>
                              ) : (
                                thoughtSpotContent
                                  .filter((option) => {
                                    if (menu.homePageType === "liveboard")
                                      return option.type === "liveboard";
                                    if (menu.homePageType === "answer")
                                      return option.type === "answer";
                                    if (menu.homePageType === "spotter")
                                      return option.type === "model";
                                    return false;
                                  })
                                  .map((option) => (
                                    <option key={option.id} value={option.id}>
                                      {option.name}
                                    </option>
                                  ))
                              )}
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    {menu.id === "spotter" && (
                      <div style={{ marginBottom: "16px" }}>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr",
                            gap: "16px",
                          }}
                        >
                          <div>
                            {isLoadingModels || isLoadingWorksheets ? (
                              <div
                                style={{
                                  padding: "8px 12px",
                                  border: "1px solid #d1d5db",
                                  borderRadius: "4px",
                                  fontSize: "14px",
                                  color: "#6b7280",
                                  backgroundColor: "#f9fafb",
                                }}
                              >
                                Loading models...
                              </div>
                            ) : modelsError || worksheetsError ? (
                              <div
                                style={{
                                  padding: "8px 12px",
                                  border: "1px solid #f87171",
                                  borderRadius: "4px",
                                  fontSize: "14px",
                                  color: "#dc2626",
                                  backgroundColor: "#fef2f2",
                                }}
                              >
                                {modelsError || worksheetsError}
                              </div>
                            ) : (
                              <div>
                                <SearchableDropdown
                                  value={menu.spotterModelId || ""}
                                  onChange={(value) =>
                                    updateStandardMenu(
                                      menu.id,
                                      "spotterModelId",
                                      value
                                    )
                                  }
                                  options={combinedOptions}
                                  placeholder="Select a model"
                                  searchPlaceholder="Search models..."
                                  label="Spotter Model"
                                  isLoading={
                                    isLoadingModels || isLoadingWorksheets
                                  }
                                  error={modelsError || worksheetsError}
                                />
                              </div>
                            )}
                          </div>
                          <div>
                            <label
                              style={{
                                display: "block",
                                marginBottom: "4px",
                                fontWeight: "500",
                                fontSize: "14px",
                              }}
                            >
                              Starting Search Query (Optional)
                            </label>
                            <SearchQueryInput
                              value={menu.spotterSearchQuery || ""}
                              onChange={(value) =>
                                updateStandardMenu(
                                  menu.id,
                                  "spotterSearchQuery",
                                  value
                                )
                              }
                              placeholder="Enter a search query to start with..."
                            />
                            <p
                              style={{
                                color: "#718096",
                                fontSize: "12px",
                                marginTop: "4px",
                              }}
                            >
                              Leave empty to start with a blank search interface
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {menu.id === "search" && (
                      <div style={{ marginBottom: "16px" }}>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr",
                            gap: "16px",
                          }}
                        >
                          <div>
                            {isLoadingModels || isLoadingWorksheets ? (
                              <div
                                style={{
                                  padding: "8px 12px",
                                  border: "1px solid #d1d5db",
                                  borderRadius: "4px",
                                  fontSize: "14px",
                                  color: "#6b7280",
                                  backgroundColor: "#f9fafb",
                                }}
                              >
                                Loading models...
                              </div>
                            ) : modelsError || worksheetsError ? (
                              <div
                                style={{
                                  padding: "8px 12px",
                                  border: "1px solid #f87171",
                                  borderRadius: "4px",
                                  fontSize: "14px",
                                  color: "#dc2626",
                                  backgroundColor: "#fef2f2",
                                }}
                              >
                                {modelsError || worksheetsError}
                              </div>
                            ) : (
                              <div>
                                <SearchableDropdown
                                  value={menu.searchDataSource || ""}
                                  onChange={(value) =>
                                    updateStandardMenu(
                                      menu.id,
                                      "searchDataSource",
                                      value
                                    )
                                  }
                                  options={combinedOptions}
                                  placeholder="Select a model"
                                  searchPlaceholder="Search models..."
                                  label="Search Data Source (Model)"
                                  isLoading={
                                    isLoadingModels || isLoadingWorksheets
                                  }
                                  error={modelsError || worksheetsError}
                                />
                                <p
                                  style={{
                                    color: "#718096",
                                    fontSize: "12px",
                                    marginTop: "4px",
                                  }}
                                >
                                  Select the model to use as the data source for
                                  search
                                </p>
                              </div>
                            )}
                          </div>
                          <div>
                            <label
                              style={{
                                display: "block",
                                marginBottom: "4px",
                                fontWeight: "500",
                                fontSize: "14px",
                              }}
                            >
                              Search Token String (Optional)
                            </label>
                            <SearchQueryInput
                              value={menu.searchTokenString || ""}
                              onChange={(value) =>
                                updateStandardMenu(
                                  menu.id,
                                  "searchTokenString",
                                  value
                                )
                              }
                              placeholder="Enter a search query to start with..."
                            />
                            <p
                              style={{
                                color: "#718096",
                                fontSize: "12px",
                                marginTop: "4px",
                              }}
                            >
                              Leave empty to start with a blank search interface
                            </p>
                          </div>
                          <div>
                            <label
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={
                                  menu.runSearch !== undefined
                                    ? menu.runSearch
                                    : true
                                }
                                onChange={(e) =>
                                  updateStandardMenu(
                                    menu.id,
                                    "runSearch",
                                    e.target.checked
                                  )
                                }
                                style={{ transform: "scale(1.2)" }}
                              />
                              <span style={{ fontSize: "14px" }}>
                                Run Search Automatically
                              </span>
                            </label>
                            <p
                              style={{
                                color: "#718096",
                                fontSize: "12px",
                                marginTop: "4px",
                              }}
                            >
                              When checked, the search will execute
                              automatically when the page loads
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Full App specific configuration */}
                    {menu.id === "full-app" && (
                      <div
                        style={{
                          marginTop: "24px",
                          paddingTop: "24px",
                          borderTop: "1px solid #e5e7eb",
                        }}
                      >
                        <h5
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            marginBottom: "16px",
                            color: "#374151",
                          }}
                        >
                          Navigation Settings
                        </h5>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                          }}
                        >
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              cursor: "pointer",
                              fontSize: "14px",
                              color: "#4a5568",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={fullAppConfig.showPrimaryNavbar}
                              onChange={(e) =>
                                updateFullAppConfig({
                                  ...fullAppConfig,
                                  showPrimaryNavbar: e.target.checked,
                                })
                              }
                              style={{ cursor: "pointer" }}
                            />
                            <span>Show Primary Navbar</span>
                          </label>

                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              cursor: "pointer",
                              fontSize: "14px",
                              color: "#4a5568",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={fullAppConfig.hideHomepageLeftNav}
                              onChange={(e) =>
                                updateFullAppConfig({
                                  ...fullAppConfig,
                                  hideHomepageLeftNav: e.target.checked,
                                })
                              }
                              style={{ cursor: "pointer" }}
                            />
                            <span>Hide Homepage Left Navigation</span>
                          </label>
                        </div>

                        <div style={{ marginTop: "16px" }}>
                          <h6
                            style={{
                              fontSize: "12px",
                              fontWeight: "600",
                              marginBottom: "8px",
                              color: "#6b7280",
                            }}
                          >
                            Pre-configured Settings
                          </h6>
                          <div
                            style={{
                              backgroundColor: "#f9fafb",
                              padding: "12px",
                              borderRadius: "6px",
                              border: "1px solid #e5e7eb",
                            }}
                          >
                            <ul
                              style={{
                                margin: 0,
                                paddingLeft: "16px",
                                fontSize: "12px",
                                color: "#6b7280",
                              }}
                            >
                              <li>Modular home experience enabled</li>
                              <li>
                                Monitor subscription hidden from left navigation
                              </li>
                              <li>
                                Learning and trending modules hidden from
                                homepage
                              </li>
                              <li>
                                Homepage modules reordered: Search, Favorite,
                                Watchlist, My Library
                              </li>
                              <li>Home page as the default landing page</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Icon Picker is now integrated into each menu item */}
    </div>
  );
}

function CustomMenusContent({
  customMenus,
  addCustomMenu,
  updateCustomMenu,
  deleteCustomMenu,
  onUnsavedChange,
  onEditingMenuChange,
  onSaveMenu,
  onCancelEdit,
  ref,
}: {
  customMenus: CustomMenu[];
  addCustomMenu: (menu: CustomMenu) => void;
  updateCustomMenu: (id: string, menu: CustomMenu) => void;
  deleteCustomMenu: (id: string) => void;
  onUnsavedChange?: (hasChanges: boolean) => void;
  onEditingMenuChange?: (menu: CustomMenu | null) => void;
  onSaveMenu?: () => void;
  onCancelEdit?: () => void;
  ref?: React.RefObject<{
    saveMenu: () => void;
    cancelEdit: () => void;
  } | null>;
}) {
  const [editingMenu, setEditingMenu] = useState<CustomMenu | null>(null);
  const [originalMenu, setOriginalMenu] = useState<CustomMenu | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasSavedRef = useRef(false);
  const [availableLiveboards, setAvailableLiveboards] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [availableAnswers, setAvailableAnswers] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [availableTags, setAvailableTags] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Icon picker state is no longer needed for the new IconPicker component

  // Filter states
  const [liveboardFilter, setLiveboardFilter] = useState("");
  const [answerFilter, setAnswerFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  // Filtered lists
  const filteredLiveboards = availableLiveboards.filter((liveboard) =>
    liveboard.name.toLowerCase().includes(liveboardFilter.toLowerCase())
  );

  const filteredAnswers = availableAnswers.filter((answer) =>
    answer.name.toLowerCase().includes(answerFilter.toLowerCase())
  );

  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(tagFilter.toLowerCase())
  );

  // Load available content and tags
  useEffect(() => {
    const loadContent = async () => {
      try {
        setIsLoadingContent(true);
        const { fetchLiveboards, fetchAnswers, fetchTags } = await import(
          "../services/thoughtspotApi"
        );

        const [liveboards, answers, tags] = await Promise.all([
          fetchLiveboards(),
          fetchAnswers(),
          fetchTags(),
        ]);

        setAvailableLiveboards(
          liveboards.map((l) => ({ id: l.id, name: l.name }))
        );
        setAvailableAnswers(answers.map((a) => ({ id: a.id, name: a.name })));
        setAvailableTags(tags);
      } catch (error) {
        console.error("Failed to load content:", error);
      } finally {
        setIsLoadingContent(false);
      }
    };

    loadContent();
  }, []);

  const handleCreateMenu = () => {
    const newMenu: CustomMenu = {
      id: `custom-${Date.now()}`,
      name: "",
      description: "",
      icon: "📋",
      enabled: true,
      contentSelection: {
        type: "specific",
        specificContent: {
          liveboards: [],
          answers: [],
        },
      },
    };
    setEditingMenu(newMenu);
    setOriginalMenu(null); // No original for new menus
    setIsCreating(true);
    hasSavedRef.current = false; // Reset the save flag
  };

  const handleSaveMenu = useCallback(() => {
    console.log("handleSaveMenu called", {
      isSaving,
      editingMenu: editingMenu?.name,
      isCreating,
    });

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Prevent infinite loops and rapid calls
    if (isSaving) {
      console.log("Already saving, skipping duplicate call");
      return;
    }

    // Additional safeguard - prevent if no editing menu
    if (!editingMenu) {
      console.log("Cannot save - no editing menu");
      return;
    }

    // Debounce the save operation to prevent rapid successive calls
    saveTimeoutRef.current = setTimeout(() => {
      console.log("Executing debounced save operation");

      // Prevent multiple saves of the same menu
      if (hasSavedRef.current) {
        console.log("Menu already saved, skipping duplicate save");
        return;
      }

      if (isCreating) {
        // For new menus, require a name
        if (!editingMenu.name.trim()) {
          console.log("Cannot save - menu name is empty");
          return;
        }

        console.log(
          "Saving new menu:",
          editingMenu.name,
          "isCreating:",
          isCreating
        );

        hasSavedRef.current = true;
        setIsSaving(true);
        console.log("Calling addCustomMenu with:", editingMenu);
        addCustomMenu(editingMenu);

        setEditingMenu(null);
        setOriginalMenu(null);
        setIsCreating(false);
        setIsSaving(false);
        onUnsavedChange?.(false);
        onSaveMenu?.();
      } else {
        // For existing menus, allow saving even with empty name
        console.log(
          "Updating existing menu:",
          editingMenu.name,
          "id:",
          editingMenu.id
        );

        setIsSaving(true);
        console.log(
          "Calling updateCustomMenu with:",
          editingMenu.id,
          editingMenu
        );
        updateCustomMenu(editingMenu.id, editingMenu);

        setEditingMenu(null);
        setOriginalMenu(null);
        setIsCreating(false);
        setIsSaving(false);
        onUnsavedChange?.(false);
        onSaveMenu?.();
      }
    }, 100); // 100ms debounce
  }, [
    editingMenu,
    isCreating,
    isSaving,
    addCustomMenu,
    updateCustomMenu,
    onUnsavedChange,
    onSaveMenu,
  ]);

  const handleCancelEdit = useCallback(() => {
    setEditingMenu(null);
    setOriginalMenu(null);
    setIsCreating(false);
    hasSavedRef.current = false; // Reset the save flag
    onUnsavedChange?.(false);
    onCancelEdit?.();
  }, [onUnsavedChange, onCancelEdit]);

  const handleEditMenu = (menu: CustomMenu) => {
    setEditingMenu({ ...menu });
    setOriginalMenu({ ...menu }); // Store original for comparison
    setIsCreating(false);
    // Don't set unsaved changes immediately - wait for actual changes
    onUnsavedChange?.(false);
  };

  const handleDeleteMenu = (id: string) => {
    const menu = customMenus.find((m) => m.id === id);
    const menuName = menu?.name || "this custom menu";

    if (
      confirm(
        `Are you sure you want to delete "${menuName}"? This action cannot be undone.`
      )
    ) {
      console.log("Deleting custom menu:", id, menuName);
      deleteCustomMenu(id);
    }
  };

  // Track changes to the editing menu - simplified to prevent infinite loops
  useEffect(() => {
    if (editingMenu) {
      onEditingMenuChange?.(editingMenu);
    }
  }, [editingMenu, onEditingMenuChange]);

  // Expose functions through ref
  useEffect(() => {
    if (ref) {
      ref.current = {
        saveMenu: handleSaveMenu,
        cancelEdit: handleCancelEdit,
      };
    }
  }, [ref, handleSaveMenu, handleCancelEdit]);

  // Debug logging for custom menus
  useEffect(() => {
    console.log(
      "CustomMenusContent - customMenus updated:",
      customMenus.length,
      customMenus.map((m) => ({ id: m.id, name: m.name }))
    );
  }, [customMenus]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h3 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>
          Custom Menus Configuration
        </h3>
        <button
          onClick={handleCreateMenu}
          disabled={editingMenu !== null}
          style={{
            padding: "8px 16px",
            backgroundColor: editingMenu !== null ? "#9ca3af" : "#3182ce",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: editingMenu !== null ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          Create New Menu
        </button>
      </div>

      {isLoadingContent && (
        <div style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>
          Loading available content...
        </div>
      )}

      {editingMenu && (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "20px",
            backgroundColor: "#f9fafb",
          }}
        >
          <h4
            style={{
              marginBottom: "16px",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            {isCreating ? "Create New Menu" : "Edit Menu"}
          </h4>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Menu Name *
              </label>
              <input
                type="text"
                value={editingMenu.name}
                onChange={(e) =>
                  setEditingMenu({ ...editingMenu, name: e.target.value })
                }
                placeholder="Enter menu name"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div>
              <IconPicker
                value={editingMenu.icon}
                onChange={(icon) => setEditingMenu({ ...editingMenu, icon })}
                label="Icon"
                placeholder="Search icons..."
              />
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Description
            </label>
            <textarea
              value={editingMenu.description}
              onChange={(e) =>
                setEditingMenu({ ...editingMenu, description: e.target.value })
              }
              placeholder="Enter menu description"
              rows={2}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "14px",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={editingMenu.enabled}
                onChange={(e) =>
                  setEditingMenu({ ...editingMenu, enabled: e.target.checked })
                }
                style={{ cursor: "pointer" }}
              />
              <span style={{ fontSize: "14px" }}>Show in navigation</span>
            </label>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Content Selection Method
            </label>
            <div style={{ display: "flex", gap: "16px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="contentType"
                  checked={editingMenu.contentSelection.type === "specific"}
                  onChange={() =>
                    setEditingMenu({
                      ...editingMenu,
                      contentSelection: {
                        type: "specific",
                        specificContent: { liveboards: [], answers: [] },
                      },
                    })
                  }
                  style={{ cursor: "pointer" }}
                />
                <span style={{ fontSize: "14px" }}>
                  Select specific content
                </span>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="contentType"
                  checked={editingMenu.contentSelection.type === "tag"}
                  onChange={() =>
                    setEditingMenu({
                      ...editingMenu,
                      contentSelection: {
                        type: "tag",
                        tagIdentifiers: [],
                      },
                    })
                  }
                  style={{ cursor: "pointer" }}
                />
                <span style={{ fontSize: "14px" }}>Filter by tags</span>
              </label>
            </div>
          </div>

          {editingMenu.contentSelection.type === "specific" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Liveboards
                </label>
                <input
                  type="text"
                  placeholder="Filter liveboards..."
                  value={liveboardFilter}
                  onChange={(e) => setLiveboardFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "14px",
                    marginBottom: "8px",
                  }}
                />
                <select
                  multiple
                  value={
                    editingMenu.contentSelection.specificContent?.liveboards ||
                    []
                  }
                  onChange={(e) => {
                    const selected = Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    );
                    setEditingMenu({
                      ...editingMenu,
                      contentSelection: {
                        ...editingMenu.contentSelection,
                        specificContent: {
                          ...editingMenu.contentSelection.specificContent!,
                          liveboards: selected,
                        },
                      },
                    });
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "14px",
                    minHeight: "100px",
                  }}
                >
                  {filteredLiveboards.map((liveboard) => (
                    <option key={liveboard.id} value={liveboard.id}>
                      {liveboard.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Answers
                </label>
                <input
                  type="text"
                  placeholder="Filter answers..."
                  value={answerFilter}
                  onChange={(e) => setAnswerFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "14px",
                    marginBottom: "8px",
                  }}
                />
                <select
                  multiple
                  value={
                    editingMenu.contentSelection.specificContent?.answers || []
                  }
                  onChange={(e) => {
                    const selected = Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    );
                    setEditingMenu({
                      ...editingMenu,
                      contentSelection: {
                        ...editingMenu.contentSelection,
                        specificContent: {
                          ...editingMenu.contentSelection.specificContent!,
                          answers: selected,
                        },
                      },
                    });
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "14px",
                    minHeight: "100px",
                  }}
                >
                  {filteredAnswers.map((answer) => (
                    <option key={answer.id} value={answer.id}>
                      {answer.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {editingMenu.contentSelection.type === "tag" && (
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Tags
              </label>
              <input
                type="text"
                placeholder="Filter tags..."
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                  marginBottom: "8px",
                }}
              />
              <select
                multiple
                value={editingMenu.contentSelection.tagIdentifiers || []}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  );
                  setEditingMenu({
                    ...editingMenu,
                    contentSelection: {
                      ...editingMenu.contentSelection,
                      tagIdentifiers: selected,
                    },
                  });
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                  minHeight: "100px",
                }}
              >
                {filteredTags.map((tag) => (
                  <option key={tag.id} value={tag.name}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div style={{ flex: 1, overflow: "auto" }}>
        {customMenus.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}
          >
            <p>No custom menus created yet.</p>
            <p>Click &quot;Create New Menu&quot; to get started.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {customMenus.map((menu) => (
              <div
                key={menu.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "16px",
                  backgroundColor: "white",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <MaterialIcon icon={menu.icon} size={20} />
                    <div>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "16px",
                          fontWeight: "600",
                        }}
                      >
                        {menu.name}
                      </h4>
                      {menu.description && (
                        <p
                          style={{
                            margin: "4px 0 0 0",
                            fontSize: "14px",
                            color: "#6b7280",
                          }}
                        >
                          {menu.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        backgroundColor: menu.enabled ? "#dcfce7" : "#fef2f2",
                        color: menu.enabled ? "#166534" : "#dc2626",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                    >
                      {menu.enabled ? "Enabled" : "Disabled"}
                    </span>
                    <button
                      onClick={() => handleEditMenu(menu)}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#3182ce",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMenu(menu.id)}
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
                      Delete
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  <strong>Content:</strong>{" "}
                  {menu.contentSelection.type === "specific" ? (
                    <>
                      {`${
                        menu.contentSelection.specificContent?.liveboards
                          .length || 0
                      } liveboards, ${
                        menu.contentSelection.specificContent?.answers.length ||
                        0
                      } answers`}
                    </>
                  ) : (
                    <>
                      {menu.contentSelection.tagIdentifiers?.length || 0} tags
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventsContent({
  stylingConfig,
  updateStylingConfig,
}: {
  stylingConfig: StylingConfig;
  updateStylingConfig: (config: StylingConfig) => void;
}) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <h3
        style={{
          marginBottom: "24px",
          fontSize: "24px",
          fontWeight: "600",
          color: "#1f2937",
        }}
      >
        Event Handling Configuration
      </h3>
      <p
        style={{
          marginBottom: "24px",
          color: "#6b7280",
          fontSize: "14px",
          lineHeight: "1.5",
        }}
      >
        Configure how to handle various events in your ThoughtSpot embeds, such
        as double-click events on visualization points.
      </p>

      <div style={{ flex: 1, overflow: "auto" }}>
        <DoubleClickEditor
          config={
            stylingConfig.doubleClickHandling || {
              enabled: false,
              showDefaultModal: true,
              customJavaScript: "",
              modalTitle: "Double-Click Event Data",
            }
          }
          onChange={(doubleClickHandling) =>
            updateStylingConfig({
              ...stylingConfig,
              doubleClickHandling,
            })
          }
        />
      </div>
    </div>
  );
}

function StylingContent({
  stylingConfig,
  updateStylingConfig,
}: {
  stylingConfig: StylingConfig;
  updateStylingConfig: (config: StylingConfig) => void;
}) {
  const [activeSubTab, setActiveSubTab] = useState("application");

  const subTabs = [
    { id: "application", name: "Application Styles", icon: "🎨" },
    { id: "embedded", name: "Embedded Content", icon: "🔧" },
  ];

  const updateApplicationStyles = (field: string, value: string) => {
    updateStylingConfig({
      ...stylingConfig,
      application: {
        ...stylingConfig.application,
        [field]: value,
      },
    });
  };

  const updateTopBarStyles = (field: string, value: string) => {
    updateStylingConfig({
      ...stylingConfig,
      application: {
        ...stylingConfig.application,
        topBar: {
          ...stylingConfig.application.topBar,
          [field]: value,
        },
      },
    });
  };

  const updateSidebarStyles = (field: string, value: string) => {
    updateStylingConfig({
      ...stylingConfig,
      application: {
        ...stylingConfig.application,
        sidebar: {
          ...stylingConfig.application.sidebar,
          [field]: value,
        },
      },
    });
  };

  const updateFooterStyles = (field: string, value: string) => {
    updateStylingConfig({
      ...stylingConfig,
      application: {
        ...stylingConfig.application,
        footer: {
          ...stylingConfig.application.footer,
          [field]: value,
        },
      },
    });
  };

  const updateDialogStyles = (field: string, value: string) => {
    updateStylingConfig({
      ...stylingConfig,
      application: {
        ...stylingConfig.application,
        dialogs: {
          ...stylingConfig.application.dialogs,
          [field]: value,
        },
      },
    });
  };

  const updateEmbeddedContent = (field: string, value: unknown) => {
    updateStylingConfig({
      ...stylingConfig,
      embeddedContent: {
        ...stylingConfig.embeddedContent,
        [field]: value,
      },
    });
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <h3
        style={{
          marginBottom: "24px",
          fontSize: "20px",
          fontWeight: "bold",
        }}
      >
        Styling Configuration
      </h3>

      {/* Sub-tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #e2e8f0",
          marginBottom: "24px",
          flexShrink: 0,
        }}
      >
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: "12px 20px",
              border: "none",
              background: activeSubTab === tab.id ? "#3182ce" : "transparent",
              color: activeSubTab === tab.id ? "white" : "#4a5568",
              cursor: "pointer",
              fontWeight: activeSubTab === tab.id ? "600" : "400",
              borderBottom:
                activeSubTab === tab.id ? "2px solid #3182ce" : "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "16px" }}>{tab.icon}</span>
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {activeSubTab === "application" && (
          <div>
            <h4
              style={{
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "20px",
              }}
            >
              Application Styling
            </h4>

            {/* Top Bar Styling */}
            <div
              style={{
                marginBottom: "32px",
                padding: "20px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                backgroundColor: "#f9fafb",
              }}
            >
              <h5
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "16px",
                }}
              >
                Top Bar
              </h5>

              <ImageUpload
                value={stylingConfig.application.topBar.logoUrl}
                onChange={(value) => updateTopBarStyles("logoUrl", value)}
                label="Logo"
                placeholder="https://example.com/logo.png"
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <ColorPicker
                  value={stylingConfig.application.topBar.backgroundColor}
                  onChange={(value) =>
                    updateTopBarStyles("backgroundColor", value)
                  }
                  label="Background Color"
                />
                <ColorPicker
                  value={stylingConfig.application.topBar.foregroundColor}
                  onChange={(value) =>
                    updateTopBarStyles("foregroundColor", value)
                  }
                  label="Foreground Color"
                />
              </div>
            </div>

            {/* Sidebar Styling */}
            <div
              style={{
                marginBottom: "32px",
                padding: "20px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                backgroundColor: "#f9fafb",
              }}
            >
              <h5
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "16px",
                }}
              >
                Sidebar
              </h5>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <ColorPicker
                  value={stylingConfig.application.sidebar.backgroundColor}
                  onChange={(value) =>
                    updateSidebarStyles("backgroundColor", value)
                  }
                  label="Background Color"
                />
                <ColorPicker
                  value={stylingConfig.application.sidebar.foregroundColor}
                  onChange={(value) =>
                    updateSidebarStyles("foregroundColor", value)
                  }
                  label="Foreground Color"
                />
              </div>
            </div>

            {/* Footer Styling */}
            <div
              style={{
                marginBottom: "32px",
                padding: "20px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                backgroundColor: "#f9fafb",
              }}
            >
              <h5
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "16px",
                }}
              >
                Footer
              </h5>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <ColorPicker
                  value={stylingConfig.application.footer.backgroundColor}
                  onChange={(value) =>
                    updateFooterStyles("backgroundColor", value)
                  }
                  label="Background Color"
                />
                <ColorPicker
                  value={stylingConfig.application.footer.foregroundColor}
                  onChange={(value) =>
                    updateFooterStyles("foregroundColor", value)
                  }
                  label="Foreground Color"
                />
              </div>
            </div>

            {/* Dialog Styling */}
            <div
              style={{
                marginBottom: "32px",
                padding: "20px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                backgroundColor: "#f9fafb",
              }}
            >
              <h5
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "16px",
                }}
              >
                Dialogs
              </h5>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <ColorPicker
                  value={stylingConfig.application.dialogs.backgroundColor}
                  onChange={(value) =>
                    updateDialogStyles("backgroundColor", value)
                  }
                  label="Background Color"
                />
                <ColorPicker
                  value={stylingConfig.application.dialogs.foregroundColor}
                  onChange={(value) =>
                    updateDialogStyles("foregroundColor", value)
                  }
                  label="Foreground Color"
                />
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "embedded" && (
          <div>
            <h4
              style={{
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "20px",
              }}
            >
              Embedded Content Customization
            </h4>

            {/* Strings */}
            <StringMappingEditor
              mappings={stylingConfig.embeddedContent.strings}
              onChange={(value) => updateEmbeddedContent("strings", value)}
              title="String Mappings"
              description="Map ThoughtSpot strings to custom values"
            />

            {/* String IDs */}
            <StringMappingEditor
              mappings={stylingConfig.embeddedContent.stringIDs}
              onChange={(value) => updateEmbeddedContent("stringIDs", value)}
              title="String ID Mappings"
              description="Map ThoughtSpot string IDs to custom values"
            />

            {/* CSS URL */}
            <div style={{ marginBottom: "24px" }}>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                Custom CSS URL
              </h4>
              <p
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  marginBottom: "16px",
                }}
              >
                URL to an external CSS file for custom styling
              </p>
              <input
                type="url"
                value={stylingConfig.embeddedContent.cssUrl || ""}
                onChange={(e) =>
                  updateEmbeddedContent("cssUrl", e.target.value)
                }
                placeholder="https://example.com/custom-styles.css"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* CSS Variables */}
            <CSSVariablesEditor
              variables={
                stylingConfig.embeddedContent.customCSS.variables || {}
              }
              onChange={(value) =>
                updateEmbeddedContent("customCSS", {
                  ...stylingConfig.embeddedContent.customCSS,
                  variables: value,
                })
              }
              title="Custom CSS Variables"
              description="Define custom CSS variables for ThoughtSpot styling"
            />

            {/* CSS Rules */}
            <CSSRulesEditor
              rules={
                stylingConfig.embeddedContent.customCSS.rules_UNSTABLE || {}
              }
              onChange={(value) =>
                updateEmbeddedContent("customCSS", {
                  ...stylingConfig.embeddedContent.customCSS,
                  rules_UNSTABLE: value,
                })
              }
              title="Custom CSS Rules (rules_UNSTABLE)"
              description="Define custom CSS rules for ThoughtSpot styling. Use valid JSON with CSS selectors as keys and style objects as values."
            />
          </div>
        )}
      </div>
    </div>
  );
}

function UserConfigContent({
  userConfig,
  updateUserConfig,
  customMenus,
}: {
  userConfig: UserConfig;
  updateUserConfig: (config: UserConfig) => void;
  customMenus: CustomMenu[];
}) {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Common locale options
  const commonLocales = [
    { value: "en", label: "English (en)" },
    { value: "es", label: "Spanish (es)" },
    { value: "fr", label: "French (fr)" },
    { value: "de", label: "German (de)" },
    { value: "it", label: "Italian (it)" },
    { value: "pt", label: "Portuguese (pt)" },
    { value: "ru", label: "Russian (ru)" },
    { value: "ja", label: "Japanese (ja)" },
    { value: "ko", label: "Korean (ko)" },
    { value: "zh", label: "Chinese (zh)" },
    { value: "ar", label: "Arabic (ar)" },
    { value: "hi", label: "Hindi (hi)" },
  ];

  // Default users
  const defaultUsers: User[] = [
    {
      id: "power-user",
      name: "Power User",
      description: "Can access all features and content",
      locale: "en",
      access: {
        standardMenus: {
          home: true,
          favorites: true,
          "my-reports": true,
          spotter: true,
          search: true,
          "full-app": true,
        },
        customMenus: [],
        hiddenActions: { enabled: false, actions: [] },
      },
    },
    {
      id: "basic-user",
      name: "Basic User",
      description: "Limited access - cannot access Search and Full App",
      locale: "en",
      access: {
        standardMenus: {
          home: true,
          favorites: true,
          "my-reports": true,
          spotter: true,
          search: false,
          "full-app": false,
        },
        customMenus: [],
        hiddenActions: { enabled: false, actions: [] },
      },
    },
  ];

  // Initialize with default users if none exist
  useEffect(() => {
    if (userConfig.users.length === 0) {
      updateUserConfig({
        users: defaultUsers,
        currentUserId: defaultUsers[0].id,
      });
    }
  }, [userConfig.users.length, updateUserConfig, defaultUsers]);

  const handleCreateUser = () => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: "",
      description: "",
      locale: "en",
      access: {
        standardMenus: {
          home: true,
          favorites: true,
          "my-reports": true,
          spotter: true,
          search: true,
          "full-app": true,
        },
        customMenus: [],
        hiddenActions: { enabled: false, actions: [] },
      },
    };
    setEditingUser(newUser);
    setIsCreating(true);
  };

  const handleSaveUser = () => {
    if (editingUser && editingUser.name.trim()) {
      if (isCreating) {
        updateUserConfig({
          ...userConfig,
          users: [...userConfig.users, editingUser],
        });
      } else {
        updateUserConfig({
          ...userConfig,
          users: userConfig.users.map((user) =>
            user.id === editingUser.id ? editingUser : user
          ),
        });
      }
      setEditingUser(null);
      setIsCreating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setIsCreating(false);
  };

  const handleEditUser = (user: User) => {
    setEditingUser({ ...user });
    setIsCreating(false);
  };

  const handleDeleteUser = (userId: string) => {
    if (userConfig.users.length <= 1) {
      alert("Cannot delete the last user. At least one user must remain.");
      return;
    }

    if (confirm("Are you sure you want to delete this user?")) {
      const updatedUsers = userConfig.users.filter(
        (user) => user.id !== userId
      );
      const newCurrentUserId =
        userConfig.currentUserId === userId
          ? updatedUsers[0].id
          : userConfig.currentUserId;

      updateUserConfig({
        ...userConfig,
        users: updatedUsers,
        currentUserId: newCurrentUserId,
      });
    }
  };

  const handleSetCurrentUser = (userId: string) => {
    updateUserConfig({
      ...userConfig,
      currentUserId: userId,
    });
  };

  const updateUserAccess = (
    userId: string,
    field: string,
    value: boolean | string[]
  ) => {
    const user = userConfig.users.find((u) => u.id === userId);
    if (!user) return;

    const updatedUser = {
      ...user,
      access: {
        ...user.access,
        [field]: value,
      },
    };

    updateUserConfig({
      ...userConfig,
      users: userConfig.users.map((u) => (u.id === userId ? updatedUser : u)),
    });
  };

  const currentUser = userConfig.users.find(
    (u) => u.id === userConfig.currentUserId
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h3 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>
          User Access Control
        </h3>
        <button
          onClick={handleCreateUser}
          disabled={editingUser !== null}
          style={{
            padding: "8px 16px",
            backgroundColor: editingUser !== null ? "#9ca3af" : "#3182ce",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: editingUser !== null ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          Add New User
        </button>
      </div>

      {/* Current User Selection */}
      <div
        style={{
          marginBottom: "24px",
          padding: "16px",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          backgroundColor: "#f9fafb",
        }}
      >
        <SearchableDropdown
          value={userConfig.currentUserId || ""}
          onChange={handleSetCurrentUser}
          options={userConfig.users.map((user) => ({
            id: user.id,
            name: user.name,
          }))}
          placeholder="Select a user"
          searchPlaceholder="Search users..."
          label="Current User"
        />
        {currentUser && (
          <p
            style={{
              margin: "8px 0 0 0",
              fontSize: "12px",
              color: "#6b7280",
            }}
          >
            {currentUser.description}
          </p>
        )}
      </div>

      {editingUser && (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "20px",
            backgroundColor: "#f9fafb",
          }}
        >
          <h4
            style={{
              marginBottom: "16px",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            {isCreating ? "Create New User" : "Edit User"}
          </h4>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                User Name *
              </label>
              <input
                type="text"
                value={editingUser.name}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, name: e.target.value })
                }
                placeholder="Enter user name"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Description
              </label>
              <input
                type="text"
                value={editingUser.description || ""}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    description: e.target.value,
                  })
                }
                placeholder="Enter description"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Locale
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <select
                value={editingUser.locale || "en"}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, locale: e.target.value })
                }
                style={{
                  flex: "1",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                {commonLocales.map((locale) => (
                  <option key={locale.value} value={locale.value}>
                    {locale.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={editingUser.locale || "en"}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, locale: e.target.value })
                }
                placeholder="Custom locale (e.g., en-US, fr-CA)"
                style={{
                  flex: "1",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "12px",
                color: "#6b7280",
              }}
            >
              Select from common locales or enter a custom locale code
            </p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h5
              style={{
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "12px",
              }}
            >
              Standard Menu Access
            </h5>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "12px",
              }}
            >
              {Object.entries(editingUser.access.standardMenus).map(
                ([menuId, hasAccess]) => (
                  <label
                    key={menuId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={hasAccess}
                      onChange={(e) => {
                        const updatedUser = {
                          ...editingUser,
                          access: {
                            ...editingUser.access,
                            standardMenus: {
                              ...editingUser.access.standardMenus,
                              [menuId]: e.target.checked,
                            },
                          },
                        };
                        setEditingUser(updatedUser);
                      }}
                      style={{ cursor: "pointer" }}
                    />
                    <span
                      style={{ fontSize: "14px", textTransform: "capitalize" }}
                    >
                      {menuId.replace("-", " ")}
                    </span>
                  </label>
                )
              )}
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h5
              style={{
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "12px",
              }}
            >
              Hidden Actions Configuration
            </h5>
            <HiddenActionsEditor
              config={
                editingUser.access.hiddenActions || {
                  enabled: false,
                  actions: [],
                }
              }
              onChange={(hiddenActionsConfig) => {
                const updatedUser = {
                  ...editingUser,
                  access: {
                    ...editingUser.access,
                    hiddenActions: hiddenActionsConfig,
                  },
                };
                setEditingUser(updatedUser);
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h5
              style={{
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "12px",
              }}
            >
              Custom Menu Access
            </h5>
            {customMenus.length === 0 ? (
              <p style={{ fontSize: "12px", color: "#6b7280" }}>
                No custom menus available
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                }}
              >
                {customMenus.map((menu) => (
                  <label
                    key={menu.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={editingUser.access.customMenus.includes(menu.id)}
                      onChange={(e) => {
                        const updatedCustomMenus = e.target.checked
                          ? [...editingUser.access.customMenus, menu.id]
                          : editingUser.access.customMenus.filter(
                              (id) => id !== menu.id
                            );

                        const updatedUser = {
                          ...editingUser,
                          access: {
                            ...editingUser.access,
                            customMenus: updatedCustomMenus,
                          },
                        };
                        setEditingUser(updatedUser);
                      }}
                      style={{ cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "14px" }}>{menu.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div
            style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}
          >
            <button
              onClick={handleCancelEdit}
              style={{
                padding: "8px 16px",
                backgroundColor: "#6b7280",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveUser}
              disabled={!editingUser.name.trim()}
              style={{
                padding: "8px 16px",
                backgroundColor: editingUser.name.trim()
                  ? "#3182ce"
                  : "#9ca3af",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: editingUser.name.trim() ? "pointer" : "not-allowed",
                fontSize: "14px",
              }}
            >
              {isCreating ? "Create User" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflow: "auto" }}>
        {userConfig.users.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}
          >
            <p>No users configured.</p>
            <p>Click &quot;Add New User&quot; to get started.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {userConfig.users.map((user) => (
              <div
                key={user.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "16px",
                  backgroundColor: "white",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "8px",
                  }}
                >
                  <div>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "16px",
                        fontWeight: "600",
                      }}
                    >
                      {user.name}
                      {userConfig.currentUserId === user.id && (
                        <span
                          style={{
                            marginLeft: "8px",
                            padding: "2px 6px",
                            backgroundColor: "#dcfce7",
                            color: "#166534",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          Current
                        </span>
                      )}
                    </h4>
                    {user.description && (
                      <p
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: "14px",
                          color: "#6b7280",
                        }}
                      >
                        {user.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleEditUser(user)}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#3182ce",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
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
                      Delete
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  <strong>Access:</strong>{" "}
                  {Object.entries(user.access.standardMenus)
                    .filter(([, hasAccess]) => hasAccess)
                    .map(([menuId]) => menuId.replace("-", " "))
                    .join(", ")}
                  {user.access.customMenus.length > 0 && (
                    <>
                      {" "}
                      + {user.access.customMenus.length} custom menu
                      {user.access.customMenus.length !== 1 ? "s" : ""}
                    </>
                  )}
                  {user.access.hiddenActions?.enabled && (
                    <>
                      {" "}
                      • {user.access.hiddenActions.actions.length} hidden action
                      {user.access.hiddenActions.actions.length !== 1
                        ? "s"
                        : ""}
                    </>
                  )}
                  {user.locale && <> • Locale: {user.locale}</>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConfigurationContent({
  appConfig,
  updateAppConfig,
  stylingConfig,
  updateStylingConfig,
  clearAllConfigurations,
  exportConfiguration,
  importConfiguration,
  updateStandardMenu,
  addCustomMenu,
  updateHomePageConfig,
  updateFullAppConfig,
  updateUserConfig,
  setMenuOrder,
  standardMenus,
}: {
  appConfig: AppConfig;
  updateAppConfig: (config: AppConfig) => void;
  stylingConfig: StylingConfig;
  updateStylingConfig: (config: StylingConfig) => void;
  clearAllConfigurations?: () => void;
  exportConfiguration?: (customName?: string) => void;
  importConfiguration?: (file: File) => Promise<{
    success: boolean;
    error?: string;
  }>;
  updateStandardMenu?: (
    id: string,
    field: string,
    value: string | boolean
  ) => void;
  addCustomMenu?: (menu: CustomMenu) => void;
  updateHomePageConfig?: (config: HomePageConfig) => void;
  updateFullAppConfig?: (config: FullAppConfig) => void;
  updateUserConfig?: (config: UserConfig) => void;
  setMenuOrder?: (order: string[]) => void;
  standardMenus?: StandardMenu[];
}) {
  const [activeSubTab, setActiveSubTab] = useState("general");
  const [importStatus, setImportStatus] = useState<{
    message: string;
    type: "success" | "error" | null;
  }>({ message: "", type: null });
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFileName, setExportFileName] = useState("");

  // GitHub configuration loading state
  const [savedConfigurations, setSavedConfigurations] = useState<
    SavedConfiguration[]
  >([]);
  const [isLoadingConfigurations, setIsLoadingConfigurations] = useState(false);
  const [showGitHubDialog, setShowGitHubDialog] = useState(false);
  const [selectedConfiguration, setSelectedConfiguration] =
    useState<string>("");

  const subTabs = [
    { id: "general", name: "General", icon: "⚙️" },
    { id: "embedFlags", name: "Embed Flags", icon: "🚩" },
  ];

  // Load saved configurations from GitHub
  const loadSavedConfigurations = async () => {
    try {
      setIsLoadingConfigurations(true);
      const configs = await fetchSavedConfigurations();
      setSavedConfigurations(configs);
    } catch (error) {
      console.error("Failed to load saved configurations:", error);
      setImportStatus({
        message: "Failed to load saved configurations from GitHub",
        type: "error",
      });
    } finally {
      setIsLoadingConfigurations(false);
    }
  };

  // Load a specific configuration from GitHub using unified system
  const loadConfiguration = async (filename: string) => {
    // Capture console output for debugging
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const capturedLogs: string[] = [];

    console.log = (...args) => {
      capturedLogs.push(`[SETTINGS-LOG] ${args.join(" ")}`);
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      capturedLogs.push(`[SETTINGS-ERROR] ${args.join(" ")}`);
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      capturedLogs.push(`[SETTINGS-WARN] ${args.join(" ")}`);
      originalWarn.apply(console, args);
    };

    try {
      console.log("Loading configuration from GitHub:", filename);

      // Use the unified configuration loading system
      const { loadConfigurationFromSource, applyConfiguration } = await import(
        "../components/Layout"
      );
      const result = await loadConfigurationFromSource({
        type: "github",
        data: filename,
      });

      // Debug: Log the loaded configuration
      console.log("=== GITHUB IMPORT DEBUG ===");
      console.log("Loaded configuration result:", result);
      if (result.success && result.data) {
        console.log("Configuration data:", result.data);
        console.log("Styling config from GitHub:", result.data.stylingConfig);
        console.log(
          "Embedded content:",
          result.data.stylingConfig?.embeddedContent
        );
        console.log(
          "Custom CSS:",
          result.data.stylingConfig?.embeddedContent?.customCSS
        );
        console.log(
          "Variables:",
          result.data.stylingConfig?.embeddedContent?.customCSS?.variables
        );
        console.log(
          "Rules:",
          result.data.stylingConfig?.embeddedContent?.customCSS?.rules_UNSTABLE
        );
      }
      console.log("=== END GITHUB IMPORT DEBUG ===");

      if (result.success && result.data) {
        // Temporarily switch to power user to ensure all menus are accessible
        const powerUser = result.data.userConfig?.users?.find(
          (user) => user.id === "power-user"
        );
        if (powerUser && updateUserConfig) {
          console.log(
            "Temporarily switching to power user for configuration loading"
          );
          // Create a modified user config that keeps power-user as current
          const modifiedUserConfig = {
            ...result.data.userConfig,
            currentUserId: "power-user",
          };

          // Use the unified configuration application system
          applyConfiguration(
            {
              ...result.data,
              userConfig: modifiedUserConfig, // Use the modified user config
            },
            {
              updateStandardMenu: updateStandardMenu || (() => {}),
              addCustomMenu: addCustomMenu || (() => {}),
              updateHomePageConfig: updateHomePageConfig || (() => {}),
              updateAppConfig: updateAppConfig || (() => {}),
              updateFullAppConfig: updateFullAppConfig || (() => {}),
              updateStylingConfig: updateStylingConfig, // Pass the actual updateStylingConfig function from Layout
              updateUserConfig: updateUserConfig || (() => {}),
              setMenuOrder: setMenuOrder, // Pass the actual setMenuOrder function
            }
          );

          // Also apply changes immediately to bypass pending system
          console.log(
            "Applying changes immediately to bypass pending system..."
          );

          // Apply app config immediately using direct function from props
          if (updateAppConfig) {
            console.log(
              "Applying app config immediately:",
              result.data.appConfig
            );
            console.log("updateAppConfig function:", updateAppConfig);
            console.log("updateAppConfig function name:", updateAppConfig.name);
            updateAppConfig(result.data.appConfig);
          }

          // Note: updateStylingConfig is now handled by applyConfiguration above

          // Apply home page config immediately using direct function from props
          if (updateHomePageConfig) {
            console.log(
              "Applying home page config immediately:",
              result.data.homePageConfig
            );
            updateHomePageConfig(result.data.homePageConfig);
          }

          // Apply full app config immediately using direct function from props
          if (updateFullAppConfig) {
            console.log(
              "Applying full app config immediately:",
              result.data.fullAppConfig
            );
            updateFullAppConfig(result.data.fullAppConfig);
          }

          console.log(
            "Settings modal: Configuration loaded and applied successfully with power-user access"
          );
        } else {
          // Fallback: apply configuration normally
          applyConfiguration(result.data, {
            updateStandardMenu: updateStandardMenu || (() => {}),
            addCustomMenu: addCustomMenu || (() => {}),
            updateHomePageConfig: updateHomePageConfig || (() => {}),
            updateAppConfig,
            updateFullAppConfig: updateFullAppConfig || (() => {}),
            updateStylingConfig: updateStylingConfig, // Pass the actual updateStylingConfig function from Layout
            updateUserConfig: updateUserConfig || (() => {}),
            setMenuOrder: setMenuOrder, // Pass the actual setMenuOrder function
          });

          console.log(
            "Settings modal: Configuration loaded and applied successfully"
          );
        }
      } else {
        console.error(
          "Settings modal: Failed to load configuration:",
          result.error
        );
      }
    } catch (error) {
      console.error("Settings modal: Error loading configuration:", error);
      setImportStatus({
        message: "Failed to load configuration from GitHub",
        type: "error",
      });
    } finally {
      // Restore original console methods
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;

      // Log all captured output
      console.log("=== SETTINGS MODAL CONSOLE CAPTURE ===");
      capturedLogs.forEach((log: string) => console.log(log));
      console.log("=== END SETTINGS MODAL CONSOLE CAPTURE ===");
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <h3
        style={{
          marginBottom: "24px",
          fontSize: "20px",
          fontWeight: "bold",
        }}
      >
        Configuration
      </h3>

      {/* Sub-tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #e2e8f0",
          marginBottom: "24px",
          flexShrink: 0,
        }}
      >
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: "12px 20px",
              border: "none",
              background: activeSubTab === tab.id ? "#3182ce" : "transparent",
              color: activeSubTab === tab.id ? "white" : "#4a5568",
              cursor: "pointer",
              fontWeight: activeSubTab === tab.id ? "600" : "400",
              borderBottom:
                activeSubTab === tab.id ? "2px solid #3182ce" : "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "16px" }}>{tab.icon}</span>
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {activeSubTab === "general" && (
          <div>
            <h4
              style={{
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "20px",
              }}
            >
              General Configuration
            </h4>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px",
              }}
            >
              {/* Left Column */}
              <div>
                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "500",
                      fontSize: "14px",
                    }}
                  >
                    ThoughtSpot URL
                  </label>
                  <input
                    type="url"
                    value={appConfig.thoughtspotUrl}
                    onChange={(e) => {
                      updateAppConfig({
                        ...appConfig,
                        thoughtspotUrl: e.target.value,
                      });
                    }}
                    placeholder="https://your-instance.thoughtspot.cloud/"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  />
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    The URL of your ThoughtSpot instance
                  </p>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "500",
                      fontSize: "14px",
                    }}
                  >
                    Application Name
                  </label>
                  <input
                    type="text"
                    value={appConfig.applicationName}
                    onChange={(e) => {
                      updateAppConfig({
                        ...appConfig,
                        applicationName: e.target.value,
                      });
                    }}
                    placeholder="TSE Demo Builder"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  />
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    The name displayed in the application header
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div>
                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "500",
                      fontSize: "14px",
                    }}
                  >
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={appConfig.logo}
                    onChange={(e) =>
                      updateAppConfig({
                        ...appConfig,
                        logo: e.target.value,
                      })
                    }
                    placeholder="https://example.com/logo.png"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  />
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    URL to your application logo (optional)
                  </p>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "500",
                      fontSize: "14px",
                    }}
                  >
                    Early Access Flags
                  </label>
                  <textarea
                    value={appConfig.earlyAccessFlags}
                    onChange={(e) =>
                      updateAppConfig({
                        ...appConfig,
                        earlyAccessFlags: e.target.value,
                      })
                    }
                    placeholder="Enter early access flags (one per line)"
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "14px",
                      resize: "vertical",
                    }}
                  />
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    Feature flags for early access features (optional)
                  </p>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "500",
                      fontSize: "14px",
                    }}
                  >
                    Favicon URL
                  </label>
                  <input
                    type="url"
                    value={appConfig.favicon || ""}
                    onChange={(e) =>
                      updateAppConfig({
                        ...appConfig,
                        favicon: e.target.value,
                      })
                    }
                    placeholder="https://example.com/favicon.ico"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  />
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    URL to your browser tab icon (optional). Leave empty to use
                    the default.
                  </p>
                  <div style={{ marginTop: "8px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          appConfig.favicon ===
                            (standardMenus?.find((m) => m.id === "home")
                              ?.icon || "") &&
                          appConfig.logo ===
                            (standardMenus?.find((m) => m.id === "home")
                              ?.icon || "") &&
                          stylingConfig.application.topBar.logoUrl ===
                            (standardMenus?.find((m) => m.id === "home")
                              ?.icon || "")
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            const homeMenu = standardMenus?.find(
                              (m) => m.id === "home"
                            );
                            if (homeMenu) {
                              // Update both favicon and TopBar logo
                              updateAppConfig({
                                ...appConfig,
                                favicon: homeMenu.icon,
                                logo: homeMenu.icon,
                              });
                              // Also update the TopBar logo in styling config
                              updateStylingConfig({
                                ...stylingConfig,
                                application: {
                                  ...stylingConfig.application,
                                  topBar: {
                                    ...stylingConfig.application.topBar,
                                    logoUrl: homeMenu.icon,
                                  },
                                },
                              });
                            }
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      />
                      <span>Sync with Home menu icon</span>
                    </label>
                    <p
                      style={{
                        margin: "4px 0 0 0",
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
                    >
                      When checked, the favicon will automatically match the
                      Home menu icon
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#4a5568",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={appConfig.showFooter ?? true}
                      onChange={(e) =>
                        updateAppConfig({
                          ...appConfig,
                          showFooter: e.target.checked,
                        })
                      }
                      style={{ cursor: "pointer" }}
                    />
                    <span>Show Footer</span>
                  </label>
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    When unchecked, the footer will be hidden and content will
                    use the full available space
                  </p>
                </div>
              </div>
            </div>

            {/* Import Status Message */}
            {importStatus.type && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px 16px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  backgroundColor:
                    importStatus.type === "success" ? "#d1fae5" : "#fee2e2",
                  color:
                    importStatus.type === "success" ? "#065f46" : "#991b1b",
                  border: `1px solid ${
                    importStatus.type === "success" ? "#a7f3d0" : "#fecaca"
                  }`,
                }}
              >
                {importStatus.message}
              </div>
            )}

            {/* Export Dialog */}
            {showExportDialog && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "24px",
                    borderRadius: "8px",
                    minWidth: "400px",
                    maxWidth: "500px",
                  }}
                >
                  <h3
                    style={{
                      marginBottom: "16px",
                      fontSize: "18px",
                      fontWeight: "bold",
                    }}
                  >
                    Export Configuration
                  </h3>
                  <p
                    style={{
                      marginBottom: "16px",
                      fontSize: "14px",
                      color: "#6b7280",
                    }}
                  >
                    Choose a name for your configuration file (optional). If
                    left empty, a default name will be used.
                  </p>
                  <input
                    type="text"
                    value={exportFileName}
                    onChange={(e) => setExportFileName(e.target.value)}
                    placeholder="e.g., my-demo-config, production-setup"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "14px",
                      marginBottom: "16px",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      onClick={() => {
                        setShowExportDialog(false);
                        setExportFileName("");
                      }}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#6b7280",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const fileName = exportFileName.trim();
                        // Validate filename - only allow alphanumeric, hyphens, underscores, and spaces
                        const validFileName = fileName.replace(
                          /[^a-zA-Z0-9\s\-_]/g,
                          ""
                        );
                        exportConfiguration?.(validFileName || undefined);
                        setShowExportDialog(false);
                        setExportFileName("");
                      }}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#059669",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Export
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* GitHub Configuration Dialog */}
            {showGitHubDialog && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "24px",
                    borderRadius: "8px",
                    minWidth: "500px",
                    maxWidth: "600px",
                    maxHeight: "80vh",
                    overflow: "auto",
                  }}
                >
                  <h3
                    style={{
                      marginBottom: "16px",
                      fontSize: "18px",
                      fontWeight: "bold",
                    }}
                  >
                    Load Configuration from GitHub
                  </h3>
                  <p
                    style={{
                      marginBottom: "16px",
                      fontSize: "14px",
                      color: "#6b7280",
                    }}
                  >
                    Select a saved configuration to load from the ThoughtSpot
                    repository.
                  </p>

                  {isLoadingConfigurations ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                      <p>Loading saved configurations...</p>
                    </div>
                  ) : savedConfigurations.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                      <p>No saved configurations found.</p>
                    </div>
                  ) : (
                    <div style={{ marginBottom: "16px" }}>
                      <SearchableDropdown
                        value={selectedConfiguration}
                        onChange={setSelectedConfiguration}
                        options={savedConfigurations.map((config) => ({
                          id: config.filename,
                          name: `${config.name} - ${config.description}`,
                        }))}
                        placeholder="Choose a configuration..."
                        searchPlaceholder="Search configurations..."
                        label="Select Configuration"
                      />
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      onClick={() => {
                        setShowGitHubDialog(false);
                        setSelectedConfiguration("");
                      }}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#6b7280",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (selectedConfiguration) {
                          loadConfiguration(selectedConfiguration);
                        }
                      }}
                      disabled={!selectedConfiguration}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: selectedConfiguration
                          ? "#8b5cf6"
                          : "#9ca3af",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: selectedConfiguration
                          ? "pointer"
                          : "not-allowed",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Load Configuration
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div
              style={{
                marginTop: "32px",
                paddingTop: "24px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                gap: "12px",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setShowExportDialog(true)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#059669",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Export Configuration
                </button>
                <label
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    display: "inline-block",
                  }}
                >
                  Import Configuration
                  <input
                    type="file"
                    accept=".json"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file && importConfiguration) {
                        const result = await importConfiguration(file);
                        if (!result.success) {
                          setImportStatus({
                            message: `Import failed: ${result.error}`,
                            type: "error",
                          });
                        } else {
                          setImportStatus({
                            message: "Configuration imported successfully!",
                            type: "success",
                          });
                        }
                        // Clear status after 3 seconds
                        setTimeout(
                          () => setImportStatus({ message: "", type: null }),
                          3000
                        );
                      }
                      // Reset the input
                      e.target.value = "";
                    }}
                    style={{ display: "none" }}
                  />
                </label>
                <button
                  onClick={() => {
                    setShowGitHubDialog(true);
                    loadSavedConfigurations();
                  }}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#8b5cf6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Load from GitHub
                </button>
              </div>
              <div
                style={{
                  marginTop: "20px",
                  padding: "16px",
                  backgroundColor: "#fef3c7",
                  border: "1px solid #f59e0b",
                  borderRadius: "8px",
                }}
              >
                <h5
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    marginBottom: "12px",
                    color: "#92400e",
                  }}
                >
                  Storage Management
                </h5>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#92400e",
                    marginBottom: "12px",
                  }}
                >
                  If you encounter storage quota errors, you can clear browser
                  storage to free up space.
                </p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        // Clear all localStorage
                        localStorage.clear();
                        // Also clear any chunked data
                        const keys = Object.keys(localStorage);
                        keys.forEach((key) => {
                          if (
                            key.includes("_metadata") ||
                            key.includes("_chunk_")
                          ) {
                            localStorage.removeItem(key);
                          }
                        });
                        alert(
                          "Browser storage cleared successfully. Please refresh the page."
                        );
                      }
                    }}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#f59e0b",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    Clear Browser Storage
                  </button>
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        const usage = Object.keys(localStorage).reduce(
                          (total, key) => {
                            const value = localStorage.getItem(key);
                            return total + (key.length + (value?.length || 0));
                          },
                          0
                        );
                        alert(
                          `Current storage usage: ${(usage / 1024).toFixed(
                            2
                          )} KB`
                        );
                      }
                    }}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#6b7280",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    Check Storage Usage
                  </button>
                </div>
              </div>
              <button
                onClick={clearAllConfigurations}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Clear All Configurations
              </button>
            </div>
          </div>
        )}

        {activeSubTab === "embedFlags" && (
          <div>
            <h4
              style={{
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "20px",
              }}
            >
              Embed Flags Configuration
            </h4>
            <p
              style={{
                marginBottom: "20px",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Configure embed-specific flags for different ThoughtSpot embed
              types.
            </p>
            <EmbedFlagsEditor
              embedFlags={stylingConfig.embedFlags || {}}
              onChange={(embedFlags) =>
                updateStylingConfig({
                  ...stylingConfig,
                  embedFlags,
                })
              }
            />
          </div>
        )}


      </div>
    </div>
  );
}

export default function SettingsModal({
  isOpen,
  onClose,
  standardMenus,
  updateStandardMenu,
  homePageConfig,
  updateHomePageConfig,
  appConfig,
  updateAppConfig,
  fullAppConfig,
  updateFullAppConfig,
  customMenus,
  addCustomMenu,
  updateCustomMenu,
  deleteCustomMenu,
  stylingConfig,
  updateStylingConfig,
  userConfig,
  updateUserConfig,
  setMenuOrder,
  clearAllConfigurations,
  exportConfiguration,
  importConfiguration,
  initialTab,
  initialSubTab,
  onTabChange,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState(initialTab || "configuration");

  // Update activeTab when initialTab prop changes, but only if it's different
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, activeTab]);

  // Temporary state for unsaved changes
  const [pendingStandardMenus, setPendingStandardMenus] =
    useState(standardMenus);
  const [pendingHomePageConfig, setPendingHomePageConfig] =
    useState(homePageConfig);
  const [pendingAppConfig, setPendingAppConfig] = useState(appConfig);
  const [pendingFullAppConfig, setPendingFullAppConfig] =
    useState(fullAppConfig);
  const [pendingStylingConfig, setPendingStylingConfig] =
    useState(stylingConfig);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingCustomMenuSave, setPendingCustomMenuSave] =
    useState<CustomMenu | null>(null);
  const [isEditingCustomMenu, setIsEditingCustomMenu] = useState(false);
  const [isCreatingCustomMenu, setIsCreatingCustomMenu] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    message: string;
    type: "success" | "error" | null;
  }>({ message: "", type: null });
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFileName, setExportFileName] = useState("");

  // Update pending state when props change (e.g., after import)
  useEffect(() => {
    setPendingStandardMenus(standardMenus);
    setPendingHomePageConfig(homePageConfig);
    setPendingAppConfig(appConfig);
    setPendingFullAppConfig(fullAppConfig);
    setPendingStylingConfig(stylingConfig);
    setHasUnsavedChanges(false);
  }, [standardMenus, homePageConfig, appConfig, fullAppConfig, stylingConfig]);

  // Track changes in configuration
  const handleConfigChange = () => {
    setHasUnsavedChanges(true);
  };

  const handleClose = () => {
    // Check for unsaved changes in custom menu editing or general configuration
    const hasUnsavedCustomMenu =
      pendingCustomMenuSave && pendingCustomMenuSave.name.trim();

    if (hasUnsavedCustomMenu || hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onClose();
    }
  };

  const handleCancelClose = () => {
    // Close the unsaved changes dialog and return to editing
    setShowUnsavedDialog(false);
  };

  const handleConfirmClose = () => {
    // Close the dialog and discard all unsaved changes
    setShowUnsavedDialog(false);
    setHasUnsavedChanges(false);
    setPendingCustomMenuSave(null);
    // Reset pending state to current props
    setPendingStandardMenus(standardMenus);
    setPendingHomePageConfig(homePageConfig);
    setPendingAppConfig(appConfig);
    setPendingFullAppConfig(fullAppConfig);
    setPendingStylingConfig(stylingConfig);
    onClose();
  };

  // Wrapper functions that update pending state instead of immediately applying
  const updatePendingStandardMenu = (
    id: string,
    field: string,
    value: string | boolean
  ) => {
    setPendingStandardMenus((prev) =>
      prev.map((menu) => (menu.id === id ? { ...menu, [field]: value } : menu))
    );
    handleConfigChange();
  };

  const updatePendingHomePageConfig = (config: HomePageConfig) => {
    setPendingHomePageConfig(config);
    handleConfigChange();
  };

  const updatePendingAppConfig = (config: AppConfig) => {
    setPendingAppConfig(config);
    handleConfigChange();
  };

  const updatePendingFullAppConfig = (config: FullAppConfig) => {
    setPendingFullAppConfig(config);
    handleConfigChange();
  };

  const updatePendingStylingConfig = (config: StylingConfig) => {
    setPendingStylingConfig(config);
    handleConfigChange();
  };

  const handleApplyChanges = () => {
    // Apply all pending changes
    if (hasUnsavedChanges) {
      // Apply standard menus changes
      pendingStandardMenus.forEach((menu) => {
        const currentMenu = standardMenus.find((m) => m.id === menu.id);
        if (currentMenu) {
          Object.keys(menu).forEach((key) => {
            if (
              menu[key as keyof StandardMenu] !==
              currentMenu[key as keyof StandardMenu]
            ) {
              updateStandardMenu(
                menu.id,
                key,
                menu[key as keyof StandardMenu] as string | boolean
              );
            }
          });
        }
      });

      // Apply other config changes
      updateHomePageConfig(pendingHomePageConfig);
      updateAppConfig(pendingAppConfig);
      updateFullAppConfig(pendingFullAppConfig);
      updateStylingConfig(pendingStylingConfig);

      setHasUnsavedChanges(false);

      // Note: The activeTab state is preserved automatically since we don't reset it
      // The activeSubTab state in StandardMenusContent is also preserved since we don't reset it
    }
  };

  const customMenuRef = useRef<{
    saveMenu: () => void;
    cancelEdit: () => void;
  }>(null);

  const handleCustomMenuSave = () => {
    console.log("handleCustomMenuSave called", {
      pendingCustomMenuSave: pendingCustomMenuSave?.name,
      customMenuRef: customMenuRef.current ? "available" : "null",
    });

    // Add a safeguard to prevent multiple rapid calls
    if (customMenuRef.current) {
      console.log("Calling saveMenu through ref");
      customMenuRef.current.saveMenu();
    } else {
      console.log("customMenuRef.current is null, cannot save");
    }
  };

  const handleCustomMenuCancel = () => {
    customMenuRef.current?.cancelEdit();
  };

  const tabs: Tab[] = [
    {
      id: "configuration",
      name: "Configuration",
      content: (
        <ConfigurationContent
          appConfig={pendingAppConfig}
          updateAppConfig={updatePendingAppConfig}
          stylingConfig={pendingStylingConfig}
          updateStylingConfig={updateStylingConfig}
          clearAllConfigurations={clearAllConfigurations}
          exportConfiguration={exportConfiguration}
          importConfiguration={importConfiguration}
          updateStandardMenu={updateStandardMenu}
          addCustomMenu={addCustomMenu}
          updateHomePageConfig={updatePendingHomePageConfig}
          updateFullAppConfig={updatePendingFullAppConfig}
          updateUserConfig={updateUserConfig}
          setMenuOrder={setMenuOrder}
          standardMenus={pendingStandardMenus}
        />
      ),
    },
    {
      id: "standard-menus",
      name: "Standard Menus",
      content: (
        <StandardMenusContent
          standardMenus={pendingStandardMenus}
          updateStandardMenu={updatePendingStandardMenu}
          initialSubTab={initialSubTab}
          fullAppConfig={pendingFullAppConfig}
          updateFullAppConfig={updatePendingFullAppConfig}
          onSubTabChange={(subTab) => onTabChange?.("standard-menus", subTab)}
        />
      ),
    },
    {
      id: "custom-menus",
      name: "Custom Menus",
      content: (
        <CustomMenusContent
          customMenus={customMenus}
          addCustomMenu={addCustomMenu}
          updateCustomMenu={updateCustomMenu}
          deleteCustomMenu={deleteCustomMenu}
          onUnsavedChange={setHasUnsavedChanges}
          onEditingMenuChange={(menu) => {
            setPendingCustomMenuSave(menu);
            setIsEditingCustomMenu(menu !== null);
            setIsCreatingCustomMenu(
              menu !== null && !customMenus.find((m) => m.id === menu?.id)
            );
          }}
          onSaveMenu={handleCustomMenuSave}
          onCancelEdit={handleCustomMenuCancel}
          ref={customMenuRef}
        />
      ),
    },
    {
      id: "users",
      name: "Users",
      content: (
        <UserConfigContent
          userConfig={userConfig}
          updateUserConfig={updateUserConfig}
          customMenus={customMenus}
        />
      ),
    },
    {
      id: "styling",
      name: "Styling",
      content: (
        <StylingContent
          stylingConfig={pendingStylingConfig}
          updateStylingConfig={updatePendingStylingConfig}
        />
      ),
    },
    {
      id: "events",
      name: "Events",
      content: (
        <EventsContent
          stylingConfig={pendingStylingConfig}
          updateStylingConfig={updatePendingStylingConfig}
        />
      ),
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: isOpen ? "flex" : "none",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={showUnsavedDialog ? undefined : handleClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          width: "90vw",
          maxWidth: "1200px",
          height: "90vh",
          maxHeight: "800px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              margin: 0,
            }}
          >
            Settings
          </h2>
          <button
            onClick={showUnsavedDialog ? undefined : handleClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: showUnsavedDialog ? "not-allowed" : "pointer",
              padding: "4px",
              opacity: showUnsavedDialog ? 0.5 : 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                onTabChange?.(tab.id);
              }}
              style={{
                padding: "16px 24px",
                border: "none",
                background: activeTab === tab.id ? "white" : "transparent",
                color: activeTab === tab.id ? "#1f2937" : "#6b7280",
                cursor: "pointer",
                fontWeight: activeTab === tab.id ? "600" : "400",
                borderBottom:
                  activeTab === tab.id ? "2px solid #3182ce" : "none",
                fontSize: "14px",
              }}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "24px",
          }}
        >
          {tabs.find((tab) => tab.id === activeTab)?.content}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "24px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            backgroundColor: "#f9fafb",
          }}
        >
          <div style={{ display: "flex", gap: "12px" }}>
            {/* Custom Menu Save/Cancel buttons - only show when editing */}
            {isEditingCustomMenu && (
              <>
                <button
                  onClick={handleCustomMenuCancel}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomMenuSave}
                  disabled={false} // Temporarily enable for testing
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#3182ce", // Always enabled for testing
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer", // Always enabled for testing
                    fontSize: "14px",
                  }}
                  title={`Button state: pendingCustomMenuSave=${
                    pendingCustomMenuSave?.name || "null"
                  }, ref=${customMenuRef.current ? "available" : "null"}`}
                >
                  {isCreatingCustomMenu ? "Create" : "Save"}
                </button>
              </>
            )}

            {/* Apply button - show when there are unsaved changes and not editing custom menu */}
            {!isEditingCustomMenu && hasUnsavedChanges && (
              <button
                onClick={handleApplyChanges}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  marginRight: "8px",
                }}
              >
                Apply Changes
              </button>
            )}

            {/* Close button - only show when not editing custom menu */}
            {!isEditingCustomMenu && (
              <button
                onClick={showUnsavedDialog ? undefined : handleClose}
                style={{
                  padding: "8px 16px",
                  backgroundColor: showUnsavedDialog ? "#9ca3af" : "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: showUnsavedDialog ? "not-allowed" : "pointer",
                  fontSize: "14px",
                }}
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      {showUnsavedDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "24px",
              maxWidth: "400px",
              width: "90%",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              Unsaved Changes
            </h3>
            <p
              style={{
                margin: "0 0 24px 0",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              You have unsaved changes that will be lost if you close the
              dialog.
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={handleCancelClose}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClose}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
