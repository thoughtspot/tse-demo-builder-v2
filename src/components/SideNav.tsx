"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useCallback, useEffect } from "react";
import { CustomMenu, UserConfig } from "../types/thoughtspot";

// Utility function to generate appropriate colors based on background and foreground
const generateNavColors = (
  backgroundColor: string,
  foregroundColor: string
) => {
  // Helper function to determine if a color is light or dark
  const isLightColor = (color: string) => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  };

  // Helper function to adjust color brightness
  const adjustColorBrightness = (color: string, factor: number) => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const newR = Math.max(0, Math.min(255, Math.round(r + 255 * factor)));
    const newG = Math.max(0, Math.min(255, Math.round(g + 255 * factor)));
    const newB = Math.max(0, Math.min(255, Math.round(b + 255 * factor)));

    return `#${newR.toString(16).padStart(2, "0")}${newG
      .toString(16)
      .padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
  };

  const isLightBg = isLightColor(backgroundColor);

  // Generate hover color - slightly darker for light backgrounds, lighter for dark backgrounds
  const hoverFactor = isLightBg ? -0.08 : 0.12;
  const hoverColor = adjustColorBrightness(backgroundColor, hoverFactor);

  // Generate selected color - use the hover color for consistency
  const selectedColor = hoverColor;
  const selectedTextColor = foregroundColor; // Use the foreground color for text

  return {
    hoverColor,
    selectedColor,
    selectedTextColor,
  };
};

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
  isCustom?: boolean;
}

interface SideNavProps {
  onSettingsClick?: () => void;
  standardMenus: StandardMenu[];
  customMenus: CustomMenu[];
  menuOrder?: string[];
  onMenuOrderChange?: (newMenuOrder: string[]) => void;
  userConfig?: UserConfig;
  backgroundColor?: string;
  foregroundColor?: string;
  hoverColor?: string;
  selectedColor?: string;
  selectedTextColor?: string;
}

export default function SideNav({
  onSettingsClick,
  standardMenus,
  customMenus,
  menuOrder,
  onMenuOrderChange,
  userConfig,
  backgroundColor = "#f7fafc",
  foregroundColor = "#4a5568",
  hoverColor,
  selectedColor,
  selectedTextColor,
}: SideNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [showDragHandles, setShowDragHandles] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("=== SideNav Debug ===");
    console.log(
      "Standard menus:",
      standardMenus.length,
      standardMenus.map((m) => ({ id: m.id, name: m.name, enabled: m.enabled }))
    );
    console.log(
      "Custom menus:",
      customMenus.length,
      customMenus.map((m) => ({ id: m.id, name: m.name, enabled: m.enabled }))
    );
    console.log("Menu order:", menuOrder);
    console.log("User config:", userConfig);
    console.log("=====================");
  }, [standardMenus, customMenus, menuOrder, userConfig]);

  // Generate appropriate colors based on background and foreground, or use explicit colors if provided
  const generatedColors = generateNavColors(backgroundColor, foregroundColor);
  const navColors = {
    hoverColor: hoverColor || generatedColors.hoverColor,
    selectedColor: selectedColor || generatedColors.selectedColor,
    selectedTextColor: selectedTextColor || generatedColors.selectedTextColor,
  };

  // Get current user access permissions
  const currentUser = userConfig?.users.find(
    (u) => u.id === userConfig?.currentUserId
  );
  const userAccess = currentUser?.access;

  // Filter menus based on user access
  const filterMenusByUserAccess = (
    menus: StandardMenu[] | CustomMenu[],
    isCustom: boolean
  ) => {
    if (!userAccess) return menus; // If no user access defined, show all menus

    return menus.filter((menu) => {
      if (isCustom) {
        // For custom menus, check if the user has access to this specific menu
        const customMenu = menu as CustomMenu;
        return userAccess.customMenus.includes(customMenu.id);
      } else {
        // For standard menus, check if the user has access to this menu type
        const standardMenu = menu as StandardMenu;
        return (
          userAccess.standardMenus[
            standardMenu.id as keyof typeof userAccess.standardMenus
          ] === true
        );
      }
    });
  };

  // Create a map of all enabled menus for easy lookup
  const allMenus = new Map<
    string,
    { menu: StandardMenu | CustomMenu; isCustom: boolean }
  >();

  // Add enabled standard menus (filtered by user access)
  const accessibleStandardMenus = filterMenusByUserAccess(
    standardMenus,
    false
  ) as StandardMenu[];
  accessibleStandardMenus
    .filter((menu) => menu.enabled)
    .forEach((menu) => {
      allMenus.set(menu.id, { menu, isCustom: false });
    });

  // Add enabled custom menus (filtered by user access)
  const accessibleCustomMenus = filterMenusByUserAccess(
    customMenus,
    true
  ) as CustomMenu[];
  accessibleCustomMenus
    .filter((menu) => menu.enabled)
    .forEach((menu) => {
      allMenus.set(menu.id, { menu, isCustom: true });
    });

  // Create navigation items based on menuOrder or default order
  const createNavItems = (): NavItem[] => {
    console.log("Creating nav items with:", {
      menuOrder,
      allMenusSize: allMenus.size,
      accessibleStandardMenus: accessibleStandardMenus.length,
      accessibleCustomMenus: accessibleCustomMenus.length,
    });

    if (menuOrder && menuOrder.length > 0) {
      // Use the stored order
      const orderedItems: NavItem[] = [];

      menuOrder.forEach((id) => {
        const menuData = allMenus.get(id);
        if (!menuData) {
          console.log(`Menu with id ${id} not found in allMenus`);
          return;
        }

        const { menu, isCustom } = menuData;

        if (isCustom) {
          const customMenu = menu as CustomMenu;
          orderedItems.push({
            id: customMenu.id,
            name: customMenu.name,
            icon: customMenu.icon,
            route: `/custom/${customMenu.id}`,
            isCustom: true,
          });
        } else {
          const standardMenu = menu as StandardMenu;
          const routeMap: { [key: string]: string } = {
            home: "/",
            favorites: "/favorites",
            "my-reports": "/my-reports",
            spotter: "/spotter",
            search: "/search",
            "full-app": "/full-app",
          };

          orderedItems.push({
            id: standardMenu.id,
            name: standardMenu.name,
            icon: standardMenu.icon,
            route: routeMap[standardMenu.id] || "/",
            isCustom: false,
          });
        }
      });

      console.log(
        "Created ordered nav items:",
        orderedItems.map((item) => ({
          id: item.id,
          name: item.name,
          isCustom: item.isCustom,
        }))
      );
      return orderedItems;
    } else {
      // Default order: standard menus first, then custom menus
      const standardNavItems: NavItem[] = standardMenus
        .filter((menu) => menu.enabled)
        .map((menu) => {
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
            isCustom: false,
          };
        });

      const customNavItems: NavItem[] = customMenus
        .filter((menu) => menu.enabled)
        .map((menu) => ({
          id: menu.id,
          name: menu.name,
          icon: menu.icon,
          route: `/custom/${menu.id}`,
          isCustom: true,
        }));

      const allItems = [...standardNavItems, ...customNavItems];
      console.log(
        "Created default nav items:",
        allItems.map((item) => ({
          id: item.id,
          name: item.name,
          isCustom: item.isCustom,
        }))
      );
      return allItems;
    }
  };

  const navItems = createNavItems();

  const handleNavClick = (route: string) => {
    router.push(route);
  };

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, itemId: string) => {
    setIsDragging(true);
    setDraggedItemId(itemId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverItemId(itemId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverItemId(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetItemId: string) => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData("text/plain");

      if (draggedId === targetItemId) return;

      // Find the dragged item
      const draggedItem = navItems.find((item) => item.id === draggedId);
      const targetItem = navItems.find((item) => item.id === targetItemId);

      if (!draggedItem || !targetItem) return;

      // Reorder the items
      const newNavItems = [...navItems];
      const draggedIndex = newNavItems.findIndex(
        (item) => item.id === draggedId
      );
      const targetIndex = newNavItems.findIndex(
        (item) => item.id === targetItemId
      );

      // Remove dragged item from its current position
      newNavItems.splice(draggedIndex, 1);

      // Insert dragged item at target position
      newNavItems.splice(targetIndex, 0, draggedItem);

      // Update the menu order
      if (onMenuOrderChange) {
        // Extract the new order from the reordered navigation items
        const newMenuOrder = newNavItems.map((item) => item.id);
        onMenuOrderChange(newMenuOrder);
      }

      setIsDragging(false);
      setDraggedItemId(null);
      setDragOverItemId(null);
    },
    [navItems, standardMenus, customMenus, onMenuOrderChange]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedItemId(null);
    setDragOverItemId(null);
  }, []);

  return (
    <div
      style={{
        width: isHovered ? "250px" : "60px",
        backgroundColor: backgroundColor,
        borderRight: "1px solid #e2e8f0",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "16px 0",
        transition: "width 0.3s ease",
        overflow: "hidden",
      }}
      onMouseEnter={() => {
        setIsHovered(true);
        setShowDragHandles(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowDragHandles(false);
      }}
    >
      {/* Navigation Items */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {navItems.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, item.id)}
            onDragEnd={handleDragEnd}
            style={{
              position: "relative",
              opacity: draggedItemId === item.id ? 0.5 : 1,
              transform:
                draggedItemId === item.id ? "rotate(2deg) scale(0.98)" : "none",
              transition: "all 0.2s ease",
              boxShadow:
                draggedItemId === item.id
                  ? "0 4px 12px rgba(0,0,0,0.15)"
                  : "none",
            }}
          >
            {/* Drop indicator */}
            {dragOverItemId === item.id && draggedItemId !== item.id && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  backgroundColor: "#3182ce",
                  zIndex: 10,
                  boxShadow: "0 0 4px rgba(49, 130, 206, 0.5)",
                }}
              />
            )}

            <button
              onClick={() => handleNavClick(item.route)}
              style={{
                width: "100%",
                padding: isHovered ? "12px 24px" : "12px 16px",
                border: "none",
                background:
                  pathname === item.route
                    ? navColors.selectedColor
                    : "transparent",
                color:
                  pathname === item.route
                    ? navColors.selectedTextColor
                    : foregroundColor,
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "18px",
                fontWeight: pathname === item.route ? "600" : "400",
                transition: "all 0.2s",
                justifyContent: isHovered ? "flex-start" : "center",

                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (pathname !== item.route) {
                  e.currentTarget.style.backgroundColor = navColors.hoverColor;
                }
              }}
              onMouseLeave={(e) => {
                if (pathname !== item.route) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              {item.icon.startsWith("data:") ? (
                <img
                  src={item.icon}
                  alt="Menu icon"
                  style={{
                    width: "26px",
                    height: "26px",
                    objectFit: "contain",
                  }}
                />
              ) : item.icon.startsWith("/") ? (
                <img
                  src={item.icon}
                  alt="Menu icon"
                  style={{
                    width: "26px",
                    height: "26px",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <span style={{ fontSize: "26px" }}>{item.icon}</span>
              )}
              {isHovered && <span>{item.name}</span>}

              {/* Drag handle */}
              {showDragHandles && isHovered && (
                <div
                  style={{
                    marginLeft: "auto",
                    cursor: "grab",
                    opacity: 0.6,
                    fontSize: "12px",
                    userSelect: "none",
                    padding: "2px",
                    borderRadius: "3px",
                    transition: "opacity 0.2s",
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "0.6";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title="Drag to reorder"
                >
                  ⋮⋮
                </div>
              )}
            </button>
          </div>
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
            color: foregroundColor,
            cursor: "pointer",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "18px",
            fontWeight: "400",
            transition: "all 0.2s",
            justifyContent: isHovered ? "flex-start" : "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = navColors.hoverColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <span style={{ fontSize: "26px" }}>⚙️</span>
          {isHovered && <span>Settings</span>}
        </button>
      </div>
    </div>
  );
}
