import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Paperclip, Mic, FileText } from "lucide-react";
import TopNavBar from "../components/TopNavBar";
import Sidebar from "../components/Sidebar";
import ChatBubble from "../components/ChatBubble";
import Button from "../components/Button";
import Badge from "../components/Badge";
import type { ChatMessage, WorkflowStep, User } from "../types";

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentStep, setCurrentStep] = useState("lead");
  const [showSidebar, setShowSidebar] = useState(false);

  // Workflow steps
  const workflowSteps: WorkflowStep[] = [
    {
      id: "lead",
      label: "Lead & Loan Details",
      description: "Basic information collection",
      status: "completed",
      icon: "user",
      order: 1,
    },
    {
      id: "kyc",
      label: "KYC Verification",
      description: "Identity verification",
      status: "active",
      icon: "shield",
      order: 2,
    },
    {
      id: "eligibility",
      label: "Eligibility Check",
      description: "Credit assessment",
      status: "pending",
      icon: "check",
      order: 3,
    },
    {
      id: "sanction",
      label: "Sanction Letter",
      description: "Final approval document",
      status: "pending",
      icon: "file",
      order: 4,
    },
  ];

  // Customer summary data
  const customerData = {
    name: currentUser?.name || "John Doe",
    email: currentUser?.email || "john.doe@example.com",
    loanAmount: 50000,
    tenure: 60,
    emi: 989.5,
    eligibilityStatus: "Pre-approved" as const,
  };

  // Load user and initialize chat
  useEffect(() => {
    const storedUser = localStorage.getItem("finagent_user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    // Initialize with welcome messages
    const initialMessages: ChatMessage[] = [
      {
        id: "1",
        sender: "bot",
        type: "text",
        text: "Welcome! I'm here to help you with your loan application. How can I assist you today?",
        timestamp: new Date(Date.now() - 5000).toISOString(),
      },
      {
        id: "2",
        sender: "bot",
        type: "quick-reply",
        text: "To get started, please let me know what you need:",
        timestamp: new Date(Date.now() - 3000).toISOString(),
        meta: {
          buttons: [
            {
              id: "btn1",
              label: "Apply for Loan",
              value: "apply",
              action: "apply",
            },
            {
              id: "btn2",
              label: "Check Eligibility",
              value: "eligibility",
              action: "eligibility",
            },
            {
              id: "btn3",
              label: "Upload Documents",
              value: "documents",
              action: "documents",
            },
          ],
        },
      },
    ];

    setMessages(initialMessages);
    // Demo: progress workflow step after initial messages load
    // Move from 'lead' to 'kyc' after a short delay to avoid unused setter warning
    setTimeout(() => {
      setCurrentStep("kyc");
    }, 2000);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, isBotTyping]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isBotTyping) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      type: "text",
      text: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsBotTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = generateBotResponse(inputValue);
      setMessages((prev) => [...prev, botResponse]);
      setIsBotTyping(false);
    }, 1500);
  };

  // Generate bot response based on user input
  const generateBotResponse = (userInput: string): ChatMessage => {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes("loan") || lowerInput.includes("amount")) {
      return {
        id: `msg-${Date.now()}`,
        sender: "bot",
        type: "loan-summary",
        text: "Based on your profile, here are your loan details:",
        timestamp: new Date().toISOString(),
        meta: {
          loanAmount: customerData.loanAmount,
          tenure: customerData.tenure,
          emi: customerData.emi,
          eligibilityStatus: "pre-approved",
        },
      };
    }

    if (lowerInput.includes("eligib") || lowerInput.includes("qualify")) {
      return {
        id: `msg-${Date.now()}`,
        sender: "bot",
        type: "text",
        text: "🎉 Great news! Based on the information provided, you are pre-approved for a personal loan up to ₹5,00,000 at 12.5% interest rate. Would you like to proceed with the application?",
        timestamp: new Date().toISOString(),
      };
    }

    if (lowerInput.includes("document") || lowerInput.includes("kyc")) {
      return {
        id: `msg-${Date.now()}`,
        sender: "bot",
        type: "document-request",
        text: "For KYC verification, please upload the following documents:\n• Aadhaar Card\n• PAN Card\n• Latest 3 months salary slips\n• Bank statement (last 6 months)",
        timestamp: new Date().toISOString(),
      };
    }

    if (lowerInput.includes("sanction") || lowerInput.includes("letter")) {
      return {
        id: `msg-${Date.now()}`,
        sender: "bot",
        type: "text",
        text: 'Your application has been approved! You can generate your sanction letter now. Click the "Generate Sanction Letter" button on the right panel.',
        timestamp: new Date().toISOString(),
      };
    }

    // Default response
    return {
      id: `msg-${Date.now()}`,
      sender: "bot",
      type: "text",
      text: "Thank you for your message! For this demo, you are pre-approved for a loan of ₹50,000. Would you like to generate your sanction letter?",
      timestamp: new Date().toISOString(),
    };
  };

  // Handle quick reply
  const handleQuickReply = (value: string) => {
    setInputValue(value);
    setTimeout(() => handleSendMessage(), 100);
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle generate sanction letter
  const handleGenerateSanction = () => {
    navigate("/sanction/LOAN-123");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Navigation */}
      <TopNavBar
        userName={currentUser?.name}
        userEmail={currentUser?.email}
        variant="chat"
        onMenuClick={() => setShowSidebar(!showSidebar)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Desktop */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <Sidebar
            steps={workflowSteps}
            currentStep={currentStep}
            className="h-full"
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {showSidebar && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setShowSidebar(false)}
            />
            <div className="fixed left-0 top-16 bottom-0 w-80 z-50 lg:hidden">
              <Sidebar
                steps={workflowSteps}
                currentStep={currentStep}
                className="h-full"
              />
            </div>
          </>
        )}

        {/* Center Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Messages Container */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin"
          >
            <div className="max-w-4xl mx-auto">
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  onQuickReply={handleQuickReply}
                />
              ))}

              {/* Typing Indicator */}
              {isBotTyping && (
                <div className="flex gap-3 mb-4 chat-bubble-enter">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-success flex items-center justify-center text-white font-semibold text-sm">
                      AI
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-4 py-3 bg-white border border-gray-200 rounded-2xl rounded-tl-sm shadow-sm">
                    <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border-t border-gray-200 bg-white px-4 py-3">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                <button
                  onClick={() => setInputValue("₹50,000 for 60 months")}
                  className="flex-shrink-0 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  ₹50K for 60 months
                </button>
                <button
                  onClick={() => setInputValue("₹2,00,000 for 24 months")}
                  className="flex-shrink-0 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  ₹2L for 24 months
                </button>
                <button
                  onClick={() => setInputValue("Check my eligibility")}
                  className="flex-shrink-0 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  Check Eligibility
                </button>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white px-4 py-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end gap-3">
                {/* Attachment Button */}
                <button className="flex-shrink-0 p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>

                {/* Text Input */}
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message about loan..."
                    disabled={isBotTyping}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Mic className="w-5 h-5" />
                  </button>
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isBotTyping}
                  className="flex-shrink-0 p-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Summary Panel - Desktop */}
        <div className="hidden xl:block w-80 border-l border-gray-200 bg-white overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 font-display">
              Customer Snapshot
            </h3>

            <div className="space-y-6">
              {/* Customer Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                    {customerData.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {customerData.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {customerData.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Loan Details */}
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-600">Loan Amount</span>
                  <span className="text-lg font-bold text-gray-900">
                    ₹{customerData.loanAmount.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-600">Tenure</span>
                  <span className="font-semibold text-gray-900">
                    {customerData.tenure} months
                  </span>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-600">Monthly EMI</span>
                  <span className="font-semibold text-gray-900">
                    ₹{customerData.emi.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Eligibility Status
                    </span>
                    <Badge variant="success">
                      {customerData.eligibilityStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleGenerateSanction}
                leftIcon={<FileText className="w-5 h-5" />}
              >
                Generate Sanction Letter
              </Button>

              {/* Info Note */}
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> Your application is pre-approved.
                  Generate your sanction letter to proceed with disbursement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Summary Panel - Bottom Sheet */}
      <div className="xl:hidden border-t border-gray-200 bg-white p-4">
        <button
          onClick={handleGenerateSanction}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors shadow-sm"
        >
          <FileText className="w-5 h-5" />
          Generate Sanction Letter
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
