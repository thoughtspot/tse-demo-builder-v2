import { loadConfigurationFromGitHub } from "./githubApi";
import {
  HomePageConfig,
  AppConfig,
  FullAppConfig,
  StylingConfig,
  UserConfig,
  StandardMenu,
  CustomMenu,
  ConfigurationData,
  ConfigurationSource,
} from "../types/thoughtspot";

// Storage configuration
const STORAGE_KEY = "tse-demo-builder-config";
const INDEXEDDB_NAME = "TSE_Demo_Builder_DB";
const INDEXEDDB_VERSION = 1;
const STORE_NAME = "configurations";
const LARGE_OBJECT_THRESHOLD = 1024 * 1024; // 1MB threshold for using IndexedDB

// Default configuration
export const DEFAULT_CONFIG: ConfigurationData = {
  standardMenus: [
    {
      id: "home",
      name: "Home",
      enabled: true,
      icon: "home",
      homePageType: "html",
      homePageValue: "<h1>Welcome to TSE Demo Builder</h1>",
    },
    {
      id: "favorites",
      name: "Favorites",
      enabled: true,
      icon: "favorites",
      homePageType: "html",
      homePageValue: "<h1>Favorites</h1>",
    },
    {
      id: "my-reports",
      name: "My Reports",
      enabled: true,
      icon: "my-reports",
      homePageType: "html",
      homePageValue: "<h1>My Reports</h1>",
    },
    {
      id: "spotter",
      name: "Spotter",
      enabled: true,
      icon: "spotter-custom.svg",
      homePageType: "html",
      homePageValue: "<h1>Spotter</h1>",
    },
    {
      id: "search",
      name: "Search",
      enabled: true,
      icon: "search",
      homePageType: "html",
      homePageValue: "<h1>Search</h1>",
    },
    {
      id: "full-app",
      name: "Full App",
      enabled: true,
      icon: "full-app",
      homePageType: "html",
      homePageValue: "<h1>Full App</h1>",
    },
  ],
  customMenus: [],
  menuOrder: [
    "home",
    "favorites",
    "my-reports",
    "spotter",
    "search",
    "full-app",
  ],
  homePageConfig: {
    type: "html",
    value: "<h1>Welcome to TSE Demo Builder</h1>",
  },
  appConfig: {
    thoughtspotUrl: "https://se-thoughtspot-cloud.thoughtspot.cloud/",
    applicationName: "TSE Demo Builder",
    logo: "/ts.png",
    earlyAccessFlags: "enable-modular-home\nenable-custom-styling",
    favicon: "/ts.png",
    showFooter: true,
  },
  fullAppConfig: {
    showPrimaryNavbar: true,
    hideHomepageLeftNav: false,
  },
  stylingConfig: {
    application: {
      topBar: {
        backgroundColor: "#ffffff",
        foregroundColor: "#333333",
        logoUrl: "/ts.png",
      },
      sidebar: {
        backgroundColor: "#f5f5f5",
        foregroundColor: "#333333",
      },
      footer: {
        backgroundColor: "#ffffff",
        foregroundColor: "#333333",
      },
      dialogs: {
        backgroundColor: "#ffffff",
        foregroundColor: "#333333",
      },
      buttons: {
        primary: {
          backgroundColor: "#3182ce",
          foregroundColor: "#ffffff",
          borderColor: "#3182ce",
          hoverBackgroundColor: "#2c5aa0",
          hoverForegroundColor: "#ffffff",
        },
        secondary: {
          backgroundColor: "#ffffff",
          foregroundColor: "#374151",
          borderColor: "#d1d5db",
          hoverBackgroundColor: "#f9fafb",
          hoverForegroundColor: "#374151",
        },
      },
      backgrounds: {
        mainBackground: "#f7fafc",
        contentBackground: "#ffffff",
        cardBackground: "#ffffff",
        borderColor: "#e2e8f0",
      },
      typography: {
        primaryColor: "#1f2937",
        secondaryColor: "#6b7280",
        linkColor: "#3182ce",
        linkHoverColor: "#2c5aa0",
      },
      selectedTheme: "default",
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
    embedFlags: {},
    embedDisplay: {
      hideTitle: false,
      hideDescription: false,
    },
  },
  userConfig: {
    users: [],
    currentUserId: undefined,
  },
};

// Old storage keys for migration
const OLD_STORAGE_KEYS = {
  HOME_PAGE_CONFIG: "tse-demo-builder-home-page-config",
  APP_CONFIG: "tse-demo-builder-app-config",
  STANDARD_MENUS: "tse-demo-builder-standard-menus",
  FULL_APP_CONFIG: "tse-demo-builder-full-app-config",
  CUSTOM_MENUS: "tse-demo-builder-custom-menus",
  MENU_ORDER: "tse-demo-builder-menu-order",
  STYLING_CONFIG: "tse-demo-builder-styling-config",
  USER_CONFIG: "tse-demo-builder-user-config",
};

// IndexedDB utilities
const openIndexedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not available"));
      return;
    }

    const request = indexedDB.open(INDEXEDDB_NAME, INDEXEDDB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
  });
};

const saveToIndexedDB = async (
  key: string,
  data: ConfigurationData
): Promise<void> => {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ key, data, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to save to IndexedDB:", error);
    throw error;
  }
};

const loadFromIndexedDB = async (
  key: string
): Promise<ConfigurationData | null> => {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result?.data as ConfigurationData | undefined;
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn("Failed to load from IndexedDB:", error);
    return null;
  }
};

const removeFromIndexedDB = async (key: string): Promise<void> => {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn("Failed to remove from IndexedDB:", error);
  }
};

// Check if configuration contains large objects (images, etc.)
const isLargeConfiguration = (config: ConfigurationData): boolean => {
  const serialized = JSON.stringify(config);

  // Check total size
  if (serialized.length > LARGE_OBJECT_THRESHOLD) {
    return true;
  }

  // Check for large data URLs (images)
  const dataUrlPattern = /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g;
  const dataUrls = serialized.match(dataUrlPattern);

  if (dataUrls) {
    const totalDataUrlSize = dataUrls.reduce((total, url) => {
      // Estimate size: base64 is ~33% larger than binary
      return total + Math.ceil((url.length * 3) / 4);
    }, 0);

    if (totalDataUrlSize > LARGE_OBJECT_THRESHOLD) {
      return true;
    }
  }

  return false;
};

// Migration function to handle old multi-key storage
const migrateFromOldStorage = (): ConfigurationData | null => {
  if (typeof window === "undefined") return null;

  const oldKeys = OLD_STORAGE_KEYS;

  try {
    // Check if any old keys exist
    const hasOldData = Object.values(oldKeys).some(
      (key) => localStorage.getItem(key) !== null
    );

    if (!hasOldData) {
      return null; // No old data to migrate
    }

    console.log("Found old storage format, migrating to new format...");

    // Load data from old keys
    const standardMenus =
      JSON.parse(localStorage.getItem(oldKeys.STANDARD_MENUS) || "null") ||
      DEFAULT_CONFIG.standardMenus;
    const customMenus =
      JSON.parse(localStorage.getItem(oldKeys.CUSTOM_MENUS) || "null") ||
      DEFAULT_CONFIG.customMenus;
    const menuOrder =
      JSON.parse(localStorage.getItem(oldKeys.MENU_ORDER) || "null") ||
      DEFAULT_CONFIG.menuOrder;
    const homePageConfig =
      JSON.parse(localStorage.getItem(oldKeys.HOME_PAGE_CONFIG) || "null") ||
      DEFAULT_CONFIG.homePageConfig;
    const appConfig =
      JSON.parse(localStorage.getItem(oldKeys.APP_CONFIG) || "null") ||
      DEFAULT_CONFIG.appConfig;
    const fullAppConfig =
      JSON.parse(localStorage.getItem(oldKeys.FULL_APP_CONFIG) || "null") ||
      DEFAULT_CONFIG.fullAppConfig;
    const stylingConfig =
      JSON.parse(localStorage.getItem(oldKeys.STYLING_CONFIG) || "null") ||
      DEFAULT_CONFIG.stylingConfig;
    const userConfig =
      JSON.parse(localStorage.getItem(oldKeys.USER_CONFIG) || "null") ||
      DEFAULT_CONFIG.userConfig;

    const migratedConfig: ConfigurationData = {
      standardMenus,
      customMenus,
      menuOrder,
      homePageConfig,
      appConfig,
      fullAppConfig,
      stylingConfig,
      userConfig,
    };

    // Clean up old keys first to free up space
    Object.values(oldKeys).forEach((key) => localStorage.removeItem(key));

    // Save migrated config using new storage system
    saveToStorage(migratedConfig);

    console.log("Migration completed successfully");
    return migratedConfig;
  } catch (error) {
    console.error("Failed to migrate from old storage format:", error);
    // Clean up old keys on error to prevent future migration attempts
    try {
      Object.values(oldKeys).forEach((key) => localStorage.removeItem(key));
    } catch (cleanupError) {
      console.error("Failed to clean up old keys:", cleanupError);
    }
    return null;
  }
};

// Hybrid storage functions
const loadFromStorage = async (): Promise<ConfigurationData> => {
  if (typeof window === "undefined") return DEFAULT_CONFIG;

  try {
    // First, try to load from localStorage (for backward compatibility)
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log("Loaded configuration from localStorage:", parsed);
      return parsed;
    }

    // Try to migrate from old format
    const migrated = migrateFromOldStorage();
    if (migrated) {
      console.log("Successfully migrated from old storage format");
      return migrated;
    }

    // Try to load from IndexedDB
    const indexedDBData = await loadFromIndexedDB(STORAGE_KEY);
    if (indexedDBData) {
      return indexedDBData;
    }

    return DEFAULT_CONFIG;
  } catch (error) {
    console.error("Failed to load configuration:", error);
    console.log("Using default configuration");
    return DEFAULT_CONFIG;
  }
};

const saveToStorage = async (config: ConfigurationData): Promise<void> => {
  if (typeof window === "undefined") return;

  try {
    const isLarge = isLargeConfiguration(config);

    if (isLarge) {
      // Save to IndexedDB for large configurations
      await saveToIndexedDB(STORAGE_KEY, config);

      // Remove from localStorage if it exists there
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.warn("Failed to remove from localStorage:", error);
      }
    } else {
      // Save to localStorage for small configurations
      const serializedValue = JSON.stringify(config);
      localStorage.setItem(STORAGE_KEY, serializedValue);

      // Remove from IndexedDB if it exists there
      try {
        await removeFromIndexedDB(STORAGE_KEY);
      } catch (error) {
        console.warn("Failed to remove from IndexedDB:", error);
      }
    }
  } catch (error) {
    console.error("Failed to save configuration:", error);

    // Fallback: try localStorage if IndexedDB fails
    if (error instanceof Error && error.message.includes("IndexedDB")) {
      console.log("IndexedDB failed, trying localStorage fallback");
      try {
        const serializedValue = JSON.stringify(config);
        localStorage.setItem(STORAGE_KEY, serializedValue);
        console.log(
          "Successfully saved configuration to localStorage fallback"
        );
      } catch (fallbackError) {
        console.error("Fallback localStorage save also failed:", fallbackError);
      }
    }
  }
};

// Global flag to prevent storage operations during import
let isImportingConfiguration = false;

export const setIsImportingConfiguration = (importing: boolean) => {
  isImportingConfiguration = importing;
};

// Load all configurations from storage
export const loadAllConfigurations = async (): Promise<ConfigurationData> => {
  return await loadFromStorage();
};

// Save all configurations to storage
export const saveAllConfigurations = async (
  config: ConfigurationData
): Promise<void> => {
  await saveToStorage(config);
};

// Individual save functions for backward compatibility
export const saveStandardMenus = async (
  standardMenus: StandardMenu[],
  onError?: (message: string) => void
) => {
  try {
    const currentConfig = await loadFromStorage();
    const updatedConfig = { ...currentConfig, standardMenus };
    await saveToStorage(updatedConfig);
  } catch (error) {
    const message = `Failed to save standard menus: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
    console.error(message);
    onError?.(message);
  }
};

export const saveCustomMenus = async (
  customMenus: CustomMenu[],
  onError?: (message: string) => void
) => {
  if (isImportingConfiguration) {
    return;
  }

  try {
    const currentConfig = await loadFromStorage();
    const updatedConfig = { ...currentConfig, customMenus };
    await saveToStorage(updatedConfig);
  } catch (error) {
    const message = `Failed to save custom menus: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
    console.error(message);
    onError?.(message);
  }
};

export const saveMenuOrder = async (
  menuOrder: string[],
  onError?: (message: string) => void
) => {
  try {
    const currentConfig = await loadFromStorage();
    const updatedConfig = { ...currentConfig, menuOrder };
    await saveToStorage(updatedConfig);
  } catch (error) {
    const message = `Failed to save menu order: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
    console.error(message);
    onError?.(message);
  }
};

export const saveHomePageConfig = async (
  homePageConfig: HomePageConfig,
  onError?: (message: string) => void
) => {
  try {
    const currentConfig = await loadFromStorage();
    const updatedConfig = { ...currentConfig, homePageConfig };
    await saveToStorage(updatedConfig);
  } catch (error) {
    const message = `Failed to save home page config: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
    console.error(message);
    onError?.(message);
  }
};

export const saveAppConfig = async (
  appConfig: AppConfig,
  onError?: (message: string) => void
) => {
  if (isImportingConfiguration) {
    return;
  }

  try {
    const currentConfig = await loadFromStorage();
    const updatedConfig = { ...currentConfig, appConfig };
    await saveToStorage(updatedConfig);
  } catch (error) {
    const message = `Failed to save app config: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
    console.error(message);
    onError?.(message);
  }
};

export const saveFullAppConfig = async (
  fullAppConfig: FullAppConfig,
  onError?: (message: string) => void
) => {
  try {
    const currentConfig = await loadFromStorage();
    const updatedConfig = { ...currentConfig, fullAppConfig };
    await saveToStorage(updatedConfig);
  } catch (error) {
    const message = `Failed to save full app config: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
    console.error(message);
    onError?.(message);
  }
};

export const saveStylingConfig = async (
  stylingConfig: StylingConfig,
  onError?: (message: string) => void
) => {
  try {
    const currentConfig = await loadFromStorage();
    const updatedConfig = { ...currentConfig, stylingConfig };
    await saveToStorage(updatedConfig);
  } catch (error) {
    const message = `Failed to save styling config: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
    console.error(message);
    onError?.(message);
  }
};

export const saveUserConfig = async (
  userConfig: UserConfig,
  onError?: (message: string) => void
) => {
  try {
    const currentConfig = await loadFromStorage();
    const updatedConfig = { ...currentConfig, userConfig };
    await saveToStorage(updatedConfig);
  } catch (error) {
    const message = `Failed to save user config: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
    console.error(message);
    onError?.(message);
  }
};

// Clear all configurations
export const clearAllConfigurations = async () => {
  if (typeof window === "undefined") return;

  try {
    // Clear from both storage systems
    localStorage.removeItem(STORAGE_KEY);
    await removeFromIndexedDB(STORAGE_KEY);

    // Also clear any old keys that might exist
    const oldKeys = OLD_STORAGE_KEYS;
    Object.values(oldKeys).forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (keyError) {
        console.warn(`Failed to remove old key ${key}:`, keyError);
      }
    });

    console.log("Cleared all storage configurations");
    return {
      success: true,
      message: "All configurations cleared and defaults restored",
    };
  } catch (error) {
    console.error("Failed to clear storage:", error);
    return {
      success: false,
      message: `Failed to clear configurations: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};

// Clear storage and reload defaults
export const clearStorageAndReloadDefaults = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  if (typeof window === "undefined") {
    return {
      success: false,
      message: "Storage not available in server environment",
    };
  }

  try {
    // Clear from both storage systems
    localStorage.removeItem(STORAGE_KEY);
    await removeFromIndexedDB(STORAGE_KEY);

    // Also clear any old keys that might exist
    const oldKeys = OLD_STORAGE_KEYS;
    Object.values(oldKeys).forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (keyError) {
        console.warn(`Failed to remove old key ${key}:`, keyError);
      }
    });

    return {
      success: true,
      message:
        "Storage cleared successfully. Default configurations have been restored.",
    };
  } catch (error) {
    console.error("Failed to clear storage and reload defaults:", error);
    return {
      success: false,
      message: `Failed to clear storage: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};

// Storage health check
export const checkStorageHealth = async (): Promise<{
  healthy: boolean;
  currentSize: number;
  quota: number;
  usagePercentage: number;
  message: string;
  storageType: "localStorage" | "indexedDB" | "none";
}> => {
  if (typeof window === "undefined") {
    return {
      healthy: false,
      currentSize: 0,
      quota: 0,
      usagePercentage: 0,
      message: "Storage not available in server environment",
      storageType: "none",
    };
  }

  try {
    // Check localStorage
    const localStorageData = localStorage.getItem(STORAGE_KEY);
    if (localStorageData) {
      const currentSize = localStorageData.length;
      const quota = 5 * 1024 * 1024; // 5MB
      const usagePercentage = (currentSize / quota) * 100;

      return {
        healthy: usagePercentage < 90,
        currentSize,
        quota,
        usagePercentage,
        message: `localStorage usage: ${usagePercentage.toFixed(1)}%`,
        storageType: "localStorage",
      };
    }

    // Check IndexedDB
    const indexedDBData = await loadFromIndexedDB(STORAGE_KEY);
    if (indexedDBData) {
      const serialized = JSON.stringify(indexedDBData);
      const currentSize = serialized.length;
      const quota = 50 * 1024 * 1024; // 50MB for IndexedDB
      const usagePercentage = (currentSize / quota) * 100;

      return {
        healthy: usagePercentage < 90,
        currentSize,
        quota,
        usagePercentage,
        message: `IndexedDB usage: ${usagePercentage.toFixed(1)}%`,
        storageType: "indexedDB",
      };
    }

    return {
      healthy: true,
      currentSize: 0,
      quota: 0,
      usagePercentage: 0,
      message: "No stored configuration found",
      storageType: "none",
    };
  } catch (error) {
    return {
      healthy: false,
      currentSize: 0,
      quota: 0,
      usagePercentage: 0,
      message: "Unable to check storage health",
      storageType: "none",
    };
  }
};

// Load configuration from various sources
export const loadConfigurationFromSource = async (
  source: ConfigurationSource,
  updateFunctions?: ConfigurationUpdateFunctions
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
      "userConfig",
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

    // Debug user configuration
    console.log("User configuration details:", {
      users: mergedConfig.userConfig.users?.length || 0,
      currentUserId: mergedConfig.userConfig.currentUserId,
      userConfig: mergedConfig.userConfig,
    });

    // Debug standard menus for models
    console.log(
      "Standard menus with models:",
      mergedConfig.standardMenus.map((menu) => ({
        id: menu.id,
        name: menu.name,
        spotterModelId: menu.spotterModelId,
        searchDataSource: menu.searchDataSource,
        searchTokenString: menu.searchTokenString,
        runSearch: menu.runSearch,
      }))
    );

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

    // If update functions are provided, automatically apply the configuration
    if (updateFunctions) {
      console.log("Automatically applying loaded configuration...");
      applyConfiguration(mergedConfig, updateFunctions);
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

// Update functions interface
export interface ConfigurationUpdateFunctions {
  updateStandardMenu: (
    id: string,
    field: string,
    value: string | boolean,
    skipFaviconUpdate?: boolean
  ) => void;
  addCustomMenu: (menu: CustomMenu) => void;
  clearCustomMenus?: () => void;
  updateHomePageConfig: (config: HomePageConfig) => void;
  setIsImportingConfiguration?: (isImporting: boolean) => void;
  updateAppConfig: (config: AppConfig, bypassClusterWarning?: boolean) => void;
  updateFullAppConfig: (config: FullAppConfig) => void;
  updateStylingConfig: (config: StylingConfig) => void;
  updateUserConfig: (config: UserConfig) => void;
  setMenuOrder?: (order: string[]) => void;
}

// Save configuration directly to storage (synchronous approach)
export const saveConfigurationToStorage = async (
  config: ConfigurationData
): Promise<void> => {
  console.log("=== Saving Configuration to Storage ===");
  console.log("Configuration to save:", {
    standardMenus: config.standardMenus.length,
    customMenus: config.customMenus.length,
    menuOrder: config.menuOrder.length,
    hasHomePageConfig: !!config.homePageConfig,
    hasAppConfig: !!config.appConfig,
    hasFullAppConfig: !!config.fullAppConfig,
    hasStylingConfig: !!config.stylingConfig,
    hasUserConfig: !!config.userConfig,
  });

  try {
    // Save the entire configuration at once
    await saveToStorage(config);
    console.log("Configuration saved to storage successfully");
  } catch (error) {
    console.error("Failed to save configuration to storage:", error);
    throw error;
  }
};

// Apply configuration to the app state (legacy approach - kept for backward compatibility)
export const applyConfiguration = async (
  config: ConfigurationData,
  updateFunctions: ConfigurationUpdateFunctions
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

  // Set import flag to prevent auto-save loops
  if (updateFunctions.setIsImportingConfiguration) {
    updateFunctions.setIsImportingConfiguration(true);
  }

  // Apply app config first
  console.log("Applying app config:", config.appConfig);
  console.log("About to call updateAppConfig with bypassClusterWarning=true");
  console.trace("[applyConfiguration] Call stack before updateAppConfig:");
  updateFunctions.updateAppConfig(config.appConfig, true); // Bypass cluster warning when loading from config
  console.log("updateAppConfig call completed");

  // Apply styling config with safety checks
  console.log("=== Applying Styling Configuration ===");
  console.log("Styling config to apply:", config.stylingConfig);

  // Ensure the styling config has proper structure
  const safeStylingConfig = {
    ...config.stylingConfig,
    embeddedContent: {
      strings: config.stylingConfig.embeddedContent?.strings || {},
      stringIDs: config.stylingConfig.embeddedContent?.stringIDs || {},
      cssUrl: config.stylingConfig.embeddedContent?.cssUrl || "",
      customCSS: {
        variables:
          config.stylingConfig.embeddedContent?.customCSS?.variables || {},
        rules_UNSTABLE:
          config.stylingConfig.embeddedContent?.customCSS?.rules_UNSTABLE || {},
      },
    },
  };

  console.log("Safe styling config structure:", {
    hasApplication: !!safeStylingConfig.application,
    hasEmbeddedContent: !!safeStylingConfig.embeddedContent,
    hasEmbedFlags: !!safeStylingConfig.embedFlags,
    applicationKeys: safeStylingConfig.application
      ? Object.keys(safeStylingConfig.application)
      : [],
    embeddedContentKeys: safeStylingConfig.embeddedContent
      ? Object.keys(safeStylingConfig.embeddedContent)
      : [],
  });
  updateFunctions.updateStylingConfig(safeStylingConfig);
  console.log("=== Styling Configuration Applied ===");

  // Apply user config early to ensure proper access control
  console.log("Applying user config:", config.userConfig);
  updateFunctions.updateUserConfig(config.userConfig);

  // Apply standard menus - batch updates to reduce save operations
  console.log("Applying standard menus:", config.standardMenus.length);
  config.standardMenus.forEach((menu, index) => {
    if (menu.id && menu.name) {
      console.log(`Applying standard menu ${index + 1}:`, menu.name, menu.id);

      // Apply all updates for this menu - the debounced save mechanism will batch them
      updateFunctions.updateStandardMenu(menu.id, "name", menu.name);
      updateFunctions.updateStandardMenu(menu.id, "enabled", menu.enabled);
      updateFunctions.updateStandardMenu(
        menu.id,
        "icon",
        menu.icon,
        menu.id === "home"
      );

      if (menu.homePageType) {
        updateFunctions.updateStandardMenu(
          menu.id,
          "homePageType",
          menu.homePageType
        );
      }
      if (menu.homePageValue) {
        updateFunctions.updateStandardMenu(
          menu.id,
          "homePageValue",
          menu.homePageValue
        );
      }
      if (menu.modelId) {
        updateFunctions.updateStandardMenu(menu.id, "modelId", menu.modelId);
      }
      if (menu.contentId) {
        updateFunctions.updateStandardMenu(
          menu.id,
          "contentId",
          menu.contentId
        );
      }
      if (menu.contentType) {
        updateFunctions.updateStandardMenu(
          menu.id,
          "contentType",
          menu.contentType
        );
      }
      if (menu.namePattern) {
        updateFunctions.updateStandardMenu(
          menu.id,
          "namePattern",
          menu.namePattern
        );
      }
      if (menu.spotterModelId) {
        updateFunctions.updateStandardMenu(
          menu.id,
          "spotterModelId",
          menu.spotterModelId
        );
      }
      if (menu.spotterSearchQuery) {
        updateFunctions.updateStandardMenu(
          menu.id,
          "spotterSearchQuery",
          menu.spotterSearchQuery
        );
      }
      if (menu.searchDataSource) {
        updateFunctions.updateStandardMenu(
          menu.id,
          "searchDataSource",
          menu.searchDataSource
        );
      }
      if (menu.searchTokenString) {
        updateFunctions.updateStandardMenu(
          menu.id,
          "searchTokenString",
          menu.searchTokenString
        );
      }
      if (menu.runSearch !== undefined) {
        updateFunctions.updateStandardMenu(
          menu.id,
          "runSearch",
          menu.runSearch
        );
      }

      // Special handling for home menu icon to ensure we use the correct values from config
      if (menu.id === "home" && menu.icon) {
        console.log(`[Config Import] Updating home menu icon to: ${menu.icon}`);
        console.log(
          `[Config Import] Current app config from config file:`,
          config.appConfig
        );
        // Directly update app config with the icon from the config file
        const currentAppConfig = config.appConfig;
        const updatedAppConfig = {
          ...currentAppConfig,
          favicon: menu.icon,
          logo: menu.icon,
        };
        console.log(`[Config Import] Updated app config:`, updatedAppConfig);
        console.log(
          `[Config Import] About to call updateAppConfig for home menu icon`
        );
        console.trace(
          "[Config Import] Call stack before updateAppConfig for home menu:"
        );
        updateFunctions.updateAppConfig(updatedAppConfig, true);
        console.log(
          `[Config Import] updateAppConfig call completed for home menu icon`
        );

        // Also update the TopBar logo in styling config
        const currentStylingConfig = config.stylingConfig;
        const updatedStylingConfig = {
          ...currentStylingConfig,
          application: {
            ...currentStylingConfig.application,
            topBar: {
              ...currentStylingConfig.application.topBar,
              logoUrl: menu.icon,
            },
          },
        };
        updateFunctions.updateStylingConfig(updatedStylingConfig);
      }
    } else {
      console.warn(`Skipping invalid standard menu at index ${index}:`, menu);
    }
  });

  // Apply custom menus - clear existing ones first, then add new ones
  console.log("Applying custom menus:", config.customMenus.length);

  // Clear existing custom menus first to avoid duplicates
  if (updateFunctions.clearCustomMenus) {
    console.log("Clearing existing custom menus before applying new ones");
    updateFunctions.clearCustomMenus();
  } else {
    console.log(
      "clearCustomMenus function not available, will rely on addCustomMenu to handle duplicates"
    );
  }

  // Apply all custom menus from the configuration
  console.log("About to apply custom menus:", config.customMenus);

  // Apply custom menus synchronously to ensure they're all processed
  for (let index = 0; index < config.customMenus.length; index++) {
    const menu = config.customMenus[index];
    if (menu.id && menu.name) {
      console.log(`Applying custom menu ${index + 1}:`, menu.name, menu.id);
      try {
        updateFunctions.addCustomMenu(menu);
        console.log(`Successfully applied custom menu: ${menu.name}`);
      } catch (error) {
        console.error(`Failed to apply custom menu ${menu.name}:`, error);
      }
    } else {
      console.warn(`Skipping invalid custom menu at index ${index}:`, menu);
    }
  }
  console.log("Finished applying custom menus");

  // Add a longer delay to ensure storage operations complete
  console.log("Waiting for storage operations to complete...");
  await new Promise((resolve) => setTimeout(resolve, 500));

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

  console.log("=== Configuration Applied Successfully ===");

  // Clear import flag after a delay to allow state updates to complete
  setTimeout(() => {
    if (updateFunctions.setIsImportingConfiguration) {
      updateFunctions.setIsImportingConfiguration(false);
      console.log(
        "[Config Service] Configuration import completed, auto-save re-enabled"
      );
    }
  }, 1000);
};

// Export configuration as JSON file
export const exportConfiguration = (
  config: ConfigurationData,
  customName?: string
): void => {
  try {
    const configToExport = {
      ...config,
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      description: "TSE Demo Builder Configuration Export",
    };

    const blob = new Blob([JSON.stringify(configToExport, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // Use custom name if provided, otherwise use default naming
    const fileName = customName
      ? `${customName}.json`
      : `tse-demo-builder-config-${
          new Date().toISOString().split("T")[0]
        }.json`;

    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("Configuration exported successfully");
  } catch (error) {
    console.error("Error exporting configuration:", error);
  }
};

// Simplified configuration loading function
export const loadConfigurationSimplified = async (
  source: ConfigurationSource,
  onProgress?: (message: string, progress?: number) => void
): Promise<{ success: boolean; error?: string }> => {
  try {
    onProgress?.("Starting configuration load...", 10);

    // Step 1: Clear current configuration from storage
    onProgress?.("Clearing current configuration...", 20);
    await clearStorageCompletely();

    // Step 2: Load configuration from source
    onProgress?.("Loading configuration from source...", 40);
    let configData: Record<string, unknown>;

    if (source.type === "file") {
      const file = source.data as File;
      const text = await file.text();
      configData = JSON.parse(text);
      console.log("Loaded configuration from file:", configData);
    } else {
      const filename = source.data as string;
      configData = await loadConfigurationFromGitHub(filename);
      console.log("Loaded configuration from GitHub:", configData);
    }

    onProgress?.("Validating configuration...", 60);

    // Step 3: Validate and merge configuration
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

    onProgress?.("Saving configuration to storage...", 80);

    // Step 4: Save configuration to storage
    await saveToStorage(mergedConfig);

    onProgress?.("Configuration loaded successfully!", 100);

    // Step 5: Check if we're on a custom menu page and redirect if needed
    const currentPath = window.location.pathname;
    const isOnCustomMenu = currentPath.startsWith("/custom/");

    if (isOnCustomMenu) {
      // Redirect to first available standard menu
      setTimeout(() => {
        redirectFromCustomMenu(mergedConfig.standardMenus);
      }, 500);
    } else {
      // Not on a custom menu, just reload the page
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }

    return { success: true };
  } catch (error) {
    console.error("Error in loadConfigurationSimplified:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

// Helper function to redirect from custom menu to first available standard menu
export const redirectFromCustomMenu = (standardMenus: StandardMenu[]): void => {
  const currentPath = window.location.pathname;
  const isOnCustomMenu = currentPath.startsWith("/custom/");

  if (isOnCustomMenu) {
    // Find the first available standard menu to redirect to
    const firstStandardMenu = standardMenus.find((menu) => menu.enabled);
    if (firstStandardMenu) {
      const routeMap: { [key: string]: string } = {
        home: "/",
        favorites: "/favorites",
        "my-reports": "/my-reports",
        spotter: "/spotter",
        search: "/search",
        "full-app": "/full-app",
      };

      const redirectRoute = routeMap[firstStandardMenu.id] || "/";
      console.log(`Redirecting from custom menu to: ${redirectRoute}`);

      // Redirect to the first available standard menu
      window.location.href = redirectRoute;
    } else {
      // Fallback to home if no standard menus are available
      window.location.href = "/";
    }
  }
};

// Helper function to completely clear storage
const clearStorageCompletely = async (): Promise<void> => {
  try {
    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);

      // Clear old storage keys if they exist
      const oldKeys = [
        "tse-demo-builder-standard-menus",
        "tse-demo-builder-custom-menus",
        "tse-demo-builder-menu-order",
        "tse-demo-builder-home-page-config",
        "tse-demo-builder-app-config",
        "tse-demo-builder-full-app-config",
        "tse-demo-builder-styling-config",
        "tse-demo-builder-user-config",
      ];

      oldKeys.forEach((key) => localStorage.removeItem(key));
    }

    // Clear IndexedDB
    try {
      await removeFromIndexedDB(STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to clear IndexedDB:", error);
    }

    console.log("Storage cleared completely");
  } catch (error) {
    console.error("Error clearing storage:", error);
    throw error;
  }
};
