# Custom CSS Variables Fix

## Problem
Custom CSS variables specified in the Styling Configuration -> Custom CSS Variables were not being applied to individual ThoughtSpot embeds. The variables were only being set in the global ThoughtSpot initialization but not passed to individual embed instances.

## Root Cause
The ThoughtSpot SDK has two levels of customization:
1. **Global initialization** (in Layout.tsx) - sets up global customizations via `init()`
2. **Individual embed instances** - can have their own customizations via `customizations` property

The issue was that individual embed instances in `ThoughtSpotEmbed`, `SpotterPage`, `SearchPage`, and `FullAppPage` were not including the custom CSS variables from the styling configuration in their embed configurations.

## Solution
Updated all embed components to include the custom CSS variables and other styling customizations in their individual embed configurations.

## Changes Made

### 1. ThoughtSpotEmbed Component
**File**: `src/components/ThoughtSpotEmbed.tsx`

- Added custom CSS configuration extraction from styling config
- Created `baseEmbedConfig` with customizations for all embed types
- Updated dependency array to include styling configuration changes

```typescript
// Get custom CSS configuration from styling config
const customCSS = context.stylingConfig.embeddedContent.customCSS;
const cssUrl = context.stylingConfig.embeddedContent.cssUrl;
const strings = context.stylingConfig.embeddedContent.strings;
const stringIDs = context.stylingConfig.embeddedContent.stringIDs;

// Base embed configuration with customizations
const baseEmbedConfig = {
  frameParams: {
    width,
    height,
  },
  ...embedFlags,
  ...(hiddenActions.length > 0 && { hiddenActions }),
  customizations: {
    content: {
      strings: strings || {},
      stringIDs: stringIDs || {},
    },
    style: {
      customCSSUrl: cssUrl || undefined,
      customCSS: {
        variables: customCSS.variables || {},
        rules_UNSTABLE: customCSS.rules_UNSTABLE || {},
      },
    },
  },
};
```

### 2. SpotterPage Component
**File**: `src/components/pages/SpotterPage.tsx`

- Added custom CSS configuration to SpotterEmbed
- Updated dependency array to include styling configuration changes

### 3. SearchPage Component
**File**: `src/components/pages/SearchPage.tsx`

- Added custom CSS configuration to SearchEmbed
- Updated dependency array to include styling configuration changes

### 4. FullAppPage Component
**File**: `src/components/pages/FullAppPage.tsx`

- Added custom CSS configuration to AppEmbed
- Updated dependency array to include styling configuration changes

## Customizations Applied

Each embed now includes the following customizations from the styling configuration:

1. **Custom CSS Variables**: `stylingConfig.embeddedContent.customCSS.variables`
2. **Custom CSS Rules**: `stylingConfig.embeddedContent.customCSS.rules_UNSTABLE`
3. **Custom CSS URL**: `stylingConfig.embeddedContent.cssUrl`
4. **String Mappings**: `stylingConfig.embeddedContent.strings`
5. **String ID Mappings**: `stylingConfig.embeddedContent.stringIDs`

## Behavior

- **Real-time Updates**: When styling configuration changes, embeds automatically re-initialize with new customizations
- **Consistent Styling**: All embed types (Liveboard, Search, Spotter, Full App) now use the same styling configuration
- **Backward Compatibility**: Existing functionality is preserved, only styling customizations are enhanced

## Testing

To test the fix:

1. Open the Settings modal
2. Navigate to Styling -> Embedded Content -> Custom CSS Variables
3. Add a CSS variable like:
   ```json
   {
     "--ts-var-button--secondary-background": "#F0EBFF"
   }
   ```
4. Navigate to any embed page (Liveboard, Search, Spotter, Full App)
5. The custom CSS variable should now be applied to the embed

## Files Modified

1. `src/components/ThoughtSpotEmbed.tsx` - Added customizations to all embed types
2. `src/components/pages/SpotterPage.tsx` - Added customizations to SpotterEmbed
3. `src/components/pages/SearchPage.tsx` - Added customizations to SearchEmbed
4. `src/components/pages/FullAppPage.tsx` - Added customizations to AppEmbed

## Impact

- ✅ Custom CSS variables now apply to all ThoughtSpot embeds
- ✅ Custom CSS rules now apply to all ThoughtSpot embeds
- ✅ Custom CSS URLs now apply to all ThoughtSpot embeds
- ✅ String mappings now apply to all ThoughtSpot embeds
- ✅ Real-time updates when styling configuration changes
- ✅ Maintains all existing functionality
