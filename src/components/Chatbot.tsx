"use client";

import { useState, useRef, useEffect } from "react";
import { fetchModels } from "../services/thoughtspotApi";
import {
  ThoughtSpotContent,
  ThoughtSpotEmbedInstance,
} from "../types/thoughtspot";
import { useAppContext } from "./Layout";

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Chatbot({ isOpen, onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"initial" | "model-selection" | "chat">(
    "initial"
  );
  const [models, setModels] = useState<ThoughtSpotContent[]>([]);
  const [filteredModels, setFilteredModels] = useState<ThoughtSpotContent[]>(
    []
  );
  const [selectedModel, setSelectedModel] = useState<ThoughtSpotContent | null>(
    null
  );
  const [conversation, setConversation] =
    useState<ThoughtSpotEmbedInstance | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const context = useAppContext();

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && step === "chat") {
      inputRef.current?.focus();
    }
  }, [isOpen, step]);

  // Initialize conversation when model is selected
  useEffect(() => {
    const initializeConversation = async () => {
      if (selectedModel && step === "chat") {
        try {
          const { SpotterAgentEmbed } = await import(
            "@thoughtspot/visual-embed-sdk"
          );
          const newConversation = new SpotterAgentEmbed({
            worksheetId: selectedModel.id,
          });
          setConversation(newConversation);

          // Add welcome message
          setMessages([
            {
              id: "welcome",
              type: "bot",
              content: `I'm ready to help you with questions about "${selectedModel.name}". What would you like to know?`,
              timestamp: new Date(),
            },
          ]);
        } catch (error) {
          console.error("Failed to initialize SpotterAgentEmbed:", error);
          const errorMessage: Message = {
            id: "init-error",
            type: "bot",
            content: "Sorry, I couldn't initialize the chat. Please try again.",
            timestamp: new Date(),
          };
          setMessages([errorMessage]);
        }
      }
    };

    initializeConversation();
  }, [
    context.appConfig.thoughtspotUrl,
    context.lastClusterChangeTime,
    selectedModel,
    step,
  ]);

  const filterModelsByQuery = (
    allModels: ThoughtSpotContent[],
    query: string
  ): ThoughtSpotContent[] => {
    if (!query.trim()) return allModels;

    const queryLower = query.toLowerCase();
    return allModels.filter((model) => {
      const nameMatch = model.name.toLowerCase().includes(queryLower);
      const descriptionMatch =
        model.description?.toLowerCase().includes(queryLower) || false;
      return nameMatch || descriptionMatch;
    });
  };

  const handleInitialSubmit = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setUserQuery(inputValue);
    setMessages([userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Fetch available models
      const availableModels = await fetchModels();
      setModels(availableModels);

      // Filter models based on user query
      const filtered = filterModelsByQuery(availableModels, inputValue);
      setFilteredModels(filtered);

      if (filtered.length === 0) {
        const noMatchMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: `I couldn't find any models matching "${inputValue}". Here are all available models:`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, noMatchMessage]);
        setFilteredModels(availableModels);
      } else {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: `Based on your question about "${inputValue}", here are some relevant models you can use. Please select one by number or name:`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }

      setStep("model-selection");
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content:
          "Sorry, I couldn't fetch the available models. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelSelection = (model: ThoughtSpotContent) => {
    setSelectedModel(model);
    setStep("chat");
  };

  const handleModelSelectionByNumber = (number: number) => {
    const model = filteredModels[number - 1];
    if (model) {
      handleModelSelection(model);
    }
  };

  const handleChatSubmit = async () => {
    if (!inputValue.trim() || !conversation) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      if (!conversation.sendMessage) {
        throw new Error("Send message method not available");
      }
      const { container, error } = await conversation.sendMessage(inputValue);

      if (error) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: `Error: ${error}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } else if (container) {
        // Create a container for the response
        const responseContainer = document.createElement("div");
        responseContainer.style.marginTop = "16px";
        responseContainer.style.marginBottom = "16px";
        responseContainer.style.width = "100%";
        responseContainer.style.minHeight = "600px";
        responseContainer.style.height = "600px";
        responseContainer.style.display = "flex";
        responseContainer.style.flexDirection = "column";
        responseContainer.appendChild(container);

        // Ensure the container takes full height
        if (container.style) {
          container.style.width = "100%";
          container.style.height = "100%";
          container.style.minHeight = "400px";
        }

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: "Here's the response:",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);

        // Add the container to the messages area
        setTimeout(() => {
          const messagesContainer = document.getElementById("chat-messages");
          if (messagesContainer) {
            messagesContainer.appendChild(responseContainer);
          }
        }, 100);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: "No response received from the model.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
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
    setSelectedModel(null);
    setConversation(null);
    setModels([]);
    setFilteredModels([]);
    setUserQuery("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (step === "initial") {
      handleInitialSubmit();
    } else if (step === "model-selection") {
      // Check if input is a number
      const number = parseInt(inputValue);
      if (!isNaN(number) && number >= 1 && number <= filteredModels.length) {
        handleModelSelectionByNumber(number);
        setInputValue("");
      } else {
        // Check if input matches a model name
        const matchingModel = filteredModels.find((model) =>
          model.name.toLowerCase().includes(inputValue.toLowerCase())
        );
        if (matchingModel) {
          handleModelSelection(matchingModel);
          setInputValue("");
        }
      }
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
  const primaryColor = "#3b82f6";
  const primaryHoverColor = "#2563eb";

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
              {step === "model-selection" && "Select a Model"}
              {step === "chat" && `Chat - ${selectedModel?.name}`}
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
                style={{
                  display: "flex",
                  justifyContent:
                    message.type === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "70%",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    backgroundColor:
                      message.type === "user" ? primaryColor : "white",
                    color: message.type === "user" ? "white" : "#374151",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    fontSize: "14px",
                    lineHeight: "1.5",
                  }}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {/* Model selection */}
            {step === "model-selection" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {filteredModels.map((model, index) => (
                  <button
                    key={model.id}
                    onClick={() => handleModelSelection(model)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "16px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      background: "white",
                      cursor: "pointer",
                      color: "#374151",
                      transition: "all 0.2s",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                      e.currentTarget.style.borderColor = primaryColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "white";
                      e.currentTarget.style.borderColor = "#e5e7eb";
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "600",
                        fontSize: "16px",
                        marginBottom: "4px",
                      }}
                    >
                      {index + 1}. {model.name}
                    </div>
                    {model.description && (
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#6b7280",
                          lineHeight: "1.4",
                        }}
                      >
                        {model.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

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
                    : step === "model-selection"
                    ? `Type a number (1-${filteredModels.length}) or model name...`
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
