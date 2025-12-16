# Show Logo Feature

## Overview
Added an option to hide the application logo in the top bar and display only the application name.

## Changes Made

### 1. Type Definitions (`src/types/thoughtspot.ts`)
- Added `showLogo?: boolean` property to the `AppConfig` interface
- When set to `false`, the logo is hidden and only the application name is shown
- Defaults to `true` for backward compatibility

### 2. TopBar Component (`src/components/TopBar.tsx`)
- Added `showLogo` prop to the `TopBarProps` interface
- Wrapped logo rendering in a conditional check: `{showLogo && ...}`
- The logo is only rendered when `showLogo` is `true`
- Maintains all existing logo loading logic (IndexedDB, data URLs, regular URLs)

### 3. Layout Component (`src/components/Layout.tsx`)
- Updated `TopBar` component call to pass `showLogo={appConfig.showLogo !== false}`
- This ensures the logo is shown by default and only hidden when explicitly set to `false`

### 4. Configuration Service (`src/services/configurationService.ts`)
- Updated `DEFAULT_CONFIG` to include `showLogo: true` in the `appConfig`
- Existing configurations will automatically get this default value through the merge logic

### 5. Settings Modal (`src/components/SettingsModal.tsx`)
- Added a checkbox under the "Application Logo" section
- Label: "Show Logo" with explanatory text
- When unchecked, the logo is hidden and only the application name is displayed
- Located in the "Configuration" tab under "General" sub-tab

## Usage

### Via Settings Modal
1. Open Settings (gear icon in sidebar)
2. Go to "Configuration" tab
3. In the "General" sub-tab, scroll to the "Application Logo" section
4. Uncheck the "Show Logo" checkbox to hide the logo
5. Check the "Show Logo" checkbox to show the logo

### Via Configuration File
```json
{
  "appConfig": {
    "showLogo": false  // Set to false to hide logo
  }
}
```

## Backward Compatibility
- Existing configurations without the `showLogo` property will default to `true` (show logo)
- No migration required for existing users
- The feature is opt-in (logo is shown by default)

## Testing
To test this feature:
1. Load the application
2. Go to Settings > Configuration > General
3. Toggle the "Show Logo" checkbox
4. Observe that the logo appears/disappears in the top bar
5. Export the configuration and verify `showLogo` is saved correctly
6. Import the configuration to verify the setting persists

