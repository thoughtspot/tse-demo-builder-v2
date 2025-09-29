import React, { useState, useMemo, useRef, useEffect } from "react";

interface MultiSelectDropdownOption {
  id: string;
  name: string;
  description?: string;
  [key: string]: string | number | boolean | undefined;
}

interface MultiSelectDropdownProps {
  value: string[];
  onChange: (values: string[]) => void;
  options: MultiSelectDropdownOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  disabled?: boolean;
  isLoading?: boolean;
  error?: string | null;
  style?: React.CSSProperties;
  className?: string;
  maxHeight?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  value = [],
  onChange,
  options,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  label,
  disabled = false,
  isLoading = false,
  error = null,
  style,
  className,
  maxHeight = "200px",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(
      (option) =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.description &&
          option.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [options, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggleOption = (optionId: string) => {
    const newValue = value.includes(optionId)
      ? value.filter((id) => id !== optionId)
      : [...value, optionId];
    onChange(newValue);
  };

  const handleRemoveOption = (optionId: string) => {
    onChange(value.filter((id) => id !== optionId));
  };

  const getSelectedOptions = () => {
    return options.filter((option) => value.includes(option.id));
  };

  const selectedOptions = getSelectedOptions();

  return (
    <div style={style} className={className}>
      {label && (
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
      )}

      {/* Selected options display */}
      {selectedOptions.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            marginBottom: "8px",
            padding: "8px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            backgroundColor: "#f9fafb",
            minHeight: "40px",
          }}
        >
          {selectedOptions.map((option) => (
            <div
              key={option.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                backgroundColor: "#3b82f6",
                color: "white",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "500",
              }}
            >
              <span>{option.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveOption(option.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold",
                  padding: "0",
                  width: "16px",
                  height: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropdown container */}
      <div ref={dropdownRef} style={{ position: "relative" }}>
        {/* Trigger button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || isLoading}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: error ? "1px solid #ef4444" : "1px solid #d1d5db",
            borderRadius: "4px",
            fontSize: "14px",
            backgroundColor: disabled ? "#f9fafb" : "white",
            color: disabled ? "#9ca3af" : "#374151",
            cursor: disabled || isLoading ? "not-allowed" : "pointer",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>
            {isLoading
              ? "Loading..."
              : selectedOptions.length === 0
              ? placeholder
              : `${selectedOptions.length} selected`}
          </span>
          <span style={{ fontSize: "12px" }}>{isOpen ? "▲" : "▼"}</span>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              backgroundColor: "white",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              zIndex: 1000,
              maxHeight,
              overflowY: "auto",
            }}
          >
            {/* Search input */}
            <div style={{ padding: "8px", borderBottom: "1px solid #e5e7eb" }}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            {/* Options list */}
            <div>
              {isLoading ? (
                <div
                  style={{
                    padding: "12px",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  Loading...
                </div>
              ) : error ? (
                <div
                  style={{
                    padding: "12px",
                    textAlign: "center",
                    color: "#ef4444",
                  }}
                >
                  Error loading options
                </div>
              ) : filteredOptions.length === 0 ? (
                <div
                  style={{
                    padding: "12px",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  {searchTerm ? "No options found" : "No options available"}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => handleToggleOption(option.id)}
                    style={{
                      padding: "12px",
                      cursor: "pointer",
                      borderBottom: "1px solid #f3f4f6",
                      backgroundColor: value.includes(option.id)
                        ? "#eff6ff"
                        : "white",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!value.includes(option.id)) {
                        e.currentTarget.style.backgroundColor = "#f9fafb";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!value.includes(option.id)) {
                        e.currentTarget.style.backgroundColor = "white";
                      }
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={value.includes(option.id)}
                        onChange={() => {}} // Handled by parent div click
                        style={{ margin: 0 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "500", fontSize: "14px" }}>
                          {option.name}
                        </div>
                        {option.description && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              marginTop: "2px",
                            }}
                          >
                            {option.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Search results info */}
      {searchTerm && filteredOptions.length > 0 && (
        <p
          style={{
            margin: "4px 0 0 0",
            fontSize: "12px",
            color: "#6b7280",
          }}
        >
          Showing {filteredOptions.length} of {options.length} options
        </p>
      )}

      {/* Error message */}
      {error && (
        <p
          style={{
            margin: "4px 0 0 0",
            fontSize: "12px",
            color: "#ef4444",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
