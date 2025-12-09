// User & Authentication Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'agent';
  avatar?: string;
  phone?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Loan Types
export interface LoanApplication {
  id: string;
  customerId: string;
  customerName: string;
  email: string;
  phone: string;
  amount: number;
  tenure: number; // in months
  emi: number;
  interestRate: number;
  status: LoanStatus;
  eligibilityStatus: EligibilityStatus;
  sanctionDate?: string;
  validTill?: string;
  applicationDate: string;
  approvalId?: string;
  documents?: LoanDocument[];
}

export type LoanStatus =
  | 'lead'
  | 'kyc-pending'
  | 'kyc-completed'
  | 'under-review'
  | 'approved'
  | 'rejected'
  | 'disbursed';

export type EligibilityStatus =
  | 'not-checked'
  | 'checking'
  | 'eligible'
  | 'pre-approved'
  | 'not-eligible';

export interface LoanDocument {
  id: string;
  type: 'aadhaar' | 'pan' | 'salary-slip' | 'bank-statement' | 'other';
  name: string;
  url: string;
  uploadedAt: string;
  status: 'pending' | 'verified' | 'rejected';
}

// Chat Types
export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  type: MessageType;
  text: string;
  timestamp: string;
  meta?: MessageMeta;
}

export type MessageType =
  | 'text'
  | 'loan-summary'
  | 'quick-reply'
  | 'system'
  | 'document-request'
  | 'eligibility-result';

export interface MessageMeta {
  loanAmount?: number;
  tenure?: number;
  emi?: number;
  buttons?: QuickReplyButton[];
  eligibilityStatus?: EligibilityStatus;
  documentType?: string;
  [key: string]: any;
}

export interface QuickReplyButton {
  id: string;
  label: string;
  value: string;
  action?: string;
}

export interface ChatSession {
  id: string;
  customerId: string;
  customerName: string;
  messages: ChatMessage[];
  startedAt: string;
  lastMessageAt: string;
  status: 'active' | 'closed';
  loanApplicationId?: string;
}

// Workflow Steps
export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  status: StepStatus;
  icon: string;
  order: number;
}

export type StepStatus = 'pending' | 'active' | 'completed' | 'skipped';

// Admin Dashboard Types
export interface DashboardMetric {
  id: string;
  title: string;
  value: number | string;
  subtitle: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label: string;
  };
  icon?: string;
  color?: string;
}

export interface ConversationSummary {
  id: string;
  customerName: string;
  loanAmount: number;
  status: LoanStatus;
  lastMessageTime: string;
  unreadCount?: number;
}

export interface LoanRequestRow {
  id: string;
  customerName: string;
  loanAmount: number;
  status: LoanStatus;
  applicationDate: string;
  emi?: number;
  tenure?: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

// Component Props Types
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: string;
}

// Customer Profile
export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  address?: Address;
  employment?: EmploymentDetails;
  financials?: FinancialDetails;
  kycStatus: 'not-started' | 'in-progress' | 'completed' | 'failed';
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface EmploymentDetails {
  type: 'salaried' | 'self-employed' | 'business';
  companyName: string;
  designation?: string;
  monthlyIncome: number;
  experienceYears: number;
}

export interface FinancialDetails {
  monthlyIncome: number;
  monthlyExpenses: number;
  existingLoans: number;
  creditScore?: number;
  bankAccountVerified: boolean;
}

// Navigation
export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  badge?: number;
  children?: NavItem[];
}

// Chart Data
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}
