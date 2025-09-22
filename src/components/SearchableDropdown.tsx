import React, { useState, useMemo } from "react";

interface SearchableDropdownOption {
  id: string;
  name: string;
  [key: string]: string | number | boolean; // Allow additional properties with specific types
}

interface SearchableDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableDropdownOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  disabled?: boolean;
  isLoading?: boolean;
  error?: string | null;
  style?: React.CSSProperties;
  className?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  label,
  disabled = false,
  isLoading = false,
  error = null,
  style,
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter((option) =>
      option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

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

      {/* Search Input */}
      <input
        type="text"
        placeholder={searchPlaceholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        disabled={disabled || isLoading}
        style={{
          width: "100%",
          padding: "8px 12px",
          border: error ? "1px solid #ef4444" : "1px solid #d1d5db",
          borderRadius: "4px",
          fontSize: "14px",
          marginBottom: "8px",
          backgroundColor: disabled ? "#f9fafb" : "white",
          color: disabled ? "#9ca3af" : "#374151",
        }}
      />

      {/* Dropdown */}
      <select
        value={value || ""}
        onChange={(e) => {
          onChange(e.target.value);
          // Clear search when an option is selected
          setSearchTerm("");
        }}
        disabled={disabled || isLoading}
        style={{
          width: "100%",
          padding: "8px 12px",
          border: error ? "1px solid #ef4444" : "1px solid #d1d5db",
          borderRadius: "4px",
          fontSize: "14px",
          backgroundColor: disabled ? "#f9fafb" : "white",
          color: disabled ? "#9ca3af" : "#374151",
        }}
      >
        <option value="">{placeholder}</option>
        {isLoading ? (
          <option value="" disabled>
            Loading...
          </option>
        ) : error ? (
          <option value="" disabled>
            Error loading options
          </option>
        ) : filteredOptions.length === 0 ? (
          <option value="" disabled>
            {searchTerm ? "No options found" : "No options available"}
          </option>
        ) : (
          filteredOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))
        )}
      </select>

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

export default SearchableDropdown;
