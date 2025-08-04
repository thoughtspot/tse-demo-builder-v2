# Embed-Specific Flags Configuration

This feature allows you to configure flags specific to different ThoughtSpot embed types. These flags are added to the embed configuration and can be used to customize the behavior of each embed type.

## Supported Embed Types

- **SpotterEmbed**: Flags for AI Analyst/Spotter embeds
- **LiveboardEmbed**: Flags for Liveboard embeds  
- **SearchEmbed**: Flags for Search embeds
- **AppEmbed**: Flags for Full App embeds

## How to Configure

1. Open the Settings modal
2. Navigate to the "Styling" tab
3. Click on the "Embed Flags" sub-tab
4. Configure flags for each embed type using JSON format

## JSON Configuration Format

You can provide flags in two ways:

### Complete JSON Object
```json
{
  "dataPanelV2": true,
  "collapseDataSources": false,
  "customFlag": "value"
}
```

### Individual Entries
```
dataPanelV2: true
collapseDataSources: false
customFlag: "value"
```

## Example Configurations

### SpotterEmbed Flags
```json
{
  "enableDataPanel": true,
  "showSearchBar": false,
  "customSpotterFlag": "value"
}
```

### SearchEmbed Flags
```json
{
  "dataPanelV2": true,
  "collapseDataSources": true,
  "enableAdvancedSearch": false
}
```

### LiveboardEmbed Flags
```json
{
  "showFilters": true,
  "enableDrillDown": false,
  "customLiveboardFlag": "value"
}
```

### AppEmbed Flags
```json
{
  "enableCustomNavigation": true,
  "showAdvancedFeatures": false,
  "customAppFlag": "value"
}
```

## Validation

- Invalid JSON will show an error message
- Empty or invalid configurations will be ignored
- Flags are merged with the default embed configuration

## Usage in Code

The flags are automatically applied to the respective embed types:

- **SpotterPage**: Uses `spotterEmbed` flags
- **SearchPage**: Uses `searchEmbed` flags  
- **ThoughtSpotEmbed**: Uses `liveboardEmbed` for liveboards, `searchEmbed` for answers/models
- **FullAppPage**: Uses `appEmbed` flags

## Storage

Embed flags are stored as part of the styling configuration and are persisted in localStorage. They are included in configuration exports and imports. 