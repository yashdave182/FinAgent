// Mock API utility functions for Chat2Sanction
// These simulate backend API calls with realistic delays and responses

import type {
  User,
  LoanApplication,
  ChatMessage,
  ChatSession,
  DashboardMetric,
  LoanRequestRow,
  ApiResponse,
  CustomerProfile,
} from "../types";

// Utility function to simulate API delay
const delay = (ms: number = 800) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Generate unique IDs
const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ============================================
// Authentication API
// ============================================

export const login = async (
  email: string,
  password: string,
): Promise<ApiResponse<User>> => {
  await delay(1000);

  // Simple validation
  if (!email || !password) {
    return {
      success: false,
      error: "Email and password are required",
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      error: "Password must be at least 6 characters",
    };
  }

  // Mock successful login
  const user: User = {
    id: "user-001",
    name: email.includes("admin") ? "Admin User" : "John Doe",
    email: email,
    role: email.includes("admin") ? "admin" : "customer",
    avatar: undefined,
    phone: "+91 98765 43210",
    createdAt: new Date().toISOString(),
  };

  return {
    success: true,
    data: user,
    message: "Login successful",
  };
};

export const logout = async (): Promise<ApiResponse> => {
  await delay(500);
  return {
    success: true,
    message: "Logged out successfully",
  };
};

export const getCurrentUser = async (): Promise<ApiResponse<User>> => {
  await delay(300);

  // Check if user is stored in localStorage
  const storedUser = localStorage.getItem("finagent_user");

  if (storedUser) {
    return {
      success: true,
      data: JSON.parse(storedUser),
    };
  }

  return {
    success: false,
    error: "Not authenticated",
  };
};

// ============================================
// Loan Application API
// ============================================

export const createLoanApplication = async (
  customerId: string,
  amount: number,
  tenure: number,
): Promise<ApiResponse<LoanApplication>> => {
  await delay(1200);

  const emi = calculateEMI(amount, 12.5, tenure); // 12.5% interest rate

  const application: LoanApplication = {
    id: `LOAN-${generateId()}`,
    customerId,
    customerName: "John Doe",
    email: "john.doe@example.com",
    phone: "+91 98765 43210",
    amount,
    tenure,
    emi,
    interestRate: 12.5,
    status: "lead",
    eligibilityStatus: "not-checked",
    applicationDate: new Date().toISOString(),
  };

  return {
    success: true,
    data: application,
    message: "Loan application created successfully",
  };
};

export const getLoanApplication = async (
  loanId: string,
): Promise<ApiResponse<LoanApplication>> => {
  await delay(600);

  // Mock loan data
  const mockLoan: LoanApplication = {
    id: loanId,
    customerId: "user-001",
    customerName: "John Doe",
    email: "john.doe@example.com",
    phone: "+91 98765 43210",
    amount: 50000,
    tenure: 60,
    emi: 989.5,
    interestRate: 12.5,
    status: "approved",
    eligibilityStatus: "pre-approved",
    applicationDate: "2024-01-15T10:30:00Z",
    sanctionDate: new Date().toISOString(),
    validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    approvalId: `LN-APV-${loanId.slice(-8).toUpperCase()}`,
  };

  return {
    success: true,
    data: mockLoan,
  };
};

export const checkEligibility = async (
  loanId: string,
  customerData: Partial<CustomerProfile>,
): Promise<ApiResponse<{ eligible: boolean; message: string }>> => {
  await delay(2000); // Simulate AI processing

  // Simple mock eligibility logic
  const eligible = Math.random() > 0.2; // 80% approval rate

  return {
    success: true,
    data: {
      eligible,
      message: eligible
        ? "Congratulations! You are pre-approved for this loan amount."
        : "We are unable to approve your application at this time. Please contact support.",
    },
  };
};

// ============================================
// Chat API
// ============================================

export const getChatSession = async (
  sessionId: string,
): Promise<ApiResponse<ChatSession>> => {
  await delay(400);

  const initialMessages: ChatMessage[] = [
    {
      id: generateId(),
      sender: "bot",
      type: "text",
      text: "Welcome! I'm here to help you with your loan application. How can I assist you today?",
      timestamp: new Date(Date.now() - 10000).toISOString(),
    },
  ];

  const session: ChatSession = {
    id: sessionId,
    customerId: "user-001",
    customerName: "John Doe",
    messages: initialMessages,
    startedAt: new Date(Date.now() - 10000).toISOString(),
    lastMessageAt: new Date(Date.now() - 10000).toISOString(),
    status: "active",
  };

  return {
    success: true,
    data: session,
  };
};

export const sendMessage = async (
  sessionId: string,
  message: string,
): Promise<ApiResponse<ChatMessage>> => {
  await delay(800);

  // Simulate bot response based on user message
  const botResponse = generateBotResponse(message);

  return {
    success: true,
    data: botResponse,
  };
};

// Helper function to generate bot responses
const generateBotResponse = (userMessage: string): ChatMessage => {
  const lowerMessage = userMessage.toLowerCase();

  // Simple keyword matching for demo purposes
  if (lowerMessage.includes("loan") || lowerMessage.includes("apply")) {
    return {
      id: generateId(),
      sender: "bot",
      type: "quick-reply",
      text: "Great! To get started with your loan application, I need some information. What loan amount are you looking for?",
      timestamp: new Date().toISOString(),
      meta: {
        buttons: [
          { id: "1", label: "₹50,000", value: "50000", action: "set-amount" },
          {
            id: "2",
            label: "₹1,00,000",
            value: "100000",
            action: "set-amount",
          },
          {
            id: "3",
            label: "₹2,00,000",
            value: "200000",
            action: "set-amount",
          },
          {
            id: "4",
            label: "Other Amount",
            value: "other",
            action: "set-amount",
          },
        ],
      },
    };
  }

  if (lowerMessage.includes("eligib")) {
    return {
      id: generateId(),
      sender: "bot",
      type: "text",
      text: "I can help you check your eligibility! Based on the information provided, you are pre-approved for a loan up to ₹5,00,000. Would you like to proceed?",
      timestamp: new Date().toISOString(),
    };
  }

  if (lowerMessage.includes("document") || lowerMessage.includes("kyc")) {
    return {
      id: generateId(),
      sender: "bot",
      type: "document-request",
      text: "For KYC verification, please upload the following documents: Aadhaar Card, PAN Card, and latest salary slips.",
      timestamp: new Date().toISOString(),
    };
  }

  // Default response
  return {
    id: generateId(),
    sender: "bot",
    type: "text",
    text: "Thank you for your message. For demo purposes, you are pre-approved! Would you like to generate your sanction letter?",
    timestamp: new Date().toISOString(),
  };
};

// ============================================
// Admin Dashboard API
// ============================================

export const getDashboardMetrics = async (): Promise<
  ApiResponse<DashboardMetric[]>
> => {
  await delay(600);

  const metrics: DashboardMetric[] = [
    {
      id: "conversations",
      title: "Total Conversations Today",
      value: 1234,
      subtitle: "Active chats",
      trend: {
        value: 5.2,
        direction: "up",
        label: "+5.2% vs yesterday",
      },
    },
    {
      id: "approvals",
      title: "Approvals Today",
      value: 1012,
      subtitle: "Approved loans",
      trend: {
        value: 1.8,
        direction: "down",
        label: "-1.8% vs yesterday",
      },
    },
    {
      id: "avg-time",
      title: "Avg Approval Time",
      value: "2h 15m",
      subtitle: "Processing time",
      trend: {
        value: 0.5,
        direction: "down",
        label: "-0.5% improvement",
      },
    },
    {
      id: "sanction-letters",
      title: "Sanction Letters Generated",
      value: 456,
      subtitle: "Today",
      trend: {
        value: 12,
        direction: "up",
        label: "+12% vs yesterday",
      },
    },
  ];

  return {
    success: true,
    data: metrics,
  };
};

export const getRecentLoanApplications = async (): Promise<
  ApiResponse<LoanRequestRow[]>
> => {
  await delay(500);

  const applications: LoanRequestRow[] = [
    {
      id: "LOAN-001",
      customerName: "Jane Cooper",
      loanAmount: 25000,
      status: "approved",
      applicationDate: "2024-01-26",
      emi: 525,
      tenure: 60,
    },
    {
      id: "LOAN-002",
      customerName: "Cody Fisher",
      loanAmount: 10000,
      status: "rejected",
      applicationDate: "2024-01-25",
      emi: 210,
      tenure: 60,
    },
    {
      id: "LOAN-003",
      customerName: "Esther Howard",
      loanAmount: 50000,
      status: "under-review",
      applicationDate: "2024-01-25",
      emi: 989.5,
      tenure: 60,
    },
    {
      id: "LOAN-004",
      customerName: "Cameron Williamson",
      loanAmount: 7500,
      status: "approved",
      applicationDate: "2024-01-24",
      emi: 157,
      tenure: 60,
    },
    {
      id: "LOAN-005",
      customerName: "Kristin Watson",
      loanAmount: 120000,
      status: "approved",
      applicationDate: "2024-01-23",
      emi: 2374,
      tenure: 60,
    },
    {
      id: "LOAN-006",
      customerName: "Robert Fox",
      loanAmount: 35000,
      status: "kyc-pending",
      applicationDate: "2024-01-23",
      emi: 693,
      tenure: 60,
    },
    {
      id: "LOAN-007",
      customerName: "Jenny Wilson",
      loanAmount: 15000,
      status: "approved",
      applicationDate: "2024-01-22",
      emi: 297,
      tenure: 60,
    },
  ];

  return {
    success: true,
    data: applications,
  };
};

export const getConversations = async (): Promise<
  ApiResponse<ChatSession[]>
> => {
  await delay(400);

  // Mock conversation data
  const conversations: ChatSession[] = [
    {
      id: "chat-001",
      customerId: "cust-001",
      customerName: "Jane Cooper",
      messages: [],
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      lastMessageAt: new Date(Date.now() - 300000).toISOString(),
      status: "active",
      loanApplicationId: "LOAN-001",
    },
    {
      id: "chat-002",
      customerId: "cust-002",
      customerName: "Robert Fox",
      messages: [],
      startedAt: new Date(Date.now() - 7200000).toISOString(),
      lastMessageAt: new Date(Date.now() - 600000).toISOString(),
      status: "active",
      loanApplicationId: "LOAN-006",
    },
  ];

  return {
    success: true,
    data: conversations,
  };
};

// ============================================
// PDF Generation API
// ============================================

export const generateSanctionPDF = async (
  loanId: string,
): Promise<ApiResponse<{ downloadUrl: string }>> => {
  await delay(1500);

  // In production, this would return a real PDF URL from the server
  return {
    success: true,
    data: {
      downloadUrl: `/api/downloads/sanction-letter-${loanId}.pdf`,
    },
    message: "Sanction letter generated successfully",
  };
};

export const downloadPDF = async (loanId: string): Promise<void> => {
  await delay(500);

  // Simulate PDF download
  console.log(`Downloading sanction letter for loan ${loanId}`);

  // In a real app, this would trigger actual file download
  // For now, we'll just show an alert
  alert(
    `PDF download started for Loan ID: ${loanId}\n\nIn production, this would download the actual sanction letter PDF.`,
  );
};

// ============================================
// Utility Functions
// ============================================

// Calculate EMI using the formula: EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
export const calculateEMI = (
  principal: number,
  annualInterestRate: number,
  tenureMonths: number,
): number => {
  const monthlyRate = annualInterestRate / 12 / 100;
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);

  return Math.round(emi * 100) / 100; // Round to 2 decimal places
};

// Format currency in Indian Rupee format
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date for display
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return formatDate(dateString);
};

// Validate email
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Indian format)
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ""));
};

// Get status color class
export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    approved: "bg-green-100 text-green-800",
    "pre-approved": "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    "under-review": "bg-yellow-100 text-yellow-800",
    pending: "bg-yellow-100 text-yellow-800",
    "kyc-pending": "bg-orange-100 text-orange-800",
    "kyc-completed": "bg-blue-100 text-blue-800",
    lead: "bg-gray-100 text-gray-800",
    disbursed: "bg-purple-100 text-purple-800",
  };

  return colorMap[status] || "bg-gray-100 text-gray-800";
};

// Get status label
export const getStatusLabel = (status: string): string => {
  const labelMap: Record<string, string> = {
    "kyc-pending": "KYC Pending",
    "kyc-completed": "KYC Completed",
    "under-review": "Under Review",
    "pre-approved": "Pre-Approved",
  };

  return labelMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
};
