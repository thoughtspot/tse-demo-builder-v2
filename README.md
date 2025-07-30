# TSE Demo Builder v2

A Next.js application for building and customizing ThoughtSpot Embedded (TSE) demos with a comprehensive configuration system.

## Features

### Configuration Management
- **Export/Import Configuration**: Save and load your complete configuration including all settings, styling, and images
- **Flexible Configuration**: Update configuration items over time with graceful handling of missing/added fields
- **Image Support**: Export includes all images as base64 data for complete portability
- **Version Control**: Configuration files include version information for future compatibility

### Export/Import Features
- **Export Configuration**: Download your complete configuration as a JSON file
- **Import Configuration**: Load previously exported configurations
- **Graceful Migration**: Handle configuration changes over time with default fallbacks
- **Validation**: Comprehensive validation of imported configuration files
- **User Feedback**: Clear success/error messages for import operations

### Configuration Items
- Standard menu configuration
- Custom menu creation and management
- Home page content (HTML, images, iframes, ThoughtSpot content)
- Application styling (colors, logos, layout)
- Embedded content customization
- ThoughtSpot integration settings

### Styling Features
- **Application Styling**: Customize top bar, sidebar, footer, and dialog colors
- **Embedded Content**: String mappings and CSS customizations
- **Color Picker**: Visual color selection with hex input
- **Image Upload**: Direct file upload and URL input support
- **Real-time Preview**: See changes applied immediately

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Configuration Export/Import

### Exporting Configuration
1. Open the Settings modal
2. Navigate to the "Configuration" tab
3. Click "Export Configuration"
4. Enter a custom name for your configuration file (optional)
5. Click "Export" to download the JSON file with your complete configuration
6. If no custom name is provided, a default name with the current date will be used

### Importing Configuration
1. Open the Settings modal
2. Navigate to the "Configuration" tab
3. Click "Import Configuration"
4. Select a previously exported JSON file
5. The configuration will be loaded and applied immediately

### Configuration File Format
The exported configuration includes:
- Version information for compatibility
- Timestamp of export
- All configuration data including images as base64
- Graceful handling of missing fields during import

### File Naming
- Custom names are automatically sanitized to remove invalid characters
- Only alphanumeric characters, spaces, hyphens, and underscores are allowed
- If no custom name is provided, the default format is used: `tse-demo-builder-config-YYYY-MM-DD.json`

### Clear All Configurations
Use the "Clear All Configurations" button to reset all settings to their default values.

## Technical Details

### Components
- `Layout.tsx`: Main layout with context provider
- `SettingsModal.tsx`: Configuration management interface
- `ImageUpload.tsx`: Image upload and URL input component
- `ColorPicker.tsx`: Color selection component
- `StringMappingEditor.tsx`: String mapping management
- `CSSVariablesEditor.tsx`: CSS variables JSON editor

### Configuration Storage
- All configuration is stored in localStorage
- Automatic saving on configuration changes
- Export/import for backup and sharing

### TypeScript Support
- Full TypeScript implementation
- Comprehensive type definitions
- Type-safe configuration management

## Development

### Project Structure
```
src/
├── app/                 # Next.js app directory
├── components/          # React components
│   ├── pages/          # Page-specific components
│   └── ...
├── services/           # API services
└── types/             # TypeScript type definitions
```

### Key Technologies
- Next.js 14 with App Router
- React 18 with hooks
- TypeScript
- ThoughtSpot Visual Embed SDK
- Local storage for persistence

## License

This project is for internal use at ThoughtSpot.
