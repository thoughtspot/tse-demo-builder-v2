"use client";

import { useState, useRef, useEffect } from "react";
import { useAppContext } from "../Layout";

export default function FullAppPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const embedRef = useRef<HTMLDivElement>(null);
  const embedInstanceRef = useRef<{ destroy?: () => void } | null>(null);

  const { fullAppConfig, stylingConfig, userConfig } = useAppContext();

  useEffect(() => {
    const initEmbed = async () => {
      if (!embedRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        const { AppEmbed, HomeLeftNavItem, HomepageModule, Page } =
          await import("@thoughtspot/visual-embed-sdk");

        // Get hidden actions for current user
        const currentUser = userConfig.users.find(
          (u) => u.id === userConfig.currentUserId
        );
        const hiddenActions = currentUser?.access.hiddenActions?.enabled
          ? (currentUser.access.hiddenActions.actions as any[]) // eslint-disable-line @typescript-eslint/no-explicit-any
          : [];

        const embedInstance = new AppEmbed(embedRef.current, {
          showPrimaryNavbar: fullAppConfig.showPrimaryNavbar,
          modularHomeExperience: true,
          hideHomepageLeftNav: fullAppConfig.hideHomepageLeftNav,
          hiddenHomeLeftNavItems: [HomeLeftNavItem.MonitorSubscription],
          hiddenHomepageModules: [
            HomepageModule.Learning,
            HomepageModule.Trending,
          ],
          reorderedHomepageModules: [
            HomepageModule.Search,
            HomepageModule.Favorite,
            HomepageModule.Watchlist,
            HomepageModule.MyLibrary,
          ],
          pageId: Page.Home,
          ...(stylingConfig.embedFlags?.appEmbed || {}),
          ...(hiddenActions.length > 0 && { hiddenActions }),
        });

        embedInstanceRef.current = embedInstance;
        await embedInstance.render();
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize ThoughtSpot AppEmbed:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to load full application";
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    initEmbed();

    // Cleanup function
    return () => {
      if (
        embedInstanceRef.current &&
        typeof embedInstanceRef.current.destroy === "function"
      ) {
        embedInstanceRef.current.destroy();
      }
    };
  }, [fullAppConfig.showPrimaryNavbar, fullAppConfig.hideHomepageLeftNav]);

  if (error) {
    return (
      <div
        style={{
          padding: "20px",
          backgroundColor: "#fed7d7",
          border: "1px solid #feb2b2",
          borderRadius: "8px",
          color: "#c53030",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0" }}>⚠️ Embedding Error</h3>
        <p style={{ margin: 0 }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Embed Container */}
      <div style={{ flex: 1, position: "relative" }}>
        {isLoading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "#f7fafc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <div style={{ color: "#4a5568" }}>Loading full application...</div>
          </div>
        )}
        <div
          ref={embedRef}
          style={{
            width: "100%",
            height: "100%",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        />
      </div>
    </div>
  );
}
