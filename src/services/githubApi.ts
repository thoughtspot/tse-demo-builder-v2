interface GitHubConfig {
  name: string;
  description?: string;
  config: Record<string, unknown>;
  filename: string;
}

export interface DemoListing {
  name: string;
  filename: string;
}

export interface IconFile {
  name: string;
  downloadUrl: string;
}

const REPO_OWNER_PREBUILT = "thoughtspot";
const REPO_NAME_PREBUILT = "tse-demo-builders-pre-built";

export async function listConfigurations(): Promise<DemoListing[]> {
  const response = await fetch(
    `https://api.github.com/repos/${REPO_OWNER_PREBUILT}/${REPO_NAME_PREBUILT}/contents/configs`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "TSE-Demo-Builder",
      },
      mode: "cors",
    }
  );
  if (!response.ok) throw new Error(`Failed to list configurations: ${response.statusText}`);
  const contents: GitHubApiResponse[] = await response.json();
  return contents
    .filter((item) => item.type === "file" && item.name.endsWith(".json"))
    .map((item) => ({
      name: item.name.replace(".json", ""),
      filename: item.name,
    }));
}

export function getPreviewUrl(configName: string): string {
  return `https://raw.githubusercontent.com/${REPO_OWNER_PREBUILT}/${REPO_NAME_PREBUILT}/main/configs/previews/${configName}.png`;
}

export async function fetchSpotterIcons(): Promise<IconFile[]> {
  const response = await fetch(
    `https://api.github.com/repos/${REPO_OWNER_PREBUILT}/${REPO_NAME_PREBUILT}/contents/icons/spotter`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "TSE-Demo-Builder",
      },
      mode: "cors",
    }
  );
  if (!response.ok) {
    if (response.status === 404) return [];
    throw new Error(`Failed to fetch icons: ${response.statusText}`);
  }
  const contents: GitHubApiResponse[] = await response.json();
  return contents
    .filter(
      (item) => item.type === "file" && item.name.includes("-preview-")
    )
    .map((item) => ({ name: item.name, downloadUrl: item.download_url }));
}

export interface GitHubStyle {
  name: string;
  description?: string;
  styleData: Record<string, unknown>;
  filename: string;
}

interface GitHubApiResponse {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

export async function fetchSavedConfigurations(): Promise<GitHubConfig[]> {
  try {
    console.log("Fetching saved configurations from GitHub...");
    const repoOwner = "thoughtspot";
    const repoName = "tse-demo-builders-pre-built";
    const configsPath = "configs";

    // Fetch the contents of the configs directory
    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${configsPath}`,
      {
        method: "GET",
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "TSE-Demo-Builder",
          "Content-Type": "application/json",
        },
        mode: "cors",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch configurations: ${response.statusText}`);
    }

    const contents: GitHubApiResponse[] = await response.json();
    console.log("GitHub directory contents:", contents);

    // Filter for JSON files only
    const jsonFiles = contents.filter(
      (item) => item.type === "file" && item.name.endsWith(".json")
    );
    console.log("JSON files found:", jsonFiles);

    // Fetch each configuration file
    const configs: GitHubConfig[] = [];

    for (const file of jsonFiles) {
      try {
        console.log("Fetching config file:", file.name);
        const configResponse = await fetch(file.download_url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": "TSE-Demo-Builder",
          },
          mode: "cors",
        });
        if (configResponse.ok) {
          const configData = await configResponse.json();

          // Extract name from filename (remove .json extension)
          const name = file.name.replace(".json", "");

          configs.push({
            name,
            description: configData.description || `Configuration: ${name}`,
            config: configData,
            filename: file.name,
          });
          console.log("Successfully loaded config:", name);
        }
      } catch (error) {
        console.error(`Failed to fetch config ${file.name}:`, error);
        // Continue with other files even if one fails
      }
    }

    console.log("Total configurations loaded:", configs.length);
    return configs;
  } catch (error) {
    console.error("Error fetching saved configurations:", error);
    throw error;
  }
}

export async function loadConfigurationFromGitHub(
  filename: string
): Promise<Record<string, unknown>> {
  try {
    console.log("Loading configuration from GitHub:", filename);
    const repoOwner = "thoughtspot";
    const repoName = "tse-demo-builders-pre-built";
    const configsPath = "configs";

    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${configsPath}/${filename}`,
      {
        method: "GET",
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "TSE-Demo-Builder",
          "Content-Type": "application/json",
        },
        mode: "cors",
      }
    );

    if (!response.ok) {
      console.error(
        `GitHub API error: ${response.status} ${response.statusText}`
      );
      if (response.status === 403) {
        throw new Error(
          `GitHub API rate limit exceeded. Please try again later.`
        );
      } else if (response.status === 404) {
        throw new Error(`Configuration file '${filename}' not found.`);
      } else {
        throw new Error(
          `Failed to fetch configuration: ${response.status} ${response.statusText}`
        );
      }
    }

    const fileData: GitHubApiResponse = await response.json();
    console.log("GitHub file data:", fileData);

    // Fetch the actual file content
    const contentResponse = await fetch(fileData.download_url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "TSE-Demo-Builder",
      },
      mode: "cors",
    });

    if (!contentResponse.ok) {
      console.error(
        `Content fetch error: ${contentResponse.status} ${contentResponse.statusText}`
      );
      throw new Error(
        `Failed to fetch file content: ${contentResponse.status} ${contentResponse.statusText}`
      );
    }

    const contentText = await contentResponse.text();

    let configData;
    try {
      configData = JSON.parse(contentText);
    } catch (parseError) {
      console.error("Failed to parse GitHub response as JSON:", parseError);
      throw new Error("Invalid JSON in GitHub configuration file");
    }

    console.log("Loaded config data from GitHub:", configData);
    return configData;
  } catch (error) {
    console.error("Error loading configuration from GitHub:", error);

    // Provide more specific error information
    if (
      error instanceof TypeError &&
      error.message.includes("Failed to fetch")
    ) {
      throw new Error(
        "Network error: Unable to connect to GitHub. Please check your internet connection and try again."
      );
    } else if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(
        "Unknown error occurred while loading configuration from GitHub."
      );
    }
  }
}

const REPO_OWNER = "thoughtspot";
const REPO_NAME = "tse-demo-builders-pre-built";
const STYLES_PATH = "styles";

export async function fetchSavedStyles(): Promise<GitHubStyle[]> {
  try {
    console.log("Fetching saved styles from GitHub...");

    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${STYLES_PATH}`,
      {
        method: "GET",
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "TSE-Demo-Builder",
          "Content-Type": "application/json",
        },
        mode: "cors",
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log("No styles directory found in GitHub repo");
        return [];
      }
      throw new Error(`Failed to fetch styles: ${response.statusText}`);
    }

    const contents: GitHubApiResponse[] = await response.json();

    const jsonFiles = contents.filter(
      (item) => item.type === "file" && item.name.endsWith(".json")
    );

    const styles: GitHubStyle[] = [];

    for (const file of jsonFiles) {
      try {
        const styleResponse = await fetch(file.download_url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": "TSE-Demo-Builder",
          },
          mode: "cors",
        });
        if (styleResponse.ok) {
          const styleData = await styleResponse.json();
          const name = file.name.replace(".json", "");

          styles.push({
            name,
            description: styleData.description || `Style: ${name}`,
            styleData,
            filename: file.name,
          });
        }
      } catch (error) {
        console.error(`Failed to fetch style ${file.name}:`, error);
      }
    }

    console.log("Total styles loaded:", styles.length);
    return styles;
  } catch (error) {
    console.error("Error fetching saved styles:", error);
    throw error;
  }
}

export async function loadStyleFromGitHub(
  filename: string
): Promise<Record<string, unknown>> {
  try {
    console.log("Loading style from GitHub:", filename);

    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${STYLES_PATH}/${filename}`,
      {
        method: "GET",
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "TSE-Demo-Builder",
          "Content-Type": "application/json",
        },
        mode: "cors",
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error(
          "GitHub API rate limit exceeded. Please try again later."
        );
      } else if (response.status === 404) {
        throw new Error(`Style file '${filename}' not found.`);
      }
      throw new Error(
        `Failed to fetch style: ${response.status} ${response.statusText}`
      );
    }

    const fileData: GitHubApiResponse = await response.json();

    const contentResponse = await fetch(fileData.download_url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "TSE-Demo-Builder",
      },
      mode: "cors",
    });

    if (!contentResponse.ok) {
      throw new Error(
        `Failed to fetch style content: ${contentResponse.status} ${contentResponse.statusText}`
      );
    }

    const contentText = await contentResponse.text();

    let styleData;
    try {
      styleData = JSON.parse(contentText);
    } catch (parseError) {
      console.error("Failed to parse GitHub style as JSON:", parseError);
      throw new Error("Invalid JSON in GitHub style file");
    }

    console.log("Loaded style data from GitHub:", styleData);
    return styleData;
  } catch (error) {
    console.error("Error loading style from GitHub:", error);

    if (
      error instanceof TypeError &&
      error.message.includes("Failed to fetch")
    ) {
      throw new Error(
        "Network error: Unable to connect to GitHub. Please check your internet connection and try again."
      );
    } else if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(
        "Unknown error occurred while loading style from GitHub."
      );
    }
  }
}
