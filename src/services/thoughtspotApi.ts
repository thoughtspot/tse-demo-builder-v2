interface ThoughtSpotMetadata {
  metadata_id: string;
  metadata_name: string;
  metadata_type: string;
  metadata_header?: {
    id: string;
    name: string;
    description?: string;
    type?: string;
    authorName?: string;
    created?: number;
    modified?: number;
  };
  stats?: {
    last_accessed?: number;
  };
}

interface ThoughtSpotUser {
  name: string;
  display_name: string;
}

interface ThoughtSpotTag {
  id: string;
  name: string;
  color: string;
  deleted: boolean;
  hidden: boolean;
  external: boolean;
  deprecated: boolean;
  creation_time_in_millis: number;
  modification_time_in_millis: number;
  author_id: string;
  modifier_id: string;
  owner_id: string;
}

type ThoughtSpotSearchResponse = ThoughtSpotMetadata[];

// Search parameters interface
interface SearchParams {
  metadataTypes?: string[];
  includeStats?: boolean;
  tagIdentifiers?: string[];
  metadataIds?: string[];
  userName?: string;
  isFavorite?: boolean;
  recordOffset?: number;
  recordSize?: number;
}

// Consolidated search function
async function searchMetadata(
  params: SearchParams = {}
): Promise<ThoughtSpotSearchResponse> {
  const {
    metadataTypes = [],
    includeStats = false,
    tagIdentifiers = [],
    metadataIds = [],
    userName,
    isFavorite = false,
    recordOffset = 0,
    recordSize = -1,
  } = params;

  const searchData: Record<string, unknown> = {
    dependent_object_version: "V1",
    include_details: false,
    include_headers: true,
    record_offset: recordOffset,
    record_size: recordSize,
    include_stats: includeStats,
    include_discoverable_objects: true,
    show_resolved_parameters: false,
  };

  // Add metadata types and/or IDs
  if (metadataTypes.length > 0 || metadataIds.length > 0) {
    const metadataArray: Array<{ type?: string; identifier?: string }> = [];

    // If we have specific IDs, create objects with both identifier and type
    if (metadataIds.length > 0) {
      // For specific IDs, we include both identifier and type (if types are provided)
      metadataIds.forEach((id) => {
        const metadataObj: { identifier: string; type?: string } = {
          identifier: id,
        };
        // If we have types, use the first one (assuming all IDs are of the same type)
        // In practice, you might want to pass type information along with the IDs
        if (metadataTypes.length > 0) {
          metadataObj.type = metadataTypes[0];
        }
        metadataArray.push(metadataObj);
      });
    } else {
      // If no specific IDs, just add types for all content of those types
      metadataArray.push(...metadataTypes.map((type) => ({ type })));
    }

    searchData.metadata = metadataArray;
  }

  // Add tag identifiers if provided
  if (tagIdentifiers.length > 0) {
    searchData.tag_identifiers = tagIdentifiers;
  }

  // Add user filter if provided
  if (userName) {
    searchData.author_identifiers = [userName];
  }

  // Add favorite filter if provided
  if (isFavorite) {
    searchData.is_favorite = true;
  }

  return await makeThoughtSpotApiCall("/metadata/search", searchData);
}

import { ThoughtSpotContent } from "../types/thoughtspot";

// Default ThoughtSpot URL - will be overridden by the configured URL
let THOUGHTSPOT_BASE_URL =
  "https://se-thoughtspot-cloud.thoughtspot.cloud/api/rest/2.0";

export function setThoughtSpotBaseUrl(url: string) {
  // Ensure the URL ends with /api/rest/2.0
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  if (!url.endsWith("/api/rest/2.0")) {
    url = url + "/api/rest/2.0";
  }
  THOUGHTSPOT_BASE_URL = url;
}

async function makeThoughtSpotApiCall(
  endpoint: string,
  data: Record<string, unknown>
): Promise<ThoughtSpotSearchResponse> {
  try {
    const response = await fetch(`${THOUGHTSPOT_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include", // Include session cookies
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(
        `API call failed: ${response.status} ${response.statusText}`
      );
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error("ThoughtSpot API call failed:", error);
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
}

async function makeThoughtSpotGetCall(
  endpoint: string
): Promise<Record<string, unknown>> {
  try {
    const response = await fetch(`${THOUGHTSPOT_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include", // Include session cookies
    });

    if (!response.ok) {
      throw new Error(
        `API call failed: ${response.status} ${response.statusText}`
      );
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error("ThoughtSpot GET API call failed:", error);
    // Return empty object instead of throwing to prevent app crashes
    return {};
  }
}

async function makeThoughtSpotTagsCall(
  endpoint: string,
  data: Record<string, unknown>
): Promise<ThoughtSpotTag[]> {
  try {
    const response = await fetch(`${THOUGHTSPOT_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include", // Include session cookies
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(
        `API call failed: ${response.status} ${response.statusText}`
      );
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error("ThoughtSpot tags API call failed:", error);
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
}

export async function fetchLiveboards(): Promise<ThoughtSpotContent[]> {
  try {
    const response = await searchMetadata({
      metadataTypes: ["LIVEBOARD"],
      includeStats: false,
    });

    if (!response || !Array.isArray(response)) {
      console.warn("No metadata array in response, returning empty array");
      return [];
    }

    return response
      .map((item) => ({
        id: item.metadata_id,
        name: item.metadata_name,
        type: "liveboard" as const,
        description: item.metadata_header?.description,
        authorName: item.metadata_header?.authorName,
        created: item.metadata_header?.created,
        modified: item.metadata_header?.modified,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to fetch liveboards:", error);
    return [];
  }
}

export async function fetchLiveboardsWithStats(): Promise<
  ThoughtSpotContent[]
> {
  try {
    const response = await searchMetadata({
      metadataTypes: ["LIVEBOARD"],
      includeStats: true,
    });

    if (!response || !Array.isArray(response)) {
      console.warn("No metadata array in response, returning empty array");
      return [];
    }

    return response
      .map((item) => ({
        id: item.metadata_id,
        name: item.metadata_name,
        type: "liveboard" as const,
        description: item.metadata_header?.description,
        authorName: item.metadata_header?.authorName,
        created: item.metadata_header?.created,
        modified: item.metadata_header?.modified,
        lastAccessed: item.stats?.last_accessed,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to fetch liveboards with stats:", error);
    return [];
  }
}

export async function fetchAnswers(): Promise<ThoughtSpotContent[]> {
  try {
    const response: ThoughtSpotSearchResponse = await makeThoughtSpotApiCall(
      "/metadata/search",
      {
        dependent_object_version: "V1",
        include_details: false,
        include_headers: true,
        record_offset: 0,
        record_size: -1,
        include_stats: false,
        include_discoverable_objects: true,
        show_resolved_parameters: false,
        metadata: [
          {
            type: "ANSWER",
          },
        ],
      }
    );

    // Check if response exists and is an array
    if (!response || !Array.isArray(response)) {
      console.warn("No metadata array in response, returning empty array");
      return [];
    }

    return response
      .map((item) => ({
        id: item.metadata_id,
        name: item.metadata_name,
        type: "answer" as const,
        description: item.metadata_header?.description,
        authorName: item.metadata_header?.authorName,
        created: item.metadata_header?.created,
        modified: item.metadata_header?.modified,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to fetch answers:", error);
    // Return empty array on error
    return [];
  }
}

export async function fetchAnswersWithStats(): Promise<ThoughtSpotContent[]> {
  try {
    const response: ThoughtSpotSearchResponse = await makeThoughtSpotApiCall(
      "/metadata/search",
      {
        dependent_object_version: "V1",
        include_details: false,
        include_headers: true,
        record_offset: 0,
        record_size: -1,
        include_stats: true,
        include_discoverable_objects: true,
        show_resolved_parameters: false,
        metadata: [
          {
            type: "ANSWER",
          },
        ],
      }
    );

    // Check if response exists and is an array
    if (!response || !Array.isArray(response)) {
      console.warn("No metadata array in response, returning empty array");
      return [];
    }

    return response
      .map((item) => ({
        id: item.metadata_id,
        name: item.metadata_name,
        type: "answer" as const,
        description: item.metadata_header?.description,
        authorName: item.metadata_header?.authorName,
        created: item.metadata_header?.created,
        modified: item.metadata_header?.modified,
        lastAccessed: item.stats?.last_accessed,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to fetch answers with stats:", error);
    // Return empty array on error
    return [];
  }
}

export async function fetchModels(): Promise<ThoughtSpotContent[]> {
  try {
    const response: ThoughtSpotSearchResponse = await makeThoughtSpotApiCall(
      "/metadata/search",
      {
        dependent_object_version: "V1",
        include_details: false,
        include_headers: true,
        record_offset: 0,
        record_size: -1,
        include_stats: false,
        include_discoverable_objects: true,
        show_resolved_parameters: false,
        metadata: [
          {
            type: "LOGICAL_TABLE",
          },
        ],
      }
    );

    // Check if response exists and is an array
    if (!response || !Array.isArray(response)) {
      console.warn("No metadata array in response, returning empty array");
      return [];
    }

    // Filter for MODEL and WORKSHEET types (for Spotter)
    return response
      .filter(
        (item) =>
          item.metadata_header?.type === "MODEL" ||
          item.metadata_header?.type === "WORKSHEET"
      )
      .map((item) => ({
        id: item.metadata_id,
        name: item.metadata_name,
        type: "model" as const,
        description: item.metadata_header?.description,
        authorName: item.metadata_header?.authorName,
        created: item.metadata_header?.created,
        modified: item.metadata_header?.modified,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to fetch models:", error);
    // Return empty array on error
    return [];
  }
}

export async function fetchWorksheets(): Promise<ThoughtSpotContent[]> {
  try {
    const response: ThoughtSpotSearchResponse = await makeThoughtSpotApiCall(
      "/metadata/search",
      {
        dependent_object_version: "V1",
        include_details: false,
        include_headers: true,
        record_offset: 0,
        record_size: -1,
        include_stats: false,
        include_discoverable_objects: true,
        show_resolved_parameters: false,
        metadata: [
          {
            type: "LOGICAL_TABLE",
          },
        ],
      }
    );

    // Check if response exists and is an array
    if (!response || !Array.isArray(response)) {
      console.warn("No metadata array in response, returning empty array");
      return [];
    }

    // Filter for WORKSHEET types only (for Search)
    return response
      .filter((item) => item.metadata_header?.type === "WORKSHEET")
      .map((item) => ({
        id: item.metadata_id,
        name: item.metadata_name,
        type: "worksheet" as const,
        description: item.metadata_header?.description,
        authorName: item.metadata_header?.authorName,
        created: item.metadata_header?.created,
        modified: item.metadata_header?.modified,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to fetch worksheets:", error);
    // Return empty array on error
    return [];
  }
}

export async function fetchAllThoughtSpotContent(): Promise<{
  liveboards: ThoughtSpotContent[];
  answers: ThoughtSpotContent[];
  models: ThoughtSpotContent[];
}> {
  try {
    const [liveboards, answers, models] = await Promise.all([
      fetchLiveboards(),
      fetchAnswers(),
      fetchModels(),
    ]);

    return { liveboards, answers, models };
  } catch (error) {
    console.error("Failed to fetch ThoughtSpot content:", error);
    // Return empty arrays on error
    return {
      liveboards: [],
      answers: [],
      models: [],
    };
  }
}

export async function fetchAllThoughtSpotContentWithStats(): Promise<{
  liveboards: ThoughtSpotContent[];
  answers: ThoughtSpotContent[];
}> {
  try {
    const [liveboards, answers] = await Promise.all([
      fetchLiveboardsWithStats(),
      fetchAnswersWithStats(),
    ]);

    return { liveboards, answers };
  } catch (error) {
    console.error("Failed to fetch ThoughtSpot content with stats:", error);
    // Return empty arrays on error
    return {
      liveboards: [],
      answers: [],
    };
  }
}

export async function fetchFavoriteLiveboardsWithStats(): Promise<
  ThoughtSpotContent[]
> {
  try {
    const response: ThoughtSpotSearchResponse = await makeThoughtSpotApiCall(
      "/metadata/search",
      {
        dependent_object_version: "V1",
        include_details: false,
        include_headers: true,
        record_offset: 0,
        record_size: -1,
        include_stats: true,
        include_discoverable_objects: true,
        show_resolved_parameters: false,
        favorite_object_options: {
          include: true,
        },
        metadata: [
          {
            type: "LIVEBOARD",
          },
        ],
      }
    );

    // Check if response exists and is an array
    if (!response || !Array.isArray(response)) {
      console.warn("No metadata array in response, returning empty array");
      return [];
    }

    return response
      .map((item) => ({
        id: item.metadata_id,
        name: item.metadata_name,
        type: "liveboard" as const,
        description: item.metadata_header?.description,
        authorName: item.metadata_header?.authorName,
        created: item.metadata_header?.created,
        modified: item.metadata_header?.modified,
        lastAccessed: item.stats?.last_accessed,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to fetch favorite liveboards with stats:", error);
    // Return empty array on error
    return [];
  }
}

export async function fetchFavoriteAnswersWithStats(): Promise<
  ThoughtSpotContent[]
> {
  try {
    const response: ThoughtSpotSearchResponse = await makeThoughtSpotApiCall(
      "/metadata/search",
      {
        dependent_object_version: "V1",
        include_details: false,
        include_headers: true,
        record_offset: 0,
        record_size: -1,
        include_stats: true,
        include_discoverable_objects: true,
        show_resolved_parameters: false,
        favorite_object_options: {
          include: true,
        },
        metadata: [
          {
            type: "ANSWER",
          },
        ],
      }
    );

    // Check if response exists and is an array
    if (!response || !Array.isArray(response)) {
      console.warn("No metadata array in response, returning empty array");
      return [];
    }

    return response
      .map((item) => ({
        id: item.metadata_id,
        name: item.metadata_name,
        type: "answer" as const,
        description: item.metadata_header?.description,
        authorName: item.metadata_header?.authorName,
        created: item.metadata_header?.created,
        modified: item.metadata_header?.modified,
        lastAccessed: item.stats?.last_accessed,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to fetch favorite answers with stats:", error);
    // Return empty array on error
    return [];
  }
}

export async function fetchFavoritesWithStats(): Promise<{
  liveboards: ThoughtSpotContent[];
  answers: ThoughtSpotContent[];
}> {
  try {
    const [liveboards, answers] = await Promise.all([
      fetchFavoriteLiveboardsWithStats(),
      fetchFavoriteAnswersWithStats(),
    ]);

    return { liveboards, answers };
  } catch (error) {
    console.error("Failed to fetch ThoughtSpot favorites with stats:", error);
    // Return empty arrays on error
    return {
      liveboards: [],
      answers: [],
    };
  }
}

export async function getCurrentUser(): Promise<ThoughtSpotUser | null> {
  try {
    const response = (await makeThoughtSpotGetCall(
      "/auth/session/user"
    )) as Record<string, unknown>;

    if (
      response &&
      typeof response.name === "string" &&
      typeof response.display_name === "string"
    ) {
      return {
        name: response.name,
        display_name: response.display_name,
      };
    }

    console.warn("Invalid user response format:", response);
    return null;
  } catch (error) {
    console.error("Failed to fetch current user:", error);
    return null;
  }
}

export async function fetchUserLiveboardsWithStats(
  userName: string
): Promise<ThoughtSpotContent[]> {
  try {
    const response: ThoughtSpotSearchResponse = await makeThoughtSpotApiCall(
      "/metadata/search",
      {
        dependent_object_version: "V1",
        include_details: false,
        include_headers: true,
        record_offset: 0,
        record_size: -1,
        include_stats: true,
        include_discoverable_objects: true,
        show_resolved_parameters: false,
        created_by_user_identifiers: [userName],
        metadata: [
          {
            type: "LIVEBOARD",
          },
        ],
      }
    );

    // Check if response exists and is an array
    if (!response || !Array.isArray(response)) {
      console.warn("No metadata array in response, returning empty array");
      return [];
    }

    return response
      .map((item) => ({
        id: item.metadata_id,
        name: item.metadata_name,
        type: "liveboard" as const,
        description: item.metadata_header?.description,
        authorName: item.metadata_header?.authorName,
        created: item.metadata_header?.created,
        modified: item.metadata_header?.modified,
        lastAccessed: item.stats?.last_accessed,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to fetch user liveboards with stats:", error);
    // Return empty array on error
    return [];
  }
}

export async function fetchUserAnswersWithStats(
  userName: string
): Promise<ThoughtSpotContent[]> {
  try {
    const response: ThoughtSpotSearchResponse = await makeThoughtSpotApiCall(
      "/metadata/search",
      {
        dependent_object_version: "V1",
        include_details: false,
        include_headers: true,
        record_offset: 0,
        record_size: -1,
        include_stats: true,
        include_discoverable_objects: true,
        show_resolved_parameters: false,
        created_by_user_identifiers: [userName],
        metadata: [
          {
            type: "ANSWER",
          },
        ],
      }
    );

    // Check if response exists and is an array
    if (!response || !Array.isArray(response)) {
      console.warn("No metadata array in response, returning empty array");
      return [];
    }

    return response
      .map((item) => ({
        id: item.metadata_id,
        name: item.metadata_name,
        type: "answer" as const,
        description: item.metadata_header?.description,
        authorName: item.metadata_header?.authorName,
        created: item.metadata_header?.created,
        modified: item.metadata_header?.modified,
        lastAccessed: item.stats?.last_accessed,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to fetch user answers with stats:", error);
    // Return empty array on error
    return [];
  }
}

export async function fetchUserContentWithStats(userName: string): Promise<{
  liveboards: ThoughtSpotContent[];
  answers: ThoughtSpotContent[];
}> {
  try {
    const [liveboards, answers] = await Promise.all([
      fetchUserLiveboardsWithStats(userName),
      fetchUserAnswersWithStats(userName),
    ]);

    return { liveboards, answers };
  } catch (error) {
    console.error(
      "Failed to fetch ThoughtSpot user content with stats:",
      error
    );
    // Return empty arrays on error
    return {
      liveboards: [],
      answers: [],
    };
  }
}

export async function fetchTags(): Promise<
  Array<{
    id: string;
    name: string;
    color: string;
  }>
> {
  try {
    const response = await makeThoughtSpotTagsCall("/tags/search", {});

    if (!response || !Array.isArray(response)) {
      console.warn("No tags array in response, returning empty array");
      return [];
    }

    return response
      .filter((tag: ThoughtSpotTag) => !tag.deleted && !tag.hidden)
      .map((tag: ThoughtSpotTag) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return [];
  }
}

export async function fetchContentByTags(tagIdentifiers: string[]): Promise<{
  liveboards: ThoughtSpotContent[];
  answers: ThoughtSpotContent[];
}> {
  try {
    const response = await searchMetadata({
      metadataTypes: ["LIVEBOARD", "ANSWER"],
      includeStats: true,
      tagIdentifiers: tagIdentifiers,
    });

    if (!response || !Array.isArray(response)) {
      console.warn("No metadata array in response, returning empty arrays");
      return { liveboards: [], answers: [] };
    }

    const liveboards: ThoughtSpotContent[] = [];
    const answers: ThoughtSpotContent[] = [];

    response.forEach((item) => {
      const contentItem = {
        id: item.metadata_id,
        name: item.metadata_name,
        type: item.metadata_type.toLowerCase() as "liveboard" | "answer",
        description: item.metadata_header?.description,
        authorName: item.metadata_header?.authorName,
        created: item.metadata_header?.created,
        modified: item.metadata_header?.modified,
        lastAccessed: item.stats?.last_accessed,
      };

      if (item.metadata_type === "LIVEBOARD") {
        liveboards.push(contentItem);
      } else if (item.metadata_type === "ANSWER") {
        answers.push(contentItem);
      }
    });

    return {
      liveboards: liveboards.sort((a, b) => a.name.localeCompare(b.name)),
      answers: answers.sort((a, b) => a.name.localeCompare(b.name)),
    };
  } catch (error) {
    console.error("Failed to fetch content by tags:", error);
    return { liveboards: [], answers: [] };
  }
}

export async function fetchContentByIds(
  liveboardIds: string[],
  answerIds: string[]
): Promise<{
  liveboards: ThoughtSpotContent[];
  answers: ThoughtSpotContent[];
}> {
  try {
    const allIds = [...liveboardIds, ...answerIds];
    if (allIds.length === 0) {
      return { liveboards: [], answers: [] };
    }

    const response = await searchMetadata({
      metadataTypes: ["LIVEBOARD", "ANSWER"],
      includeStats: true,
      metadataIds: allIds,
    });

    if (!response || !Array.isArray(response)) {
      console.warn("No metadata array in response, returning empty arrays");
      return { liveboards: [], answers: [] };
    }

    const liveboards: ThoughtSpotContent[] = [];
    const answers: ThoughtSpotContent[] = [];

    response.forEach((item) => {
      const contentItem = {
        id: item.metadata_id,
        name: item.metadata_name,
        type: item.metadata_type.toLowerCase() as "liveboard" | "answer",
        description: item.metadata_header?.description,
        authorName: item.metadata_header?.authorName,
        created: item.metadata_header?.created,
        modified: item.metadata_header?.modified,
        lastAccessed: item.stats?.last_accessed,
      };

      if (item.metadata_type === "LIVEBOARD") {
        liveboards.push(contentItem);
      } else if (item.metadata_type === "ANSWER") {
        answers.push(contentItem);
      }
    });

    return {
      liveboards: liveboards.sort((a, b) => a.name.localeCompare(b.name)),
      answers: answers.sort((a, b) => a.name.localeCompare(b.name)),
    };
  } catch (error) {
    console.error("Failed to fetch content by IDs:", error);
    return { liveboards: [], answers: [] };
  }
}

export async function fetchThoughtSpotVersion(): Promise<string | null> {
  try {
    const response = await makeThoughtSpotGetCall("/system");

    if (response && typeof response.release_version === "string") {
      return response.release_version;
    }

    console.warn("Invalid system response format:", response);
    return null;
  } catch (error) {
    console.error("Failed to fetch ThoughtSpot version:", error);
    return null;
  }
}
