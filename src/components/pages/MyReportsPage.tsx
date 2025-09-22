"use client";

import ContentPage from "./ContentPage";

export default function MyReportsPage() {
  return (
    <ContentPage
      pageType="my-reports"
      title="My Reports"
      subtitle="Your Content"
      description="Access and manage all your content. Organize, share, and maintain your reports and liveboards."
      emptyMessage="You haven't created any content yet. Start building your first report or liveboard."
    />
  );
}
