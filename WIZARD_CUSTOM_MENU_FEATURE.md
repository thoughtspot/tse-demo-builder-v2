# Configuration Wizard - Custom Menu Feature

## Overview
The Configuration Wizard now supports creating a custom menu item during the initial configuration setup. Users can add one custom menu that can be either tag-based (showing content filtered by tags) or a direct embed (showing a specific liveboard or answer).

## Features Added

### 1. Custom Menu Configuration Options
Users can now:
- **Enable/Disable**: Checkbox to add a custom menu to the configuration
- **Name**: Specify a custom name for the menu item
- **Icon**: Choose a Material icon for the menu
- **Menu Type**: Select between two types:
  - **Tag-based List**: Shows content filtered by selected tags
  - **Direct Embed**: Shows a specific liveboard or answer

### 2. Tag-based Custom Menu
When selecting tag-based menu:
- **Tag Selection**: Multi-select dropdown with all available tags
- **Filter**: Search/filter tags by name
- **Multiple Tags**: Select multiple tags using Ctrl/Cmd
- The menu will display all liveboards and answers tagged with the selected tags

### 3. Direct Embed Custom Menu
When selecting direct embed:
- **Content Type**: Choose between Liveboard or Answer
- **Content Selection**: Dropdown showing all available content of the selected type
- **Filter**: Search/filter content by name
- The menu will directly embed the selected content

## Implementation Details

### Files Modified

#### 1. `src/components/ConfigurationWizard.tsx`
- **Updated `WizardConfiguration` interface** to include `customMenu` property
- **Added state variables** for custom menu configuration:
  - `addCustomMenu`: Boolean to enable/disable custom menu
  - `customMenuName`, `customMenuIcon`: Basic menu properties
  - `customMenuType`: "tag" or "direct"
  - `customMenuTags`: Array of selected tag names
  - `customMenuDirectType`, `customMenuDirectId`, `customMenuDirectName`: Direct embed properties
- **Added data fetching**:
  - Tags from ThoughtSpot
  - Liveboards from ThoughtSpot
  - Answers from ThoughtSpot
- **Added UI section** for custom menu configuration with:
  - Checkbox to enable
  - Form fields for menu properties
  - Radio buttons for menu type selection
  - Conditional rendering for tag or direct embed options
- **Updated `handleSubmit`** to include custom menu data in configuration

#### 2. `src/components/SettingsModal.tsx`
- **Updated `handleWizardComplete`** function to:
  - Check if custom menu is provided in wizard configuration
  - Create a `CustomMenu` object with proper structure
  - Add the custom menu using `addCustomMenu` function
  - Save to localStorage for persistence
  - Log custom menu creation for debugging

### Configuration Structure

The custom menu configuration in `WizardConfiguration`:

```typescript
customMenu?: {
  name: string;
  icon: string;
  type: "tag" | "direct";
  // For tag-based menus
  tagIdentifiers?: string[];
  // For direct embed
  directEmbed?: {
    type: "liveboard" | "answer";
    contentId: string;
    contentName?: string;
  };
}
```

The created `CustomMenu` object:

```typescript
{
  id: `custom-${Date.now()}`,
  name: wizardConfig.customMenu.name,
  description: "",
  icon: wizardConfig.customMenu.icon,
  enabled: true,
  contentSelection: {
    type: wizardConfig.customMenu.type,
    tagIdentifiers: wizardConfig.customMenu.tagIdentifiers,
    directEmbed: wizardConfig.customMenu.directEmbed,
  },
}
```

## User Experience

### Wizard Flow
1. User opens Configuration Wizard from Settings → Configuration → General Configuration
2. User fills in required fields (ThoughtSpot URL, Application Name, etc.)
3. User checks "Add Custom Menu" checkbox (optional)
4. If enabled:
   - Enter menu name (required)
   - Enter icon name (optional, defaults to "dashboard")
   - Select menu type: Tag-based List or Direct Embed
   - **For Tag-based**:
     - Select one or more tags from the list
     - Use filter to search tags
   - **For Direct Embed**:
     - Select content type (Liveboard or Answer)
     - Select specific content from the filtered list
5. Click "Create Configuration"
6. Configuration is created with the custom menu included

### After Configuration
- The custom menu appears in the sidebar navigation
- For tag-based menus: Shows a grid of content filtered by the selected tags
- For direct embeds: Shows the selected liveboard or answer directly

## Benefits
- **Streamlined Setup**: Users can create their first custom menu during initial configuration
- **Flexible Options**: Support for both tag-based lists and direct embeds
- **User-Friendly UI**: Familiar interface consistent with existing custom menu editor
- **Time Saving**: No need to navigate to Custom Menus tab after wizard completion

## Future Enhancements
Potential improvements:
- Support for multiple custom menus in wizard
- Template selection for common menu configurations
- Preview of custom menu before creation
- Icon picker UI instead of text input
- Validation for required fields with visual feedback

