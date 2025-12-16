/**
 * Anthropic Service - TypeScript client for interacting with the Anthropic API
 * Handles authentication and message sending using Claude models.
 */

import Anthropic from "@anthropic-ai/sdk";

// Default Claude model to use across all AI services
export const DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-5-20250929";

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
  public client: Anthropic;
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
      model = DEFAULT_CLAUDE_MODEL,
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
      model: DEFAULT_CLAUDE_MODEL,
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
      model: DEFAULT_CLAUDE_MODEL,
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
      model: DEFAULT_CLAUDE_MODEL,
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
        model: DEFAULT_CLAUDE_MODEL,
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

/**
 * Generates HTML/CSS content for a home page based on a description
 * If no description is provided, creates an analytics-focused home page based on the application name
 * Uses provided colors to match the application styling
 * Optionally accepts an image for visual reference (base64 encoded)
 */
export const generateHomePageContent = async (
  description: string,
  applicationName?: string,
  styleColors?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
  },
  apiKey?: string,
  imageData?: string
): Promise<string> => {
  const client = initializeAnthropic(apiKey);

  // If no description provided, create a default analytics page based on app name
  let effectiveDescription = description;
  if (!description || description.trim() === "") {
    effectiveDescription = `Create an analytics home page for ${
      applicationName || "Business Analytics"
    }. The page should welcome users to the analytics platform and show key metrics or insights relevant to the company type indicated in the name. Include visually appealing data visualization placeholders, modern gradients, and professional styling that reflects the company's industry.`;
  }

  // Build color guidance if colors are provided
  let colorGuidance = "";
  if (styleColors) {
    colorGuidance =
      "\n\nCRITICAL COLOR REQUIREMENTS - YOU MUST USE THESE EXACT COLORS:";
    if (styleColors.primaryColor) {
      colorGuidance += `\n- Primary/Accent Color: ${styleColors.primaryColor} (use for buttons, highlights, and primary accent elements)`;
    }
    if (styleColors.secondaryColor) {
      colorGuidance += `\n- Secondary Color: ${styleColors.secondaryColor} (use for secondary elements and accents)`;
    }
    if (styleColors.backgroundColor) {
      colorGuidance += `\n- Background Color: ${styleColors.backgroundColor} (use for main background)`;
    }
    if (styleColors.textColor) {
      colorGuidance += `\n- Text Color: ${styleColors.textColor} (use for main text)`;
    }
    if (styleColors.accentColor) {
      colorGuidance += `\n- Additional Accent: ${styleColors.accentColor} (use for gradients, emphasis, and visual interest)`;
    }
    colorGuidance +=
      "\n\nThese colors are from the application's main styling and MUST be used to ensure visual consistency. Create gradients using variations of these colors.";
  }

  const promptText = `You are an expert web developer creating an analytics home page. Create a beautiful, modern HTML page with inline CSS based on the following description:

Description: "${effectiveDescription}"
${colorGuidance}

Requirements:
1. Create a complete, self-contained HTML document with inline CSS in a <style> tag
2. Use modern CSS with flexbox or grid for layout
3. Make it responsive and mobile-friendly
4. Use professional typography with modern sans-serif fonts (e.g., -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)
5. Include semantic HTML5 elements
6. NO external dependencies - everything must be inline
7. Make it visually appealing and professional
8. Add appropriate spacing, shadows, and visual hierarchy
9. For analytics pages: Include metric cards, data visualization concepts, or dashboard-style layouts
10. Use gradients and modern card designs${
    styleColors ? " that incorporate the provided colors" : ""
  }
11. The page should reflect the company type/industry based on the application name
12. Create a centered, welcoming layout with clear visual hierarchy
13. ${
    styleColors
      ? "MANDATORY: Use ONLY the provided colors (and their lighter/darker variations) to ensure the page matches the application styling"
      : "Use professional, cohesive colors"
  }
${
  imageData
    ? "\n14. IMPORTANT: Use the provided image as a design reference. Match the layout style, color scheme, and overall aesthetic of the image while creating the HTML/CSS. The goal is to create something that looks similar to the image."
    : ""
}

Return ONLY the HTML code, nothing else. The HTML should be ready to use as-is.`;

  try {
    // Build the message content array
    const messageContent: Array<
      | { type: "text"; text: string }
      | {
          type: "image";
          source: {
            type: "base64";
            media_type: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
            data: string;
          };
        }
    > = [];

    // Add image first if provided
    if (imageData) {
      // Extract the media type and base64 data from the data URL
      const matches = imageData.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mediaType = matches[1] as
          | "image/png"
          | "image/jpeg"
          | "image/webp"
          | "image/gif";
        const base64Data = matches[2];
        messageContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: mediaType,
            data: base64Data,
          },
        });
      }
    }

    // Add the text prompt
    messageContent.push({
      type: "text",
      text: promptText,
    });

    const response = await client.client.messages.create({
      model: DEFAULT_CLAUDE_MODEL,
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: messageContent,
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find((c) => c.type === "text");
    let html = textContent && "text" in textContent ? textContent.text : "";

    // Clean the response to extract just the HTML
    html = html.trim();

    // Remove markdown code blocks if present
    if (html.includes("```html")) {
      html = html.replace(/```html\s*/g, "").replace(/```\s*$/g, "");
    } else if (html.includes("```")) {
      html = html.replace(/```\s*/g, "");
    }

    return html.trim();
  } catch (error) {
    console.error("Error generating home page content:", error);
    throw new Error(
      `Failed to generate home page content: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Generates both application and ThoughtSpot CSS styles based on a style description
 * If no description is provided, creates professional default styles
 * Optionally accepts an image for color extraction (base64 encoded)
 */
export const generateStyleConfiguration = async (
  description: string,
  applicationName?: string,
  apiKey?: string,
  imageData?: string
): Promise<{
  applicationStyles: {
    topBar: { backgroundColor: string; foregroundColor: string };
    sidebar: { backgroundColor: string; foregroundColor: string };
    buttons: {
      primary: {
        backgroundColor: string;
        foregroundColor: string;
        hoverBackgroundColor: string;
      };
      secondary: {
        backgroundColor: string;
        foregroundColor: string;
        hoverBackgroundColor: string;
      };
    };
    backgrounds: {
      mainBackground: string;
      contentBackground: string;
      borderColor: string;
    };
    typography: {
      primaryColor: string;
      secondaryColor: string;
      linkColor: string;
    };
  };
  embeddedContentVariables: Record<string, string>;
}> => {
  const client = initializeAnthropic(apiKey);

  // If no description, create a default based on application name
  let effectiveDescription = description;
  if (!description || description.trim() === "") {
    effectiveDescription = `Create a professional, modern analytics styling for ${
      applicationName || "Business Analytics"
    }. Use contemporary colors that work well for data visualizations. Ensure good contrast and a clean, professional appearance suitable for business intelligence applications.`;
  }

  const promptText = `You are an expert in web application styling and CSS. Based on the following style description, generate a complete styling configuration for BOTH the application UI AND ThoughtSpot embedded content.

Style Description: "${effectiveDescription}"
${
  imageData
    ? "\n\nIMPORTANT: An image has been provided as a visual reference. Extract the color palette from this image and use it to create the styling configuration. Analyze the image's primary colors, accent colors, and overall aesthetic to create a cohesive color scheme."
    : ""
}

YOU MUST generate styling for TWO sections:

1. APPLICATION STYLES (the wrapper application UI):
Generate these required fields:
- topBar: backgroundColor (string), foregroundColor (string)
- sidebar: backgroundColor (string), foregroundColor (string)
- buttons.primary: backgroundColor (string), foregroundColor (string), hoverBackgroundColor (string)
- buttons.secondary: backgroundColor (string), foregroundColor (string), hoverBackgroundColor (string)
- backgrounds: mainBackground (string), contentBackground (string), borderColor (string)
- typography: primaryColor (string), secondaryColor (string), linkColor (string)

2. THOUGHTSPOT EMBEDDED CONTENT CSS VARIABLES (for charts/dashboards):
Generate these required CSS variables with appropriate colors matching the style description.
CRITICAL: Include ALL visualization colors for charts - this is MANDATORY:
- "--ts-var-root-color": Main text color
- "--ts-var-root-background": Main background color
- "--ts-var-root-font-family": Font family (e.g. "Inter, sans-serif")
- "--ts-var-nav-background": Navigation panel background
- "--ts-var-nav-color": Navigation panel text color
- "--ts-var-button--primary-color": Primary button text color
- "--ts-var-button--primary-background": Primary button background (MUST be a vibrant, professional color)
- "--ts-var-button--primary--hover-background": Primary button hover background
- "--ts-var-button--secondary-color": Secondary button text color
- "--ts-var-button--secondary-background": Secondary button background
- "--ts-var-button--secondary--hover-background": Secondary button hover background
- "--ts-var-button-border-radius": Button border radius (e.g. "4px")
- "--ts-var-menu-color": Menu text color
- "--ts-var-menu-background": Menu background
- "--ts-var-menu--hover-background": Menu hover background
- "--ts-var-viz-title-color": Visualization title color
- "--ts-var-viz-description-color": Visualization description color
- "--ts-var-viz-background": Visualization tile background
- "--ts-var-viz-border-radius": Visualization border radius (e.g. "8px")
- "--ts-var-chip-color": Filter chip text color
- "--ts-var-chip-background": Filter chip background
- "--ts-var-chip--hover-background": Filter chip hover background
- "--ts-var-search-bar-text-font-color": Search bar text color
- "--ts-var-search-bar-background": Search bar background
- "--ts-var-dialog-header-background": Dialog header background
- "--ts-var-dialog-header-color": Dialog header text color
- "--ts-var-dialog-body-background": Dialog body background
- "--ts-var-dialog-body-color": Dialog body text color

VISUALIZATION COLORS (MANDATORY - MUST include ALL of these):
- "--ts-var-viz-color-1": First chart color (vibrant, professional)
- "--ts-var-viz-color-2": Second chart color
- "--ts-var-viz-color-3": Third chart color
- "--ts-var-viz-color-4": Fourth chart color
- "--ts-var-viz-color-5": Fifth chart color
- "--ts-var-viz-color-6": Sixth chart color
- "--ts-var-viz-color-7": Seventh chart color
- "--ts-var-viz-color-8": Eighth chart color
- "--ts-var-viz-color-9": Ninth chart color
- "--ts-var-viz-color-10": Tenth chart color

These visualization colors should form a cohesive palette that works well together for data visualizations.

Requirements:
1. ALL colors MUST be valid hex codes (e.g. #1e3a8a, #22c55e, #000000, #ffffff)
2. Ensure good contrast and accessibility
3. Keep colors consistent between application and embedded content
4. Make the styling cohesive and professional
5. Visualization colors MUST form a cohesive, professional palette for data charts
6. Button colors should be vibrant and actionable
${
  imageData
    ? "7. CRITICAL: Extract and use colors from the provided image to create the color palette"
    : ""
}

CRITICAL: You MUST return a JSON object with EXACTLY this structure (all fields are required):
{
  "applicationStyles": {
    "topBar": { "backgroundColor": "#hex", "foregroundColor": "#hex" },
    "sidebar": { "backgroundColor": "#hex", "foregroundColor": "#hex" },
    "buttons": {
      "primary": { "backgroundColor": "#hex", "foregroundColor": "#hex", "hoverBackgroundColor": "#hex" },
      "secondary": { "backgroundColor": "#hex", "foregroundColor": "#hex", "hoverBackgroundColor": "#hex" }
    },
    "backgrounds": { "mainBackground": "#hex", "contentBackground": "#hex", "borderColor": "#hex" },
    "typography": { "primaryColor": "#hex", "secondaryColor": "#hex", "linkColor": "#hex" }
  },
  "embeddedContentVariables": {
    "--ts-var-root-color": "#hex",
    "--ts-var-root-background": "#hex",
    "--ts-var-root-font-family": "string",
    "--ts-var-nav-background": "#hex",
    "--ts-var-nav-color": "#hex",
    "--ts-var-button--primary-color": "#hex",
    "--ts-var-button--primary-background": "#hex",
    "--ts-var-button--primary--hover-background": "#hex",
    "--ts-var-button--secondary-color": "#hex",
    "--ts-var-button--secondary-background": "#hex",
    "--ts-var-button--secondary--hover-background": "#hex",
    "--ts-var-button-border-radius": "4px",
    "--ts-var-menu-color": "#hex",
    "--ts-var-menu-background": "#hex",
    "--ts-var-menu--hover-background": "#hex",
    "--ts-var-viz-title-color": "#hex",
    "--ts-var-viz-description-color": "#hex",
    "--ts-var-viz-background": "#hex",
    "--ts-var-viz-border-radius": "8px",
    "--ts-var-chip-color": "#hex",
    "--ts-var-chip-background": "#hex",
    "--ts-var-chip--hover-background": "#hex",
    "--ts-var-search-bar-text-font-color": "#hex",
    "--ts-var-search-bar-background": "#hex",
    "--ts-var-dialog-header-background": "#hex",
    "--ts-var-dialog-header-color": "#hex",
    "--ts-var-dialog-body-background": "#hex",
    "--ts-var-dialog-body-color": "#hex",
    "--ts-var-viz-color-1": "#hex",
    "--ts-var-viz-color-2": "#hex",
    "--ts-var-viz-color-3": "#hex",
    "--ts-var-viz-color-4": "#hex",
    "--ts-var-viz-color-5": "#hex",
    "--ts-var-viz-color-6": "#hex",
    "--ts-var-viz-color-7": "#hex",
    "--ts-var-viz-color-8": "#hex",
    "--ts-var-viz-color-9": "#hex",
    "--ts-var-viz-color-10": "#hex"
  }
}

Return ONLY the JSON object, no additional text or explanation.`;

  try {
    // Build the message content array
    const messageContent: Array<
      | { type: "text"; text: string }
      | {
          type: "image";
          source: {
            type: "base64";
            media_type: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
            data: string;
          };
        }
    > = [];

    // Add image first if provided
    if (imageData) {
      // Extract the media type and base64 data from the data URL
      const matches = imageData.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mediaType = matches[1] as
          | "image/png"
          | "image/jpeg"
          | "image/webp"
          | "image/gif";
        const base64Data = matches[2];
        messageContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: mediaType,
            data: base64Data,
          },
        });
      }
    }

    // Add the text prompt
    messageContent.push({
      type: "text",
      text: promptText,
    });

    const response = await client.client.messages.create({
      model: DEFAULT_CLAUDE_MODEL,
      max_tokens: 3000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: messageContent,
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find((c) => c.type === "text");
    let jsonStr = textContent && "text" in textContent ? textContent.text : "";

    console.log("Raw Claude response for styles:", jsonStr.substring(0, 500));

    // Clean the response to extract just the JSON
    jsonStr = jsonStr.trim();

    // Remove markdown code blocks if present
    if (jsonStr.includes("```json")) {
      jsonStr = jsonStr.replace(/```json\s*/g, "").replace(/```\s*$/g, "");
    } else if (jsonStr.includes("```")) {
      jsonStr = jsonStr.replace(/```\s*/g, "");
    }

    console.log("Cleaned JSON string:", jsonStr.substring(0, 500));

    // Parse and validate the JSON
    const styleConfig = JSON.parse(jsonStr);

    console.log("Parsed style config structure:", {
      hasApplicationStyles: !!styleConfig.applicationStyles,
      hasEmbeddedContentVariables: !!styleConfig.embeddedContentVariables,
      applicationStylesKeys: styleConfig.applicationStyles
        ? Object.keys(styleConfig.applicationStyles)
        : [],
      embeddedVariablesCount: styleConfig.embeddedContentVariables
        ? Object.keys(styleConfig.embeddedContentVariables).length
        : 0,
    });

    // Validate that we got the proper structure
    if (
      !styleConfig.applicationStyles ||
      !styleConfig.embeddedContentVariables ||
      typeof styleConfig.applicationStyles !== "object" ||
      typeof styleConfig.embeddedContentVariables !== "object"
    ) {
      console.error("Invalid style config structure:", styleConfig);
      throw new Error(
        "Invalid response format - expected applicationStyles and embeddedContentVariables"
      );
    }

    return styleConfig;
  } catch (error) {
    console.error("Error generating style configuration:", error);

    // Return a basic fallback configuration
    console.warn("Using fallback style configuration");
    return {
      applicationStyles: {
        topBar: {
          backgroundColor: "#1e3a8a",
          foregroundColor: "#ffffff",
        },
        sidebar: {
          backgroundColor: "#f3f4f6",
          foregroundColor: "#1f2937",
        },
        buttons: {
          primary: {
            backgroundColor: "#3182ce",
            foregroundColor: "#ffffff",
            hoverBackgroundColor: "#2563eb",
          },
          secondary: {
            backgroundColor: "#e5e7eb",
            foregroundColor: "#1f2937",
            hoverBackgroundColor: "#d1d5db",
          },
        },
        backgrounds: {
          mainBackground: "#ffffff",
          contentBackground: "#f9fafb",
          borderColor: "#e5e7eb",
        },
        typography: {
          primaryColor: "#1f2937",
          secondaryColor: "#6b7280",
          linkColor: "#3182ce",
        },
      },
      embeddedContentVariables: {
        "--ts-var-root-color": "#1f2937",
        "--ts-var-root-background": "#ffffff",
        "--ts-var-root-font-family":
          "Inter, -apple-system, system-ui, sans-serif",
        "--ts-var-nav-background": "#f3f4f6",
        "--ts-var-nav-color": "#1f2937",
        "--ts-var-button--primary-color": "#ffffff",
        "--ts-var-button--primary-background": "#3182ce",
        "--ts-var-button--primary--hover-background": "#2563eb",
        "--ts-var-button--secondary-color": "#1f2937",
        "--ts-var-button--secondary-background": "#e5e7eb",
        "--ts-var-button--secondary--hover-background": "#d1d5db",
        "--ts-var-button-border-radius": "6px",
        "--ts-var-menu-color": "#1f2937",
        "--ts-var-menu-background": "#ffffff",
        "--ts-var-menu--hover-background": "#f3f4f6",
        "--ts-var-viz-title-color": "#1f2937",
        "--ts-var-viz-description-color": "#6b7280",
        "--ts-var-viz-background": "#ffffff",
        "--ts-var-viz-border-radius": "8px",
        "--ts-var-chip-color": "#1f2937",
        "--ts-var-chip-background": "#f3f4f6",
        "--ts-var-chip--hover-background": "#e5e7eb",
        "--ts-var-search-bar-text-font-color": "#1f2937",
        "--ts-var-search-bar-background": "#ffffff",
        "--ts-var-dialog-header-background": "#f9fafb",
        "--ts-var-dialog-header-color": "#1f2937",
        "--ts-var-dialog-body-background": "#ffffff",
        "--ts-var-dialog-body-color": "#1f2937",
        "--ts-var-viz-color-1": "#3182ce",
        "--ts-var-viz-color-2": "#10b981",
        "--ts-var-viz-color-3": "#f59e0b",
        "--ts-var-viz-color-4": "#8b5cf6",
        "--ts-var-viz-color-5": "#ef4444",
        "--ts-var-viz-color-6": "#06b6d4",
        "--ts-var-viz-color-7": "#f97316",
        "--ts-var-viz-color-8": "#ec4899",
        "--ts-var-viz-color-9": "#84cc16",
        "--ts-var-viz-color-10": "#6366f1",
      },
    };
  }
};

// AnthropicClient is already exported above in the class declaration
