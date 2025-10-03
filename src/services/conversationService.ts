import {
  ThoughtSpotContent,
  ThoughtSpotEmbedInstance,
} from "../types/thoughtspot";
import {
  classifyQuestion,
  generateGeneralResponse,
  isSpotGPTAvailable,
  QuestionClassification,
} from "./spotgptClient";

export interface ConversationMessage {
  id: string;
  type: "user" | "bot" | "system";
  content: string;
  timestamp: Date;
  source?: "spotter" | "spotgpt" | "system";
  modelId?: string;
  metadata?: {
    classification?: {
      isDataQuestion: boolean;
      confidence: number;
      reasoning: string;
      suggestedModel?: string;
    };
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
}

export interface ConversationContext {
  messages: ConversationMessage[];
  activeConversations: Map<string, ThoughtSpotEmbedInstance>;
  availableModels: ThoughtSpotContent[];
  selectedModels: string[];
}

export class ConversationManager {
  private context: ConversationContext;
  private onMessageUpdate?: (messages: ConversationMessage[]) => void;
  private activeModelId: string | null = null;

  constructor(
    availableModels: ThoughtSpotContent[],
    selectedModels: string[],
    onMessageUpdate?: (messages: ConversationMessage[]) => void
  ) {
    this.context = {
      messages: [],
      activeConversations: new Map(),
      availableModels,
      selectedModels,
    };
    this.onMessageUpdate = onMessageUpdate;
  }

  /**
   * Add a user message and process it
   */
  async addUserMessage(content: string): Promise<void> {
    const userMessage: ConversationMessage = {
      id: this.generateId(),
      type: "user",
      content,
      timestamp: new Date(),
    };

    this.context.messages.push(userMessage);
    this.notifyUpdate();

    // Process the message
    await this.processMessage(content);
  }

  /**
   * Process a user message and generate appropriate response
   */
  private async processMessage(content: string): Promise<void> {
    console.log("ConversationService - processMessage called with:", content);
    try {
      // Get only the configured models for classification
      const configuredModels = this.context.availableModels.filter((model) =>
        this.context.selectedModels.includes(model.id)
      );

      // Classify the question
      const classification = await classifyQuestion(content, configuredModels);

      console.log(
        "ConversationService - Classification result:",
        classification
      );
      console.log(
        "ConversationService - isDataQuestion:",
        classification.isDataQuestion
      );
      console.log(
        "ConversationService - confidence:",
        classification.confidence
      );
      console.log("ConversationService - reasoning:", classification.reasoning);

      // Add classification metadata to the last user message
      if (this.context.messages.length > 0) {
        const lastMessage =
          this.context.messages[this.context.messages.length - 1];
        if (lastMessage.type === "user") {
          lastMessage.metadata = { classification };
        }
      }

      if (classification.isDataQuestion) {
        console.log("ConversationService - Processing as data question");
        // Double-check if we have configured models before trying to use SpotterAgentEmbed
        if (this.context.selectedModels.length === 0) {
          await this.addSystemMessage(
            "This appears to be a data question, but no models are configured for data analysis. Please configure models in the chatbot settings or ask a general question instead."
          );
          return;
        }

        // Use smart model selection
        const modelToUse = await this.selectBestModel(content, classification);

        if (modelToUse) {
          await this.handleDataQuestion(content, classification, modelToUse);
          return;
        }

        await this.handleDataQuestion(content, classification);
      } else {
        console.log("ConversationService - Processing as general question");
        console.log(
          "ConversationService - About to call handleGeneralQuestion"
        );
        await this.handleGeneralQuestion(content);
        console.log("ConversationService - handleGeneralQuestion completed");
      }
    } catch (error) {
      console.error("Error processing message:", error);
      await this.addSystemMessage(
        `Sorry, I encountered an error processing your question: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Handle data-related questions using SpotterAgentEmbed
   */
  private async handleDataQuestion(
    content: string,
    classification: QuestionClassification,
    preferredModel?: ThoughtSpotContent
  ): Promise<void> {
    const suggestedModelId = classification.suggestedModel;
    const availableModelIds = this.context.selectedModels;

    // Find the best model to use
    let modelToUse: ThoughtSpotContent | null = null;

    // If a preferred model is provided (for follow-up questions), use it
    if (preferredModel && availableModelIds.includes(preferredModel.id)) {
      modelToUse = preferredModel;
      console.log("Using preferred model for follow-up:", preferredModel.name);
    } else if (
      suggestedModelId &&
      availableModelIds.includes(suggestedModelId)
    ) {
      modelToUse =
        this.context.availableModels.find((m) => m.id === suggestedModelId) ||
        null;
    }

    if (!modelToUse && availableModelIds.length > 0) {
      // Use the first available model if no specific suggestion
      modelToUse =
        this.context.availableModels.find(
          (m) => m.id === availableModelIds[0]
        ) || null;
    }

    if (!modelToUse) {
      await this.addSystemMessage(
        "I can help with data questions, but no models are currently selected. Please configure the chatbot with available models in the settings."
      );
      return;
    }

    // Get or create conversation for this model
    let conversation = this.context.activeConversations.get(modelToUse.id);
    if (!conversation) {
      try {
        const { SpotterAgentEmbed } = await import(
          "@thoughtspot/visual-embed-sdk"
        );

        console.log(
          "Creating SpotterAgentEmbed for model:",
          modelToUse.id,
          modelToUse.name
        );

        conversation = new SpotterAgentEmbed({
          worksheetId: modelToUse.id,
        });

        // Test if the conversation object is properly created
        if (!conversation || typeof conversation.sendMessage !== "function") {
          throw new Error("SpotterAgentEmbed was not properly initialized");
        }

        this.context.activeConversations.set(modelToUse.id, conversation);
        console.log(
          "SpotterAgentEmbed created successfully for model:",
          modelToUse.name
        );
      } catch (error) {
        console.error("SpotterAgentEmbed Initialization Error:", {
          modelId: modelToUse.id,
          modelName: modelToUse.name,
          error: error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          errorName: error instanceof Error ? error.name : undefined,
          timestamp: new Date().toISOString(),
          userQuestion: content,
          networkStatus: navigator.onLine ? "online" : "offline",
          userAgent: navigator.userAgent,
          availableModels: this.context.availableModels.length,
          selectedModels: this.context.selectedModels.length,
        });
        await this.addSystemMessage(
          `Failed to initialize conversation with model "${
            modelToUse.name
          }". Error: ${
            error instanceof Error ? error.message : "Unknown error"
          }. Please check if the model is accessible and try again.`
        );
        return;
      }
    }

    // Send message to SpotterAgentEmbed
    try {
      if (!conversation.sendMessage) {
        throw new Error("Send message method not available");
      }

      console.log(
        "About to call SpotterAgentEmbed.sendMessage with content:",
        content
      );
      const response = await conversation.sendMessage(content);

      // Debug logging
      console.log("SpotterAgentEmbed response:", response);
      console.log("Response type:", typeof response);
      console.log("Response is null:", response === null);
      console.log("Response is undefined:", response === undefined);
      console.log(
        "Response keys:",
        response
          ? Object.keys(response)
          : "No keys - response is null/undefined"
      );
      try {
        // Create a safe version of the response for logging (avoid circular references)
        const safeResponse: Record<string, unknown> = {
          container: response.container ? "HTMLDivElement" : null,
          viz: response.viz ? "ConversationMessage" : null,
          error: response.error,
        };

        // Add other properties safely
        Object.keys(response).forEach((key) => {
          if (key !== "container" && key !== "viz" && key !== "error") {
            safeResponse[key] = (response as Record<string, unknown>)[key];
          }
        });
        console.log(
          "Response structure:",
          JSON.stringify(safeResponse, null, 2)
        );
      } catch (jsonError) {
        console.log("Response structure (could not stringify):", {
          container: response.container ? "HTMLDivElement" : null,
          viz: response.viz ? "ConversationMessage" : null,
          error: response.error,
          keys: Object.keys(response),
        });
        console.log("JSON stringify error:", jsonError);
      }

      // Check if response is null or undefined
      if (!response) {
        console.error("SpotterAgentEmbed No Response Error:", {
          modelId: modelToUse.id,
          modelName: modelToUse.name,
          timestamp: new Date().toISOString(),
          userQuestion: content,
          response: response,
          networkStatus: navigator.onLine ? "online" : "offline",
          userAgent: navigator.userAgent,
        });
        await this.addSystemMessage(
          `No response received from ${modelToUse.name}. The model may not be available or there was an issue with the request.`
        );
        return;
      }

      // Check if response has the expected structure
      if (typeof response !== "object") {
        console.error("SpotterAgentEmbed Unexpected Response Format:", {
          modelId: modelToUse.id,
          modelName: modelToUse.name,
          timestamp: new Date().toISOString(),
          userQuestion: content,
          responseType: typeof response,
          response: response,
          networkStatus: navigator.onLine ? "online" : "offline",
          userAgent: navigator.userAgent,
        });
        await this.addSystemMessage(
          `Unexpected response format from ${
            modelToUse.name
          }. Expected an object but got ${typeof response}.`
        );
        return;
      }

      // Check if the response is an error object (has error property but no container/error structure)
      if (response.error && !response.container) {
        // This is likely an error object from SpotterAgentEmbed
        await this.addSystemMessage(
          `Error from ${modelToUse.name}: ${response.error}`
        );
        return;
      }

      // Safely destructure the response
      const container = response.container;
      const error = response.error;

      console.log("Container:", container);
      console.log("Error:", error);
      console.log("Error type:", typeof error);
      console.log("Error is undefined:", error === undefined);
      console.log("Error is null:", error === null);
      console.log("Error is truthy:", !!error);

      if (error) {
        console.error("SpotterAgentEmbed API Error:", {
          modelId: modelToUse.id,
          modelName: modelToUse.name,
          error: error,
          errorType: typeof error,
          timestamp: new Date().toISOString(),
          userQuestion: content,
          response: response,
        });
        await this.addSystemMessage(`Error from ${modelToUse.name}: ${error}`);
      } else if (container) {
        console.log("Handling container case");
        // Create a response message with the container
        const botMessage: ConversationMessage = {
          id: this.generateId(),
          type: "bot",
          content: `Here's the response from ${modelToUse.name}:`,
          timestamp: new Date(),
          source: "spotter",
          modelId: modelToUse.id,
        };

        // Store the container for rendering
        (
          botMessage as ConversationMessage & { container?: HTMLElement }
        ).container = container;
        console.log("Container stored successfully");

        this.context.messages.push(botMessage);
        this.notifyUpdate();
      } else {
        console.log("Handling no container case");
        await this.addSystemMessage(
          `No response received from ${modelToUse.name}.`
        );
      }
    } catch (error) {
      console.error("SpotterAgentEmbed Network/API Error:", {
        modelId: modelToUse.id,
        modelName: modelToUse.name,
        error: error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        errorName: error instanceof Error ? error.name : undefined,
        errorCause: error instanceof Error ? error.cause : undefined,
        timestamp: new Date().toISOString(),
        userQuestion: content,
        conversationId: modelToUse.id,
        networkStatus: navigator.onLine ? "online" : "offline",
        userAgent: navigator.userAgent,
      });
      await this.addSystemMessage(
        `Failed to get response from ${modelToUse.name}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Handle general questions using SpotGPT
   */
  private async handleGeneralQuestion(content: string): Promise<void> {
    console.log(
      "ConversationService - handleGeneralQuestion called with:",
      content
    );

    if (!isSpotGPTAvailable()) {
      console.log("ConversationService - SpotGPT not available");
      await this.addSystemMessage(
        "I can help with general questions, but SpotGPT is not configured. Please set up a SpotGPT API key in the chatbot settings."
      );
      return;
    }

    try {
      console.log("ConversationService - Calling generateGeneralResponse");
      const response = await generateGeneralResponse(content);
      console.log("ConversationService - Received response:", response);

      const botMessage: ConversationMessage = {
        id: this.generateId(),
        type: "bot",
        content: response.content || response.response || "",
        timestamp: new Date(),
        source: "spotgpt",
        metadata: {
          usage: response.usage
            ? {
                prompt_tokens: response.usage.prompt_tokens || 0,
                completion_tokens: response.usage.completion_tokens || 0,
                total_tokens: response.usage.total_tokens || 0,
              }
            : undefined,
        },
      };

      console.log(
        "ConversationService - Adding bot message to context:",
        botMessage.content.substring(0, 100) + "..."
      );
      this.context.messages.push(botMessage);
      console.log(
        "ConversationService - Total messages in context:",
        this.context.messages.length
      );
      this.notifyUpdate();
    } catch (error) {
      console.error("Error generating SpotGPT response:", error);
      await this.addSystemMessage(
        `Failed to generate response: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Add a system message
   */
  private async addSystemMessage(content: string): Promise<void> {
    const systemMessage: ConversationMessage = {
      id: this.generateId(),
      type: "system",
      content,
      timestamp: new Date(),
      source: "system",
    };

    this.context.messages.push(systemMessage);
    this.notifyUpdate();
  }

  /**
   * Get all messages
   */
  getMessages(): ConversationMessage[] {
    return [...this.context.messages];
  }

  /**
   * Clear all messages and conversations
   */
  clearConversation(): void {
    this.context.messages = [];
    this.context.activeConversations.clear();
    this.notifyUpdate();
  }

  /**
   * Update configuration
   */
  updateConfiguration(
    availableModels: ThoughtSpotContent[],
    selectedModels: string[]
  ): void {
    this.context.availableModels = availableModels;
    this.context.selectedModels = selectedModels;
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Notify about message updates
   */
  private notifyUpdate(): void {
    console.log(
      "ConversationService - notifyUpdate called, messages count:",
      this.getMessages().length
    );
    this.onMessageUpdate?.(this.getMessages());
  }

  /**
   * Get the currently active model ID
   */
  getActiveModelId(): string | null {
    return this.activeModelId;
  }

  /**
   * Reset the conversation and clear the active model
   */
  resetConversation(): void {
    this.context.messages = [];
    this.activeModelId = null;
    this.context.activeConversations.clear();
    this.notifyUpdate();
    console.log(
      "ConversationService - Conversation reset, active model cleared"
    );
  }

  /**
   * Smart model selection based on question content and conversation context
   */
  private async selectBestModel(
    question: string,
    classification: QuestionClassification
  ): Promise<ThoughtSpotContent | null> {
    // If we already have an active model, use it for follow-up questions
    if (this.activeModelId) {
      const activeModel = this.context.availableModels.find(
        (m) => m.id === this.activeModelId
      );
      if (activeModel) {
        console.log(
          "ConversationService - Using active model:",
          this.activeModelId
        );
        return activeModel;
      }
    }

    // For new questions, try to select the best model based on content
    console.log(
      "ConversationService - Selecting best model for question:",
      question
    );

    // Get conversation context from recent messages
    const recentMessages = this.context.messages.slice(-3); // Last 3 messages
    const contextText = recentMessages
      .map((msg) => msg.content)
      .join(" ")
      .toLowerCase();

    // Keywords that might indicate which model to use
    const modelKeywords: Record<string, string[]> = {
      // Retail/Apparel keywords
      retail: [
        "product",
        "sales",
        "revenue",
        "customer",
        "order",
        "purchase",
        "apparel",
        "clothing",
        "retail",
      ],
      // Population/Geography keywords
      population: [
        "state",
        "population",
        "city",
        "region",
        "geography",
        "demographics",
        "people",
        "residents",
      ],
      // Diet/Food keywords
      diet: [
        "food",
        "diet",
        "nutrition",
        "eating",
        "meal",
        "season",
        "dietary",
        "consumption",
      ],
    };

    // Score each available model based on question content and context
    let bestModel: ThoughtSpotContent | null = null;
    let bestScore = 0;

    for (const model of this.context.availableModels) {
      let score = 0;

      // Check model name for keywords
      const modelName = model.name.toLowerCase();
      for (const [category, keywords] of Object.entries(modelKeywords)) {
        if (modelName.includes(category)) {
          // Check if question or context contains related keywords
          const questionLower = question.toLowerCase();
          const contextLower = contextText.toLowerCase();

          for (const keyword of keywords) {
            if (
              questionLower.includes(keyword) ||
              contextLower.includes(keyword)
            ) {
              score += 2; // Higher weight for keyword matches
            }
          }
        }
      }

      // Check if classification suggested this specific model
      if (classification.suggestedModel === model.id) {
        score += 5; // High weight for explicit suggestion
      }

      // Check model description for relevant terms
      if (model.description) {
        const descLower = model.description.toLowerCase();
        for (const keywords of Object.values(modelKeywords)) {
          for (const keyword of keywords) {
            if (descLower.includes(keyword)) {
              score += 1;
            }
          }
        }
      }

      console.log(`ConversationService - Model ${model.name} score: ${score}`);

      if (score > bestScore) {
        bestScore = score;
        bestModel = model;
      }
    }

    // If no model scored well, use the first available one
    if (!bestModel && this.context.availableModels.length > 0) {
      bestModel = this.context.availableModels[0];
      console.log(
        "ConversationService - No model scored well, using first available:",
        bestModel.name
      );
    }

    if (bestModel) {
      this.activeModelId = bestModel.id;
      console.log(
        "ConversationService - Selected model:",
        bestModel.name,
        "with score:",
        bestScore
      );
    }

    return bestModel;
  }
}
