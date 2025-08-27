# Enhanced Styling Features

This document describes the comprehensive styling capabilities added to the TSE Demo Builder application, including predefined themes and extensive customization options.

## Overview

The application now supports:
- **Predefined Themes**: Quick theme selection with complete color schemes
- **Comprehensive Button Styling**: Primary and secondary button customization
- **Background Styling**: Multiple background color options
- **Typography Styling**: Text color customization
- **Theme-Based Styling**: Apply themes and then customize individual elements

## Theme Selection

### Available Themes

1. **Default** - Clean, professional light theme
2. **Dark** - Modern dark theme with high contrast
3. **Blue** - Professional blue theme
4. **Orange** - Warm and energetic orange theme
5. **Green** - Fresh and natural green theme
6. **Purple** - Creative and modern purple theme

### How to Use Themes

1. Open the Settings modal
2. Navigate to "Styling" → "Application Styles"
3. Select a theme from the theme selector at the top
4. The theme will apply a complete color scheme
5. Customize individual elements as needed

## Application Styling Options

### Top Bar Styling
- **Logo**: Upload a custom logo image or provide a URL
- **Background Color**: Customize the top bar background color
- **Foreground Color**: Customize the top bar text color

### Sidebar Styling
- **Background Color**: Customize the sidebar background color
- **Foreground Color**: Customize the sidebar text color
- **Hover Color**: Customize hover state color (auto-generated if not set)
- **Selected Color**: Customize selected item background color (auto-generated if not set)
- **Selected Text Color**: Customize selected item text color (auto-generated if not set)

### Footer Styling
- **Background Color**: Customize the footer background color
- **Foreground Color**: Customize the footer text color

### Dialog Styling
- **Background Color**: Customize dialog background color
- **Foreground Color**: Customize dialog text color

### Button Styling

#### Primary Buttons
- **Background Color**: Main button background
- **Text Color**: Button text color
- **Border Color**: Button border color
- **Hover Background**: Background color on hover
- **Hover Text Color**: Text color on hover

#### Secondary Buttons
- **Background Color**: Secondary button background
- **Text Color**: Secondary button text color
- **Border Color**: Secondary button border color
- **Hover Background**: Background color on hover
- **Hover Text Color**: Text color on hover

### Background Styling
- **Main Background**: Primary application background
- **Content Background**: Content area background
- **Card Background**: Card and container backgrounds
- **Border Color**: Default border color for containers

### Typography Styling
- **Primary Text Color**: Main text color for headings and important text
- **Secondary Text Color**: Secondary text color for descriptions and labels
- **Link Color**: Color for links
- **Link Hover Color**: Color for links on hover

## Theme Color Schemes

### Default Theme
```json
{
  "topBar": { "backgroundColor": "#ffffff", "foregroundColor": "#333333" },
  "sidebar": { "backgroundColor": "#f5f5f5", "foregroundColor": "#333333" },
  "footer": { "backgroundColor": "#ffffff", "foregroundColor": "#333333" },
  "dialogs": { "backgroundColor": "#ffffff", "foregroundColor": "#333333" },
  "buttons": {
    "primary": {
      "backgroundColor": "#3182ce",
      "foregroundColor": "#ffffff",
      "borderColor": "#3182ce",
      "hoverBackgroundColor": "#2c5aa0",
      "hoverForegroundColor": "#ffffff"
    },
    "secondary": {
      "backgroundColor": "#ffffff",
      "foregroundColor": "#374151",
      "borderColor": "#d1d5db",
      "hoverBackgroundColor": "#f9fafb",
      "hoverForegroundColor": "#374151"
    }
  },
  "backgrounds": {
    "mainBackground": "#f7fafc",
    "contentBackground": "#ffffff",
    "cardBackground": "#ffffff",
    "borderColor": "#e2e8f0"
  },
  "typography": {
    "primaryColor": "#1f2937",
    "secondaryColor": "#6b7280",
    "linkColor": "#3182ce",
    "linkHoverColor": "#2c5aa0"
  }
}
```

### Dark Theme
```json
{
  "topBar": { "backgroundColor": "#1f2937", "foregroundColor": "#ffffff" },
  "sidebar": { "backgroundColor": "#111827", "foregroundColor": "#d1d5db" },
  "footer": { "backgroundColor": "#1f2937", "foregroundColor": "#ffffff" },
  "dialogs": { "backgroundColor": "#374151", "foregroundColor": "#ffffff" },
  "buttons": {
    "primary": {
      "backgroundColor": "#3b82f6",
      "foregroundColor": "#ffffff",
      "borderColor": "#3b82f6",
      "hoverBackgroundColor": "#2563eb",
      "hoverForegroundColor": "#ffffff"
    },
    "secondary": {
      "backgroundColor": "#374151",
      "foregroundColor": "#d1d5db",
      "borderColor": "#4b5563",
      "hoverBackgroundColor": "#4b5563",
      "hoverForegroundColor": "#ffffff"
    }
  },
  "backgrounds": {
    "mainBackground": "#111827",
    "contentBackground": "#1f2937",
    "cardBackground": "#374151",
    "borderColor": "#4b5563"
  },
  "typography": {
    "primaryColor": "#f9fafb",
    "secondaryColor": "#d1d5db",
    "linkColor": "#60a5fa",
    "linkHoverColor": "#93c5fd"
  }
}
```

### Blue Theme
```json
{
  "topBar": { "backgroundColor": "#1e40af", "foregroundColor": "#ffffff" },
  "sidebar": { "backgroundColor": "#dbeafe", "foregroundColor": "#1e3a8a" },
  "footer": { "backgroundColor": "#1e40af", "foregroundColor": "#ffffff" },
  "dialogs": { "backgroundColor": "#ffffff", "foregroundColor": "#1e3a8a" },
  "buttons": {
    "primary": {
      "backgroundColor": "#1e40af",
      "foregroundColor": "#ffffff",
      "borderColor": "#1e40af",
      "hoverBackgroundColor": "#1e3a8a",
      "hoverForegroundColor": "#ffffff"
    },
    "secondary": {
      "backgroundColor": "#dbeafe",
      "foregroundColor": "#1e3a8a",
      "borderColor": "#93c5fd",
      "hoverBackgroundColor": "#bfdbfe",
      "hoverForegroundColor": "#1e3a8a"
    }
  },
  "backgrounds": {
    "mainBackground": "#eff6ff",
    "contentBackground": "#ffffff",
    "cardBackground": "#ffffff",
    "borderColor": "#bfdbfe"
  },
  "typography": {
    "primaryColor": "#1e3a8a",
    "secondaryColor": "#374151",
    "linkColor": "#1e40af",
    "linkHoverColor": "#1e3a8a"
  }
}
```

### Orange Theme
```json
{
  "topBar": { "backgroundColor": "#ea580c", "foregroundColor": "#ffffff" },
  "sidebar": { "backgroundColor": "#fed7aa", "foregroundColor": "#9a3412" },
  "footer": { "backgroundColor": "#ea580c", "foregroundColor": "#ffffff" },
  "dialogs": { "backgroundColor": "#ffffff", "foregroundColor": "#9a3412" },
  "buttons": {
    "primary": {
      "backgroundColor": "#ea580c",
      "foregroundColor": "#ffffff",
      "borderColor": "#ea580c",
      "hoverBackgroundColor": "#dc2626",
      "hoverForegroundColor": "#ffffff"
    },
    "secondary": {
      "backgroundColor": "#fed7aa",
      "foregroundColor": "#9a3412",
      "borderColor": "#fdba74",
      "hoverBackgroundColor": "#fdba74",
      "hoverForegroundColor": "#9a3412"
    }
  },
  "backgrounds": {
    "mainBackground": "#fff7ed",
    "contentBackground": "#ffffff",
    "cardBackground": "#ffffff",
    "borderColor": "#fed7aa"
  },
  "typography": {
    "primaryColor": "#9a3412",
    "secondaryColor": "#374151",
    "linkColor": "#ea580c",
    "linkHoverColor": "#dc2626"
  }
}
```

### Green Theme
```json
{
  "topBar": { "backgroundColor": "#059669", "foregroundColor": "#ffffff" },
  "sidebar": { "backgroundColor": "#d1fae5", "foregroundColor": "#065f46" },
  "footer": { "backgroundColor": "#059669", "foregroundColor": "#ffffff" },
  "dialogs": { "backgroundColor": "#ffffff", "foregroundColor": "#065f46" },
  "buttons": {
    "primary": {
      "backgroundColor": "#059669",
      "foregroundColor": "#ffffff",
      "borderColor": "#059669",
      "hoverBackgroundColor": "#047857",
      "hoverForegroundColor": "#ffffff"
    },
    "secondary": {
      "backgroundColor": "#d1fae5",
      "foregroundColor": "#065f46",
      "borderColor": "#a7f3d0",
      "hoverBackgroundColor": "#a7f3d0",
      "hoverForegroundColor": "#065f46"
    }
  },
  "backgrounds": {
    "mainBackground": "#f0fdf4",
    "contentBackground": "#ffffff",
    "cardBackground": "#ffffff",
    "borderColor": "#a7f3d0"
  },
  "typography": {
    "primaryColor": "#065f46",
    "secondaryColor": "#374151",
    "linkColor": "#059669",
    "linkHoverColor": "#047857"
  }
}
```

### Purple Theme
```json
{
  "topBar": { "backgroundColor": "#7c3aed", "foregroundColor": "#ffffff" },
  "sidebar": { "backgroundColor": "#f3e8ff", "foregroundColor": "#581c87" },
  "footer": { "backgroundColor": "#7c3aed", "foregroundColor": "#ffffff" },
  "dialogs": { "backgroundColor": "#ffffff", "foregroundColor": "#581c87" },
  "buttons": {
    "primary": {
      "backgroundColor": "#7c3aed",
      "foregroundColor": "#ffffff",
      "borderColor": "#7c3aed",
      "hoverBackgroundColor": "#6d28d9",
      "hoverForegroundColor": "#ffffff"
    },
    "secondary": {
      "backgroundColor": "#f3e8ff",
      "foregroundColor": "#581c87",
      "borderColor": "#e9d5ff",
      "hoverBackgroundColor": "#e9d5ff",
      "hoverForegroundColor": "#581c87"
    }
  },
  "backgrounds": {
    "mainBackground": "#faf5ff",
    "contentBackground": "#ffffff",
    "cardBackground": "#ffffff",
    "borderColor": "#e9d5ff"
  },
  "typography": {
    "primaryColor": "#581c87",
    "secondaryColor": "#374151",
    "linkColor": "#7c3aed",
    "linkHoverColor": "#6d28d9"
  }
}
```

## Usage Workflow

### 1. Select a Theme
1. Open Settings → Styling → Application Styles
2. Choose a theme from the theme selector
3. The theme applies a complete color scheme

### 2. Customize Individual Elements
1. After selecting a theme, customize specific elements
2. All changes are applied in real-time
3. Changes are automatically saved to localStorage

### 3. Fine-tune Colors
1. Use the color pickers to adjust individual colors
2. Preview changes immediately
3. Save configurations for reuse

## Technical Implementation

### Components Created
- `ThemeSelector.tsx`: Theme selection interface
- `StylingProvider.tsx`: CSS custom properties provider
- `themes.ts`: Predefined theme definitions

### Types Added
- Enhanced `ApplicationStyles` interface with new styling options
- `Theme` interface for theme definitions
- Theme application utilities

### CSS Custom Properties
The application uses CSS custom properties for dynamic styling:
- `--main-background`
- `--content-background`
- `--card-background`
- `--border-color`
- `--primary-text-color`
- `--secondary-text-color`
- `--link-color`
- `--link-hover-color`
- `--primary-button-bg`
- `--primary-button-text`
- `--primary-button-border`
- `--primary-button-hover-bg`
- `--primary-button-hover-text`
- `--secondary-button-bg`
- `--secondary-button-text`
- `--secondary-button-border`
- `--secondary-button-hover-bg`
- `--secondary-button-hover-text`

## Best Practices

1. **Start with a Theme**: Choose a theme that matches your brand or preference
2. **Customize Gradually**: Make small adjustments to individual elements
3. **Test Contrast**: Ensure text remains readable with your color choices
4. **Save Configurations**: Export your custom configurations for reuse
5. **Consider Accessibility**: Maintain sufficient contrast ratios

## Migration from Previous Versions

Existing styling configurations will be automatically migrated to include the new styling options with default values. The new options are optional and won't break existing configurations.

## Export/Import

All styling configurations, including themes and customizations, are included in the export/import functionality. This allows you to:
- Share complete styling configurations
- Backup your custom themes
- Apply consistent styling across multiple instances
