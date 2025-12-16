import { ThoughtSpotModelDetails } from "../types/thoughtspot";

interface ThoughtSpotMetadata {
  metadata_id: string;
  metadata_name: string;
  metadata_type: string;
  metadata_header?: {
    id: string;
    name: string;
    description?: string;
    type?: string;
    subType?: string;
    authorName?: string;
    created?: number;
    modified?: number;
  };
  stats?: {
    last_accessed?: number;
  };
  details?: {
    columns?: Array<{
      name: string;
      type: string;
      description?: string;
    }>;
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
  metadataWithTypes?: Array<{ identifier: string; type: string }>;
  userName?: string;
  isFavorite?: boolean;
  recordOffset?: number;
  recordSize?: number;
}

// Helper function to get the correct type for LOGICAL_TABLE metadata
function getLogicalTableType(metadataHeader?: {
  type?: string;
  subType?: string;
}): string | undefined {
  // Newer API version uses subType
  if (metadataHeader?.subType) {
    return metadataHeader.subType;
  }
  // Older API version uses type
  if (metadataHeader?.type) {
    return metadataHeader.type;
  }
  return undefined;
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
    metadataWithTypes = [],
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
  if (
    metadataTypes.length > 0 ||
    metadataIds.length > 0 ||
    metadataWithTypes.length > 0
  ) {
    const metadataArray: Array<{ type?: string; identifier?: string }> = [];

    // If we have metadata with types, use those directly (highest priority)
    if (metadataWithTypes.length > 0) {
      metadataArray.push(...metadataWithTypes);
    }
    // If we have specific IDs, create objects with both identifier and type
    else if (metadataIds.length > 0) {
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
      // Handle 401 (Unauthorized) gracefully - this is expected when not logged in
      if (response.status === 401) {
        console.log(
          "User not authenticated (401) - this is expected when not logged in"
        );
        return [];
      }

      throw new Error(
        `API call failed: ${response.status} ${response.statusText}`
      );
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    // Don't log 401 errors as they are expected when not logged in
    if (error instanceof Error && error.message.includes("401")) {
      console.log(
        "User not authenticated (401) - this is expected when not logged in"
      );
    } else {
      console.error("ThoughtSpot API call failed:", error);
    }
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
}

async function makeThoughtSpotGetCall(
  endpoint: string
): Promise<Record<string, unknown>> {
  try {
    const url = `${THOUGHTSPOT_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include", // Include session cookies
    });

    console.log(
      "makeThoughtSpotGetCall: Response status:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      // Handle 401 (Unauthorized) gracefully - this is expected when not logged in
      if (response.status === 401) {
        console.log(
          "User not authenticated (401) - this is expected when not logged in"
        );
        return {};
      }

      throw new Error(
        `API call failed: ${response.status} ${response.statusText}`
      );
    }

    const responseData = await response.json();
    console.log("makeThoughtSpotGetCall: Response data:", responseData);
    return responseData;
  } catch (error) {
    console.log("makeThoughtSpotGetCall: Error occurred:", error);
    // Don't log 401 errors as they are expected when not logged in
    if (error instanceof Error && error.message.includes("401")) {
      console.log(
        "User not authenticated (401) - this is expected when not logged in"
      );
    } else {
      console.error("ThoughtSpot GET API call failed:", error);
    }
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
      // Handle 401 (Unauthorized) gracefully - this is expected when not logged in
      if (response.status === 401) {
        console.log(
          "User not authenticated (401) - this is expected when not logged in"
        );
        return [];
      }

      throw new Error(
        `API call failed: ${response.status} ${response.statusText}`
      );
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    // Don't log 401 errors as they are expected when not logged in
    if (error instanceof Error && error.message.includes("401")) {
      console.log(
        "User not authenticated (401) - this is expected when not logged in"
      );
    } else {
      console.error("ThoughtSpot tags API call failed:", error);
    }
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
    const response = await searchMetadata({
      metadataTypes: ["LOGICAL_TABLE"],
      includeStats: false,
    });

    // Check if response exists and is an array
    if (!response || !Array.isArray(response)) {
      console.warn("No metadata array in response, returning empty array");
      return [];
    }

    // Filter for LOGICAL_TABLE types where subType/type is WORKSHEET or MODEL (for Spotter)
    return response
      .filter((item) => {
        const isLogicalTable = item.metadata_type === "LOGICAL_TABLE";
        const logicalTableType = getLogicalTableType(item.metadata_header);
        const hasValidType =
          logicalTableType === "WORKSHEET" || logicalTableType === "MODEL";
        return isLogicalTable && hasValidType;
      })
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

export async function fetchModelDetails(
  modelId: string
): Promise<ThoughtSpotModelDetails | null> {
  try {
    const response = await searchMetadata({
      metadataIds: [modelId],
      includeStats: false,
    });

    if (!response || !Array.isArray(response) || response.length === 0) {
      console.warn("No model details found for ID:", modelId);
      return null;
    }

    const model = response[0];

    // Try to get detailed information with columns
    const detailedResponse = await makeThoughtSpotApiCall("/metadata/search", {
      dependent_object_version: "V1",
      include_details: true,
      include_headers: true,
      record_offset: 0,
      record_size: 1,
      include_stats: false,
      include_discoverable_objects: true,
      show_resolved_parameters: false,
      metadata: [
        {
          identifier: modelId,
          type: "LOGICAL_TABLE",
        },
      ],
    });

    let columns: Array<{ name: string; type: string; description?: string }> =
      [];

    if (
      detailedResponse &&
      Array.isArray(detailedResponse) &&
      detailedResponse.length > 0
    ) {
      const detailedModel = detailedResponse[0];
      // Extract column information from the detailed response
      if (detailedModel.details && detailedModel.details.columns) {
        columns = detailedModel.details.columns.map(
          (col: {
            name?: string;
            column_name?: string;
            type?: string;
            data_type?: string;
            description?: string;
            column_description?: string;
          }) => ({
            name: col.name || col.column_name || "Unknown",
            type: col.type || col.data_type || "Unknown",
            description: col.description || col.column_description,
          })
        );
      }
    }

    return {
      id: model.metadata_id,
      name: model.metadata_name,
      type: "model" as const,
      description: model.metadata_header?.description,
      authorName: model.metadata_header?.authorName,
      created: model.metadata_header?.created,
      modified: model.metadata_header?.modified,
      columns,
    };
  } catch (error) {
    console.error("Failed to fetch model details:", error);
    return null;
  }
}

export async function fetchWorksheets(): Promise<ThoughtSpotContent[]> {
  try {
    const response = await searchMetadata({
      metadataTypes: ["LOGICAL_TABLE"],
      includeStats: false,
    });

    // Check if response exists and is an array
    if (!response || !Array.isArray(response)) {
      console.warn("No metadata array in response, returning empty array");
      return [];
    }

    // Filter for LOGICAL_TABLE types where subType/type is WORKSHEET (for Search)
    return response
      .filter((item) => {
        const isLogicalTable = item.metadata_type === "LOGICAL_TABLE";
        const logicalTableType = getLogicalTableType(item.metadata_header);
        const isWorksheet = logicalTableType === "WORKSHEET";
        return isLogicalTable && isWorksheet;
      })
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

    // If response is empty (401 case), don't log a warning - this is expected
    if (!response || Object.keys(response).length === 0) {
      console.log(
        "getCurrentUser: Empty response (likely 401), returning null"
      );
      return null;
    }

    console.warn("getCurrentUser: Invalid user response format:", response);
    return null;
  } catch (error) {
    console.log("getCurrentUser: Error occurred:", error);
    // Don't log 401 errors as they are expected when not logged in
    if (error instanceof Error && error.message.includes("401")) {
      console.log(
        "User not authenticated (401) - this is expected when not logged in"
      );
    } else {
      console.error("Failed to fetch current user:", error);
    }
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

    // Create metadata objects with proper types for each ID
    const metadataWithTypes: Array<{ identifier: string; type: string }> = [];

    // Add liveboards with LIVEBOARD type
    liveboardIds.forEach((id) => {
      metadataWithTypes.push({ identifier: id, type: "LIVEBOARD" });
    });

    // Add answers with ANSWER type
    answerIds.forEach((id) => {
      metadataWithTypes.push({ identifier: id, type: "ANSWER" });
    });

    const response = await searchMetadata({
      metadataTypes: ["LIVEBOARD", "ANSWER"],
      includeStats: true,
      metadataWithTypes: metadataWithTypes,
    });

    if (!response || !Array.isArray(response)) {
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

export async function importVisualizationToLiveboard(
  toLiveboardId: string,
  vizAnswerTML: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First, get the target liveboard TML
    const tmlResponse = await makeThoughtSpotApiCall("/metadata/tml/export", {
      metadata: [
        {
          identifier: toLiveboardId,
        },
      ],
      export_associated: false,
      export_fqn: false,
      edoc_format: "JSON",
      export_schema_version: "DEFAULT",
      export_dependent: false,
      export_connection_as_dependent: false,
      all_orgs_override: false,
    });

    if (
      !tmlResponse ||
      !Array.isArray(tmlResponse) ||
      tmlResponse.length === 0
    ) {
      return { success: false, error: "Failed to export target liveboard TML" };
    }

    const tmlObject = tmlResponse[0] as { edoc?: string };
    if (!tmlObject.edoc) {
      return { success: false, error: "No edoc found in target liveboard" };
    }

    // Parse the liveboard edoc
    const edocData = JSON.parse(tmlObject.edoc) as {
      liveboard?: {
        visualizations?: Array<{
          id?: string;
          viz_guid?: string;
          answer?: unknown;
        }>;
      };
    };

    if (!edocData.liveboard) {
      return { success: false, error: "Invalid liveboard structure" };
    }

    // Initialize visualizations array if it doesn't exist
    if (!edocData.liveboard.visualizations) {
      edocData.liveboard.visualizations = [];
    }

    // Parse the viz answer TML
    const vizAnswer = JSON.parse(vizAnswerTML);

    // Calculate the new Viz_n ID (1-indexed)
    const vizCount = edocData.liveboard.visualizations.length;
    const newVizId = `Viz_${vizCount + 1}`;

    // Add the new visualization to the end of the array
    edocData.liveboard.visualizations.push({
      id: newVizId,
      answer: vizAnswer,
    });

    // Convert the modified edoc back to a string
    const modifiedEdoc = JSON.stringify(edocData);

    // Import the modified TML
    const importResponse = await makeThoughtSpotApiCall(
      "/metadata/tml/import",
      {
        metadata_tmls: [modifiedEdoc],
        import_policy: "PARTIAL",
        create_new: false,
        all_orgs_override: false,
        skip_diff_check: false,
        enable_large_metadata_validation: false,
      }
    );

    console.log("Import response:", JSON.stringify(importResponse, null, 2));

    // Check if import was successful
    if (
      importResponse &&
      Array.isArray(importResponse) &&
      importResponse.length > 0
    ) {
      const result = importResponse[0] as {
        status?: { status_code?: string };
        response?: { status?: { status_code?: string } };
      };

      // Check for status in multiple possible locations
      const statusCode =
        result.status?.status_code || result.response?.status?.status_code;

      if (statusCode === "OK" || statusCode === "WARNING") {
        // Both OK and WARNING are considered successful imports
        return { success: true };
      } else if (statusCode === "ERROR") {
        return { success: false, error: "Import failed with ERROR status" };
      } else {
        // If we got a response but no clear status, log it but assume success
        console.warn("Unclear import status:", statusCode, result);
        return { success: true };
      }
    }

    return { success: false, error: "Invalid import response" };
  } catch (error) {
    console.error("Failed to import visualization to liveboard:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export interface VisualizationHeader {
  id: string;
  name: string;
  vizType: string;
  size: string;
}

export async function exportVisualizationTML(
  liveboardId: string,
  visualizationId: string
): Promise<string | null> {
  try {
    // Export the entire liveboard TML
    const response = await makeThoughtSpotApiCall("/metadata/tml/export", {
      metadata: [
        {
          identifier: liveboardId,
        },
      ],
      export_associated: false,
      export_fqn: false,
      edoc_format: "JSON",
      export_schema_version: "DEFAULT",
      export_dependent: false,
      export_connection_as_dependent: false,
      all_orgs_override: false,
    });

    if (!response || !Array.isArray(response) || response.length === 0) {
      console.warn("No TML data returned for liveboard:", liveboardId);
      return null;
    }

    const tmlObject = response[0] as { edoc?: string };
    if (!tmlObject.edoc) {
      console.warn("No edoc field found in TML response:", liveboardId);
      return null;
    }

    // Parse the edoc JSON to get the visualizations
    const edocData = JSON.parse(tmlObject.edoc) as {
      liveboard?: {
        visualizations?: Array<{
          id?: string;
          viz_guid?: string;
          answer?: unknown;
        }>;
      };
    };

    if (
      !edocData.liveboard ||
      !edocData.liveboard.visualizations ||
      !Array.isArray(edocData.liveboard.visualizations)
    ) {
      console.warn("No visualizations found in liveboard edoc:", liveboardId);
      return null;
    }

    // Find the specific visualization by viz_guid
    const visualization = edocData.liveboard.visualizations.find(
      (viz) => viz.viz_guid === visualizationId
    );

    if (!visualization || !visualization.answer) {
      console.warn(
        "Visualization not found or has no answer:",
        visualizationId
      );
      return null;
    }

    // Return the answer as a JSON string
    return JSON.stringify(visualization.answer);
  } catch (error) {
    console.error(
      "Failed to export visualization TML:",
      liveboardId,
      visualizationId,
      error
    );
    return null;
  }
}

export async function fetchLiveboardWithVisualizations(
  liveboardId: string
): Promise<VisualizationHeader[]> {
  try {
    // First, get the liveboard TML to extract the Viz_nnn IDs
    const tmlResponse = await makeThoughtSpotApiCall("/metadata/tml/export", {
      metadata: [
        {
          identifier: liveboardId,
        },
      ],
      export_associated: false,
      export_fqn: false,
      edoc_format: "JSON",
      export_schema_version: "DEFAULT",
      export_dependent: false,
      export_connection_as_dependent: false,
      all_orgs_override: false,
    });

    // Parse the TML to get the Viz_nnn IDs
    const vizIdMap = new Map<string, string>(); // GUID -> Viz_nnn
    if (tmlResponse && Array.isArray(tmlResponse) && tmlResponse.length > 0) {
      const tmlObject = tmlResponse[0] as { edoc?: string };
      if (tmlObject.edoc) {
        const edocData = JSON.parse(tmlObject.edoc) as {
          liveboard?: {
            visualizations?: Array<{
              id?: string;
              viz_guid?: string;
              answer?: {
                guid?: string;
              };
            }>;
          };
        };

        if (
          edocData.liveboard &&
          edocData.liveboard.visualizations &&
          Array.isArray(edocData.liveboard.visualizations)
        ) {
          edocData.liveboard.visualizations.forEach((viz) => {
            // Map the answer GUID to the viz_guid (which we'll use for lookup)
            if (
              viz.viz_guid &&
              viz.answer &&
              typeof viz.answer === "object" &&
              "guid" in viz.answer
            ) {
              const answerGuid = (viz.answer as { guid?: string }).guid;
              if (answerGuid) {
                // Map answer GUID -> viz_guid
                vizIdMap.set(answerGuid, viz.viz_guid);
              }
            }
          });
        }
      }
    }

    // Now get the visualization headers with metadata
    const response = await makeThoughtSpotApiCall("/metadata/search", {
      dependent_object_version: "V1",
      include_details: false,
      include_headers: true,
      include_visualization_headers: true,
      record_offset: 0,
      record_size: 1,
      include_stats: false,
      include_discoverable_objects: true,
      show_resolved_parameters: false,
      metadata: [
        {
          identifier: liveboardId,
          type: "LIVEBOARD",
        },
      ],
    });

    if (!response || !Array.isArray(response) || response.length === 0) {
      console.warn("No liveboard found with ID:", liveboardId);
      return [];
    }

    const liveboard = response[0];
    const vizHeaders = (
      liveboard as {
        visualization_headers?: Array<{
          id?: string;
          name?: string;
          vizType?: string;
          size?: string;
        }>;
      }
    ).visualization_headers;

    if (!vizHeaders || !Array.isArray(vizHeaders)) {
      console.warn("No visualization headers found in liveboard:", liveboardId);
      return [];
    }

    // Filter to only show CHART type visualizations (exclude filters and other types)
    return vizHeaders
      .filter((viz) => viz.vizType === "CHART")
      .map((viz) => {
        const guid = viz.id || "";
        // Use the viz_guid from the map if available, otherwise use the GUID
        const vizId = vizIdMap.get(guid) || guid;
        return {
          id: vizId,
          name: viz.name || "Unnamed Visualization",
          vizType: viz.vizType || "UNKNOWN",
          size: viz.size || "M",
        };
      });
  } catch (error) {
    console.error(
      "Failed to fetch liveboard with visualizations:",
      liveboardId,
      error
    );
    return [];
  }
}
