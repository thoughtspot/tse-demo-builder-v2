"use client";

import ContentGrid from "../ContentGrid";
import { useAppContext } from "../Layout";
import { ThoughtSpotContent } from "../../types/thoughtspot";

export default function FavoritesPage() {
  const { standardMenus } = useAppContext();

  // Get favorites configuration from standard menus
  const favoritesMenu = standardMenus.find((m) => m.id === "favorites");
  const favoritesConfig = favoritesMenu
    ? {
        contentType: favoritesMenu.contentType,
        namePattern: favoritesMenu.namePattern,
      }
    : undefined;

  const handleContentOpen = (content: ThoughtSpotContent) => {
    // Handle opening content - could navigate to a dedicated view or show in modal
    console.log("Opening content:", content);
  };

  return (
    <ContentGrid
      title="Favorites"
      subtitle="Your Favorite Items"
      description="Quick access to your most frequently used reports, tools, and resources. Click on any item to open it directly."
      emptyMessage="Don't see your favorite items? Start exploring to add them here."
      onContentOpen={handleContentOpen}
      fetchFavorites={true}
      favoritesConfig={favoritesConfig}
    />
  );
}
