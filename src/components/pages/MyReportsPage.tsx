"use client";

import ContentGrid from "../ContentGrid";
import { useAppContext } from "../Layout";
import { ThoughtSpotContent } from "../../types/thoughtspot";

export default function MyReportsPage() {
  const { standardMenus } = useAppContext();

  // Get My Reports configuration from standard menus
  const myReportsMenu = standardMenus.find((m) => m.id === "my-reports");
  const userContentConfig = myReportsMenu
    ? {
        contentType: myReportsMenu.contentType,
        namePattern: myReportsMenu.namePattern,
      }
    : undefined;

  const handleContentOpen = (content: ThoughtSpotContent) => {
    // Handle opening content - could navigate to a dedicated view or show in modal
    console.log("Opening content:", content);
  };

  return (
    <ContentGrid
      title="My Reports"
      subtitle="Personal Reports"
      description="View and manage your personal reports. These are reports that you have created or have been assigned to you."
      emptyMessage="No reports found. Create your first report to get started."
      onContentOpen={handleContentOpen}
      fetchUserContent={true}
      userContentConfig={userContentConfig}
    />
  );
}
