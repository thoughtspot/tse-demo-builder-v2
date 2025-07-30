# TSE Demo Builder - Styling Features

This document describes the comprehensive styling capabilities added to the TSE Demo Builder application.

## Overview

The application now supports extensive styling customization for both the application interface and embedded ThoughtSpot content. All styling configurations are persisted in localStorage and can be managed through the Settings modal.

## Application Styling

### Top Bar Styling
- **Logo**: Upload a custom logo image or provide a URL
- **Background Color**: Customize the top bar background color
- **Foreground Color**: Customize the top bar text color

### Sidebar Styling
- **Background Color**: Customize the sidebar background color
- **Foreground Color**: Customize the sidebar text color

### Footer Styling
- **Background Color**: Customize the footer background color
- **Foreground Color**: Customize the footer text color

### Dialog Styling
- **Background Color**: Customize dialog background color
- **Foreground Color**: Customize dialog text color

## Embedded Content Customization

### String Mappings
- Map ThoughtSpot strings to custom values
- Add, edit, and delete string mappings
- Example: Map "Select view" to "Select group filter"

### String ID Mappings
- Map ThoughtSpot string IDs to custom values
- Add, edit, and delete string ID mappings
- Example: Map "liveboard.highlights.title" to "Smart Highlights"

### Custom CSS URL
- Provide a URL to an external CSS file for custom styling
- The CSS file will be loaded and applied to embedded ThoughtSpot content

### Custom CSS Variables
- Define custom CSS variables for ThoughtSpot styling
- JSON format with variable name-value pairs
- Example:
  ```json
  {
    "--ts-var-button--secondary-background": "#F0EBFF",
    "--ts-var-button--secondary--hover-background": "#E3D9FC",
    "--ts-var-root-background": "#F7F5FF"
  }
  ```

## Usage

1. Open the Settings modal by clicking the settings icon in the sidebar
2. Navigate to the "Styling" tab
3. Choose between "Application Styles" and "Embedded Content" sub-tabs
4. Configure your desired styling options
5. Changes are automatically saved and applied

## Color Picker Features

- **Hex Input**: Type hex color values directly
- **Color Picker**: Use the native color picker for visual selection
- **Validation**: Real-time validation of hex color format
- **Auto-save**: Changes are automatically saved to localStorage

## Image Upload Features

- **File Upload**: Upload image files directly
- **URL Input**: Provide image URLs
- **Preview**: See uploaded images before applying
- **Remove**: Remove uploaded images

## String Mapping Editor Features

- **Add Mappings**: Create new string-to-string mappings
- **Edit Mappings**: Modify existing mappings inline
- **Delete Mappings**: Remove unwanted mappings
- **Validation**: Ensure both key and value are provided

## CSS Variables Editor Features

- **JSON Input**: Edit CSS variables in JSON format
- **Format**: Auto-format JSON for readability
- **Reset**: Reset to default variables
- **Validation**: Validate JSON format and variable types

## Technical Implementation

### Components Created
- `ColorPicker.tsx`: Reusable color picker with hex input
- `ImageUpload.tsx`: Image upload and URL input component
- `StringMappingEditor.tsx`: String mapping management
- `CSSVariablesEditor.tsx`: CSS variables JSON editor

### Types Added
- `ApplicationStyles`: Application styling configuration
- `EmbeddedContentCustomization`: Embedded content customization
- `StylingConfig`: Complete styling configuration

### Integration
- All styling is applied through React props
- ThoughtSpot initialization includes customizations when configured
- Styling persists across browser sessions via localStorage
- Default values are provided for all styling options

## Default Values

### Application Styles
- Top Bar: White background, dark text
- Sidebar: Light gray background, medium gray text
- Footer: Light gray background, medium gray text
- Dialogs: White background, dark text

### Embedded Content
- Empty strings and stringIDs mappings
- No custom CSS URL
- Empty CSS variables object

## Browser Compatibility

- Color picker: Modern browsers with HTML5 color input support
- File upload: All modern browsers
- localStorage: All modern browsers
- JSON parsing: All modern browsers

## Future Enhancements

- Theme presets (Light, Dark, Custom)
- Import/export styling configurations
- Real-time preview of embedded content styling
- Advanced CSS editor with syntax highlighting
- Color palette management
- Responsive design considerations 