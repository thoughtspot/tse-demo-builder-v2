/**
 * SpotGPT Service - TypeScript client for interacting with the SpotGPT API
 * Handles authentication, chat session creation, and message sending.
 */

export interface SpotGPTResponse {
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

export interface SpotGPTUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface SpotGPTResponseWithUsage extends SpotGPTResponse {
  usage?: SpotGPTUsage;
}

export interface RetrievalOptions {
  run_search?: "auto" | "always" | "never";
  real_time?: boolean;
  filters?: {
    source_type?: string[];
    document_set?: string;
    time_cutoff?: string;
    tags?: string[];
  };
}

export interface LLMOverride {
  model_provider?: string;
  model_version?: string;
}

export interface SendMessageOptions {
  chat_session_id?: string;
  alternate_assistant_id?: number;
  parent_message_id?: string;
  prompt_id?: number;
  search_doc_ids?: string[];
  file_descriptors?: unknown[];
  regenerate?: boolean;
  retrieval_options?: RetrievalOptions;
  prompt_override?: string;
  llm_override?: LLMOverride;
  use_agentic_search?: boolean;
}

export class SpotGPTClient {
  private apiKey: string;
  private baseUrl: string;
  private headers: Record<string, string>;
  private sessionId: string | null = null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SPOTGPT_API_KEY || "";

    // Debug logging
    console.log("SpotGPT API Key Debug:", {
      providedApiKey: apiKey ? `${apiKey.substring(0, 8)}...` : "undefined",
      envApiKey: process.env.SPOTGPT_API_KEY
        ? `${process.env.SPOTGPT_API_KEY.substring(0, 8)}...`
        : "undefined",
      finalApiKey: this.apiKey
        ? `${this.apiKey.substring(0, 8)}...`
        : "undefined",
      apiKeyLength: this.apiKey.length,
    });

    if (!this.apiKey) {
      throw new Error(
        "API key is required. Provide it directly or set SPOTGPT_API_KEY environment variable."
      );
    }

    this.baseUrl = "https://spotgpt.thoughtspot.dev/api/chat";
    this.headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  /**
   * Create a new chat session
   */
  async createChatSession(
    personaId: number = 0,
    description?: string
  ): Promise<string> {
    const url = `${this.baseUrl}/create-chat-session`;
    const payload = {
      persona_id: personaId,
      description: description,
    };

    try {
      console.log("SpotGPT createChatSession Debug:", {
        url,
        headers: {
          ...this.headers,
          Authorization: `${this.apiKey.substring(0, 8)}...`,
        },
        payload,
      });

      const response = await fetch(url, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(payload),
      });

      console.log("SpotGPT createChatSession Response Debug:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("SpotGPT createChatSession Error Response:", errorText);
        throw new Error(
          `Failed to create chat session: HTTP ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      this.sessionId = data.chat_session_id;

      if (!this.sessionId) {
        throw new Error("Failed to get chat session ID from response");
      }

      return this.sessionId;
    } catch (error) {
      throw new Error(
        `Failed to create chat session: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Send a message to the chat session
   */
  async sendMessage(
    message: string,
    options: SendMessageOptions = {}
  ): Promise<SpotGPTResponse> {
    const {
      chat_session_id,
      alternate_assistant_id = 0,
      parent_message_id,
      prompt_id = 0,
      search_doc_ids,
      file_descriptors = [],
      regenerate = false,
      retrieval_options = {
        run_search: "auto",
        real_time: true,
        filters: {
          tags: [],
        },
      },
      prompt_override,
      llm_override = {
        model_provider: "openai",
        model_version: "gpt-4o",
      },
      use_agentic_search = false,
    } = options;

    if (!chat_session_id && !this.sessionId) {
      throw new Error("No chat session available. Create a session first.");
    }

    const sessionId = chat_session_id || this.sessionId!;
    const url = `${this.baseUrl}/send-message`;

    const payload = {
      alternate_assistant_id,
      chat_session_id: sessionId,
      parent_message_id: parent_message_id || null,
      message,
      prompt_id,
      search_doc_ids: search_doc_ids || [],
      file_descriptors,
      regenerate,
      retrieval_options,
      prompt_override,
      llm_override,
      use_agentic_search,
    };

    try {
      console.log("SpotGPT sendMessage Debug:", {
        url,
        headers: {
          ...this.headers,
          Authorization: `${this.apiKey.substring(0, 8)}...`,
        },
        payload,
      });

      const response = await fetch(url, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(payload),
      });

      console.log("SpotGPT sendMessage Response Debug:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("SpotGPT sendMessage Error Response:", errorText);
        console.error("SpotGPT Error Response Details:", {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText,
        });
        throw new Error(
          `Failed to send message: HTTP ${response.status} - ${errorText}`
        );
      }

      const responseText = await response.text();
      const trimmedText = responseText.trim();

      // Try to parse as single JSON first
      try {
        return JSON.parse(trimmedText);
      } catch {
        // Handle streaming response (multiple JSON objects on separate lines)
        if (trimmedText) {
          const lines = trimmedText.split("\n");
          let finalAnswer = "";
          const answerPieces: string[] = [];

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            try {
              const jsonObj = JSON.parse(trimmedLine);

              // Look for answer pieces
              if (jsonObj.answer_piece) {
                const piece = jsonObj.answer_piece;
                if (piece) {
                  answerPieces.push(piece);
                }
              }

              // Look for complete answer
              if (jsonObj.answer) {
                finalAnswer = jsonObj.answer;
              }

              // Look for response field
              if (jsonObj.response) {
                finalAnswer = jsonObj.response;
              }
            } catch {
              continue;
            }
          }

          // Return the complete answer
          if (finalAnswer) {
            return { response: finalAnswer };
          } else if (answerPieces.length > 0) {
            return { response: answerPieces.join("") };
          } else {
            // Return the raw response if we can't parse it
            return { response: trimmedText };
          }
        }

        // Fallback
        return { response: "No response received" };
      }
    } catch (error) {
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
    bypassKnowledgeBase: boolean = false
  ): Promise<string> {
    // Create session if we don't have one
    if (!this.sessionId) {
      await this.createChatSession();
    }

    // Set alternate_assistant_id to -1 to bypass knowledge base if requested
    const alternateAssistantId = bypassKnowledgeBase ? -1 : 0;

    const response = await this.sendMessage(message, {
      alternate_assistant_id: alternateAssistantId,
    });

    // Extract the response text from the API response
    if (response.response) {
      return response.response;
    } else if (response.message) {
      return response.message;
    } else if (response.content) {
      return response.content;
    } else if (response.text) {
      return response.text;
    } else if (response.answer) {
      return response.answer;
    } else if (response.reply) {
      return response.reply;
    } else {
      // If we can't find the response text, return the full response
      return JSON.stringify(response, null, 2);
    }
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Set the session ID (useful for resuming existing sessions)
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  /**
   * Reset the session (create a new one)
   */
  async resetSession(): Promise<string> {
    this.sessionId = null;
    return await this.createChatSession();
  }
}

// Initialize SpotGPT client
let spotgptClient: SpotGPTClient | null = null;

const initializeSpotGPT = (apiKey?: string) => {
  const key = apiKey || process.env.SPOTGPT_API_KEY;
  if (!key) {
    throw new Error(
      "SpotGPT API key is required. Please set SPOTGPT_API_KEY environment variable or provide it in the configuration."
    );
  }

  // Always create a new client to ensure the correct API key is used
  spotgptClient = new SpotGPTClient(key);
  return spotgptClient;
};

/**
 * Get or create a SpotGPT client instance
 */
export const getSpotGPTClient = (apiKey?: string): SpotGPTClient => {
  return initializeSpotGPT(apiKey);
};

/**
 * Classifies whether a question is a data question that should be routed to SpotterAgentEmbed
 */
export const classifyQuestion = async (
  question: string,
  availableModels: Array<{ id: string; name: string; description?: string }>,
  apiKey?: string
): Promise<QuestionClassification> => {
  const client = initializeSpotGPT(apiKey);

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
    const response = await client.chat(prompt, true); // Bypass knowledge base for classification

    console.log("SpotGPT classification raw response:", response);
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
        `Invalid JSON response from SpotGPT: ${
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
 * Generates a response for general questions using SpotGPT
 */
export const generateGeneralResponse = async (
  question: string,
  apiKey?: string
): Promise<SpotGPTResponseWithUsage> => {
  const client = initializeSpotGPT(apiKey);

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
    const response = await client.chat(prompt, true); // Bypass knowledge base for general questions

    return {
      response,
      content: response, // For compatibility with existing code
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
 * Generates a response for data-related questions using SpotGPT with context
 */
export const generateDataResponse = async (
  question: string,
  dataContext: string,
  apiKey?: string
): Promise<SpotGPTResponseWithUsage> => {
  const client = initializeSpotGPT(apiKey);

  const prompt = `You are a data analysis assistant. The user has asked a question about data, and I'm providing you with relevant data context. Please analyze the data and provide a helpful response to their question.

User Question: "${question}"

Data Context:
${dataContext}

Please provide a clear analysis and answer to their question based on the available data. If the data doesn't fully answer their question, explain what insights can be drawn and suggest what additional data might be helpful.`;

  try {
    const response = await client.chat(prompt, true); // Bypass knowledge base for data analysis

    return {
      response,
      content: response, // For compatibility with existing code
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
 * Checks if SpotGPT API key is available
 */
export const isSpotGPTAvailable = (apiKey?: string): boolean => {
  try {
    const key = apiKey || process.env.SPOTGPT_API_KEY;
    return !!key && key.trim().length > 0;
  } catch {
    return false;
  }
};

/**
 * Test the SpotGPT API key by making a simple request
 */
export const testSpotGPTAPI = async (
  apiKey?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const client = initializeSpotGPT(apiKey);

    const response = await client.chat(
      "Hello, this is a test message. Please respond with 'API test successful'.",
      true
    );

    if (response && response.includes("successful")) {
      return { success: true };
    } else {
      return { success: false, error: "Unexpected response format" };
    }
  } catch (error) {
    console.error("SpotGPT API test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// SpotGPTClient is already exported above in the class declaration
