# TSE Demo Builder v2

A powerful Next.js application for creating and managing ThoughtSpot Everywhere (TSE) demos. This tool enables ThoughtSpot Solution Engineers and customers to quickly set up customized demo environments that showcase ThoughtSpot's embedded analytics capabilities.

## Overview

The TSE Demo Builder v2 is designed to help you create compelling demonstrations of how ThoughtSpot can be embedded into custom applications. It provides a flexible framework where you can:

- **Configure Multiple Demo Pages**: Set up different pages showcasing various ThoughtSpot features (Search, Liveboards, Full App, Spotter AI, etc.)
- **Customize Branding & Styling**: Apply custom themes, colors, logos, and styling to match your customer's brand
- **Manage User Experiences**: Create different user personas with varying access levels and permissions
- **Integrate AI Features**: Configure SpotGPT chatbot functionality for natural language analytics
- **Share Demo Configurations**: Export and import demo setups for easy sharing and reuse

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager
- Access to a ThoughtSpot instance

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tse-demo-builder-v2-private
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Demo Configuration

### Standard Menu Pages

The application comes with several pre-configured demo pages that you can enable/disable and customize:

#### **Home Page**
- **Purpose**: Landing page for your demo
- **Configuration Options**:
  - Custom HTML content
  - Image uploads
  - ThoughtSpot content embedding
  - Welcome messages and branding

#### **Favorites**
- **Purpose**: Showcase saved content and personalization features
- **Configuration Options**:
  - Filter by content types
  - Custom content selection
  - User-specific favorites

#### **My Reports**
- **Purpose**: Demonstrate personal analytics and report management
- **Configuration Options**:
  - Content filtering by name patterns
  - User-specific content access
  - Custom report categories

#### **Spotter (AI Search)**
- **Purpose**: Showcase ThoughtSpot's natural language search capabilities
- **Configuration Options**:
  - Default search queries
  - Model selection for AI responses
  - Custom data sources
  - Pre-configured search examples

#### **Search**
- **Purpose**: Demonstrate ThoughtSpot's search-driven analytics
- **Configuration Options**:
  - Default data sources
  - Auto-execute searches
  - Custom search tokens
  - Worksheet selection

#### **Full App**
- **Purpose**: Show complete ThoughtSpot application experience
- **Configuration Options**:
  - Navigation visibility settings
  - Homepage customization
  - Feature access controls

#### **All Content**
- **Purpose**: Browse and discover all available analytics content
- **Configuration Options**:
  - Content type filtering
  - System content visibility
  - Search and discovery features

### Application Configuration

Access the settings modal (⚙️ icon) to configure various aspects of your demo:

#### **Basic Settings**
- **ThoughtSpot URL**: Your ThoughtSpot instance URL
- **Application Name**: Custom name for your demo app
- **Logo**: Upload custom logos (supports PNG, JPG, SVG)
- **Favicon**: Custom favicon for browser tabs
- **Footer**: Toggle footer visibility

#### **Styling & Theming**
- **Color Schemes**: Choose from pre-built themes or create custom color palettes
- **Component Styling**: Customize colors for:
  - Top navigation bar
  - Sidebar navigation
  - Buttons (primary/secondary)
  - Backgrounds and borders
  - Typography colors
- **Custom CSS**: Add custom CSS variables and rules
- **Embedded Content Styling**: Apply custom styling to ThoughtSpot components

#### **User Management**
Create different user personas with varying access levels:
- **Power User**: Full access to all features
- **Basic User**: Limited access (e.g., no Search or Full App)
- **Custom Users**: Define specific permissions per user
- **Access Controls**: Configure which pages each user can access
- **Runtime Filters**: Apply data filters based on user context
- **Hidden Actions**: Hide specific ThoughtSpot actions per user

#### **Advanced Features**
- **Early Access Flags**: Enable experimental ThoughtSpot features
- **Embed Flags**: Configure ThoughtSpot embedding options
- **Custom Menus**: Create additional demo pages with custom content
- **String Mappings**: Customize ThoughtSpot UI text and labels

### SpotGPT Integration

Configure AI-powered chatbot functionality:

1. **Setup**: Follow the [SpotGPT Setup Guide](./SPOTGPT_SETUP.md)
2. **Configuration**:
   - Enable/disable chatbot
   - Set welcome messages
   - Choose AI model
   - Position chatbot on screen
3. **Usage**: See [SpotGPT Usage Examples](./SPOTGPT_USAGE_EXAMPLE.md)

## Export/Import Configurations

### Exporting Demo Configurations

1. **Access Export**:
   - Open Settings (⚙️) → Configuration tab
   - Click "Export Configuration"

2. **Export Options**:
   - **Custom Name**: Provide a descriptive name for your configuration
   - **Automatic Naming**: Uses date-based naming if no custom name provided
   - **File Format**: JSON file with all settings and embedded images

3. **What Gets Exported**:
   - All menu configurations and content
   - Styling and branding settings
   - User configurations and access controls
   - Custom CSS and theme settings
   - Embedded images (converted to data URLs)
   - SpotGPT configurations

### Importing Demo Configurations

#### **From Local File**
1. Open Settings → Configuration → Import
2. Select "Upload from File"
3. Choose your exported JSON configuration file
4. Review and confirm the import

#### **From GitHub Repository**
1. Open Settings → Configuration → Import
2. Select "Load from GitHub"
3. Choose from pre-built demo configurations
4. The system loads from: `thoughtspot/tse-demo-builders-pre-built/configs/`

#### **Import Process**
- **Validation**: System validates configuration structure
- **Backup**: Current configuration is cleared before import
- **Image Handling**: Data URLs are converted to IndexedDB references for performance
- **Merge Strategy**: Missing fields are populated with defaults
- **Auto-Reload**: Page automatically reloads to apply new configuration

### Pre-built Demo Templates

The application can load pre-configured demo templates from GitHub:
- **Industry-specific demos**: Retail, Healthcare, Financial Services, etc.
- **Use-case demos**: Executive dashboards, Operational analytics, Self-service BI
- **Feature demos**: AI search, Embedded analytics, Mobile experiences

## Storage & Performance

### Storage Strategy
- **Small Configurations**: Stored in browser localStorage (< 1MB)
- **Large Configurations**: Stored in IndexedDB (with images and large content)
- **Automatic Migration**: Seamlessly migrates between storage types as needed

### Performance Optimization
- **Lazy Loading**: Components load only when needed
- **Image Optimization**: Automatic compression and format conversion
- **Caching**: Intelligent caching of ThoughtSpot content and configurations
- **Background Processing**: Non-blocking configuration updates

## Development

### Project Structure
```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes (SpotGPT, configuration)
│   └── [pages]/           # Demo pages (home, search, etc.)
├── components/            # React components
│   ├── pages/            # Page-specific components
│   └── [ui-components]   # Reusable UI components
├── services/             # Business logic and API clients
├── types/                # TypeScript type definitions
└── globals.css           # Global styles
```

### Key Technologies
- **Framework**: Next.js 15 with React 19
- **Styling**: CSS Modules + Custom CSS Variables
- **UI Components**: Material-UI + Custom components
- **State Management**: React hooks and context
- **Storage**: LocalStorage + IndexedDB hybrid approach
- **ThoughtSpot Integration**: Visual Embed SDK v1.39.3

### Building for Production
```bash
npm run build
npm start
```

## Troubleshooting

### Common Issues

**Configuration Not Loading**
- Check browser console for errors
- Verify ThoughtSpot URL is accessible
- Ensure configuration file format is valid JSON

**Images Not Displaying**
- Verify image files are properly uploaded
- Check browser storage limits
- Try re-importing configuration

**ThoughtSpot Content Not Loading**
- Verify ThoughtSpot URL and authentication
- Check network connectivity
- Review embed flags and permissions

**Storage Errors**
- Clear browser storage: Settings → Configuration → Clear All
- Check available browser storage space
- Try using a different browser

### Storage Health Check
Monitor storage usage in Settings → Configuration → Storage Health to prevent issues.

## Support

For technical support and questions:
- Review the [SpotGPT Setup Guide](./SPOTGPT_SETUP.md) for AI features
- Check [SpotGPT Usage Examples](./SPOTGPT_USAGE_EXAMPLE.md) for implementation details
- Consult ThoughtSpot documentation for embedding best practices

## License

This project is private and proprietary to ThoughtSpot, Inc.
