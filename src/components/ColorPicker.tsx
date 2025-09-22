"use client";

import { useState, useEffect } from "react";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label: string;
  placeholder?: string;
}

export default function ColorPicker({
  value,
  onChange,
  label,
  placeholder = "#000000",
}: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const validateHexColor = (color: string): boolean => {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (newValue === "" || validateHexColor(newValue)) {
      setIsValid(true);
      if (newValue !== "") {
        onChange(newValue);
      }
    } else {
      setIsValid(false);
    }
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsValid(true);
  };

  const handleBlur = () => {
    if (!isValid || inputValue === "") {
      setInputValue(value);
      setIsValid(true);
    }
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <label
        style={{
          display: "block",
          marginBottom: "4px",
          fontWeight: "500",
          fontSize: "14px",
        }}
      >
        {label}
      </label>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          type="color"
          value={value}
          onChange={handleColorPickerChange}
          style={{
            width: "40px",
            height: "40px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            cursor: "pointer",
            padding: "0",
          }}
          title="Click to pick color"
        />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          style={{
            flex: 1,
            padding: "8px 12px",
            border: `1px solid ${isValid ? "#d1d5db" : "#dc2626"}`,
            borderRadius: "4px",
            fontSize: "14px",
            fontFamily: "monospace",
          }}
        />
      </div>
      {!isValid && (
        <p
          style={{
            margin: "4px 0 0 0",
            fontSize: "12px",
            color: "#dc2626",
          }}
        >
          Please enter a valid hex color (e.g., #FF0000)
        </p>
      )}
    </div>
  );
}
