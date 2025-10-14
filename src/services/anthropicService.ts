/**
 * Anthropic Service - TypeScript client for interacting with the Anthropic API
 * Handles authentication and message sending using Claude models.
 */

import Anthropic from "@anthropic-ai/sdk";

export interface AnthropicResponse {
  response?: string;
  message?: string;
  content?: string;
  text?: string;
  answer?: string;
  reply?: string;
  raw_response?: string;
  [key: string]: unknown;
}

export interface QuestionClassification {
  isDataQuestion: boolean;
  confidence: number;
  reasoning: string;
  suggestedModel?: string;
}

export interface AnthropicUsage {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
}

export interface AnthropicResponseWithUsage extends AnthropicResponse {
  usage?: AnthropicUsage;
}

export class AnthropicClient {
  private client: Anthropic;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || "";

    // Debug logging
    console.log("Anthropic API Key Debug:", {
      providedApiKey: apiKey ? `${apiKey.substring(0, 8)}...` : "undefined",
      envApiKey: process.env.ANTHROPIC_API_KEY
        ? `${process.env.ANTHROPIC_API_KEY.substring(0, 8)}...`
        : "undefined",
      finalApiKey: this.apiKey
        ? `${this.apiKey.substring(0, 8)}...`
        : "undefined",
      apiKeyLength: this.apiKey.length,
    });

    if (!this.apiKey) {
      throw new Error(
        "API key is required. Provide it directly or set ANTHROPIC_API_KEY environment variable."
      );
    }

    this.client = new Anthropic({
      apiKey: this.apiKey,
    });
  }

  /**
   * Send a message to Claude and get a response
   */
  async sendMessage(
    message: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<AnthropicResponse> {
    const {
      model = "claude-3-5-sonnet-20241022",
      maxTokens = 1000,
      temperature = 0.7,
    } = options;

    try {
      console.log("Anthropic sendMessage Debug:", {
        message: message.substring(0, 100) + "...",
        model,
        maxTokens,
        temperature,
      });

      const response = await this.client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
      });

      console.log("Anthropic sendMessage Response Debug:", {
        status: "success",
        content:
          response.content[0]?.type === "text"
            ? response.content[0].text?.substring(0, 100) + "..."
            : "non-text content",
        usage: response.usage,
      });

      const content =
        response.content[0]?.type === "text"
          ? response.content[0].text || ""
          : "";

      return {
        response: content,
        content: content,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
          total_tokens:
            response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    } catch (error) {
      console.error("Anthropic sendMessage Error:", error);
      throw new Error(
        `Failed to send message: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Convenience method to send a message and return the response text
   */
  async chat(
    message: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<string> {
    const response = await this.sendMessage(message, options);
    return response.response || response.content || "";
  }

  /**
   * Get the API key (for debugging purposes)
   */
  getApiKey(): string {
    return this.apiKey;
  }
}

// Initialize Anthropic client
let anthropicClient: AnthropicClient | null = null;

const initializeAnthropic = (apiKey?: string) => {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      "Anthropic API key is required. Please set ANTHROPIC_API_KEY environment variable or provide it in the configuration."
    );
  }

  // Always create a new client to ensure the correct API key is used
  anthropicClient = new AnthropicClient(key);
  return anthropicClient;
};

/**
 * Get or create an Anthropic client instance
 */
export const getAnthropicClient = (apiKey?: string): AnthropicClient => {
  return initializeAnthropic(apiKey);
};

/**
 * Classifies whether a question is a data question that should be routed to SpotterAgentEmbed
 */
export const classifyQuestion = async (
  question: string,
  availableModels: Array<{ id: string; name: string; description?: string }>,
  apiKey?: string
): Promise<QuestionClassification> => {
  const client = initializeAnthropic(apiKey);

  const modelList = availableModels
    .map(
      (m) => `- ${m.name} (ID: ${m.id}): ${m.description || "No description"}`
    )
    .join("\n");

  const prompt = `You are an AI assistant that classifies user questions to determine if they should be answered by a data analysis system or a general AI assistant.

Available data models:
${modelList}

Classify the following question and respond with a JSON object containing:
- isDataQuestion: boolean (true if the question can be answered by querying data/models)
- confidence: number (0-1, how confident you are in this classification)
- reasoning: string (brief explanation of your decision)
- suggestedModel: string (the ID of the most relevant model if isDataQuestion is true, or null if false)

Question: "${question}"

IMPORTANT: Consider the following when classifying:
1. Questions asking for counts, numbers, quantities, or measurements are typically data questions
2. Follow-up questions like "show me more", "what about...", "also show...", "add...", "include..." are likely data questions if they're asking for additional data analysis
3. Questions with words like "show", "display", "count", "number", "how many", "total", "sum", "average" are often data questions
4. Questions asking for specific data points, metrics, or analysis results are data questions
5. Contextual references like "there", "that place", "those products" in follow-up questions are likely data questions

Examples of data questions:
- "What are the top 5 products by sales?"
- "Show me revenue trends over the last quarter"
- "Which region has the highest customer satisfaction?"
- "Compare sales between Q1 and Q2"
- "Show the number of things as well"
- "How many customers do we have?"
- "What's the total revenue?"
- "Display the average order value"
- "Show me more details"
- "Also include the breakdown by category"
- "What are the top products sold there?" (follow-up to location question)
- "Show me the population of California"
- "What do foxes eat in winter?"

Examples of general questions:
- "What is machine learning?"
- "How do I cook pasta?"
- "What's the weather like?"
- "Explain quantum computing"
- "What are the benefits of exercise?"
- "How does photosynthesis work?"

Respond with only the JSON object, no additional text.`;

  try {
    const response = await client.chat(prompt, {
      model: "claude-3-5-sonnet-20241022",
      maxTokens: 500,
      temperature: 0.1, // Lower temperature for more consistent classification
    });

    console.log("Anthropic classification raw response:", response);
    console.log("Response type:", typeof response);
    console.log("Response length:", response?.length);

    // Parse the JSON response
    let classification: QuestionClassification;
    try {
      // Clean the response to handle markdown formatting
      let cleanedResponse = response.trim();

      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse
          .replace(/^```json\s*/, "")
          .replace(/\s*```$/, "");
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse
          .replace(/^```\s*/, "")
          .replace(/\s*```$/, "");
      }

      console.log("Cleaned response for parsing:", cleanedResponse);
      classification = JSON.parse(cleanedResponse) as QuestionClassification;
      console.log("Parsed classification:", classification);
    } catch (parseError) {
      console.error(
        "Failed to parse classification response as JSON:",
        parseError
      );
      console.error("Raw response that failed to parse:", response);
      throw new Error(
        `Invalid JSON response from Anthropic: ${
          parseError instanceof Error
            ? parseError.message
            : "Unknown parse error"
        }`
      );
    }

    // Validate the response structure
    if (
      typeof classification.isDataQuestion !== "boolean" ||
      typeof classification.confidence !== "number" ||
      typeof classification.reasoning !== "string"
    ) {
      console.error(
        "Invalid classification response structure:",
        classification
      );
      throw new Error("Invalid classification response format");
    }

    return classification;
  } catch (error) {
    console.error("Error classifying question:", error);
    console.error("Full error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      cause: error instanceof Error ? error.cause : undefined,
    });

    // Provide more specific error information
    let errorReason = "API error";
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        errorReason = "Invalid or missing API key";
      } else if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        errorReason = "Network connection error";
      } else if (error.message.includes("rate limit")) {
        errorReason = "Rate limit exceeded";
      } else {
        errorReason = `API error: ${error.message}`;
      }
    }

    // Fallback classification based on simple heuristics
    const lowerQuestion = question.toLowerCase();
    const dataKeywords = [
      "show",
      "what",
      "how many",
      "compare",
      "trend",
      "top",
      "bottom",
      "average",
      "sum",
      "count",
      "sales",
      "revenue",
      "profit",
      "customer",
      "product",
      "region",
      "quarter",
      "year",
      "month",
    ];
    const isDataQuestion = dataKeywords.some((keyword) =>
      lowerQuestion.includes(keyword)
    );

    return {
      isDataQuestion,
      confidence: 0.5,
      reasoning: `Fallback classification due to ${errorReason}`,
      suggestedModel:
        isDataQuestion && availableModels.length > 0
          ? availableModels[0].id
          : undefined,
    };
  }
};

/**
 * Generates a response for general questions using Anthropic
 */
export const generateGeneralResponse = async (
  question: string,
  apiKey?: string
): Promise<AnthropicResponseWithUsage> => {
  const client = initializeAnthropic(apiKey);

  const prompt = `You are a helpful AI assistant. Answer the following question clearly and concisely. 

IMPORTANT FORMATTING INSTRUCTIONS:
- Use numbered lists (1., 2., 3., etc.) for step-by-step instructions or multiple points
- Use bullet points (- or •) for lists of items or features
- Use **bold text** for important terms, headings, or key concepts
- Use *italic text* for emphasis or special terms
- Use \`code\` for technical terms, commands, or specific values
- Break content into clear paragraphs with proper spacing
- Structure your response with clear headings and organization

If the question is about data analysis, business intelligence, or ThoughtSpot, provide helpful information but note that for specific data queries, users should use the data analysis features.

Question: "${question}"`;

  try {
    const response = await client.sendMessage(prompt, {
      model: "claude-3-5-sonnet-20241022",
      maxTokens: 2000,
      temperature: 0.7,
    });

    return {
      response: response.response,
      content: response.content,
      usage: response.usage as AnthropicUsage,
    };
  } catch (error) {
    console.error("Error generating general response:", error);
    throw new Error(
      `Failed to generate response: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Generates a response for data-related questions using Anthropic with context
 */
export const generateDataResponse = async (
  question: string,
  dataContext: string,
  apiKey?: string
): Promise<AnthropicResponseWithUsage> => {
  const client = initializeAnthropic(apiKey);

  const prompt = `You are a data analysis assistant. The user has asked a question about data, and I'm providing you with relevant data context. Please analyze the data and provide a helpful response to their question.

User Question: "${question}"

Data Context:
${dataContext}

Please provide a clear analysis and answer to their question based on the available data. If the data doesn't fully answer their question, explain what insights can be drawn and suggest what additional data might be helpful.`;

  try {
    const response = await client.sendMessage(prompt, {
      model: "claude-3-5-sonnet-20241022",
      maxTokens: 2000,
      temperature: 0.7,
    });

    return {
      response: response.response,
      content: response.content,
      usage: response.usage as AnthropicUsage,
    };
  } catch (error) {
    console.error("Error generating data response:", error);
    throw new Error(
      `Failed to generate data response: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Checks if Anthropic API key is available
 */
export const isAnthropicAvailable = (apiKey?: string): boolean => {
  try {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    return !!key && key.trim().length > 0;
  } catch {
    return false;
  }
};

/**
 * Test the Anthropic API key by making a simple request
 */
export const testAnthropicAPI = async (
  apiKey?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const client = initializeAnthropic(apiKey);

    const response = await client.chat(
      "Hello, this is a test message. Please respond with 'API test successful'.",
      {
        model: "claude-3-5-sonnet-20241022",
        maxTokens: 100,
        temperature: 0.1,
      }
    );

    if (response && response.includes("successful")) {
      return { success: true };
    } else {
      return { success: false, error: "Unexpected response format" };
    }
  } catch (error) {
    console.error("Anthropic API test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// AnthropicClient is already exported above in the class declaration
