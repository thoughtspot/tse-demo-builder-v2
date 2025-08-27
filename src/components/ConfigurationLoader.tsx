import React, { useState, useEffect } from "react";
import LoadingDialog from "./LoadingDialog";
import { loadConfigurationSimplified } from "../services/configurationService";

interface ConfigurationSource {
  type: "file" | "github";
  data: File | string;
}

interface ConfigurationLoaderProps {
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
  onLoadError?: (error: string) => void;
}

const ConfigurationLoader: React.FC<ConfigurationLoaderProps> = ({
  onLoadStart,
  onLoadComplete,
  onLoadError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);

  const loadConfiguration = async (source: ConfigurationSource) => {
    try {
      setIsLoading(true);
      setLoadingMessage("Starting configuration load...");
      setLoadingProgress(0);
      onLoadStart?.();

      const result = await loadConfigurationSimplified(
        source,
        (message, progress) => {
          setLoadingMessage(message);
          if (progress !== undefined) {
            setLoadingProgress(progress);
          }
        }
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to load configuration");
      }

      console.log("Configuration loaded successfully!");
      onLoadComplete?.();
    } catch (error) {
      console.error("Error loading configuration:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      onLoadError?.(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
      setLoadingProgress(0);
    }
  };

  // Listen for custom events to trigger configuration loading
  useEffect(() => {
    const handleLoadConfiguration = (event: CustomEvent) => {
      const { type, data } = event.detail;
      loadConfiguration({ type, data });
    };

    window.addEventListener(
      "loadConfiguration",
      handleLoadConfiguration as EventListener
    );

    return () => {
      window.removeEventListener(
        "loadConfiguration",
        handleLoadConfiguration as EventListener
      );
    };
  }, [loadConfiguration]);

  // Expose the loadConfiguration function globally for external use
  useEffect(() => {
    (
      window as unknown as { loadConfiguration: typeof loadConfiguration }
    ).loadConfiguration = loadConfiguration;

    return () => {
      delete (
        window as unknown as { loadConfiguration?: typeof loadConfiguration }
      ).loadConfiguration;
    };
  }, [loadConfiguration]);

  const handleFileSelect = async (file: File) => {
    await loadConfiguration({
      type: "file",
      data: file,
    });
  };

  const handleGitHubLoad = async (filename: string) => {
    await loadConfiguration({
      type: "github",
      data: filename,
    });
  };

  return (
    <>
      <LoadingDialog
        isOpen={isLoading}
        message={loadingMessage}
        progress={loadingProgress}
      />
    </>
  );
};

export default ConfigurationLoader;
