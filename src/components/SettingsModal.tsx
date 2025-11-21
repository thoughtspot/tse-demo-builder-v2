"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import HomePage from "./pages/HomePage";
import FavoritesPage from "./pages/FavoritesPage";
import MyReportsPage from "./pages/MyReportsPage";
import SpotterPage from "./pages/SpotterPage";
import SearchPage from "./pages/SearchPage";
import FullAppPage from "./pages/FullAppPage";
import AllContentPage from "./pages/AllContentPage";
import SpotterIconPicker from "./SpotterIconPicker";
import IconPicker from "./IconPicker";
import MaterialIcon from "./MaterialIcon";
import ColorPicker from "./ColorPicker";
import ImageUpload from "./ImageUpload";
import StringMappingEditor from "./StringMappingEditor";
import CSSVariablesEditor from "./CSSVariablesEditor";
import CSSRulesEditor from "./CSSRulesEditor";
import EmbedFlagsEditor from "./EmbedFlagsEditor";
import DoubleClickEditor from "./DoubleClickEditor";
import RuntimeFiltersEditor from "./RuntimeFiltersEditor";
import {
  User,
  UserConfig,
  SavedConfiguration,
  CustomMenu,
  StylingConfig,
  HomePageConfig,
  AppConfig,
  FullAppConfig,
  StandardMenu,
} from "../types/thoughtspot";
import HiddenActionsEditor from "./HiddenActionsEditor";
import TagFilterComponent from "./TagFilterComponent";
import SearchableDropdown from "./SearchableDropdown";
import MultiSelectDropdown from "./MultiSelectDropdown";
import LoadingDialog from "./LoadingDialog";

import { fetchSavedConfigurations } from "../services/githubApi";
import {
  checkStorageHealth,
  clearStorageAndReloadDefaults,
  DEFAULT_CONFIG,
  saveAllConfigurations,
} from "../services/configurationService";
import ThemeSelector from "./ThemeSelector";
import { applyTheme } from "../types/themes";
import ConfigurationWizard, {
  WizardConfiguration,
} from "./ConfigurationWizard";

// Configuration interfaces for compatibility
interface ConfigurationData {
  standardMenus: StandardMenu[];
  customMenus: CustomMenu[];
  menuOrder: string[];
  homePageConfig: HomePageConfig;
  appConfig: AppConfig;
  fullAppConfig: FullAppConfig;
  stylingConfig: StylingConfig;
  userConfig: UserConfig;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  standardMenus: StandardMenu[];
  updateStandardMenu: (
    id: string,
    field: string,
    value: string | boolean,
    skipFaviconUpdate?: boolean
  ) => void;

  homePageConfig: HomePageConfig;
  updateHomePageConfig: (config: HomePageConfig) => void;
  appConfig: AppConfig;
  updateAppConfig: (config: AppConfig, bypassClusterWarning?: boolean) => void;
  updatePendingAppConfig?: (
    config: AppConfig,
    bypassClusterWarning?: boolean
  ) => void;
  fullAppConfig: FullAppConfig;
  updateFullAppConfig: (config: FullAppConfig) => void;
  customMenus: CustomMenu[];
  addCustomMenu: (menu: CustomMenu) => void;
  updateCustomMenu: (id: string, menu: CustomMenu) => void;
  deleteCustomMenu: (id: string) => void;
  clearCustomMenus?: () => void;
  stylingConfig: StylingConfig;
  updateStylingConfig: (config: StylingConfig) => void;
  userConfig: UserConfig;
  updateUserConfig: (config: UserConfig) => void;
  setMenuOrder?: (order: string[]) => void;
  clearAllConfigurations?: () => void;
  exportConfiguration?: (customName?: string) => Promise<void>;
  storageError?: string | null;
  setStorageError?: (error: string | null) => void;
  loadConfigurationSynchronously?: (
    config: ConfigurationData,
    onProgress?: (progress: number, message: string) => void
  ) => Promise<void>;
  setIsImportingConfiguration?: (isImporting: boolean) => void;

  initialTab?: string;
  initialSubTab?: string;
  onTabChange?: (tab: string, subTab?: string) => void;
}

interface Tab {
  id: string;
  name: string;
  content: React.ReactNode;
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
  appConfig,
  updateAppConfig,
}: {
  standardMenus: StandardMenu[];
  updateStandardMenu: (
    id: string,
    field: string,
    value: string | boolean,
    skipFaviconUpdate?: boolean
  ) => void;
  initialSubTab?: string;
  fullAppConfig: FullAppConfig;
  updateFullAppConfig: (config: FullAppConfig) => void;
  onSubTabChange?: (subTab: string) => void;
  appConfig: AppConfig;
  updateAppConfig: (config: AppConfig, bypassClusterWarning?: boolean) => void;
}) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "home");

  // Validate initial state on mount
  useEffect(() => {
    const validSubTabs = [
      "home",
      "favorites",
      "my-reports",
      "spotter",
      "search",
      "full-app",
      "all-content",
      "chatbot",
    ];
    if (!activeSubTab || !validSubTabs.includes(activeSubTab)) {
      setActiveSubTab("home");
    }
  }, []); // Empty dependency array - runs only on mount

  // Update activeSubTab when initialSubTab changes
  useEffect(() => {
    const validSubTabs = [
      "home",
      "favorites",
      "my-reports",
      "spotter",
      "search",
      "full-app",
      "all-content",
      "chatbot",
    ];

    if (
      initialSubTab &&
      validSubTabs.includes(initialSubTab) &&
      initialSubTab !== activeSubTab
    ) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab, activeSubTab]);
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
      case "all-content":
        return <AllContentPage />;
      case "chatbot":
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              fontSize: "16px",
              color: "#6b7280",
              textAlign: "center",
              padding: "20px",
            }}
          >
            <div>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>💬</div>
              <div style={{ fontWeight: "500", marginBottom: "8px" }}>
                No Preview Available
              </div>
              <div style={{ fontSize: "14px", color: "#9ca3af" }}>
                Chatbot configuration does not have a preview.
                <br />
                The chatbot will appear as a floating button in your
                application.
              </div>
            </div>
          </div>
        );
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
    {
      id: "all-content",
      name: "All Content",
      icon: standardMenus.find((m) => m.id === "all-content")?.icon || "📚",
    },
    {
      id: "chatbot",
      name: "Chatbot",
      icon: "💬",
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
                console.log("SettingsModal Debug:", {
                  activeSubTab,
                  standardMenusCount: standardMenus.length,
                  standardMenus: standardMenus.map((m) => ({
                    id: m.id,
                    name: m.name,
                    enabled: m.enabled,
                  })),
                  allContentMenu: standardMenus.find(
                    (m) => m.id === "all-content"
                  ),
                });

                // Handle special case for chatbot configuration
                if (activeSubTab === "chatbot") {
                  return (
                    <div>
                      <h4
                        style={{
                          fontSize: "18px",
                          fontWeight: "600",
                          marginBottom: "20px",
                        }}
                      >
                        Chatbot Configuration
                      </h4>
                      <p
                        style={{
                          marginBottom: "20px",
                          color: "#6b7280",
                          fontSize: "14px",
                        }}
                      >
                        Configure the AI assistant chatbot that appears in your
                        application.
                      </p>

                      {/* Enable/Disable Chatbot */}
                      <div
                        style={{
                          marginBottom: "24px",
                          padding: "16px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          backgroundColor: "#f9fafb",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "8px",
                          }}
                        >
                          <label
                            style={{
                              fontSize: "16px",
                              fontWeight: "500",
                              color: "#374151",
                            }}
                          >
                            Enable Chatbot
                          </label>
                          <input
                            type="checkbox"
                            checked={appConfig.chatbot?.enabled ?? true}
                            onChange={(e) => {
                              const updatedAppConfig = {
                                ...appConfig,
                                chatbot: {
                                  ...appConfig.chatbot,
                                  enabled: e.target.checked,
                                  defaultModelId:
                                    appConfig.chatbot?.defaultModelId,
                                  selectedModelIds:
                                    appConfig.chatbot?.selectedModelIds || [],
                                  welcomeMessage:
                                    appConfig.chatbot?.welcomeMessage ||
                                    "Hello! I'm your AI assistant. What would you like to know about your data?",
                                  position:
                                    appConfig.chatbot?.position ||
                                    "bottom-right",
                                  spotgptApiKey:
                                    appConfig.chatbot?.spotgptApiKey,
                                },
                              };
                              updateAppConfig(updatedAppConfig);
                            }}
                            style={{
                              width: "20px",
                              height: "20px",
                              cursor: "pointer",
                            }}
                          />
                        </div>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#6b7280",
                            margin: 0,
                          }}
                        >
                          Show or hide the AI assistant chatbot in your
                          application.
                        </p>
                      </div>

                      {/* Model Selection */}
                      <div
                        style={{
                          marginBottom: "24px",
                          padding: "16px",
                          border: "2px solid #3b82f6",
                          borderRadius: "8px",
                          backgroundColor: "#f0f9ff",
                        }}
                      >
                        <label
                          style={{
                            display: "block",
                            fontSize: "16px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                        >
                          Available Models
                        </label>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#6b7280",
                            margin: "0 0 12px 0",
                          }}
                        >
                          Select the models that will be available for chatbot
                          conversations.
                        </p>
                        {isLoadingModels || isLoadingWorksheets ? (
                          <div
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              color: "#6b7280",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                              backgroundColor: "white",
                            }}
                          >
                            Loading models...
                          </div>
                        ) : modelsError || worksheetsError ? (
                          <div
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              color: "#ef4444",
                              border: "1px solid #ef4444",
                              borderRadius: "4px",
                              backgroundColor: "#fef2f2",
                            }}
                          >
                            {modelsError || worksheetsError}
                          </div>
                        ) : (
                          <MultiSelectDropdown
                            value={appConfig.chatbot?.selectedModelIds || []}
                            onChange={(selectedIds) => {
                              const updatedAppConfig = {
                                ...appConfig,
                                chatbot: {
                                  ...appConfig.chatbot,
                                  enabled: appConfig.chatbot?.enabled ?? true,
                                  defaultModelId:
                                    appConfig.chatbot?.defaultModelId,
                                  selectedModelIds: selectedIds,
                                  welcomeMessage:
                                    appConfig.chatbot?.welcomeMessage ||
                                    "Hello! I'm your AI assistant. What would you like to know about your data?",
                                  position:
                                    appConfig.chatbot?.position ||
                                    "bottom-right",
                                  spotgptApiKey:
                                    appConfig.chatbot?.spotgptApiKey,
                                },
                              };
                              updateAppConfig(updatedAppConfig);
                            }}
                            options={combinedOptions}
                            placeholder="Select models for chatbot..."
                            searchPlaceholder="Search models..."
                            label=""
                            isLoading={isLoadingModels || isLoadingWorksheets}
                            error={modelsError || worksheetsError}
                          />
                        )}
                      </div>

                      {/* Chatbot Position */}
                      <div
                        style={{
                          marginBottom: "24px",
                          padding: "16px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          backgroundColor: "#f9fafb",
                        }}
                      >
                        <label
                          style={{
                            display: "block",
                            fontSize: "16px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                        >
                          Chatbot Position
                        </label>
                        <select
                          value={appConfig.chatbot?.position || "bottom-right"}
                          onChange={(e) => {
                            const updatedAppConfig = {
                              ...appConfig,
                              chatbot: {
                                ...appConfig.chatbot,
                                enabled: appConfig.chatbot?.enabled ?? true,
                                defaultModelId:
                                  appConfig.chatbot?.defaultModelId,
                                selectedModelIds:
                                  appConfig.chatbot?.selectedModelIds || [],
                                welcomeMessage:
                                  appConfig.chatbot?.welcomeMessage ||
                                  "Hello! I'm your AI assistant. What would you like to know about your data?",
                                position: e.target.value as
                                  | "bottom-right"
                                  | "bottom-left",
                              },
                            };
                            updateAppConfig(updatedAppConfig);
                          }}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                            backgroundColor: "white",
                          }}
                        >
                          <option value="bottom-right">Bottom Right</option>
                          <option value="bottom-left">Bottom Left</option>
                        </select>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#6b7280",
                            margin: "8px 0 0 0",
                          }}
                        >
                          Choose where the chatbot button appears on the screen.
                        </p>
                      </div>

                      {/* Welcome Message */}
                      <div
                        style={{
                          marginBottom: "24px",
                          padding: "16px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          backgroundColor: "#f9fafb",
                        }}
                      >
                        <label
                          style={{
                            display: "block",
                            fontSize: "16px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                        >
                          Welcome Message
                        </label>
                        <textarea
                          value={
                            appConfig.chatbot?.welcomeMessage ||
                            "Hello! I'm your AI assistant. What would you like to know about your data?"
                          }
                          onChange={(e) => {
                            const updatedAppConfig = {
                              ...appConfig,
                              chatbot: {
                                ...appConfig.chatbot,
                                enabled: appConfig.chatbot?.enabled ?? true,
                                defaultModelId:
                                  appConfig.chatbot?.defaultModelId,
                                selectedModelIds:
                                  appConfig.chatbot?.selectedModelIds || [],
                                welcomeMessage: e.target.value,
                                position:
                                  appConfig.chatbot?.position || "bottom-right",
                              },
                            };
                            updateAppConfig(updatedAppConfig);
                          }}
                          placeholder="Enter the welcome message for the chatbot..."
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                            backgroundColor: "white",
                            minHeight: "80px",
                            resize: "vertical",
                          }}
                        />
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#6b7280",
                            margin: "8px 0 0 0",
                          }}
                        >
                          The message shown when users first open the chatbot.
                        </p>
                      </div>

                      {/* SpotGPT API Key */}
                      <div
                        style={{
                          marginBottom: "24px",
                          padding: "16px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          backgroundColor: "#f9fafb",
                        }}
                      >
                        <label
                          style={{
                            display: "block",
                            fontSize: "16px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                        >
                          SpotGPT API Key
                        </label>
                        <input
                          type="password"
                          value={appConfig.chatbot?.spotgptApiKey || ""}
                          onChange={(e) => {
                            const updatedAppConfig = {
                              ...appConfig,
                              chatbot: {
                                ...appConfig.chatbot,
                                enabled: appConfig.chatbot?.enabled ?? true,
                                defaultModelId:
                                  appConfig.chatbot?.defaultModelId,
                                selectedModelIds:
                                  appConfig.chatbot?.selectedModelIds || [],
                                welcomeMessage:
                                  appConfig.chatbot?.welcomeMessage ||
                                  "Hello! I'm your AI assistant. What would you like to know about your data?",
                                position:
                                  appConfig.chatbot?.position || "bottom-right",
                                spotgptApiKey: e.target.value,
                              },
                            };
                            updateAppConfig(updatedAppConfig);
                          }}
                          placeholder="Enter your SpotGPT API key..."
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                            backgroundColor: "white",
                          }}
                        />
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#6b7280",
                            margin: "8px 0 0 0",
                          }}
                        >
                          API key for SpotGPT to handle general questions and
                          question classification. Leave empty to use
                          environment variable SPOTGPT_API_KEY.
                        </p>
                      </div>
                    </div>
                  );
                }

                const menu = standardMenus.find((m) => m.id === activeSubTab);
                if (!menu) {
                  console.error(
                    "Menu not found for activeSubTab:",
                    activeSubTab,
                    "Available menus:",
                    standardMenus.map((m) => m.id)
                  );
                  return (
                    <div>Menu configuration not found for: {activeSubTab}</div>
                  );
                }

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
                            gridTemplateColumns: "1fr",
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
                            gridTemplateColumns: "1fr",
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

                    {menu.id === "all-content" && (
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
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={menu.excludeSystemContent || false}
                                onChange={(e) =>
                                  updateStandardMenu(
                                    menu.id,
                                    "excludeSystemContent",
                                    e.target.checked
                                  )
                                }
                                style={{ transform: "scale(1.2)" }}
                              />
                              <span style={{ fontSize: "14px" }}>
                                Exclude System Content
                              </span>
                            </label>
                            <p
                              style={{
                                margin: "4px 0 0 0",
                                fontSize: "12px",
                                color: "#6b7280",
                              }}
                            >
                              Hide content with author &quot;system&quot;
                            </p>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "16px",
                            marginTop: "16px",
                          }}
                        >
                          <div>
                            <label
                              style={{
                                display: "block",
                                fontSize: "14px",
                                fontWeight: "500",
                                marginBottom: "8px",
                                color: "#374151",
                              }}
                            >
                              Name Pattern Filter
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
                              placeholder="e.g., 'Sales', 'Q4', 'Dashboard'"
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                fontSize: "14px",
                                backgroundColor: "#ffffff",
                              }}
                            />
                            <p
                              style={{
                                margin: "4px 0 0 0",
                                fontSize: "12px",
                                color: "#6b7280",
                              }}
                            >
                              Show only content with names containing this text
                            </p>
                          </div>

                          <div>
                            <TagFilterComponent
                              value={menu.tagFilter || ""}
                              onChange={(value) =>
                                updateStandardMenu(menu.id, "tagFilter", value)
                              }
                              availableTags={availableTags}
                              isLoading={isLoadingTags}
                              error={tagsError}
                              label="Tag Filter"
                              description="Show only content tagged with this tag"
                            />
                          </div>
                        </div>
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
                            <ImageUpload
                              value={menu.homePageValue || ""}
                              onChange={(url) =>
                                updateStandardMenu(
                                  menu.id,
                                  "homePageValue",
                                  url
                                )
                              }
                              label="Home Page Image"
                              placeholder="Upload or enter image URL"
                              maxSizeMB={2}
                              maxWidth={1200}
                              maxHeight={800}
                              useIndexedDB={true}
                            />
                          </div>
                        )}

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
                              Background Color
                            </label>
                            <ColorPicker
                              value={menu.homePageBackgroundColor || "#f7fafc"}
                              onChange={(color) =>
                                updateStandardMenu(
                                  menu.id,
                                  "homePageBackgroundColor",
                                  color
                                )
                              }
                              label="Choose background color for image display"
                            />
                            <div
                              style={{
                                marginTop: "8px",
                                padding: "8px 12px",
                                backgroundColor: "#f0f9ff",
                                border: "1px solid #0ea5e9",
                                borderRadius: "4px",
                                fontSize: "12px",
                                color: "#0c4a6e",
                              }}
                            >
                              💡 <strong>Tip:</strong> When you upload an image,
                              the system will automatically analyze it and
                              suggest a complementary background color that
                              looks great with your image!
                            </div>
                          </div>
                        )}

                        {menu.homePageType === "image" && (
                          <div style={{ marginBottom: "16px" }}>
                            <label
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "8px",
                                fontWeight: "500",
                                fontSize: "14px",
                                cursor: "pointer",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={
                                  menu.homePageMaintainAspectRatio !== false
                                }
                                onChange={(e) =>
                                  updateStandardMenu(
                                    menu.id,
                                    "homePageMaintainAspectRatio",
                                    e.target.checked
                                  )
                                }
                                style={{
                                  margin: 0,
                                  cursor: "pointer",
                                }}
                              />
                              Maintain Aspect Ratio
                            </label>
                            <div
                              style={{
                                marginTop: "4px",
                                padding: "8px 12px",
                                backgroundColor: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: "4px",
                                fontSize: "12px",
                                color: "#64748b",
                              }}
                            >
                              <strong>Checked:</strong> Image will maintain its
                              original proportions and fit within the available
                              space
                              <br />
                              <strong>Unchecked:</strong> Image will stretch to
                              fill the entire available space, potentially
                              changing its proportions
                            </div>
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
                              onChange={(e) => {
                                const url = e.target.value;
                                // Prevent setting the same application URL
                                if (
                                  url &&
                                  url.startsWith(window.location.origin)
                                ) {
                                  alert(
                                    "⚠️ You cannot embed this application within itself. This would create an infinite loop. Please use an external website URL."
                                  );
                                  return;
                                }
                                updateStandardMenu(
                                  menu.id,
                                  "homePageValue",
                                  url
                                );
                              }}
                              placeholder="https://example.com"
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
                                margin: "8px 0 0 0",
                                fontSize: "12px",
                                color: "#6b7280",
                                fontStyle: "italic",
                              }}
                            >
                              Enter a website URL to embed. The website must
                              allow iframe embedding.{" "}
                              <strong>
                                Do not use this application&apos;s URL.
                              </strong>
                            </p>
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
  const [availableModels, setAvailableModels] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Icon picker state is no longer needed for the new IconPicker component

  // Filter states
  const [liveboardFilter, setLiveboardFilter] = useState("");
  const [answerFilter, setAnswerFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [directEmbedFilter, setDirectEmbedFilter] = useState("");

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

  // Filtered lists for direct embed
  const getFilteredDirectEmbedContent = () => {
    const filter = directEmbedFilter.toLowerCase();
    const embedType = editingMenu?.contentSelection?.directEmbed?.type;

    if (embedType === "liveboard") {
      return availableLiveboards.filter((liveboard) =>
        liveboard.name.toLowerCase().includes(filter)
      );
    } else if (embedType === "answer") {
      return availableAnswers.filter((answer) =>
        answer.name.toLowerCase().includes(filter)
      );
    } else if (embedType === "spotter") {
      return availableModels.filter((model) =>
        model.name.toLowerCase().includes(filter)
      );
    }
    return [];
  };

  // Clear direct embed filter when content type changes
  useEffect(() => {
    setDirectEmbedFilter("");
  }, [editingMenu?.contentSelection?.directEmbed?.type]);

  // Load available content and tags
  useEffect(() => {
    const loadContent = async () => {
      try {
        setIsLoadingContent(true);
        const { fetchLiveboards, fetchAnswers, fetchTags, fetchModels } =
          await import("../services/thoughtspotApi");

        const [liveboards, answers, tags, models] = await Promise.all([
          fetchLiveboards(),
          fetchAnswers(),
          fetchTags(),
          fetchModels(),
        ]);

        setAvailableLiveboards(
          liveboards.map((l) => ({ id: l.id, name: l.name }))
        );
        setAvailableAnswers(answers.map((a) => ({ id: a.id, name: a.name })));
        setAvailableTags(tags);
        setAvailableModels(models.map((m) => ({ id: m.id, name: m.name })));
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
    // Remove the onCancelEdit callback to prevent infinite loop
  }, [onUnsavedChange]);

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
    onEditingMenuChange?.(editingMenu);
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
        <>
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
                  setEditingMenu({
                    ...editingMenu,
                    description: e.target.value,
                  })
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
                    setEditingMenu({
                      ...editingMenu,
                      enabled: e.target.checked,
                    })
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
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
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
                    checked={editingMenu.contentSelection.type === "direct"}
                    onChange={() =>
                      setEditingMenu({
                        ...editingMenu,
                        contentSelection: {
                          type: "direct",
                          directEmbed: {
                            type: "liveboard",
                            contentId: "",
                            contentName: "",
                            contentDescription: "",
                          },
                        },
                      })
                    }
                    style={{ cursor: "pointer" }}
                  />
                  <span style={{ fontSize: "14px" }}>Direct embed</span>
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
                      editingMenu.contentSelection.specificContent
                        ?.liveboards || []
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
                      editingMenu.contentSelection.specificContent?.answers ||
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

            {editingMenu.contentSelection.type === "direct" && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Content Type
                  </label>
                  <select
                    value={
                      editingMenu.contentSelection.directEmbed?.type ||
                      "liveboard"
                    }
                    onChange={(e) =>
                      setEditingMenu({
                        ...editingMenu,
                        contentSelection: {
                          ...editingMenu.contentSelection,
                          directEmbed: {
                            ...editingMenu.contentSelection.directEmbed!,
                            type: e.target.value as
                              | "liveboard"
                              | "answer"
                              | "spotter",
                          },
                        },
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  >
                    <option value="liveboard">Liveboard</option>
                    <option value="answer">Answer</option>
                    <option value="spotter">Spotter Model</option>
                  </select>
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
                    {editingMenu.contentSelection.directEmbed?.type ===
                    "liveboard"
                      ? "Liveboard"
                      : editingMenu.contentSelection.directEmbed?.type ===
                        "answer"
                      ? "Answer"
                      : "Spotter Model"}
                  </label>
                  <input
                    type="text"
                    placeholder={`Filter ${
                      editingMenu.contentSelection.directEmbed?.type ===
                      "liveboard"
                        ? "liveboards"
                        : editingMenu.contentSelection.directEmbed?.type ===
                          "answer"
                        ? "answers"
                        : "models"
                    }...`}
                    value={directEmbedFilter}
                    onChange={(e) => setDirectEmbedFilter(e.target.value)}
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
                    value={
                      editingMenu.contentSelection.directEmbed?.contentId || ""
                    }
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedName =
                        e.target.selectedOptions[0]?.text || "";
                      setEditingMenu({
                        ...editingMenu,
                        contentSelection: {
                          ...editingMenu.contentSelection,
                          directEmbed: {
                            ...editingMenu.contentSelection.directEmbed!,
                            contentId: selectedId,
                            contentName: selectedName,
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
                    }}
                  >
                    <option value="">
                      Select a{" "}
                      {editingMenu.contentSelection.directEmbed?.type ===
                      "liveboard"
                        ? "liveboard"
                        : editingMenu.contentSelection.directEmbed?.type ===
                          "answer"
                        ? "answer"
                        : "model"}
                    </option>
                    {isLoadingContent ? (
                      <option disabled>Loading...</option>
                    ) : (
                      getFilteredDirectEmbedContent().map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))
                    )}
                  </select>
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
                    Content Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter a display name for the content"
                    value={
                      editingMenu.contentSelection.directEmbed?.contentName ||
                      ""
                    }
                    onChange={(e) =>
                      setEditingMenu({
                        ...editingMenu,
                        contentSelection: {
                          ...editingMenu.contentSelection,
                          directEmbed: {
                            ...editingMenu.contentSelection.directEmbed!,
                            contentName: e.target.value,
                          },
                        },
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  />
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
                    Content Description (Optional)
                  </label>
                  <textarea
                    placeholder="Enter a description for the content"
                    value={
                      editingMenu.contentSelection.directEmbed
                        ?.contentDescription || ""
                    }
                    onChange={(e) =>
                      setEditingMenu({
                        ...editingMenu,
                        contentSelection: {
                          ...editingMenu.contentSelection,
                          directEmbed: {
                            ...editingMenu.contentSelection.directEmbed!,
                            contentDescription: e.target.value,
                          },
                        },
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "14px",
                      minHeight: "80px",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Save and Cancel buttons */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
              marginTop: "20px",
            }}
          >
            <button
              onClick={handleCancelEdit}
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
              onClick={handleSaveMenu}
              disabled={!editingMenu?.name.trim()}
              style={{
                padding: "8px 16px",
                backgroundColor: editingMenu?.name.trim()
                  ? "#3182ce"
                  : "#9ca3af",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: editingMenu?.name.trim() ? "pointer" : "not-allowed",
                fontSize: "14px",
              }}
            >
              {isCreating ? "Create" : "Save"}
            </button>
          </div>
        </>
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
                  ) : menu.contentSelection.type === "tag" ? (
                    <>
                      {menu.contentSelection.tagIdentifiers?.length || 0} tags
                    </>
                  ) : (
                    <>
                      Direct{" "}
                      {menu.contentSelection.directEmbed?.type || "embed"}:{" "}
                      {menu.contentSelection.directEmbed?.contentName ||
                        menu.contentSelection.directEmbed?.contentId ||
                        "Not configured"}
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
  updateStandardMenu,
}: {
  stylingConfig: StylingConfig;
  updateStylingConfig: (config: StylingConfig) => void;
  updateStandardMenu?: (
    id: string,
    field: string,
    value: string | boolean
  ) => void;
}) {
  const [activeSubTab, setActiveSubTab] = useState("application");
  const [showStyleWizard, setShowStyleWizard] = useState(false);
  const [styleDescription, setStyleDescription] = useState("");
  const [isGeneratingStyle, setIsGeneratingStyle] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Ensure we always have a valid sub-tab selected
  useEffect(() => {
    const validSubTabs = ["application", "embedded"];
    if (!validSubTabs.includes(activeSubTab)) {
      setActiveSubTab("application");
    }
  }, [activeSubTab]);

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

  const updateButtonStyles = (
    buttonType: "primary" | "secondary",
    field: string,
    value: string
  ) => {
    updateStylingConfig({
      ...stylingConfig,
      application: {
        ...stylingConfig.application,
        buttons: {
          ...stylingConfig.application.buttons,
          [buttonType]: {
            ...stylingConfig.application.buttons?.[buttonType],
            [field]: value,
          },
        },
      },
    });
  };

  const updateBackgroundStyles = (field: string, value: string) => {
    updateStylingConfig({
      ...stylingConfig,
      application: {
        ...stylingConfig.application,
        backgrounds: {
          ...stylingConfig.application.backgrounds,
          [field]: value,
        },
      },
    });
  };

  const updateTypographyStyles = (field: string, value: string) => {
    updateStylingConfig({
      ...stylingConfig,
      application: {
        ...stylingConfig.application,
        typography: {
          ...stylingConfig.application.typography,
          [field]: value,
        },
      },
    });
  };

  const updateEmbeddedContent = (field: string, value: unknown) => {
    console.log("updateEmbeddedContent called with:", field, value);
    console.log(
      "Current stylingConfig.embeddedContent:",
      stylingConfig.embeddedContent
    );

    const newConfig = {
      ...stylingConfig,
      embeddedContent: {
        ...stylingConfig.embeddedContent,
        [field]: value,
      },
    };

    console.log("New embeddedContent:", newConfig.embeddedContent);
    console.log(
      "updateEmbeddedContent: calling updateStylingConfig with iconSpriteUrl:",
      newConfig.embeddedContent.iconSpriteUrl
    );
    console.log(
      "updateEmbeddedContent: stringIDs after update:",
      newConfig.embeddedContent.stringIDs
    );
    updateStylingConfig(newConfig);

    // For iconSpriteUrl changes, the navigation menu should update immediately
    // The user will need to click "Apply Changes" to persist the selection
    if (field === "iconSpriteUrl") {
      console.log(
        "Icon selection updated - navigation menu should update immediately"
      );
    }
  };

  const handleGenerateStyle = async () => {
    if (!styleDescription.trim()) {
      setGenerationError("Please provide a style description.");
      return;
    }

    try {
      setIsGeneratingStyle(true);
      setGenerationError(null);

      console.log(
        "Calling style generation API with description:",
        styleDescription
      );

      const response = await fetch("/api/anthropic/generate-style", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: styleDescription }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate style");
      }

      const styleConfig = await response.json();

      console.log("Received style configuration:", styleConfig);

      // Update the styling configuration with the generated styles
      const newStylingConfig: StylingConfig = {
        ...stylingConfig,
        application: {
          ...stylingConfig.application,
          topBar: styleConfig.applicationStyles.topBar,
          sidebar: styleConfig.applicationStyles.sidebar,
          footer: {
            ...stylingConfig.application.footer,
            backgroundColor:
              styleConfig.applicationStyles.backgrounds?.contentBackground ||
              stylingConfig.application.footer.backgroundColor,
            foregroundColor:
              styleConfig.applicationStyles.typography?.secondaryColor ||
              stylingConfig.application.footer.foregroundColor,
          },
          dialogs: {
            ...stylingConfig.application.dialogs,
            backgroundColor:
              styleConfig.applicationStyles.backgrounds?.contentBackground ||
              stylingConfig.application.dialogs.backgroundColor,
          },
          buttons: styleConfig.applicationStyles.buttons,
          backgrounds: styleConfig.applicationStyles.backgrounds,
          typography: styleConfig.applicationStyles.typography,
        },
        embeddedContent: {
          ...stylingConfig.embeddedContent,
          customCSS: {
            ...stylingConfig.embeddedContent.customCSS,
            variables: styleConfig.embeddedContentVariables,
          },
        },
      };

      updateStylingConfig(newStylingConfig);

      // Close the wizard on success
      setShowStyleWizard(false);
      setStyleDescription("");
    } catch (error) {
      console.error("Error generating style:", error);
      setGenerationError(
        error instanceof Error
          ? error.message
          : "Failed to generate style. Please try again."
      );
    } finally {
      setIsGeneratingStyle(false);
    }
  };

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
        <h3
          style={{
            margin: 0,
            fontSize: "20px",
            fontWeight: "bold",
          }}
        >
          Styling Configuration
        </h3>
        <button
          onClick={() => setShowStyleWizard(true)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#8b5cf6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          title="Generate styles using AI based on your description"
        >
          <MaterialIcon icon="auto_fix_high" style={{ fontSize: "18px" }} />
          Style Wizard
        </button>
      </div>

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

            {/* Theme Selector */}
            <ThemeSelector
              selectedTheme={
                stylingConfig.application.selectedTheme || "default"
              }
              onThemeChange={(themeId) => {
                const newStyles = applyTheme(
                  themeId,
                  stylingConfig.application
                );
                updateStylingConfig({
                  ...stylingConfig,
                  application: newStyles,
                });
              }}
            />

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

            {/* Button Styling */}
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
                Primary Buttons
              </h5>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <ColorPicker
                  value={
                    stylingConfig.application.buttons?.primary
                      ?.backgroundColor || "#3182ce"
                  }
                  onChange={(value) =>
                    updateButtonStyles("primary", "backgroundColor", value)
                  }
                  label="Background Color"
                />
                <ColorPicker
                  value={
                    stylingConfig.application.buttons?.primary
                      ?.foregroundColor || "#ffffff"
                  }
                  onChange={(value) =>
                    updateButtonStyles("primary", "foregroundColor", value)
                  }
                  label="Text Color"
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <ColorPicker
                  value={
                    stylingConfig.application.buttons?.primary?.borderColor ||
                    "#3182ce"
                  }
                  onChange={(value) =>
                    updateButtonStyles("primary", "borderColor", value)
                  }
                  label="Border Color"
                />
                <ColorPicker
                  value={
                    stylingConfig.application.buttons?.primary
                      ?.hoverBackgroundColor || "#2c5aa0"
                  }
                  onChange={(value) =>
                    updateButtonStyles("primary", "hoverBackgroundColor", value)
                  }
                  label="Hover Background"
                />
              </div>

              <ColorPicker
                value={
                  stylingConfig.application.buttons?.primary
                    ?.hoverForegroundColor || "#ffffff"
                }
                onChange={(value) =>
                  updateButtonStyles("primary", "hoverForegroundColor", value)
                }
                label="Hover Text Color"
              />
            </div>

            {/* Secondary Button Styling */}
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
                Secondary Buttons
              </h5>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <ColorPicker
                  value={
                    stylingConfig.application.buttons?.secondary
                      ?.backgroundColor || "#ffffff"
                  }
                  onChange={(value) =>
                    updateButtonStyles("secondary", "backgroundColor", value)
                  }
                  label="Background Color"
                />
                <ColorPicker
                  value={
                    stylingConfig.application.buttons?.secondary
                      ?.foregroundColor || "#374151"
                  }
                  onChange={(value) =>
                    updateButtonStyles("secondary", "foregroundColor", value)
                  }
                  label="Text Color"
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <ColorPicker
                  value={
                    stylingConfig.application.buttons?.secondary?.borderColor ||
                    "#d1d5db"
                  }
                  onChange={(value) =>
                    updateButtonStyles("secondary", "borderColor", value)
                  }
                  label="Border Color"
                />
                <ColorPicker
                  value={
                    stylingConfig.application.buttons?.secondary
                      ?.hoverBackgroundColor || "#f9fafb"
                  }
                  onChange={(value) =>
                    updateButtonStyles(
                      "secondary",
                      "hoverBackgroundColor",
                      value
                    )
                  }
                  label="Hover Background"
                />
              </div>

              <ColorPicker
                value={
                  stylingConfig.application.buttons?.secondary
                    ?.hoverForegroundColor || "#374151"
                }
                onChange={(value) =>
                  updateButtonStyles("secondary", "hoverForegroundColor", value)
                }
                label="Hover Text Color"
              />
            </div>

            {/* Background Styling */}
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
                Backgrounds
              </h5>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <ColorPicker
                  value={
                    stylingConfig.application.backgrounds?.mainBackground ||
                    "#f7fafc"
                  }
                  onChange={(value) =>
                    updateBackgroundStyles("mainBackground", value)
                  }
                  label="Main Background"
                />
                <ColorPicker
                  value={
                    stylingConfig.application.backgrounds?.contentBackground ||
                    "#ffffff"
                  }
                  onChange={(value) =>
                    updateBackgroundStyles("contentBackground", value)
                  }
                  label="Content Background"
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <ColorPicker
                  value={
                    stylingConfig.application.backgrounds?.cardBackground ||
                    "#ffffff"
                  }
                  onChange={(value) =>
                    updateBackgroundStyles("cardBackground", value)
                  }
                  label="Card Background"
                />
                <ColorPicker
                  value={
                    stylingConfig.application.backgrounds?.borderColor ||
                    "#e2e8f0"
                  }
                  onChange={(value) =>
                    updateBackgroundStyles("borderColor", value)
                  }
                  label="Border Color"
                />
              </div>
            </div>

            {/* Typography Styling */}
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
                Typography
              </h5>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <ColorPicker
                  value={
                    stylingConfig.application.typography?.primaryColor ||
                    "#1f2937"
                  }
                  onChange={(value) =>
                    updateTypographyStyles("primaryColor", value)
                  }
                  label="Primary Text Color"
                />
                <ColorPicker
                  value={
                    stylingConfig.application.typography?.secondaryColor ||
                    "#6b7280"
                  }
                  onChange={(value) =>
                    updateTypographyStyles("secondaryColor", value)
                  }
                  label="Secondary Text Color"
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <ColorPicker
                  value={
                    stylingConfig.application.typography?.linkColor || "#3182ce"
                  }
                  onChange={(value) =>
                    updateTypographyStyles("linkColor", value)
                  }
                  label="Link Color"
                />
                <ColorPicker
                  value={
                    stylingConfig.application.typography?.linkHoverColor ||
                    "#2c5aa0"
                  }
                  onChange={(value) =>
                    updateTypographyStyles("linkHoverColor", value)
                  }
                  label="Link Hover Color"
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

            {/* Spotter Icon Selection */}
            <div style={{ marginBottom: "24px" }}>
              <SpotterIconPicker
                selectedIcon={stylingConfig.embeddedContent.iconSpriteUrl}
                onIconSelect={(iconUrl) =>
                  updateEmbeddedContent("iconSpriteUrl", iconUrl)
                }
                onMenuIconUpdate={(menuIconUrl) => {
                  if (updateStandardMenu) {
                    updateStandardMenu("spotter", "icon", menuIconUrl);
                  }
                }}
                title="Spotter Icon Selection"
                description="Choose an icon for your Spotter embed. This will be used as the iconSpriteUrl in the embed configuration and will also update the Spotter menu icon."
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

      {/* Style Wizard Modal */}
      {showStyleWizard && (
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
            zIndex: 10000,
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isGeneratingStyle) {
              setShowStyleWizard(false);
              setStyleDescription("");
              setGenerationError(null);
            }
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "24px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "sticky",
                top: 0,
                backgroundColor: "white",
                zIndex: 1,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <MaterialIcon
                  icon="auto_fix_high"
                  style={{ fontSize: "32px", color: "#8b5cf6" }}
                />
                <h2
                  style={{
                    margin: 0,
                    fontSize: "24px",
                    fontWeight: "600",
                    color: "#1f2937",
                  }}
                >
                  Style Wizard
                </h2>
              </div>
              {!isGeneratingStyle && (
                <button
                  onClick={() => {
                    setShowStyleWizard(false);
                    setStyleDescription("");
                    setGenerationError(null);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px",
                    color: "#6b7280",
                  }}
                >
                  <MaterialIcon icon="close" style={{ fontSize: "24px" }} />
                </button>
              )}
            </div>

            {/* Content */}
            <div style={{ padding: "24px" }}>
              <p
                style={{
                  marginTop: 0,
                  marginBottom: "24px",
                  color: "#6b7280",
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              >
                Describe your desired style and colors, and AI will generate a
                complete styling configuration for your application and embedded
                ThoughtSpot content.
              </p>

              {/* Style Description */}
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                    color: "#374151",
                    fontSize: "14px",
                  }}
                >
                  Style Description
                </label>
                <textarea
                  value={styleDescription}
                  onChange={(e) => setStyleDescription(e.target.value)}
                  placeholder="Describe your desired style and colors. For example: 'Professional corporate theme with navy blue primary color (#1e3a8a), light gray backgrounds, and orange accents for buttons. Use modern, clean design with subtle shadows.'"
                  rows={6}
                  disabled={isGeneratingStyle}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    resize: "vertical",
                    boxSizing: "border-box",
                    opacity: isGeneratingStyle ? 0.6 : 1,
                  }}
                />
                <p
                  style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "#6b7280",
                    fontStyle: "italic",
                  }}
                >
                  💡 Tip: Be specific about colors, mood, and design preferences
                  for best results.
                </p>
              </div>

              {/* Error Message */}
              {generationError && (
                <div
                  style={{
                    padding: "12px 16px",
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fca5a5",
                    borderRadius: "6px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <MaterialIcon
                      icon="error"
                      style={{ fontSize: "20px", color: "#dc2626" }}
                    />
                    <span style={{ color: "#dc2626", fontSize: "14px" }}>
                      {generationError}
                    </span>
                  </div>
                  <button
                    onClick={handleGenerateStyle}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <MaterialIcon icon="refresh" style={{ fontSize: "16px" }} />
                    Try Again
                  </button>
                </div>
              )}

              {/* Loading Indicator */}
              {isGeneratingStyle && (
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "6px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: "#1e40af",
                          fontSize: "14px",
                          fontWeight: "500",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span>Generating styles</span>
                        <span
                          style={{
                            display: "inline-flex",
                            gap: "2px",
                            letterSpacing: "2px",
                          }}
                        >
                          <span
                            style={{
                              animation: "pulse 1.4s ease-in-out infinite",
                            }}
                          >
                            •
                          </span>
                          <span
                            style={{
                              animation: "pulse 1.4s ease-in-out 0.2s infinite",
                            }}
                          >
                            •
                          </span>
                          <span
                            style={{
                              animation: "pulse 1.4s ease-in-out 0.4s infinite",
                            }}
                          >
                            •
                          </span>
                        </span>
                      </div>
                      <div
                        style={{
                          color: "#60a5fa",
                          fontSize: "12px",
                          marginTop: "4px",
                        }}
                      >
                        This may take a moment. AI is creating your custom
                        theme.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "24px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                position: "sticky",
                bottom: 0,
                backgroundColor: "white",
              }}
            >
              <button
                onClick={() => {
                  setShowStyleWizard(false);
                  setStyleDescription("");
                  setGenerationError(null);
                }}
                disabled={isGeneratingStyle}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "white",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: isGeneratingStyle ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  opacity: isGeneratingStyle ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateStyle}
                disabled={isGeneratingStyle || !styleDescription.trim()}
                style={{
                  padding: "10px 20px",
                  backgroundColor:
                    isGeneratingStyle || !styleDescription.trim()
                      ? "#9ca3af"
                      : "#8b5cf6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor:
                    isGeneratingStyle || !styleDescription.trim()
                      ? "not-allowed"
                      : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {isGeneratingStyle ? (
                  <>
                    <span>Updating</span>
                    <span
                      style={{
                        display: "inline-flex",
                        gap: "2px",
                        letterSpacing: "2px",
                      }}
                    >
                      <span
                        style={{ animation: "pulse 1.4s ease-in-out infinite" }}
                      >
                        •
                      </span>
                      <span
                        style={{
                          animation: "pulse 1.4s ease-in-out 0.2s infinite",
                        }}
                      >
                        •
                      </span>
                      <span
                        style={{
                          animation: "pulse 1.4s ease-in-out 0.4s infinite",
                        }}
                      >
                        •
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                    <MaterialIcon
                      icon="auto_fix_high"
                      style={{ fontSize: "18px" }}
                    />
                    Generate Styles
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
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
          "all-content": true,
        },
        customMenus: [],
        hiddenActions: { enabled: false, actions: [] },
        runtimeFilters: [],
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
          "all-content": true,
        },
        customMenus: [],
        hiddenActions: { enabled: false, actions: [] },
        runtimeFilters: [],
      },
    },
  ];

  // Initialize with default users if none exist and migrate existing users
  useEffect(() => {
    if (userConfig.users.length === 0) {
      updateUserConfig({
        users: defaultUsers,
        currentUserId: defaultUsers[0].id,
      });
    } else {
      // Migrate existing users to include any missing standard menu permissions
      const updatedUsers = userConfig.users.map((user) => {
        const updatedUser = { ...user };
        const currentStandardMenus = user.access?.standardMenus || {};

        // Ensure all standard menus are present with default values
        const allStandardMenus = {
          home: true,
          favorites: true,
          "my-reports": true,
          spotter: true,
          search: true,
          "full-app": true,
          "all-content": true,
        };

        // Merge existing permissions with missing ones (keeping existing values)
        updatedUser.access = {
          ...user.access,
          standardMenus: {
            ...allStandardMenus,
            ...currentStandardMenus,
          },
          // Preserve existing runtime filters and other access properties
          runtimeFilters: user.access?.runtimeFilters || [],
          hiddenActions: user.access?.hiddenActions || {
            enabled: false,
            actions: [],
          },
          customMenus: user.access?.customMenus || [],
        };

        return updatedUser;
      });

      // Only update if there were changes
      const hasChanges = updatedUsers.some((updatedUser, index) => {
        const originalUser = userConfig.users[index];
        return (
          JSON.stringify(updatedUser.access.standardMenus) !==
          JSON.stringify(originalUser.access.standardMenus)
        );
      });

      if (hasChanges) {
        console.log(
          "Migrating users to include missing standard menu permissions"
        );
        console.log(
          "Updated users with runtime filters preserved:",
          updatedUsers.map((u) => ({
            id: u.id,
            name: u.name,
            runtimeFilters: u.access.runtimeFilters,
          }))
        );
        updateUserConfig({
          ...userConfig,
          users: updatedUsers,
        });
      }
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
          "all-content": true,
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
      // Update the user description based on the current access configuration
      const updatedUser = { ...editingUser };

      // Debug: Log the runtime filters before saving
      console.log(
        "Saving user with runtime filters:",
        updatedUser.access.runtimeFilters
      );
      if (
        updatedUser.access.standardMenus["full-app"] &&
        updatedUser.access.standardMenus["search"]
      ) {
        updatedUser.description =
          "Full access - can access all features including Search and Full App";
      } else if (updatedUser.access.standardMenus["full-app"]) {
        updatedUser.description =
          "Limited access - can access Full App but not Search";
      } else if (updatedUser.access.standardMenus["search"]) {
        updatedUser.description =
          "Limited access - can access Search but not Full App";
      } else {
        updatedUser.description =
          "Limited access - cannot access Search and Full App";
      }

      if (isCreating) {
        updateUserConfig({
          ...userConfig,
          users: [...userConfig.users, updatedUser],
        });
      } else {
        updateUserConfig({
          ...userConfig,
          users: userConfig.users.map((user) =>
            user.id === updatedUser.id ? updatedUser : user
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

    // Update the user description based on the new access configuration
    if (
      field === "standardMenus" &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      const standardMenus = value as Record<string, boolean>;
      if (standardMenus["full-app"] && standardMenus["search"]) {
        updatedUser.description =
          "Full access - can access all features including Search and Full App";
      } else if (standardMenus["full-app"]) {
        updatedUser.description =
          "Limited access - can access Full App but not Search";
      } else if (standardMenus["search"]) {
        updatedUser.description =
          "Limited access - can access Search but not Full App";
      } else {
        updatedUser.description =
          "Limited access - cannot access Search and Full App";
      }
    }

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
            {currentUser.access.standardMenus["full-app"] &&
            currentUser.access.standardMenus["search"]
              ? "Full access - can access all features including Search and Full App"
              : currentUser.access.standardMenus["full-app"]
              ? "Limited access - can access Full App but not Search"
              : currentUser.access.standardMenus["search"]
              ? "Limited access - can access Search but not Full App"
              : "Limited access - cannot access Search and Full App"}
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
                marginBottom: "12px",
                padding: "8px 12px",
                backgroundColor: "#f0f9ff",
                border: "1px solid #bae6fd",
                borderRadius: "4px",
                fontSize: "12px",
                color: "#0369a1",
              }}
            >
              <strong>Current Access:</strong> {editingUser.description}
            </div>
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
                        const updatedStandardMenus = {
                          ...editingUser.access.standardMenus,
                          [menuId]: e.target.checked,
                        };

                        // Update the user description based on the new access configuration
                        let newDescription = "";
                        if (
                          updatedStandardMenus["full-app"] &&
                          updatedStandardMenus["search"]
                        ) {
                          newDescription =
                            "Full access - can access all features including Search and Full App";
                        } else if (updatedStandardMenus["full-app"]) {
                          newDescription =
                            "Limited access - can access Full App but not Search";
                        } else if (updatedStandardMenus["search"]) {
                          newDescription =
                            "Limited access - can access Search but not Full App";
                        } else {
                          newDescription =
                            "Limited access - cannot access Search and Full App";
                        }

                        const updatedUser = {
                          ...editingUser,
                          description: newDescription,
                          access: {
                            ...editingUser.access,
                            standardMenus: updatedStandardMenus,
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

          <div style={{ marginBottom: "20px" }}>
            <h5
              style={{
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "12px",
              }}
            >
              Runtime Filters
            </h5>
            <p
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "12px",
              }}
            >
              Configure filters that will be applied to all embedded content for
              this user.
            </p>
            <RuntimeFiltersEditor
              runtimeFilters={editingUser.access.runtimeFilters || []}
              onFiltersChange={(filters) => {
                const updatedUser = {
                  ...editingUser,
                  access: {
                    ...editingUser.access,
                    runtimeFilters: filters,
                  },
                };
                setEditingUser(updatedUser);
              }}
            />
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
                {/* Dynamic description based on current access */}
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  <strong>Status:</strong>{" "}
                  {user.access.standardMenus["full-app"] &&
                  user.access.standardMenus["search"]
                    ? "Full access - can access all features including Search and Full App"
                    : user.access.standardMenus["full-app"]
                    ? "Limited access - can access Full App but not Search"
                    : user.access.standardMenus["search"]
                    ? "Limited access - can access Search but not Full App"
                    : "Limited access - cannot access Search and Full App"}
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
  updateStandardMenu,
  addCustomMenu,
  updateHomePageConfig,
  updateFullAppConfig,
  updateUserConfig,
  setMenuOrder,
  standardMenus,
  initialSubTab,
  onSubTabChange,
}: {
  appConfig: AppConfig;
  updateAppConfig: (config: AppConfig, bypassClusterWarning?: boolean) => void;
  stylingConfig: StylingConfig;
  updateStylingConfig: (config: StylingConfig) => void;
  clearAllConfigurations?: () => void;
  exportConfiguration?: (customName?: string) => Promise<void>;
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
  initialSubTab?: string;
  onSubTabChange?: (subTab: string) => void;
}) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "general");
  const [importStatus, setImportStatus] = useState<{
    message: string;
    type: "success" | "error" | null;
  }>({ message: "", type: null });
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFileName, setExportFileName] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // GitHub configuration loading state
  const [savedConfigurations, setSavedConfigurations] = useState<
    SavedConfiguration[]
  >([]);
  const [isLoadingConfigurations, setIsLoadingConfigurations] = useState(false);
  const [showGitHubDialog, setShowGitHubDialog] = useState(false);
  const [selectedConfiguration, setSelectedConfiguration] =
    useState<string>("");

  // Configuration Wizard state
  const [showWizard, setShowWizard] = useState(false);

  // Validate initial state on mount
  useEffect(() => {
    const validSubTabs = ["general", "embedFlags"];
    if (!activeSubTab || !validSubTabs.includes(activeSubTab)) {
      setActiveSubTab("general");
    }
  }, []); // Empty dependency array - runs only on mount

  // Update activeSubTab when initialSubTab changes
  useEffect(() => {
    const validSubTabs = ["general", "embedFlags"];

    if (
      initialSubTab &&
      validSubTabs.includes(initialSubTab) &&
      initialSubTab !== activeSubTab
    ) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab, activeSubTab]);

  const subTabs = [
    { id: "general", name: "General", icon: "settings" },
    { id: "embedFlags", name: "Embed Flags", icon: "flag" },
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

  // Handle wizard completion
  const handleWizardComplete = async (wizardConfig: WizardConfiguration) => {
    try {
      console.log("Wizard configuration:", wizardConfig);

      // IMPORTANT: Load current configuration to preserve existing users
      const { loadAllConfigurations } = await import(
        "../services/configurationService"
      );
      const currentConfig = await loadAllConfigurations();
      console.log("Wizard: Loaded current configuration:", {
        hasUsers: !!currentConfig.userConfig?.users,
        usersCount: currentConfig.userConfig?.users?.length || 0,
        users: currentConfig.userConfig?.users?.map(
          (u: {
            id: string;
            name: string;
            access?: { customMenus?: string[] };
          }) => ({
            id: u.id,
            name: u.name,
            customMenusCount: u.access?.customMenus?.length || 0,
          })
        ),
      });

      // Generate AI content if descriptions provided
      let homePageHTML =
        DEFAULT_CONFIG.standardMenus.find((m) => m.id === "home")
          ?.homePageValue || "<h1>Welcome</h1>";
      let embeddedContentVariables: Record<string, string> = {};
      let applicationStyles: {
        topBar?: { backgroundColor: string; foregroundColor: string };
        sidebar?: { backgroundColor: string; foregroundColor: string };
        buttons?: {
          primary?: {
            backgroundColor: string;
            foregroundColor: string;
            hoverBackgroundColor: string;
          };
          secondary?: {
            backgroundColor: string;
            foregroundColor: string;
            hoverBackgroundColor: string;
          };
        };
        backgrounds?: {
          mainBackground: string;
          contentBackground: string;
          borderColor: string;
        };
        typography?: {
          primaryColor: string;
          secondaryColor: string;
          linkColor: string;
        };
      } | null = null;
      let hasAIContent = false;
      const aiErrors: string[] = [];

      // ALWAYS generate style configuration FIRST (using app name if no description)
      console.log("Generating style configuration with AI...");
      try {
        const response = await fetch("/api/anthropic/generate-style", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: wizardConfig.styleDescription || "",
            applicationName: wizardConfig.applicationName,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to generate style configuration"
          );
        }

        const data = await response.json();
        console.log("Raw API response:", JSON.stringify(data, null, 2));

        embeddedContentVariables = data.embeddedContentVariables || {};
        applicationStyles = data.applicationStyles || null;

        console.log("AFTER ASSIGNMENT:");
        console.log(
          "- embeddedContentVariables:",
          Object.keys(embeddedContentVariables).length,
          "keys"
        );
        console.log(
          "- applicationStyles:",
          applicationStyles ? "PRESENT" : "NULL"
        );

        if (Object.keys(embeddedContentVariables).length === 0) {
          console.error(
            "ERROR: embeddedContentVariables is empty after assignment!"
          );
        }
        if (!applicationStyles) {
          console.error("ERROR: applicationStyles is null after assignment!");
        }

        console.log(
          "Successfully generated style configuration:",
          Object.keys(embeddedContentVariables).length,
          "embedded variables,",
          applicationStyles
            ? "application styles included"
            : "no application styles"
        );
        console.log(
          "Embedded content variables:",
          JSON.stringify(embeddedContentVariables, null, 2)
        );
        if (applicationStyles) {
          console.log(
            "Application styles:",
            JSON.stringify(applicationStyles, null, 2)
          );
        } else {
          console.warn("WARNING: No application styles were generated!");
        }
        hasAIContent = true;
      } catch (error) {
        console.error("Failed to generate style configuration:", error);
        const errorMsg = `Style generation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        aiErrors.push(errorMsg);

        // Show error message with option to retry or continue
        const continueWithDefault = confirm(
          errorMsg +
            "\n\nWould you like to continue with default styles?\n\n" +
            "Click OK to continue with default styles.\n" +
            "Click Cancel to abort the configuration wizard and try again.\n\n" +
            "Note: Make sure your Anthropic API key is configured correctly.\n" +
            "For local development: Create a .env.local file with ANTHROPIC_API_KEY=your_key_here"
        );

        if (!continueWithDefault) {
          // User wants to abort and try again
          throw new Error("Configuration cancelled by user");
        }
      }

      // Generate home page content AFTER styles so we can use the same colors
      console.log(
        "Generating home page content with AI using generated style colors..."
      );
      try {
        // Extract key colors from generated styles to pass to home page generation
        const styleColors = {
          primaryColor:
            applicationStyles?.buttons?.primary?.backgroundColor ||
            embeddedContentVariables["--ts-var-button--primary-background"],
          secondaryColor: applicationStyles?.sidebar?.backgroundColor,
          accentColor: embeddedContentVariables["--ts-var-viz-color-1"],
          backgroundColor: applicationStyles?.backgrounds?.mainBackground,
          textColor: applicationStyles?.typography?.primaryColor,
        };

        console.log("Using style colors for home page:", styleColors);

        const response = await fetch("/api/anthropic/generate-home-page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: wizardConfig.homePageDescription || "",
            applicationName: wizardConfig.applicationName,
            styleColors: styleColors,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate home page");
        }

        const data = await response.json();
        homePageHTML = data.html;
        console.log(
          "Successfully generated home page content with matching colors, length:",
          homePageHTML.length
        );
        hasAIContent = true;
      } catch (error) {
        console.error("Failed to generate home page content:", error);
        const errorMsg = `Home page generation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        aiErrors.push(errorMsg);

        // Show error message with option to retry or continue
        const continueWithDefault = confirm(
          errorMsg +
            "\n\nWould you like to continue with the default home page?\n\n" +
            "Click OK to continue with default home page.\n" +
            "Click Cancel to abort the configuration wizard and try again.\n\n" +
            "Note: Make sure your Anthropic API key is configured correctly.\n" +
            "For local development: Create a .env.local file with ANTHROPIC_API_KEY=your_key_here"
        );

        if (!continueWithDefault) {
          // User wants to abort and try again
          throw new Error("Configuration cancelled by user");
        }
      }

      if (hasAIContent && aiErrors.length === 0) {
        console.log("AI content generated successfully");
      }

      console.log("============ CREATING CONFIGURATION ============");
      console.log("About to create configuration with:");
      console.log(
        "- embeddedContentVariables count:",
        Object.keys(embeddedContentVariables).length
      );
      console.log(
        "- embeddedContentVariables sample:",
        embeddedContentVariables["--ts-var-root-background"]
      );
      console.log(
        "- applicationStyles:",
        applicationStyles ? "PRESENT" : "NULL"
      );
      if (applicationStyles) {
        console.log("- applicationStyles.topBar:", applicationStyles.topBar);
      }
      console.log("- homePageHTML length:", homePageHTML.length);
      if (wizardConfig.modelId) {
        console.log("- Model ID:", wizardConfig.modelId);
        console.log("- Will be applied to: Chatbot, Spotter, and Search");
      }
      console.log("================================================");

      // Create new configuration
      // IMPORTANT: Use existing userConfig to preserve current users and their settings
      console.log("Wizard: Creating newConfig - currentConfig.userConfig:", {
        hasUserConfig: !!currentConfig.userConfig,
        hasUsers: !!currentConfig.userConfig?.users,
        usersCount: currentConfig.userConfig?.users?.length || 0,
        usersData: currentConfig.userConfig?.users,
      });

      const newConfig: ConfigurationData = {
        ...DEFAULT_CONFIG,
        // Preserve existing userConfig instead of using DEFAULT_CONFIG's empty users
        userConfig: currentConfig.userConfig || DEFAULT_CONFIG.userConfig,
        appConfig: {
          ...DEFAULT_CONFIG.appConfig,
          thoughtspotUrl: wizardConfig.thoughtspotUrl,
          applicationName: wizardConfig.applicationName,
          chatbot: {
            enabled: DEFAULT_CONFIG.appConfig.chatbot?.enabled ?? true,
            defaultModelId:
              wizardConfig.modelId ||
              DEFAULT_CONFIG.appConfig.chatbot?.defaultModelId,
            selectedModelIds:
              DEFAULT_CONFIG.appConfig.chatbot?.selectedModelIds,
            welcomeMessage: DEFAULT_CONFIG.appConfig.chatbot?.welcomeMessage,
            position: DEFAULT_CONFIG.appConfig.chatbot?.position,
            spotgptApiKey: DEFAULT_CONFIG.appConfig.chatbot?.spotgptApiKey,
          },
        },
        standardMenus: DEFAULT_CONFIG.standardMenus.map((menu) => {
          const updatedMenu = {
            ...menu,
            enabled: wizardConfig.enabledMenus.includes(menu.id),
            spotterModelId:
              menu.id === "spotter" && wizardConfig.modelId
                ? wizardConfig.modelId
                : menu.spotterModelId,
            searchDataSource:
              menu.id === "search" && wizardConfig.modelId
                ? wizardConfig.modelId
                : menu.searchDataSource,
            homePageValue:
              menu.id === "home" ? homePageHTML : menu.homePageValue,
          };

          // Ensure Spotter keeps its custom icon from DEFAULT_CONFIG
          if (menu.id === "spotter") {
            console.log(
              `Wizard: Setting Spotter icon to ${menu.icon} from DEFAULT_CONFIG`
            );
            if (wizardConfig.modelId) {
              console.log(
                `Wizard: Setting Spotter model to ${wizardConfig.modelId}`
              );
            }
          }

          if (menu.id === "search" && wizardConfig.modelId) {
            console.log(
              `Wizard: Setting Search data source to ${wizardConfig.modelId}`
            );
          }

          return updatedMenu;
        }),
        stylingConfig: {
          ...DEFAULT_CONFIG.stylingConfig,
          // Apply application styles if generated
          application: applicationStyles
            ? {
                ...DEFAULT_CONFIG.stylingConfig.application,
                topBar: {
                  ...DEFAULT_CONFIG.stylingConfig.application.topBar,
                  backgroundColor:
                    applicationStyles.topBar?.backgroundColor ||
                    DEFAULT_CONFIG.stylingConfig.application.topBar
                      .backgroundColor,
                  foregroundColor:
                    applicationStyles.topBar?.foregroundColor ||
                    DEFAULT_CONFIG.stylingConfig.application.topBar
                      .foregroundColor,
                },
                sidebar: {
                  ...DEFAULT_CONFIG.stylingConfig.application.sidebar,
                  backgroundColor:
                    applicationStyles.sidebar?.backgroundColor ||
                    DEFAULT_CONFIG.stylingConfig.application.sidebar
                      .backgroundColor,
                  foregroundColor:
                    applicationStyles.sidebar?.foregroundColor ||
                    DEFAULT_CONFIG.stylingConfig.application.sidebar
                      .foregroundColor,
                },
                buttons: {
                  ...DEFAULT_CONFIG.stylingConfig.application.buttons,
                  primary: {
                    ...DEFAULT_CONFIG.stylingConfig.application.buttons.primary,
                    backgroundColor:
                      applicationStyles.buttons?.primary?.backgroundColor ||
                      DEFAULT_CONFIG.stylingConfig.application.buttons.primary
                        .backgroundColor,
                    foregroundColor:
                      applicationStyles.buttons?.primary?.foregroundColor ||
                      DEFAULT_CONFIG.stylingConfig.application.buttons.primary
                        .foregroundColor,
                    hoverBackgroundColor:
                      applicationStyles.buttons?.primary
                        ?.hoverBackgroundColor ||
                      DEFAULT_CONFIG.stylingConfig.application.buttons.primary
                        .hoverBackgroundColor,
                  },
                  secondary: {
                    ...DEFAULT_CONFIG.stylingConfig.application.buttons
                      .secondary,
                    backgroundColor:
                      applicationStyles.buttons?.secondary?.backgroundColor ||
                      DEFAULT_CONFIG.stylingConfig.application.buttons.secondary
                        .backgroundColor,
                    foregroundColor:
                      applicationStyles.buttons?.secondary?.foregroundColor ||
                      DEFAULT_CONFIG.stylingConfig.application.buttons.secondary
                        .foregroundColor,
                    hoverBackgroundColor:
                      applicationStyles.buttons?.secondary
                        ?.hoverBackgroundColor ||
                      DEFAULT_CONFIG.stylingConfig.application.buttons.secondary
                        .hoverBackgroundColor,
                  },
                },
                backgrounds: {
                  ...DEFAULT_CONFIG.stylingConfig.application.backgrounds,
                  mainBackground:
                    applicationStyles.backgrounds?.mainBackground ||
                    DEFAULT_CONFIG.stylingConfig.application.backgrounds
                      .mainBackground,
                  contentBackground:
                    applicationStyles.backgrounds?.contentBackground ||
                    DEFAULT_CONFIG.stylingConfig.application.backgrounds
                      .contentBackground,
                  borderColor:
                    applicationStyles.backgrounds?.borderColor ||
                    DEFAULT_CONFIG.stylingConfig.application.backgrounds
                      .borderColor,
                },
                typography: {
                  ...DEFAULT_CONFIG.stylingConfig.application.typography,
                  primaryColor:
                    applicationStyles.typography?.primaryColor ||
                    DEFAULT_CONFIG.stylingConfig.application.typography
                      .primaryColor,
                  secondaryColor:
                    applicationStyles.typography?.secondaryColor ||
                    DEFAULT_CONFIG.stylingConfig.application.typography
                      .secondaryColor,
                  linkColor:
                    applicationStyles.typography?.linkColor ||
                    DEFAULT_CONFIG.stylingConfig.application.typography
                      .linkColor,
                },
              }
            : DEFAULT_CONFIG.stylingConfig.application,
          // Apply embedded content variables
          embeddedContent: {
            ...DEFAULT_CONFIG.stylingConfig.embeddedContent,
            customCSS: {
              ...DEFAULT_CONFIG.stylingConfig.embeddedContent.customCSS,
              variables: embeddedContentVariables,
            },
          },
        },
      };

      console.log("Created new configuration with styling:", {
        hasApplicationStyles: !!applicationStyles,
        applicationStylesPreview: applicationStyles
          ? {
              topBarBg: applicationStyles.topBar?.backgroundColor,
              sidebarBg: applicationStyles.sidebar?.backgroundColor,
              primaryButtonBg:
                applicationStyles.buttons?.primary?.backgroundColor,
            }
          : null,
        embeddedVariablesCount: Object.keys(embeddedContentVariables).length,
      });

      console.log(
        "Full styling config to be saved:",
        JSON.stringify(newConfig.stylingConfig, null, 2)
      );

      // Add custom menus to configuration BEFORE saving
      if (wizardConfig.customMenus && wizardConfig.customMenus.length > 0) {
        console.log(
          "Wizard: Custom menu configurations detected:",
          wizardConfig.customMenus.length
        );

        const customMenusData: CustomMenu[] = wizardConfig.customMenus.map(
          (menu, index) => {
            console.log(
              `Wizard: Processing custom menu ${index + 1}:`,
              JSON.stringify(menu, null, 2)
            );

            // Build contentSelection based on menu type
            const contentSelection: CustomMenu["contentSelection"] =
              menu.type === "tag"
                ? {
                    type: "tag",
                    tagIdentifiers: menu.tagIdentifiers || [],
                  }
                : menu.type === "direct"
                ? {
                    type: "direct",
                    directEmbed: menu.directEmbed,
                  }
                : {
                    // Fallback to specific type (shouldn't happen)
                    type: "specific",
                    specificContent: {
                      liveboards: [],
                      answers: [],
                    },
                  };

            console.log(
              `Wizard: Content selection for menu ${index + 1}:`,
              JSON.stringify(contentSelection, null, 2)
            );

            return {
              id: `custom-${Date.now()}-${index}`,
              name: menu.name,
              description: "",
              icon: menu.icon,
              enabled: true,
              contentSelection,
            };
          }
        );

        console.log(
          "Wizard: Creating custom menu objects:",
          JSON.stringify(customMenusData, null, 2)
        );

        // Add custom menus to the configuration
        newConfig.customMenus = customMenusData;

        // Also update menu order to include custom menu IDs
        const customMenuIds = customMenusData.map((m) => m.id);
        newConfig.menuOrder = [...newConfig.menuOrder, ...customMenuIds];

        // DEBUG: Check userConfig state before updating
        console.log("Wizard: DEBUG - Checking userConfig before update:", {
          hasUserConfig: !!newConfig.userConfig,
          hasUsers: !!newConfig.userConfig?.users,
          usersCount: newConfig.userConfig?.users?.length || 0,
          usersArray: newConfig.userConfig?.users,
          currentUserId: newConfig.userConfig?.currentUserId,
        });

        // IMPORTANT: Add custom menu IDs to all users' access configuration
        // so they appear in the navigation
        if (
          newConfig.userConfig &&
          newConfig.userConfig.users &&
          newConfig.userConfig.users.length > 0
        ) {
          console.log("Wizard: BEFORE updating user access:");
          newConfig.userConfig.users.forEach((u, index) => {
            console.log(`  User ${index + 1} (${u.id}):`, {
              name: u.name,
              currentCustomMenus: u.access?.customMenus || [],
            });
          });

          newConfig.userConfig = {
            ...newConfig.userConfig,
            users: newConfig.userConfig.users.map((user) => ({
              ...user,
              access: {
                ...user.access,
                customMenus: [
                  ...(user.access?.customMenus || []),
                  ...customMenuIds,
                ],
              },
            })),
          };

          console.log("Wizard: AFTER updating user access:");
          newConfig.userConfig.users.forEach((u, index) => {
            console.log(`  User ${index + 1} (${u.id}):`, {
              name: u.name,
              updatedCustomMenus: u.access?.customMenus || [],
            });
          });
          console.log(
            "Wizard: Updated user access configurations to include new custom menus:",
            customMenuIds
          );
        } else {
          console.error(
            "Wizard: WARNING - userConfig or userConfig.users is missing!",
            {
              hasUserConfig: !!newConfig.userConfig,
              hasUsers: !!newConfig.userConfig?.users,
              usersCount: newConfig.userConfig?.users?.length || 0,
            }
          );
        }

        console.log(
          "Wizard: Added custom menus to configuration. Total custom menus:",
          newConfig.customMenus.length
        );
        console.log("Wizard: Updated menu order:", newConfig.menuOrder);
      } else {
        console.log("Wizard: No custom menus in wizard configuration");
      }

      // Clear current configuration and save new one
      // Set importing flag to prevent Layout from auto-saving during this process
      const { setIsImportingConfiguration } = await import(
        "../services/configurationService"
      );
      setIsImportingConfiguration(true);

      await clearAllConfigurations?.();

      // Small delay to ensure clear completes
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Save the new configuration (including custom menus)
      console.log("==== WIZARD: FINAL SAVE DEBUG ====");
      console.log("Custom Menus Count:", newConfig.customMenus?.length || 0);
      console.log(
        "Custom Menu IDs:",
        newConfig.customMenus?.map((m) => m.id)
      );
      console.log("Users Count:", newConfig.userConfig?.users?.length || 0);
      console.log(
        "Full userConfig being saved:",
        JSON.stringify(newConfig.userConfig, null, 2)
      );
      console.log("==================================");

      await saveAllConfigurations(newConfig);

      setImportStatus({
        message: "Configuration created successfully! Reloading...",
        type: "success",
      });

      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error applying wizard configuration:", error);
      setImportStatus({
        message: `Failed to create configuration: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        type: "error",
      });
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
            onClick={() => {
              setActiveSubTab(tab.id);
              onSubTabChange?.(tab.id);
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
            <MaterialIcon icon={tab.icon} size={16} />
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

            {/* Configuration Action Buttons */}
            <div
              style={{
                marginBottom: "32px",
                padding: "20px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                display: "flex",
                gap: "12px",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  onClick={() => setShowWizard(true)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#8b5cf6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <MaterialIcon
                    icon="auto_fix_high"
                    style={{ fontSize: "18px" }}
                  />
                  Configuration Wizard
                </button>
                <button
                  onClick={() => {
                    setShowExportDialog(true);
                    setExportError(null);
                  }}
                  style={{
                    padding: "10px 20px",
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
                    padding: "10px 20px",
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
                      console.log("File input onChange triggered");
                      const file = e.target.files?.[0];
                      console.log("Selected file:", file);
                      if (file) {
                        console.log(
                          "Calling loadConfigurationSimplified with file:",
                          file.name
                        );

                        // Trigger the configuration loading
                        const event = new CustomEvent("loadConfiguration", {
                          detail: { type: "file", data: file },
                        });
                        window.dispatchEvent(event);
                      } else {
                        console.log("No file selected");
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
                    padding: "10px 20px",
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

              <button
                onClick={clearAllConfigurations}
                style={{
                  padding: "10px 20px",
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
                  <ImageUpload
                    value={stylingConfig.application.topBar.logoUrl}
                    onChange={(url) => {
                      // Update both the TopBar logo and the appConfig logo to keep them synchronized
                      updateStylingConfig({
                        ...stylingConfig,
                        application: {
                          ...stylingConfig.application,
                          topBar: {
                            ...stylingConfig.application.topBar,
                            logoUrl: url,
                          },
                        },
                      });

                      // Also update the appConfig logo to ensure consistency
                      updateAppConfig({
                        ...appConfig,
                        logo: url,
                      });
                    }}
                    label="Application Logo"
                    placeholder="https://example.com/logo.png"
                    accept="image/*"
                    maxSizeMB={2}
                    maxWidth={200}
                    maxHeight={80}
                    useIndexedDB={true}
                  />
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    Upload an image or provide a URL for your application logo.
                    This logo will be displayed in the top bar.
                  </p>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <ImageUpload
                    value={appConfig.favicon || ""}
                    onChange={(url) =>
                      updateAppConfig({
                        ...appConfig,
                        favicon: url,
                      })
                    }
                    label="Favicon"
                    placeholder="https://example.com/favicon.ico"
                    accept="image/*"
                    maxSizeMB={1}
                    maxWidth={64}
                    maxHeight={64}
                    useIndexedDB={true}
                  />
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    Upload an image or provide a URL for your browser tab icon.
                    Leave empty to use the default.
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
                        checked={appConfig.faviconSyncEnabled ?? false}
                        disabled={
                          !stylingConfig.application.topBar.logoUrl ||
                          stylingConfig.application.topBar.logoUrl === "/ts.png"
                        }
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          console.log(
                            "[SettingsModal] Favicon sync checkbox changed:",
                            {
                              checked: isChecked,
                              currentFavicon: appConfig.favicon,
                              currentLogo:
                                stylingConfig.application.topBar.logoUrl,
                            }
                          );

                          if (isChecked) {
                            // Enable favicon sync and set favicon to match logo
                            updateAppConfig({
                              ...appConfig,
                              faviconSyncEnabled: true,
                              favicon:
                                stylingConfig.application.topBar.logoUrl ||
                                "/ts.png",
                            });
                          } else {
                            // Disable favicon sync and reset favicon to default
                            updateAppConfig({
                              ...appConfig,
                              faviconSyncEnabled: false,
                              favicon: "/ts.png",
                            });
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      />
                      <span>Sync favicon with application logo</span>
                    </label>
                    <p
                      style={{
                        margin: "4px 0 0 0",
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
                    >
                      When checked, the favicon will automatically match your
                      application logo. Uncheck to set them independently.
                      {(!Boolean(stylingConfig.application.topBar.logoUrl) ||
                        stylingConfig.application.topBar.logoUrl ===
                          "/ts.png") && (
                        <span style={{ color: "#ef4444", fontWeight: "500" }}>
                          {" "}
                          First set an application logo above to enable this
                          option.
                        </span>
                      )}
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

            {/* Export Status Message */}
            {isExporting && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px 16px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  backgroundColor: "#dbeafe",
                  color: "#1e40af",
                  border: "1px solid #93c5fd",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid transparent",
                    borderTop: "2px solid #1e40af",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                Converting images and preparing configuration for export...
              </div>
            )}

            {/* Export Error Message */}
            {exportError && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px 16px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  backgroundColor: "#fee2e2",
                  color: "#991b1b",
                  border: "1px solid #fecaca",
                }}
              >
                {exportError}
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
                        setExportError(null);
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
                      onClick={async () => {
                        const fileName = exportFileName.trim();
                        // Validate filename - only allow alphanumeric, hyphens, underscores, and spaces
                        const validFileName = fileName.replace(
                          /[^a-zA-Z0-9\s\-_]/g,
                          ""
                        );
                        try {
                          setIsExporting(true);
                          setExportError(null);
                          await exportConfiguration?.(
                            validFileName || undefined
                          );
                          setShowExportDialog(false);
                          setExportFileName("");
                        } catch (error) {
                          console.error(
                            "Failed to export configuration:",
                            error
                          );
                          setExportError(
                            "Failed to export configuration. Please try again."
                          );
                        } finally {
                          setIsExporting(false);
                        }
                      }}
                      disabled={isExporting}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: isExporting ? "#6b7280" : "#059669",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: isExporting ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {isExporting && (
                        <div
                          style={{
                            width: "16px",
                            height: "16px",
                            border: "2px solid transparent",
                            borderTop: "2px solid white",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                      )}
                      {isExporting ? "Exporting..." : "Export"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <style jsx>{`
              @keyframes spin {
                0% {
                  transform: rotate(0deg);
                }
                100% {
                  transform: rotate(360deg);
                }
              }
            `}</style>

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
                      onClick={async () => {
                        if (selectedConfiguration) {
                          try {
                            console.log(
                              "Calling loadConfigurationFromSource with GitHub:",
                              selectedConfiguration
                            );

                            // Trigger the configuration loading
                            const event = new CustomEvent("loadConfiguration", {
                              detail: {
                                type: "github",
                                data: selectedConfiguration,
                              },
                            });
                            window.dispatchEvent(event);

                            // Close the dialog
                            setShowGitHubDialog(false);
                            setSelectedConfiguration("");
                          } catch (error) {
                            console.error(
                              "Error loading configuration:",
                              error
                            );
                          }
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

            {/* Configuration Wizard */}
            <ConfigurationWizard
              isOpen={showWizard}
              onClose={() => setShowWizard(false)}
              onComplete={handleWizardComplete}
              currentThoughtSpotUrl={appConfig.thoughtspotUrl}
              standardMenus={standardMenus || []}
            />
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
              embedDisplay={stylingConfig.embedDisplay || {}}
              onChange={(embedFlags) =>
                updateStylingConfig({
                  ...stylingConfig,
                  embedFlags,
                })
              }
              onEmbedDisplayChange={(embedDisplay) =>
                updateStylingConfig({
                  ...stylingConfig,
                  embedDisplay,
                })
              }
            />

            <div style={{ marginTop: "40px" }}>
              <h5
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "16px",
                }}
              >
                URL Flags
              </h5>
              <p
                style={{
                  marginBottom: "16px",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                Feature flags for early access features (optional)
              </p>
              <textarea
                value={appConfig.earlyAccessFlags}
                onChange={(e) =>
                  updateAppConfig({
                    ...appConfig,
                    earlyAccessFlags: e.target.value,
                  })
                }
                placeholder="Enter URL flags (one per line)"
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
            </div>
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
  clearCustomMenus,
  stylingConfig,
  updateStylingConfig,
  userConfig,
  updateUserConfig,
  setMenuOrder,
  clearAllConfigurations,
  exportConfiguration,
  storageError,
  setStorageError,
  loadConfigurationSynchronously,
  setIsImportingConfiguration,

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

  // Ensure we always have a valid tab selected
  useEffect(() => {
    const validTabs = [
      "configuration",
      "standard-menus",
      "custom-menus",
      "users",
      "styling",
      "events",
      "storage",
    ];
    if (!validTabs.includes(activeTab)) {
      setActiveTab("configuration");
    }
  }, [activeTab]);

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
  const [isLoadingConfiguration, setIsLoadingConfiguration] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);

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

  const updatePendingAppConfig = (
    config: AppConfig,
    bypassClusterWarning = false
  ) => {
    setPendingAppConfig(config);
    handleConfigChange();

    // If bypassClusterWarning is true, this is a config import, so apply immediately
    if (bypassClusterWarning) {
      console.log(
        "[SettingsModal] Config import detected, applying app config immediately"
      );
      updateAppConfig(config, bypassClusterWarning);
    }
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
    console.log(
      "handleApplyChanges called, hasUnsavedChanges:",
      hasUnsavedChanges
    );
    // Apply all pending changes
    if (hasUnsavedChanges) {
      console.log("Applying changes...");
      // Apply standard menus changes
      console.log(
        "Applying standard menus changes:",
        pendingStandardMenus.length,
        "menus"
      );
      pendingStandardMenus.forEach((menu) => {
        const currentMenu = standardMenus.find((m) => m.id === menu.id);
        if (currentMenu) {
          Object.keys(menu).forEach((key) => {
            if (
              menu[key as keyof StandardMenu] !==
              currentMenu[key as keyof StandardMenu]
            ) {
              console.log(
                `Updating menu ${menu.id}.${key}:`,
                currentMenu[key as keyof StandardMenu],
                "->",
                menu[key as keyof StandardMenu]
              );
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
      console.log("Applying homePageConfig:", pendingHomePageConfig);
      updateHomePageConfig(pendingHomePageConfig);
      console.log("Applying appConfig:", pendingAppConfig);
      updateAppConfig(pendingAppConfig);
      console.log("Applying fullAppConfig:", pendingFullAppConfig);
      updateFullAppConfig(pendingFullAppConfig);
      console.log("Applying stylingConfig:", pendingStylingConfig);
      updateStylingConfig(pendingStylingConfig);

      setHasUnsavedChanges(false);
      console.log(
        "Changes applied successfully, hasUnsavedChanges set to false"
      );

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

    // Check if we have a pending custom menu to save
    if (!pendingCustomMenuSave) {
      console.log("No pending custom menu to save");
      return;
    }

    // Add a safeguard to prevent multiple rapid calls
    if (customMenuRef.current) {
      console.log("Calling saveMenu through ref");
      customMenuRef.current.saveMenu();
    } else {
      console.log("customMenuRef.current is null, cannot save");
    }
  };

  const handleCustomMenuCancel = () => {
    // Simply call the cancel function directly
    customMenuRef.current?.cancelEdit();
  };

  // Storage Management Component
  const StorageManagementContent = () => {
    const [storageHealth, setStorageHealth] = useState<{
      healthy: boolean;
      currentSize: number;
      quota: number;
      usagePercentage: number;
      message: string;
      storageType: "localStorage" | "indexedDB" | "none";
    }>({
      healthy: true,
      currentSize: 0,
      quota: 0,
      usagePercentage: 0,
      message: "Loading...",
      storageType: "none",
    });
    const [isClearing, setIsClearing] = useState(false);
    const [clearResult, setClearResult] = useState<{
      success: boolean;
      message: string;
    } | null>(null);

    const refreshStorageHealth = async () => {
      try {
        const health = await checkStorageHealth();
        setStorageHealth(health);
      } catch (error) {
        console.error("Failed to check storage health:", error);
        setStorageHealth({
          healthy: false,
          currentSize: 0,
          quota: 0,
          usagePercentage: 0,
          message: "Failed to check storage health",
          storageType: "none",
        });
      }
    };

    // Load storage health on mount
    useEffect(() => {
      refreshStorageHealth();
    }, []);

    const handleClearStorage = async () => {
      if (
        window.confirm(
          "This will clear all stored configuration data and restore defaults. Are you sure?"
        )
      ) {
        setIsClearing(true);
        setClearResult(null);

        try {
          const result = await clearStorageAndReloadDefaults();
          setClearResult(result);

          if (result.success) {
            // Refresh the page to reload defaults
            window.location.reload();
          }
        } catch (error) {
          setClearResult({
            success: false,
            message: `Unexpected error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          });
        } finally {
          setIsClearing(false);
        }
      }
    };

    const formatBytes = (bytes: number) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
      <div style={{ padding: "20px" }}>
        <h3 style={{ marginBottom: "20px", color: "#333" }}>
          Storage Management
        </h3>

        <div
          style={{
            padding: "15px",
            border: `2px solid ${
              storageHealth.healthy ? "#4CAF50" : "#f44336"
            }`,
            borderRadius: "8px",
            backgroundColor: storageHealth.healthy ? "#f1f8e9" : "#ffebee",
            marginBottom: "20px",
          }}
        >
          <h4
            style={{
              margin: "0 0 10px 0",
              color: storageHealth.healthy ? "#2e7d32" : "#c62828",
            }}
          >
            Storage Status: {storageHealth.healthy ? "Healthy" : "Warning"}
          </h4>
          <p style={{ margin: "5px 0", fontSize: "14px" }}>
            {storageHealth.message}
          </p>
          <div style={{ marginTop: "10px" }}>
            <strong>Current Usage:</strong>{" "}
            {formatBytes(storageHealth.currentSize)} /{" "}
            {formatBytes(storageHealth.quota)}(
            {storageHealth.usagePercentage.toFixed(1)}%)
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={refreshStorageHealth}
            style={{
              padding: "8px 16px",
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            Refresh Status
          </button>

          <button
            onClick={handleClearStorage}
            disabled={isClearing}
            style={{
              padding: "8px 16px",
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isClearing ? "not-allowed" : "pointer",
              opacity: isClearing ? 0.6 : 1,
            }}
          >
            {isClearing ? "Clearing..." : "Clear All Storage"}
          </button>
        </div>

        {clearResult && (
          <div
            style={{
              padding: "10px",
              border: `1px solid ${
                clearResult.success ? "#4CAF50" : "#f44336"
              }`,
              borderRadius: "4px",
              backgroundColor: clearResult.success ? "#f1f8e9" : "#ffebee",
              color: clearResult.success ? "#2e7d32" : "#c62828",
            }}
          >
            {clearResult.message}
          </div>
        )}

        <div
          style={{
            padding: "15px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            fontSize: "14px",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0" }}>Storage Information</h4>
          <ul style={{ margin: "0", paddingLeft: "20px" }}>
            <li>Browser localStorage has a limit of approximately 5-10MB</li>
            <li>
              When storage is full, the application may fail to save
              configurations
            </li>
            <li>Clearing storage will restore all default configurations</li>
            <li>You can export your current configuration before clearing</li>
          </ul>
        </div>
      </div>
    );
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
          updateStandardMenu={updateStandardMenu}
          addCustomMenu={addCustomMenu}
          updateHomePageConfig={updatePendingHomePageConfig}
          updateFullAppConfig={updatePendingFullAppConfig}
          updateUserConfig={updateUserConfig}
          setMenuOrder={setMenuOrder}
          standardMenus={pendingStandardMenus}
          initialSubTab={initialSubTab}
          onSubTabChange={(subTab) => onTabChange?.("configuration", subTab)}
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
          appConfig={pendingAppConfig}
          updateAppConfig={updatePendingAppConfig}
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
            console.log("onEditingMenuChange called with:", {
              menu: menu?.name,
              isEditing: menu !== null,
              isCreating:
                menu !== null && !customMenus.find((m) => m.id === menu?.id),
            });
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
          updateStylingConfig={updateStylingConfig}
          updateStandardMenu={updateStandardMenu}
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
    {
      id: "storage",
      name: "Storage",
      content: <StorageManagementContent />,
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

        {/* Storage Error Notification */}
        {storageError && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              borderBottom: "1px solid #fecaca",
              padding: "12px 24px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <div style={{ color: "#dc2626", fontSize: "16px" }}>⚠️</div>
            <div style={{ flex: 1 }}>
              <h4
                style={{
                  margin: "0 0 4px 0",
                  color: "#991b1b",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Storage Error
              </h4>
              <p
                style={{
                  margin: "0 0 8px 0",
                  color: "#7f1d1d",
                  fontSize: "12px",
                  lineHeight: "1.4",
                }}
              >
                {storageError}
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => {
                    if (
                      typeof window !== "undefined" &&
                      clearAllConfigurations
                    ) {
                      clearAllConfigurations();
                      alert(
                        "Browser storage cleared. Please refresh the page."
                      );
                    }
                  }}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: "500",
                  }}
                >
                  Clear Storage
                </button>
                <button
                  onClick={() => setStorageError?.(null)}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: "500",
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

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

      {/* Configuration Loading Dialog */}
      <LoadingDialog
        isOpen={isLoadingConfiguration}
        message={loadingMessage}
        progress={loadingProgress}
      />
    </div>
  );
}
