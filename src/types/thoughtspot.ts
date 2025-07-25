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
