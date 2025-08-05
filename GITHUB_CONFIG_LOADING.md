# GitHub Configuration Loading Feature

## Overview

The TSE Demo Builder now supports loading saved configurations directly from GitHub. This feature allows users to access pre-built configurations stored in the public ThoughtSpot repository.

## Repository Structure

Configurations are stored in the `configs` folder of the repository:
```
https://github.com/thoughtspot/tse-demo-builders-pre-built/configs/
```

Each configuration file should be a JSON file with the following structure:

```json
{
  "description": "Configuration description",
  "appConfig": {
    "thoughtspotUrl": "https://your-instance.thoughtspot.cloud/",
    "applicationName": "TSE Demo Builder",
    "logo": "https://example.com/logo.png",
    "earlyAccessFlags": "enable-modular-home\nenable-custom-styling"
  },
  "stylingConfig": {
    "application": {
      "topBar": {
        "backgroundColor": "#1f2937",
        "foregroundColor": "#ffffff",
        "logoUrl": "https://example.com/logo.png"
      },
      "sidebar": {
        "backgroundColor": "#f3f4f6",
        "foregroundColor": "#374151"
      },
      "footer": {
        "backgroundColor": "#1f2937",
        "foregroundColor": "#ffffff"
      },
      "dialogs": {
        "backgroundColor": "#ffffff",
        "foregroundColor": "#374151"
      }
    },
    "embeddedContent": {
      "strings": {
        "search.placeholder": "Search your data...",
        "favorites.title": "My Favorites"
      },
      "stringIDs": {
        "search.placeholder": "custom.search.placeholder",
        "favorites.title": "custom.favorites.title"
      },
      "cssUrl": "https://example.com/custom-styles.css",
      "customCSS": {
        "variables": {
          "--ts-primary-color": "#3182ce",
          "--ts-secondary-color": "#6b7280"
        },
        "rules_UNSTABLE": {
          ".ts-search-container": {
            "border-radius": "8px",
            "box-shadow": "0 2px 4px rgba(0,0,0,0.1)"
          }
        }
      }
    },
    "embedFlags": {
      "spotterEmbed": {
        "enableSearchSuggestions": true,
        "showRecentSearches": true
      },
      "liveboardEmbed": {
        "enableDrillDown": true,
        "showFilters": true
      },
      "searchEmbed": {
        "enableAutoComplete": true,
        "showSearchHistory": true
      },
      "appEmbed": {
        "enableNavigation": true,
        "showUserMenu": true
      }
    }
  }
}
```

## How to Use

1. Open the Settings modal in the TSE Demo Builder
2. Navigate to the "Configuration" tab
3. Click the "Load from GitHub" button
4. Select a configuration from the dropdown list
5. Click "Load Configuration" to apply the selected configuration

## Features

- **Automatic Discovery**: The system automatically fetches all JSON configuration files from the `configs` folder
- **Error Handling**: Graceful error handling for network issues or invalid configurations
- **User Feedback**: Clear status messages for successful loads and errors
- **Configuration Validation**: Basic validation of configuration structure

## Implementation Details

### Files Modified

1. **`src/services/githubApi.ts`** - New service for GitHub API interactions
2. **`src/components/SettingsModal.tsx`** - Updated to include GitHub loading functionality

### Key Functions

- `fetchSavedConfigurations()` - Fetches the list of available configurations
- `loadConfigurationFromGitHub(filename)` - Loads a specific configuration file
- `loadSavedConfigurations()` - UI function to load and display configurations
- `loadConfiguration(filename)` - UI function to apply a selected configuration

### API Endpoints Used

- `GET https://api.github.com/repos/thoughtspot/tse-demo-builders-pre-built/contents/configs`
- `GET https://api.github.com/repos/thoughtspot/tse-demo-builders-pre-built/contents/configs/{filename}`

## Error Handling

The system handles various error scenarios:

- Network connectivity issues
- Invalid JSON configurations
- Missing or inaccessible repository
- Rate limiting from GitHub API

## Future Enhancements

- Support for configuration categories/tags
- Configuration preview before loading
- Version control for configurations
- Configuration comparison tools
- Support for private repositories with authentication 