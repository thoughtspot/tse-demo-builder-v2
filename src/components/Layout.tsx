"use client";

import { useState, createContext, useContext, useEffect } from "react";
import TopBar from "./TopBar";
import SideNav from "./SideNav";
import SettingsModal from "./SettingsModal";
import Footer from "./Footer";
import SessionChecker from "./SessionChecker";
import ChatBubble from "./ChatBubble";
import {
  CustomMenu,
  StylingConfig,
  EmbedFlags,
  UserConfig,
  ThoughtSpotInitConfig,
} from "../types/thoughtspot";
import { setThoughtSpotBaseUrl } from "../services/thoughtspotApi";

export interface StandardMenu {
  id: string;
  icon: string;
  name: string;
  enabled: boolean;
  modelId?: string;
  contentId?: string;
  contentType?: "Answer" | "Liveboard";
  namePattern?: string;
  tagFilter?: string;
  spotterModelId?: string;
  spotterSearchQuery?: string;
  searchDataSource?: string;
  searchTokenString?: string;
  runSearch?: boolean;
  // Home page configuration fields
  homePageType?:
    | "image"
    | "html"
    | "iframe"
    | "liveboard"
    | "answer"
    | "spotter";
  homePageValue?: string;
}

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
}

interface FullAppConfig {
  showPrimaryNavbar: boolean;
  hideHomepageLeftNav: boolean;
}

interface AppContextType {
  homePageConfig: HomePageConfig;
  updateHomePageConfig: (config: HomePageConfig) => void;
  appConfig: AppConfig;
  updateAppConfig: (config: AppConfig) => void;
  fullAppConfig: FullAppConfig;
  updateFullAppConfig: (config: FullAppConfig) => void;
  standardMenus: StandardMenu[];
  updateStandardMenu: (
    id: string,
    field: string,
    value: string | boolean
  ) => void;
  customMenus: CustomMenu[];
  addCustomMenu: (menu: CustomMenu) => void;
  updateCustomMenu: (id: string, menu: CustomMenu) => void;
  deleteCustomMenu: (id: string) => void;
  stylingConfig: StylingConfig;
  updateStylingConfig: (config: StylingConfig) => void;
  userConfig: UserConfig;
  updateUserConfig: (config: UserConfig) => void;
  clearAllConfigurations: () => void;
  openSettingsWithTab: (tab?: string, subTab?: string) => void;
  exportConfiguration: (customName?: string) => void;
  importConfiguration: (file: File) => Promise<{
    success: boolean;
    error?: string;
  }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

// Local storage keys
const STORAGE_KEYS = {
  HOME_PAGE_CONFIG: "tse-demo-builder-home-page-config",
  APP_CONFIG: "tse-demo-builder-app-config",
  STANDARD_MENUS: "tse-demo-builder-standard-menus",
  FULL_APP_CONFIG: "tse-demo-builder-full-app-config",
  CUSTOM_MENUS: "tse-demo-builder-custom-menus",
  MENU_ORDER: "tse-demo-builder-menu-order",
  STYLING_CONFIG: "tse-demo-builder-styling-config",
  USER_CONFIG: "tse-demo-builder-user-config",
};

// Default configuration values
const DEFAULT_CONFIG = {
  standardMenus: [
    {
      id: "home",
      icon: "/icons/home.png",
      name: "Home",
      enabled: true,
      homePageType: "html" as const,
      homePageValue:
        "<div style='padding: 20px; text-align: center;'><h1>Welcome to TSE Demo Builder</h1><p>Configure your home page content in the settings.</p></div>",
    },
    {
      id: "favorites",
      icon: "/icons/favorites.png",
      name: "Favorites",
      enabled: true,
    },
    {
      id: "my-reports",
      icon: "/icons/my-reports.png",
      name: "My Reports",
      enabled: true,
    },
    {
      id: "spotter",
      icon: "/icons/spotter.png",
      name: "Spotter",
      enabled: true,
    },
    { id: "search", icon: "/icons/search.png", name: "Search", enabled: true },
    {
      id: "full-app",
      icon: "/icons/full-app.png",
      name: "Full App",
      enabled: true,
    },
  ] as StandardMenu[],
  customMenus: [] as CustomMenu[],
  menuOrder: [
    "home",
    "favorites",
    "my-reports",
    "spotter",
    "search",
    "full-app",
  ] as string[],
  homePageConfig: {
    type: "html" as const,
    value:
      "<div style='padding: 20px; text-align: center;'><h1>Welcome to TSE Demo Builder</h1><p>Configure your home page content in the settings.</p></div>",
  } as HomePageConfig,
  appConfig: {
    thoughtspotUrl: "https://se-thoughtspot-cloud.thoughtspot.cloud/",
    applicationName: "TSE Demo Builder",
    logo: "",
    earlyAccessFlags: "",
    favicon: "/ts.png",
  } as AppConfig,
  fullAppConfig: {
    showPrimaryNavbar: false,
    hideHomepageLeftNav: false,
  } as FullAppConfig,
  stylingConfig: {
    application: {
      topBar: {
        backgroundColor: "#ffffff",
        foregroundColor: "#1a202c",
        logoUrl: "",
      },
      sidebar: {
        backgroundColor: "#f7fafc",
        foregroundColor: "#4a5568",
      },
      footer: {
        backgroundColor: "#f7fafc",
        foregroundColor: "#4a5568",
      },
      dialogs: {
        backgroundColor: "#ffffff",
        foregroundColor: "#1a202c",
      },
    },
    embeddedContent: {
      strings: {},
      stringIDs: {},
      cssUrl: "",
      customCSS: {
        variables: {},
        rules_UNSTABLE: {},
      },
    },
    embedFlags: {
      spotterEmbed: {},
      liveboardEmbed: {},
      searchEmbed: {},
      appEmbed: {},
    },
  } as StylingConfig,
  userConfig: {
    users: [
      {
        id: "power-user",
        name: "Power User",
        description: "Can access all features and content",
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
        },
      },
      {
        id: "basic-user",
        name: "Basic User",
        description: "Limited access - cannot access Search and Full App",
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
        },
      },
    ],
    currentUserId: "power-user",
  } as UserConfig,
};

// Utility functions for localStorage
const loadFromStorage = (key: string, defaultValue: unknown): unknown => {
  if (typeof window === "undefined") return defaultValue;

  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      console.log(`No stored data found for key: ${key}, using default`);
      return defaultValue;
    }

    const parsed = JSON.parse(stored);
    console.log(`Loaded ${key}:`, parsed);
    return parsed;
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error);
    console.log(`Using default value for ${key}:`, defaultValue);
    return defaultValue;
  }
};

// Migration function to convert emoji icons to file paths
const migrateStandardMenus = (menus: StandardMenu[]): StandardMenu[] => {
  const emojiToFileMap: Record<string, string> = {
    "🏠": "/icons/home.png",
    "⭐": "/icons/favorites.png",
    "📊": "/icons/my-reports.png",
    "🔍": "/icons/spotter.png",
    "🔎": "/icons/search.png",
    "🌐": "/icons/full-app.png",
  };

  return menus.map((menu) => {
    if (emojiToFileMap[menu.icon]) {
      return { ...menu, icon: emojiToFileMap[menu.icon] };
    }
    return menu;
  });
};

// Validation function for custom menus
const validateCustomMenu = (menu: unknown): menu is CustomMenu => {
  if (!menu || typeof menu !== "object") return false;
  const menuObj = menu as Record<string, unknown>;
  if (!menuObj.id || typeof menuObj.id !== "string") return false;
  if (!menuObj.name || typeof menuObj.name !== "string") return false;
  if (!menuObj.description || typeof menuObj.description !== "string")
    return false;
  if (!menuObj.icon || typeof menuObj.icon !== "string") return false;
  if (typeof menuObj.enabled !== "boolean") return false;
  if (!menuObj.contentSelection || typeof menuObj.contentSelection !== "object")
    return false;
  return true;
};

// Function to clean up styling config to reduce size
const cleanupStylingConfig = (config: unknown): unknown => {
  if (!config || typeof config !== "object") return config;

  const cleaned = { ...(config as Record<string, unknown>) };

  // Remove empty or undefined values
  const embeddedContent = cleaned.embeddedContent as
    | Record<string, unknown>
    | undefined;
  if (embeddedContent?.customCSS) {
    const customCSS = embeddedContent.customCSS as Record<string, unknown>;
    if (customCSS.rules_UNSTABLE) {
      const rules = customCSS.rules_UNSTABLE as Record<
        string,
        Record<string, string>
      >;
      const cleanedRules: Record<string, Record<string, string>> = {};

      Object.keys(rules).forEach((selector) => {
        const rule = rules[selector];
        if (rule && typeof rule === "object" && Object.keys(rule).length > 0) {
          cleanedRules[selector] = rule;
        }
      });

      if (Object.keys(cleanedRules).length === 0) {
        delete customCSS.rules_UNSTABLE;
      } else {
        customCSS.rules_UNSTABLE = cleanedRules;
      }
    }
  }

  // Remove empty embed flags
  const embedFlags = cleaned.embedFlags as Record<string, unknown> | undefined;
  if (embedFlags) {
    Object.keys(embedFlags).forEach((key) => {
      const flag = embedFlags[key];
      if (
        !flag ||
        (typeof flag === "object" &&
          Object.keys(flag as Record<string, unknown>).length === 0)
      ) {
        delete embedFlags[key];
      }
    });

    if (Object.keys(embedFlags).length === 0) {
      delete cleaned.embedFlags;
    }
  }

  return cleaned;
};

const saveToStorage = (key: string, value: unknown): void => {
  if (typeof window === "undefined") return;

  try {
    // Clean up styling config if that's what we're saving
    let valueToSave = value;
    if (key === STORAGE_KEYS.STYLING_CONFIG) {
      valueToSave = cleanupStylingConfig(value);
    }

    const serializedValue = JSON.stringify(valueToSave);

    // Check if the value is too large (localStorage has ~5-10MB limit)
    if (serializedValue.length > 4 * 1024 * 1024) {
      // 4MB limit
      console.warn(
        `Value for ${key} is too large (${serializedValue.length} bytes), skipping save`
      );
      return;
    }

    localStorage.setItem(key, serializedValue);
    console.log(`Saved ${key}:`, valueToSave);
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage:`, error);

    // If it's a quota error, try to clear some space
    if (error instanceof Error && error.name === "QuotaExceededError") {
      console.warn(
        "localStorage quota exceeded, attempting to clear old data..."
      );
      try {
        // Clear some non-critical storage keys to make space
        const keysToClear = [
          "tse-demo-builder-styling-config",
          "tse-demo-builder-user-config",
        ];

        keysToClear.forEach((keyToClear) => {
          if (keyToClear !== key) {
            localStorage.removeItem(keyToClear);
            console.log(`Cleared ${keyToClear} to make space`);
          }
        });

        // Try saving again
        localStorage.setItem(key, JSON.stringify(value));
        console.log(`Successfully saved ${key} after clearing space`);
      } catch (retryError) {
        console.error(
          `Failed to save ${key} even after clearing space:`,
          retryError
        );
      }
    }
  }
};

const clearAllStorage = (): void => {
  if (typeof window === "undefined") return;

  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    console.log("Cleared all localStorage");
  } catch (error) {
    console.error("Failed to clear localStorage:", error);
  }
};

// Configuration export/import utilities
const exportConfiguration = (
  config: {
    standardMenus: StandardMenu[];
    customMenus: CustomMenu[];
    menuOrder: string[];
    homePageConfig: HomePageConfig;
    appConfig: AppConfig;
    fullAppConfig: FullAppConfig;
    stylingConfig: StylingConfig;
    userConfig: UserConfig;
  },
  customName?: string
) => {
  const exportData = {
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    description: "TSE Demo Builder Configuration Export",
    ...config,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  // Use custom name if provided, otherwise use default naming
  const fileName = customName
    ? `${customName}.json`
    : `tse-demo-builder-config-${new Date().toISOString().split("T")[0]}.json`;

  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const importConfiguration = async (
  file: File
): Promise<{
  success: boolean;
  data?: ConfigurationData;
  error?: string;
}> => {
  return loadConfigurationFromSource({ type: "file", data: file });
};

// Unified configuration loading system
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

interface ConfigurationSource {
  type: "file" | "github";
  data: File | string; // File for local, string (filename) for GitHub
}

// Unified configuration loader
export const loadConfigurationFromSource = async (
  source: ConfigurationSource
): Promise<{
  success: boolean;
  data?: ConfigurationData;
  error?: string;
}> => {
  try {
    let configData: Record<string, unknown>;

    if (source.type === "file") {
      // Load from local file
      const file = source.data as File;
      const text = await file.text();
      configData = JSON.parse(text);
      console.log("Loaded configuration from file:", configData);
    } else {
      // Load from GitHub
      const filename = source.data as string;
      const { loadConfigurationFromGitHub } = await import(
        "../services/githubApi"
      );
      configData = await loadConfigurationFromGitHub(filename);
      console.log("Loaded configuration from GitHub:", configData);
    }

    // Validate basic structure
    if (!configData.version || !configData.timestamp) {
      console.warn("Missing version or timestamp in configuration");
      // Don't fail for missing version/timestamp, just warn
    }

    // Log all fields in the imported configuration for debugging
    console.log("Configuration fields:", Object.keys(configData));

    // Check for missing or unknown fields and log them
    const expectedFields = [
      "standardMenus",
      "customMenus",
      "menuOrder",
      "homePageConfig",
      "appConfig",
      "fullAppConfig",
      "stylingConfig",
      "userConfig",
    ];

    const missingFields = expectedFields.filter((field) => !configData[field]);
    const unknownFields = Object.keys(configData).filter(
      (field) =>
        !expectedFields.includes(field) &&
        field !== "version" &&
        field !== "timestamp" &&
        field !== "description"
    );

    if (missingFields.length > 0) {
      console.log("Missing fields in configuration:", missingFields);
    }

    if (unknownFields.length > 0) {
      console.log("Unknown fields in configuration:", unknownFields);
    }

    // Validate required fields exist
    const requiredFields = [
      "standardMenus",
      "homePageConfig",
      "appConfig",
      "fullAppConfig",
      "stylingConfig",
    ];
    for (const field of requiredFields) {
      if (!configData[field]) {
        console.error(`Missing required field: ${field}`);
        return { success: false, error: `Missing required field: ${field}` };
      }
    }

    // Merge with defaults to handle missing fields gracefully
    const mergedConfig: ConfigurationData = {
      standardMenus:
        (configData.standardMenus as StandardMenu[]) ||
        DEFAULT_CONFIG.standardMenus,
      customMenus:
        (configData.customMenus as CustomMenu[]) || DEFAULT_CONFIG.customMenus,
      menuOrder: (configData.menuOrder as string[]) || DEFAULT_CONFIG.menuOrder,
      homePageConfig:
        (configData.homePageConfig as HomePageConfig) ||
        DEFAULT_CONFIG.homePageConfig,
      appConfig:
        (configData.appConfig as AppConfig) || DEFAULT_CONFIG.appConfig,
      fullAppConfig:
        (configData.fullAppConfig as FullAppConfig) ||
        DEFAULT_CONFIG.fullAppConfig,
      stylingConfig:
        (configData.stylingConfig as StylingConfig) ||
        DEFAULT_CONFIG.stylingConfig,
      userConfig:
        (configData.userConfig as UserConfig) || DEFAULT_CONFIG.userConfig,
    };

    console.log("Merged configuration:", {
      standardMenus: mergedConfig.standardMenus.length,
      customMenus: mergedConfig.customMenus.length,
      menuOrder: mergedConfig.menuOrder.length,
      hasHomePageConfig: !!mergedConfig.homePageConfig,
      hasAppConfig: !!mergedConfig.appConfig,
      hasFullAppConfig: !!mergedConfig.fullAppConfig,
      hasStylingConfig: !!mergedConfig.stylingConfig,
      hasUserConfig: !!mergedConfig.userConfig,
    });

    // Validate that the imported data has the correct structure
    if (!Array.isArray(mergedConfig.standardMenus)) {
      return { success: false, error: "Invalid standardMenus format" };
    }

    if (!Array.isArray(mergedConfig.customMenus)) {
      return { success: false, error: "Invalid customMenus format" };
    }

    if (!Array.isArray(mergedConfig.menuOrder)) {
      return { success: false, error: "Invalid menuOrder format" };
    }

    return { success: true, data: mergedConfig };
  } catch (error) {
    console.error("Error in loadConfigurationFromSource:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to parse configuration file",
    };
  }
};

// Apply configuration to the app state
export const applyConfiguration = (
  config: ConfigurationData,
  updateFunctions: {
    updateStandardMenu: (
      id: string,
      field: string,
      value: string | boolean
    ) => void;
    addCustomMenu: (menu: CustomMenu) => void;
    updateHomePageConfig: (config: HomePageConfig) => void;
    updateAppConfig: (config: AppConfig) => void;
    updateFullAppConfig: (config: FullAppConfig) => void;
    updateStylingConfig: (config: StylingConfig) => void;
    updateUserConfig: (config: UserConfig) => void;
    setMenuOrder?: (order: string[]) => void; // Add menu order update function
  }
) => {
  console.log("=== Applying Configuration ===");
  console.log("Configuration to apply:", {
    standardMenus: config.standardMenus.length,
    customMenus: config.customMenus.length,
    menuOrder: config.menuOrder.length,
    hasHomePageConfig: !!config.homePageConfig,
    hasAppConfig: !!config.appConfig,
    hasFullAppConfig: !!config.fullAppConfig,
    hasStylingConfig: !!config.stylingConfig,
    hasUserConfig: !!config.userConfig,
  });

  // Apply app config
  console.log("Applying app config:", config.appConfig);
  console.log(
    "updateAppConfig function type:",
    typeof updateFunctions.updateAppConfig
  );
  updateFunctions.updateAppConfig(config.appConfig);

  // Apply styling config
  console.log("Applying styling config:", config.stylingConfig);
  console.log(
    "updateStylingConfig function type:",
    typeof updateFunctions.updateStylingConfig
  );
  updateFunctions.updateStylingConfig(config.stylingConfig);

  // Apply standard menus
  console.log("Applying standard menus:", config.standardMenus.length);
  console.log(
    "updateStandardMenu function type:",
    typeof updateFunctions.updateStandardMenu
  );
  config.standardMenus.forEach((menu, index) => {
    if (menu.id && menu.name) {
      console.log(`Applying standard menu ${index + 1}:`, menu.name, menu.id);
      console.log(
        `Calling updateStandardMenu for ${menu.id}.name = ${menu.name}`
      );
      updateFunctions.updateStandardMenu(menu.id, "name", menu.name);
      console.log(
        `Calling updateStandardMenu for ${menu.id}.enabled = ${menu.enabled}`
      );
      updateFunctions.updateStandardMenu(menu.id, "enabled", menu.enabled);
      console.log(
        `Calling updateStandardMenu for ${menu.id}.icon = ${menu.icon}`
      );
      updateFunctions.updateStandardMenu(menu.id, "icon", menu.icon);
      if (menu.homePageType) {
        console.log(
          `Calling updateStandardMenu for ${menu.id}.homePageType = ${menu.homePageType}`
        );
        updateFunctions.updateStandardMenu(
          menu.id,
          "homePageType",
          menu.homePageType
        );
      }
      if (menu.homePageValue) {
        console.log(
          `Calling updateStandardMenu for ${menu.id}.homePageValue = ${menu.homePageValue}`
        );
        updateFunctions.updateStandardMenu(
          menu.id,
          "homePageValue",
          menu.homePageValue
        );
      }

      // Apply advanced menu properties
      if (menu.modelId) {
        console.log(
          `Calling updateStandardMenu for ${menu.id}.modelId = ${menu.modelId}`
        );
        updateFunctions.updateStandardMenu(menu.id, "modelId", menu.modelId);
      }

      if (menu.contentId) {
        console.log(
          `Calling updateStandardMenu for ${menu.id}.contentId = ${menu.contentId}`
        );
        updateFunctions.updateStandardMenu(
          menu.id,
          "contentId",
          menu.contentId
        );
      }

      if (menu.contentType) {
        console.log(
          `Calling updateStandardMenu for ${menu.id}.contentType = ${menu.contentType}`
        );
        updateFunctions.updateStandardMenu(
          menu.id,
          "contentType",
          menu.contentType
        );
      }

      if (menu.namePattern) {
        console.log(
          `Calling updateStandardMenu for ${menu.id}.namePattern = ${menu.namePattern}`
        );
        updateFunctions.updateStandardMenu(
          menu.id,
          "namePattern",
          menu.namePattern
        );
      }

      if (menu.spotterModelId) {
        console.log(
          `Calling updateStandardMenu for ${menu.id}.spotterModelId = ${menu.spotterModelId}`
        );
        updateFunctions.updateStandardMenu(
          menu.id,
          "spotterModelId",
          menu.spotterModelId
        );
      }

      if (menu.spotterSearchQuery) {
        console.log(
          `Calling updateStandardMenu for ${menu.id}.spotterSearchQuery = ${menu.spotterSearchQuery}`
        );
        updateFunctions.updateStandardMenu(
          menu.id,
          "spotterSearchQuery",
          menu.spotterSearchQuery
        );
      }

      if (menu.searchDataSource) {
        console.log(
          `Calling updateStandardMenu for ${menu.id}.searchDataSource = ${menu.searchDataSource}`
        );
        updateFunctions.updateStandardMenu(
          menu.id,
          "searchDataSource",
          menu.searchDataSource
        );
      }

      if (menu.searchTokenString) {
        console.log(
          `Calling updateStandardMenu for ${menu.id}.searchTokenString = ${menu.searchTokenString}`
        );
        updateFunctions.updateStandardMenu(
          menu.id,
          "searchTokenString",
          menu.searchTokenString
        );
      }

      if (menu.runSearch !== undefined) {
        console.log(
          `Calling updateStandardMenu for ${menu.id}.runSearch = ${menu.runSearch}`
        );
        updateFunctions.updateStandardMenu(
          menu.id,
          "runSearch",
          menu.runSearch
        );
      }
    } else {
      console.warn(`Skipping invalid standard menu at index ${index}:`, menu);
    }
  });

  // Apply custom menus
  console.log("Applying custom menus:", config.customMenus.length);
  config.customMenus.forEach((menu, index) => {
    if (menu.id && menu.name) {
      console.log(`Applying custom menu ${index + 1}:`, menu.name, menu.id);
      updateFunctions.addCustomMenu(menu);
    } else {
      console.warn(`Skipping invalid custom menu at index ${index}:`, menu);
    }
  });

  // Apply menu order if available
  if (config.menuOrder.length > 0 && updateFunctions.setMenuOrder) {
    console.log("Applying menu order:", config.menuOrder);

    // Filter out menu IDs that don't exist in standard or custom menus
    const allMenuIds = [
      ...config.standardMenus.map((menu) => menu.id),
      ...config.customMenus.map((menu) => menu.id),
    ];

    const validMenuOrder = config.menuOrder.filter((menuId) => {
      const exists = allMenuIds.includes(menuId);
      if (!exists) {
        console.warn(
          `Menu ID "${menuId}" in menu order not found in standard or custom menus`
        );
      }
      return exists;
    });

    console.log("Valid menu order (filtered):", validMenuOrder);
    updateFunctions.setMenuOrder(validMenuOrder);
  } else {
    console.log(
      "Menu order not applied (no setMenuOrder function or empty order)"
    );
  }

  // Apply home page config
  console.log("Applying home page config:", config.homePageConfig);
  updateFunctions.updateHomePageConfig(config.homePageConfig);

  // Apply full app config
  console.log("Applying full app config:", config.fullAppConfig);
  updateFunctions.updateFullAppConfig(config.fullAppConfig);

  // Apply user config
  console.log("Applying user config:", config.userConfig);
  updateFunctions.updateUserConfig(config.userConfig);

  console.log("=== Configuration Applied Successfully ===");
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<
    string | undefined
  >();
  const [settingsInitialSubTab, setSettingsInitialSubTab] = useState<
    string | undefined
  >();

  // Load initial state from localStorage
  const [standardMenus, setStandardMenus] = useState<StandardMenu[]>(() => {
    const loadedMenus = loadFromStorage(STORAGE_KEYS.STANDARD_MENUS, [
      {
        id: "home",
        icon: "/icons/home.png",
        name: "Home",
        enabled: true,
        homePageType: "html",
        homePageValue:
          "<div style='padding: 20px; text-align: center;'><h1>Welcome to TSE Demo Builder</h1><p>Configure your home page content in the settings.</p></div>",
      },
      {
        id: "favorites",
        icon: "/icons/favorites.png",
        name: "Favorites",
        enabled: true,
      },
      {
        id: "my-reports",
        icon: "/icons/my-reports.png",
        name: "My Reports",
        enabled: true,
      },
      {
        id: "spotter",
        icon: "/icons/spotter.png",
        name: "Spotter",
        enabled: true,
      },
      {
        id: "search",
        icon: "/icons/search.png",
        name: "Search",
        enabled: true,
      },
      {
        id: "full-app",
        icon: "/icons/full-app.png",
        name: "Full App",
        enabled: true,
      },
    ]) as StandardMenu[];

    console.log("Raw loaded standard menus:", loadedMenus);

    // Validate that loadedMenus is an array
    if (!Array.isArray(loadedMenus)) {
      console.error("Loaded standard menus is not an array:", loadedMenus);
      return DEFAULT_CONFIG.standardMenus;
    }

    // Apply migration to convert emoji icons to file paths
    const migratedMenus = migrateStandardMenus(loadedMenus);
    console.log("Migrated standard menus:", migratedMenus);

    return migratedMenus;
  });

  // Custom menus state
  const [customMenus, setCustomMenus] = useState<CustomMenu[]>(() => {
    const loadedMenus = loadFromStorage(
      STORAGE_KEYS.CUSTOM_MENUS,
      []
    ) as CustomMenu[];

    console.log("Raw loaded custom menus:", loadedMenus);

    // Validate that loadedMenus is an array
    if (!Array.isArray(loadedMenus)) {
      console.error("Loaded custom menus is not an array:", loadedMenus);
      return [];
    }

    // Clean up any duplicate IDs that might exist
    const uniqueMenus: CustomMenu[] = [];
    const seenIds = new Set<string>();

    loadedMenus.forEach((menu, index) => {
      // Validate each menu object
      if (!validateCustomMenu(menu)) {
        console.error(`Invalid custom menu at index ${index}:`, menu);
        return;
      }

      if (!seenIds.has(menu.id)) {
        seenIds.add(menu.id);
        uniqueMenus.push(menu);
      } else {
        console.log("Removing duplicate custom menu:", menu.id);
      }
    });

    // Also clean up any menus with empty or invalid names
    const validMenus = uniqueMenus.filter((menu) => {
      if (!menu.name || menu.name.trim() === "") {
        console.log("Removing custom menu with empty name:", menu.id);
        return false;
      }
      return true;
    });

    console.log(
      "Final loaded custom menus:",
      validMenus.length,
      validMenus.map((m) => ({ id: m.id, name: m.name }))
    );
    return validMenus;
  });

  // Menu order state - tracks the order of enabled menu IDs
  const [menuOrder, setMenuOrder] = useState<string[]>(() => {
    const loadedOrder = loadFromStorage(
      STORAGE_KEYS.MENU_ORDER,
      []
    ) as string[];

    console.log("Raw loaded menu order:", loadedOrder);

    // Validate that loadedOrder is an array
    if (!Array.isArray(loadedOrder)) {
      console.error("Loaded menu order is not an array:", loadedOrder);
      return [];
    }

    // Clean up any duplicate entries in menu order
    const uniqueOrder: string[] = [];
    const seenIds = new Set<string>();

    loadedOrder.forEach((id, index) => {
      // Validate that each item is a string
      if (typeof id !== "string") {
        console.error(`Invalid menu order item at index ${index}:`, id);
        return;
      }

      if (!seenIds.has(id)) {
        seenIds.add(id);
        uniqueOrder.push(id);
      } else {
        console.log("Removing duplicate menu order entry:", id);
      }
    });

    console.log("Final menu order:", uniqueOrder);
    return uniqueOrder;
  });

  // Home page configuration state
  const [homePageConfig, setHomePageConfig] = useState<HomePageConfig>(
    () =>
      loadFromStorage(STORAGE_KEYS.HOME_PAGE_CONFIG, {
        type: "html",
        value:
          "<div style='padding: 20px; text-align: center;'><h1>Welcome to TSE Demo Builder</h1><p>Configure your home page content in the settings.</p></div>",
      }) as HomePageConfig
  );

  // App configuration state
  const [appConfig, setAppConfig] = useState<AppConfig>(
    () =>
      loadFromStorage(STORAGE_KEYS.APP_CONFIG, {
        thoughtspotUrl: "https://se-thoughtspot-cloud.thoughtspot.cloud/",
        applicationName: "TSE Demo Builder",
        logo: "",
        earlyAccessFlags: "",
        favicon: "/ts.png",
      }) as AppConfig
  );

  // Set ThoughtSpot base URL when app config changes
  useEffect(() => {
    if (appConfig.thoughtspotUrl) {
      setThoughtSpotBaseUrl(appConfig.thoughtspotUrl);
    }
  }, [appConfig.thoughtspotUrl]);

  // Full app configuration state
  const [fullAppConfig, setFullAppConfig] = useState<FullAppConfig>(
    () =>
      loadFromStorage(STORAGE_KEYS.FULL_APP_CONFIG, {
        showPrimaryNavbar: false,
        hideHomepageLeftNav: false,
      }) as FullAppConfig
  );

  // Styling configuration state
  const [stylingConfig, setStylingConfig] = useState<StylingConfig>(
    () =>
      loadFromStorage(STORAGE_KEYS.STYLING_CONFIG, {
        application: {
          topBar: {
            backgroundColor: "#ffffff",
            foregroundColor: "#1a202c",
            logoUrl: "",
          },
          sidebar: {
            backgroundColor: "#f7fafc",
            foregroundColor: "#4a5568",
          },
          footer: {
            backgroundColor: "#f7fafc",
            foregroundColor: "#4a5568",
          },
          dialogs: {
            backgroundColor: "#ffffff",
            foregroundColor: "#1a202c",
          },
        },
        embeddedContent: {
          strings: {},
          stringIDs: {},
          cssUrl: "",
          customCSS: {
            variables: {},
            rules_UNSTABLE: {},
          },
        },
        embedFlags: {
          spotterEmbed: {},
          liveboardEmbed: {},
          searchEmbed: {},
          appEmbed: {},
        },
      }) as StylingConfig
  );

  // User configuration state
  const [userConfig, setUserConfig] = useState<UserConfig>(
    () =>
      loadFromStorage(
        STORAGE_KEYS.USER_CONFIG,
        DEFAULT_CONFIG.userConfig
      ) as UserConfig
  );

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.STANDARD_MENUS, standardMenus);
  }, [standardMenus]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CUSTOM_MENUS, customMenus);
  }, [customMenus]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.MENU_ORDER, menuOrder);
  }, [menuOrder]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.HOME_PAGE_CONFIG, homePageConfig);
  }, [homePageConfig]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.APP_CONFIG, appConfig);
  }, [appConfig]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.FULL_APP_CONFIG, fullAppConfig);
  }, [fullAppConfig]);

  // Debounced save for styling config to prevent too frequent saves
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveToStorage(STORAGE_KEYS.STYLING_CONFIG, stylingConfig);
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [stylingConfig]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.USER_CONFIG, userConfig);
  }, [userConfig]);

  // Debug effect to log current state
  useEffect(() => {
    console.log("=== Current Configuration State ===");
    console.log(
      "Standard menus:",
      standardMenus.length,
      standardMenus.map((m) => ({ id: m.id, name: m.name, enabled: m.enabled }))
    );
    console.log(
      "Custom menus:",
      customMenus.length,
      customMenus.map((m) => ({ id: m.id, name: m.name, enabled: m.enabled }))
    );
    console.log("Menu order:", menuOrder);
    console.log("Home page config:", homePageConfig);
    console.log("App config:", appConfig);
    console.log("Full app config:", fullAppConfig);
    console.log("User config:", userConfig);
    console.log("===================================");
  }, [
    standardMenus,
    customMenus,
    menuOrder,
    homePageConfig,
    appConfig,
    fullAppConfig,
    userConfig,
  ]);

  // Update document title when application name changes
  useEffect(() => {
    const title = appConfig.applicationName || "TSE Demo Builder";
    document.title = title;
  }, [appConfig.applicationName]);

  // Update favicon when app config changes
  useEffect(() => {
    const favicon = appConfig.favicon || "/ts.png";
    const faviconElement = document.getElementById(
      "favicon"
    ) as HTMLLinkElement;
    if (faviconElement) {
      faviconElement.href = favicon;
    }
  }, [appConfig.favicon]);

  // Parse early access flags from configuration string
  const parseEarlyAccessFlags = (
    flagsString: string
  ): Record<string, boolean> => {
    const flags: Record<string, boolean> = {};

    if (!flagsString || flagsString.trim() === "") {
      return flags;
    }

    // Split by comma or newline and process each flag
    const flagPairs = flagsString
      .split(/[,\n]/)
      .map((pair) => pair.trim())
      .filter((pair) => pair.length > 0); // Remove empty lines

    flagPairs.forEach((pair) => {
      const [key, value] = pair.split("=").map((part) => part.trim());
      if (key && value !== undefined) {
        // Convert string value to boolean
        flags[key] = value.toLowerCase() === "true";
      }
    });

    return flags;
  };

  // ThoughtSpot initialization
  useEffect(() => {
    const initializeThoughtSpot = async () => {
      if (!appConfig.thoughtspotUrl) {
        return;
      }

      try {
        const { init, AuthType } = await import(
          "@thoughtspot/visual-embed-sdk"
        );

        // Parse early access flags from configuration
        const earlyAccessFlags = parseEarlyAccessFlags(
          appConfig.earlyAccessFlags
        );

        const initConfig: ThoughtSpotInitConfig = {
          thoughtSpotHost: appConfig.thoughtspotUrl,
          authType: AuthType.None,
          additionalFlags: {
            isLiveboardStylingEnabled: true,
            ...earlyAccessFlags,
          },
        };

        // Always add customizations to ensure embed containers work properly
        const baseRules = {
          ".embed-module__tsEmbedContainer": {
            "min-height": "0px !important",
            "min-width": "0px !important",
          },
        };

        // Merge user rules with base rules
        const mergedRules = {
          ...baseRules,
          ...(stylingConfig.embeddedContent.customCSS.rules_UNSTABLE || {}),
        };

        initConfig.customizations = {
          content: {
            strings: stylingConfig.embeddedContent.strings || {},
            stringIDs: stylingConfig.embeddedContent.stringIDs || {},
          },
          style: {
            customCSSUrl: stylingConfig.embeddedContent.cssUrl || undefined,
            customCSS: {
              variables:
                stylingConfig.embeddedContent.customCSS.variables || {},
              rules_UNSTABLE: mergedRules,
            },
          },
        };

        console.log("=== ThoughtSpot Initialization ===");
        console.log("Full initConfig:", initConfig);
        console.log("Customizations:", initConfig.customizations);
        if (initConfig.customizations?.style) {
          console.log("Style customizations:", initConfig.customizations.style);
          console.log(
            "CSS Variables:",
            initConfig.customizations.style.customCSS?.variables
          );
          console.log(
            "CSS Rules:",
            initConfig.customizations.style.customCSS?.rules_UNSTABLE
          );
        }
        console.log("==================================");

        console.log("Initializing ThoughtSpot with config:", initConfig);
        init(initConfig);
        console.log("ThoughtSpot initialization completed");
      } catch (error) {
        console.error("Failed to initialize ThoughtSpot:", error);
      }
    };

    initializeThoughtSpot();
  }, [
    appConfig.thoughtspotUrl,
    appConfig.earlyAccessFlags,
    stylingConfig.embeddedContent,
  ]); // Use specific fields instead of entire objects

  const handleUserChange = (userId: string) => {
    // Update the current user in the user configuration
    if (userConfig) {
      updateUserConfig({
        ...userConfig,
        currentUserId: userId,
      });
    }
  };

  const openSettingsWithTab = (tab?: string, subTab?: string) => {
    setSettingsInitialTab(tab);
    setSettingsInitialSubTab(subTab);
    setIsSettingsOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSessionStatusChange = (_hasSession: boolean) => {
    // Session status is tracked by the SessionChecker component
    // We can use this for future features if needed
  };

  const handleConfigureSettings = () => {
    openSettingsWithTab("configuration");
  };

  const updateStandardMenu = (
    id: string,
    field: string,
    value: string | boolean
  ) => {
    console.log(
      `[Layout] updateStandardMenu called: ${id}.${field} = ${value}`
    );
    setStandardMenus((prev) =>
      prev.map((menu) => (menu.id === id ? { ...menu, [field]: value } : menu))
    );

    // Update menu order if the enabled field is being changed
    if (field === "enabled") {
      setMenuOrder((prev) => {
        const isInOrder = prev.includes(id);
        const isEnabled = value as boolean;

        if (isEnabled && !isInOrder) {
          // Add to menu order if enabled and not already there
          return [...prev, id];
        } else if (!isEnabled && isInOrder) {
          // Remove from menu order if disabled
          return prev.filter((menuId) => menuId !== id);
        }

        return prev;
      });
    }

    // Update favicon and TopBar logo when home menu icon changes
    if (id === "home" && field === "icon") {
      setAppConfig((prev) => ({
        ...prev,
        favicon: value as string,
        logo: value as string,
      }));

      // Also update the TopBar logo in styling config
      setStylingConfig((prev) => ({
        ...prev,
        application: {
          ...prev.application,
          topBar: {
            ...prev.application.topBar,
            logoUrl: value as string,
          },
        },
      }));
    }
  };

  const updateHomePageConfig = (config: HomePageConfig) => {
    console.log(`[Layout] updateHomePageConfig called:`, config);
    setHomePageConfig(config);
  };

  const updateAppConfig = (config: AppConfig) => {
    console.log(`[Layout] updateAppConfig called:`, config);
    setAppConfig(config);
  };

  const updateFullAppConfig = (config: FullAppConfig) => {
    console.log(`[Layout] updateFullAppConfig called:`, config);
    setFullAppConfig(config);
  };

  const updateStylingConfig = (config: StylingConfig) => {
    console.log(`[Layout] updateStylingConfig called:`, config);
    setStylingConfig(config);
  };

  const updateUserConfig = (config: UserConfig) => {
    console.log(`[Layout] updateUserConfig called:`, config);
    setUserConfig(config);
  };

  const addCustomMenu = (menu: CustomMenu) => {
    console.log(
      `[Layout] addCustomMenu called with: ${menu.name} id: ${menu.id}`
    );
    console.log(`[Layout] Current custom menus count: ${customMenus.length}`);

    // Check if menu already exists
    const existingMenu = customMenus.find((m) => m.id === menu.id);
    if (existingMenu) {
      console.log(
        `[Layout] Menu already exists, updating instead: ${menu.name}`
      );
      updateCustomMenu(menu.id, menu);
      return;
    }

    console.log(`[Layout] Adding new menu: ${menu.name} id: ${menu.id}`);
    setCustomMenus((prev) => {
      const updated = [...prev, menu];
      console.log(`[Layout] Updated custom menus count: ${updated.length}`);
      return updated;
    });

    // Add to menu order if not already present
    setMenuOrder((prev) => {
      if (prev.includes(menu.id)) {
        console.log(`[Layout] Menu ID already in order, skipping: ${menu.id}`);
        return prev;
      }
      console.log(`[Layout] Adding menu ID to order: ${menu.id}`);
      return [...prev, menu.id];
    });
  };

  const updateCustomMenu = (id: string, menu: CustomMenu) => {
    setCustomMenus((prev) => prev.map((m) => (m.id === id ? menu : m)));

    // Update menu order based on enabled status
    setMenuOrder((prev) => {
      const isInOrder = prev.includes(id);
      const isEnabled = menu.enabled;

      if (isEnabled && !isInOrder) {
        // Add to menu order if enabled and not already there
        return [...prev, id];
      } else if (!isEnabled && isInOrder) {
        // Remove from menu order if disabled
        return prev.filter((menuId) => menuId !== id);
      }

      return prev;
    });
  };

  const deleteCustomMenu = (id: string) => {
    console.log("deleteCustomMenu called with id:", id);

    setCustomMenus((prev) => {
      const filtered = prev.filter((m) => m.id !== id);
      console.log("Custom menus after deletion:", filtered.length, "remaining");
      return filtered;
    });

    // Remove from menu order
    setMenuOrder((prev) => {
      const filtered = prev.filter((menuId) => menuId !== id);
      console.log("Menu order after deletion:", filtered);
      return filtered;
    });
  };

  const clearAllConfigurations = () => {
    console.log("Clearing all configurations...");

    // Reset to default values
    setStandardMenus(DEFAULT_CONFIG.standardMenus);
    setCustomMenus(DEFAULT_CONFIG.customMenus);
    setMenuOrder(DEFAULT_CONFIG.menuOrder);
    setHomePageConfig(DEFAULT_CONFIG.homePageConfig);
    setAppConfig(DEFAULT_CONFIG.appConfig);
    setFullAppConfig(DEFAULT_CONFIG.fullAppConfig);
    setStylingConfig(DEFAULT_CONFIG.stylingConfig);
    setUserConfig(DEFAULT_CONFIG.userConfig);

    // Clear localStorage
    clearAllStorage();

    console.log("All configurations cleared and reset to defaults");
  };

  const testConfigLoading = () => {
    console.log("Testing config loading with test data...");

    // Create test custom menu
    const testCustomMenu: CustomMenu = {
      id: "test-custom-menu",
      name: "Test Custom Menu",
      description: "A test custom menu for debugging",
      icon: "🧪",
      enabled: true,
      contentSelection: {
        type: "specific",
        specificContent: {
          liveboards: [],
          answers: [],
        },
      },
    };

    // Save test data to localStorage
    saveToStorage(STORAGE_KEYS.CUSTOM_MENUS, [testCustomMenu]);
    saveToStorage(STORAGE_KEYS.MENU_ORDER, [
      "home",
      "test-custom-menu",
      "favorites",
    ]);

    console.log("Test data saved to localStorage");

    // Reload the page to test loading
    window.location.reload();
  };

  const testGitHubConfig = async () => {
    console.log("Testing GitHub configuration loading...");

    // Capture console output
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const capturedLogs: string[] = [];

    console.log = (...args) => {
      capturedLogs.push(`[LOG] ${args.join(" ")}`);
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      capturedLogs.push(`[ERROR] ${args.join(" ")}`);
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      capturedLogs.push(`[WARN] ${args.join(" ")}`);
      originalWarn.apply(console, args);
    };

    try {
      const { loadConfigurationFromSource } = await import("./Layout");
      const result = await loadConfigurationFromSource({
        type: "github",
        data: "sage-test.json", // Use the actual filename from GitHub
      });

      if (result.success && result.data) {
        console.log("GitHub config loaded successfully:", result.data);

        // Test applying the configuration
        console.log("Testing configuration application...");
        applyConfiguration(result.data, {
          updateStandardMenu: updateStandardMenu,
          addCustomMenu: addCustomMenu,
          updateHomePageConfig: updateHomePageConfig,
          updateAppConfig: updateAppConfig,
          updateFullAppConfig: updateFullAppConfig,
          updateStylingConfig: updateStylingConfig,
          updateUserConfig: updateUserConfig,
          setMenuOrder: setMenuOrder,
        });

        console.log("GitHub configuration test completed successfully!");
      } else {
        console.error("Failed to load GitHub config:", result.error);
      }
    } catch (error) {
      console.error("Error testing GitHub config:", error);
    } finally {
      // Restore original console methods
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;

      // Log all captured output
      console.log("=== FULL CONSOLE CAPTURE ===");
      capturedLogs.forEach((log) => console.log(log));
      console.log("=== END CONSOLE CAPTURE ===");
    }
  };

  const handleExportConfiguration = (customName?: string) => {
    exportConfiguration(
      {
        standardMenus,
        customMenus,
        menuOrder,
        homePageConfig,
        appConfig,
        fullAppConfig,
        stylingConfig,
        userConfig,
      },
      customName
    );
  };

  const handleImportConfiguration = async (file: File) => {
    const result = await importConfiguration(file);
    if (result.success && result.data) {
      applyConfiguration(result.data, {
        updateStandardMenu,
        addCustomMenu,
        updateHomePageConfig,
        updateAppConfig,
        updateFullAppConfig,
        updateStylingConfig,
        updateUserConfig,
        setMenuOrder,
      });
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  };

  const testSettingsModalGitHub = async () => {
    console.log("Testing Settings Modal GitHub loading simulation...");
    try {
      // Simulate what the Settings modal does
      const { loadConfigurationFromSource, applyConfiguration } = await import(
        "./Layout"
      );
      const result = await loadConfigurationFromSource({
        type: "github",
        data: "sage-test.json",
      });

      if (result.success && result.data) {
        console.log(
          "GitHub config loaded successfully in Settings modal simulation"
        );

        // Simulate the Settings modal approach (without setMenuOrder)
        applyConfiguration(result.data, {
          updateStandardMenu: updateStandardMenu,
          addCustomMenu: addCustomMenu,
          updateHomePageConfig: updateHomePageConfig,
          updateAppConfig: updateAppConfig,
          updateFullAppConfig: updateFullAppConfig,
          updateStylingConfig: updateStylingConfig,
          updateUserConfig: updateUserConfig,
          // Note: setMenuOrder is not available in SettingsModal
        });

        console.log("Settings modal simulation completed successfully!");
      } else {
        console.error(
          "Failed to load GitHub config in Settings modal simulation:",
          result.error
        );
      }
    } catch (error) {
      console.error("Error in Settings modal simulation:", error);
    }
  };

  // Create unfiltered versions for Settings modal (bypass user access control)
  const allStandardMenus = standardMenus; // These are already all standard menus
  const allCustomMenus = customMenus; // These are already all custom menus

  // Filter menus based on current user access for navigation
  const accessibleStandardMenus = standardMenus.filter((menu) => {
    const currentUser = userConfig.users.find(
      (u) => u.id === userConfig.currentUserId
    );
    const standardMenuAccess = currentUser?.access?.standardMenus as
      | Record<string, boolean>
      | undefined;
    return standardMenuAccess?.[menu.id] !== false;
  });

  const accessibleCustomMenus = customMenus.filter((menu) => {
    const currentUser = userConfig.users.find(
      (u) => u.id === userConfig.currentUserId
    );
    return currentUser?.access?.customMenus?.includes(menu.id);
  });

  const contextValue: AppContextType = {
    homePageConfig,
    updateHomePageConfig,
    appConfig,
    updateAppConfig,
    fullAppConfig,
    updateFullAppConfig,
    standardMenus,
    updateStandardMenu,
    customMenus,
    addCustomMenu,
    updateCustomMenu,
    deleteCustomMenu,
    stylingConfig,
    updateStylingConfig,
    userConfig,
    updateUserConfig,
    clearAllConfigurations,
    openSettingsWithTab,
    exportConfiguration: handleExportConfiguration,
    importConfiguration: handleImportConfiguration,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <SessionChecker
        thoughtspotUrl={appConfig.thoughtspotUrl}
        onSessionStatusChange={handleSessionStatusChange}
        onConfigureSettings={handleConfigureSettings}
      >
        <div
          style={{ height: "100vh", display: "flex", flexDirection: "column" }}
        >
          {/* Top Bar */}
          <TopBar
            title={appConfig.applicationName || "TSE Demo Builder"}
            logoUrl={
              stylingConfig.application.topBar.logoUrl ||
              appConfig.logo ||
              "/ts.png"
            }
            users={userConfig.users.map((user) => ({
              id: user.id,
              name: user.name,
            }))}
            currentUser={
              userConfig.users.find((u) => u.id === userConfig.currentUserId) ||
              userConfig.users[0] || { id: "1", name: "User" }
            }
            onUserChange={handleUserChange}
            backgroundColor={stylingConfig.application.topBar.backgroundColor}
            foregroundColor={stylingConfig.application.topBar.foregroundColor}
          />

          {/* Main Content Area */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Side Navigation */}
            <SideNav
              onSettingsClick={() => setIsSettingsOpen(true)}
              standardMenus={accessibleStandardMenus}
              customMenus={accessibleCustomMenus}
              menuOrder={menuOrder}
              onMenuOrderChange={setMenuOrder}
              userConfig={userConfig}
              backgroundColor={
                stylingConfig.application.sidebar.backgroundColor
              }
              foregroundColor={
                stylingConfig.application.sidebar.foregroundColor
              }
              hoverColor={stylingConfig.application.sidebar.hoverColor}
              selectedColor={stylingConfig.application.sidebar.selectedColor}
              selectedTextColor={
                stylingConfig.application.sidebar.selectedTextColor
              }
            />

            {/* Content Area */}
            <div
              style={{
                flex: 1,
                backgroundColor: "#ffffff",
                overflow: "auto",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ flex: 1 }}>{children}</div>
              <Footer
                backgroundColor={
                  stylingConfig.application.footer.backgroundColor
                }
                foregroundColor={
                  stylingConfig.application.footer.foregroundColor
                }
              />
            </div>
          </div>

          {/* Settings Modal */}
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            standardMenus={allStandardMenus}
            updateStandardMenu={updateStandardMenu}
            homePageConfig={homePageConfig}
            updateHomePageConfig={updateHomePageConfig}
            appConfig={appConfig}
            updateAppConfig={updateAppConfig}
            fullAppConfig={fullAppConfig}
            updateFullAppConfig={updateFullAppConfig}
            customMenus={allCustomMenus}
            addCustomMenu={addCustomMenu}
            updateCustomMenu={updateCustomMenu}
            deleteCustomMenu={deleteCustomMenu}
            stylingConfig={stylingConfig}
            updateStylingConfig={updateStylingConfig}
            userConfig={userConfig}
            updateUserConfig={updateUserConfig}
            setMenuOrder={setMenuOrder}
            clearAllConfigurations={clearAllConfigurations}
            exportConfiguration={handleExportConfiguration}
            importConfiguration={handleImportConfiguration}
            initialTab={settingsInitialTab}
            initialSubTab={settingsInitialSubTab}
            onTabChange={(tab, subTab) => {
              setSettingsInitialTab(tab);
              if (subTab) {
                setSettingsInitialSubTab(subTab);
              }
            }}
          />

          {/* Chat Bubble */}
          <ChatBubble />
        </div>
      </SessionChecker>
    </AppContext.Provider>
  );
}
