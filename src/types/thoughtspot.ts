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

export interface CustomMenu {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  contentSelection: {
    type: "specific" | "tag";
    specificContent?: {
      liveboards: string[];
      answers: string[];
    };
    tagIdentifiers?: string[];
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
  };
  customMenus: string[]; // Array of custom menu IDs that the user can access
  hiddenActions?: HiddenActionsConfig; // Configuration for hidden actions
}

export interface User {
  id: string;
  name: string;
  description?: string;
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
}

export interface EmbeddedContentCustomization {
  strings: Record<string, string>;
  stringIDs: Record<string, string>;
  cssUrl?: string;
  customCSS: {
    variables?: Record<string, string>;
    rules_UNSTABLE?: Record<string, Record<string, string>>;
  };
}

export interface StylingConfig {
  application: ApplicationStyles;
  embeddedContent: EmbeddedContentCustomization;
  embedFlags?: EmbedFlags;
}
