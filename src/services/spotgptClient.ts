/**
 * Client-side functions for interacting with SpotGPT API routes
 * These functions call server-side API routes to securely handle API keys
 *
 * For direct API usage, use the SpotGPTClient class from spotgptService.ts
 */

export interface QuestionClassification {
  isDataQuestion: boolean;
  confidence: number;
  reasoning: string;
  suggestedModel?: string;
}

export interface SpotGPTResponse {
  response?: string;
  content?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Classifies whether a question is a data question using the server-side API
 */
export const classifyQuestion = async (
  question: string,
  availableModels: Array<{ id: string; name: string; description?: string }>
): Promise<QuestionClassification> => {
  try {
    console.log("Classifying question:", question);
    console.log("Available models:", availableModels);

    const response = await fetch("/api/spotgpt/classify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        availableModels,
      }),
    });

    console.log("Classification response status:", response.status);
    console.log(
      "Classification response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Classification error response:", errorData);
      console.error("Full error response:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorData,
      });
      throw new Error(errorData.error || "Failed to classify question");
    }

    const classification = await response.json();
    console.log("Classification result:", classification);
    return classification;
  } catch (error) {
    console.error("Error classifying question:", error);

    // Fallback classification based on simple heuristics
    const lowerQuestion = question.toLowerCase();

    // More specific data-related keywords and patterns
    const dataKeywords = [
      "show me",
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
      "chart",
      "graph",
      "table",
      "data",
      "analysis",
      "report",
      "metrics",
      "kpi",
      "dashboard",
    ];

    // Business/data context keywords
    const businessKeywords = [
      "sales",
      "revenue",
      "profit",
      "customer",
      "product",
      "region",
      "quarter",
      "year",
      "month",
      "performance",
      "growth",
      "decline",
      "increase",
      "decrease",
    ];

    // Check for data-specific patterns
    const hasDataKeywords = dataKeywords.some((keyword) =>
      lowerQuestion.includes(keyword)
    );

    const hasBusinessKeywords = businessKeywords.some((keyword) =>
      lowerQuestion.includes(keyword)
    );

    // More conservative classification - only classify as data question if it has clear data/business context
    const isDataQuestion =
      hasDataKeywords ||
      (hasBusinessKeywords && lowerQuestion.includes("what"));

    console.log("Fallback classification details:", {
      question: lowerQuestion,
      hasDataKeywords,
      hasBusinessKeywords,
      isDataQuestion,
      availableModelsCount: availableModels.length,
    });

    return {
      isDataQuestion,
      confidence: 0.5,
      reasoning: `Fallback classification due to API error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      suggestedModel:
        isDataQuestion && availableModels.length > 0
          ? availableModels[0].id
          : undefined,
    };
  }
};

/**
 * Generates a response for general questions using the server-side API
 */
export const generateGeneralResponse = async (
  question: string
): Promise<SpotGPTResponse> => {
  try {
    console.log("Generating general response for:", question);

    const response = await fetch("/api/spotgpt/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
      }),
    });

    console.log("General response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("General response error:", errorData);
      throw new Error(errorData.error || "Failed to generate response");
    }

    const result = await response.json();
    console.log("General response result:", result);
    return result;
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
 * Checks if SpotGPT is available (always returns true since we have fallback)
 */
export const isSpotGPTAvailable = (): boolean => {
  return true; // We always have fallback classification
};
