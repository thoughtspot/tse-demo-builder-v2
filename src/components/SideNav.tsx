"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

interface StandardMenu {
  id: string;
  icon: string;
  name: string;
  enabled: boolean;
  modelId?: string;
  contentId?: string;
  contentType?: "Answer" | "Liveboard";
}

interface NavItem {
  id: string;
  name: string;
  icon: string;
  route: string;
}

interface SideNavProps {
  onSettingsClick?: () => void;
  standardMenus: StandardMenu[];
}

export default function SideNav({
  onSettingsClick,
  standardMenus,
}: SideNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  // Create navigation items from enabled standard menus
  const navItems: NavItem[] = standardMenus
    .filter((menu) => menu.enabled)
    .map((menu) => {
      // Map menu IDs to routes
      const routeMap: { [key: string]: string } = {
        home: "/",
        favorites: "/favorites",
        "my-reports": "/my-reports",
        spotter: "/spotter",
        search: "/search",
        "full-app": "/full-app",
      };

      return {
        id: menu.id,
        name: menu.name,
        icon: menu.icon,
        route: routeMap[menu.id] || "/",
      };
    });

  const handleNavClick = (route: string) => {
    router.push(route);
  };

  return (
    <div
      style={{
        width: isHovered ? "250px" : "60px",
        backgroundColor: "#f7fafc",
        borderRight: "1px solid #e2e8f0",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "16px 0",
        transition: "width 0.3s ease",
        overflow: "hidden",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Navigation Items */}
      <div style={{ flex: 1 }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.route)}
            style={{
              width: "100%",
              padding: isHovered ? "12px 24px" : "12px 16px",
              border: "none",
              background: pathname === item.route ? "#3182ce" : "transparent",
              color: pathname === item.route ? "white" : "#4a5568",
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "14px",
              fontWeight: pathname === item.route ? "600" : "400",
              transition: "all 0.2s",
              justifyContent: isHovered ? "flex-start" : "center",
            }}
            onMouseEnter={(e) => {
              if (pathname !== item.route) {
                e.currentTarget.style.backgroundColor = "#edf2f7";
              }
            }}
            onMouseLeave={(e) => {
              if (pathname !== item.route) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            <span style={{ fontSize: "18px" }}>{item.icon}</span>
            {isHovered && <span>{item.name}</span>}
          </button>
        ))}
      </div>

      {/* Settings Button */}
      <div
        style={{
          padding: isHovered ? "16px 24px" : "16px 8px",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <button
          onClick={onSettingsClick}
          style={{
            width: "100%",
            padding: isHovered ? "12px 16px" : "12px 8px",
            border: "none",
            background: "transparent",
            color: "#4a5568",
            cursor: "pointer",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "14px",
            fontWeight: "400",
            transition: "all 0.2s",
            justifyContent: isHovered ? "flex-start" : "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#edf2f7";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <span style={{ fontSize: "18px" }}>⚙️</span>
          {isHovered && <span>Settings</span>}
        </button>
      </div>
    </div>
  );
}
