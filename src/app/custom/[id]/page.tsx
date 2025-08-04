"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAppContext } from "../../../components/Layout";
import ContentGrid from "../../../components/ContentGrid";
import Layout from "../../../components/Layout";

function CustomMenuPageContent() {
  const params = useParams();
  const router = useRouter();
  const { customMenus } = useAppContext();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const menuId = params?.id as string;
  const customMenu = customMenus.find((menu) => menu.id === menuId);

  const handleBackClick = () => {
    router.back();
  };

  // Show loading state until component is mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div>
        <div style={{ marginBottom: "24px" }}>
          <button
            onClick={handleBackClick}
            style={{
              padding: "8px 16px",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            ← Back
          </button>
        </div>
        <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (!customMenu) {
    return (
      <div>
        <div style={{ marginBottom: "24px" }}>
          <button
            onClick={handleBackClick}
            style={{
              padding: "8px 16px",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            ← Back
          </button>
        </div>
        <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
          <h1>Custom Menu Not Found</h1>
          <p>The requested custom menu could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <ContentGrid
      title={customMenu.name}
      subtitle=""
      description={
        customMenu.description || "Content selected for this custom menu."
      }
      emptyMessage="No content found for this custom menu. Please check the configuration."
      showDirectContent={true}
      onBackClick={handleBackClick}
      customContent={customMenu}
    />
  );
}

export default function CustomMenuPage() {
  return (
    <Layout>
      <CustomMenuPageContent />
    </Layout>
  );
}
