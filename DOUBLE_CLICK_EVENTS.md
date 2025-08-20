# Double-Click Event Handling

This feature allows you to configure custom handling for double-click events on embedded ThoughtSpot visualizations. When users double-click on visualization points, you can trigger custom actions or display event data.

## Overview

The double-click event handling feature provides:

- **Event Detection**: Automatically detects `EmbedEvent.VizPointDoubleClick` events from ThoughtSpot embeds
- **Custom JavaScript**: Execute custom JavaScript code when events occur
- **Default Modal**: Display event data in a formatted modal with JSON view
- **Flexible Configuration**: Enable/disable the feature and customize behavior

## Configuration

### Enabling the Feature

1. Open the Settings modal
2. Navigate to the "Events" tab
3. Check "Enable double-click event handling"

### Configuration Options

#### Show Default Modal
When enabled, displays a modal with the event data in a formatted view. The modal includes:
- Visualization information (ID, name)
- Selected points data with attributes and measures
- JSON view for raw data inspection

#### Modal Title
Customize the title displayed in the default modal.

#### Custom JavaScript Handler
Write custom JavaScript code to handle double-click events. This code has access to:

- `event`: The double-click event data object
- `modal`: Reference to the modal element (if showDefaultModal is true)
- `embedInstance`: Reference to the ThoughtSpot embed instance

## Event Data Structure

The double-click event data follows this structure:

```typescript
interface VizPointDoubleClickEvent {
  vizId: string;           // Visualization ID
  vizName: string;         // Visualization name
  selectedPoints: {        // Array of selected points
    selectedAttributes: {  // Attribute columns
      column: {
        dataType: string;
        name: string;
      };
      value: string;
    }[];
    selectedMeasures: {    // Measure columns
      column: {
        dataType: string;
        name: string;
      };
      value: number;
    }[];
  }[];
  clickedPoints?: {        // Optional clicked points data
    // Same structure as selectedPoints
  }[];
  [key: string]: unknown;  // Additional properties
}
```

## JavaScript Handler Examples

### Basic Event Logging
```javascript
console.log('Double-click event:', event);
console.log('Selected points:', event.selectedPoints.length);
```

### Custom Alert
```javascript
const pointCount = event.selectedPoints.length;
alert(`Double-clicked on ${pointCount} point(s)`);
```

### Update Modal Content
```javascript
if (modal) {
  const pointCount = event.selectedPoints.length;
  modal.innerHTML = `
    <div style="padding: 20px;">
      <h3>Custom Content</h3>
      <p>You clicked on ${pointCount} point(s)</p>
      <p>Viz: ${event.vizName}</p>
    </div>
  `;
}
```

### Extract Specific Data
```javascript
// Get all attribute values
const attributes = event.selectedPoints.flatMap(point => 
  point.selectedAttributes.map(attr => ({
    column: attr.column.name,
    value: attr.value
  }))
);

// Get all measure values
const measures = event.selectedPoints.flatMap(point => 
  point.selectedMeasures.map(measure => ({
    column: measure.column.name,
    value: measure.value
  }))
);

console.log('Attributes:', attributes);
console.log('Measures:', measures);
```

### Custom Modal Styling
```javascript
if (modal) {
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  modal.innerHTML = `
    <div style="
      background: white;
      padding: 30px;
      border-radius: 10px;
      max-width: 500px;
      text-align: center;
    ">
      <h2 style="color: #3b82f6;">🎯 Double-Click Detected!</h2>
      <p>Visualization: <strong>${event.vizName}</strong></p>
      <p>Points selected: <strong>${event.selectedPoints.length}</strong></p>
      <button onclick="this.parentElement.parentElement.remove()" 
              style="
                background: #3b82f6;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
              ">
        Close
      </button>
    </div>
  `;
}
```

### API Integration
```javascript
// Send event data to external API
fetch('/api/double-click-events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    vizId: event.vizId,
    vizName: event.vizName,
    selectedPoints: event.selectedPoints,
    timestamp: new Date().toISOString()
  })
})
.then(response => response.json())
.then(data => {
  console.log('Event logged:', data);
  if (modal) {
    modal.innerHTML = '<p>Event logged successfully!</p>';
  }
})
.catch(error => {
  console.error('Failed to log event:', error);
});
```

## Best Practices

### Error Handling
Always wrap custom JavaScript in try-catch blocks:

```javascript
try {
  // Your custom code here
  console.log('Event processed successfully');
} catch (error) {
  console.error('Error processing double-click event:', error);
  // Fallback to default modal if needed
  if (modal) {
    modal.innerHTML = '<p>Error processing event</p>';
  }
}
```

### Performance Considerations
- Keep custom JavaScript lightweight to avoid blocking the UI
- Use async/await for API calls
- Avoid heavy DOM manipulations

### Security
- Validate and sanitize any user input
- Be cautious with `eval()` or `Function()` constructors
- Consider Content Security Policy (CSP) restrictions

## Troubleshooting

### Event Not Firing
1. Ensure the feature is enabled in settings
2. Check that the embed is properly initialized
3. Verify the visualization supports double-click events
4. Check browser console for errors

### Custom JavaScript Not Working
1. Validate JavaScript syntax in the configuration
2. Check browser console for runtime errors
3. Ensure all referenced variables are available
4. Test with simple console.log statements first

### Modal Not Displaying
1. Verify "Show default modal" is enabled
2. Check if custom JavaScript is overriding the modal
3. Ensure no CSS is hiding the modal
4. Check z-index conflicts

## Storage

Double-click configuration is stored as part of the styling configuration in localStorage and is included in configuration exports and imports.

## Browser Compatibility

This feature requires:
- Modern browsers with ES6+ support
- ThoughtSpot Visual Embed SDK
- JavaScript enabled

## Related Features

- [Embed Flags Configuration](./EMBED_FLAGS.md)
- [Styling Features](./STYLING_FEATURES.md)
- [Configuration Management](./GITHUB_CONFIG_LOADING.md)
