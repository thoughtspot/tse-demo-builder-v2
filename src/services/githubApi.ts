interface GitHubConfig {
  name: string;
  description?: string;
  config: Record<string, unknown>;
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
    const repoOwner = "thoughtspot";
    const repoName = "tse-demo-builders-pre-built";
    const configsPath = "configs";

    // Fetch the contents of the configs directory
    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${configsPath}`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          // Note: Using public repository, no auth needed
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch configurations: ${response.statusText}`);
    }

    const contents: GitHubApiResponse[] = await response.json();

    // Filter for JSON files only
    const jsonFiles = contents.filter(
      (item) => item.type === "file" && item.name.endsWith(".json")
    );

    // Fetch each configuration file
    const configs: GitHubConfig[] = [];

    for (const file of jsonFiles) {
      try {
        const configResponse = await fetch(file.download_url);
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
        }
      } catch (error) {
        console.error(`Failed to fetch config ${file.name}:`, error);
        // Continue with other files even if one fails
      }
    }

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
    const repoOwner = "thoughtspot";
    const repoName = "tse-demo-builders-pre-built";
    const configsPath = "configs";

    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${configsPath}/${filename}`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch configuration: ${response.statusText}`);
    }

    const fileData: GitHubApiResponse = await response.json();

    // Fetch the actual file content
    const contentResponse = await fetch(fileData.download_url);
    if (!contentResponse.ok) {
      throw new Error(
        `Failed to fetch file content: ${contentResponse.statusText}`
      );
    }

    const configData = await contentResponse.json();
    return configData;
  } catch (error) {
    console.error("Error loading configuration from GitHub:", error);
    throw error;
  }
}
