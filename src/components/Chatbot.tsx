"use client";

import { useState, useRef, useEffect } from "react";
import { fetchModels } from "../services/thoughtspotApi";
import { ThoughtSpotContent } from "../types/thoughtspot";
import { useAppContext } from "./Layout";
import {
  ConversationManager,
  ConversationMessage,
} from "../services/conversationService";
import FormattedMessage from "./FormattedMessage";

interface Message {
  id: string;
  type: "user" | "bot" | "system";
  content: string;
  timestamp: Date;
  source?: "spotter" | "anthropic" | "system";
  modelId?: string;
  container?: HTMLElement;
  metadata?: {
    classification?: {
      isDataQuestion: boolean;
      confidence: number;
      reasoning: string;
      suggestedModel?: string;
    };
    usage?: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
    };
  };
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Chatbot({ isOpen, onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"initial" | "chat">("initial");
  const [filteredModels, setFilteredModels] = useState<ThoughtSpotContent[]>(
    []
  );
  const [hoveredModel, setHoveredModel] = useState<ThoughtSpotContent | null>(
    null
  );
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [conversationManager, setConversationManager] =
    useState<ConversationManager | null>(null);
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const context = useAppContext();

  // Convert ConversationMessage to Message
  const convertConversationMessage = (
    convMsg: ConversationMessage
  ): Message => {
    return {
      id: convMsg.id,
      type: convMsg.type,
      content: convMsg.content,
      timestamp: convMsg.timestamp,
      source: convMsg.source,
      modelId: convMsg.modelId,
      metadata: convMsg.metadata,
      container: (convMsg as ConversationMessage & { container?: HTMLElement })
        .container,
    };
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    // Use a consistent timeout for all message types
    const timeoutId = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Track active model from conversation manager
  useEffect(() => {
    if (conversationManager) {
      const currentActiveModel = conversationManager.getActiveModelId();
      setActiveModelId(currentActiveModel);
    }
  }, [conversationManager, messages]);

  // Handle containers from SpotterAgentEmbed responses
  useEffect(() => {
    console.log(
      "Chatbot - Checking for containers in messages:",
      messages.length
    );
    const messagesWithContainers = messages.filter((msg) => msg.container);
    console.log(
      "Chatbot - Messages with containers:",
      messagesWithContainers.length
    );

    if (messagesWithContainers.length > 0) {
      const lastMessageWithContainer =
        messagesWithContainers[messagesWithContainers.length - 1];
      console.log(
        "Chatbot - Last message with container:",
        lastMessageWithContainer
      );

      // Check if this container has already been rendered
      const existingContainer = document.querySelector(
        `[data-spotter-container][data-message-id="${lastMessageWithContainer.id}"]`
      );

      if (existingContainer) {
        console.log("Chatbot - Container already exists, skipping");
        return;
      }

      if (lastMessageWithContainer.container) {
        try {
          console.log(
            "Chatbot - Rendering container for message:",
            lastMessageWithContainer.id
          );
          // Create a container for the response
          const responseContainer = document.createElement("div");
          responseContainer.style.marginTop = "0px";
          responseContainer.style.marginBottom = "0px";
          responseContainer.style.width = "100%";
          responseContainer.style.minHeight = "500px";
          responseContainer.style.height = "500px";
          responseContainer.style.display = "flex";
          responseContainer.style.flexDirection = "column";
          responseContainer.appendChild(lastMessageWithContainer.container);
          console.log("Chatbot - Container appended to responseContainer");

          // Ensure the container takes appropriate height
          if (lastMessageWithContainer.container.style) {
            lastMessageWithContainer.container.style.width = "100%";
            lastMessageWithContainer.container.style.height = "100%";
            lastMessageWithContainer.container.style.minHeight = "250px";
          }

          // Add the container to the messages area
          setTimeout(() => {
            console.log("Chatbot - Attempting to insert container into DOM");
            const messagesContainer = document.getElementById("chat-messages");
            console.log(
              "Chatbot - Messages container found:",
              !!messagesContainer
            );
            if (messagesContainer) {
              // Find the message element that corresponds to this container
              const messageElement = messagesContainer.querySelector(
                `[data-message-id="${lastMessageWithContainer.id}"]`
              );

              if (messageElement) {
                // Insert the container right after the message element
                messageElement.parentNode?.insertBefore(
                  responseContainer,
                  messageElement.nextSibling
                );
                console.log(
                  "Chatbot - Container inserted after message element"
                );
              } else {
                // Fallback: append to end if message element not found
                messagesContainer.appendChild(responseContainer);
                console.log("Chatbot - Container appended to end (fallback)");
              }

              responseContainer.setAttribute("data-spotter-container", "true");
              responseContainer.setAttribute(
                "data-message-id",
                lastMessageWithContainer.id
              );
              console.log("Chatbot - Container inserted into DOM successfully");
            } else {
              console.error("Chatbot - Messages container not found!");
            }
          }, 100);
        } catch (error) {
          console.error("Error rendering SpotterAgentEmbed container:", error);
          // Add an error message to the chat
          const errorMessage: Message = {
            id: Date.now().toString(),
            type: "system",
            content:
              "There was an error rendering the data visualization. Please try again.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      }
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && step === "chat") {
      inputRef.current?.focus();
    }
  }, [isOpen, step]);

  // Initialize chatbot with configured message and models when opened
  useEffect(() => {
    if (isOpen && step === "initial") {
      const initializeChatbot = async () => {
        try {
          // Fetch available models
          const availableModels = await fetchModels();

          // Get configured models
          const configuredModelIds =
            context.appConfig.chatbot?.selectedModelIds || [];
          const configuredModels = availableModels.filter((model) =>
            configuredModelIds.includes(model.id)
          );

          // Initialize conversation manager
          const manager = new ConversationManager(
            availableModels,
            configuredModelIds,
            (convMessages: ConversationMessage[]) => {
              const convertedMessages = convMessages.map(
                convertConversationMessage
              );
              setMessages(convertedMessages);
            }
          );
          setConversationManager(manager);

          // Show welcome message and configured models
          const welcomeMessage =
            context.appConfig.chatbot?.welcomeMessage ||
            "Hello! I'm your AI assistant. What would you like to know about your data?";

          const initialMessages: Message[] = [
            {
              id: "welcome",
              type: "bot",
              content: welcomeMessage,
              timestamp: new Date(),
            },
          ];

          // If there are configured models, show them
          // Set up models for display and go directly to chat
          setFilteredModels(configuredModels);
          setStep("chat");

          // Add information about available models if any are configured
          if (configuredModels.length === 0) {
            const noModelsMessage: Message = {
              id: "no-models",
              type: "bot",
              content:
                "No specific models are configured. You can ask me anything and I'll help you find the right model to use.",
              timestamp: new Date(),
            };
            initialMessages.push(noModelsMessage);
          }

          setMessages(initialMessages);
        } catch (error) {
          console.error("Failed to initialize chatbot:", error);
          const errorMessage: Message = {
            id: "init-error",
            type: "bot",
            content:
              "Sorry, I couldn't load the available models. Please try again.",
            timestamp: new Date(),
          };
          setMessages([errorMessage]);
        }
      };

      initializeChatbot();
    }
  }, [
    isOpen,
    step,
    context.appConfig.chatbot?.selectedModelIds,
    context.appConfig.chatbot?.welcomeMessage,
    context.appConfig.chatbot?.defaultModelId,
  ]);

  const handleInitialSubmit = async () => {
    if (!inputValue.trim() || !conversationManager) return;

    setInputValue("");
    setIsLoading(true);

    try {
      // Use the conversation manager to process the message
      await conversationManager.addUserMessage(inputValue);
      setStep("chat");
    } catch (err) {
      console.error("Error processing message:", err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content:
          "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = async () => {
    if (!inputValue.trim() || !conversationManager) return;

    setInputValue("");
    setIsLoading(true);

    try {
      // Use the conversation manager to process the message
      await conversationManager.addUserMessage(inputValue);
    } catch (err) {
      console.error("Error processing message:", err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content:
          "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInputValue("");
    setStep("initial");
    setFilteredModels([]);
    setActiveModelId(null);
    if (conversationManager) {
      conversationManager.resetConversation();
    }

    // Clear any SpotterAgentEmbed containers from the DOM
    const messagesContainer = document.getElementById("chat-messages");
    if (messagesContainer) {
      const existingContainers = messagesContainer.querySelectorAll(
        "[data-spotter-container]"
      );
      existingContainers.forEach((container) => container.remove());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (step === "initial") {
      handleInitialSubmit();
    } else if (step === "chat") {
      handleChatSubmit();
    }
  };

  if (!isOpen) return null;

  // Get colors from context
  const dialogBgColor =
    context.stylingConfig.application.dialogs.backgroundColor;
  const dialogFgColor =
    context.stylingConfig.application.dialogs.foregroundColor;
  // Use primary button styles for consistency
  const primaryColor =
    context.stylingConfig.application.buttons?.primary?.backgroundColor ||
    "#3182ce";
  const primaryHoverColor =
    context.stylingConfig.application.buttons?.primary?.hoverBackgroundColor ||
    "#2c5aa0";

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={onClose}
      >
        {/* Modal */}
        <div
          style={{
            width: "90vw",
            maxWidth: "1200px",
            height: "90vh",
            maxHeight: "800px",
            backgroundColor: dialogBgColor,
            borderRadius: "12px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: dialogBgColor,
              borderBottom: "1px solid #e2e8f0",
              padding: "12px 24px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: dialogFgColor,
                margin: 0,
              }}
            >
              {step === "initial" && "AI Assistant"}
              {step === "chat" && "AI Assistant"}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {step !== "initial" && (
                <button
                  onClick={handleReset}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#e2e8f0",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    fontWeight: "500",
                    color: "#374151",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#d1d5db";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#e2e8f0";
                  }}
                  title="Reset conversation"
                >
                  ↺
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#e2e8f0",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  color: "#374151",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#d1d5db";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#e2e8f0";
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Models Display */}
          {step === "chat" && filteredModels.length > 0 && (
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "#f8fafc",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                Available Models ({filteredModels.length}):
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {filteredModels.map((model) => (
                  <div
                    key={model.id}
                    style={{
                      padding: "6px 12px",
                      backgroundColor:
                        activeModelId === model.id ? "#3b82f6" : "white",
                      border:
                        activeModelId === model.id
                          ? "1px solid #3b82f6"
                          : "1px solid #e5e7eb",
                      borderRadius: "16px",
                      fontSize: "12px",
                      color: activeModelId === model.id ? "white" : "#6b7280",
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                      cursor: "help",
                      position: "relative",
                      opacity:
                        activeModelId && activeModelId !== model.id ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (model.description) {
                        setHoveredModel(model);
                        setTooltipPosition({
                          x:
                            e.currentTarget.offsetLeft +
                            e.currentTarget.offsetWidth / 2,
                          y: e.currentTarget.offsetTop - 10,
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredModel(null);
                    }}
                  >
                    {model.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Tooltip */}
          {hoveredModel && hoveredModel.description && (
            <div
              style={{
                position: "absolute",
                left: `${tooltipPosition.x}px`,
                top: `${tooltipPosition.y}px`,
                transform: "translateX(-50%)",
                backgroundColor: "#1f2937",
                color: "white",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                maxWidth: "300px",
                zIndex: 1000,
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                pointerEvents: "none",
                animation: "fadeIn 0.1s ease-in-out",
              }}
            >
              {hoveredModel.description}
              <style jsx>{`
                @keyframes fadeIn {
                  from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(5px);
                  }
                  to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                  }
                }
              `}</style>
            </div>
          )}

          {/* Messages */}
          <div
            id="chat-messages"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              backgroundColor: "#f9fafb",
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                data-message-id={message.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems:
                    message.type === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "70%",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    backgroundColor:
                      message.type === "user"
                        ? primaryColor
                        : message.type === "system"
                        ? "#fef3c7"
                        : "white",
                    color:
                      message.type === "user"
                        ? "white"
                        : message.type === "system"
                        ? "#92400e"
                        : "#374151",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    border:
                      message.type === "system" ? "1px solid #f59e0b" : "none",
                  }}
                >
                  <div>
                    {message.type === "bot" ? (
                      <FormattedMessage content={message.content} />
                    ) : (
                      message.content
                    )}
                    {message.metadata?.classification && (
                      <div
                        style={{
                          fontSize: "11px",
                          opacity: 0.7,
                          marginTop: "4px",
                          fontStyle: "italic",
                        }}
                      >
                        Classification:{" "}
                        {message.metadata.classification.isDataQuestion
                          ? "Data Question"
                          : "General Question"}
                        (confidence:{" "}
                        {Math.round(
                          message.metadata.classification.confidence * 100
                        )}
                        %)
                      </div>
                    )}
                    {message.metadata?.usage && (
                      <div
                        style={{
                          fontSize: "11px",
                          opacity: 0.7,
                          marginTop: "4px",
                          fontStyle: "italic",
                        }}
                      >
                        Tokens: {message.metadata.usage.total_tokens}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    backgroundColor: "white",
                    color: "#374151",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        animation: "spin 1s linear infinite",
                        width: "16px",
                        height: "16px",
                        border: "2px solid #d1d5db",
                        borderTop: "2px solid #6b7280",
                        borderRadius: "50%",
                      }}
                    ></div>
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "20px 24px",
              borderTop: "1px solid #e5e7eb",
              backgroundColor: "white",
            }}
          >
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", gap: "12px" }}
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  step === "initial"
                    ? "What would you like to ask about?"
                    : "Ask a question..."
                }
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  backgroundColor: "white",
                  color: "#374151",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = primaryColor;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d1d5db";
                }}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                style={{
                  padding: "12px 24px",
                  backgroundColor: primaryColor,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  opacity: !inputValue.trim() || isLoading ? 0.5 : 1,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (inputValue.trim() && !isLoading) {
                    e.currentTarget.style.backgroundColor = primaryHoverColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (inputValue.trim() && !isLoading) {
                    e.currentTarget.style.backgroundColor = primaryColor;
                  }
                }}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
