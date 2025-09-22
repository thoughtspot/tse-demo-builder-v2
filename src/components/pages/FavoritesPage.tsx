"use client";

import ContentPage from "./ContentPage";

export default function FavoritesPage() {
  return (
    <ContentPage
      pageType="favorites"
      title="Favorites"
      subtitle="Your Favorite Content"
      description="Quick access to your favorite liveboards and answers. Click on any item to open it directly."
      emptyMessage="Don't see your favorite items? Start exploring to add them here."
    />
  );
}
