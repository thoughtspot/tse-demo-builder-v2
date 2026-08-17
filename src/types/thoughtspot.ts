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
  username?: string;
  password?: string;
  getAuthToken?: () => Promise<string>;
  locale?: string;
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
  vizId?: string; // Optional viz ID for embedding specific visualizations from a liveboard
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

export type AuthTypeOption =
  | "None"
  | "Basic"
  | "EmbeddedSSO"
  | "TrustedAuthTokenCookieless";

export type TrustedAuthMode = "token" | "secret_key";

export interface AuthConfig {
  authType: AuthTypeOption;
  username?: string;
  password?: string; // Basic auth only; not exported
  trustedAuthMode?: TrustedAuthMode;
  trustedAuthToken?: string; // Manual token; not exported
  secretKeyOrgId?: string; // For secret_key mode; org to generate the token for; defaults to "0"
  orgName?: string; // The org this configuration expects to run in, for all auth types; unset means any org is allowed
}

export interface StarterPrompt {
  id: string;
  displayText: string;
  fullPrompt: string;
}

export interface LiveboardButtonOption {
  enabled?: boolean;
  label?: string;
}

export interface LiveboardSearchButtonOption extends LiveboardButtonOption {
  searchDataSource?: string;
  spotterModelId?: string;
  searchTokenString?: string;
}

export interface SpotterVizConfig {
  enabled: boolean;
  brandName?: string;
  brandHeadline?: string;
  description?: string;
  inputChatPlaceholder?: string;
  hideStarterPrompts?: boolean;
  customStarterPrompts?: StarterPrompt[];
  createLiveboardButtonLabel?: string;
  newLiveboard?: LiveboardButtonOption;
  newSearch?: LiveboardSearchButtonOption;
  newAISearch?: LiveboardSearchButtonOption;
}

export interface LoginPageConfig {
  enabled: boolean;
  subtitle?: string;
}

export interface AppConfig {
  thoughtspotUrl: string;
  applicationName: string;
  logo: string;
  earlyAccessFlags: string;
  favicon?: string;
  faviconSyncEnabled?: boolean;
  showFooter: boolean;
  showLogo?: boolean;
  showVizPicker?: boolean;
  showHelpButton?: boolean;
  loginPage?: LoginPageConfig;
  authConfig?: AuthConfig;
  chatbot?: {
    enabled: boolean;
    defaultModelId?: string;
    selectedModelIds?: string[];
    welcomeMessage?: string;
    position?: "bottom-right" | "bottom-left";
    spotgptApiKey?: string;
  };
  spotterViz?: SpotterVizConfig;
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
    type: "specific" | "tag" | "collection" | "direct";
    specificContent?: {
      liveboards: string[];
      answers: string[];
    };
    tagIdentifiers?: string[];
    collectionId?: string;
    collectionName?: string;
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

export interface ThoughtSpotCollection {
  id: string;
  name: string;
}

// User access control types
export interface HiddenActionsConfig {
  enabled: boolean;
  actions: string[]; // Array of action names (Action enum values or custom strings)
}

export type SDKActionsMode = "disabled" | "hidden" | "visible";

export interface SDKActionsConfig {
  enabled: boolean;
  mode: SDKActionsMode;
  actions: string[];
  disabledReason?: string;
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
  hiddenActions?: HiddenActionsConfig; // Legacy: kept for backward compatibility
  sdkActionsOverride?: SDKActionsConfig; // Per-user override for SDK action visibility
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

// Layout configuration types
export type NavPosition = 'side' | 'top';
export type SideNavBehavior = 'hover-expand' | 'always-expanded' | 'icon-only';
export type TopBarHeight = 'compact' | 'default' | 'tall';
export type TopNavAlignment = 'left' | 'center';
export type TopNavStyle = 'tabs' | 'push-buttons';
export type NavButtonGap = 'none' | 'tight' | 'normal' | 'relaxed';
export type BorderRadius = 'sharp' | 'soft' | 'round';
export type Density = 'compact' | 'default' | 'comfortable';
export type ShadowStyle = 'flat' | 'subtle' | 'elevated';
export type CardStyle = 'bordered' | 'shadowed' | 'borderless';
export type AnimationSpeed = 'none' | 'fast' | 'default';
export type FontFamily = 'system' | 'inter' | 'roboto' | 'dm-sans' | 'custom';

export interface LayoutConfig {
  navPosition: NavPosition;
  sideNavBehavior: SideNavBehavior;
  topBarHeight: TopBarHeight;
  topNavAlignment?: TopNavAlignment;
  topNavStyle?: TopNavStyle;
  navButtonGap?: NavButtonGap;
  borderRadius: BorderRadius;
  density: Density;
  shadowStyle: ShadowStyle;
  cardStyle: CardStyle;
  animationSpeed: AnimationSpeed;
  fontFamily: FontFamily;
  customFontFamily?: string;
  hideBorders?: boolean;
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
  sdkActions?: SDKActionsConfig;
  standardActions?: StandardActionConfig[];
  customActions?: CustomActionConfig[];
  embedDisplay?: {
    hideTitle?: boolean;
    hideDescription?: boolean;
  };
  layout?: LayoutConfig;
}

// Double-click event handling configuration
export interface DoubleClickHandlingConfig {
  enabled: boolean;
  showDefaultModal: boolean;
  customJavaScript?: string;
  modalTitle?: string;
}

// Custom Action Position enum (matches SDK CustomActionsPosition)
export enum CustomActionPosition {
  PRIMARY = "PRIMARY",
  MENU = "MENU",
  CONTEXT_MENU = "CONTEXTMENU",
}

// Custom Action Target enum (matches SDK CustomActionTarget)
export enum CustomActionTarget {
  LIVEBOARD = "LIVEBOARD",
  VIZ = "VIZ",
  ANSWER = "ANSWER",
  SPOTTER = "SPOTTER",
}

// Handler type for custom actions
export type CustomActionHandlerType = "prebuilt" | "custom";

// Pre-built handler parameter configuration
export interface PrebuiltHandlerParam {
  name: string;
  type: "string" | "number" | "boolean" | "select" | "multiselect";
  label: string;
  description?: string;
  required?: boolean;
  defaultValue?: string | number | boolean | string[];
  options?: { value: string; label: string }[]; // For select/multiselect types
}

// Pre-built handler definition (used in the registry)
export interface PrebuiltHandlerDefinition {
  id: string;
  name: string;
  description: string;
  category?: string;
  parameters?: PrebuiltHandlerParam[];
  // The actual handler function is stored in the registry, not serialized
}

// Custom action handler configuration (stored in config)
export interface CustomActionHandlerConfig {
  type: CustomActionHandlerType;
  // For prebuilt handlers
  prebuiltHandlerId?: string;
  prebuiltHandlerParams?: Record<string, string | number | boolean | string[]>;
  // For custom code handlers
  customJavaScript?: string;
}

// Custom action configuration (stored in config)
export interface CustomActionConfig {
  // Required fields
  id: string;
  name: string;
  position: CustomActionPosition;
  target: CustomActionTarget;
  // Optional scoping fields
  metadataIds?: {
    answerIds?: string[];
    liveboardIds?: string[];
    vizIds?: string[];
  };
  dataModelIds?: {
    modelIds?: string[];
    columnNames?: string[]; // Format: "modelId::columnName"
  };
  orgIds?: string[];
  groupIds?: string[];
  // Handler configuration
  handler: CustomActionHandlerConfig;
  // UI metadata
  enabled: boolean;
  description?: string;
}

// Standard Action Definition - defines a pre-built action with its handler
export interface StandardActionDefinition {
  id: string;
  name: string;
  description: string;
  defaultPosition: CustomActionPosition;
  defaultTarget: CustomActionTarget;
  // The handler ID that references the actual implementation
  handlerId: string;
  // Default parameters for the handler
  defaultParams?: Record<string, string | number | boolean | string[]>;
  // Whether the action supports metadata filtering
  supportsMetadataFiltering?: boolean;
}

// Standard Action Configuration - user's configuration for a standard action
export interface StandardActionConfig {
  // Reference to the standard action definition
  standardActionId: string;
  // User-configurable fields
  enabled: boolean;
  position: CustomActionPosition;
  target: CustomActionTarget;
  // Optional scoping fields
  metadataIds?: {
    answerIds?: string[];
    liveboardIds?: string[];
    vizIds?: string[];
  };
  // Custom parameters that override defaults
  params?: Record<string, string | number | boolean | string[]>;
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
