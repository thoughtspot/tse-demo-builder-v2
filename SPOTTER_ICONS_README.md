# Spotter Icons

This document describes the Spotter icon system used in the TSE Demo Builder, including where icons come from, their structure, and how to create new ones.

Note that all icons for Spotter must conform to the rules you can find in the developer documentation.

## Overview

The Spotter icon system consists of two types of SVG files for each icon:
1. **Original Icons** - Used by ThoughtSpot embeds (contain `<symbol>` definitions)
2. **Preview Icons** - Used for display in the UI (standalone SVG with rendered content)

## Icon Source

All Spotter icons are hosted in the GitHub repository:
**Repository**: `thoughtspot/tse-demo-builders-pre-built`  
**Path**: `/icons/spotter/`  
**CDN**: `https://cdn.jsdelivr.net/gh/thoughtspot/tse-demo-builders-pre-built/icons/spotter/`

## File Naming Convention

### Original Icons (for ThoughtSpot embeds)
- Format: `{name}-{version}.svg`
- Examples: `generic-01.svg`, `super-shopper-02.svg`, `analytics-01.svg`

### Preview Icons (for UI display)
- Format: `{name}-preview-{version}.svg`
- Examples: `generic-preview-01.svg`, `super-shopper-preview-02.svg`, `analytics-preview-01.svg`

## Icon Structure

### Original Icons (ThoughtSpot Compatible)
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <defs>
    <symbol id="icon-name" viewBox="0 0 24 24">
      <!-- SVG path data here -->
    </symbol>
  </defs>
</svg>
```

**Key Points:**
- Contains `<symbol>` definitions for ThoughtSpot's icon sprite system
- Not directly renderable as standalone images
- Used as `iconSpriteUrl` in ThoughtSpot embed configurations

### Preview Icons (UI Display)
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <!-- Direct SVG path data here - fully rendered -->
  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
</svg>
```

**Key Points:**
- Contains actual rendered SVG content
- Directly displayable in browsers and UI components
- Used for icon picker previews and navigation menu display

## How to Create New Spotter Icons

### Step 1: Design the Icon
1. Create your icon design in a vector graphics editor (Adobe Illustrator, Figma, etc.)
2. Ensure the design fits within a 24x24 viewBox
3. Use simple, clean lines that will work well at small sizes
4. Consider the icon's purpose and how it relates to data/analytics

### Step 2: Create the Original Icon (ThoughtSpot Compatible)
1. Create an SVG file with the naming pattern: `{name}-{version}.svg`
2. Structure it as a symbol definition:
   ```svg
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
     <defs>
       <symbol id="your-icon-name" viewBox="0 0 24 24">
         <!-- Your SVG path data here -->
       </symbol>
     </defs>
   </svg>
   ```
3. The `id` attribute should be descriptive and unique

### Step 3: Create the Preview Icon (UI Display)
1. Create a preview version with the naming pattern: `{name}-preview-{version}.svg`
2. Structure it as a standalone SVG:
   ```svg
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
     <!-- Your SVG path data here - same as in the symbol -->
   </svg>
   ```
3. This should contain the actual rendered content, not symbol definitions

### Step 4: Upload to Repository
1. Upload both files to the `thoughtspot/tse-demo-builders-pre-built` repository
2. Place them in the `/icons/spotter/` directory
3. Ensure both files are committed and pushed to the main branch

### Step 5: Test Integration
1. The icons will be automatically available via CDN
2. Original icons will work in ThoughtSpot embeds
3. Preview icons will display in the icon picker UI

## Integration in TSE Demo Builder

### Icon Picker Component
The `SpotterIconPicker` component automatically:
- Fetches available icons from the GitHub API
- Filters out preview files from the selectable list
- Converts original icon URLs to preview URLs for display
- Handles the "Default (No Custom Icon)" option

### Navigation Menu Integration
When a Spotter icon is selected:
- The original icon URL is stored in `stylingConfig.embeddedContent.iconSpriteUrl`
- The preview icon URL is used for the navigation menu display
- The system automatically converts between original and preview URLs

## Best Practices

### Icon Design
- Keep designs simple and recognizable at small sizes
- Use consistent stroke weights (typically 1.5-2px)
- Ensure good contrast and readability
- Test icons at various sizes (16px, 24px, 32px)

### Naming
- Use descriptive, kebab-case names
- Include version numbers for iterations
- Be consistent with existing naming patterns
- Avoid special characters or spaces

### File Organization
- Always create both original and preview versions
- Use consistent version numbering
- Test both files before committing
- Document any special requirements or usage notes

## Troubleshooting

### Icon Not Displaying in UI
- Check that the preview version exists and is properly formatted
- Verify the CDN URL is accessible
- Ensure the preview icon contains actual SVG content, not symbol definitions

### Icon Not Working in ThoughtSpot Embed
- Verify the original icon contains proper `<symbol>` definitions
- Check that the `id` attribute is unique and properly formatted
- Ensure the original icon URL is correctly set in the embed configuration

### CDN Issues
- Icons may take a few minutes to propagate through the CDN
- Check the GitHub repository to ensure files are committed
- Verify the file paths match the expected naming convention

## Example Workflow

1. **Design**: Create a "data-visualization" icon in Figma
2. **Original**: Create `data-visualization-01.svg` with symbol definition
3. **Preview**: Create `data-visualization-preview-01.svg` with rendered content
4. **Upload**: Commit both files to the repository
5. **Test**: Verify both icons work in the TSE Demo Builder
6. **Deploy**: Icons are automatically available via CDN

## Related Files

- `src/components/SpotterIconPicker.tsx` - Icon picker component
- `src/components/Layout.tsx` - Navigation menu integration
- `src/services/configurationService.ts` - Configuration management
- `src/components/SettingsModal.tsx` - Settings interface

## Support

For questions about creating or integrating Spotter icons, refer to the ThoughtSpot TSE documentation or contact the development team.
