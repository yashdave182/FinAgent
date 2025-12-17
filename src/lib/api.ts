/**
 * Real API integration for FinAgent
 * Connects to FastAPI backend (Hugging Face Spaces) with direct auth
 */

import axios from "axios";

// Backend API base URL - hardcoded to Hugging Face Spaces
const API_BASE_URL = "https://omgy-finagent.hf.space";

// Axios instance for API calls
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 120 seconds to handle long LLM processing
  headers: {
    "Content-Type": "application/json",
  },
});

// Runtime logging to verify requests go to the correct backend
console.log("[FinAgent] API base URL:", API_BASE_URL);

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("finagent_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log outgoing request for debugging
    console.log("[FinAgent] Request:", {
      method: config.method,
      url: `${API_BASE_URL}${config.url}`,
      hasAuthHeader: !!config.headers.Authorization,
    });

    return config;
  },
  (error) => {
    console.error("[FinAgent] Request setup error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log network errors to help diagnose wrong base URLs or CORS issues
    console.error("[FinAgent] API Error:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("finagent_token");
      localStorage.removeItem("finagent_user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

// ============================================================================
// Type Definitions
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  user_id: string;
  email: string;
  full_name: string;
  monthly_income: number;
  existing_emi: number;
  mock_credit_score: number;
  segment: string;
  created_at?: string;
}

export interface LoanApplication {
  loan_id: string;
  user_id: string;
  full_name?: string;
  requested_amount: number;
  requested_tenure_months: number;
  approved_amount: number;
  tenure_months: number;
  emi: number;
  interest_rate: number;
  credit_score: number;
  foir: number;
  decision: "APPROVED" | "REJECTED" | "ADJUST";
  risk_band: "A" | "B" | "C";
  explanation: string;
  sanction_pdf_path?: string;
  sanction_pdf_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  type: "text" | "loan-offer" | "sanction-letter";
  text: string;
  timestamp: string;
  meta?: {
    step?: string;
    decision?: string;
    loan_id?: string;
    [key: string]: any;
  };
}

export interface ChatSession {
  session_id: string;
  user_id: string;
  current_step: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminMetrics {
  total_applications: number;
  approved_count: number;
  rejected_count: number;
  adjust_count: number;
  avg_loan_amount: number;
  avg_emi: number;
  avg_credit_score: number;
  today_applications: number;
  risk_distribution: {
    A: number;
    B: number;
    C: number;
  };
}

// ============================================================================
// Authentication APIs (Backend endpoints, NOT Firebase)
// ============================================================================

export const login = async (
  email: string,
  password: string,
): Promise<ApiResponse<User>> => {
  try {
    console.log("[FinAgent] Calling backend /api/auth/login");

    const response = await apiClient.post("/api/auth/login", {
      email,
      password,
    });

    const {
      access_token,
      user_id,
      full_name,
      email: userEmail,
    } = response.data;

    // Clear old session to prevent showing previous user's chat
    localStorage.removeItem("finagent_session_id");

    // Store backend token
    localStorage.setItem("finagent_token", access_token);

    // Store user info
    const user: User = {
      user_id,
      email: userEmail,
      full_name,
      monthly_income: 0,
      existing_emi: 0,
      mock_credit_score: 0,
      segment: "New to Credit",
    };

    localStorage.setItem("finagent_user", JSON.stringify(user));

    console.log("[FinAgent] Login successful:", user_id);

    return {
      success: true,
      data: user,
      message: "Login successful",
    };
  } catch (error: any) {
    console.error("[FinAgent] Login error:", error);
    return {
      success: false,
      error:
        error.response?.data?.detail ||
        error.message ||
        "Login failed. Please check your credentials.",
    };
  }
};

export const register = async (
  email: string,
  password: string,
  fullName: string,
  monthlyIncome: number,
  existingEmi: number = 0,
): Promise<ApiResponse<User>> => {
  try {
    console.log("[FinAgent] Calling backend /api/auth/register");

    const response = await apiClient.post("/api/auth/register", {
      email,
      password,
      full_name: fullName,
      monthly_income: monthlyIncome,
      existing_emi: existingEmi,
    });

    const {
      access_token,
      user_id,
      full_name,
      email: userEmail,
    } = response.data;

    // Clear old session to prevent showing previous user's chat
    localStorage.removeItem("finagent_session_id");

    // Store backend token
    localStorage.setItem("finagent_token", access_token);

    // Store user info
    const user: User = {
      user_id,
      email: userEmail,
      full_name,
      monthly_income: monthlyIncome,
      existing_emi: existingEmi,
      mock_credit_score: 650,
      segment: "New to Credit",
    };

    localStorage.setItem("finagent_user", JSON.stringify(user));

    console.log("[FinAgent] Registration successful:", user_id);

    return {
      success: true,
      data: user,
      message: "Registration successful",
    };
  } catch (error: any) {
    console.error("[FinAgent] Registration error:", error);
    return {
      success: false,
      error:
        error.response?.data?.detail ||
        error.message ||
        "Registration failed. Please try again.",
    };
  }
};

export const logout = async (): Promise<ApiResponse> => {
  try {
    // Call backend logout
    await apiClient.post("/api/auth/logout");

    // Clear local storage (including session to prevent showing old chats)
    localStorage.removeItem("finagent_token");
    localStorage.removeItem("finagent_user");
    localStorage.removeItem("finagent_session_id");

    console.log("[FinAgent] Logout successful");

    return {
      success: true,
      message: "Logged out successfully",
    };
  } catch (error: any) {
    console.error("[FinAgent] Logout error:", error);

    // Clear local storage even if API call fails
    localStorage.removeItem("finagent_token");
    localStorage.removeItem("finagent_user");
    localStorage.removeItem("finagent_session_id");

    return {
      success: true,
      message: "Logged out",
    };
  }
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem("finagent_user");
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

export const getUserProfile = async (
  userId: string,
): Promise<ApiResponse<User>> => {
  try {
    const response = await apiClient.get(`/api/auth/profile/${userId}`);

    const user: User = response.data;

    // Update local storage
    localStorage.setItem("finagent_user", JSON.stringify(user));

    return {
      success: true,
      data: user,
    };
  } catch (error: any) {
    console.error("[FinAgent] Get profile error:", error);
    return {
      success: false,
      error: error.response?.data?.detail || "Failed to fetch user profile",
    };
  }
};

export const updateUserProfile = async (
  userId: string,
  updates: Partial<User>,
): Promise<ApiResponse<User>> => {
  try {
    await apiClient.put(`/api/auth/profile/${userId}`, updates);

    // Fetch updated profile
    return await getUserProfile(userId);
  } catch (error: any) {
    console.error("[FinAgent] Update profile error:", error);
    return {
      success: false,
      error: error.response?.data?.detail || "Failed to update profile",
    };
  }
};

// ============================================================================
// Chat APIs
// ============================================================================

let currentSessionId: string | null = null;

export const getChatSession = async (
  userId: string,
): Promise<ApiResponse<ChatSession>> => {
  try {
    // Get or create session ID
    let sessionId = localStorage.getItem("finagent_session_id");

    if (!sessionId) {
      // Generate new session ID
      sessionId = `${userId}_${Date.now()}`;
      localStorage.setItem("finagent_session_id", sessionId);
    }

    currentSessionId = sessionId;

    // Try to get session info
    try {
      const response = await apiClient.get(
        `/api/chat/session/${sessionId}/info`,
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      // Session doesn't exist yet, that's okay
      if (error.response?.status === 404) {
        return {
          success: true,
          data: {
            session_id: sessionId,
            user_id: userId,
            current_step: "WELCOME",
            message_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        };
      }
      throw error;
    }
  } catch (error: any) {
    console.error("[FinAgent] Get chat session error:", error);
    return {
      success: false,
      error: error.response?.data?.detail || "Failed to get chat session",
    };
  }
};

export const getChatHistory = async (
  sessionId: string,
): Promise<ApiResponse<ChatMessage[]>> => {
  try {
    const response = await apiClient.get(`/api/chat/history/${sessionId}`);

    const messages: ChatMessage[] = response.data.history.map(
      (msg: any, index: number) => ({
        id: `${msg.role}_${index}`,
        sender: msg.role === "user" ? "user" : "assistant",
        type: "text",
        text: msg.content,
        timestamp: new Date().toISOString(),
      }),
    );

    return {
      success: true,
      data: messages,
    };
  } catch (error: any) {
    console.error("[FinAgent] Get chat history error:", error);
    // Return empty array if history not found
    if (error.response?.status === 404) {
      return {
        success: true,
        data: [],
      };
    }
    return {
      success: false,
      error: error.response?.data?.detail || "Failed to fetch chat history",
    };
  }
};

export const sendMessage = async (
  message: string,
  userId: string,
  sessionId?: string,
): Promise<ApiResponse<ChatMessage>> => {
  try {
    // Use provided session ID or current session ID
    // Don't create a fake session ID - let backend create it
    const activeSessionId = sessionId || currentSessionId || null;

    console.log("[FinAgent] Sending message to /api/chat/", {
      session_id: activeSessionId,
      user_id: userId,
    });

    // Send message to backend
    const response = await apiClient.post("/api/chat/", {
      session_id: activeSessionId,
      user_id: userId,
      message: message,
    });

    const {
      reply,
      step,
      decision,
      loan_id,
      meta,
      session_id: returnedSessionId,
    } = response.data;

    console.log("[FinAgent] Chat response:", {
      decision,
      step,
      loan_id,
      session_id: returnedSessionId,
    });

    // Save the session ID returned from backend
    if (returnedSessionId && returnedSessionId !== currentSessionId) {
      localStorage.setItem("finagent_session_id", returnedSessionId);
      currentSessionId = returnedSessionId;
      console.log("[FinAgent] Updated session ID:", returnedSessionId);
    }

    // Create message object
    const botMessage: ChatMessage = {
      id: `assistant_${Date.now()}`,
      sender: "assistant",
      type:
        decision === "APPROVED" || decision === "ADJUST"
          ? "loan-offer"
          : "text",
      text: reply,
      timestamp: new Date().toISOString(),
      meta: {
        step,
        decision,
        loan_id,
        session_id: returnedSessionId,
        ...meta,
      },
    };

    return {
      success: true,
      data: botMessage,
    };
  } catch (error: any) {
    console.error("[FinAgent] Send message error:", error);
    return {
      success: false,
      error: error.response?.data?.detail || "Failed to send message",
      data: {
        id: `error_${Date.now()}`,
        sender: "assistant",
        type: "text",
        text: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date().toISOString(),
      },
    };
  }
};

export const clearChatSession = async (
  sessionId: string,
): Promise<ApiResponse> => {
  try {
    await apiClient.delete(`/api/chat/session/${sessionId}`);

    // Clear local storage
    localStorage.removeItem("finagent_session_id");
    currentSessionId = null;

    return {
      success: true,
      message: "Chat session cleared",
    };
  } catch (error: any) {
    console.error("[FinAgent] Clear session error:", error);
    return {
      success: false,
      error: error.response?.data?.detail || "Failed to clear session",
    };
  }
};

// ============================================================================
// Loan APIs
// ============================================================================

export const getLoanApplication = async (
  loanId: string,
): Promise<ApiResponse<LoanApplication>> => {
  try {
    const response = await apiClient.get(`/api/loan/${loanId}`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("[FinAgent] Get loan error:", error);
    return {
      success: false,
      error: error.response?.data?.detail || "Failed to fetch loan application",
    };
  }
};

export const getUserLoans = async (
  userId: string,
  limit: number = 10,
): Promise<ApiResponse<LoanApplication[]>> => {
  try {
    const response = await apiClient.get(`/api/loan/user/${userId}/loans`, {
      params: { limit },
    });

    return {
      success: true,
      data: response.data.loans,
    };
  } catch (error: any) {
    console.error("[FinAgent] Get user loans error:", error);
    return {
      success: false,
      error: error.response?.data?.detail || "Failed to fetch loans",
    };
  }
};

export const getSanctionPDFUrl = (loanId: string): string => {
  return `${API_BASE_URL}/api/loan/${loanId}/sanction-pdf`;
};

export const getSanctionInfo = async (
  loanId: string,
): Promise<ApiResponse<any>> => {
  try {
    const response = await apiClient.get(`/api/loan/${loanId}/sanction-info`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("[FinAgent] Get sanction info error:", error);
    return {
      success: false,
      error:
        error.response?.data?.detail || "Failed to fetch sanction letter info",
    };
  }
};

// Generate PDF on client-side as fallback
const generatePDFClientSide = async (loanData: any): Promise<Blob> => {
  console.log("[FinAgent] Generating PDF on client-side as fallback");

  // Create a simple HTML template that looks like the PDF
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Sanction Letter - ${loanData.loan_id}</title>
  <style>
    @page { size: A4; margin: 2cm; }
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      color: #10b981;
      border-bottom: 2px solid #10b981;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 { margin: 0; font-size: 28px; }
    .header h2 { margin: 10px 0 0 0; font-size: 18px; color: #1f2937; }
    .section { margin: 20px 0; }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 10px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 5px;
    }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    td { padding: 8px; border: 1px solid #e5e7eb; }
    td:first-child { font-weight: bold; background: #f9fafb; width: 40%; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    .success {
      background: #d1fae5;
      color: #065f46;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>FinAgent</h1>
    <h2>Personal Loan Sanction Letter</h2>
  </div>

  <div class="success">
    ✓ LOAN APPROVED
  </div>

  <div class="section">
    <div class="section-title">Reference Details</div>
    <table>
      <tr><td>Sanction Reference No:</td><td>${loanData.loan_id}</td></tr>
      <tr><td>Sanction Date:</td><td>${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</td></tr>
      <tr><td>Validity:</td><td>7 days from sanction date</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Applicant Details</div>
    <table>
      <tr><td>Name:</td><td>${loanData.full_name || "Valued Customer"}</td></tr>
      <tr><td>User ID:</td><td>${loanData.user_id}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Loan Details</div>
    <table>
      <tr><td>Loan Amount:</td><td>₹${Number(loanData.approved_amount || loanData.requested_amount).toLocaleString("en-IN")}</td></tr>
      <tr><td>Tenure:</td><td>${loanData.tenure_months || loanData.requested_tenure_months} months</td></tr>
      <tr><td>Interest Rate:</td><td>${loanData.interest_rate}% per annum</td></tr>
      <tr><td>Monthly EMI:</td><td>₹${Number(loanData.emi).toLocaleString("en-IN")}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Terms & Conditions</div>
    <ol style="margin-left: 20px;">
      <li>This sanction is valid for 7 days from the date of issue.</li>
      <li>The loan is subject to verification of documents and KYC compliance.</li>
      <li>The interest rate is subject to change as per prevailing rates.</li>
      <li>EMI must be paid on or before the due date each month.</li>
      <li>Late payment will attract additional charges as per policy.</li>
      <li>The loan can be prepaid with applicable prepayment charges.</li>
    </ol>
  </div>

  <div class="footer">
    <p><strong>FinAgent - Loan Processing Platform</strong></p>
    <p>Generated on ${new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}</p>
    <p>This is a system-generated document. For queries, please contact support.</p>
  </div>
</body>
</html>`;

  // Convert HTML to blob for download
  const blob = new Blob([html], { type: "text/html" });
  return blob;
};

export const downloadSanctionPDF = async (loanId: string): Promise<boolean> => {
  const token = localStorage.getItem("finagent_token");
  const url = `${API_BASE_URL}/api/loan/${loanId}/sanction-pdf`;

  console.log("[FinAgent] Downloading PDF from:", url);

  if (!token) {
    console.error("[FinAgent] No authentication token found");
    alert("Please log in to download the PDF.");
    return false;
  }

  try {
    // Try to download from backend first
    console.log("[FinAgent] Attempting download from backend...");
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "blob",
      timeout: 30000,
    });

    console.log("[FinAgent] PDF response received:", {
      status: response.status,
      contentType: response.headers["content-type"],
      size: response.data.size,
    });

    // Check if response is actually a PDF
    const contentType = response.headers["content-type"];
    if (
      contentType &&
      contentType.includes("application/pdf") &&
      response.data.size > 0
    ) {
      // Success - we got a valid PDF
      const blob = new Blob([response.data], { type: "application/pdf" });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `sanction_letter_${loanId}.pdf`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      await new Promise((resolve) => setTimeout(resolve, 100));
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      console.log("[FinAgent] PDF download complete");
      return true;
    } else {
      // Backend returned error, try fallback
      console.warn(
        "[FinAgent] Backend returned non-PDF response, using fallback",
      );
      throw new Error("Backend PDF generation failed");
    }
  } catch (error: any) {
    console.error("[FinAgent] Backend download failed:", error);

    // Fallback: Fetch loan data and generate HTML version
    try {
      console.log("[FinAgent] Attempting client-side fallback...");
      const loanResponse = await getLoanApplication(loanId);

      if (!loanResponse.success || !loanResponse.data) {
        throw new Error("Could not fetch loan data");
      }

      const htmlBlob = await generatePDFClientSide(loanResponse.data);
      const blobUrl = window.URL.createObjectURL(htmlBlob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `sanction_letter_${loanId}.html`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      await new Promise((resolve) => setTimeout(resolve, 100));
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      console.log("[FinAgent] Sanction letter downloaded");
      return true;
    } catch (fallbackError: any) {
      console.error("[FinAgent] Fallback also failed:", fallbackError);
      alert(
        `Failed to download sanction letter. Please contact support if the issue persists.`,
      );
      return false;
    }
  }
};

export const openSanctionPDFInNewTab = async (
  loanId: string,
): Promise<void> => {
  const token = localStorage.getItem("finagent_token");
  const url = `${API_BASE_URL}/api/loan/${loanId}/sanction-pdf`;

  console.log("[FinAgent] Opening PDF in new tab:", url);

  if (!token) {
    console.error("[FinAgent] No authentication token found");
    alert("Please log in to view the PDF.");
    return;
  }

  // Open a new window/tab
  const newWindow = window.open("", "_blank");

  if (!newWindow) {
    alert("Please allow pop-ups to view the PDF in a new tab.");
    return;
  }

  // Show loading message
  newWindow.document.write(`
    <html>
      <head>
        <title>Loading Sanction Letter...</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f3f4f6;
          }
          .loader {
            text-align: center;
          }
          .spinner {
            border: 4px solid #f3f4f6;
            border-top: 4px solid #10b981;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .message {
            color: #374151;
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div class="loader">
          <div class="spinner"></div>
          <div class="message">Loading your sanction letter...</div>
        </div>
      </body>
    </html>
  `);

  try {
    // Try to fetch PDF from backend
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "blob",
      timeout: 30000,
    });

    console.log("[FinAgent] PDF fetched for new tab:", {
      status: response.status,
      size: response.data.size,
      type: response.headers["content-type"],
    });

    const contentType = response.headers["content-type"];
    if (
      contentType &&
      contentType.includes("application/pdf") &&
      response.data.size > 0
    ) {
      // Success - display PDF
      const blob = new Blob([response.data], { type: "application/pdf" });
      const blobUrl = window.URL.createObjectURL(blob);
      newWindow.location.href = blobUrl;
      console.log("[FinAgent] PDF opened in new tab");
    } else {
      throw new Error("Backend returned invalid PDF");
    }
  } catch (error: any) {
    console.error("[FinAgent] Error fetching PDF:", error);

    // Fallback: Try to generate HTML version
    try {
      console.log("[FinAgent] Using client-side fallback for new tab...");
      const loanResponse = await getLoanApplication(loanId);

      if (!loanResponse.success || !loanResponse.data) {
        throw new Error("Could not fetch loan data");
      }

      const loanData = loanResponse.data;

      // Generate HTML sanction letter directly in the new window
      newWindow.document.open();
      newWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Sanction Letter - ${loanData.loan_id}</title>
  <style>
    @page { size: A4; margin: 2cm; }
    @media print {
      .no-print { display: none; }
      body { background: white; }
    }
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f9fafb;
    }
    .container {
      background: white;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      color: #10b981;
      border-bottom: 2px solid #10b981;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 { margin: 0; font-size: 32px; }
    .header h2 { margin: 10px 0 0 0; font-size: 20px; color: #1f2937; }
    .section { margin: 20px 0; }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 15px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 8px;
    }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    td { padding: 12px; border: 1px solid #e5e7eb; }
    td:first-child { font-weight: bold; background: #f9fafb; width: 45%; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 13px;
    }
    .success {
      background: #d1fae5;
      color: #065f46;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      font-weight: bold;
      font-size: 18px;
    }
    .print-button {
      background: #10b981;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      margin: 20px auto;
      display: block;
    }
    .print-button:hover {
      background: #059669;
    }
    ol { margin-left: 20px; }
    li { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FinAgent</h1>
      <h2>Personal Loan Sanction Letter</h2>
    </div>

    <div class="success">
      ✓ LOAN APPROVED
    </div>

    <div class="section">
      <div class="section-title">Reference Details</div>
      <table>
        <tr><td>Sanction Reference No:</td><td>${loanData.loan_id}</td></tr>
        <tr><td>Sanction Date:</td><td>${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</td></tr>
        <tr><td>Validity:</td><td>7 days from sanction date</td></tr>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Applicant Details</div>
      <table>
        <tr><td>Name:</td><td>${loanData.full_name || "Valued Customer"}</td></tr>
        <tr><td>User ID:</td><td>${loanData.user_id}</td></tr>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Loan Details</div>
      <table>
        <tr><td>Loan Amount:</td><td>₹${Number(loanData.approved_amount || loanData.requested_amount).toLocaleString("en-IN")}</td></tr>
        <tr><td>Tenure:</td><td>${loanData.tenure_months || loanData.requested_tenure_months} months</td></tr>
        <tr><td>Interest Rate:</td><td>${loanData.interest_rate}% per annum</td></tr>
        <tr><td>Monthly EMI:</td><td>₹${Number(loanData.emi).toLocaleString("en-IN")}</td></tr>
        <tr><td>Total Repayment:</td><td>₹${(Number(loanData.emi) * Number(loanData.tenure_months || loanData.requested_tenure_months)).toLocaleString("en-IN")}</td></tr>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Terms & Conditions</div>
      <ol>
        <li>This sanction is valid for 7 days from the date of issue.</li>
        <li>The loan is subject to verification of documents and KYC compliance.</li>
        <li>The interest rate is subject to change as per prevailing rates.</li>
        <li>EMI must be paid on or before the due date each month.</li>
        <li>Late payment will attract additional charges as per policy.</li>
        <li>The loan can be prepaid with applicable prepayment charges.</li>
        <li>All disputes are subject to jurisdiction of competent courts.</li>
      </ol>
    </div>

    <div class="footer">
      <p><strong>FinAgent - Loan Processing Platform</strong></p>
      <p>Generated on ${new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}</p>
      <p>This is a system-generated document. For queries, please contact support.</p>
    </div>
  </div>

  <button class="print-button no-print" onclick="window.print()">🖨️ Print to PDF</button>

  <script>
    // Auto-focus for print dialog
    console.log("Sanction letter loaded successfully");
  </script>
</body>
</html>
      `);
      newWindow.document.close();
      console.log("[FinAgent] HTML sanction letter displayed in new tab");
    } catch (fallbackError: any) {
      console.error("[FinAgent] Fallback also failed:", fallbackError);

      let errorMessage = "Unknown error occurred";
      if (fallbackError.message) {
        errorMessage = fallbackError.message;
      }

      newWindow.document.open();
      newWindow.document.write(`
        <html>
          <head>
            <title>Error Loading Sanction Letter</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 50px auto;
                padding: 20px;
                background: #f3f4f6;
              }
              .error-box {
                background: white;
                border-left: 4px solid #ef4444;
                padding: 20px;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              h1 {
                color: #ef4444;
                margin-top: 0;
              }
              p {
                color: #374151;
                line-height: 1.6;
              }
              .error-details {
                background: #f9fafb;
                padding: 10px;
                border-radius: 4px;
                margin-top: 15px;
                font-family: monospace;
                font-size: 14px;
                word-break: break-word;
              }
              button {
                background: #10b981;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 15px;
              }
              button:hover {
                background: #059669;
              }
            </style>
          </head>
          <body>
            <div class="error-box">
              <h1>⚠️ Error Loading Sanction Letter</h1>
              <p>We encountered an issue while trying to load your sanction letter.</p>
              <div class="error-details">${errorMessage}</div>
              <p>Please try:</p>
              <ul>
                <li>Using the "Download PDF" button instead</li>
                <li>Refreshing the page and trying again</li>
                <li>Checking your internet connection</li>
                <li>Contacting support if the issue persists</li>
              </ul>
              <button onclick="window.close()">Close Window</button>
            </div>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  }
};

// ============================================================================
// Admin APIs
// ============================================================================

export const getAdminMetrics = async (): Promise<ApiResponse<AdminMetrics>> => {
  try {
    const response = await apiClient.get("/api/admin/metrics");

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("[FinAgent] Get metrics error:", error);
    return {
      success: false,
      error: error.response?.data?.detail || "Failed to fetch metrics",
    };
  }
};

export const getAllLoans = async (
  page: number = 1,
  pageSize: number = 20,
  decision?: string,
  riskBand?: string,
): Promise<ApiResponse<{ loans: LoanApplication[]; total: number }>> => {
  try {
    const params: any = { page, page_size: pageSize };
    if (decision) params.decision = decision;
    if (riskBand) params.risk_band = riskBand;

    const response = await apiClient.get("/api/admin/loans", { params });

    return {
      success: true,
      data: {
        loans: response.data.loans,
        total: response.data.total,
      },
    };
  } catch (error: any) {
    console.error("[FinAgent] Get all loans error:", error);
    return {
      success: false,
      error: error.response?.data?.detail || "Failed to fetch loans",
    };
  }
};

export const getAdminStats = async (): Promise<ApiResponse<any>> => {
  try {
    const response = await apiClient.get("/api/admin/stats/summary");

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("[FinAgent] Get stats error:", error);
    return {
      success: false,
      error: error.response?.data?.detail || "Failed to fetch statistics",
    };
  }
};

export const checkBackendHealth = async (): Promise<ApiResponse<any>> => {
  try {
    const response = await apiClient.get("/health");

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("[FinAgent] Health check error:", error);
    return {
      success: false,
      error: "Backend is not reachable",
    };
  }
};

// ============================================================================
// Utility Functions
// ============================================================================

export const calculateEMI = (
  principal: number,
  annualRate: number,
  tenureMonths: number,
): number => {
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) return principal / tenureMonths;

  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);

  return Math.round(emi);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

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

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    APPROVED: "success",
    ADJUST: "warning",
    REJECTED: "danger",
    PENDING: "secondary",
    "UNDER-REVIEW": "info",
  };
  return colorMap[status.toUpperCase()] || "secondary";
};

export const getStatusLabel = (status: string): string => {
  const labelMap: Record<string, string> = {
    APPROVED: "Approved",
    ADJUST: "Adjusted",
    REJECTED: "Rejected",
    PENDING: "Pending",
    "UNDER-REVIEW": "Under Review",
  };
  return labelMap[status.toUpperCase()] || status;
};

export const getRiskBandLabel = (band: string): string => {
  const labels: Record<string, string> = {
    A: "Excellent",
    B: "Good",
    C: "Poor",
  };
  return labels[band] || band;
};

export const getRiskBandColor = (band: string): string => {
  const colors: Record<string, string> = {
    A: "success",
    B: "warning",
    C: "danger",
  };
  return colors[band] || "secondary";
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Export API client for custom requests
export { apiClient };
