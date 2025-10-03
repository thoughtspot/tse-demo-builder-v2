# SpotGPT API Setup

This document explains how to set up the SpotGPT API for the chatbot functionality.

## Environment Variable Setup

1. Create a `.env.local` file in the root of your project (if it doesn't exist)
2. Add your SpotGPT API key:

```bash
SPOTGPT_API_KEY=your_spotgpt_api_key_here
```

**Important**: Make sure to replace `your_spotgpt_api_key_here` with your actual SpotGPT API key.

Example:
```bash
SPOTGPT_API_KEY=sk-1234567890abcdef1234567890abcdef
```

## How It Works

The chatbot now uses a secure server-side approach:

1. **Client-side**: The chatbot UI calls client-side functions in `spotgptClient.ts`
2. **API Routes**: These functions make requests to Next.js API routes:
   - `/api/spotgpt/classify` - For question classification
   - `/api/spotgpt/chat` - For general question responses
3. **Server-side**: The API routes use the environment variable to securely call the SpotGPT service

## Security Benefits

- API keys are never exposed to the client-side code
- Environment variables are only accessible on the server
- All SpotGPT API calls happen server-side

## Fallback Behavior

If the SpotGPT API is not available or configured:
- Question classification falls back to heuristic-based classification
- General questions will show an error message asking to configure the API key
- Data questions will still work with SpotterAgentEmbed

## Testing

1. Make sure your `.env.local` file has the correct API key
2. Restart your Next.js development server: `npm run dev`
3. Open the chatbot and try asking a question
4. Check the browser console for debugging information

## Troubleshooting

### API Key Issues

If you see the error "SpotGPT API key is required":
1. Verify your `.env.local` file exists and has the correct API key
2. Make sure you've restarted the development server after adding the environment variable
3. Check the server console for any API-related errors
4. Verify your SpotGPT API key is valid and has the necessary permissions

### Test API Key Configuration

You can test if your API key is properly configured by visiting:
```
http://localhost:3000/api/spotgpt/test
```

This will show you:
- Whether the API key exists
- The length of the API key
- The first 8 characters (for verification)

### Network Connection Errors

If you see "Network connection error" in the classification results:
1. Check your internet connection
2. Verify the SpotGPT API endpoint is accessible
3. Check if your API key has the correct permissions
4. Look at the server console for detailed error messages

### Debug Information

The system now includes comprehensive debugging:
- **Client-side**: Check browser console for request/response details
- **Server-side**: Check terminal/console for API route logs
- **Classification**: Shows confidence levels and reasoning
- **Model Selection**: Only configured models are used for classification
