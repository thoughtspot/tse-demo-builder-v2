"use client";

import { useState, createContext, useContext, useEffect } from "react";
import TopBar from "./TopBar";
import SideNav from "./SideNav";
import SettingsModal from "./SettingsModal";
import Footer from "./Footer";
import { ThoughtSpotContent } from "../types/thoughtspot";
import { CustomMenu } from "../types/thoughtspot";

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
  clearAllConfigurations: () => void;
  openSettingsWithTab: (tab?: string, subTab?: string) => void;
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
  const [standardMenus, setStandardMenus] = useState<StandardMenu[]>(
    () =>
      loadFromStorage(STORAGE_KEYS.STANDARD_MENUS, [
        {
          id: "home",
          icon: "🏠",
          name: "Home",
          enabled: true,
          homePageType: "html",
          homePageValue:
            "<div style='padding: 20px; text-align: center;'><h1>Welcome to TSE Demo Builder</h1><p>Configure your home page content in the settings.</p></div>",
        },
        { id: "favorites", icon: "⭐", name: "Favorites", enabled: true },
        { id: "my-reports", icon: "📊", name: "My Reports", enabled: true },
        { id: "spotter", icon: "🔍", name: "Spotter", enabled: true },
        { id: "search", icon: "🔎", name: "Search", enabled: true },
        { id: "full-app", icon: "🌐", name: "Full App", enabled: true },
      ]) as StandardMenu[]
  );

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

  // Full app configuration state
  const [fullAppConfig, setFullAppConfig] = useState<FullAppConfig>(
    () =>
      loadFromStorage(STORAGE_KEYS.FULL_APP_CONFIG, {
        showPrimaryNavbar: false,
        hideHomepageLeftNav: false,
      }) as FullAppConfig
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

  // Update Full App icon to new icon if it's still using the old one
  useEffect(() => {
    const fullAppMenu = standardMenus.find((menu) => menu.id === "full-app");
    if (fullAppMenu && fullAppMenu.icon === "📱") {
      updateStandardMenu("full-app", "icon", "🌐");
    }
  }, [standardMenus]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.HOME_PAGE_CONFIG, homePageConfig);
  }, [homePageConfig]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.APP_CONFIG, appConfig);
  }, [appConfig]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.FULL_APP_CONFIG, fullAppConfig);
  }, [fullAppConfig]);

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

        init({
          thoughtSpotHost: appConfig.thoughtspotUrl,
          authType: AuthType.None,
        });
      } catch (error) {
        console.error("Failed to initialize ThoughtSpot:", error);
      }
    };

    initializeThoughtSpot();
  }, [appConfig.thoughtspotUrl]);

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
    setStandardMenus([
      {
        id: "home",
        icon: "🏠",
        name: "Home",
        enabled: true,
        homePageType: "html",
        homePageValue:
          "<div style='padding: 20px; text-align: center;'><h1>Welcome to TSE Demo Builder</h1><p>Configure your home page content in the settings.</p></div>",
      },
      { id: "favorites", icon: "⭐", name: "Favorites", enabled: true },
      { id: "my-reports", icon: "📊", name: "My Reports", enabled: true },
      { id: "spotter", icon: "🔍", name: "Spotter", enabled: true },
      { id: "search", icon: "🔎", name: "Search", enabled: true },
      { id: "full-app", icon: "🌐", name: "Full App", enabled: true },
    ]);

    setCustomMenus([]);

    setHomePageConfig({
      type: "html",
      value:
        "<div style='padding: 20px; text-align: center;'><h1>Welcome to TSE Demo Builder</h1><p>Configure your home page content in the settings.</p></div>",
    });

    setAppConfig({
      thoughtspotUrl: "https://se-thoughtspot-cloud.thoughtspot.cloud/",
      applicationName: "TSE Demo Builder",
      logo: "",
      earlyAccessFlags: "",
    });

    setFullAppConfig({
      showPrimaryNavbar: false,
      hideHomepageLeftNav: false,
    });

    // Reset menu order
    setMenuOrder([]);

    // Clear localStorage
    clearAllStorage();
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
    clearAllConfigurations,
    openSettingsWithTab,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div
        style={{ height: "100vh", display: "flex", flexDirection: "column" }}
      >
        {/* Top Bar */}
        <TopBar
          title={appConfig.applicationName || "TSE Demo Builder"}
          logoUrl={appConfig.logo || "/ts.png"}
          currentUser={currentUser}
          onUserChange={handleUserChange}
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
            <Footer />
          </div>
        </div>

        {/* Settings Modal */}
        {isSettingsOpen && (
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
            clearAllConfigurations={clearAllConfigurations}
            initialTab={settingsInitialTab}
            initialSubTab={settingsInitialSubTab}
          />
        )}
      </div>
    </AppContext.Provider>
  );
}
