import React, { useState, useMemo, useRef } from "react";
import MaterialIcon from "./MaterialIcon";

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  label?: string;
  placeholder?: string;
}

// Available Material Icons for selection - Expanded list with categories
const availableIcons = [
  // Standard menu icons
  { name: "home", label: "Home", category: "Navigation" },
  { name: "favorites", label: "Favorites", category: "Navigation" },
  { name: "my-reports", label: "My Reports", category: "Navigation" },
  { name: "spotter", label: "Spotter", category: "Navigation" },
  {
    name: "spotter-custom.svg",
    label: "Spotter (Custom)",
    category: "Navigation",
  },
  { name: "search", label: "Search", category: "Navigation" },
  { name: "full-app", label: "Full App", category: "Navigation" },
  { name: "settings", label: "Settings", category: "Navigation" },

  // Common icons
  { name: "star", label: "Star", category: "Common" },
  { name: "dashboard", label: "Dashboard", category: "Common" },
  { name: "analytics", label: "Analytics", category: "Common" },
  { name: "trending", label: "Trending", category: "Common" },
  { name: "business", label: "Business", category: "Common" },
  { name: "school", label: "School", category: "Common" },
  { name: "work", label: "Work", category: "Common" },
  { name: "person", label: "Person", category: "Common" },
  { name: "group", label: "Group", category: "Common" },
  { name: "store", label: "Store", category: "Common" },
  { name: "shopping-cart", label: "Shopping Cart", category: "Common" },
  { name: "shipping", label: "Shipping", category: "Common" },
  { name: "bank", label: "Bank", category: "Common" },
  { name: "timeline", label: "Timeline", category: "Common" },
  { name: "bar-chart", label: "Bar Chart", category: "Charts" },
  { name: "pie-chart", label: "Pie Chart", category: "Charts" },
  { name: "line-chart", label: "Line Chart", category: "Charts" },
  { name: "chart", label: "Chart", category: "Charts" },
  { name: "table", label: "Table", category: "Charts" },
  { name: "bubble-chart", label: "Bubble Chart", category: "Charts" },
  { name: "scatter-plot", label: "Scatter Plot", category: "Charts" },
  { name: "donut-large", label: "Donut Large", category: "Charts" },
  { name: "donut-small", label: "Donut Small", category: "Charts" },

  // View icons
  { name: "view-module", label: "View Module", category: "Views" },
  { name: "view-list", label: "View List", category: "Views" },
  { name: "view-quilt", label: "View Quilt", category: "Views" },
  { name: "grid-on", label: "Grid On", category: "Views" },
  { name: "grid-off", label: "Grid Off", category: "Views" },
  { name: "view-column", label: "View Column", category: "Views" },
  { name: "view-week", label: "View Week", category: "Views" },
  { name: "view-day", label: "View Day", category: "Views" },
  { name: "view-agenda", label: "View Agenda", category: "Views" },
  { name: "view-headline", label: "View Headline", category: "Views" },
  { name: "view-stream", label: "View Stream", category: "Views" },
  { name: "view-comfy", label: "View Comfy", category: "Views" },
  { name: "view-compact", label: "View Compact", category: "Views" },
  { name: "view-array", label: "View Array", category: "Views" },
  { name: "view-carousel", label: "View Carousel", category: "Views" },
  { name: "view-timeline", label: "View Timeline", category: "Views" },
  { name: "view-kanban", label: "View Kanban", category: "Views" },
  { name: "view-sidebar", label: "View Sidebar", category: "Views" },

  // Outlined variants
  {
    name: "view-quilt-outlined",
    label: "View Quilt (Outlined)",
    category: "Views",
  },
  {
    name: "view-module-outlined",
    label: "View Module (Outlined)",
    category: "Views",
  },
  {
    name: "view-list-outlined",
    label: "View List (Outlined)",
    category: "Views",
  },
  {
    name: "view-comfy-outlined",
    label: "View Comfy (Outlined)",
    category: "Views",
  },
  {
    name: "view-compact-outlined",
    label: "View Compact (Outlined)",
    category: "Views",
  },
  {
    name: "view-array-outlined",
    label: "View Array (Outlined)",
    category: "Views",
  },
  {
    name: "view-carousel-outlined",
    label: "View Carousel (Outlined)",
    category: "Views",
  },
  {
    name: "view-timeline-outlined",
    label: "View Timeline (Outlined)",
    category: "Views",
  },
  {
    name: "view-kanban-outlined",
    label: "View Kanban (Outlined)",
    category: "Views",
  },
  {
    name: "view-sidebar-outlined",
    label: "View Sidebar (Outlined)",
    category: "Views",
  },

  // Rounded variants
  {
    name: "view-quilt-rounded",
    label: "View Quilt (Rounded)",
    category: "Views",
  },
  {
    name: "view-module-rounded",
    label: "View Module (Rounded)",
    category: "Views",
  },
  {
    name: "view-list-rounded",
    label: "View List (Rounded)",
    category: "Views",
  },
  {
    name: "view-comfy-rounded",
    label: "View Comfy (Rounded)",
    category: "Views",
  },
  {
    name: "view-compact-rounded",
    label: "View Compact (Rounded)",
    category: "Views",
  },
  {
    name: "view-array-rounded",
    label: "View Array (Rounded)",
    category: "Views",
  },
  {
    name: "view-carousel-rounded",
    label: "View Carousel (Rounded)",
    category: "Views",
  },
  {
    name: "view-timeline-rounded",
    label: "View Timeline (Rounded)",
    category: "Views",
  },
  {
    name: "view-kanban-rounded",
    label: "View Kanban (Rounded)",
    category: "Views",
  },
  {
    name: "view-sidebar-rounded",
    label: "View Sidebar (Rounded)",
    category: "Views",
  },

  // Sharp variants
  { name: "view-quilt-sharp", label: "View Quilt (Sharp)", category: "Views" },
  {
    name: "view-module-sharp",
    label: "View Module (Sharp)",
    category: "Views",
  },
  { name: "view-list-sharp", label: "View List (Sharp)", category: "Views" },
  { name: "view-comfy-sharp", label: "View Comfy (Sharp)", category: "Views" },
  {
    name: "view-compact-sharp",
    label: "View Compact (Sharp)",
    category: "Views",
  },
  { name: "view-array-sharp", label: "View Array (Sharp)", category: "Views" },
  {
    name: "view-carousel-sharp",
    label: "View Carousel (Sharp)",
    category: "Views",
  },
  {
    name: "view-timeline-sharp",
    label: "View Timeline (Sharp)",
    category: "Views",
  },
  {
    name: "view-kanban-sharp",
    label: "View Kanban (Sharp)",
    category: "Views",
  },
  {
    name: "view-sidebar-sharp",
    label: "View Sidebar (Sharp)",
    category: "Views",
  },

  // Two-tone variants
  {
    name: "view-quilt-two-tone",
    label: "View Quilt (Two-tone)",
    category: "Views",
  },
  {
    name: "view-module-two-tone",
    label: "View Module (Two-tone)",
    category: "Views",
  },
  {
    name: "view-list-two-tone",
    label: "View List (Two-tone)",
    category: "Views",
  },
  {
    name: "view-comfy-two-tone",
    label: "View Comfy (Two-tone)",
    category: "Views",
  },
  {
    name: "view-compact-two-tone",
    label: "View Compact (Two-tone)",
    category: "Views",
  },
  {
    name: "view-array-two-tone",
    label: "View Array (Two-tone)",
    category: "Views",
  },
  {
    name: "view-carousel-two-tone",
    label: "View Carousel (Two-tone)",
    category: "Views",
  },
  {
    name: "view-timeline-two-tone",
    label: "View Timeline (Two-tone)",
    category: "Views",
  },
  {
    name: "view-kanban-two-tone",
    label: "View Kanban (Two-tone)",
    category: "Views",
  },
  {
    name: "view-sidebar-two-tone",
    label: "View Sidebar (Two-tone)",
    category: "Views",
  },

  // Transportation icons
  { name: "directions-car", label: "Car", category: "Transportation" },
  { name: "directions-bus", label: "Bus", category: "Transportation" },
  { name: "directions-bike", label: "Bike", category: "Transportation" },
  { name: "directions-walk", label: "Walk", category: "Transportation" },
  { name: "flight", label: "Flight", category: "Transportation" },
  { name: "train", label: "Train", category: "Transportation" },
  { name: "warehouse", label: "Warehouse", category: "Transportation" },
  { name: "inventory", label: "Inventory", category: "Transportation" },

  // Retail icons
  { name: "shopping-bag", label: "Shopping Bag", category: "Retail" },
  { name: "shopping-basket", label: "Shopping Basket", category: "Retail" },
  { name: "storefront", label: "Storefront", category: "Retail" },
  { name: "local-mall", label: "Mall", category: "Retail" },
  { name: "local-grocery-store", label: "Grocery Store", category: "Retail" },
  {
    name: "local-convenience-store",
    label: "Convenience Store",
    category: "Retail",
  },
  { name: "local-pharmacy", label: "Pharmacy", category: "Retail" },
  { name: "local-gas-station", label: "Gas Station", category: "Retail" },
  { name: "local-car-wash", label: "Car Wash", category: "Retail" },
  {
    name: "local-laundry-service",
    label: "Laundry Service",
    category: "Retail",
  },
  { name: "local-pizza", label: "Pizza", category: "Retail" },
  { name: "local-cafe", label: "Cafe", category: "Retail" },
  { name: "local-bar", label: "Bar", category: "Retail" },
  { name: "local-hotel", label: "Hotel", category: "Retail" },
  { name: "local-hospital", label: "Hospital", category: "Retail" },
  { name: "local-police", label: "Police", category: "Retail" },
  {
    name: "local-fire-department",
    label: "Fire Department",
    category: "Retail",
  },
  { name: "local-library", label: "Library", category: "Retail" },
  { name: "local-post-office", label: "Post Office", category: "Retail" },
  { name: "local-printshop", label: "Print Shop", category: "Retail" },
  { name: "local-florist", label: "Florist", category: "Retail" },
  { name: "local-dining", label: "Dining", category: "Retail" },
  { name: "local-drink", label: "Drink", category: "Retail" },
  { name: "local-activity", label: "Activity", category: "Retail" },
  { name: "local-airport", label: "Airport", category: "Retail" },
  { name: "local-atm", label: "ATM", category: "Retail" },
  { name: "local-taxi", label: "Taxi", category: "Retail" },
  { name: "local-parking", label: "Parking", category: "Retail" },
  { name: "local-phone", label: "Phone", category: "Retail" },
  { name: "local-play", label: "Play", category: "Retail" },
  { name: "local-movies", label: "Movies", category: "Retail" },
  { name: "local-offer", label: "Offer", category: "Retail" },
  { name: "local-see", label: "See", category: "Retail" },

  // Banking & Finance icons
  {
    name: "account-balance-wallet",
    label: "Wallet",
    category: "Banking & Finance",
  },
  { name: "account-box", label: "Account Box", category: "Banking & Finance" },
  {
    name: "account-circle",
    label: "Account Circle",
    category: "Banking & Finance",
  },
  {
    name: "account-tree",
    label: "Account Tree",
    category: "Banking & Finance",
  },
  {
    name: "monetization-on",
    label: "Monetization",
    category: "Banking & Finance",
  },
  { name: "money", label: "Money", category: "Banking & Finance" },
  { name: "money-off", label: "Money Off", category: "Banking & Finance" },
  { name: "payment", label: "Payment", category: "Banking & Finance" },
  { name: "credit-card", label: "Credit Card", category: "Banking & Finance" },
  { name: "savings", label: "Savings", category: "Banking & Finance" },
  {
    name: "currency-exchange",
    label: "Currency Exchange",
    category: "Banking & Finance",
  },
  { name: "currency-pound", label: "Pound", category: "Banking & Finance" },
  { name: "currency-yen", label: "Yen", category: "Banking & Finance" },
  { name: "currency-ruble", label: "Ruble", category: "Banking & Finance" },
  { name: "currency-franc", label: "Franc", category: "Banking & Finance" },
  { name: "currency-lira", label: "Lira", category: "Banking & Finance" },
  { name: "currency-yuan", label: "Yuan", category: "Banking & Finance" },
  { name: "currency-rupee", label: "Rupee", category: "Banking & Finance" },

  // Analytics icons
  { name: "trending-down", label: "Trending Down", category: "Analytics" },
  { name: "trending-flat", label: "Trending Flat", category: "Analytics" },
  {
    name: "insert-chart-outlined",
    label: "Chart (Outlined)",
    category: "Analytics",
  },
  {
    name: "insert-chart-rounded",
    label: "Chart (Rounded)",
    category: "Analytics",
  },
  { name: "insert-chart-sharp", label: "Chart (Sharp)", category: "Analytics" },
  {
    name: "insert-chart-two-tone",
    label: "Chart (Two-tone)",
    category: "Analytics",
  },
  {
    name: "pie-chart-outlined",
    label: "Pie Chart (Outlined)",
    category: "Analytics",
  },
  {
    name: "pie-chart-rounded",
    label: "Pie Chart (Rounded)",
    category: "Analytics",
  },
  {
    name: "pie-chart-sharp",
    label: "Pie Chart (Sharp)",
    category: "Analytics",
  },
  {
    name: "pie-chart-two-tone",
    label: "Pie Chart (Two-tone)",
    category: "Analytics",
  },
  {
    name: "bar-chart-outlined",
    label: "Bar Chart (Outlined)",
    category: "Analytics",
  },
  {
    name: "bar-chart-rounded",
    label: "Bar Chart (Rounded)",
    category: "Analytics",
  },
  {
    name: "bar-chart-sharp",
    label: "Bar Chart (Sharp)",
    category: "Analytics",
  },
  {
    name: "bar-chart-two-tone",
    label: "Bar Chart (Two-tone)",
    category: "Analytics",
  },
  {
    name: "bubble-chart-outlined",
    label: "Bubble Chart (Outlined)",
    category: "Analytics",
  },
  {
    name: "bubble-chart-rounded",
    label: "Bubble Chart (Rounded)",
    category: "Analytics",
  },
  {
    name: "bubble-chart-sharp",
    label: "Bubble Chart (Sharp)",
    category: "Analytics",
  },
  {
    name: "bubble-chart-two-tone",
    label: "Bubble Chart (Two-tone)",
    category: "Analytics",
  },
  {
    name: "scatter-plot-outlined",
    label: "Scatter Plot (Outlined)",
    category: "Analytics",
  },
  {
    name: "scatter-plot-rounded",
    label: "Scatter Plot (Rounded)",
    category: "Analytics",
  },
  {
    name: "scatter-plot-sharp",
    label: "Scatter Plot (Sharp)",
    category: "Analytics",
  },
  {
    name: "scatter-plot-two-tone",
    label: "Scatter Plot (Two-tone)",
    category: "Analytics",
  },
  {
    name: "timeline-outlined",
    label: "Timeline (Outlined)",
    category: "Analytics",
  },
  {
    name: "timeline-rounded",
    label: "Timeline (Rounded)",
    category: "Analytics",
  },
  { name: "timeline-sharp", label: "Timeline (Sharp)", category: "Analytics" },
  {
    name: "timeline-two-tone",
    label: "Timeline (Two-tone)",
    category: "Analytics",
  },
  {
    name: "analytics-outlined",
    label: "Analytics (Outlined)",
    category: "Analytics",
  },
  {
    name: "analytics-rounded",
    label: "Analytics (Rounded)",
    category: "Analytics",
  },
  {
    name: "analytics-sharp",
    label: "Analytics (Sharp)",
    category: "Analytics",
  },
  {
    name: "analytics-two-tone",
    label: "Analytics (Two-tone)",
    category: "Analytics",
  },
  {
    name: "assessment-outlined",
    label: "Assessment (Outlined)",
    category: "Analytics",
  },
  {
    name: "assessment-rounded",
    label: "Assessment (Rounded)",
    category: "Analytics",
  },
  {
    name: "assessment-sharp",
    label: "Assessment (Sharp)",
    category: "Analytics",
  },
  {
    name: "assessment-two-tone",
    label: "Assessment (Two-tone)",
    category: "Analytics",
  },
  {
    name: "dashboard-outlined",
    label: "Dashboard (Outlined)",
    category: "Analytics",
  },
  {
    name: "dashboard-rounded",
    label: "Dashboard (Rounded)",
    category: "Analytics",
  },
  {
    name: "dashboard-sharp",
    label: "Dashboard (Sharp)",
    category: "Analytics",
  },
  {
    name: "dashboard-two-tone",
    label: "Dashboard (Two-tone)",
    category: "Analytics",
  },

  // Pet icons
  { name: "pets", label: "Dog", category: "Pets" },
  { name: "pets-outlined", label: "Dog (Outlined)", category: "Pets" },
  { name: "pets-rounded", label: "Dog (Rounded)", category: "Pets" },
  { name: "pets-sharp", label: "Dog (Sharp)", category: "Pets" },
  { name: "pets-two-tone", label: "Dog (Two-tone)", category: "Pets" },
  {
    name: "sound-detection-dog-barking",
    label: "Sound Detection Dog Barking",
    category: "Pets",
  },
  { name: "dog-alert", label: "Dog Alert", category: "Pets" },

  // Robot icons
  { name: "smart-toy", label: "Robot", category: "Robots" },
  { name: "smart-toy-outlined", label: "Robot (Outlined)", category: "Robots" },
  { name: "smart-toy-rounded", label: "Robot (Rounded)", category: "Robots" },
  { name: "smart-toy-sharp", label: "Robot (Sharp)", category: "Robots" },
  { name: "smart-toy-two-tone", label: "Robot (Two-tone)", category: "Robots" },
];

const IconPicker: React.FC<IconPickerProps> = ({
  value,
  onChange,
  label = "Icon",
  placeholder = "Search icons...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<"icons" | "images">("icons");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredIcons = useMemo(() => {
    let filtered = availableIcons;

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter((icon) => icon.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (icon) =>
          icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          icon.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [searchTerm, selectedCategory]);

  const selectedIcon = availableIcons.find((icon) => icon.name === value);

  // Check if current value is an image
  const isImageValue = value && value.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(availableIcons.map((icon) => icon.category))];
    return ["All", ...cats];
  }, []);

  // Handle image file upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          onChange(result); // Use data URL
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image URL input
  const handleImageUrlChange = (url: string) => {
    if (url.trim()) {
      onChange(url);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <label
        style={{
          display: "block",
          marginBottom: "8px",
          fontSize: "14px",
          fontWeight: "500",
          color: "#374151",
        }}
      >
        {label}
      </label>

      {/* Current selection display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "12px 16px",
          border: "1px solid #d1d5db",
          borderRadius: "6px",
          backgroundColor: "white",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "14px",
          color: "#374151",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#3b82f6";
          e.target.style.outline = "none";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#d1d5db";
        }}
      >
        {isImageValue ? (
          <>
            <img
              src={value.startsWith("data:") ? value : `/icons/${value}`}
              alt="Menu icon"
              style={{
                width: 24,
                height: 24,
                objectFit: "contain",
              }}
            />
            <span>Custom Image</span>
          </>
        ) : selectedIcon ? (
          <>
            <MaterialIcon icon={selectedIcon.name} size={24} />
            <span>{selectedIcon.label}</span>
          </>
        ) : (
          <>
            <MaterialIcon icon="search" size={24} color="#9ca3af" />
            <span style={{ color: "#9ca3af" }}>Select an icon...</span>
          </>
        )}
        <span
          style={{ marginLeft: "auto", fontSize: "12px", color: "#9ca3af" }}
        >
          ▼
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "white",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
            maxHeight: "400px",
            overflow: "hidden",
            minWidth: "300px",
          }}
        >
          {/* Tab interface */}
          <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
            <button
              type="button"
              onClick={() => setActiveTab("icons")}
              style={{
                flex: 1,
                padding: "12px",
                border: "none",
                backgroundColor: activeTab === "icons" ? "#3b82f6" : "#f9fafb",
                color: activeTab === "icons" ? "white" : "#374151",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: activeTab === "icons" ? "500" : "400",
                transition: "all 0.2s",
              }}
            >
              Material Icons
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("images")}
              style={{
                flex: 1,
                padding: "12px",
                border: "none",
                backgroundColor: activeTab === "images" ? "#3b82f6" : "#f9fafb",
                color: activeTab === "images" ? "white" : "#374151",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: activeTab === "images" ? "500" : "400",
                transition: "all 0.2s",
              }}
            >
              Custom Images
            </button>
          </div>

          {/* Search and filter controls - only show for icons tab */}
          {activeTab === "icons" && (
            <div style={{ padding: "12px", borderBottom: "1px solid #e5e7eb" }}>
              <input
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                  outline: "none",
                  marginBottom: "8px",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d1d5db";
                }}
              />

              {/* Category filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "12px",
                  outline: "none",
                  backgroundColor: "#f9fafb",
                }}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category} (
                    {
                      availableIcons.filter((icon) =>
                        category === "All" ? true : icon.category === category
                      ).length
                    }
                    )
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Icon list - only show for icons tab */}
          {activeTab === "icons" && (
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {filteredIcons.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(120px, 1fr))",
                    gap: "4px",
                    padding: "8px",
                  }}
                >
                  {filteredIcons.map((icon) => (
                    <button
                      key={icon.name}
                      type="button"
                      onClick={() => {
                        onChange(icon.name);
                        setIsOpen(false);
                        setSearchTerm("");
                        setSelectedCategory("All");
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        backgroundColor:
                          value === icon.name ? "#ebf8ff" : "white",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "12px",
                        color: "#374151",
                        transition: "all 0.2s",
                        minHeight: "80px",
                      }}
                      onMouseEnter={(e) => {
                        if (value !== icon.name) {
                          e.currentTarget.style.backgroundColor = "#f3f4f6";
                          e.currentTarget.style.borderColor = "#d1d5db";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (value !== icon.name) {
                          e.currentTarget.style.backgroundColor = "white";
                          e.currentTarget.style.borderColor = "#e5e7eb";
                        }
                      }}
                      title={`${icon.label} (${icon.category})`}
                    >
                      <MaterialIcon
                        icon={icon.name}
                        size={24}
                        color={value === icon.name ? "#3b82f6" : "#6b7280"}
                      />
                      <span
                        style={{
                          textAlign: "center",
                          lineHeight: "1.2",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "100%",
                        }}
                      >
                        {icon.label}
                      </span>
                      {value === icon.name && (
                        <span
                          style={{
                            position: "absolute",
                            top: "4px",
                            right: "4px",
                            color: "#3b82f6",
                            fontSize: "10px",
                            backgroundColor: "white",
                            borderRadius: "50%",
                            width: "16px",
                            height: "16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid #3b82f6",
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    color: "#6b7280",
                    fontSize: "14px",
                  }}
                >
                  No icons found matching &quot;{searchTerm}&quot; in{" "}
                  {selectedCategory}
                </div>
              )}
            </div>
          )}

          {/* Image upload section - only show for images tab */}
          {activeTab === "images" && (
            <div style={{ padding: "16px" }}>
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                  }}
                >
                  Upload Image File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px dashed #d1d5db",
                    borderRadius: "6px",
                    backgroundColor: "#f9fafb",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#6b7280",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#3b82f6";
                    e.currentTarget.style.backgroundColor = "#f0f9ff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#d1d5db";
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                  }}
                >
                  📁 Click to upload image file
                </button>
              </div>

              {/* Predefined custom images */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                  }}
                >
                  Predefined Custom Images
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                    gap: "8px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onChange("spotter-custom.svg");
                      setIsOpen(false);
                    }}
                    style={{
                      padding: "8px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      backgroundColor:
                        value === "spotter-custom.svg" ? "#ebf8ff" : "white",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "10px",
                      color: "#374151",
                      transition: "all 0.2s",
                      minHeight: "60px",
                    }}
                    onMouseEnter={(e) => {
                      if (value !== "spotter-custom.svg") {
                        e.currentTarget.style.backgroundColor = "#f3f4f6";
                        e.currentTarget.style.borderColor = "#d1d5db";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (value !== "spotter-custom.svg") {
                        e.currentTarget.style.backgroundColor = "white";
                        e.currentTarget.style.borderColor = "#e5e7eb";
                      }
                    }}
                    title="Spotter Icon"
                  >
                    <img
                      src="/icons/spotter-custom.svg"
                      alt="Spotter"
                      style={{
                        width: 24,
                        height: 24,
                        objectFit: "contain",
                      }}
                    />
                    <span style={{ textAlign: "center", lineHeight: "1.2" }}>
                      Spotter
                    </span>
                    {value === "spotter-custom.svg" && (
                      <span
                        style={{
                          position: "absolute",
                          top: "2px",
                          right: "2px",
                          color: "#3b82f6",
                          fontSize: "8px",
                          backgroundColor: "white",
                          borderRadius: "50%",
                          width: "12px",
                          height: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid #3b82f6",
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                  }}
                >
                  Or enter image URL
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/image.png or /icons/image.png"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3b82f6";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#d1d5db";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleImageUrlChange(e.currentTarget.value);
                      setIsOpen(false);
                    }
                  }}
                />
              </div>

              {isImageValue && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px",
                    backgroundColor: "#f0f9ff",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    Current Image:
                  </div>
                  <img
                    src={value.startsWith("data:") ? value : `/icons/${value}`}
                    alt="Current icon"
                    style={{
                      width: 48,
                      height: 48,
                      objectFit: "contain",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => onChange("")}
                    style={{
                      marginTop: "8px",
                      padding: "4px 8px",
                      border: "1px solid #ef4444",
                      borderRadius: "4px",
                      backgroundColor: "white",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onClick={() => {
            setIsOpen(false);
            setSearchTerm("");
            setSelectedCategory("All");
            setActiveTab("icons");
          }}
        />
      )}
    </div>
  );
};

export default IconPicker;
