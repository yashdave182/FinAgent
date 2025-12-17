import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Send,
  CheckCircle,
  Clock,
  FileText,
  Menu,
  X,
} from "lucide-react";
import TopNavBar from "../components/TopNavBar";
import Sidebar from "../components/Sidebar";
import ChatBubble from "../components/ChatBubble";
import Button from "../components/Button";
import {
  sendMessage,
  getChatSession,
  getChatHistory,
  getCurrentUser,
  type ChatMessage,
  type User,
} from "../lib/api";

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentStep, setCurrentStep] = useState("WELCOME");
  const [showSidebar, setShowSidebar] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize chat session
  useEffect(() => {
    const initializeChat = async () => {
      // Get current user
      const user = getCurrentUser();
      if (!user) {
        navigate("/login");
        return;
      }

      setCurrentUser(user);

      // Ensure user_id exists, fallback to generating from email
      const userId = user.user_id || user.email?.split("@")[0] || "user";

      try {
        // Get or create chat session
        const sessionResult = await getChatSession(userId);

        if (sessionResult.success && sessionResult.data) {
          const session = sessionResult.data;
          setSessionId(session.session_id);
          setCurrentStep(session.current_step);

          // Load chat history if exists
          if (session.message_count > 0) {
            const historyResult = await getChatHistory(session.session_id);
            if (historyResult.success && historyResult.data) {
              setMessages(historyResult.data);
            }
          } else {
            // Show welcome message for new sessions
            setMessages([
              {
                id: "welcome",
                sender: "assistant",
                type: "text",
                text: "Welcome to FinAgent! 👋 I'm your AI loan assistant powered by advanced AI. I can help you apply for a personal loan in minutes. How can I assist you today?",
                timestamp: new Date().toISOString(),
              },
            ]);
          }
        }
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        // Show welcome message even if session creation fails
        setMessages([
          {
            id: "welcome",
            sender: "assistant",
            type: "text",
            text: "Welcome to FinAgent! How can I help you with your loan today?",
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [navigate]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, isBotTyping]);

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentUser || isBotTyping) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      type: "text",
      text: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    // Add user message to UI
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsBotTyping(true);

    try {
      // Send message to backend
      const response = await sendMessage(
        userMessage.text,
        currentUser.user_id,
        sessionId || undefined,
      );

      if (response.success && response.data) {
        const botMessage = response.data;

        // Update session ID from backend response (always trust backend)
        if (botMessage.meta?.session_id) {
          setSessionId(botMessage.meta.session_id);
          console.log(
            "[ChatPage] Updated sessionId:",
            botMessage.meta.session_id,
          );
        }

        // Update current step
        if (botMessage.meta?.step) {
          setCurrentStep(botMessage.meta.step);
        }

        // Add bot message
        setMessages((prev) => [...prev, botMessage]);

        // Check if loan was approved and navigate to sanction
        if (
          botMessage.meta?.loan_id &&
          (botMessage.meta?.decision === "APPROVED" ||
            botMessage.meta?.decision === "ADJUST")
        ) {
          // Show loan offer message
          setTimeout(() => {
            navigate(`/sanction/${botMessage.meta!.loan_id}`);
          }, 2000);
        }
      } else {
        // Show error message
        const errorMessage: ChatMessage = {
          id: `error_${Date.now()}`,
          sender: "assistant",
          type: "text",
          text:
            response.error ||
            "Sorry, I encountered an error. Please try again.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Send message error:", error);
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        sender: "assistant",
        type: "text",
        text: "Sorry, I'm having trouble connecting. Please check your internet connection and try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsBotTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickReply = (text: string) => {
    setInputValue(text);
    setTimeout(() => handleSendMessage(), 100);
  };

  // Workflow steps based on current step
  const workflowSteps = [
    {
      id: "welcome",
      label: "Welcome",
      description: "Getting started",
      status:
        currentStep === "WELCOME"
          ? "current"
          : currentStep !== "WELCOME"
            ? "completed"
            : "pending",
      icon: MessageSquare,
      order: 1,
    },
    {
      id: "gathering",
      label: "Loan Details",
      description: "Collecting information",
      status:
        currentStep === "GATHERING_DETAILS"
          ? "current"
          : currentStep === "UNDERWRITING" ||
              currentStep === "SANCTION_GENERATED" ||
              currentStep === "REJECTED"
            ? "completed"
            : "pending",
      icon: FileText,
      order: 2,
    },
    {
      id: "underwriting",
      label: "Processing",
      description: "AI evaluation",
      status:
        currentStep === "UNDERWRITING"
          ? "current"
          : currentStep === "SANCTION_GENERATED" || currentStep === "REJECTED"
            ? "completed"
            : "pending",
      icon: Clock,
      order: 3,
    },
    {
      id: "decision",
      label: "Decision",
      description: "Loan status",
      status:
        currentStep === "SANCTION_GENERATED" || currentStep === "REJECTED"
          ? "completed"
          : "pending",
      icon: CheckCircle,
      order: 4,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopNavBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {showSidebar && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`${
            showSidebar ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out`}
        >
          <Sidebar steps={workflowSteps} currentStep={currentStep} />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                {showSidebar ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
              <MessageSquare className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Loan Assistant
                </h1>
                <p className="text-sm text-gray-500">Real-time processing</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Online</span>
              </div>
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 overflow-x-auto">
            <div className="flex items-center gap-4 min-w-max">
              {workflowSteps
                .sort((a, b) => a.order - b.order)
                .map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          step.status === "completed"
                            ? "bg-green-100 text-green-600"
                            : step.status === "current"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <step.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            step.status === "completed" ||
                            step.status === "current"
                              ? "text-gray-900"
                              : "text-gray-400"
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-xs text-gray-500">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    {index < workflowSteps.length - 1 && (
                      <div
                        className={`w-12 h-0.5 mx-2 ${
                          step.status === "completed"
                            ? "bg-green-500"
                            : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Messages Container */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto bg-gray-50 px-4 py-6 space-y-4"
          >
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                message={message}
                onQuickReply={handleQuickReply}
              />
            ))}

            {/* Bot typing indicator */}
            {isBotTyping && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                  AI
                </div>
                <div className="flex-1 bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                    <span className="text-sm text-gray-500">
                      AI is thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-gray-200 px-4 py-4">
            <div className="max-w-4xl mx-auto">
              {/* Quick Suggestions */}
              {messages.length <= 2 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      handleQuickReply(
                        "I need a personal loan of ₹5,00,000 for 36 months",
                      )
                    }
                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                  >
                    💰 Need ₹5L loan
                  </button>
                  <button
                    onClick={() =>
                      handleQuickReply("What documents do I need?")
                    }
                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                  >
                    📄 Required documents
                  </button>
                  <button
                    onClick={() =>
                      handleQuickReply("What is the interest rate?")
                    }
                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                  >
                    📊 Interest rates
                  </button>
                </div>
              )}

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message... (Press Enter to send)"
                    disabled={isBotTyping}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isBotTyping}
                  variant="primary"
                  size="md"
                >
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline ml-2">Send</span>
                </Button>
              </div>

              <p className="text-xs text-gray-500 mt-2 text-center">
                Real-time loan processing • Secure & Confidential
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
