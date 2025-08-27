# Storage Improvements

## Overview

The TSE Demo Builder now uses a hybrid storage system that automatically chooses the best storage method based on configuration size and content type. This system provides better support for large configurations with images and HTML content.

## Storage System Architecture

### Hybrid Storage Approach

The system uses two storage mechanisms:

1. **localStorage** - For small configurations (< 1MB)
   - Fast access and simple implementation
   - Limited to ~5MB total storage
   - Synchronous operations

2. **IndexedDB** - For large configurations (≥ 1MB)
   - Supports much larger storage (typically 50MB+)
   - Asynchronous operations
   - Better for binary data like images

### Automatic Selection

The system automatically determines which storage to use based on:

- **Total configuration size** - If > 1MB, uses IndexedDB
- **Image content detection** - If large data URLs are detected, uses IndexedDB
- **Fallback mechanism** - If IndexedDB fails, falls back to localStorage

## Key Features

### Large Object Support

- **Images**: Base64 encoded images are now stored efficiently in IndexedDB
- **HTML Content**: Large HTML content with embedded images is supported
- **Configuration Size**: No practical limit on configuration size

### Backward Compatibility

- **Migration**: Automatically migrates from old localStorage format
- **Fallback**: If IndexedDB is unavailable, falls back to localStorage
- **Legacy Support**: Still supports the old multi-key storage format

### Performance Optimizations

- **Smart Detection**: Only uses IndexedDB when necessary
- **Efficient Loading**: Loads from fastest available storage first
- **Error Recovery**: Graceful handling of storage failures

## Implementation Details

### Storage Detection Logic

```typescript
const isLargeConfiguration = (config: ConfigurationData): boolean => {
  const serialized = JSON.stringify(config);
  
  // Check total size
  if (serialized.length > LARGE_OBJECT_THRESHOLD) {
    return true;
  }

  // Check for large data URLs (images)
  const dataUrlPattern = /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g;
  const dataUrls = serialized.match(dataUrlPattern);
  
  if (dataUrls) {
    const totalDataUrlSize = dataUrls.reduce((total, url) => {
      return total + Math.ceil((url.length * 3) / 4);
    }, 0);
    
    if (totalDataUrlSize > LARGE_OBJECT_THRESHOLD) {
      return true;
    }
  }

  return false;
};
```

### Storage Health Monitoring

The system provides real-time storage health monitoring:

- **Usage Tracking**: Monitors current storage usage
- **Quota Management**: Tracks available storage space
- **Health Warnings**: Alerts when storage is approaching limits
- **Storage Type Detection**: Shows which storage system is being used

### Error Handling

- **Graceful Degradation**: Falls back to localStorage if IndexedDB fails
- **User Feedback**: Clear error messages for storage issues
- **Recovery Options**: Automatic cleanup and retry mechanisms

## Usage

### For Developers

The storage system is transparent to the rest of the application. All existing functions continue to work:

```typescript
// These functions now work with both storage systems
await saveStandardMenus(menus);
await saveCustomMenus(menus);
await saveStylingConfig(config);

// Loading is also transparent
const config = await loadAllConfigurations();
```

### For Users

Users will experience:

- **Faster Loading**: Small configurations load from localStorage
- **Better Image Support**: Large images are stored efficiently
- **No Storage Limits**: Configurations can be much larger
- **Automatic Optimization**: System chooses best storage method

## Migration

### From Old Storage

The system automatically migrates from the old multi-key localStorage format:

1. Detects old storage keys on first load
2. Migrates data to new single-key format
3. Chooses appropriate storage system (localStorage vs IndexedDB)
4. Cleans up old keys after successful migration

### From localStorage to IndexedDB

When a configuration grows large:

1. System detects size increase
2. Automatically moves data to IndexedDB
3. Removes data from localStorage
4. Continues normal operation

## Benefits

### Performance
- Small configurations load instantly from localStorage
- Large configurations are handled efficiently by IndexedDB
- No unnecessary storage overhead

### Reliability
- Multiple fallback mechanisms
- Graceful error handling
- Automatic recovery from storage issues

### Scalability
- No practical limits on configuration size
- Efficient handling of binary data
- Future-proof storage architecture

## Troubleshooting

### Common Issues

1. **Storage Quota Exceeded**
   - System automatically tries to clear space
   - Falls back to localStorage if IndexedDB is full
   - User can manually clear storage from settings

2. **IndexedDB Not Available**
   - Automatically falls back to localStorage
   - No functionality loss
   - User may see storage warnings

3. **Migration Failures**
   - System uses default configuration
   - Old data is preserved for manual recovery
   - Clear error messages guide user

### Debugging

Storage health information is available in the Settings modal:

- Current storage usage
- Storage type being used
- Health status and warnings
- Manual storage management options
