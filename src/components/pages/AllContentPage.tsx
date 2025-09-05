"use client";

import ContentPage from "./ContentPage";

export default function AllContentPage() {
  return (
    <ContentPage
      pageType="all-content"
      title="All Content"
      subtitle="All Liveboards and Answers"
      description="Browse all available content in your ThoughtSpot instance. Use the filters to narrow down by content type."
      emptyMessage="No content found. Check your ThoughtSpot connection and permissions."
    />
  );
}
