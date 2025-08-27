# Embed Display Configuration

## Overview

This feature allows users to configure how embedded content titles and descriptions are displayed in the application. Users can hide the title, description, or both, and when both are hidden, the entire header container is hidden.

## Configuration Location

The configuration is located in the **Settings** → **Configuration** → **Embed Flags** section, specifically in the **Embed Display Options** subsection that appears before the **Embed-Specific Flags**.

## Configuration Options

### Hide Title
- **Type**: Boolean checkbox
- **Default**: `false` (title is shown)
- **Description**: When checked, hides the title of embedded content in the modal header

### Hide Description  
- **Type**: Boolean checkbox
- **Default**: `false` (description is shown)
- **Description**: When checked, hides the description of embedded content in the modal header

## Behavior

1. **Title Only Hidden**: The header shows only the description (if available) and the close button
2. **Description Only Hidden**: The header shows only the title and the close button
3. **Both Hidden**: The entire header container is hidden, and a close button is positioned in the top-right corner of the content area
4. **Neither Hidden**: Normal display with both title and description visible

## Technical Implementation

### Files Modified

1. **`src/types/thoughtspot.ts`**
   - Added `embedDisplay` interface to `StylingConfig`
   - Contains `hideTitle` and `hideDescription` boolean properties

2. **`src/components/EmbedFlagsEditor.tsx`**
   - Added new "Embed Display Options" section with checkboxes
   - Added `embedDisplay` and `onEmbedDisplayChange` props
   - Positioned before the existing "Embed-Specific Flags" section

3. **`src/components/SettingsModal.tsx`**
   - Updated to pass `embedDisplay` configuration to `EmbedFlagsEditor`
   - Added `onEmbedDisplayChange` handler to update styling configuration

4. **`src/components/EmbedModal.tsx`**
   - Added `useAppContext` import to access styling configuration
   - Modified header rendering logic to conditionally show/hide elements
   - Added fallback close button when header is completely hidden
   - Adjusted styling for description margin when title is hidden

5. **`src/components/Layout.tsx`**
   - Updated `DEFAULT_CONFIG.stylingConfig` to include default `embedDisplay` values

6. **`src/services/configurationService.ts`**
   - Updated `DEFAULT_CONFIG.stylingConfig` to include default `embedDisplay` values

### Configuration Storage

The embed display configuration is stored as part of the `stylingConfig` in the application's configuration system and is persisted in localStorage/IndexedDB. It's included in configuration exports and imports.

### Default Values

```typescript
embedDisplay: {
  hideTitle: false,
  hideDescription: false,
}
```

## Usage

1. Navigate to **Settings** → **Configuration** → **Embed Flags**
2. In the **Embed Display Options** section, check/uncheck the desired options:
   - "Hide embedded content title"
   - "Hide embedded content description"
3. Changes are automatically saved and applied immediately
4. When viewing embedded content, the display will reflect the current configuration

## Notes

- If both title and description are hidden, the entire header container is hidden to maximize content space
- A close button is always available, either in the header or as a floating button in the content area
- The configuration applies to all embedded content throughout the application
- Changes are applied immediately without requiring a page refresh
