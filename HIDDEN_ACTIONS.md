# Hidden Actions Configuration

## Overview

The Hidden Actions feature allows you to configure which ThoughtSpot actions are hidden from specific users. This provides fine-grained control over what actions users can perform in ThoughtSpot embeds.

## How to Configure

### 1. Access the Configuration
1. Open the Settings modal
2. Navigate to the "Users" tab
3. Click "Edit" on any user
4. Scroll down to the "Hidden Actions Configuration" section

### 2. Enable Hidden Actions
- Check the "Enable Hidden Actions Configuration" checkbox
- When enabled, you can select which actions to hide from the user

### 3. Select Actions to Hide

#### Common Actions
The interface provides a comprehensive list of common ThoughtSpot actions including:
- **Save** - Save changes to answers or liveboards
- **Save as View** - Save answers as view objects
- **Make a Copy** - Create copies of liveboards or answers
- **Copy Link** - Copy visualization URLs
- **Schedule** - Schedule liveboard jobs
- **Share** - Share objects with other users
- **Add Filter** - Add filters to visualizations
- **Download** - Download content in various formats
- **Edit** - Edit content
- And many more...

#### Custom Actions
You can also add custom action strings for actions that aren't in the predefined list:
1. Click "Add Custom Action"
2. Enter the custom action string
3. Click "Add"

**Note**: Custom action strings may cause TypeScript linter warnings because the SDK expects Action enum values, but this is expected behavior and can be safely ignored.

## How It Works

### User-Based Configuration
- Each user can have their own hidden actions configuration
- The configuration is stored as part of the user's access settings
- When a user is selected, their hidden actions are automatically applied to all ThoughtSpot embeds

### Embed Integration
The hidden actions are automatically applied to:
- **LiveboardEmbed** - For liveboard content
- **SearchEmbed** - For search and answer content  
- **SpotterEmbed** - For AI analyst/spotter content
- **AppEmbed** - For full application embeds

### Technical Implementation
- Hidden actions are passed to the ThoughtSpot SDK as the `hiddenActions` parameter
- The parameter accepts an array of action strings (Action enum values or custom strings)
- Actions in the array are hidden from the user interface
- By default, all actions are visible unless explicitly hidden

## Default Behavior

- **Disabled by Default**: Hidden actions configuration is disabled for all users by default
- **All Actions Visible**: When disabled, users can see all available actions
- **User-Specific**: Each user can have different hidden actions configurations

## Example Use Cases

### 1. Read-Only Users
Hide actions like:
- Save
- Save as View
- Make a Copy
- Edit
- Add Filter

### 2. Limited Access Users
Hide actions like:
- Schedule
- Share
- Export TML
- Import TML

### 3. Custom Actions
Hide custom actions specific to your organization:
- Custom workflow actions
- Organization-specific features
- Third-party integrations

## Configuration Storage

- Hidden actions configuration is stored as part of the user configuration
- Configuration is persisted in localStorage
- Included in configuration exports and imports
- Survives browser sessions

## Technical Notes

### TypeScript Considerations
- The SDK expects `Action[]` type for hidden actions
- Custom action strings are cast to `any[]` to avoid TypeScript errors
- This is intentional to support custom actions not in the SDK's Action enum

### SDK Compatibility
- Compatible with ThoughtSpot Visual Embed SDK v1.39.3+
- Works with all embed types (LiveboardEmbed, SearchEmbed, SpotterEmbed, AppEmbed)
- Supports both predefined actions and custom action strings

## Troubleshooting

### Actions Not Hidden
1. Verify the hidden actions configuration is enabled for the user
2. Check that the action strings match exactly (case-sensitive)
3. Ensure the user is properly selected as the current user
4. Refresh the embed to see changes

### Custom Actions Not Working
1. Verify the custom action string is correct
2. Check that the action is actually available in your ThoughtSpot instance
3. Custom actions may require specific ThoughtSpot version support

### TypeScript Errors
- Custom action strings may cause TypeScript warnings
- These warnings can be safely ignored
- The functionality will work correctly despite the warnings 