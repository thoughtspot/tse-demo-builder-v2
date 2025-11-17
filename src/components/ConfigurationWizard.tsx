"use client";

import React, { useState, useEffect } from "react";
import MaterialIcon from "./MaterialIcon";
import LoadingDialog from "./LoadingDialog";
import SearchableDropdown from "./SearchableDropdown";
import { DEFAULT_CONFIG } from "../services/configurationService";
import { StandardMenu } from "../types/thoughtspot";

interface ConfigurationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (config: WizardConfiguration) => void;
  currentThoughtSpotUrl?: string;
  standardMenus?: StandardMenu[];
}

export interface WizardCustomMenu {
  name: string;
  icon: string;
  type: "tag" | "direct";
  // For tag-based menus
  tagIdentifiers?: string[];
  // For direct embed
  directEmbed?: {
    type: "liveboard" | "answer";
    contentId: string;
    contentName?: string;
  };
}

export interface WizardConfiguration {
  thoughtspotUrl: string;
  applicationName: string;
  enabledMenus: string[];
  modelId?: string;
  homePageDescription?: string;
  styleDescription?: string;
  customMenus?: WizardCustomMenu[];
}

const ConfigurationWizard: React.FC<ConfigurationWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
  currentThoughtSpotUrl,
  standardMenus,
}) => {
  const [thoughtspotUrl, setThoughtspotUrl] = useState(
    currentThoughtSpotUrl || DEFAULT_CONFIG.appConfig.thoughtspotUrl
  );
  const [applicationName, setApplicationName] = useState(
    DEFAULT_CONFIG.appConfig.applicationName
  );
  const [enabledMenus, setEnabledMenus] = useState<string[]>(
    DEFAULT_CONFIG.standardMenus.filter((m) => m.enabled).map((m) => m.id)
  );
  const [modelId, setModelId] = useState<string>("");
  const [homePageDescription, setHomePageDescription] = useState("");
  const [styleDescription, setStyleDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [modelOptions, setModelOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Custom menus state (array)
  const [customMenus, setCustomMenus] = useState<WizardCustomMenu[]>([]);

  // Current custom menu being edited
  const [editingMenuIndex, setEditingMenuIndex] = useState<number | null>(null);
  const [showMenuEditor, setShowMenuEditor] = useState(false);
  const [customMenuName, setCustomMenuName] = useState("");
  const [customMenuIcon, setCustomMenuIcon] = useState("dashboard");
  const [customMenuType, setCustomMenuType] = useState<"tag" | "direct">("tag");
  const [customMenuTags, setCustomMenuTags] = useState<string[]>([]);
  const [customMenuDirectType, setCustomMenuDirectType] = useState<
    "liveboard" | "answer"
  >("liveboard");
  const [customMenuDirectId, setCustomMenuDirectId] = useState("");
  const [customMenuDirectName, setCustomMenuDirectName] = useState("");

  // Content and tag options
  const [availableTags, setAvailableTags] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);
  const [availableLiveboards, setAvailableLiveboards] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [availableAnswers, setAvailableAnswers] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [tagFilter, setTagFilter] = useState("");
  const [contentFilter, setContentFilter] = useState("");

  // Reset form when wizard opens
  useEffect(() => {
    if (isOpen) {
      setThoughtspotUrl(
        currentThoughtSpotUrl || DEFAULT_CONFIG.appConfig.thoughtspotUrl
      );
      setApplicationName(DEFAULT_CONFIG.appConfig.applicationName);
      setEnabledMenus(
        DEFAULT_CONFIG.standardMenus.filter((m) => m.enabled).map((m) => m.id)
      );
      setModelId("");
      setHomePageDescription("");
      setStyleDescription("");
      setCustomMenus([]);
      setEditingMenuIndex(null);
      setShowMenuEditor(false);
      setCustomMenuName("");
      setCustomMenuIcon("dashboard");
      setCustomMenuType("tag");
      setCustomMenuTags([]);
      setCustomMenuDirectType("liveboard");
      setCustomMenuDirectId("");
      setCustomMenuDirectName("");
      setTagFilter("");
      setContentFilter("");
    }
  }, [isOpen, currentThoughtSpotUrl]);

  // Fetch models when wizard opens
  useEffect(() => {
    if (isOpen) {
      const fetchModels = async () => {
        try {
          setIsLoadingModels(true);
          const { fetchModels } = await import("../services/thoughtspotApi");
          const modelsData = await fetchModels();
          setModelOptions(
            modelsData.map((model) => ({ id: model.id, name: model.name }))
          );
        } catch (error) {
          console.error("Failed to fetch models:", error);
        } finally {
          setIsLoadingModels(false);
        }
      };
      fetchModels();
    }
  }, [isOpen]);

  // Fetch tags when wizard opens
  useEffect(() => {
    if (isOpen) {
      const fetchTags = async () => {
        try {
          setIsLoadingTags(true);
          const { fetchTags } = await import("../services/thoughtspotApi");
          const tagsData = await fetchTags();
          setAvailableTags(tagsData);
        } catch (error) {
          console.error("Failed to fetch tags:", error);
        } finally {
          setIsLoadingTags(false);
        }
      };
      fetchTags();
    }
  }, [isOpen]);

  // Fetch content (liveboards and answers) when wizard opens
  useEffect(() => {
    if (isOpen) {
      const fetchContent = async () => {
        try {
          setIsLoadingContent(true);
          const { fetchLiveboards, fetchAnswers } = await import(
            "../services/thoughtspotApi"
          );
          const [liveboardsData, answersData] = await Promise.all([
            fetchLiveboards(),
            fetchAnswers(),
          ]);
          setAvailableLiveboards(
            liveboardsData.map((lb) => ({ id: lb.id, name: lb.name }))
          );
          setAvailableAnswers(
            answersData.map((ans) => ({ id: ans.id, name: ans.name }))
          );
        } catch (error) {
          console.error("Failed to fetch content:", error);
        } finally {
          setIsLoadingContent(false);
        }
      };
      fetchContent();
    }
  }, [isOpen]);

  const handleMenuToggle = (menuId: string) => {
    setEnabledMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleAddNewCustomMenu = () => {
    setEditingMenuIndex(null);
    setCustomMenuName("");
    setCustomMenuIcon("dashboard");
    setCustomMenuType("tag");
    setCustomMenuTags([]);
    setCustomMenuDirectType("liveboard");
    setCustomMenuDirectId("");
    setCustomMenuDirectName("");
    setShowMenuEditor(true);
  };

  const handleEditCustomMenu = (index: number) => {
    const menu = customMenus[index];
    setEditingMenuIndex(index);
    setCustomMenuName(menu.name);
    setCustomMenuIcon(menu.icon);
    setCustomMenuType(menu.type);
    setCustomMenuTags(menu.tagIdentifiers || []);
    if (menu.directEmbed) {
      setCustomMenuDirectType(menu.directEmbed.type);
      setCustomMenuDirectId(menu.directEmbed.contentId);
      setCustomMenuDirectName(menu.directEmbed.contentName || "");
    }
    setShowMenuEditor(true);
  };

  const handleDeleteCustomMenu = (index: number) => {
    setCustomMenus((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveCustomMenu = () => {
    // Validate menu name (required)
    if (!customMenuName.trim()) {
      alert("Menu name is required. Please enter a name for your custom menu.");
      return;
    }

    // Validate tag-based menu requirements
    if (customMenuType === "tag" && customMenuTags.length === 0) {
      alert("Please select at least one tag for your tag-based menu.");
      return;
    }

    // Validate direct embed menu requirements
    if (customMenuType === "direct" && !customMenuDirectId) {
      alert(
        `Please select a ${customMenuDirectType} for your direct embed menu.`
      );
      return;
    }

    const newMenu: WizardCustomMenu = {
      name: customMenuName,
      icon: customMenuIcon,
      type: customMenuType,
      tagIdentifiers: customMenuType === "tag" ? customMenuTags : undefined,
      directEmbed:
        customMenuType === "direct"
          ? {
              type: customMenuDirectType,
              contentId: customMenuDirectId,
              contentName: customMenuDirectName,
            }
          : undefined,
    };

    if (editingMenuIndex !== null) {
      // Update existing menu
      setCustomMenus((prev) =>
        prev.map((menu, i) => (i === editingMenuIndex ? newMenu : menu))
      );
    } else {
      // Add new menu
      setCustomMenus((prev) => [...prev, newMenu]);
    }

    // Reset form
    setShowMenuEditor(false);
    setEditingMenuIndex(null);
    setCustomMenuName("");
    setCustomMenuIcon("dashboard");
    setCustomMenuType("tag");
    setCustomMenuTags([]);
    setCustomMenuDirectType("liveboard");
    setCustomMenuDirectId("");
    setCustomMenuDirectName("");
  };

  const handleCancelMenuEdit = () => {
    setShowMenuEditor(false);
    setEditingMenuIndex(null);
    setCustomMenuName("");
    setCustomMenuIcon("dashboard");
    setCustomMenuType("tag");
    setCustomMenuTags([]);
    setCustomMenuDirectType("liveboard");
    setCustomMenuDirectId("");
    setCustomMenuDirectName("");
  };

  const handleSubmit = async () => {
    try {
      setIsProcessing(true);
      setProcessingMessage("Preparing configuration...");
      setProcessingProgress(10);

      const config: WizardConfiguration = {
        thoughtspotUrl,
        applicationName,
        enabledMenus,
        modelId: modelId || undefined,
        homePageDescription: homePageDescription || undefined,
        styleDescription: styleDescription || undefined,
        customMenus: customMenus.length > 0 ? customMenus : undefined,
      };

      // Show different messages if AI generation will be used
      const willUseAI =
        (homePageDescription && homePageDescription.trim()) ||
        (styleDescription && styleDescription.trim());

      if (willUseAI) {
        setProcessingMessage("Calling AI to generate content and styles...");
        setProcessingProgress(30);
        console.log("Wizard: Configuration includes AI generation requests");
      } else {
        setProcessingMessage("Configuration ready!");
        setProcessingProgress(100);
      }

      // Call onComplete and let the parent handle AI generation
      await onComplete(config);

      if (willUseAI) {
        setProcessingMessage("AI generation complete!");
        setProcessingProgress(100);
      }

      // Small delay to show completion
      await new Promise((resolve) => setTimeout(resolve, 500));

      onClose();
    } catch (error) {
      console.error("Error creating configuration:", error);
      alert(
        `Failed to create configuration: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
      setProcessingProgress(0);
    }
  };

  if (!isOpen) return null;

  const allStandardMenus = [
    { id: "home", name: "Home", icon: "home" },
    { id: "favorites", name: "Favorites", icon: "star" },
    { id: "my-reports", name: "My Reports", icon: "assignment" },
    { id: "spotter", name: "Spotter", icon: "spotter" },
    { id: "search", name: "Search", icon: "manage_search" },
    { id: "full-app", name: "Full App", icon: "apps" },
    { id: "all-content", name: "All Content", icon: "library_books" },
  ];

  return (
    <>
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
          zIndex: 10000,
          padding: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            maxWidth: "800px",
            width: "100%",
            maxHeight: "90vh",
            overflow: "auto",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "24px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "sticky",
              top: 0,
              backgroundColor: "white",
              zIndex: 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <MaterialIcon
                icon="auto_fix_high"
                style={{ fontSize: "32px", color: "#8b5cf6" }}
              />
              <h2
                style={{
                  margin: 0,
                  fontSize: "24px",
                  fontWeight: "600",
                  color: "#1f2937",
                }}
              >
                Configuration Wizard
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                color: "#6b7280",
              }}
            >
              <MaterialIcon icon="close" style={{ fontSize: "24px" }} />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: "24px" }}>
            <p
              style={{
                marginTop: 0,
                marginBottom: "24px",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Quickly set up your ThoughtSpot embedded application with this
              guided wizard. Configure basic settings, select menus, and let AI
              generate your home page and styling.
            </p>

            {/* ThoughtSpot URL */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                  color: "#374151",
                  fontSize: "14px",
                }}
              >
                ThoughtSpot URL
              </label>
              <input
                type="text"
                value={thoughtspotUrl}
                onChange={(e) => setThoughtspotUrl(e.target.value)}
                placeholder="https://your-instance.thoughtspot.cloud/"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Application Name */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                  color: "#374151",
                  fontSize: "14px",
                }}
              >
                Application Name
              </label>
              <input
                type="text"
                value={applicationName}
                onChange={(e) => setApplicationName(e.target.value)}
                placeholder="My ThoughtSpot App"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Standard Menus */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "12px",
                  fontWeight: "500",
                  color: "#374151",
                  fontSize: "14px",
                }}
              >
                Standard Menus
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "12px",
                }}
              >
                {allStandardMenus.map((menu) => (
                  <label
                    key={menu.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      cursor: "pointer",
                      backgroundColor: enabledMenus.includes(menu.id)
                        ? "#f3f4f6"
                        : "white",
                      transition: "all 0.2s",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={enabledMenus.includes(menu.id)}
                      onChange={() => handleMenuToggle(menu.id)}
                      style={{ cursor: "pointer" }}
                    />
                    <MaterialIcon
                      icon={menu.icon}
                      style={{ fontSize: "20px", color: "#6b7280" }}
                    />
                    <span style={{ fontSize: "14px", color: "#374151" }}>
                      {menu.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Model Selector */}
            <div style={{ marginBottom: "24px" }}>
              <SearchableDropdown
                value={modelId}
                onChange={setModelId}
                options={modelOptions}
                placeholder={
                  isLoadingModels
                    ? "Loading models..."
                    : "Select a model (optional)"
                }
                searchPlaceholder="Search models..."
                label="AI Model for Spotter & Search (Optional)"
                disabled={isLoadingModels}
              />
            </div>

            {/* Home Page Description */}
            {enabledMenus.includes("home") && (
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                    color: "#374151",
                    fontSize: "14px",
                  }}
                >
                  Home Page Description{" "}
                  <span style={{ color: "#6b7280", fontWeight: "normal" }}>
                    (Optional - AI will generate HTML/CSS)
                  </span>
                </label>
                <textarea
                  value={homePageDescription}
                  onChange={(e) => setHomePageDescription(e.target.value)}
                  placeholder="Describe your ideal home page. For example: 'A modern dashboard with a hero section, feature cards, and a call-to-action button. Use a gradient background and clean typography.'"
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}

            {/* Style Description */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                  color: "#374151",
                  fontSize: "14px",
                }}
              >
                Style Description{" "}
                <span style={{ color: "#6b7280", fontWeight: "normal" }}>
                  (Optional - AI will generate colors and styling)
                </span>
              </label>
              <textarea
                value={styleDescription}
                onChange={(e) => setStyleDescription(e.target.value)}
                placeholder="Describe your desired style and colors. For example: 'Professional corporate theme with navy blue primary color (#1e3a8a), light gray backgrounds, and orange accents for buttons.'"
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
              <p
                style={{
                  marginTop: "8px",
                  fontSize: "12px",
                  color: "#6b7280",
                  fontStyle: "italic",
                }}
              >
                Note: If you leave this blank, default ThoughtSpot styling will
                be used.
              </p>
            </div>

            {/* Custom Menus Section */}
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <label
                  style={{
                    fontWeight: "500",
                    color: "#374151",
                    fontSize: "14px",
                  }}
                >
                  Custom Menus{" "}
                  <span style={{ color: "#6b7280", fontWeight: "normal" }}>
                    ({customMenus.length})
                  </span>
                </label>
                <button
                  onClick={handleAddNewCustomMenu}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#8b5cf6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <MaterialIcon icon="add" style={{ fontSize: "18px" }} />
                  Add Custom Menu
                </button>
              </div>

              {/* List of existing custom menus */}
              {customMenus.length > 0 && (
                <div
                  style={{
                    marginBottom: "16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  {customMenus.map((menu, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "12px 16px",
                        backgroundColor: "#f9fafb",
                        borderBottom:
                          index < customMenus.length - 1
                            ? "1px solid #e5e7eb"
                            : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <MaterialIcon
                          icon={menu.icon}
                          style={{ fontSize: "20px", color: "#6b7280" }}
                        />
                        <div>
                          <div style={{ fontWeight: "500", fontSize: "14px" }}>
                            {menu.name}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              marginTop: "2px",
                            }}
                          >
                            {menu.type === "tag"
                              ? `${menu.tagIdentifiers?.length || 0} tag(s)`
                              : `Direct: ${menu.directEmbed?.type}`}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleEditCustomMenu(index)}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "white",
                            color: "#374151",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "13px",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCustomMenu(index)}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "13px",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Custom menu editor modal */}
              {showMenuEditor && (
                <div
                  style={{
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    padding: "16px",
                    backgroundColor: "#f9fafb",
                  }}
                >
                  {/* Menu Name */}
                  <div style={{ marginBottom: "16px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontWeight: "500",
                        color: "#374151",
                        fontSize: "13px",
                      }}
                    >
                      Menu Name <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={customMenuName}
                      onChange={(e) => setCustomMenuName(e.target.value)}
                      placeholder="e.g., Sales Dashboard"
                      required
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: customMenuName.trim()
                          ? "1px solid #d1d5db"
                          : "1px solid #ef4444",
                        borderRadius: "6px",
                        fontSize: "14px",
                        boxSizing: "border-box",
                        backgroundColor: customMenuName.trim()
                          ? "white"
                          : "#fef2f2",
                      }}
                    />
                    {!customMenuName.trim() && (
                      <p
                        style={{
                          marginTop: "4px",
                          fontSize: "12px",
                          color: "#ef4444",
                        }}
                      >
                        Menu name is required
                      </p>
                    )}
                  </div>

                  {/* Menu Icon */}
                  <div style={{ marginBottom: "16px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontWeight: "500",
                        color: "#374151",
                        fontSize: "13px",
                      }}
                    >
                      Icon
                    </label>
                    <input
                      type="text"
                      value={customMenuIcon}
                      onChange={(e) => setCustomMenuIcon(e.target.value)}
                      placeholder="Material icon name (e.g., dashboard, analytics)"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {/* Menu Type */}
                  <div style={{ marginBottom: "16px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontWeight: "500",
                        color: "#374151",
                        fontSize: "13px",
                      }}
                    >
                      Menu Type
                    </label>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          checked={customMenuType === "tag"}
                          onChange={() => setCustomMenuType("tag")}
                          style={{ marginRight: "6px" }}
                        />
                        <span style={{ fontSize: "14px" }}>Tag-based List</span>
                      </label>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          checked={customMenuType === "direct"}
                          onChange={() => setCustomMenuType("direct")}
                          style={{ marginRight: "6px" }}
                        />
                        <span style={{ fontSize: "14px" }}>Direct Embed</span>
                      </label>
                    </div>
                  </div>

                  {/* Tag Selection */}
                  {customMenuType === "tag" && (
                    <div style={{ marginBottom: "16px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "6px",
                          fontWeight: "500",
                          color: "#374151",
                          fontSize: "13px",
                        }}
                      >
                        Select Tags <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      {isLoadingTags ? (
                        <p style={{ fontSize: "13px", color: "#6b7280" }}>
                          Loading tags...
                        </p>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={tagFilter}
                            onChange={(e) => setTagFilter(e.target.value)}
                            placeholder="Filter tags..."
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                              fontSize: "14px",
                              marginBottom: "8px",
                              boxSizing: "border-box",
                            }}
                          />
                          <select
                            multiple
                            value={customMenuTags}
                            onChange={(e) => {
                              const selected = Array.from(
                                e.target.selectedOptions,
                                (option) => option.value
                              );
                              setCustomMenuTags(selected);
                            }}
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                              fontSize: "14px",
                              minHeight: "120px",
                              boxSizing: "border-box",
                            }}
                          >
                            {availableTags
                              .filter((tag) =>
                                tag.name
                                  .toLowerCase()
                                  .includes(tagFilter.toLowerCase())
                              )
                              .map((tag) => (
                                <option key={tag.id} value={tag.name}>
                                  {tag.name}
                                </option>
                              ))}
                          </select>
                          <p
                            style={{
                              marginTop: "6px",
                              fontSize: "12px",
                              color: "#6b7280",
                            }}
                          >
                            Hold Ctrl/Cmd to select multiple tags
                          </p>
                          {customMenuTags.length === 0 && (
                            <p
                              style={{
                                marginTop: "6px",
                                fontSize: "12px",
                                color: "#ef4444",
                              }}
                            >
                              Please select at least one tag
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Direct Embed Selection */}
                  {customMenuType === "direct" && (
                    <>
                      {/* Content Type */}
                      <div style={{ marginBottom: "16px" }}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "6px",
                            fontWeight: "500",
                            color: "#374151",
                            fontSize: "13px",
                          }}
                        >
                          Content Type
                        </label>
                        <select
                          value={customMenuDirectType}
                          onChange={(e) => {
                            setCustomMenuDirectType(
                              e.target.value as "liveboard" | "answer"
                            );
                            setCustomMenuDirectId("");
                            setCustomMenuDirectName("");
                          }}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                            boxSizing: "border-box",
                          }}
                        >
                          <option value="liveboard">Liveboard</option>
                          <option value="answer">Answer</option>
                        </select>
                      </div>

                      {/* Content Selection */}
                      <div style={{ marginBottom: "16px" }}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "6px",
                            fontWeight: "500",
                            color: "#374151",
                            fontSize: "13px",
                          }}
                        >
                          Select{" "}
                          {customMenuDirectType === "liveboard"
                            ? "Liveboard"
                            : "Answer"}{" "}
                          <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        {isLoadingContent ? (
                          <p style={{ fontSize: "13px", color: "#6b7280" }}>
                            Loading content...
                          </p>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={contentFilter}
                              onChange={(e) => setContentFilter(e.target.value)}
                              placeholder="Filter content..."
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                fontSize: "14px",
                                marginBottom: "8px",
                                boxSizing: "border-box",
                              }}
                            />
                            <select
                              value={customMenuDirectId}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                const content =
                                  customMenuDirectType === "liveboard"
                                    ? availableLiveboards.find(
                                        (lb) => lb.id === selectedId
                                      )
                                    : availableAnswers.find(
                                        (ans) => ans.id === selectedId
                                      );
                                setCustomMenuDirectId(selectedId);
                                setCustomMenuDirectName(content?.name || "");
                              }}
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                fontSize: "14px",
                                minHeight: "120px",
                                boxSizing: "border-box",
                              }}
                              size={5}
                            >
                              <option value="">
                                -- Select {customMenuDirectType} --
                              </option>
                              {(customMenuDirectType === "liveboard"
                                ? availableLiveboards
                                : availableAnswers
                              )
                                .filter((item) =>
                                  item.name
                                    .toLowerCase()
                                    .includes(contentFilter.toLowerCase())
                                )
                                .map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name}
                                  </option>
                                ))}
                            </select>
                            {!customMenuDirectId && (
                              <p
                                style={{
                                  marginTop: "6px",
                                  fontSize: "12px",
                                  color: "#ef4444",
                                }}
                              >
                                Please select a{" "}
                                {customMenuDirectType === "liveboard"
                                  ? "liveboard"
                                  : "answer"}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}

                  {/* Save and Cancel buttons for menu editor */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "12px",
                      marginTop: "16px",
                      paddingTop: "16px",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <button
                      onClick={handleCancelMenuEdit}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "white",
                        color: "#374151",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveCustomMenu}
                      disabled={
                        !customMenuName.trim() ||
                        (customMenuType === "tag" &&
                          customMenuTags.length === 0) ||
                        (customMenuType === "direct" && !customMenuDirectId)
                      }
                      style={{
                        padding: "8px 16px",
                        backgroundColor:
                          !customMenuName.trim() ||
                          (customMenuType === "tag" &&
                            customMenuTags.length === 0) ||
                          (customMenuType === "direct" && !customMenuDirectId)
                            ? "#9ca3af"
                            : "#8b5cf6",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor:
                          !customMenuName.trim() ||
                          (customMenuType === "tag" &&
                            customMenuTags.length === 0) ||
                          (customMenuType === "direct" && !customMenuDirectId)
                            ? "not-allowed"
                            : "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        opacity:
                          !customMenuName.trim() ||
                          (customMenuType === "tag" &&
                            customMenuTags.length === 0) ||
                          (customMenuType === "direct" && !customMenuDirectId)
                            ? 0.6
                            : 1,
                      }}
                    >
                      <MaterialIcon icon="save" style={{ fontSize: "18px" }} />
                      {editingMenuIndex !== null ? "Update Menu" : "Save Menu"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "24px",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              position: "sticky",
              bottom: 0,
              backgroundColor: "white",
            }}
          >
            <button
              onClick={onClose}
              disabled={isProcessing}
              style={{
                padding: "10px 20px",
                backgroundColor: "white",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                cursor: isProcessing ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "500",
                opacity: isProcessing ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                isProcessing ||
                !thoughtspotUrl ||
                !applicationName ||
                enabledMenus.length === 0
              }
              style={{
                padding: "10px 20px",
                backgroundColor:
                  !thoughtspotUrl ||
                  !applicationName ||
                  enabledMenus.length === 0
                    ? "#9ca3af"
                    : "#8b5cf6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor:
                  isProcessing ||
                  !thoughtspotUrl ||
                  !applicationName ||
                  enabledMenus.length === 0
                    ? "not-allowed"
                    : "pointer",
                fontSize: "14px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <MaterialIcon icon="auto_fix_high" style={{ fontSize: "18px" }} />
              Create Configuration
            </button>
          </div>
        </div>
      </div>

      <LoadingDialog
        isOpen={isProcessing}
        message={processingMessage}
        progress={processingProgress}
      />
    </>
  );
};

export default ConfigurationWizard;
