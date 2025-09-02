"use client";

import { useState, useRef, useEffect } from "react";
import { useAppContext } from "../Layout";

export default function FullAppPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const embedRef = useRef<HTMLDivElement>(null);
  const embedInstanceRef = useRef<{ destroy?: () => void } | null>(null);

  const {
    appConfig,
    fullAppConfig,
    stylingConfig,
    userConfig,
    lastClusterChangeTime,
    configVersion,
  } = useAppContext();

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

        // Get current user's locale
        const userLocale = currentUser?.locale || "en";

        // Get custom CSS configuration from styling config
        const customCSS = stylingConfig.embeddedContent.customCSS;
        const cssUrl = stylingConfig.embeddedContent.cssUrl;
        const strings = stylingConfig.embeddedContent.strings;
        const stringIDs = stylingConfig.embeddedContent.stringIDs;

        // Filter out visibleActions from embed flags to prevent conflicts with hiddenActions
        const appEmbedFlags = stylingConfig.embedFlags?.appEmbed || {};
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { visibleActions, ...filteredAppEmbedFlags } = appEmbedFlags;

        const embedConfig = {
          locale: userLocale,
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
          frameParams: {
            width: "100%",
            height: "100%",
          },
          ...filteredAppEmbedFlags,
          ...(hiddenActions.length > 0 && { hiddenActions }),
          customizations: {
            content: {
              strings: strings || {},
              stringIDs: stringIDs || {},
            },
            style: {
              customCSSUrl: cssUrl || undefined,
              customCSS: {
                variables: customCSS.variables || {},
                rules_UNSTABLE: customCSS.rules_UNSTABLE || {},
              },
            },
          },
        };

        const embedInstance = new AppEmbed(embedRef.current, embedConfig);

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
  }, [
    appConfig.thoughtspotUrl, // Add cluster URL to dependencies
    lastClusterChangeTime, // Add cluster change timestamp to dependencies
    configVersion, // Add config version to force re-initialization on config changes
    fullAppConfig.showPrimaryNavbar,
    fullAppConfig.hideHomepageLeftNav,
    stylingConfig.embeddedContent.customCSS,
    stylingConfig.embeddedContent.cssUrl,
    stylingConfig.embeddedContent.strings,
    stylingConfig.embeddedContent.stringIDs,
    userConfig.currentUserId,
    userConfig.users,
  ]);

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
            overflow: "hidden",
          }}
        />
      </div>
    </div>
  );
}
