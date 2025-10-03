# SpotGPT TypeScript Client Usage Examples

The SpotGPT TypeScript client provides a comprehensive interface for interacting with the SpotGPT API, equivalent to the Python client.

## Basic Usage

```typescript
import { SpotGPTClient, getSpotGPTClient } from './services/spotgptService';

// Method 1: Direct instantiation
const client = new SpotGPTClient('your-api-key-here');

// Method 2: Using the factory function
const client = getSpotGPTClient('your-api-key-here');

// Method 3: Using environment variable
const client = getSpotGPTClient(); // Uses SPOTGPT_API_KEY env var
```

## Chat Session Management

```typescript
// Create a new chat session
const sessionId = await client.createChatSession(0, "My chat session");

// Get current session ID
const currentSessionId = client.getSessionId();

// Set session ID (for resuming existing sessions)
client.setSessionId('existing-session-id');

// Reset session (create new one)
const newSessionId = await client.resetSession();
```

## Sending Messages

```typescript
// Simple chat (auto-creates session if needed)
const response = await client.chat("Hello, how are you?");

// Chat with knowledge base bypass
const response = await client.chat("Hello, how are you?", true);

// Advanced message sending with options
const response = await client.sendMessage("What are the top products by sales?", {
  alternate_assistant_id: 0, // Use knowledge base
  retrieval_options: {
    run_search: "auto",
    real_time: true,
    filters: {
      tags: ["sales", "products"]
    }
  },
  llm_override: {
    model_provider: "openai",
    model_version: "gpt-4o"
  }
});
```

## Question Classification

```typescript
import { classifyQuestion } from './services/spotgptService';

const classification = await classifyQuestion(
  "What are the top 5 products by sales?",
  [
    { id: "model1", name: "Sales Model", description: "Sales data analysis" },
    { id: "model2", name: "Product Model", description: "Product information" }
  ]
);

console.log(classification);
// {
//   isDataQuestion: true,
//   confidence: 0.95,
//   reasoning: "This question asks for specific data analysis...",
//   suggestedModel: "model1"
// }
```

## General Response Generation

```typescript
import { generateGeneralResponse } from './services/spotgptService';

const response = await generateGeneralResponse("What is machine learning?");
console.log(response.response); // The AI's response
```

## Data Response Generation

```typescript
import { generateDataResponse } from './services/spotgptService';

const dataContext = "Sales data shows Q1 revenue of $1M, Q2 revenue of $1.2M...";
const response = await generateDataResponse(
  "What was the revenue growth from Q1 to Q2?",
  dataContext
);
console.log(response.response); // Analysis based on the data context
```

## Error Handling

```typescript
try {
  const response = await client.chat("Hello");
  console.log(response);
} catch (error) {
  if (error instanceof Error) {
    console.error('SpotGPT Error:', error.message);
  }
}
```

## Testing the API

```typescript
import { testSpotGPTAPI, isSpotGPTAvailable } from './services/spotgptService';

// Check if API key is available
if (isSpotGPTAvailable()) {
  console.log('SpotGPT API key is configured');
  
  // Test the API
  const testResult = await testSpotGPTAPI();
  if (testResult.success) {
    console.log('SpotGPT API is working correctly');
  } else {
    console.error('SpotGPT API test failed:', testResult.error);
  }
} else {
  console.log('SpotGPT API key is not configured');
}
```

## Server-Side API Routes

The client also provides server-side API routes for secure API key handling:

- `POST /api/spotgpt/chat` - Generate general responses
- `POST /api/spotgpt/classify` - Classify questions
- `GET /api/spotgpt/test` - Test API configuration

## Environment Variables

Set the following environment variable:

```bash
SPOTGPT_API_KEY=your-spotgpt-api-key-here
```

## Key Features

- ✅ Full TypeScript support with proper type definitions
- ✅ Session management (create, resume, reset)
- ✅ Streaming response handling
- ✅ Error handling and fallbacks
- ✅ Question classification
- ✅ Knowledge base bypass option
- ✅ Advanced retrieval options
- ✅ LLM model overrides
- ✅ Server-side API routes for secure key handling
- ✅ Comprehensive testing utilities

The TypeScript client provides equivalent functionality to the Python client with full type safety and modern JavaScript features.
