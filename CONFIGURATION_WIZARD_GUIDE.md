# Configuration Wizard Guide

## Overview

The Configuration Wizard is a user-friendly tool that helps you quickly set up a ThoughtSpot embedded application. It's accessible from the Settings modal, under Configuration → General Configuration tab.

## Features

The wizard provides a streamlined interface to configure:

1. **ThoughtSpot URL** - Your ThoughtSpot instance URL
2. **Application Name** - The name that appears in your app
3. **Standard Menus** - Select which menus to include (Home, Favorites, My Reports, Spotter, Search, Full App, All Content)
4. **AI Model Selection** - Choose a model for Spotter and Search functionality
5. **Home Page Description** (Optional) - AI will generate HTML/CSS based on your description
6. **Style Description** (Optional) - AI will generate colors and styling based on your description

## How to Use

### Accessing the Wizard

1. Open the Settings modal (gear icon in the top-right corner)
2. Navigate to Configuration → General Configuration
3. Click the **Configuration Wizard** button (purple button with magic wand icon ✨)

### Using the Wizard

1. **ThoughtSpot URL**: Enter your ThoughtSpot instance URL (defaults to current setting)

2. **Application Name**: Give your application a name

3. **Standard Menus**: Check the boxes next to the menus you want to include in your application:
   - ✅ Home - Landing page for your application
   - ⭐ Favorites - Quick access to favorited content
   - 📋 My Reports - User's personal reports
   - 🔍 Spotter - AI-powered search interface
   - 🔎 Search - Data search functionality
   - 📱 Full App - Complete ThoughtSpot interface
   - 📚 All Content - Browse all available content

4. **AI Model for Spotter & Search** (Optional): Select a model from the dropdown for AI-powered features

5. **Home Page Description** (Optional - AI-Generated):
   - Describe your ideal home page
   - Example: "A modern dashboard with a hero section, feature cards, and a call-to-action button. Use a gradient background and clean typography."
   - The AI will generate a complete HTML page with inline CSS

6. **Style Description** (Optional - AI-Generated):
   - Describe your desired color scheme and styling
   - Example: "Professional corporate theme with navy blue primary color (#1e3a8a), light gray backgrounds, and orange accents for buttons."
   - The AI will generate ThoughtSpot CSS variables to match your description

7. Click **Create Configuration** to apply your settings

### What Happens When You Submit

1. The wizard **clears your current configuration**
2. Creates a new configuration based on your inputs
3. If you provided descriptions, it uses AI to generate:
   - Custom home page HTML/CSS
   - ThoughtSpot styling (CSS variables)
4. Saves the new configuration
5. **Reloads the page** to apply changes

## AI-Generated Content

### Home Page Generation

When you provide a home page description, the wizard uses Claude AI to generate:
- Complete HTML document with semantic structure
- Inline CSS styling
- Responsive, mobile-friendly layout
- Modern design following best practices

### Style Generation

When you provide a style description, the wizard generates ThoughtSpot CSS variables for:
- Color scheme (backgrounds, buttons, text)
- Typography (font families)
- UI elements (borders, shadows, hover states)
- Component styling (visualizations, filters, menus)

## Tips for Best Results

### Home Page Descriptions
- Be specific about layout (hero section, cards, columns, etc.)
- Mention colors if you have preferences
- Describe the overall feel (modern, professional, playful, etc.)
- Include any specific elements you want (buttons, images, statistics)

### Style Descriptions
- Specify primary and accent colors with hex codes if possible
- Mention the overall theme (corporate, creative, minimal, etc.)
- Include font preferences if any
- Describe button styles and interactive elements

## Example Workflows

### Quick Setup
```
1. Enter ThoughtSpot URL
2. Enter Application Name
3. Check desired menus
4. Click Create Configuration
```

### Custom Branded Setup
```
1. Enter ThoughtSpot URL
2. Enter Application Name
3. Check desired menus
4. Select AI Model
5. Home Page Description: "Modern landing page with company logo, welcome message, and quick links to key reports. Use company brand colors: blue (#0066cc) and white."
6. Style Description: "Professional corporate theme with blue primary (#0066cc), white backgrounds, and subtle gray accents. Clean, minimal design."
7. Click Create Configuration
```

## Technical Details

### Files Modified

- `src/components/ConfigurationWizard.tsx` - Main wizard component
- `src/components/SettingsModal.tsx` - Integration into settings
- `src/services/anthropicService.ts` - AI content generation functions
- `src/services/configurationService.ts` - Configuration management
- `src/components/MaterialIcon.tsx` - Icon support

### AI Service Functions

Two new functions were added to `anthropicService.ts`:

1. **`generateHomePageContent(description: string)`**
   - Input: Natural language description
   - Output: Complete HTML document with inline CSS
   - Model: Claude 3.5 Sonnet
   - Max tokens: 4000

2. **`generateStyleConfiguration(description: string)`**
   - Input: Natural language style description
   - Output: JSON object with ThoughtSpot CSS variables
   - Model: Claude 3.5 Sonnet
   - Max tokens: 2000

### Configuration Structure

The wizard generates a complete `ConfigurationData` object with:
```typescript
{
  appConfig: {
    thoughtspotUrl: string,
    applicationName: string,
    // ... other app settings
  },
  standardMenus: StandardMenu[],  // with enabled status and model IDs
  stylingConfig: {
    embeddedContent: {
      customCSS: {
        variables: Record<string, string>  // AI-generated CSS vars
      }
    }
  },
  // ... other config sections
}
```

## Troubleshooting

### AI Generation Fails
- Check that the Anthropic API key is configured
- Ensure network connectivity
- Try simpler, more specific descriptions
- The wizard will use defaults if AI generation fails

### Configuration Not Applied
- Verify the page reloads after wizard completion
- Check browser console for errors
- Try clearing browser cache and reloading

### Menus Not Showing
- Ensure you checked at least one menu in the wizard
- Verify the menu is enabled in the configuration
- Check that the standard menu IDs match the application routes

## Future Enhancements

Potential improvements for future versions:
- Preview of generated content before applying
- Multiple style themes to choose from
- Export wizard configurations as templates
- Import existing configurations into wizard
- Step-by-step wizard with progress indicator
- Real-time preview of AI-generated content

## Support

For issues or questions:
- Check the console for error messages
- Review the generated configuration in Settings → Configuration
- Verify AI API key is properly configured
- Contact support with specific error details

