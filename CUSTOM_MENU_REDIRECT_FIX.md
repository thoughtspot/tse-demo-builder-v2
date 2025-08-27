# Custom Menu Redirect Fix

## Problem
When loading a new configuration while on a custom menu page, the application would show an error because the custom menu might not exist in the new configuration. This created a poor user experience.

## Solution
Implemented automatic redirection from custom menu pages to the first available standard menu when loading a new configuration.

## Implementation Details

### 1. Helper Function
Created `redirectFromCustomMenu()` in `src/services/configurationService.ts`:

```typescript
export const redirectFromCustomMenu = (standardMenus: StandardMenu[]): void => {
  const currentPath = window.location.pathname;
  const isOnCustomMenu = currentPath.startsWith('/custom/');
  
  if (isOnCustomMenu) {
    // Find the first available standard menu to redirect to
    const firstStandardMenu = standardMenus.find(menu => menu.enabled);
    if (firstStandardMenu) {
      const routeMap: { [key: string]: string } = {
        home: "/",
        favorites: "/favorites",
        "my-reports": "/my-reports",
        spotter: "/spotter",
        search: "/search",
        "full-app": "/full-app",
      };
      
      const redirectRoute = routeMap[firstStandardMenu.id] || "/";
      console.log(`Redirecting from custom menu to: ${redirectRoute}`);
      
      // Redirect to the first available standard menu
      window.location.href = redirectRoute;
    } else {
      // Fallback to home if no standard menus are available
      window.location.href = "/";
    }
  }
};
```

### 2. Integration Points

#### A. Simplified Configuration Loading
Updated `loadConfigurationSimplified()` in `src/services/configurationService.ts`:
- Checks if current page is a custom menu route
- If yes, redirects to first available standard menu
- If no, performs normal page reload

#### B. Synchronous Configuration Loading
Updated `loadConfigurationSynchronously()` in `src/components/Layout.tsx`:
- Added call to `redirectFromCustomMenu()` after configuration is loaded
- Ensures consistent behavior across both loading methods

### 3. Behavior

1. **On Custom Menu Page**: When loading a new configuration, automatically redirects to the first enabled standard menu (usually Home)
2. **On Standard Menu Page**: Normal page reload behavior is maintained
3. **Fallback**: If no standard menus are enabled, redirects to home page
4. **Logging**: Console logs the redirect action for debugging

### 4. Route Mapping
The following standard menu IDs are mapped to their corresponding routes:
- `home` → `/`
- `favorites` → `/favorites`
- `my-reports` → `/my-reports`
- `spotter` → `/spotter`
- `search` → `/search`
- `full-app` → `/full-app`

## Testing
The fix handles the following scenarios:
- ✅ Loading configuration while on custom menu page
- ✅ Loading configuration while on standard menu page
- ✅ No enabled standard menus (fallback to home)
- ✅ Empty standard menus array
- ✅ First enabled menu is home

## Files Modified
1. `src/services/configurationService.ts` - Added helper function and updated `loadConfigurationSimplified()`
2. `src/components/Layout.tsx` - Updated `loadConfigurationSynchronously()` and added import

## Impact
- Eliminates the "Custom Menu Not Found" error when loading configurations
- Improves user experience by automatically navigating to a valid page
- Maintains backward compatibility with existing functionality
- Provides consistent behavior across all configuration loading methods
