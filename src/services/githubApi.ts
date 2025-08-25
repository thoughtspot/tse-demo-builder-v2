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
