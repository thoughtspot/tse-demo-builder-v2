"use client";

import { useState, useRef } from "react";

interface IconPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (icon: string) => void;
  currentIcon?: string;
}

// Emoji name mapping for search
const emojiNames: Record<string, string[]> = {
  "🏠": ["house", "home", "building"],
  "🏡": ["house", "home", "building"],
  "🏘️": ["houses", "buildings"],
  "🏚️": ["house", "building", "abandoned"],
  "🏗️": ["construction", "building"],
  "🏭": ["factory", "industrial"],
  "🏢": ["office", "building", "skyscraper"],
  "🏬": ["department store", "building"],
  "🏣": ["post office", "building"],
  "🏤": ["post office", "building"],
  "🏥": ["hospital", "medical"],
  "🏦": ["bank", "money"],
  "⭐": ["star", "favorite"],
  "🌟": ["star", "sparkle"],
  "✨": ["sparkle", "star"],
  "💫": ["dizzy", "star"],
  "⭐️": ["star", "favorite"],
  "💎": ["diamond", "gem", "jewel"],
  "💍": ["ring", "jewelry"],
  "📊": ["chart", "graph", "analytics", "finance", "data", "stock", "market"],
  "📈": ["chart", "graph", "trending up", "stock", "finance", "bull", "growth"],
  "📉": [
    "chart",
    "graph",
    "trending down",
    "stock",
    "finance",
    "bear",
    "decline",
  ],
  "📋": ["clipboard", "list", "finance", "report"],
  "📄": ["document", "paper", "finance", "report"],
  "📑": ["documents", "papers", "finance", "files"],
  "📚": ["books", "library", "finance", "research"],
  "📖": ["book", "reading", "finance", "manual"],
  "📕": ["book", "red", "finance"],
  "📗": ["book", "green", "finance"],
  "📘": ["book", "blue", "finance"],
  "📙": ["book", "orange", "finance"],
  "🔍": ["magnifying glass", "search", "analysis", "research", "finance"],
  "🔎": ["magnifying glass", "search", "analysis", "research", "finance"],
  "🔐": ["lock", "security"],
  "🔓": ["unlock", "open"],
  "🔒": ["lock", "security"],
  "🔑": ["key", "unlock"],
  "🗝️": ["key", "old key"],
  "📱": ["mobile", "phone", "smartphone"],
  "📲": ["mobile", "phone", "smartphone"],
  "💻": ["laptop", "computer"],
  "🖥️": ["desktop", "computer"],
  "🖨️": ["printer"],
  "⌨️": ["keyboard"],
  "🖱️": ["mouse", "computer"],
  "🖲️": ["trackball", "mouse"],
  "💽": ["disk", "storage"],
  "💾": ["floppy disk", "save"],
  "💿": ["cd", "disk"],
  "📀": ["dvd", "disk"],
  "💰": ["money bag", "money", "finance", "wealth", "cash"],
  "💵": ["dollar", "money", "finance", "currency", "cash"],
  "💸": ["money", "flying money", "finance", "spending", "cash"],
  "💳": ["credit card", "card", "finance", "payment", "banking"],
  "💴": ["yen", "money", "finance", "currency", "japanese"],
  "💶": ["euro", "money", "finance", "currency", "european"],
  "💷": ["pound", "money", "finance", "currency", "british"],
  "🪙": ["coin", "money", "finance", "currency", "cash"],
  "💱": ["currency exchange", "money"],
  "💲": ["dollar", "money"],
  "💹": [
    "chart",
    "graph",
    "trending up",
    "stock",
    "finance",
    "bull",
    "growth",
    "yen",
  ],
  "📞": ["phone", "telephone"],
  "📟": ["pager"],
  "📠": ["fax"],
  "📡": ["satellite", "antenna"],
  "📺": ["tv", "television"],
  "📻": ["radio"],
  "🎙️": ["microphone"],
  "🎚️": ["slider", "control"],
  "🎛️": ["knobs", "control"],
  "🧭": ["compass", "navigation"],
  "⏱️": ["stopwatch", "timer"],
  "⏲️": ["timer", "clock"],
  "⚙️": ["gear", "settings"],
  "🔧": ["wrench", "tool"],
  "🔨": ["hammer", "tool"],
  "🔩": ["nut", "bolt"],
  "🔪": ["knife", "weapon"],
  "🗡️": ["dagger", "weapon"],
  "⚔️": ["swords", "weapon"],
  "🛡️": ["shield", "protection"],
  "🔫": ["gun", "weapon"],
  "🏹": ["bow", "arrow", "weapon"],
  "🪃": ["boomerang", "weapon"],
  "🎯": ["target", "dart"],
  "🎲": ["dice", "game"],
  "🎮": ["game", "controller"],
  "🎰": ["slot machine", "game"],
  "🎳": ["bowling", "game"],
  "🎨": ["art", "palette"],
  "🎭": ["theater", "drama"],
  "🎪": ["circus", "tent"],
  "🎟️": ["ticket", "admission"],
  "🎫": ["ticket"],
  "🎗️": ["ribbon", "reminder"],
  "🎖️": ["medal", "military"],
  "🚗": ["car", "automobile", "vehicle", "transportation"],
  "🚙": ["suv", "car", "vehicle", "transportation"],
  "🚕": ["taxi", "car", "vehicle", "transportation"],
  "🚌": ["bus", "public transport", "vehicle", "transportation"],
  "🚎": ["trolleybus", "bus", "public transport", "vehicle", "transportation"],
  "🏎️": ["racing car", "sports car", "vehicle", "transportation"],
  "🚓": ["police car", "emergency", "vehicle", "transportation"],
  "🚑": ["ambulance", "emergency", "medical", "vehicle", "transportation"],
  "🚒": ["fire engine", "fire truck", "emergency", "vehicle", "transportation"],
  "🚐": ["minibus", "van", "vehicle", "transportation"],
  "🚚": ["truck", "delivery", "vehicle", "transportation"],
  "🚛": ["articulated lorry", "truck", "vehicle", "transportation"],
  "🚜": ["tractor", "farm", "vehicle", "transportation"],
  "🛴": ["kick scooter", "scooter", "vehicle", "transportation"],
  "🛵": ["motor scooter", "scooter", "vehicle", "transportation"],
  "🏍️": ["motorcycle", "bike", "vehicle", "transportation"],
  "🚲": ["bicycle", "bike", "vehicle", "transportation"],
  "🚁": ["helicopter", "aircraft", "vehicle", "transportation"],
  "🚂": ["locomotive", "train", "railway", "vehicle", "transportation"],
  "🚃": ["railway car", "train", "railway", "vehicle", "transportation"],
  "🚄": [
    "high-speed train",
    "bullet train",
    "railway",
    "vehicle",
    "transportation",
  ],
  "🚅": [
    "bullet train",
    "high-speed train",
    "railway",
    "vehicle",
    "transportation",
  ],
  "🚆": ["train", "railway", "vehicle", "transportation"],
  "🚇": [
    "metro",
    "subway",
    "underground",
    "railway",
    "vehicle",
    "transportation",
  ],
  "🚈": ["light rail", "tram", "railway", "vehicle", "transportation"],
  "🚉": ["station", "railway", "transportation"],
  "🚊": ["tram", "streetcar", "railway", "vehicle", "transportation"],
  "🚝": ["monorail", "railway", "vehicle", "transportation"],
  "🚞": ["mountain railway", "railway", "vehicle", "transportation"],
  "🚋": ["tram car", "tram", "railway", "vehicle", "transportation"],
  "🚍": [
    "oncoming bus",
    "bus",
    "public transport",
    "vehicle",
    "transportation",
  ],
  "🚏": ["bus stop", "transportation"],
  "🚔": ["oncoming police car", "emergency", "vehicle", "transportation"],
  "🚖": ["oncoming taxi", "taxi", "car", "vehicle", "transportation"],
  "🚘": ["oncoming automobile", "car", "vehicle", "transportation"],
  "🛩️": ["small airplane", "aircraft", "vehicle", "transportation"],
  "✈️": ["airplane", "aircraft", "vehicle", "transportation"],
  "🛫": ["airplane departure", "aircraft", "vehicle", "transportation"],
  "🛬": ["airplane arrival", "aircraft", "vehicle", "transportation"],
  "🛰️": ["satellite", "space", "vehicle", "transportation"],
  "🚀": ["rocket", "space", "vehicle", "transportation"],
  "🛸": ["flying saucer", "ufo", "space", "vehicle", "transportation"],
};

// Unicode icon grid - Clean and Comprehensive
const iconGrid = [
  // Navigation & Home
  ["🏠", "🏡", "🏘️", "🏚️", "🏗️", "🏭", "🏢", "🏬", "🏣", "🏤", "🏥", "🏦"],
  // Stars & Favorites
  ["⭐", "🌟", "✨", "💫", "⭐️", "💎", "💍", "🎯", "🎲", "🎮", "🎰", "🎳"],
  // Documents & Reports
  ["📊", "📈", "📉", "📋", "📄", "📑", "📚", "📖", "📕", "📗", "📘", "📙"],
  // Search & Discovery
  ["🔍", "🔎", "🔐", "🔓", "🔒", "🔑", "🗝️", "🔍", "🔎", "🔍", "🔎", "🔍"],
  // Technology & Apps
  ["📱", "📲", "💻", "🖥️", "🖨️", "⌨️", "🖱️", "🖲️", "💽", "💾", "💿", "📀"],
  // Business & Finance
  ["💰", "💵", "💸", "💳", "💴", "💶", "💷", "🪙", "💱", "💲", "💹", "📊"],
  // Communication
  ["📞", "📟", "📠", "📡", "📺", "📻", "🎙️", "🎚️", "🎛️", "🧭", "⏱️", "⏲️"],
  // Tools & Settings
  ["⚙️", "🔧", "🔨", "🔩", "🔪", "🗡️", "⚔️", "🛡️", "🔫", "🏹", "🪃", "🎯"],
  // Finance & Trading
  ["💹", "📈", "📉", "📊", "💰", "💵", "💸", "💳", "💴", "💶", "💷", "🪙"],
  // Arts & Entertainment
  ["🎨", "🎭", "🎪", "🎟️", "🎫", "🎗️", "🎖️", "🎨", "🎭", "🎪", "🎟️", "🎫"],
  // Transportation - Ground Vehicles
  ["🚗", "🚙", "🚕", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🚚", "🚛"],
  // Transportation - More Ground Vehicles
  ["🚜", "🛴", "🛵", "🏍️", "🚲", "🚁", "🚂", "🚃", "🚄", "🚅", "🚆", "🚇"],
  // Transportation - Rail & Air
  ["🚈", "🚉", "🚊", "🚝", "🚞", "🚋", "🚍", "🚏", "🚔", "🚖", "🚘", "🛩️"],
  // Transportation - Aircraft & Space
  ["✈️", "🛫", "🛬", "🛰️", "🚀", "🛸", "", "", "", "", "", ""],
];

export default function IconPicker({
  isOpen,
  onClose,
  onSelect,
  currentIcon,
}: IconPickerProps) {
  const [iconFilter, setIconFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"icons" | "custom">("icons");
  const [customImages, setCustomImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setIconFilter("");
    onClose();
  };

  const handleSelect = (icon: string) => {
    onSelect(icon);
    handleClose();
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCustomImages((prev) => [...prev, result]);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Failed to upload image");
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleRemoveCustomImage = (index: number) => {
    setCustomImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "600px",
          maxHeight: "500px",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
            Select Icon or Image
          </h3>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e5e7eb",
            marginBottom: "16px",
          }}
        >
          <button
            onClick={() => setActiveTab("icons")}
            style={{
              padding: "8px 16px",
              border: "none",
              background: "none",
              cursor: "pointer",
              borderBottom:
                activeTab === "icons"
                  ? "2px solid #3182ce"
                  : "2px solid transparent",
              color: activeTab === "icons" ? "#3182ce" : "#6b7280",
              fontWeight: activeTab === "icons" ? "600" : "400",
            }}
          >
            Icons
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            style={{
              padding: "8px 16px",
              border: "none",
              background: "none",
              cursor: "pointer",
              borderBottom:
                activeTab === "custom"
                  ? "2px solid #3182ce"
                  : "2px solid transparent",
              color: activeTab === "custom" ? "#3182ce" : "#6b7280",
              fontWeight: activeTab === "custom" ? "600" : "400",
            }}
          >
            Custom Images
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {activeTab === "icons" ? (
            <>
              {/* Search input */}
              <input
                type="text"
                placeholder="Search icons..."
                value={iconFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  setIconFilter(value);
                  console.log("Search input changed:", value);
                }}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                  width: "100%",
                }}
              />
              {iconFilter ? (
                // When filtering, show all matching icons in a single compact grid
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(12, 1fr)",
                    gap: "8px",
                  }}
                >
                  {iconGrid
                    .flat()
                    .map((icon, iconIndex) => {
                      // Check if this icon should be shown based on filter
                      const shouldShow = (() => {
                        const names = emojiNames[icon] || [];
                        const matches = names.some((name) =>
                          name.toLowerCase().includes(iconFilter.toLowerCase())
                        );
                        // Debug logging for train search
                        if (
                          iconFilter.toLowerCase() === "train" &&
                          icon === "🚂"
                        ) {
                          console.log("Train search debug:", {
                            icon,
                            names,
                            matches,
                          });
                        }
                        return matches;
                      })();

                      // Debug: Log when train icons are being processed
                      if (icon === "🚂" || icon === "🚃") {
                        console.log("Train icon processing:", {
                          shouldShow,
                          icon,
                        });
                      }

                      return shouldShow && icon ? (
                        <button
                          key={iconIndex}
                          onClick={() => handleSelect(icon)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "40px",
                            height: "40px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            backgroundColor:
                              icon === currentIcon ? "#3182ce" : "white",
                            color: icon === currentIcon ? "white" : "black",
                            fontSize: "20px",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (icon !== currentIcon) {
                              e.currentTarget.style.backgroundColor = "#f3f4f6";
                              e.currentTarget.style.borderColor = "#d1d5db";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (icon !== currentIcon) {
                              e.currentTarget.style.backgroundColor = "white";
                              e.currentTarget.style.borderColor = "#e5e7eb";
                            }
                          }}
                          title={icon}
                        >
                          {icon}
                        </button>
                      ) : null;
                    })
                    .filter(Boolean)}
                </div>
              ) : (
                // When not filtering, show the original row-based layout
                iconGrid.map((row, rowIndex) => (
                  <div
                    key={rowIndex}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(12, 1fr)",
                      gap: "8px",
                    }}
                  >
                    {row.map((icon, iconIndex) => (
                      <button
                        key={iconIndex}
                        onClick={() => handleSelect(icon)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "40px",
                          height: "40px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          backgroundColor:
                            icon === currentIcon ? "#3182ce" : "white",
                          color: icon === currentIcon ? "white" : "black",
                          fontSize: "20px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          if (icon !== currentIcon) {
                            e.currentTarget.style.backgroundColor = "#f3f4f6";
                            e.currentTarget.style.borderColor = "#d1d5db";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (icon !== currentIcon) {
                            e.currentTarget.style.backgroundColor = "white";
                            e.currentTarget.style.borderColor = "#e5e7eb";
                          }
                        }}
                        title={icon}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </>
          ) : (
            // Custom Images Tab
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {/* Upload Section */}
              <div
                style={{ display: "flex", gap: "8px", marginBottom: "16px" }}
              >
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: isUploading ? "#9ca3af" : "#3182ce",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: isUploading ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isUploading ? "Uploading..." : "Upload Image"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/svg+xml,image/webp,image/gif,image/bmp"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
              </div>

              {error && (
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "12px",
                    color: "#dc2626",
                  }}
                >
                  {error}
                </p>
              )}

              {/* Custom Images Grid */}
              {customImages.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(8, 1fr)",
                    gap: "8px",
                  }}
                >
                  {customImages.map((imageUrl, index) => (
                    <div
                      key={index}
                      style={{
                        position: "relative",
                        width: "40px",
                        height: "40px",
                      }}
                    >
                      <button
                        onClick={() => handleSelect(imageUrl)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "40px",
                          height: "40px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          backgroundColor:
                            imageUrl === currentIcon ? "#3182ce" : "white",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          padding: "2px",
                          overflow: "hidden",
                        }}
                        onMouseEnter={(e) => {
                          if (imageUrl !== currentIcon) {
                            e.currentTarget.style.backgroundColor = "#f3f4f6";
                            e.currentTarget.style.borderColor = "#d1d5db";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (imageUrl !== currentIcon) {
                            e.currentTarget.style.backgroundColor = "white";
                            e.currentTarget.style.borderColor = "#e5e7eb";
                          }
                        }}
                        title="Custom Image"
                      >
                        <img
                          src={imageUrl}
                          alt="Custom"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                      </button>
                      <button
                        onClick={() => handleRemoveCustomImage(index)}
                        style={{
                          position: "absolute",
                          top: "-4px",
                          right: "-4px",
                          width: "16px",
                          height: "16px",
                          backgroundColor: "#dc2626",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          cursor: "pointer",
                          fontSize: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: "1",
                        }}
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {customImages.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px",
                    color: "#6b7280",
                    fontSize: "14px",
                  }}
                >
                  No custom images uploaded yet. Click &quot;Upload Image&quot;
                  to add your first image.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
