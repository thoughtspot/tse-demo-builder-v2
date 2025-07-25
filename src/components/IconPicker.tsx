"use client";

import { useState } from "react";

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
  // Additional Finance
  ["💹", "📈", "📉", "📊", "💰", "💵", "💸", "💳", "💴", "💶", "💷", "🪙"],
  // More Finance Icons
  ["💹", "📈", "📉", "📊", "💰", "💵", "💸", "💳", "💴", "💶", "💷", "🪙"],
];

export default function IconPicker({
  isOpen,
  onClose,
  onSelect,
  currentIcon,
}: IconPickerProps) {
  const [iconFilter, setIconFilter] = useState("");

  const handleClose = () => {
    setIconFilter("");
    onClose();
  };

  const handleSelect = (icon: string) => {
    onSelect(icon);
    handleClose();
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
          maxHeight: "400px",
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
            Select Icon
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

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Search input */}
          <input
            type="text"
            placeholder="Search icons..."
            value={iconFilter}
            onChange={(e) => setIconFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              fontSize: "14px",
              width: "100%",
            }}
          />
          {iconGrid.map((row, rowIndex) => (
            <div
              key={rowIndex}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(12, 1fr)",
                gap: "8px",
              }}
            >
              {row.map((icon, iconIndex) => {
                // Check if this icon should be shown based on filter
                const shouldShow =
                  !iconFilter ||
                  (() => {
                    const names = emojiNames[icon] || [];
                    return names.some((name) =>
                      name.toLowerCase().includes(iconFilter.toLowerCase())
                    );
                  })();

                return shouldShow ? (
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
                ) : (
                  <div
                    key={iconIndex}
                    style={{
                      width: "40px",
                      height: "40px",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
