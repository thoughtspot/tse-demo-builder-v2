# Configuration Wizard Updates

## Changes Made

### 1. ✅ Centralized Claude Model Configuration

**Problem**: Model name was hardcoded in 7+ different places throughout the codebase.

**Solution**: Created a single constant `DEFAULT_CLAUDE_MODEL` at the top of `anthropicService.ts`:

```typescript
// Default Claude model to use across all AI services
export const DEFAULT_CLAUDE_MODEL = "claude-3-5-sonnet-20240620";
```

**Benefits**:
- Single place to update the model version
- Consistency across all AI features
- Easy to upgrade to newer models (just change one line)

**Functions Updated**:
1. `sendMessage` - Base message sending
2. `classifyQuestion` - Question classification for chatbot
3. `generateGeneralResponse` - General chatbot responses
4. `generateDataResponse` - Data analysis responses
5. `testAnthropicAPI` - API testing
6. `generateHomePageContent` - Wizard home page generation
7. `generateStyleConfiguration` - Wizard style generation

### 2. ✅ Added Search/Filter to Model Selector

**Before**: Plain `<select>` dropdown with no search functionality
```tsx
<select value={modelId} onChange={(e) => setModelId(e.target.value)}>
  <option value="">Select a model (optional)</option>
  {modelOptions.map(model => <option key={model.id}>{model.name}</option>)}
</select>
```

**After**: `SearchableDropdown` component with filtering
```tsx
<SearchableDropdown
  value={modelId}
  onChange={setModelId}
  options={modelOptions}
  placeholder="Select a model (optional)"
  searchPlaceholder="Search models..."
  label="AI Model for Spotter & Search (Optional)"
  disabled={isLoadingModels}
/>
```

**Benefits**:
- Users can type to filter/search models
- Better UX for long lists of models
- Consistent with Search Configuration UI
- Same component used throughout the app

### 3. ✅ Fixed Spotter Icon

**Before**: Used generic `search` icon
```tsx
{ id: "spotter", name: "Spotter", icon: "search" }
```

**After**: Uses proper `spotter` icon
```tsx
{ id: "spotter", name: "Spotter", icon: "spotter" }
```

**Icon Verification**: 
- The `spotter` icon exists in `MaterialIcon.tsx` (line 212)
- Maps to Material-UI's `Search` icon with proper context

## Files Modified

1. **`src/services/anthropicService.ts`**
   - Added `DEFAULT_CLAUDE_MODEL` constant
   - Updated 7 function calls to use the constant

2. **`src/components/ConfigurationWizard.tsx`**
   - Added `SearchableDropdown` import
   - Replaced `<select>` with `SearchableDropdown`
   - Fixed Spotter icon from `search` to `spotter`

## How to Change the Claude Model

To use a different Claude model (e.g., when Claude 4 is released):

1. Open `src/services/anthropicService.ts`
2. Change line 9:
   ```typescript
   export const DEFAULT_CLAUDE_MODEL = "claude-3-5-sonnet-20240620";
   ```
   to:
   ```typescript
   export const DEFAULT_CLAUDE_MODEL = "claude-4-sonnet-latest"; // or whatever the new model name is
   ```
3. That's it! All 7 functions will now use the new model.

## Available Claude Models

As of the latest Anthropic API:
- `claude-3-5-sonnet-20240620` - Current production model (recommended)
- `claude-3-opus-20240229` - Most capable Claude 3 model
- `claude-3-sonnet-20240229` - Balanced performance/cost
- `claude-3-haiku-20240307` - Fastest, cheapest option

Check [Anthropic's documentation](https://docs.anthropic.com/claude/docs/models-overview) for the latest model names.

## Testing the Changes

### Test Model Constant
1. Visit `/api/anthropic/test` - Should show successful API connection
2. All features using AI should work normally

### Test Search/Filter in Wizard
1. Open Settings → Configuration → Configuration Wizard
2. Click on the "AI Model for Spotter & Search" dropdown
3. Try typing to search/filter models
4. Should see filtered results as you type

### Test Spotter Icon
1. Open the Configuration Wizard
2. Look at the "Standard Menus" section
3. The Spotter menu should show the correct icon (not just a search magnifying glass)

## Troubleshooting

### If AI generation fails after model change

**Error**: `model: your-model-name not found`

**Solution**: 
1. Check that the model name in `DEFAULT_CLAUDE_MODEL` is correct
2. Verify the model exists in [Anthropic's model list](https://docs.anthropic.com/claude/docs/models-overview)
3. Check your API key has access to that model
4. Try the test endpoint: `/api/anthropic/test`

### If SearchableDropdown doesn't appear

**Error**: Module not found or component not rendering

**Solution**:
1. Verify `SearchableDropdown.tsx` exists in `src/components/`
2. Check that it's properly exported
3. Restart your dev server: `npm run dev`

## Future Improvements

Potential enhancements for future versions:

1. **Model Selection UI**:
   - Add model descriptions/tooltips in the dropdown
   - Show model capabilities (speed, cost, context window)
   - Display recommended models for different use cases

2. **Dynamic Model List**:
   - Fetch available models from Anthropic API
   - Show only models the user has access to
   - Auto-update when new models are released

3. **Model-specific Settings**:
   - Different default models for different features
   - Per-feature model override in settings
   - Cost estimation based on selected model

4. **Performance Monitoring**:
   - Track token usage per model
   - Show cost estimates
   - Performance metrics (response time, quality)

