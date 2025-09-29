# Vercel Deployment Guide

This guide explains how to properly configure the SPOTGPT_API_KEY environment variable for Vercel deployments.

## Environment Variable Setup

### 1. Local Development

Create a `.env.local` file in your project root:

```bash
# .env.local
SPOTGPT_API_KEY=your_spotgpt_api_key_here
```

### 2. Vercel Deployment

#### Option A: Using Vercel Dashboard (Recommended)

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add a new environment variable:
   - **Name**: `SPOTGPT_API_KEY`
   - **Value**: Your actual SpotGPT API key
   - **Environment**: Select all environments (Production, Preview, Development)
5. Click **Save**
6. Redeploy your application

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Set environment variable
vercel env add SPOTGPT_API_KEY

# Follow the prompts to set the value and select environments
```

#### Option C: Using vercel.json

Create a `vercel.json` file in your project root:

```json
{
  "env": {
    "SPOTGPT_API_KEY": "@spotgpt-api-key"
  }
}
```

Then add the secret using Vercel CLI:
```bash
vercel secrets add spotgpt-api-key your_actual_api_key_here
```

## Testing Your Configuration

### 1. Test Endpoint

Visit `/api/spotgpt/test` in your deployed application to check if the API key is properly configured.

Example: `https://your-app.vercel.app/api/spotgpt/test`

This endpoint will return:
- Whether the API key exists
- Environment information
- Deployment instructions if the key is missing

### 2. Expected Response

**Success Response:**
```json
{
  "apiKeyExists": true,
  "apiKeyLength": 200,
  "apiKeyPrefix": "on_pnlKU",
  "message": "SpotGPT API key is configured",
  "apiTest": {
    "success": true,
    "message": "API connection successful"
  },
  "environment": {
    "nodeEnv": "production",
    "vercelEnv": "production",
    "vercelUrl": "your-app.vercel.app",
    "allEnvVars": ["SPOTGPT_API_KEY"],
    "totalEnvVars": 50
  }
}
```

**Error Response:**
```json
{
  "apiKeyExists": false,
  "apiKeyLength": 0,
  "apiKeyPrefix": "N/A",
  "message": "SpotGPT API key is not configured. Please set SPOTGPT_API_KEY in your Vercel deployment settings.",
  "apiTest": null,
  "environment": {
    "nodeEnv": "production",
    "vercelEnv": "production",
    "vercelUrl": "your-app.vercel.app",
    "allEnvVars": [],
    "totalEnvVars": 50
  },
  "deploymentInstructions": {
    "vercel": "Go to your Vercel dashboard > Project Settings > Environment Variables > Add SPOTGPT_API_KEY",
    "local": "Create a .env.local file with SPOTGPT_API_KEY=your_key_here"
  }
}
```

## Troubleshooting

### Common Issues

1. **API key not found in production**
   - Ensure the environment variable is set for the correct environment (Production, Preview, Development)
   - Redeploy after adding the environment variable
   - Check that the variable name is exactly `SPOTGPT_API_KEY`

2. **API key works locally but not in Vercel**
   - Verify the environment variable is set in Vercel dashboard
   - Check that it's enabled for all environments
   - Ensure there are no extra spaces or characters in the variable value

3. **Build fails due to missing environment variable**
   - The application is designed to handle missing API keys gracefully
   - Check the build logs for any other issues
   - Ensure your API key is valid and has the correct format

### Debug Steps

1. **Check the test endpoint**: Visit `/api/spotgpt/test` to see detailed environment information
2. **Check Vercel logs**: Go to your Vercel dashboard → Functions → View Function Logs
3. **Verify environment variables**: In Vercel dashboard → Settings → Environment Variables
4. **Test locally**: Ensure your `.env.local` file works correctly

## Security Notes

- Never commit your `.env.local` file to version control
- Use Vercel's environment variable system for production secrets
- Consider using Vercel's secret management for sensitive keys
- The API key is only accessible on the server-side (API routes)

## Next.js Configuration

The application is configured to properly handle environment variables in `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  env: {
    SPOTGPT_API_KEY: process.env.SPOTGPT_API_KEY,
  },
};
```

This ensures that the environment variable is available in both client and server contexts as needed.
