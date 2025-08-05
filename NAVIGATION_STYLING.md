# Navigation Styling Features

## Automatic Color Generation

The left navigation now automatically generates appropriate hover and selected colors based on your background and foreground color settings. This ensures good contrast and visual consistency across different color schemes.

### How It Works

1. **Background Analysis**: The system analyzes whether your background color is light or dark
2. **Hover Color Generation**: 
   - For light backgrounds: Hover color is slightly darker than the background
   - For dark backgrounds: Hover color is slightly lighter than the background
3. **Selected Color Generation**:
   - For light backgrounds: Uses a blue color (#3182ce) with white text
   - For dark backgrounds: Uses a lighter blue (#60a5fa) with black text

### Color Generation Logic

```javascript
// Example: Light background (#f7fafc)
Background: #f7fafc
Generated Hover: #e2e8f0 (slightly darker)
Generated Selected: #3182ce (blue)
Generated Selected Text: #ffffff (white)

// Example: Dark background (#1a202c)
Background: #1a202c
Generated Hover: #2d3748 (slightly lighter)
Generated Selected: #60a5fa (light blue)
Generated Selected Text: #000000 (black)
```

## Explicit Color Override

If you want more control over the navigation colors, you can explicitly set them in the styling configuration:

### Available Properties

- `hoverColor`: Custom hover color (overrides automatic generation)
- `selectedColor`: Custom selected item background color
- `selectedTextColor`: Custom selected item text color

### Configuration Example

```json
{
  "application": {
    "sidebar": {
      "backgroundColor": "#f7fafc",
      "foregroundColor": "#4a5568",
      "hoverColor": "#e2e8f0",
      "selectedColor": "#3182ce",
      "selectedTextColor": "#ffffff"
    }
  }
}
```

## Best Practices

1. **Automatic Mode**: Use automatic color generation for most cases - it ensures good contrast and consistency
2. **Explicit Mode**: Use explicit colors when you need specific brand colors or have unique design requirements
3. **Testing**: Always test your color combinations to ensure good readability and accessibility
4. **Contrast**: Ensure sufficient contrast between background and text colors (WCAG guidelines recommend 4.5:1 ratio for normal text)

## Migration

Existing configurations will continue to work with automatic color generation. The new explicit color properties are optional and will only override automatic generation if provided.

## Troubleshooting

- **Poor Contrast**: If hover or selected items are hard to see, try using explicit colors with better contrast
- **Color Conflicts**: If explicit colors don't look right, remove them to fall back to automatic generation
- **Accessibility**: Use color contrast checkers to ensure your custom colors meet accessibility standards 