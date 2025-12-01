"use client";

import React, {
  useState,
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  startTransition,
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
  saveConfigurationToStorage,
  setIsImportingConfiguration,
  redirectFromCustomMenu,
  DEFAULT_CONFIG,
} from "../services/configurationService";
import LoadingDialog from "./LoadingDialog";
import ConfigurationLoader from "./ConfigurationLoader";
import StylingProvider from "./StylingProvider";
import { getImageFromIndexedDB } from "./ImageUpload";

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
  addCustomMenu: (menu: CustomMenu) => Promise<void>;
  updateCustomMenu: (id: string, menu: CustomMenu) => void;
  deleteCustomMenu: (id: string) => void;
  stylingConfig: StylingConfig;
  updateStylingConfig: (config: StylingConfig) => void;
  userConfig: UserConfig;
  updateUserConfig: (config: UserConfig) => void;
  clearAllConfigurations: () => void;
  openSettingsWithTab: (tab?: string, subTab?: string) => void;
  exportConfiguration: (customName?: string) => Promise<void>;
  lastClusterChangeTime: number;
  configVersion: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
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
    "/icons/spotter-custom.svg": "spotter-custom.svg",
    "/icons/spotter-preview-custom.svg": "spotter-preview-custom.svg",
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
  // Fix hydration issues and suppress third-party console errors (like Mixpanel)
  useEffect(() => {
    // Fix hydration mismatches caused by browser extensions
    const htmlElement = document.documentElement;

    // Remove problematic attributes that cause hydration issues
    const problematicAttributes = [
      "_mindisisolatedcontentloaded",
      "_mindisisolatedcontentloaded_",
      "data-adblockkey",
      "data-adblock",
      "data-ublock-origin",
      "data-ublock-origin_",
    ];

    problematicAttributes.forEach((attr) => {
      if (htmlElement.hasAttribute(attr)) {
        htmlElement.removeAttribute(attr);
      }
    });

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
        message.includes("favicon.ico") ||
        message.includes("Failed to fetch") ||
        message.includes("session/info") ||
        message.includes("401")
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
  const [isLoadingConfiguration, setIsLoadingConfiguration] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(
    "Loading configuration..."
  );
  const [isImportingConfiguration, setIsImportingConfiguration] =
    useState(false);
  const [hasInitialLoadCompleted, setHasInitialLoadCompleted] = useState(false);
  const [isInitialLoadInProgress, setIsInitialLoadInProgress] = useState(true);

  const [previousThoughtspotUrl, setPreviousThoughtspotUrl] =
    useState<string>("");
  const [showClusterChangeWarning, setShowClusterChangeWarning] =
    useState(false);
  const [pendingClusterUrl, setPendingClusterUrl] = useState<string>("");
  const [lastClusterChangeTime, setLastClusterChangeTime] = useState<number>(
    Date.now()
  );

  // Load initial state from configurationService
  const [standardMenus, setStandardMenus] = useState<StandardMenu[]>(() => {
    // Ensure all-content menu is always present
    const initialMenus = [...DEFAULT_CONFIG.standardMenus];
    const allContentMenu = initialMenus.find((m) => m.id === "all-content");
    if (!allContentMenu) {
      console.warn("all-content menu not found in DEFAULT_CONFIG, adding it");
      initialMenus.push({
        id: "all-content",
        icon: "📚",
        name: "All Content",
        enabled: true,
        excludeSystemContent: true,
      });
    }
    return initialMenus;
  });
  const [customMenus, setCustomMenus] = useState<CustomMenu[]>(
    DEFAULT_CONFIG.customMenus
  );
  const [menuOrder, setMenuOrder] = useState<string[]>(
    DEFAULT_CONFIG.menuOrder
  );
  const [homePageConfig, setHomePageConfig] = useState<HomePageConfig>(
    DEFAULT_CONFIG.homePageConfig
  );
  const [appConfig, setAppConfig] = useState<AppConfig>(
    DEFAULT_CONFIG.appConfig
  );
  const [fullAppConfig, setFullAppConfig] = useState<FullAppConfig>(
    DEFAULT_CONFIG.fullAppConfig
  );
  const [stylingConfig, setStylingConfig] = useState<StylingConfig>(
    DEFAULT_CONFIG.stylingConfig
  );
  const [userConfig, setUserConfig] = useState<UserConfig>(() => {
    // Initialize with default users instead of empty array
    const defaultUsers = [
      {
        id: "power-user",
        name: "Power User",
        description:
          "Full access - can access all features including Search and Full App",
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
        },
      },
    ];

    // Try to get the stored currentUserId from localStorage
    let storedCurrentUserId = defaultUsers[0].id;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("tse-demo-builder-config");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.userConfig && parsed.userConfig.currentUserId) {
            // Check if the stored currentUserId exists in our default users
            if (
              defaultUsers.some(
                (user) => user.id === parsed.userConfig.currentUserId
              )
            ) {
              storedCurrentUserId = parsed.userConfig.currentUserId;
            }
          }
        }
      } catch (error) {
        console.warn("Failed to load stored currentUserId:", error);
      }
    }

    return {
      users: defaultUsers,
      currentUserId: storedCurrentUserId,
    };
  });

  // Load configuration asynchronously on mount
  useEffect(() => {
    // Prevent multiple loads
    if (isImportingConfiguration || hasInitialLoadCompleted) {
      return;
    }

    const loadConfiguration = async () => {
      try {
        // Set import flag to prevent auto-save loops during initial load
        setIsImportingConfiguration(true);
        setIsInitialLoadInProgress(true);

        const configs = await loadAllConfigurations();

        // Process all configurations first, then batch state updates
        startTransition(() => {
          // Load standard menus
          const loadedMenus = configs.standardMenus;
          if (Array.isArray(loadedMenus)) {
            const migratedMenus = migrateStandardMenus(loadedMenus);

            // Ensure all-content menu is always present
            const allContentMenu = migratedMenus.find(
              (m) => m.id === "all-content"
            );
            if (!allContentMenu) {
              console.warn(
                "all-content menu not found in loaded menus, adding it"
              );
              migratedMenus.push({
                id: "all-content",
                icon: "📚",
                name: "All Content",
                enabled: true,
                excludeSystemContent: true,
              });
            }

            setStandardMenus(migratedMenus);
          } else {
            console.error(
              "Loaded standard menus is not an array:",
              loadedMenus
            );
          }

          // Load custom menus
          const loadedCustomMenus = configs.customMenus;
          if (Array.isArray(loadedCustomMenus)) {
            const uniqueMenus: CustomMenu[] = [];
            const seenIds = new Set<string>();

            loadedCustomMenus.forEach((menu, index) => {
              if (!validateCustomMenu(menu)) {
                console.error(`Invalid custom menu at index ${index}:`, menu);
                return;
              }

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
              }
            });

            const validMenus = uniqueMenus.filter((menu) => {
              if (!menu.name || menu.name.trim() === "") {
                return false;
              }
              return true;
            });

            setCustomMenus(validMenus);
          } else {
            console.error(
              "Loaded custom menus is not an array:",
              loadedCustomMenus
            );
          }

          // Load menu order - filter to only include existing menus
          const loadedOrder = configs.menuOrder;
          if (Array.isArray(loadedOrder)) {
            const uniqueOrder: string[] = [];
            const seenIds = new Set<string>();

            // Get all valid menu IDs (standard + custom)
            const allValidMenuIds = new Set([
              ...configs.standardMenus.map((menu) => menu.id),
              ...configs.customMenus.map((menu) => menu.id),
            ]);

            loadedOrder.forEach((id, index) => {
              if (typeof id !== "string") {
                console.error(`Invalid menu order item at index ${index}:`, id);
                return;
              }

              // Only include menu IDs that actually exist
              if (!allValidMenuIds.has(id)) {
                return;
              }

              if (!seenIds.has(id)) {
                seenIds.add(id);
                uniqueOrder.push(id);
              }
            });

            setMenuOrder(uniqueOrder);
          } else {
            console.error("Loaded menu order is not an array:", loadedOrder);
          }

          // Load other configurations
          setHomePageConfig(configs.homePageConfig);
          setAppConfig(configs.appConfig);
          setFullAppConfig(configs.fullAppConfig);
          setStylingConfig(configs.stylingConfig);

          // Ensure default users exist if the loaded configuration doesn't have any users
          console.log("Loaded userConfig:", configs.userConfig);
          console.log(
            "Loaded currentUserId:",
            configs.userConfig.currentUserId
          );
          console.log(
            "[Layout] IMMEDIATELY after loadConfiguration, userConfig.users:",
            configs.userConfig.users?.map((u) => ({
              id: u.id,
              name: u.name,
              customMenus: u.access?.customMenus || [],
            })) || []
          );
          if (
            !configs.userConfig.users ||
            configs.userConfig.users.length === 0
          ) {
            console.log(
              "No users found in loaded configuration, creating default users"
            );
            const defaultUsers = [
              {
                id: "power-user",
                name: "Power User",
                description:
                  "Full access - can access all features including Search and Full App",
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
              },
              {
                id: "basic-user",
                name: "Basic User",
                description:
                  "Limited access - cannot access Search and Full App",
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
                },
              },
            ];

            const userConfigWithDefaults = {
              users: defaultUsers,
              currentUserId:
                configs.userConfig.currentUserId || defaultUsers[0].id,
            };

            console.log(
              "Setting userConfig with defaults, currentUserId:",
              userConfigWithDefaults.currentUserId
            );
            setUserConfig(userConfigWithDefaults);
          } else {
            console.log(
              "Setting userConfig from loaded config, currentUserId:",
              configs.userConfig.currentUserId
            );
            console.log("[Layout] LOADED userConfig detail:", {
              users:
                configs.userConfig.users?.map((u) => ({
                  id: u.id,
                  name: u.name,
                  customMenus: u.access?.customMenus || [],
                })) || [],
            });
            setUserConfig(configs.userConfig);
          }
        });

        console.log("Configuration loaded successfully");

        // Mark initial load as completed
        setHasInitialLoadCompleted(true);
        setIsInitialLoadInProgress(false);

        // Clear import flag after initial load
        setTimeout(() => {
          setIsImportingConfiguration(false);
        }, 1000);
      } catch (error) {
        console.error("Failed to load configuration:", error);
        setIsImportingConfiguration(false); // Clear import flag on error
      }
    };

    loadConfiguration();
  }, []);

  // Synchronous configuration loading function
  const loadConfigurationSynchronously = async (
    config: ConfigurationData,
    onProgress?: (progress: number, message: string) => void
  ): Promise<void> => {
    try {
      // Set import flag to prevent auto-save loops
      setIsImportingConfiguration(true);

      // Show loading dialog
      setIsLoadingConfiguration(true);
      setLoadingProgress(0);
      setLoadingMessage("Starting configuration load...");

      onProgress?.(10, "Saving configuration to storage...");
      setLoadingProgress(10);
      setLoadingMessage("Saving configuration to storage...");

      // Save the entire configuration to storage first
      await saveConfigurationToStorage(config);

      onProgress?.(50, "Configuration saved, reloading from storage...");
      setLoadingProgress(50);
      setLoadingMessage("Configuration saved, reloading from storage...");

      // Now load the configuration from storage to ensure consistency
      const loadedConfig = await loadAllConfigurations();

      onProgress?.(80, "Applying configuration to UI...");
      setLoadingProgress(80);
      setLoadingMessage("Applying configuration to UI...");

      // Apply the loaded configuration to the UI state
      if (Array.isArray(loadedConfig.standardMenus)) {
        const migratedMenus = migrateStandardMenus(loadedConfig.standardMenus);
        setStandardMenus(migratedMenus);
      }

      if (Array.isArray(loadedConfig.customMenus)) {
        const uniqueMenus: CustomMenu[] = [];
        const seenIds = new Set<string>();

        loadedConfig.customMenus.forEach((menu, index) => {
          if (!validateCustomMenu(menu)) {
            console.error(`Invalid custom menu at index ${index}:`, menu);
            return;
          }

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
          }
        });

        const validMenus = uniqueMenus.filter((menu) => {
          if (!menu.name || menu.name.trim() === "") {
            return false;
          }
          return true;
        });

        setCustomMenus(validMenus);
      }

      if (Array.isArray(loadedConfig.menuOrder)) {
        const uniqueOrder: string[] = [];
        const seenIds = new Set<string>();

        // Get all valid menu IDs (standard + custom)
        const allValidMenuIds = new Set([
          ...loadedConfig.standardMenus.map((menu) => menu.id),
          ...loadedConfig.customMenus.map((menu) => menu.id),
        ]);

        loadedConfig.menuOrder.forEach((id, index) => {
          if (typeof id !== "string") {
            console.error(`Invalid menu order item at index ${index}:`, id);
            return;
          }

          // Only include menu IDs that actually exist
          if (!allValidMenuIds.has(id)) {
            return;
          }

          if (!seenIds.has(id)) {
            seenIds.add(id);
            uniqueOrder.push(id);
          }
        });

        setMenuOrder(uniqueOrder);
      }

      setHomePageConfig(loadedConfig.homePageConfig);
      setAppConfig(loadedConfig.appConfig);
      setFullAppConfig(loadedConfig.fullAppConfig);
      setStylingConfig(loadedConfig.stylingConfig);
      setUserConfig(loadedConfig.userConfig);

      onProgress?.(100, "Configuration loaded successfully!");
      setLoadingProgress(100);
      setLoadingMessage("Configuration loaded successfully!");

      // Small delay to show completion
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check if we're on a custom menu page and redirect if needed
      redirectFromCustomMenu(loadedConfig.standardMenus);

      // Hide loading dialog
      setIsLoadingConfiguration(false);

      // Clear import flag after a short delay to allow state updates to complete
      setTimeout(() => {
        setIsImportingConfiguration(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to load configuration synchronously:", error);
      setIsLoadingConfiguration(false); // Hide dialog on error
      setIsImportingConfiguration(false); // Clear import flag on error
      throw error;
    }
  };

  // Configuration version state to force re-initialization when config changes
  const [configVersion, setConfigVersion] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tse-demo-builder-config-version");
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  });

  // Set ThoughtSpot base URL when app config changes
  useEffect(() => {
    if (appConfig.thoughtspotUrl) {
      setThoughtSpotBaseUrl(appConfig.thoughtspotUrl);
    }
  }, [appConfig.thoughtspotUrl]);

  // Consolidated auto-save effect for all configurations
  useEffect(() => {
    if (isImportingConfiguration || isInitialLoadInProgress) {
      return;
    }

    const saveAllConfigs = async () => {
      try {
        // Save all configurations in parallel to reduce cascading effects
        await Promise.all([
          saveStandardMenus(standardMenus, (errorMessage) => {
            // Only show storage errors when settings modal is open
            if (isSettingsOpen) {
              setStorageError(errorMessage);
              // Clear error after 10 seconds
              setTimeout(() => setStorageError(null), 10000);
            }
          }),
          saveCustomMenus(customMenus),
          saveMenuOrder(menuOrder),
          saveHomePageConfig(homePageConfig),
          saveAppConfig(appConfig),
          saveFullAppConfig(fullAppConfig),
          saveStylingConfig(stylingConfig, (errorMessage) => {
            // Only show storage errors when settings modal is open
            if (isSettingsOpen) {
              setStorageError(errorMessage);
              // Clear error after 10 seconds
              setTimeout(() => setStorageError(null), 10000);
            }
          }),
          saveUserConfig(userConfig),
        ]);
      } catch (error) {
        console.error("Failed to save configurations:", error);
      }
    };

    // Debounce the save operation to prevent excessive saves
    const timeoutId = setTimeout(saveAllConfigs, 1000);
    return () => clearTimeout(timeoutId);
  }, [
    standardMenus,
    customMenus,
    menuOrder,
    homePageConfig,
    appConfig,
    fullAppConfig,
    stylingConfig,
    userConfig,
    isSettingsOpen,
    isImportingConfiguration,
    isInitialLoadInProgress,
  ]);

  // Update document title when application name changes
  useEffect(() => {
    const title = appConfig.applicationName || "TSE Demo Builder";
    document.title = title;
  }, [appConfig.applicationName]);

  // Utility function to convert icon identifiers to image paths
  const getIconImagePath = (icon: string): string => {
    // Handle empty or invalid icons
    if (!icon || typeof icon !== "string") {
      return "/ts.png";
    }

    // Clean up the icon string - remove any whitespace or invalid characters
    const cleanIcon = icon.trim();
    if (!cleanIcon) {
      return "/ts.png";
    }

    // If it's already a valid image path or URL, return as is
    if (
      cleanIcon.startsWith("http") ||
      cleanIcon.startsWith("data:") ||
      cleanIcon.startsWith("/") ||
      cleanIcon.startsWith("blob:")
    ) {
      return cleanIcon;
    }

    // Handle IndexedDB references - these need to be converted to actual image data
    if (cleanIcon.startsWith("indexeddb://")) {
      // For now, return default since we can't convert IndexedDB refs to URLs in this context
      // The actual conversion will happen in the favicon update effect
      return cleanIcon;
    }

    // Map icon identifiers to their corresponding image paths
    const iconPathMap: Record<string, string> = {
      home: "/icons/home.png",
      favorites: "/icons/favorites.png",
      "my-reports": "/icons/my-reports.png",
      spotter:
        stylingConfig.embeddedContent.iconSpriteUrl ||
        "/icons/spotter-custom.svg",
      search: "/icons/search.png",
      "full-app": "/icons/full-app.png",
    };

    console.log(
      "Layout: stylingConfig.embeddedContent.iconSpriteUrl =",
      stylingConfig.embeddedContent.iconSpriteUrl
    );

    // Return the mapped path or fallback to default
    return iconPathMap[cleanIcon] || "/ts.png";
  };

  // Auto-sync favicon with logo when favicon sync is enabled
  useEffect(() => {
    if (
      appConfig.faviconSyncEnabled &&
      stylingConfig.application.topBar.logoUrl &&
      stylingConfig.application.topBar.logoUrl !== "/ts.png"
    ) {
      console.log(
        "[Layout] Auto-syncing favicon with logo:",
        stylingConfig.application.topBar.logoUrl
      );
      // Update favicon directly in DOM to avoid infinite loops
      const faviconElement = document.getElementById(
        "favicon"
      ) as HTMLLinkElement;
      if (faviconElement) {
        faviconElement.href = stylingConfig.application.topBar.logoUrl;
      }
      // Update favicon in DOM only, don't modify React state to avoid loops
    } else if (
      !appConfig.faviconSyncEnabled &&
      appConfig.favicon !== "/ts.png"
    ) {
      // Reset favicon to default when sync is disabled
      const faviconElement = document.getElementById(
        "favicon"
      ) as HTMLLinkElement;
      if (faviconElement) {
        faviconElement.href = "/ts.png";
      }
      // Update favicon in DOM only, don't modify React state to avoid loops
    }
  }, [
    stylingConfig.application.topBar.logoUrl,
    appConfig.faviconSyncEnabled,
    appConfig.favicon,
  ]);

  // Update favicon when app config changes
  useEffect(() => {
    const updateFavicon = async () => {
      try {
        // Ensure we have a valid favicon value
        const faviconValue = appConfig.favicon;

        if (
          !faviconValue ||
          faviconValue === "undefined" ||
          faviconValue === "null"
        ) {
          console.log(
            "[Layout] Favicon value is invalid, resetting to default"
          );
          // Reset to default if favicon is invalid
          const faviconElement = document.getElementById(
            "favicon"
          ) as HTMLLinkElement;
          if (faviconElement) {
            faviconElement.href = "/ts.png";
          }
          return;
        }

        let favicon = getIconImagePath(faviconValue);

        // Handle IndexedDB references by converting them to actual image data
        if (favicon.startsWith("indexeddb://")) {
          try {
            const imageId = favicon.replace("indexeddb://", "");
            const imageData = await getImageFromIndexedDB(imageId);
            if (imageData) {
              favicon = imageData;
            } else {
              console.warn(
                "[Layout] Failed to get image data from IndexedDB, using default"
              );
              favicon = "/ts.png";
            }
          } catch (indexedDBError) {
            console.error(
              "[Layout] Error getting image from IndexedDB:",
              indexedDBError
            );
            favicon = "/ts.png";
          }
        }

        const faviconElement = document.getElementById(
          "favicon"
        ) as HTMLLinkElement;

        if (faviconElement && favicon) {
          // Validate the favicon URL before setting it
          try {
            // For blob URLs and data URLs, we can't use the URL constructor
            if (favicon.startsWith("blob:") || favicon.startsWith("data:")) {
              faviconElement.href = favicon;
            } else if (favicon.startsWith("/")) {
              // For relative paths, validate against origin
              new URL(favicon, window.location.origin);
              faviconElement.href = favicon;
            } else if (favicon.startsWith("http")) {
              // For absolute URLs, validate directly
              new URL(favicon);
              faviconElement.href = favicon;
            } else {
              // For icon identifiers, use the mapped path
              faviconElement.href = favicon;
            }
          } catch (urlError) {
            console.warn("Invalid favicon URL:", favicon, urlError);
            // Fallback to default favicon
            faviconElement.href = "/ts.png";
          }
        }
      } catch (error) {
        console.error("Error updating favicon:", error);
        // Fallback to default favicon
        const faviconElement = document.getElementById(
          "favicon"
        ) as HTMLLinkElement;
        if (faviconElement) {
          faviconElement.href = "/ts.png";
        }
      }
    };

    updateFavicon();
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
    // Prevent initialization if no URL is configured
    if (!appConfig.thoughtspotUrl) {
      return;
    }

    // Prevent initialization during initial load
    if (isInitialLoadInProgress) {
      return;
    }

    const initializeThoughtSpot = async () => {
      if (!appConfig.thoughtspotUrl) {
        return;
      }

      // Prevent multiple simultaneous initializations
      if (
        (window as { __thoughtspotInitializing?: boolean })
          .__thoughtspotInitializing
      ) {
        return;
      }

      // Set ThoughtSpot initialization flag
      (
        window as { __thoughtspotInitializing?: boolean }
      ).__thoughtspotInitializing = true;

      try {
        const { init, AuthType } = await import(
          "@thoughtspot/visual-embed-sdk"
        );

        // Clear any existing ThoughtSpot state when cluster changes
        if (
          previousThoughtspotUrl &&
          previousThoughtspotUrl !== appConfig.thoughtspotUrl
        ) {
          // Cluster URL changed

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
              sessionStorage.removeItem(key);
            });

            // Also clear any cookies that might be cluster-specific
            document.cookie.split(";").forEach((cookie) => {
              const eqPos = cookie.indexOf("=");
              const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
              if (
                name.includes("thoughtspot") ||
                name.includes("ts-") ||
                name.includes("ts_")
              ) {
                document.cookie =
                  name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
              }
            });

            // Clear any ThoughtSpot-related global variables
            const globalWindow = window as unknown as Record<string, unknown>;
            Object.keys(globalWindow).forEach((key) => {
              if (
                key.includes("thoughtspot") ||
                key.includes("ThoughtSpot") ||
                key.includes("ts_")
              ) {
                try {
                  delete globalWindow[key];
                } catch (e) {
                  // Ignore errors for non-configurable properties
                }
              }
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

        console.log(
          "[Layout] Initializing ThoughtSpot with config:",
          initConfig
        );

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

        init(initConfig);
        // ThoughtSpot init completed successfully
      } catch (error) {
        console.error("Failed to initialize ThoughtSpot:", error);
      } finally {
        // Reset the initialization flag
        (
          window as { __thoughtspotInitializing?: boolean }
        ).__thoughtspotInitializing = false;
      }
    };

    initializeThoughtSpot();
  }, [
    appConfig.thoughtspotUrl,
    appConfig.earlyAccessFlags,
    configVersion,
    isInitialLoadInProgress,
  ]); // Removed stylingConfig and userConfig from dependencies to prevent excessive re-initialization

  // Separate effect to handle styling config changes that require ThoughtSpot re-initialization
  useEffect(() => {
    // Only re-initialize ThoughtSpot if we have a URL and the styling config has meaningful changes
    if (appConfig.thoughtspotUrl && stylingConfig) {
      // Check if there are actual meaningful changes that require re-initialization
      const hasCustomCSSVariables =
        Object.keys(stylingConfig.embeddedContent?.customCSS?.variables || {})
          .length > 0;
      const hasCustomCSSRules =
        Object.keys(
          stylingConfig.embeddedContent?.customCSS?.rules_UNSTABLE || {}
        ).length > 0;
      const hasCustomStrings =
        Object.keys(stylingConfig.embeddedContent?.strings || {}).length > 0;
      const hasCustomStringIDs =
        Object.keys(stylingConfig.embeddedContent?.stringIDs || {}).length > 0;
      const hasCustomCSSUrl = stylingConfig.embeddedContent?.cssUrl;

      // Only trigger re-initialization if there are actual customizations
      if (
        hasCustomCSSVariables ||
        hasCustomCSSRules ||
        hasCustomStrings ||
        hasCustomStringIDs ||
        hasCustomCSSUrl
      ) {
        // Increment config version to force re-initialization
        const newVersion = configVersion + 1;
        setConfigVersion(newVersion);
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "tse-demo-builder-config-version",
            newVersion.toString()
          );
        }
      }
    }
  }, [
    stylingConfig.embeddedContent?.customCSS?.variables,
    stylingConfig.embeddedContent?.customCSS?.rules_UNSTABLE,
    stylingConfig.embeddedContent?.strings,
    stylingConfig.embeddedContent?.stringIDs,
    stylingConfig.embeddedContent?.cssUrl,
  ]);

  // Force re-initialization when app config changes (including cluster URL changes)
  useEffect(() => {
    if (appConfig.thoughtspotUrl && !isInitialLoadInProgress) {
      // App config changed, forcing ThoughtSpot re-initialization

      // Clear the initialization flag to allow re-initialization
      if (typeof window !== "undefined") {
        (
          window as { __thoughtspotInitializing?: boolean }
        ).__thoughtspotInitializing = false;
      }

      // Increment config version to force re-initialization
      const newVersion = configVersion + 1;
      setConfigVersion(newVersion);
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "tse-demo-builder-config-version",
          newVersion.toString()
        );
      }
    }
  }, [
    appConfig.thoughtspotUrl,
    appConfig.earlyAccessFlags,
    isInitialLoadInProgress,
  ]);

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
  const handleSessionStatusChange = useCallback((_hasSession: boolean) => {
    // Session status is tracked by the SessionChecker component
    // We can use this for future features if needed
  }, []);

  const handleClusterChangeConfirm = () => {
    // Create new app config with the new cluster URL but keep other default values
    const newAppConfig = {
      thoughtspotUrl: pendingClusterUrl,
      applicationName: "TSE Demo Builder",
      logo: "",
      earlyAccessFlags: "",
      favicon: "/ts.png",
      showFooter: true,
    } as AppConfig;

    // Close the warning dialog first
    setShowClusterChangeWarning(false);
    setPendingClusterUrl("");

    // Clear storage first
    clearAllConfigurationsService()
      .then(async () => {
        try {
          // Now reset all other configurations to defaults
          setStandardMenus(DEFAULT_CONFIG.standardMenus);
          setCustomMenus(DEFAULT_CONFIG.customMenus);
          setMenuOrder(DEFAULT_CONFIG.menuOrder);
          setHomePageConfig(DEFAULT_CONFIG.homePageConfig);
          setFullAppConfig(DEFAULT_CONFIG.fullAppConfig);
          setStylingConfig(DEFAULT_CONFIG.stylingConfig);

          // Create default users instead of using empty DEFAULT_CONFIG.userConfig
          const defaultUsers = [
            {
              id: "power-user",
              name: "Power User",
              description:
                "Full access - can access all features including Search and Full App",
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
              },
            },
          ];

          setUserConfig({
            users: defaultUsers,
            currentUserId: defaultUsers[0].id,
          });

          // Update app config last to ensure proper state propagation
          setAppConfig(newAppConfig);

          // Save the new app config AFTER clearing storage to ensure it's the only config
          // About to save new app config
          await saveAppConfig(newAppConfig, (errorMessage) => {
            console.error(
              `[Layout] Failed to save new cluster config: ${errorMessage}`
            );
          });

          // Verify the config was saved correctly
          // New app config saved, verifying storage...
          try {
            const savedConfig = await loadAllConfigurations();
            console.log(
              "[Layout] Config in storage after save:",
              savedConfig?.appConfig
            );
          } catch (error) {
            console.error("[Layout] Failed to verify saved config:", error);
          }

          // Force a re-initialization of ThoughtSpot with the new cluster URL
          // by incrementing the config version
          setConfigVersion((prev) => prev + 1);

          // Clear any existing ThoughtSpot initialization flag to force re-initialization
          if (typeof window !== "undefined") {
            (
              window as { __thoughtspotInitializing?: boolean }
            ).__thoughtspotInitializing = false;
          }

          // Force all embed components to re-render by updating a timestamp
          setLastClusterChangeTime(Date.now());

          // Don't reload the page - let the state changes propagate naturally
          console.log(
            "[Layout] Cluster change completed successfully to:",
            newAppConfig.thoughtspotUrl
          );
          // State comparison logging removed
          console.log(
            "[Layout] Page will not reload - state changes will propagate naturally"
          );
        } catch (error) {
          console.error("Failed to save new cluster config:", error);
          // Even if save fails, reload to ensure clean state
          window.location.reload();
        }
      })
      .catch((error) => {
        console.error("Failed to clear storage:", error);
        // If clearing fails, still reload
        window.location.reload();
      });
  };

  const handleClusterChangeCancel = () => {
    setShowClusterChangeWarning(false);
    setPendingClusterUrl("");
  };

  const handleConfigureSettings = useCallback(() => {
    openSettingsWithTab("configuration");
  }, []);

  const updateStandardMenu = (
    id: string,
    field: string,
    value: string | boolean,
    skipFaviconUpdate: boolean = false
  ) => {
    setStandardMenus((prev) => {
      const updated = prev.map((menu) =>
        menu.id === id ? { ...menu, [field]: value } : menu
      );

      // Save immediately with async storage
      saveStandardMenus(updated).catch((error) => {
        console.error("Failed to save standard menus:", error);
      });

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
          saveMenuOrder(updated).catch((error) => {
            console.error("Failed to save menu order:", error);
          });
          return updated;
        } else if (!isEnabled && isInOrder) {
          // Remove from menu order if disabled
          const updated = prev.filter((menuId) => menuId !== id);
          saveMenuOrder(updated).catch((error) => {
            console.error("Failed to save menu order:", error);
          });
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
        saveStylingConfig(updated).catch((error) => {
          console.error("Failed to save styling config:", error);
        });
        return updated;
      });
    }
  };

  const updateHomePageConfig = (config: HomePageConfig) => {
    setHomePageConfig(config);

    // Save to storage immediately when loading from configuration
    saveHomePageConfig(config).catch((error) => {
      console.error("Failed to save home page config:", error);
    });
  };

  const updateAppConfig = (config: AppConfig, bypassClusterWarning = false) => {
    if (
      config.thoughtspotUrl !== appConfig.thoughtspotUrl &&
      appConfig.thoughtspotUrl &&
      !bypassClusterWarning
    ) {
      // Show warning dialog for cluster change
      setPendingClusterUrl(config.thoughtspotUrl);
      setShowClusterChangeWarning(true);
      return; // Don't update yet, wait for user confirmation
    }

    // Always save to storage immediately for all app config changes

    // Check storage health before saving
    const checkHealth = async () => {
      try {
        const storageHealth = await checkStorageHealth();
        if (!storageHealth.healthy) {
          // Try to clear storage and retry
          const clearResult = await clearStorageAndReloadDefaults();
          if (!clearResult.success) {
            console.error(
              `[Layout] Failed to clear storage: ${clearResult.message}`
            );
          }
        }
      } catch (error) {
        console.error("Error checking storage health:", error);
      }
    };

    checkHealth();

    // Calling saveAppConfig
    saveAppConfig(config, (errorMessage) => {
      console.error(`[Layout] Failed to save app config: ${errorMessage}`);
      // Show user-friendly error message
      alert(
        `Failed to save configuration: ${errorMessage}. Please try clearing your browser storage or contact support.`
      );
    }).catch((error) => {
      console.error("Failed to save app config:", error);
    });

    // Update state after saving to storage
    setAppConfig(config);

    // Only increment config version if ThoughtSpot URL is actually changing
    if (config.thoughtspotUrl !== appConfig.thoughtspotUrl) {
      const newVersion = configVersion + 1;
      setConfigVersion(newVersion);
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "tse-demo-builder-config-version",
          newVersion.toString()
        );
      }
    }
  };

  const updateFullAppConfig = (config: FullAppConfig) => {
    setFullAppConfig(config);

    // Save to storage immediately when loading from configuration
    saveFullAppConfig(config).catch((error) => {
      console.error("Failed to save full app config:", error);
    });
  };

  const updateStylingConfig = (config: StylingConfig) => {
    console.log(
      "Layout updateStylingConfig: received config with iconSpriteUrl:",
      config.embeddedContent.iconSpriteUrl
    );
    setStylingConfig(config);

    // Save to storage immediately when loading from configuration
    saveStylingConfig(config).catch((error) => {
      console.error("Failed to save styling config:", error);
    });
  };

  const updateUserConfig = (config: UserConfig) => {
    setUserConfig(config);

    // Save to storage immediately when loading from configuration
    saveUserConfig(config).catch((error) => {
      console.error("Failed to save user config:", error);
    });
  };

  const addCustomMenu = async (menu: CustomMenu) => {
    // Check if menu already exists
    const existingMenu = customMenus.find((m) => m.id === menu.id);
    if (existingMenu) {
      updateCustomMenu(menu.id, menu);
      return;
    }

    // Update state and save immediately
    const updatedMenus = [...customMenus, menu];
    setCustomMenus(updatedMenus);

    // Save to storage immediately and wait for completion
    try {
      await saveCustomMenus(updatedMenus);
    } catch (error) {
      console.error("Failed to save custom menus:", error);
    }

    // Add to menu order if not already present
    if (!menuOrder.includes(menu.id)) {
      const updatedOrder = [...menuOrder, menu.id];
      setMenuOrder(updatedOrder);
      try {
        await saveMenuOrder(updatedOrder);
      } catch (error) {
        console.error("Failed to save menu order:", error);
      }
    }

    // Grant current user access to the new custom menu
    const currentUser = userConfig.users.find(
      (u) => u.id === userConfig.currentUserId
    );
    if (currentUser && !currentUser.access.customMenus.includes(menu.id)) {
      const updatedUserConfig = {
        ...userConfig,
        users: userConfig.users.map((user) =>
          user.id === currentUser.id
            ? {
                ...user,
                access: {
                  ...user.access,
                  customMenus: [...user.access.customMenus, menu.id],
                },
              }
            : user
        ),
      };
      setUserConfig(updatedUserConfig);
      try {
        await saveUserConfig(updatedUserConfig);
      } catch (error) {
        console.error("Failed to save user config:", error);
      }
    }
  };

  const updateCustomMenu = (id: string, menu: CustomMenu) => {
    setCustomMenus((prev) => {
      const updated = prev.map((m) => (m.id === id ? menu : m));
      saveCustomMenus(updated).catch((error) => {
        console.error("Failed to save custom menus:", error);
      });
      return updated;
    });

    // Update menu order based on enabled status
    setMenuOrder((prev) => {
      const isInOrder = prev.includes(id);
      const isEnabled = menu.enabled;

      if (isEnabled && !isInOrder) {
        // Add to menu order if enabled and not already there
        const updated = [...prev, id];
        saveMenuOrder(updated).catch((error) => {
          console.error("Failed to save menu order:", error);
        });
        return updated;
      } else if (!isEnabled && isInOrder) {
        // Remove from menu order if disabled
        const updated = prev.filter((menuId) => menuId !== id);
        saveMenuOrder(updated).catch((error) => {
          console.error("Failed to save menu order:", error);
        });
        return updated;
      }

      return prev;
    });
  };

  const deleteCustomMenu = (id: string) => {
    setCustomMenus((prev) => {
      const filtered = prev.filter((m) => m.id !== id);
      saveCustomMenus(filtered).catch((error) => {
        console.error("Failed to save custom menus after deletion:", error);
      });
      return filtered;
    });

    // Remove from menu order
    setMenuOrder((prev) => {
      const filtered = prev.filter((menuId) => menuId !== id);
      saveMenuOrder(filtered).catch((error) => {
        console.error("Failed to save menu order after deletion:", error);
      });
      return filtered;
    });
  };

  const clearCustomMenus = () => {
    setCustomMenus([]);
    saveCustomMenus([]).catch((error) => {
      console.error("Failed to save empty custom menus:", error);
    });

    // Also remove custom menu IDs from menu order
    setMenuOrder((prev) => {
      const filtered = prev.filter((menuId) => {
        // Keep only standard menu IDs
        const standardMenuIds = standardMenus.map((menu) => menu.id);
        const shouldKeep = standardMenuIds.includes(menuId);
        return shouldKeep;
      });
      saveMenuOrder(filtered).catch((error) => {
        console.error("Failed to save menu order after clearing:", error);
      });
      return filtered;
    });
  };

  const clearAllConfigurations = async () => {
    try {
      // Clear storage using service
      await clearAllConfigurationsService();

      // Reset to default values
      setStandardMenus(DEFAULT_CONFIG.standardMenus);
      setCustomMenus(DEFAULT_CONFIG.customMenus);
      setMenuOrder(DEFAULT_CONFIG.menuOrder);
      setHomePageConfig(DEFAULT_CONFIG.homePageConfig);
      setAppConfig(DEFAULT_CONFIG.appConfig);
      setFullAppConfig(DEFAULT_CONFIG.fullAppConfig);
      setStylingConfig(DEFAULT_CONFIG.stylingConfig);

      // Create default users instead of using empty DEFAULT_CONFIG.userConfig
      const defaultUsers = [
        {
          id: "power-user",
          name: "Power User",
          description:
            "Full access - can access all features including Search and Full App",
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
          },
        },
      ];

      setUserConfig({
        users: defaultUsers,
        currentUserId: defaultUsers[0].id,
      });
    } catch (error) {
      console.error("Failed to clear configurations:", error);
    }
  };

  // Test function for debugging user access
  const testUserAccess = () => {
    console.log("=== User Access Test ===");
    console.log("Current userConfig:", userConfig);
    console.log(
      "Current user:",
      userConfig.users.find((u) => u.id === userConfig.currentUserId)
    );
    console.log("Standard menus:", standardMenus);
    console.log("Accessible menus:", accessibleStandardMenus);

    const fullAppMenu = standardMenus.find((m) => m.id === "full-app");
    console.log("Full app menu:", fullAppMenu);
    console.log("Full app enabled globally:", fullAppMenu?.enabled);

    const fullAppAccessible = accessibleStandardMenus.find(
      (m) => m.id === "full-app"
    );
    console.log("Full app accessible:", fullAppAccessible);

    if (fullAppMenu?.enabled === false) {
      console.log(
        "⚠️  Full App menu is globally disabled - this takes priority over user access"
      );
    }
  };

  // Function to fix disabled menus
  const fixDisabledMenus = () => {
    console.log("=== Fixing Disabled Menus ===");
    const updatedMenus = standardMenus.map((menu) => ({
      ...menu,
      enabled: true, // Enable all menus
    }));
    setStandardMenus(updatedMenus);
    console.log("All menus have been enabled");
  };

  // Function to specifically enable Full App menu
  const enableFullApp = () => {
    console.log("=== Enabling Full App Menu ===");
    const updatedMenus = standardMenus.map((menu) =>
      menu.id === "full-app" ? { ...menu, enabled: true } : menu
    );
    setStandardMenus(updatedMenus);
    console.log("Full App menu has been enabled");
  };

  // Function to force refresh and test
  const forceRefresh = () => {
    console.log("=== Force Refresh ===");
    console.log("Current standardMenus:", standardMenus);
    console.log("Current accessibleStandardMenus:", accessibleStandardMenus);
    console.log("Current userConfig:", userConfig);

    // Force a re-render by updating state
    setStandardMenus([...standardMenus]);
    console.log("Forced re-render triggered");
  };

  // Function to check and fix menu order
  const checkMenuOrder = () => {
    console.log("=== Menu Order Check ===");
    console.log("Current menuOrder:", menuOrder);
    console.log(
      "Standard menu IDs:",
      standardMenus.map((m) => m.id)
    );
    console.log(
      "Accessible menu IDs:",
      accessibleStandardMenus.map((m) => m.id)
    );

    // Check if full-app is in menu order
    const fullAppInOrder = menuOrder?.includes("full-app");
    console.log("Full App in menu order:", fullAppInOrder);

    if (!fullAppInOrder && menuOrder) {
      console.log("Adding full-app to menu order");
      const newMenuOrder = [...menuOrder, "full-app"];
      setMenuOrder(newMenuOrder);
    }
  };

  // Expose test functions to window for debugging
  if (typeof window !== "undefined") {
    (
      window as unknown as {
        testUserAccess: typeof testUserAccess;
        fixDisabledMenus: typeof fixDisabledMenus;
        enableFullApp: typeof enableFullApp;
        forceRefresh: typeof forceRefresh;
        checkMenuOrder: typeof checkMenuOrder;
      }
    ).testUserAccess = testUserAccess;
    (
      window as unknown as {
        testUserAccess: typeof testUserAccess;
        fixDisabledMenus: typeof fixDisabledMenus;
        enableFullApp: typeof enableFullApp;
        forceRefresh: typeof forceRefresh;
        checkMenuOrder: typeof checkMenuOrder;
      }
    ).fixDisabledMenus = fixDisabledMenus;
    (
      window as unknown as {
        testUserAccess: typeof testUserAccess;
        fixDisabledMenus: typeof fixDisabledMenus;
        enableFullApp: typeof enableFullApp;
        forceRefresh: typeof forceRefresh;
        checkMenuOrder: typeof checkMenuOrder;
      }
    ).enableFullApp = enableFullApp;
    (
      window as unknown as {
        testUserAccess: typeof testUserAccess;
        fixDisabledMenus: typeof fixDisabledMenus;
        enableFullApp: typeof enableFullApp;
        forceRefresh: typeof forceRefresh;
        checkMenuOrder: typeof checkMenuOrder;
      }
    ).forceRefresh = forceRefresh;
    (
      window as unknown as {
        testUserAccess: typeof testUserAccess;
        fixDisabledMenus: typeof fixDisabledMenus;
        enableFullApp: typeof enableFullApp;
        forceRefresh: typeof forceRefresh;
        checkMenuOrder: typeof checkMenuOrder;
      }
    ).checkMenuOrder = checkMenuOrder;
  }

  const handleExportConfiguration = async (customName?: string) => {
    try {
      await exportConfigurationService(
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
    } catch (error) {
      console.error("Failed to export configuration:", error);
    }
  };

  // File import functionality moved to SettingsModal
  // This function is no longer needed in Layout

  // Create unfiltered versions for Settings modal (bypass user access control)
  const allStandardMenus = standardMenus; // These are already all standard menus
  const allCustomMenus = customMenus; // These are already all custom menus

  // Debug logging for user configuration (only in development)
  // Disabled to reduce console spam
  // if (process.env.NODE_ENV === "development") {
  //   const currentUser = userConfig.users.find(
  //     (u) => u.id === userConfig.currentUserId
  //   );
  //   console.log("User configuration debug:", {
  //     userConfig,
  //     currentUserId: userConfig.currentUserId,
  //     users: userConfig.users,
  //     currentUser,
  //     currentUserAccess: currentUser?.access,
  //     fullAppAccess: currentUser?.access?.standardMenus?.["full-app"],
  //   });
  // }

  // Filter menus based on current user access for navigation
  const accessibleStandardMenus = standardMenus.filter((menu) => {
    const currentUser = userConfig.users.find(
      (u) => u.id === userConfig.currentUserId
    );

    // If no current user is found, set the first user as current and show all menus (fallback)
    if (!currentUser) {
      console.warn("No current user found, setting first user as current");

      if (userConfig.users.length > 0) {
        setUserConfig({
          ...userConfig,
          currentUserId: userConfig.users[0].id,
        });
        return true;
      } else {
        console.warn("No users available, showing all menus");
        return true;
      }
    }

    const standardMenuAccess = currentUser?.access?.standardMenus as
      | Record<string, boolean>
      | undefined;

    // If no access configuration is found, create default access and show all menus (fallback)
    if (!standardMenuAccess) {
      console.warn(
        "No standard menu access configuration found for user:",
        currentUser.id,
        "Creating default access configuration"
      );

      // Create default access configuration for the user
      const updatedUser = {
        ...currentUser,
        access: {
          ...currentUser.access,
          standardMenus: {
            home: true,
            favorites: true,
            "my-reports": true,
            spotter: true,
            search: true,
            "full-app": true,
            "all-content": true,
          },
        },
      };

      // Update the user configuration
      const updatedUsers = userConfig.users.map((u) =>
        u.id === currentUser.id ? updatedUser : u
      );

      setUserConfig({
        ...userConfig,
        users: updatedUsers,
      });

      return true;
    }

    // Debug logging for full-app access (only in development)
    if (menu.id === "full-app" && process.env.NODE_ENV === "development") {
      console.log("Full App access check:", {
        userId: currentUser.id,
        userName: currentUser.name,
        menuId: menu.id,
        accessConfig: standardMenuAccess[menu.id],
        allAccess: standardMenuAccess,
        userConfig: userConfig,
        currentUserId: userConfig.currentUserId,
      });
    }

    // Priority 1: Menu must be globally enabled
    if (menu.enabled === false) {
      if (menu.id === "full-app" && process.env.NODE_ENV === "development") {
        console.log("Full App menu is globally disabled");
      }
      return false;
    }

    // Priority 2: User must have access to the menu
    const hasUserAccess = standardMenuAccess[menu.id] !== false;

    if (menu.id === "full-app" && process.env.NODE_ENV === "development") {
      console.log("Full App access check:", {
        hasUserAccess,
        menuEnabled: menu.enabled,
        menuId: menu.id,
      });
    }

    return hasUserAccess;
  });

  // Debug logging for accessible menus (only in development)
  if (process.env.NODE_ENV === "development") {
    const fullAppMenu = standardMenus.find((m) => m.id === "full-app");
    const fullAppAccessible = accessibleStandardMenus.find(
      (m) => m.id === "full-app"
    );
    const allContentMenu = standardMenus.find((m) => m.id === "all-content");
    const allContentAccessible = accessibleStandardMenus.find(
      (m) => m.id === "all-content"
    );
    // Disabled to reduce console spam
    // console.log("Menu access debug:", {
    //   fullAppMenu,
    //   fullAppEnabled: fullAppMenu?.enabled,
    //   fullAppInStandardMenus: standardMenus.map((m) => ({
    //     id: m.id,
    //     enabled: m.enabled,
    //   })),
    //   fullAppInStandardMenus: accessibleStandardMenus.map((m) => ({
    //     id: m.id,
    //     enabled: m.enabled,
    //   })),
    //   fullAppAccessible,
    //   allContentMenu,
    //   allContentEnabled: allContentMenu?.enabled,
    //   allContentAccessible,
    //   accessibleMenusCount: accessibleStandardMenus.length,
    //   totalMenusCount: standardMenus.length,
    // });
  }

  // Debug logging for user configuration
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("TopBar users:", userConfig.users);
      console.log("Current user ID:", userConfig.currentUserId);
    }
  }, [userConfig.users, userConfig.currentUserId]);

  // Debug menu order specifically
  // Disabled to reduce console spam
  // if (process.env.NODE_ENV === "development") {
  //   console.log("Menu order debug in Layout:", {
  //     menuOrder,
  //     allContentInMenuOrder: menuOrder?.includes("all-content"),
  //     allContentIndex: menuOrder?.indexOf("all-content"),
  //     menuOrderLength: menuOrder?.length,
  //   });
  // }

  // Debug: Log userConfig users before filtering
  if (process.env.NODE_ENV === "development" && customMenus.length > 0) {
    console.log("[Layout] BEFORE filtering - userConfig state:", {
      hasUsers: !!userConfig.users,
      usersCount: userConfig.users?.length || 0,
      currentUserId: userConfig.currentUserId,
      allUsers:
        userConfig.users?.map((u) => ({
          id: u.id,
          name: u.name,
          customMenus: u.access?.customMenus || [],
        })) || [],
    });
    // Log the raw userConfig.users to see actual structure
    console.log(
      "[Layout] RAW userConfig.users:",
      JSON.stringify(userConfig.users, null, 2)
    );
  }

  const accessibleCustomMenus = customMenus.filter((menu) => {
    const currentUser = userConfig.users.find(
      (u) => u.id === userConfig.currentUserId
    );

    // Debug logging
    if (process.env.NODE_ENV === "development") {
      console.log("[Layout] Filtering custom menu:", {
        menuId: menu.id,
        menuName: menu.name,
        currentUserId: userConfig.currentUserId,
        currentUser: currentUser
          ? {
              id: currentUser.id,
              name: currentUser.name,
              access: currentUser.access,
            }
          : null,
        userCustomMenuAccess: currentUser?.access?.customMenus || [],
        hasAccess: currentUser?.access?.customMenus?.includes(menu.id) || false,
      });
    }

    return currentUser?.access?.customMenus?.includes(menu.id);
  });

  // Debug: Log final accessible custom menus
  if (process.env.NODE_ENV === "development" && customMenus.length > 0) {
    console.log("[Layout] Custom menus filtering complete:", {
      totalCustomMenus: customMenus.length,
      accessibleCustomMenus: accessibleCustomMenus.length,
      customMenuIds: customMenus.map((m) => m.id),
      accessibleIds: accessibleCustomMenus.map((m) => m.id),
    });
  }

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
    lastClusterChangeTime,
    configVersion,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {/* Dynamic favicon */}
      <link rel="icon" href="/ts.png" id="favicon" />
      <StylingProvider stylingConfig={stylingConfig}>
        <SessionChecker
          thoughtspotUrl={appConfig.thoughtspotUrl}
          onSessionStatusChange={handleSessionStatusChange}
          onConfigureSettings={handleConfigureSettings}
        >
          <div
            style={{
              height: "100vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Top Bar */}
            <TopBar
              title={appConfig.applicationName || "TSE Demo Builder"}
              logoUrl={stylingConfig.application.topBar.logoUrl || "/ts.png"}
              users={userConfig.users.map((user) => ({
                id: user.id,
                name: user.name,
              }))}
              currentUser={
                userConfig.users.find(
                  (u) => u.id === userConfig.currentUserId
                ) ||
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
                  backgroundColor:
                    stylingConfig.application.backgrounds?.contentBackground ||
                    "#ffffff",
                  overflow: "auto",
                  overflowX: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                  }}
                >
                  {children}
                </div>
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
              loadConfigurationSynchronously={loadConfigurationSynchronously}
              setIsImportingConfiguration={setIsImportingConfiguration}
              initialTab={settingsInitialTab}
              initialSubTab={settingsInitialSubTab}
              onTabChange={(tab, subTab) => {
                setSettingsInitialTab(tab);
                if (subTab) {
                  setSettingsInitialSubTab(subTab);
                }
              }}
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

            {/* Loading Dialog */}
            <LoadingDialog
              isOpen={isLoadingConfiguration}
              message={loadingMessage}
              progress={loadingProgress}
            />

            {/* Configuration Loader */}
            <ConfigurationLoader
              onLoadStart={() => {}}
              onLoadComplete={() => {}}
              onLoadError={(error) => {
                console.error("Configuration loading error:", error);
                alert(`Configuration loading failed: ${error}`);
              }}
            />
          </div>
        </SessionChecker>
      </StylingProvider>
    </AppContext.Provider>
  );
}
