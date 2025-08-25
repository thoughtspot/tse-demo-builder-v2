# Storage Management

This document describes the storage management features implemented to handle localStorage quota exceeded errors.

## Overview

The TSE Demo Builder application stores configuration data in the browser's localStorage. When the storage quota is exceeded, the application can fail to save new configurations. This implementation provides automatic detection and recovery mechanisms.

## Features

### 1. Storage Health Monitoring

The application continuously monitors localStorage usage and provides warnings when storage is approaching capacity.

- **Automatic Detection**: Checks storage health every 30 seconds
- **Visual Warnings**: Shows warning banners when storage usage exceeds 90%
- **Real-time Status**: Displays current usage and quota information

### 2. Automatic Recovery

When storage quota is exceeded, the application automatically attempts to recover:

- **Preemptive Cleanup**: Clears old data when approaching quota limits
- **Retry Mechanism**: Automatically retries failed saves after cleanup
- **Graceful Degradation**: Falls back to default configurations if needed

### 3. Manual Storage Management

Users can manually manage storage through the Settings modal:

- **Storage Tab**: Dedicated tab for storage management
- **Health Status**: Real-time storage usage information
- **Manual Clear**: Option to clear all storage and restore defaults
- **Export Before Clear**: Reminder to export configurations before clearing

## Implementation Details

### Storage Health Check

```typescript
const health = checkStorageHealth();
// Returns: { healthy: boolean, currentSize: number, quota: number, usagePercentage: number, message: string }
```

### Automatic Cleanup

```typescript
// Called automatically when quota is nearly exceeded
if (currentSize + estimatedSize > quota * 0.9) {
  cleanupOldStorage();
}
```

### Error Recovery

```typescript
// Retry mechanism for quota exceeded errors
if (error instanceof Error && error.name === 'QuotaExceededError') {
  cleanupOldStorage();
  // Retry the save operation
}
```

## User Interface

### Warning Banner

When storage issues are detected, a red warning banner appears at the top of the application with:
- Storage status message
- "Clear Storage" button for immediate action
- "Dismiss" button to hide the warning

### Settings Modal - Storage Tab

The Storage tab in Settings provides:
- Current storage usage and quota
- Health status indicator
- Manual refresh button
- Clear storage button with confirmation
- Information about localStorage limits

## Best Practices

1. **Export Configurations**: Always export your configuration before clearing storage
2. **Monitor Usage**: Check the Storage tab regularly if you have large configurations
3. **Clear Regularly**: Clear storage periodically to prevent quota issues
4. **Backup Important Data**: Use the export feature to backup configurations

## Technical Notes

- **Quota Limit**: Most browsers have a 5-10MB localStorage limit
- **Size Calculation**: Includes both key and value sizes
- **Automatic Recovery**: Triggers at 90% usage threshold
- **Default Fallback**: Always restores default configurations after clearing

## Troubleshooting

### Storage Still Full After Clear

1. Check if other applications are using localStorage
2. Try clearing browser data for the site
3. Check browser developer tools for storage usage

### Persistent Errors

1. Export your configuration
2. Clear browser data for the site
3. Reload the application
4. Import your configuration

### Configuration Loss

1. Check if you have exported configurations
2. Look for backup files in your downloads
3. Contact support if no backup is available
