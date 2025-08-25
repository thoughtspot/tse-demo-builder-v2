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

// Storage keys for localStorage
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

// Storage management utilities
const getStorageSize = (): number => {
  if (typeof window === "undefined") return 0;
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return total;
};

const getStorageQuota = (): number => {
  // Most browsers have a 5-10MB limit for localStorage
  // We'll use a conservative estimate of 5MB
  return 5 * 1024 * 1024; // 5MB in bytes
};

const cleanupOldStorage = (): boolean => {
  if (typeof window === "undefined") return false;

  try {
    // Remove all our app's storage keys EXCEPT the one currently being saved
    // This prevents clearing the data that's currently being written
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    console.log("[Storage] Cleaned up old storage data");
    return true;
  } catch (error) {
    console.error("[Storage] Failed to cleanup old storage:", error);
    return false;
  }
};

const estimateStorageSize = (key: string, value: unknown): number => {
  const serializedValue = JSON.stringify(value);
  return key.length + serializedValue.length;
};

// Check storage health and return status
export const checkStorageHealth = (): {
  healthy: boolean;
  currentSize: number;
  quota: number;
  usagePercentage: number;
  message: string;
} => {
  if (typeof window === "undefined") {
    return {
      healthy: false,
      currentSize: 0,
      quota: 0,
      usagePercentage: 0,
      message: "Storage not available in server environment",
    };
  }

  const currentSize = getStorageSize();
  const quota = getStorageQuota();
  const usagePercentage = (currentSize / quota) * 100;

  return {
    healthy: usagePercentage < 90,
    currentSize,
    quota,
    usagePercentage,
    message:
      usagePercentage > 90
        ? `Storage usage is high (${usagePercentage.toFixed(
            1
          )}%). Consider clearing some data.`
        : `Storage usage is normal (${usagePercentage.toFixed(1)}%)`,
  };
};

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
      icon: "spotter",
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
  },
  userConfig: {
    users: [],
    currentUserId: undefined,
  },
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
    console.log(`Loaded ${key} from localStorage:`, parsed);

    // Special logging for custom menus
    if (key === STORAGE_KEYS.CUSTOM_MENUS) {
      console.log(`[loadFromStorage] Custom menus loaded:`, parsed);
      console.log(
        `[loadFromStorage] Custom menus count:`,
        Array.isArray(parsed) ? parsed.length : "not an array"
      );
    }

    return parsed;
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error);
    console.log(`Using default value for ${key}:`, defaultValue);
    return defaultValue;
  }
};

const saveToStorage = (
  key: string,
  value: unknown,
  onError?: (message: string) => void
): void => {
  if (typeof window === "undefined") return;

  console.log(`[saveToStorage] Saving ${key}:`, value);
  // console.trace(`[saveToStorage] Call stack for ${key}:`);

  try {
    const serializedValue = JSON.stringify(value);

    // Check if we have enough storage space
    const currentSize = getStorageSize();
    const estimatedSize = estimateStorageSize(key, serializedValue);
    const quota = getStorageQuota();

    console.log(`[saveToStorage] Current storage size: ${currentSize} bytes`);
    console.log(`[saveToStorage] Estimated new size: ${estimatedSize} bytes`);
    console.log(`[saveToStorage] Available quota: ${quota} bytes`);

    // If we're approaching the quota, try to clean up old data
    // But don't clean up if we're already in a cleanup operation
    if (currentSize + estimatedSize > quota * 0.9) {
      console.warn(
        `[saveToStorage] Storage quota nearly exceeded, but skipping cleanup to avoid data loss`
      );
      // Don't call cleanupOldStorage() here as it would clear the data being saved
    }

    localStorage.setItem(key, serializedValue);
    console.log(
      `[saveToStorage] Successfully saved ${key} to localStorage:`,
      value
    );
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage:`, error);

    // If it's a quota exceeded error, log the error but don't attempt cleanup
    // as it would clear the data being saved
    if (error instanceof Error && error.name === "QuotaExceededError") {
      console.warn(
        `[saveToStorage] Quota exceeded for ${key}, but skipping cleanup to avoid data loss`
      );
      console.warn(
        `[saveToStorage] Consider manually clearing some data or using a smaller configuration`
      );
    }

    onError?.(
      `Failed to save ${key}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Load all configurations from localStorage
export const loadAllConfigurations = () => {
  const standardMenus = loadFromStorage(
    STORAGE_KEYS.STANDARD_MENUS,
    DEFAULT_CONFIG.standardMenus
  ) as StandardMenu[];
  const customMenus = loadFromStorage(
    STORAGE_KEYS.CUSTOM_MENUS,
    DEFAULT_CONFIG.customMenus
  ) as CustomMenu[];

  console.log(`[loadAllConfigurations] Loaded custom menus:`, customMenus);
  console.log(
    `[loadAllConfigurations] Custom menus count:`,
    customMenus.length
  );
  const menuOrder = loadFromStorage(
    STORAGE_KEYS.MENU_ORDER,
    DEFAULT_CONFIG.menuOrder
  ) as string[];
  const homePageConfig = loadFromStorage(
    STORAGE_KEYS.HOME_PAGE_CONFIG,
    DEFAULT_CONFIG.homePageConfig
  ) as HomePageConfig;
  const appConfig = loadFromStorage(
    STORAGE_KEYS.APP_CONFIG,
    DEFAULT_CONFIG.appConfig
  ) as AppConfig;
  const fullAppConfig = loadFromStorage(
    STORAGE_KEYS.FULL_APP_CONFIG,
    DEFAULT_CONFIG.fullAppConfig
  ) as FullAppConfig;
  const stylingConfig = loadFromStorage(
    STORAGE_KEYS.STYLING_CONFIG,
    DEFAULT_CONFIG.stylingConfig
  ) as StylingConfig;
  const userConfig = loadFromStorage(
    STORAGE_KEYS.USER_CONFIG,
    DEFAULT_CONFIG.userConfig
  ) as UserConfig;

  return {
    standardMenus,
    customMenus,
    menuOrder,
    homePageConfig,
    appConfig,
    fullAppConfig,
    stylingConfig,
    userConfig,
  };
};

// Save individual configuration components
export const saveStandardMenus = (
  standardMenus: StandardMenu[],
  onError?: (message: string) => void
) => {
  saveToStorage(STORAGE_KEYS.STANDARD_MENUS, standardMenus, onError);
};

export const saveCustomMenus = (
  customMenus: CustomMenu[],
  onError?: (message: string) => void
) => {
  console.log(`[saveCustomMenus] Saving custom menus:`, customMenus);
  console.log(`[saveCustomMenus] Custom menus count:`, customMenus.length);
  console.log(`[saveCustomMenus] Storage key:`, STORAGE_KEYS.CUSTOM_MENUS);
  saveToStorage(STORAGE_KEYS.CUSTOM_MENUS, customMenus, onError);
  console.log(`[saveCustomMenus] Save operation completed`);
};

export const saveMenuOrder = (
  menuOrder: string[],
  onError?: (message: string) => void
) => {
  saveToStorage(STORAGE_KEYS.MENU_ORDER, menuOrder, onError);
};

export const saveHomePageConfig = (
  homePageConfig: HomePageConfig,
  onError?: (message: string) => void
) => {
  saveToStorage(STORAGE_KEYS.HOME_PAGE_CONFIG, homePageConfig, onError);
};

export const saveAppConfig = (
  appConfig: AppConfig,
  onError?: (message: string) => void
) => {
  console.log(`[saveAppConfig] Saving app config:`, appConfig);
  console.trace(`[saveAppConfig] Call stack for ${STORAGE_KEYS.APP_CONFIG}:`);
  saveToStorage(STORAGE_KEYS.APP_CONFIG, appConfig, onError);
};

export const saveFullAppConfig = (
  fullAppConfig: FullAppConfig,
  onError?: (message: string) => void
) => {
  saveToStorage(STORAGE_KEYS.FULL_APP_CONFIG, fullAppConfig, onError);
};

export const saveStylingConfig = (
  stylingConfig: StylingConfig,
  onError?: (message: string) => void
) => {
  saveToStorage(STORAGE_KEYS.STYLING_CONFIG, stylingConfig, onError);
};

export const saveUserConfig = (
  userConfig: UserConfig,
  onError?: (message: string) => void
) => {
  saveToStorage(STORAGE_KEYS.USER_CONFIG, userConfig, onError);
};

// Clear all configurations
export const clearAllConfigurations = () => {
  if (typeof window === "undefined") return;

  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    console.log("Cleared all localStorage configurations");

    // Reload default configurations after clearing
    const defaultConfig = loadAllConfigurations();
    console.log("Reloaded default configurations after clearing");

    return {
      success: true,
      message: "All configurations cleared and defaults restored",
    };
  } catch (error) {
    console.error("Failed to clear localStorage:", error);
    return {
      success: false,
      message: `Failed to clear configurations: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};

// Clear storage and reload defaults with better error handling
export const clearStorageAndReloadDefaults = (): {
  success: boolean;
  message: string;
} => {
  if (typeof window === "undefined") {
    return {
      success: false,
      message: "Storage not available in server environment",
    };
  }

  try {
    // Clear all our app's storage
    cleanupOldStorage();

    // Force reload of default configurations
    const defaultConfig = loadAllConfigurations();

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
  updateAppConfig: (config: AppConfig, bypassClusterWarning?: boolean) => void;
  updateFullAppConfig: (config: FullAppConfig) => void;
  updateStylingConfig: (config: StylingConfig) => void;
  updateUserConfig: (config: UserConfig) => void;
  setMenuOrder?: (order: string[]) => void;
}

// Apply configuration to the app state
export const applyConfiguration = (
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

  // Apply app config
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
  config.customMenus.forEach((menu, index) => {
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
  });
  console.log("Finished applying custom menus");

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
