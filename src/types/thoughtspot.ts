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
