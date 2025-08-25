"use client";

import React, {
  useState,
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
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
  HomePageConfig,
  AppConfig,
  FullAppConfig,
  StandardMenu,
} from "../types/thoughtspot";
import { setThoughtSpotBaseUrl } from "../services/thoughtspotApi";
import {
  loadAllConfigurations,
  saveStandardMenus,
  saveCustomMenus,
  saveMenuOrder,
  saveHomePageConfig,
  saveAppConfig,
  saveFullAppConfig,
  saveStylingConfig,
  saveUserConfig,
  clearAllConfigurations as clearAllConfigurationsService,
  exportConfiguration as exportConfigurationService,
  checkStorageHealth,
  clearStorageAndReloadDefaults,
} from "../services/configurationService";

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

interface ConfigurationSource {
  type: "file" | "github";
  data: File | string;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

// Default configuration values
const DEFAULT_CONFIG = {
  standardMenus: [
    {
      id: "home",
      icon: "home",
      name: "Home",
      enabled: true,
      homePageType: "html" as const,
      homePageValue:
        "<div style='padding: 20px; text-align: center;'><h1>Welcome to TSE Demo Builder</h1><p>Configure your home page content in the settings.</p></div>",
    },
    {
      id: "favorites",
      icon: "favorites",
      name: "Favorites",
      enabled: true,
    },
    {
      id: "my-reports",
      icon: "my-reports",
      name: "My Reports",
      enabled: true,
    },
    {
      id: "spotter",
      icon: "spotter-custom.svg",
      name: "Spotter",
      enabled: true,
      spotterModelId: "",
      spotterSearchQuery: "",
    },
    {
      id: "search",
      icon: "search",
      name: "Search",
      enabled: true,
      searchDataSource: "",
      searchTokenString: "",
      runSearch: false,
    },
    {
      id: "full-app",
      icon: "full-app",
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
    showFooter: true,
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

// Migration function to convert emoji icons and legacy file paths to Material Icon names
const migrateStandardMenus = (menus: StandardMenu[]): StandardMenu[] => {
  const emojiToMaterialMap: Record<string, string> = {
    "🏠": "home",
    "⭐": "favorites",
    "📊": "my-reports",
    "🔍": "spotter",
    "🔎": "search",
    "🌐": "full-app",
  };

  const legacyPathToMaterialMap: Record<string, string> = {
    "/icons/home.png": "home",
    "/icons/favorites.png": "favorites",
    "/icons/my-reports.png": "my-reports",
    "/icons/spotter.png": "spotter",
    "/icons/search.png": "search",
    "/icons/full-app.png": "full-app",
  };

  return menus.map((menu) => {
    // Handle emoji icons
    if (emojiToMaterialMap[menu.icon]) {
      return { ...menu, icon: emojiToMaterialMap[menu.icon] };
    }
    // Handle legacy file paths - only convert if they match the standard icons
    if (legacyPathToMaterialMap[menu.icon]) {
      return { ...menu, icon: legacyPathToMaterialMap[menu.icon] };
    }
    // Keep image paths as-is (don't migrate them to Material icons)
    if (menu.icon.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
      return menu; // Keep the image path unchanged
    }
    return menu;
  });
};

// Validation function for custom menus
const validateCustomMenu = (menu: unknown): menu is CustomMenu => {
  if (!menu || typeof menu !== "object") return false;
  const menuObj = menu as Record<string, unknown>;

  // Required fields
  if (!menuObj.id || typeof menuObj.id !== "string") return false;
  if (!menuObj.name || typeof menuObj.name !== "string") return false;
  if (typeof menuObj.enabled !== "boolean") return false;
  if (!menuObj.contentSelection || typeof menuObj.contentSelection !== "object")
    return false;

  // Optional fields with defaults
  if (
    menuObj.description !== undefined &&
    typeof menuObj.description !== "string"
  )
    return false;
  if (menuObj.icon !== undefined && typeof menuObj.icon !== "string")
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

  // More aggressive cleanup for large objects
  if (embeddedContent?.strings && typeof embeddedContent.strings === "object") {
    const strings = embeddedContent.strings as Record<string, string>;
    const cleanedStrings: Record<string, string> = {};

    // Only keep non-empty strings
    Object.keys(strings).forEach((key) => {
      if (strings[key] && strings[key].trim() !== "") {
        cleanedStrings[key] = strings[key];
      }
    });

    if (Object.keys(cleanedStrings).length === 0) {
      delete embeddedContent.strings;
    } else {
      embeddedContent.strings = cleanedStrings;
    }
  }

  if (
    embeddedContent?.stringIDs &&
    typeof embeddedContent.stringIDs === "object"
  ) {
    const stringIDs = embeddedContent.stringIDs as Record<string, string>;
    const cleanedStringIDs: Record<string, string> = {};

    // Only keep non-empty string IDs
    Object.keys(stringIDs).forEach((key) => {
      if (stringIDs[key] && stringIDs[key].trim() !== "") {
        cleanedStringIDs[key] = stringIDs[key];
      }
    });

    if (Object.keys(cleanedStringIDs).length === 0) {
      delete embeddedContent.stringIDs;
    } else {
      embeddedContent.stringIDs = cleanedStringIDs;
    }
  }

  return cleaned;
};

// File import functionality moved to SettingsModal
// This function is no longer needed in Layout

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

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  // Suppress third-party console errors (like Mixpanel)
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      const message = args.join(" ");

      // Suppress Mixpanel-related errors
      if (
        message.includes("Mixpanel") ||
        message.includes("mixpanel") ||
        message.includes("token not found in session info")
      ) {
        return; // Don't log these errors
      }

      // Suppress other common third-party errors that we don't care about
      if (
        message.includes("Failed to load resource") ||
        message.includes("net::ERR_") ||
        message.includes("favicon.ico")
      ) {
        return; // Don't log these errors
      }

      // Log all other errors normally
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      const message = args.join(" ");

      // Suppress Mixpanel-related warnings
      if (
        message.includes("Mixpanel") ||
        message.includes("mixpanel") ||
        message.includes("token not found in session info")
      ) {
        return; // Don't log these warnings
      }

      // Log all other warnings normally
      originalWarn.apply(console, args);
    };

    // Cleanup function to restore original console methods
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<
    string | undefined
  >();
  const [settingsInitialSubTab, setSettingsInitialSubTab] = useState<
    string | undefined
  >();
  const [storageError, setStorageError] = useState<string | null>(null);

  // Debounced save mechanism for standard menus
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingMenusRef = useRef<StandardMenu[] | null>(null);

  const debouncedSaveStandardMenus = useCallback((menus: StandardMenu[]) => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Store the latest menus to save
    pendingMenusRef.current = menus;

    // Set a new timeout to save after a short delay
    saveTimeoutRef.current = setTimeout(() => {
      if (pendingMenusRef.current) {
        console.log(
          "[Layout] Debounced save of standard menus:",
          pendingMenusRef.current.length
        );
        saveStandardMenus(pendingMenusRef.current);
        pendingMenusRef.current = null;
      }
    }, 50); // 50ms delay to batch rapid updates
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Check storage health periodically
  useEffect(() => {
    const checkStorage = () => {
      const health = checkStorageHealth();
      if (!health.healthy && isSettingsOpen) {
        // Only show storage warnings when settings modal is open
        setStorageWarning(health.message);
      } else {
        setStorageWarning(null);
      }
    };

    // Check immediately
    checkStorage();

    // Check every 30 seconds
    const interval = setInterval(checkStorage, 30000);

    return () => clearInterval(interval);
  }, [isSettingsOpen]);

  const [isBypassMode, setIsBypassMode] = useState(false);
  const [previousThoughtspotUrl, setPreviousThoughtspotUrl] =
    useState<string>("");
  const [showClusterChangeWarning, setShowClusterChangeWarning] =
    useState(false);
  const [pendingClusterUrl, setPendingClusterUrl] = useState<string>("");
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  // Load initial state from configurationService
  const [standardMenus, setStandardMenus] = useState<StandardMenu[]>(() => {
    const configs = loadAllConfigurations();
    const loadedMenus = configs.standardMenus;

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
    const configs = loadAllConfigurations();
    const loadedMenus = configs.customMenus;

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

      // Ensure all required fields have default values
      const normalizedMenu: CustomMenu = {
        id: menu.id,
        name: menu.name,
        description: menu.description || "",
        icon: menu.icon || "📋",
        enabled: menu.enabled,
        contentSelection: menu.contentSelection,
      };

      if (!seenIds.has(normalizedMenu.id)) {
        seenIds.add(normalizedMenu.id);
        uniqueMenus.push(normalizedMenu);
      } else {
        console.log("Removing duplicate custom menu:", normalizedMenu.id);
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
    const configs = loadAllConfigurations();
    const loadedOrder = configs.menuOrder;

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
  const [homePageConfig, setHomePageConfig] = useState<HomePageConfig>(() => {
    const configs = loadAllConfigurations();
    return configs.homePageConfig;
  });

  // App configuration state
  const [appConfig, setAppConfig] = useState<AppConfig>(() => {
    const configs = loadAllConfigurations();
    return configs.appConfig;
  });

  // Set ThoughtSpot base URL when app config changes
  useEffect(() => {
    if (appConfig.thoughtspotUrl) {
      setThoughtSpotBaseUrl(appConfig.thoughtspotUrl);
    }
  }, [appConfig.thoughtspotUrl]);

  // Full app configuration state
  const [fullAppConfig, setFullAppConfig] = useState<FullAppConfig>(() => {
    const configs = loadAllConfigurations();
    return configs.fullAppConfig;
  });

  // Configuration version state to force re-initialization when config changes
  const [configVersion, setConfigVersion] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tse-demo-builder-config-version");
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  });

  // Styling configuration state
  const [stylingConfig, setStylingConfig] = useState<StylingConfig>(() => {
    const configs = loadAllConfigurations();
    return configs.stylingConfig;
  });

  // User configuration state
  const [userConfig, setUserConfig] = useState<UserConfig>(() => {
    const configs = loadAllConfigurations();
    return configs.userConfig;
  });

  // Save to localStorage whenever state changes using configurationService
  useEffect(() => {
    saveStandardMenus(standardMenus, (errorMessage) => {
      // Only show storage errors when settings modal is open
      if (isSettingsOpen) {
        setStorageError(errorMessage);
        // Clear error after 10 seconds
        setTimeout(() => setStorageError(null), 10000);
      }
    });
  }, [standardMenus, isSettingsOpen]);

  useEffect(() => {
    console.log(
      `[Layout] Custom menus changed, saving to localStorage:`,
      customMenus
    );
    console.log(`[Layout] Custom menus count:`, customMenus.length);
    saveCustomMenus(customMenus);
  }, [customMenus]);

  useEffect(() => {
    saveMenuOrder(menuOrder);
  }, [menuOrder]);

  useEffect(() => {
    saveHomePageConfig(homePageConfig);
  }, [homePageConfig]);

  useEffect(() => {
    console.log(`[Layout] Auto-saving app config to localStorage:`, appConfig);
    saveAppConfig(appConfig);
  }, [appConfig]);

  useEffect(() => {
    saveFullAppConfig(fullAppConfig);
  }, [fullAppConfig]);

  // Save styling config immediately to ensure GitHub imports work properly
  useEffect(() => {
    saveStylingConfig(stylingConfig, (errorMessage) => {
      // Only show storage errors when settings modal is open
      if (isSettingsOpen) {
        setStorageError(errorMessage);
        // Clear error after 10 seconds
        setTimeout(() => setStorageError(null), 10000);
      }
    });
  }, [stylingConfig, isSettingsOpen]);

  useEffect(() => {
    saveUserConfig(userConfig);
  }, [userConfig]);

  // Debug effect to log current state
  useEffect(() => {
    console.log("=== Current Configuration State ===");
    console.log("Timestamp:", new Date().toISOString());
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

  // Debug effect specifically for appConfig changes
  useEffect(() => {
    console.log("=== App Config Changed ===");
    console.log("New app config:", appConfig);
    console.log("Timestamp:", new Date().toISOString());
    console.log("==========================");
  }, [appConfig]);

  // Update document title when application name changes
  useEffect(() => {
    const title = appConfig.applicationName || "TSE Demo Builder";
    document.title = title;
  }, [appConfig.applicationName]);

  // Utility function to convert icon identifiers to image paths
  const getIconImagePath = (icon: string): string => {
    // If it's already a valid image path or URL, return as is
    if (
      icon.startsWith("http") ||
      icon.startsWith("data:") ||
      icon.startsWith("/")
    ) {
      return icon;
    }

    // Map icon identifiers to their corresponding image paths
    const iconPathMap: Record<string, string> = {
      home: "/icons/home.png",
      favorites: "/icons/favorites.png",
      "my-reports": "/icons/my-reports.png",
      spotter: "/icons/spotter.png",
      search: "/icons/search.png",
      "full-app": "/icons/full-app.png",
    };

    // Return the mapped path or fallback to default
    return iconPathMap[icon] || "/ts.png";
  };

  // Update favicon when app config changes
  useEffect(() => {
    const favicon = getIconImagePath(appConfig.favicon || "/ts.png");
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
    console.log(`[Layout] ThoughtSpot initialization triggered by:`, {
      thoughtspotUrl: appConfig.thoughtspotUrl,
      earlyAccessFlags: appConfig.earlyAccessFlags,
      stylingConfig: stylingConfig,
      configVersion: configVersion,
    });
    console.log(
      `[Layout] Current styling config variables:`,
      stylingConfig.embeddedContent?.customCSS?.variables
    );

    const initializeThoughtSpot = async () => {
      if (!appConfig.thoughtspotUrl) {
        return;
      }

      try {
        const { init, AuthType } = await import(
          "@thoughtspot/visual-embed-sdk"
        );

        // Clear any existing ThoughtSpot state when cluster changes
        if (
          previousThoughtspotUrl &&
          previousThoughtspotUrl !== appConfig.thoughtspotUrl
        ) {
          console.log(
            `[Layout] Cluster changed from ${previousThoughtspotUrl} to ${appConfig.thoughtspotUrl}, clearing ThoughtSpot state`
          );

          // Clear any cached data or state that might be cluster-specific
          if (typeof window !== "undefined") {
            // Clear any ThoughtSpot-related localStorage items
            const keysToRemove = Object.keys(localStorage).filter(
              (key) =>
                key.includes("thoughtspot") ||
                key.includes("ts-") ||
                key.includes("ts_")
            );
            keysToRemove.forEach((key) => {
              console.log(`[Layout] Clearing localStorage key: ${key}`);
              localStorage.removeItem(key);
            });

            // Clear any sessionStorage items
            const sessionKeysToRemove = Object.keys(sessionStorage).filter(
              (key) =>
                key.includes("thoughtspot") ||
                key.includes("ts-") ||
                key.includes("ts_")
            );
            sessionKeysToRemove.forEach((key) => {
              console.log(`[Layout] Clearing sessionStorage key: ${key}`);
              sessionStorage.removeItem(key);
            });
          }
        }

        // Update the previous URL for next comparison
        setPreviousThoughtspotUrl(appConfig.thoughtspotUrl);

        // Parse early access flags from configuration
        const earlyAccessFlags = parseEarlyAccessFlags(
          appConfig.earlyAccessFlags
        );

        // Get current user's locale
        const currentUser = userConfig.users.find(
          (u) => u.id === userConfig.currentUserId
        );
        const userLocale = currentUser?.locale || "en";

        const initConfig: ThoughtSpotInitConfig = {
          thoughtSpotHost: appConfig.thoughtspotUrl,
          authType: AuthType.None,
          locale: userLocale,
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
            width: "100% !important",
            "max-width": "none !important",
            overflow: "hidden !important",
          },
          "[data-testid='tsEmbed']": {
            width: "100% !important",
            "max-width": "none !important",
            overflow: "hidden !important",
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
    stylingConfig,
    userConfig,
    previousThoughtspotUrl,
    configVersion,
  ]); // Watch configVersion to ensure GitHub imports trigger re-initialization

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

  const handleBypassModeChange = (isBypass: boolean) => {
    setIsBypassMode(isBypass);
  };

  const handleClusterChangeConfirm = () => {
    console.log(`[Layout] Confirming cluster change to: ${pendingClusterUrl}`);

    // Clear all configurations to start fresh with new cluster
    clearAllConfigurations();

    // Update the app config with the new URL
    setAppConfig((prev) => ({
      ...prev,
      thoughtspotUrl: pendingClusterUrl,
    }));

    // Reset bypass mode if active
    setIsBypassMode(false);

    // Close the warning dialog
    setShowClusterChangeWarning(false);
    setPendingClusterUrl("");

    // Force page reload to clear any cached ThoughtSpot state
    window.location.reload();
  };

  const handleClusterChangeCancel = () => {
    console.log(`[Layout] Cancelling cluster change`);
    setShowClusterChangeWarning(false);
    setPendingClusterUrl("");
  };

  const handleConfigureSettings = () => {
    openSettingsWithTab("configuration");
  };

  const updateStandardMenu = (
    id: string,
    field: string,
    value: string | boolean,
    skipFaviconUpdate: boolean = false
  ) => {
    console.log(
      `[Layout] updateStandardMenu called: ${id}.${field} = ${value}`
    );
    setStandardMenus((prev) => {
      const updated = prev.map((menu) =>
        menu.id === id ? { ...menu, [field]: value } : menu
      );

      // Use debounced save to batch rapid updates
      debouncedSaveStandardMenus(updated);

      return updated;
    });

    // Update menu order if the enabled field is being changed
    if (field === "enabled") {
      setMenuOrder((prev) => {
        const isInOrder = prev.includes(id);
        const isEnabled = value as boolean;

        if (isEnabled && !isInOrder) {
          // Add to menu order if enabled and not already there
          const updated = [...prev, id];
          saveMenuOrder(updated);
          return updated;
        } else if (!isEnabled && isInOrder) {
          // Remove from menu order if disabled
          const updated = prev.filter((menuId) => menuId !== id);
          saveMenuOrder(updated);
          return updated;
        }

        return prev;
      });
    }

    // Update favicon and TopBar logo when home menu icon changes
    // Skip this if we're already handling it in config import
    if (id === "home" && field === "icon" && !skipFaviconUpdate) {
      // Get the current app config and update it with the new icon
      const currentAppConfig = appConfig;
      const updatedAppConfig = {
        ...currentAppConfig,
        favicon: value as string,
        logo: value as string,
      };

      // Call updateAppConfig to ensure proper state management and version incrementing
      updateAppConfig(updatedAppConfig, true); // bypassClusterWarning = true to avoid cluster change dialog

      // Also update the TopBar logo in styling config - use current state
      setStylingConfig((prev) => {
        const updated = {
          ...prev,
          application: {
            ...prev.application,
            topBar: {
              ...prev.application.topBar,
              logoUrl: value as string,
            },
          },
        };
        saveStylingConfig(updated);
        return updated;
      });
    }
  };

  const updateHomePageConfig = (config: HomePageConfig) => {
    console.log(`[Layout] updateHomePageConfig called:`, config);
    setHomePageConfig(config);

    // Save to localStorage immediately when loading from configuration
    console.log(
      `[Layout] Saving home page config to localStorage immediately:`,
      config
    );
    saveHomePageConfig(config);
  };

  const updateAppConfig = (config: AppConfig, bypassClusterWarning = false) => {
    // debugger; // This will pause execution if dev tools are open
    console.log(`[Layout] updateAppConfig called:`, config);
    console.log(`[Layout] bypassClusterWarning:`, bypassClusterWarning);
    console.log(`[Layout] Current appConfig before update:`, appConfig);
    console.trace("[Layout] updateAppConfig call stack:");

    // Check if ThoughtSpot URL is changing
    console.log(`[Layout] Checking ThoughtSpot URL change:`);
    console.log(`[Layout] New URL: ${config.thoughtspotUrl}`);
    console.log(`[Layout] Current URL: ${appConfig.thoughtspotUrl}`);
    console.log(
      `[Layout] URLs are different: ${
        config.thoughtspotUrl !== appConfig.thoughtspotUrl
      }`
    );
    console.log(`[Layout] Current URL exists: ${!!appConfig.thoughtspotUrl}`);
    console.log(`[Layout] bypassClusterWarning: ${bypassClusterWarning}`);

    if (
      config.thoughtspotUrl !== appConfig.thoughtspotUrl &&
      appConfig.thoughtspotUrl &&
      !bypassClusterWarning
    ) {
      console.log(
        `[Layout] ThoughtSpot URL changing from ${appConfig.thoughtspotUrl} to ${config.thoughtspotUrl}`
      );

      // Show warning dialog for cluster change
      setPendingClusterUrl(config.thoughtspotUrl);
      setShowClusterChangeWarning(true);
      console.log(`[Layout] Cluster change warning shown, returning early`);
      return; // Don't update yet, wait for user confirmation
    }

    console.log(`[Layout] Setting app config to:`, config);
    setAppConfig(config);

    // Increment config version to force ThoughtSpot re-initialization when app config changes
    const newVersion = configVersion + 1;
    setConfigVersion(newVersion);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "tse-demo-builder-config-version",
        newVersion.toString()
      );
    }
    console.log(
      `[Layout] Config version incremented to ${newVersion} to force ThoughtSpot re-initialization`
    );

    // Save to localStorage immediately when bypassing cluster warning (loading from config)
    console.log(
      `[Layout] Checking if should save to localStorage: bypassClusterWarning = ${bypassClusterWarning}`
    );
    if (bypassClusterWarning) {
      console.log(
        `[Layout] Saving app config to localStorage immediately:`,
        config
      );
      console.trace("[Layout] About to call saveAppConfig:");

      // Check storage health before saving
      const storageHealth = checkStorageHealth();
      if (!storageHealth.healthy) {
        console.warn(
          `[Layout] Storage health check failed: ${storageHealth.message}`
        );
        // Try to clear storage and retry
        const clearResult = clearStorageAndReloadDefaults();
        if (clearResult.success) {
          console.log(`[Layout] Storage cleared successfully, retrying save`);
        } else {
          console.error(
            `[Layout] Failed to clear storage: ${clearResult.message}`
          );
        }
      }

      saveAppConfig(config, (errorMessage) => {
        console.error(`[Layout] Failed to save app config: ${errorMessage}`);
        // Show user-friendly error message
        alert(
          `Failed to save configuration: ${errorMessage}. Please try clearing your browser storage or contact support.`
        );
      });
      console.log(`[Layout] saveAppConfig call completed`);
    } else {
      console.log(
        `[Layout] NOT saving to localStorage - bypassClusterWarning is false`
      );
    }
  };

  const updateFullAppConfig = (config: FullAppConfig) => {
    console.log(`[Layout] updateFullAppConfig called:`, config);
    setFullAppConfig(config);

    // Save to localStorage immediately when loading from configuration
    console.log(
      `[Layout] Saving full app config to localStorage immediately:`,
      config
    );
    saveFullAppConfig(config);
  };

  const updateStylingConfig = (config: StylingConfig) => {
    console.log(`[Layout] updateStylingConfig called:`, config);
    console.log(`[Layout] Previous styling config:`, stylingConfig);
    console.log(
      `[Layout] New styling config variables:`,
      config.embeddedContent?.customCSS?.variables
    );
    setStylingConfig(config);

    // Increment config version to force ThoughtSpot re-initialization
    const newVersion = configVersion + 1;
    setConfigVersion(newVersion);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "tse-demo-builder-config-version",
        newVersion.toString()
      );
    }
    console.log(
      `[Layout] Config version incremented to ${newVersion} to force ThoughtSpot re-initialization`
    );

    console.log(
      `[Layout] Styling config updated, ThoughtSpot should re-initialize`
    );

    // Save to localStorage immediately when loading from configuration
    console.log(
      `[Layout] Saving styling config to localStorage immediately:`,
      config
    );
    saveStylingConfig(config);
  };

  const updateUserConfig = (config: UserConfig) => {
    console.log(`[Layout] updateUserConfig called:`, config);
    setUserConfig(config);

    // Save to localStorage immediately when loading from configuration
    console.log(
      `[Layout] Saving user config to localStorage immediately:`,
      config
    );
    saveUserConfig(config);
  };

  const addCustomMenu = (menu: CustomMenu) => {
    console.log(
      `[Layout] addCustomMenu called with: ${menu.name} id: ${menu.id}`
    );
    console.log(`[Layout] Current custom menus count: ${customMenus.length}`);
    console.log(`[Layout] Menu object:`, menu);

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
      console.log(`[Layout] Updated custom menus:`, updated);
      console.log(`[Layout] About to save custom menus to localStorage`);
      saveCustomMenus(updated);
      console.log(`[Layout] Custom menus saved to localStorage`);
      return updated;
    });

    // Add to menu order if not already present
    setMenuOrder((prev) => {
      if (prev.includes(menu.id)) {
        console.log(`[Layout] Menu ID already in order, skipping: ${menu.id}`);
        return prev;
      }
      console.log(`[Layout] Adding menu ID to order: ${menu.id}`);
      const updated = [...prev, menu.id];
      saveMenuOrder(updated);
      return updated;
    });
  };

  const updateCustomMenu = (id: string, menu: CustomMenu) => {
    setCustomMenus((prev) => {
      const updated = prev.map((m) => (m.id === id ? menu : m));
      saveCustomMenus(updated);
      return updated;
    });

    // Update menu order based on enabled status
    setMenuOrder((prev) => {
      const isInOrder = prev.includes(id);
      const isEnabled = menu.enabled;

      if (isEnabled && !isInOrder) {
        // Add to menu order if enabled and not already there
        const updated = [...prev, id];
        saveMenuOrder(updated);
        return updated;
      } else if (!isEnabled && isInOrder) {
        // Remove from menu order if disabled
        const updated = prev.filter((menuId) => menuId !== id);
        saveMenuOrder(updated);
        return updated;
      }

      return prev;
    });
  };

  const deleteCustomMenu = (id: string) => {
    console.log("deleteCustomMenu called with id:", id);

    setCustomMenus((prev) => {
      const filtered = prev.filter((m) => m.id !== id);
      console.log("Custom menus after deletion:", filtered.length, "remaining");
      saveCustomMenus(filtered);
      return filtered;
    });

    // Remove from menu order
    setMenuOrder((prev) => {
      const filtered = prev.filter((menuId) => menuId !== id);
      console.log("Menu order after deletion:", filtered);
      saveMenuOrder(filtered);
      return filtered;
    });
  };

  const clearCustomMenus = () => {
    console.log("clearCustomMenus called");
    console.log("Current custom menus before clearing:", customMenus);
    console.log("Current menu order before clearing:", menuOrder);

    setCustomMenus([]);
    saveCustomMenus([]);

    // Also remove custom menu IDs from menu order
    setMenuOrder((prev) => {
      const filtered = prev.filter((menuId) => {
        // Keep only standard menu IDs
        const standardMenuIds = standardMenus.map((menu) => menu.id);
        const shouldKeep = standardMenuIds.includes(menuId);
        if (!shouldKeep) {
          console.log(`Removing custom menu ID from order: ${menuId}`);
        }
        return shouldKeep;
      });
      console.log("Menu order after clearing custom menus:", filtered);
      saveMenuOrder(filtered);
      return filtered;
    });

    console.log("clearCustomMenus completed");
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

    // Clear localStorage completely using service
    clearAllConfigurationsService();

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

    console.log("Adding test custom menu directly to state...");
    setCustomMenus([testCustomMenu]);

    console.log("Updating menu order...");
    setMenuOrder(["home", "test-custom-menu", "favorites"]);

    console.log("Test data added to state");
  };

  // Test function commented out due to type conflicts
  // const testGitHubConfig = async () => {
  //   console.log("Testing GitHub configuration loading...");
  //   // Implementation removed due to type conflicts
  // };

  const handleExportConfiguration = (customName?: string) => {
    exportConfigurationService(
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

  // File import functionality moved to SettingsModal
  // This function is no longer needed in Layout

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
  };

  return (
    <AppContext.Provider value={contextValue}>
      <SessionChecker
        thoughtspotUrl={appConfig.thoughtspotUrl}
        onSessionStatusChange={handleSessionStatusChange}
        onConfigureSettings={handleConfigureSettings}
        onBypassModeChange={handleBypassModeChange}
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

          {/* Bypass Mode Warning Banner */}
          {isBypassMode && (
            <div
              style={{
                backgroundColor: "#fef3c7",
                borderBottom: "1px solid #f59e0b",
                padding: "12px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span style={{ fontSize: "16px" }}>⚠️</span>
                <span
                  style={{
                    color: "#92400e",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Configuration Mode: You are accessing the app without
                  authentication. ThoughtSpot features will not work until you
                  log in to your cluster.
                </span>
              </div>
              <button
                onClick={() => {
                  setIsBypassMode(false);
                  window.location.reload();
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
                Return to Login
              </button>
            </div>
          )}

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
                overflowX: "hidden",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ flex: 1 }}>{children}</div>
              {(appConfig.showFooter ?? true) && (
                <Footer
                  backgroundColor={
                    stylingConfig.application.footer.backgroundColor
                  }
                  foregroundColor={
                    stylingConfig.application.footer.foregroundColor
                  }
                />
              )}
            </div>
          </div>

          {/* Settings Modal */}
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => {
              setIsSettingsOpen(false);
              // Clear any storage errors when closing the modal
              setStorageError(null);
            }}
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
            clearCustomMenus={clearCustomMenus}
            stylingConfig={stylingConfig}
            updateStylingConfig={updateStylingConfig}
            userConfig={userConfig}
            updateUserConfig={updateUserConfig}
            setMenuOrder={setMenuOrder}
            clearAllConfigurations={clearAllConfigurations}
            exportConfiguration={handleExportConfiguration}
            storageError={storageError}
            setStorageError={setStorageError}
            storageWarning={storageWarning}
            setStorageWarning={setStorageWarning}
            initialTab={settingsInitialTab}
            initialSubTab={settingsInitialSubTab}
            onTabChange={(tab, subTab) => {
              setSettingsInitialTab(tab);
              if (subTab) {
                setSettingsInitialSubTab(subTab);
              }
            }}
            isBypassMode={isBypassMode}
          />

          {/* Cluster Change Warning Dialog */}
          {showClusterChangeWarning && (
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
              }}
            >
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "32px",
                  maxWidth: "500px",
                  width: "90%",
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                    ⚠️
                  </div>
                  <h2
                    style={{
                      margin: "0 0 16px 0",
                      fontSize: "24px",
                      fontWeight: "600",
                      color: "#1f2937",
                    }}
                  >
                    Change ThoughtSpot Cluster?
                  </h2>
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "16px",
                      color: "#4b5563",
                      lineHeight: "1.5",
                    }}
                  >
                    You&apos;re about to change your ThoughtSpot cluster from:
                  </p>
                  <p
                    style={{
                      margin: "0 0 16px 0",
                      fontSize: "14px",
                      color: "#6b7280",
                      fontFamily: "monospace",
                      backgroundColor: "#f3f4f6",
                      padding: "8px 12px",
                      borderRadius: "4px",
                    }}
                  >
                    {appConfig.thoughtspotUrl}
                  </p>
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "16px",
                      color: "#4b5563",
                      lineHeight: "1.5",
                    }}
                  >
                    to:
                  </p>
                  <p
                    style={{
                      margin: "0 0 24px 0",
                      fontSize: "14px",
                      color: "#6b7280",
                      fontFamily: "monospace",
                      backgroundColor: "#f3f4f6",
                      padding: "8px 12px",
                      borderRadius: "4px",
                    }}
                  >
                    {pendingClusterUrl}
                  </p>
                  <div
                    style={{
                      backgroundColor: "#fef3c7",
                      border: "1px solid #f59e0b",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "24px",
                    }}
                  >
                    <p
                      style={{
                        margin: "0",
                        fontSize: "14px",
                        color: "#92400e",
                        lineHeight: "1.5",
                      }}
                    >
                      <strong>Important:</strong> Changing clusters will clear
                      all your current configurations (styling, menus,
                      customizations) to ensure compatibility with the new
                      cluster. You can import saved configurations after
                      connecting to the new cluster.
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "center",
                  }}
                >
                  <button
                    onClick={handleClusterChangeCancel}
                    style={{
                      padding: "12px 24px",
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
                    onClick={handleClusterChangeConfirm}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: "#dc2626",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Change Cluster & Clear Config
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chat Bubble */}
          <ChatBubble />
        </div>
      </SessionChecker>
    </AppContext.Provider>
  );
}
