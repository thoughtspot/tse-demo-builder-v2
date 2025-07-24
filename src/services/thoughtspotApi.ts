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

type ThoughtSpotSearchResponse = ThoughtSpotMetadata[];

import { ThoughtSpotContent } from "../types/thoughtspot";

const THOUGHTSPOT_BASE_URL =
  "https://se-thoughtspot-cloud.thoughtspot.cloud/api/rest/2.0";

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
    console.log("Raw API response:", responseData); // Debug log
    return responseData;
  } catch (error) {
    console.error("ThoughtSpot API call failed:", error);
    throw error;
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
    console.log("Raw GET API response:", responseData); // Debug log
    return responseData;
  } catch (error) {
    console.error("ThoughtSpot GET API call failed:", error);
    throw error;
  }
}

export async function fetchLiveboards(): Promise<ThoughtSpotContent[]> {
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
            type: "LIVEBOARD",
          },
        ],
      }
    );

    console.log("Liveboards API response:", response); // Debug log

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
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to fetch liveboards:", error);
    // Return empty array on error
    return [];
  }
}

export async function fetchLiveboardsWithStats(): Promise<
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
        metadata: [
          {
            type: "LIVEBOARD",
          },
        ],
      }
    );

    console.log("Liveboards with stats API response:", response); // Debug log

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
    console.error("Failed to fetch liveboards with stats:", error);
    // Return empty array on error
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

    console.log("Answers API response:", response); // Debug log

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

    console.log("Answers with stats API response:", response); // Debug log

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

    console.log("Models API response:", response); // Debug log

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

    console.log("Worksheets API response:", response); // Debug log

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

    console.log("Favorite liveboards with stats API response:", response); // Debug log

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

    console.log("Favorite answers with stats API response:", response); // Debug log

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

    console.log("User liveboards with stats API response:", response); // Debug log

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

    console.log("User answers with stats API response:", response); // Debug log

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
