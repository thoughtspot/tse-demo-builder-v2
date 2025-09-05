"use client";

import React, { useState } from "react";
import { RuntimeFilter, RuntimeFilterOp } from "../types/thoughtspot";

interface RuntimeFiltersEditorProps {
  runtimeFilters: RuntimeFilter[];
  onFiltersChange: (filters: RuntimeFilter[]) => void;
}

const OPERATOR_OPTIONS = [
  { value: RuntimeFilterOp.EQ, label: "Equals" },
  { value: RuntimeFilterOp.NE, label: "Does not equal" },
  { value: RuntimeFilterOp.LT, label: "Less than" },
  { value: RuntimeFilterOp.LE, label: "Less than or equal to" },
  { value: RuntimeFilterOp.GT, label: "Greater than" },
  { value: RuntimeFilterOp.GE, label: "Greater than or equal to" },
  { value: RuntimeFilterOp.CONTAINS, label: "Contains" },
  { value: RuntimeFilterOp.BEGINS_WITH, label: "Begins with" },
  { value: RuntimeFilterOp.ENDS_WITH, label: "Ends with" },
  { value: RuntimeFilterOp.BW_INC_MAX, label: "Between (inclusive max)" },
  { value: RuntimeFilterOp.BW_INC_MIN, label: "Between (inclusive min)" },
  { value: RuntimeFilterOp.BW_INC, label: "Between (inclusive both)" },
  { value: RuntimeFilterOp.BW, label: "Between (exclusive)" },
  { value: RuntimeFilterOp.IN, label: "In list" },
  { value: RuntimeFilterOp.NOT_IN, label: "Not in list" },
];

const OPERATORS_REQUIRING_TWO_VALUES = [
  RuntimeFilterOp.BW_INC_MAX,
  RuntimeFilterOp.BW_INC_MIN,
  RuntimeFilterOp.BW_INC,
  RuntimeFilterOp.BW,
];

const OPERATORS_REQUIRING_MULTIPLE_VALUES = [
  RuntimeFilterOp.IN,
  RuntimeFilterOp.NOT_IN,
];

export default function RuntimeFiltersEditor({
  runtimeFilters,
  onFiltersChange,
}: RuntimeFiltersEditorProps) {
  const [newFilter, setNewFilter] = useState<RuntimeFilter>({
    columnName: "",
    operator: RuntimeFilterOp.EQ,
    values: [""],
  });

  // Debug: Log the runtime filters when they change
  React.useEffect(() => {
    console.log("RuntimeFiltersEditor received filters:", runtimeFilters);
  }, [runtimeFilters]);

  const addFilter = () => {
    if (newFilter.columnName.trim()) {
      const filterToAdd = {
        ...newFilter,
        columnName: newFilter.columnName.trim(),
        values: newFilter.values.filter((v) => v !== ""),
      };
      onFiltersChange([...runtimeFilters, filterToAdd]);
      setNewFilter({
        columnName: "",
        operator: RuntimeFilterOp.EQ,
        values: [""],
      });
    }
  };

  const updateFilter = (
    index: number,
    field: keyof RuntimeFilter,
    value: string | RuntimeFilterOp | (string | number | boolean)[]
  ) => {
    const updatedFilters = [...runtimeFilters];
    updatedFilters[index] = { ...updatedFilters[index], [field]: value };
    onFiltersChange(updatedFilters);
  };

  const removeFilter = (index: number) => {
    const updatedFilters = runtimeFilters.filter((_, i) => i !== index);
    onFiltersChange(updatedFilters);
  };

  const addValue = (filterIndex: number) => {
    const updatedFilters = [...runtimeFilters];
    updatedFilters[filterIndex].values.push("");
    onFiltersChange(updatedFilters);
  };

  const updateValue = (
    filterIndex: number,
    valueIndex: number,
    value: string
  ) => {
    const updatedFilters = [...runtimeFilters];
    updatedFilters[filterIndex].values[valueIndex] = value;
    onFiltersChange(updatedFilters);
  };

  const removeValue = (filterIndex: number, valueIndex: number) => {
    const updatedFilters = [...runtimeFilters];
    updatedFilters[filterIndex].values.splice(valueIndex, 1);
    onFiltersChange(updatedFilters);
  };

  const getRequiredValuesCount = (operator: RuntimeFilterOp): number => {
    if (OPERATORS_REQUIRING_TWO_VALUES.includes(operator)) {
      return 2;
    }
    if (OPERATORS_REQUIRING_MULTIPLE_VALUES.includes(operator)) {
      return 1; // Minimum 1, but can have more
    }
    return 1;
  };

  const getOperatorDescription = (operator: RuntimeFilterOp): string => {
    const option = OPERATOR_OPTIONS.find((opt) => opt.value === operator);
    return option?.label || operator;
  };

  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    fontSize: "14px",
  };

  const buttonStyle = {
    padding: "8px 16px",
    backgroundColor: "#3182ce",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
  };

  const buttonDisabledStyle = {
    ...buttonStyle,
    backgroundColor: "#9ca3af",
    cursor: "not-allowed",
  };

  const removeButtonStyle = {
    color: "#dc2626",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  };

  const addButtonStyle = {
    color: "#2563eb",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  };

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3
          style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}
        >
          Runtime Filters
        </h3>
        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>
          Configure filters that will be applied to all embedded content. These
          filters will be applied at runtime.
        </p>
      </div>

      {/* Existing Filters */}
      {runtimeFilters.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h4
            style={{
              fontSize: "16px",
              fontWeight: "500",
              marginBottom: "12px",
            }}
          >
            Current Filters
          </h4>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {runtimeFilters.map((filter, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "16px",
                  backgroundColor: "#f9fafb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#374151",
                          marginBottom: "4px",
                        }}
                      >
                        Column Name
                      </label>
                      <input
                        type="text"
                        value={filter.columnName}
                        onChange={(e) =>
                          updateFilter(index, "columnName", e.target.value)
                        }
                        style={{ ...inputStyle, width: "192px" }}
                        placeholder="Enter column name"
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#374151",
                          marginBottom: "4px",
                        }}
                      >
                        Operator
                      </label>
                      <select
                        value={filter.operator}
                        onChange={(e) => {
                          const newOperator = e.target.value as RuntimeFilterOp;
                          const requiredCount =
                            getRequiredValuesCount(newOperator);
                          const newValues = Array(requiredCount)
                            .fill("")
                            .map((_, i) => filter.values[i] || "");
                          updateFilter(index, "operator", newOperator);
                          updateFilter(index, "values", newValues);
                        }}
                        style={{ ...inputStyle, width: "192px" }}
                      >
                        {OPERATOR_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFilter(index)}
                    style={removeButtonStyle}
                  >
                    Remove
                  </button>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    Values ({getOperatorDescription(filter.operator)})
                  </label>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {filter.values.map((value, valueIndex) => (
                      <div
                        key={valueIndex}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <input
                          type="text"
                          value={String(value)}
                          onChange={(e) =>
                            updateValue(index, valueIndex, e.target.value)
                          }
                          style={{ ...inputStyle, flex: 1 }}
                          placeholder={`Value ${valueIndex + 1}`}
                        />
                        {filter.values.length >
                          getRequiredValuesCount(filter.operator) && (
                          <button
                            onClick={() => removeValue(index, valueIndex)}
                            style={{
                              color: "#dc2626",
                              backgroundColor: "transparent",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "14px",
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    {(OPERATORS_REQUIRING_MULTIPLE_VALUES.includes(
                      filter.operator
                    ) ||
                      filter.values.length < 2) && (
                      <button
                        onClick={() => addValue(index)}
                        style={addButtonStyle}
                      >
                        + Add Value
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Filter */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "16px",
          backgroundColor: "white",
        }}
      >
        <h4
          style={{ fontSize: "16px", fontWeight: "500", marginBottom: "12px" }}
        >
          Add New Filter
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "4px",
                }}
              >
                Column Name
              </label>
              <input
                type="text"
                value={newFilter.columnName}
                onChange={(e) =>
                  setNewFilter({ ...newFilter, columnName: e.target.value })
                }
                style={{ ...inputStyle, width: "192px" }}
                placeholder="Enter column name"
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "4px",
                }}
              >
                Operator
              </label>
              <select
                value={newFilter.operator}
                onChange={(e) => {
                  const newOperator = e.target.value as RuntimeFilterOp;
                  const requiredCount = getRequiredValuesCount(newOperator);
                  setNewFilter({
                    ...newFilter,
                    operator: newOperator,
                    values: Array(requiredCount).fill(""),
                  });
                }}
                style={{ ...inputStyle, width: "192px" }}
              >
                {OPERATOR_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Values ({getOperatorDescription(newFilter.operator)})
            </label>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {newFilter.values.map((value, index) => (
                <div
                  key={index}
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <input
                    type="text"
                    value={String(value)}
                    onChange={(e) => {
                      const newValues = [...newFilter.values];
                      newValues[index] = e.target.value;
                      setNewFilter({ ...newFilter, values: newValues });
                    }}
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder={`Value ${index + 1}`}
                  />
                  {newFilter.values.length >
                    getRequiredValuesCount(newFilter.operator) && (
                    <button
                      onClick={() => {
                        const newValues = newFilter.values.filter(
                          (_, i) => i !== index
                        );
                        setNewFilter({ ...newFilter, values: newValues });
                      }}
                      style={{
                        color: "#dc2626",
                        backgroundColor: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {(OPERATORS_REQUIRING_MULTIPLE_VALUES.includes(
                newFilter.operator
              ) ||
                newFilter.values.length < 2) && (
                <button
                  onClick={() => {
                    setNewFilter({
                      ...newFilter,
                      values: [...newFilter.values, ""],
                    });
                  }}
                  style={addButtonStyle}
                >
                  + Add Value
                </button>
              )}
            </div>
          </div>

          <button
            onClick={addFilter}
            disabled={
              !newFilter.columnName.trim() || newFilter.values.some((v) => !v)
            }
            style={
              !newFilter.columnName.trim() || newFilter.values.some((v) => !v)
                ? buttonDisabledStyle
                : buttonStyle
            }
          >
            Add Filter
          </button>
        </div>
      </div>

      {/* Help Text */}
      <div
        style={{
          marginTop: "16px",
          padding: "12px",
          backgroundColor: "#dbeafe",
          border: "1px solid #93c5fd",
          borderRadius: "6px",
        }}
      >
        <h5
          style={{
            fontSize: "14px",
            fontWeight: "500",
            color: "#1e40af",
            marginBottom: "4px",
          }}
        >
          Filter Types:
        </h5>
        <ul
          style={{
            fontSize: "12px",
            color: "#1e3a8a",
            margin: 0,
            paddingLeft: "16px",
          }}
        >
          <li style={{ marginBottom: "2px" }}>
            <strong>Comparison:</strong> EQ, NE, LT, LE, GT, GE - Compare values
          </li>
          <li style={{ marginBottom: "2px" }}>
            <strong>Text:</strong> CONTAINS, BEGINS_WITH, ENDS_WITH - Text
            pattern matching
          </li>
          <li style={{ marginBottom: "2px" }}>
            <strong>Range:</strong> BW, BW_INC, BW_INC_MIN, BW_INC_MAX - Between
            two values
          </li>
          <li>
            <strong>List:</strong> IN, NOT_IN - Match against multiple values
          </li>
        </ul>
      </div>
    </div>
  );
}
