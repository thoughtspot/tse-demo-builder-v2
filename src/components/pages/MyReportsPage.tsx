"use client";

import ContentGrid from "../ContentGrid";
import { useAppContext } from "../Layout";
import { ThoughtSpotContent } from "../../types/thoughtspot";

export default function MyReportsPage() {
  const { standardMenus } = useAppContext();

  // Get my-reports configuration from standard menus
  const myReportsMenu = standardMenus.find((m) => m.id === "my-reports");
  const myReportsConfig = myReportsMenu
    ? {
        contentType: myReportsMenu.contentType,
        namePattern: myReportsMenu.namePattern,
      }
    : undefined;

  const handleContentOpen = (content: ThoughtSpotContent) => {
    // Handle opening content - could navigate to a dedicated view or show in modal
  };

  return (
    <ContentGrid
      title=""
      subtitle="Your Created Content"
      description="Access and manage all the reports, liveboards, and answers you've created. Click on any item to open it directly."
      emptyMessage="You haven't created any content yet. Start building your first report or liveboard."
      onContentOpen={handleContentOpen}
      fetchUserContent={true}
      userContentConfig={myReportsConfig}
      showDirectContent={true}
    />
  );
}
