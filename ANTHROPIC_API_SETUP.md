# Anthropic API Setup for Configuration Wizard

The Configuration Wizard uses AI to generate home page content and styling. To use these features, you need to configure an Anthropic API key.

## Quick Setup

### For Local Development

1. Create a `.env.local` file in the root of your project:
```bash
touch .env.local
```

2. Add your Anthropic API key to the file:
```
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

3. Restart your development server:
```bash
npm run dev
```

### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Click on **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: Your Anthropic API key (starts with `sk-ant-api03-`)
   - **Environments**: Select all (Production, Preview, Development)
4. Click **Save**
5. Redeploy your application

## Getting an Anthropic API Key

If you don't have an Anthropic API key:

1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to **API Keys** in the dashboard
4. Click **Create Key**
5. Copy the key (it starts with `sk-ant-api03-`)
6. Store it securely - you won't be able to see it again!

## Testing the Configuration

### Method 1: Use the Test API Endpoint

Visit the test endpoint in your browser:
```
http://localhost:3000/api/anthropic/test
```

This will show you:
- Whether the API key is configured
- The length of the key
- Test API call results
- Environment debugging information

### Method 2: Try the Configuration Wizard

1. Open your app and go to **Settings** (gear icon)
2. Navigate to **Configuration** → **General Configuration**
3. Click **Configuration Wizard**
4. Fill in the form including home page or style descriptions
5. Click **Create Configuration**
6. Watch the browser console for AI generation logs

## Troubleshooting

### Error: "Anthropic API key is not configured"

**Cause**: The `ANTHROPIC_API_KEY` environment variable is not set or not accessible.

**Solutions**:
1. Check that you created `.env.local` (for local dev) or set the environment variable in Vercel
2. Make sure the file is named exactly `.env.local` (not `.env` or `.env.development`)
3. Restart your development server after creating/editing `.env.local`
4. For Vercel, make sure you selected the correct environments and redeployed

### Error: "Failed to generate home page/style"

**Possible causes**:
1. **Invalid API Key**: Check that your key is correct and active
2. **Rate Limits**: You may have exceeded your API usage limits
3. **Network Issues**: Check your internet connection
4. **API Errors**: The Anthropic API may be experiencing issues

**Check the browser console** for detailed error messages.

### API Key Not Working After Setup

1. **For local development**:
   ```bash
   # Verify the file exists
   cat .env.local
   
   # Should show:
   # ANTHROPIC_API_KEY=sk-ant-api03-...
   
   # Restart the dev server
   npm run dev
   ```

2. **For Vercel**:
   - Check that the environment variable is set in **all environments**
   - Try redeploying: `vercel --prod` or use the Vercel dashboard
   - Check deployment logs for any errors

### Wizard Completes Quickly Without AI Generation

This means the API calls are failing. Common causes:

1. **API key not configured** - See setup instructions above
2. **No descriptions provided** - AI generation only runs if you enter text in the description fields
3. **API errors** - Check browser console for error messages

## How It Works

When you use the Configuration Wizard:

1. **Client-side (Browser)**:
   - Wizard collects your inputs
   - Sends descriptions to API routes

2. **Server-side API Routes**:
   - `/api/anthropic/generate-home-page` - Generates HTML/CSS from description
   - `/api/anthropic/generate-style` - Generates ThoughtSpot CSS variables from style description
   - These routes have access to environment variables (including the API key)
   - They call the Anthropic Claude API
   - Return generated content to the browser

3. **Configuration Creation**:
   - Browser receives generated content
   - Creates new configuration with your settings + AI-generated content
   - Saves to local storage
   - Reloads the page

## Security Best Practices

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Never share your API key** publicly
3. **Use separate keys** for development and production (optional but recommended)
4. **Rotate keys regularly** if they're exposed
5. **Monitor usage** in your Anthropic console to detect unexpected usage

## API Usage and Costs

The Configuration Wizard makes the following API calls:

- **Home Page Generation**: ~1,000-4,000 tokens per generation
- **Style Generation**: ~500-2,000 tokens per generation

Typical costs (as of 2024):
- Claude 3.5 Sonnet: ~$3 per million input tokens, ~$15 per million output tokens
- Each wizard use: ~$0.05-0.15 depending on description length and output

**Tip**: Keep descriptions concise to reduce costs while still getting good results.

## Support

If you continue to have issues:

1. Check the browser console for detailed error messages
2. Visit `/api/anthropic/test` to see diagnostic information
3. Verify your API key works directly with Anthropic's API
4. Check [Anthropic's status page](https://status.anthropic.com/) for service issues

## Alternative: Skip AI Generation

If you don't want to use AI generation:

1. **Leave the description fields empty** in the wizard
2. The wizard will still work and create a configuration
3. You'll get default home page and styles
4. You can manually edit these later in the Settings modal

