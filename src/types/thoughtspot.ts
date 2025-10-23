// ThoughtSpot SDK Types
export interface ThoughtSpotEmbedInstance {
  render?: () => Promise<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  destroy?: () => void;
  sendMessage?: (message: string) => Promise<{
    container?: HTMLElement;
    error?: string;
    viz?: unknown;
  }>;
}

export interface ThoughtSpotInitConfig {
  thoughtSpotHost: string;
  authType: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  locale?: string; // User locale preference
  additionalFlags?: Record<string, boolean>;
  customizations?: {
    content?: {
      strings?: Record<string, string>;
      stringIDs?: Record<string, string>;
    };
    style?: {
      customCSSUrl?: string;
      customCSS?: {
        variables?: Record<string, string>;
        rules_UNSTABLE?: Record<string, Record<string, string>>;
      };
    };
  };
}

export interface ThoughtSpotEmbedConfig {
  worksheetId?: string;
  liveboardId?: string;
  answerId?: string;
  locale?: string; // User locale preference
  frameParams?: {
    width: string;
    height: string;
  };
  searchOptions?: {
    searchQuery: string;
  };
  hiddenActions?: string[];
  runtimeFilters?: RuntimeFilter[];
  customizations?: {
    iconSpriteUrl?: string;
    content: {
      strings: Record<string, string>;
      stringIDs: Record<string, string>;
    };
    style: {
      customCSSUrl?: string;
      customCSS: {
        variables: Record<string, string>;
        rules_UNSTABLE: Record<string, Record<string, string>>;
      };
    };
  };
  [key: string]: unknown; // Allow additional properties from embed flags
}

export interface ThoughtSpotSearchEmbedConfig {
  frameParams: Record<string, string | number | boolean | undefined>;
  dataSource: string;
  dataPanelV2?: boolean;
  collapseDataSources?: boolean;
  locale?: string; // User locale preference
  searchOptions?: {
    searchTokenString: string;
    executeSearch: boolean;
  };
  hiddenActions?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  runtimeFilters?: RuntimeFilter[];
  customizations?: {
    iconSpriteUrl?: string;
    content: {
      strings: Record<string, string>;
      stringIDs: Record<string, string>;
    };
    style: {
      customCSSUrl?: string;
      customCSS: {
        variables: Record<string, string>;
        rules_UNSTABLE: Record<string, Record<string, string>>;
      };
    };
  };
  [key: string]: unknown; // Allow additional properties from embed flags
}

export interface ThoughtSpotBaseEmbedConfig {
  frameParams: {
    width: string;
    height: string;
  };
  locale?: string; // User locale preference
  runtimeFilters?: RuntimeFilter[];
  customizations: {
    iconSpriteUrl?: string;
    content: {
      strings: Record<string, string>;
      stringIDs: Record<string, string>;
    };
    style: {
      customCSSUrl?: string;
      customCSS: {
        variables: Record<string, string>;
        rules_UNSTABLE: Record<string, Record<string, string>>;
      };
    };
  };
  [key: string]: unknown; // Allow additional properties from embed flags
}

export interface ThoughtSpotContent {
  id: string;
  name: string;
  type: "liveboard" | "answer" | "model" | "worksheet";
  description?: string;
  authorName?: string;
  created?: number;
  modified?: number;
  lastAccessed?: number;
}

export interface ThoughtSpotModelDetails extends ThoughtSpotContent {
  columns?: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
}

export interface SavedConfiguration {
  name: string;
  description?: string;
  config: Record<string, unknown>;
  filename: string;
}

// Configuration types
export interface HomePageConfig {
  type: "html" | "url" | "embed";
  value: string;
  backgroundColor?: string;
  maintainAspectRatio?: boolean;
}

export interface AppConfig {
  thoughtspotUrl: string;
  applicationName: string;
  logo: string;
  earlyAccessFlags: string;
  favicon?: string;
  faviconSyncEnabled?: boolean;
  showFooter: boolean;
  chatbot?: {
    enabled: boolean;
    defaultModelId?: string;
    selectedModelIds?: string[];
    welcomeMessage?: string;
    position?: "bottom-right" | "bottom-left";
    spotgptApiKey?: string;
  };
}

export interface FullAppConfig {
  showPrimaryNavbar: boolean;
  hideHomepageLeftNav: boolean;
}

export interface StandardMenu {
  id: string;
  name: string;
  enabled: boolean;
  icon: string;
  homePageType?: string;
  homePageValue?: string;
  homePageBackgroundColor?: string;
  homePageMaintainAspectRatio?: boolean;
  tagFilter?: string;
  modelId?: string;
  contentId?: string;
  namePattern?: string;
  spotterModelId?: string;
  spotterSearchQuery?: string;
  searchDataSource?: string;
  searchTokenString?: string;
  runSearch?: boolean;
  excludeSystemContent?: boolean;
}

export interface ConfigurationData {
  standardMenus: StandardMenu[];
  customMenus: CustomMenu[];
  menuOrder: string[];
  homePageConfig: HomePageConfig;
  appConfig: AppConfig;
  fullAppConfig: FullAppConfig;
  stylingConfig: StylingConfig;
  userConfig: UserConfig;
}

export interface ConfigurationSource {
  type: "file" | "github";
  data: File | string;
}

export interface CustomMenu {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  contentSelection: {
    type: "specific" | "tag" | "direct";
    specificContent?: {
      liveboards: string[];
      answers: string[];
    };
    tagIdentifiers?: string[];
    contentType?: "answer" | "liveboard";
    // Direct embed configuration
    directEmbed?: {
      type: "liveboard" | "answer" | "spotter";
      contentId: string;
      contentName?: string;
      contentDescription?: string;
    };
  };
}

export interface ThoughtSpotTag {
  id: string;
  name: string;
  color: string;
}

// User access control types
export interface HiddenActionsConfig {
  enabled: boolean;
  actions: string[]; // Array of action names (Action enum values or custom strings)
}

export interface UserAccess {
  standardMenus: {
    home: boolean;
    favorites: boolean;
    "my-reports": boolean;
    spotter: boolean;
    search: boolean;
    "full-app": boolean;
    "all-content": boolean;
  };
  customMenus: string[]; // Array of custom menu IDs that the user can access
  hiddenActions?: HiddenActionsConfig; // Configuration for hidden actions
  runtimeFilters?: RuntimeFilter[]; // User-specific runtime filters
}

export interface User {
  id: string;
  name: string;
  description?: string;
  locale?: string; // User locale preference, defaults to "en"
  access: UserAccess;
}

export interface UserConfig {
  users: User[];
  currentUserId?: string;
}

// Embed-specific flags configuration
export interface EmbedFlags {
  spotterEmbed?: Record<string, unknown>;
  liveboardEmbed?: Record<string, unknown>;
  searchEmbed?: Record<string, unknown>;
  appEmbed?: Record<string, unknown>;
}

// Styling configuration types
export interface ApplicationStyles {
  topBar: {
    backgroundColor: string;
    foregroundColor: string;
    logoUrl?: string;
  };
  sidebar: {
    backgroundColor: string;
    foregroundColor: string;
    hoverColor?: string;
    selectedColor?: string;
    selectedTextColor?: string;
  };
  footer: {
    backgroundColor: string;
    foregroundColor: string;
  };
  dialogs: {
    backgroundColor: string;
    foregroundColor: string;
  };
  // New comprehensive styling options
  buttons: {
    primary: {
      backgroundColor: string;
      foregroundColor: string;
      borderColor: string;
      hoverBackgroundColor: string;
      hoverForegroundColor: string;
    };
    secondary: {
      backgroundColor: string;
      foregroundColor: string;
      borderColor: string;
      hoverBackgroundColor: string;
      hoverForegroundColor: string;
    };
  };
  backgrounds: {
    mainBackground: string;
    contentBackground: string;
    cardBackground: string;
    borderColor: string;
  };
  typography: {
    primaryColor: string;
    secondaryColor: string;
    linkColor: string;
    linkHoverColor: string;
  };
  // Theme selection
  selectedTheme?: string;
}

export interface EmbeddedContentCustomization {
  strings: Record<string, string>;
  stringIDs: Record<string, string>;
  cssUrl?: string;
  iconSpriteUrl?: string;
  customCSS: {
    variables?: Record<string, string>;
    rules_UNSTABLE?: Record<string, Record<string, string>>;
  };
}

export interface StylingConfig {
  application: ApplicationStyles;
  embeddedContent: EmbeddedContentCustomization;
  embedFlags?: EmbedFlags;
  doubleClickHandling?: DoubleClickHandlingConfig;
  embedDisplay?: {
    hideTitle?: boolean;
    hideDescription?: boolean;
  };
}

// Double-click event handling configuration
export interface DoubleClickHandlingConfig {
  enabled: boolean;
  showDefaultModal: boolean;
  customJavaScript?: string;
  modalTitle?: string;
}

// Runtime filter types
export enum RuntimeFilterOp {
  /**
   * Equals
   */
  EQ = "EQ",
  /**
   * Does not equal
   */
  NE = "NE",
  /**
   * Less than
   */
  LT = "LT",
  /**
   * Less than or equal to
   */
  LE = "LE",
  /**
   * Greater than
   */
  GT = "GT",
  /**
   * Greater than or equal to
   */
  GE = "GE",
  /**
   * Contains
   */
  CONTAINS = "CONTAINS",
  /**
   * Begins with
   */
  BEGINS_WITH = "BEGINS_WITH",
  /**
   * Ends with
   */
  ENDS_WITH = "ENDS_WITH",
  /**
   * Between, inclusive of higher value
   */
  BW_INC_MAX = "BW_INC_MAX",
  /**
   * Between, inclusive of lower value
   */
  BW_INC_MIN = "BW_INC_MIN",
  /**
   * Between, inclusive of both higher and lower value
   */
  BW_INC = "BW_INC",
  /**
   * Between, non-inclusive
   */
  BW = "BW",
  /**
   * Is included in this list of values
   */
  IN = "IN",
  /**
   * Is not included in this list of values
   */
  NOT_IN = "NOT_IN",
}

export interface RuntimeFilter {
  columnName: string;
  operator: RuntimeFilterOp;
  values: (string | number | boolean)[];
}

// Double-click event data structure
export interface VizPointDoubleClickEvent {
  vizId: string;
  vizName: string;
  selectedPoints: {
    selectedAttributes: {
      column: {
        dataType: string;
        name: string;
      };
      value: string;
    }[];
    selectedMeasures: {
      column: {
        dataType: string;
        name: string;
      };
      value: number;
    }[];
  }[];
  clickedPoints?: {
    selectedAttributes: {
      column: {
        dataType: string;
        name: string;
      };
      value: string;
    }[];
    selectedMeasures: {
      column: {
        dataType: string;
        name: string;
      };
      value: number;
    }[];
  }[];
  [key: string]: unknown; // Allow for additional properties
}
