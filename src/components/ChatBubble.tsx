"use client";

import { useState, useEffect } from "react";
import Chatbot from "./Chatbot";
import { useAppContext } from "./Layout";

export default function ChatBubble() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const context = useAppContext();

  // Ensure this component only renders on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get chatbot configuration from context
  const chatbotConfig = context.appConfig.chatbot;

  // Don't render if chatbot is disabled
  if (!chatbotConfig?.enabled) {
    return null;
  }

  // Get colors from styling configuration (primary button styles)
  const primaryColor =
    context.stylingConfig.application.buttons?.primary?.backgroundColor ||
    "#3182ce";
  const primaryHoverColor =
    context.stylingConfig.application.buttons?.primary?.hoverBackgroundColor ||
    "#2c5aa0";
  const position = chatbotConfig.position || "bottom-right";

  // Don't render anything on the server side
  if (!isClient) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Bubble */}
      <button
        onClick={() => setIsChatOpen(true)}
        style={{
          position: "fixed",
          bottom: "16px",
          [position === "bottom-right" ? "right" : "left"]: "16px",
          width: "64px",
          height: "64px",
          backgroundColor: primaryColor,
          color: "white",
          borderRadius: "50%",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          cursor: "pointer",
          transition: "all 0.2s ease",
          zIndex: 1001,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = primaryHoverColor;
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = primaryColor;
          e.currentTarget.style.transform = "scale(1)";
        }}
        title="Chat with AI Assistant"
      >
        <svg
          style={{ width: "24px", height: "24px" }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      {/* Chatbot Modal */}
      <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
