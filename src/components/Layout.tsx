"use client";

import { useState, createContext, useContext, useEffect } from "react";
import TopBar from "./TopBar";
import SideNav from "./SideNav";
import SettingsModal from "./SettingsModal";
import Footer from "./Footer";
import SessionChecker from "./SessionChecker";
import { CustomMenu, StylingConfig } from "../types/thoughtspot";
import { setThoughtSpotBaseUrl } from "../services/thoughtspotApi";

interface StandardMenu {
  id: string;
  icon: string;
  name: string;
  enabled: boolean;
  modelId?: string;
  contentId?: string;
  contentType?: "Answer" | "Liveboard";
  namePattern?: string;
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
      customCSS: {},
    },
  } as StylingConfig,
};

// Utility functions for localStorage
const loadFromStorage = (key: string, defaultValue: unknown): unknown => {
  if (typeof window === "undefined") return defaultValue;

  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error);
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

const saveToStorage = (key: string, value: unknown): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage:`, error);
  }
};

const clearAllStorage = (): void => {
  if (typeof window === "undefined") return;

  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
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
  data?: {
    standardMenus: StandardMenu[];
    customMenus: CustomMenu[];
    menuOrder: string[];
    homePageConfig: HomePageConfig;
    appConfig: AppConfig;
    fullAppConfig: FullAppConfig;
    stylingConfig: StylingConfig;
  };
  error?: string;
}> => {
  try {
    const text = await file.text();
    const imported = JSON.parse(text);

    // Validate basic structure
    if (!imported.version || !imported.timestamp) {
      return { success: false, error: "Invalid configuration file format" };
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
      if (!imported[field]) {
        return { success: false, error: `Missing required field: ${field}` };
      }
    }

    // Merge with defaults to handle missing fields gracefully
    const mergedConfig = {
      standardMenus: imported.standardMenus || DEFAULT_CONFIG.standardMenus,
      customMenus: imported.customMenus || DEFAULT_CONFIG.customMenus,
      menuOrder: imported.menuOrder || DEFAULT_CONFIG.menuOrder,
      homePageConfig: imported.homePageConfig || DEFAULT_CONFIG.homePageConfig,
      appConfig: imported.appConfig || DEFAULT_CONFIG.appConfig,
      fullAppConfig: imported.fullAppConfig || DEFAULT_CONFIG.fullAppConfig,
      stylingConfig: imported.stylingConfig || DEFAULT_CONFIG.stylingConfig,
    };

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
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to parse configuration file",
    };
  }
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
  const [currentUser, setCurrentUser] = useState({ id: "1", name: "John Doe" });

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

    // Apply migration to convert emoji icons to file paths
    return migrateStandardMenus(loadedMenus);
  });

  // Custom menus state
  const [customMenus, setCustomMenus] = useState<CustomMenu[]>(
    () => loadFromStorage(STORAGE_KEYS.CUSTOM_MENUS, []) as CustomMenu[]
  );

  // Menu order state - tracks the order of enabled menu IDs
  const [menuOrder, setMenuOrder] = useState<string[]>(
    () => loadFromStorage(STORAGE_KEYS.MENU_ORDER, []) as string[]
  );

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
          customCSS: {},
        },
      }) as StylingConfig
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

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.STYLING_CONFIG, stylingConfig);
  }, [stylingConfig]);

  // Update document title when application name changes
  useEffect(() => {
    const title = appConfig.applicationName || "TSE Demo Builder";
    document.title = title;
  }, [appConfig.applicationName]);

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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const initConfig: any = {
          thoughtSpotHost: appConfig.thoughtspotUrl,
          authType: AuthType.None,
        };

        // Add customizations if any are configured
        if (
          (stylingConfig.embeddedContent.strings &&
            Object.keys(stylingConfig.embeddedContent.strings).length > 0) ||
          (stylingConfig.embeddedContent.stringIDs &&
            Object.keys(stylingConfig.embeddedContent.stringIDs).length > 0) ||
          stylingConfig.embeddedContent.cssUrl ||
          (stylingConfig.embeddedContent.customCSS &&
            Object.keys(stylingConfig.embeddedContent.customCSS).length > 0)
        ) {
          initConfig.customizations = {
            content: {
              strings: stylingConfig.embeddedContent.strings,
              stringIDs: stylingConfig.embeddedContent.stringIDs,
            },
            style: {
              customCSSUrl: stylingConfig.embeddedContent.cssUrl || undefined,
              customCSS: {
                variables: stylingConfig.embeddedContent.customCSS,
              },
            },
          };
        }

        init(initConfig);
      } catch (error) {
        console.error("Failed to initialize ThoughtSpot:", error);
      }
    };

    initializeThoughtSpot();
  }, [appConfig.thoughtspotUrl]); // Removed stylingConfig.embeddedContent dependency

  const handleUserChange = (userId: string) => {
    // In a real app, you would fetch user data here
    const users = [
      { id: "1", name: "John Doe" },
      { id: "2", name: "Jane Smith" },
      { id: "3", name: "Bob Johnson" },
    ];
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
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
    setStandardMenus((prev) => {
      const updated = prev.map((menu) =>
        menu.id === id ? { ...menu, [field]: value } : menu
      );
      return updated;
    });

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
  };

  const updateHomePageConfig = (config: HomePageConfig) => {
    setHomePageConfig(config);
  };

  const updateAppConfig = (config: AppConfig) => {
    setAppConfig(config);
  };

  const updateFullAppConfig = (config: FullAppConfig) => {
    setFullAppConfig(config);
  };

  const updateStylingConfig = (config: StylingConfig) => {
    setStylingConfig(config);
  };

  const addCustomMenu = (menu: CustomMenu) => {
    console.log("addCustomMenu called with:", menu.name, "id:", menu.id);
    setCustomMenus((prev) => [...prev, menu]);

    // If the menu is enabled, add it to the menu order
    if (menu.enabled) {
      setMenuOrder((prev) => [...prev, menu.id]);
    }
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
    setCustomMenus((prev) => prev.filter((m) => m.id !== id));

    // Remove from menu order
    setMenuOrder((prev) => prev.filter((menuId) => menuId !== id));
  };

  const clearAllConfigurations = () => {
    // Reset to default values
    setStandardMenus(DEFAULT_CONFIG.standardMenus);
    setCustomMenus(DEFAULT_CONFIG.customMenus);
    setMenuOrder(DEFAULT_CONFIG.menuOrder);
    setHomePageConfig(DEFAULT_CONFIG.homePageConfig);
    setAppConfig(DEFAULT_CONFIG.appConfig);
    setFullAppConfig(DEFAULT_CONFIG.fullAppConfig);
    setStylingConfig(DEFAULT_CONFIG.stylingConfig);

    // Clear localStorage
    clearAllStorage();
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
      },
      customName
    );
  };

  const handleImportConfiguration = async (file: File) => {
    const result = await importConfiguration(file);
    if (result.success && result.data) {
      const config = result.data;
      setStandardMenus(config.standardMenus);
      setCustomMenus(config.customMenus);
      setMenuOrder(config.menuOrder);
      setHomePageConfig(config.homePageConfig);
      setAppConfig(config.appConfig);
      setFullAppConfig(config.fullAppConfig);
      setStylingConfig(config.stylingConfig);
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  };

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
            currentUser={currentUser}
            onUserChange={handleUserChange}
            backgroundColor={stylingConfig.application.topBar.backgroundColor}
            foregroundColor={stylingConfig.application.topBar.foregroundColor}
          />

          {/* Main Content Area */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Side Navigation */}
            <SideNav
              onSettingsClick={() => setIsSettingsOpen(true)}
              standardMenus={standardMenus}
              customMenus={customMenus}
              menuOrder={menuOrder}
              onMenuOrderChange={setMenuOrder}
              backgroundColor={
                stylingConfig.application.sidebar.backgroundColor
              }
              foregroundColor={
                stylingConfig.application.sidebar.foregroundColor
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
            standardMenus={standardMenus}
            updateStandardMenu={updateStandardMenu}
            homePageConfig={homePageConfig}
            updateHomePageConfig={updateHomePageConfig}
            appConfig={appConfig}
            updateAppConfig={updateAppConfig}
            fullAppConfig={fullAppConfig}
            updateFullAppConfig={updateFullAppConfig}
            customMenus={customMenus}
            addCustomMenu={addCustomMenu}
            updateCustomMenu={updateCustomMenu}
            deleteCustomMenu={deleteCustomMenu}
            stylingConfig={stylingConfig}
            updateStylingConfig={updateStylingConfig}
            clearAllConfigurations={clearAllConfigurations}
            exportConfiguration={handleExportConfiguration}
            importConfiguration={handleImportConfiguration}
            initialTab={settingsInitialTab}
            initialSubTab={settingsInitialSubTab}
          />
        </div>
      </SessionChecker>
    </AppContext.Provider>
  );
}
