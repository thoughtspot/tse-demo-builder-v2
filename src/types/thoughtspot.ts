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
  customCSS: Record<string, string>;
}

export interface StylingConfig {
  application: ApplicationStyles;
  embeddedContent: EmbeddedContentCustomization;
}
