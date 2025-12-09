import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, MessageSquare, ArrowRight, Sparkles } from "lucide-react";
import Button from "../components/Button";
import Input from "../components/Input";
import { login, validateEmail } from "../lib/api";

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear field-specific error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear general error
    setErrors((prev) => ({ ...prev, general: undefined }));

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await login(formData.email, formData.password);

      if (response.success && response.data) {
        // Store user data in localStorage
        localStorage.setItem("finagent_user", JSON.stringify(response.data));

        // Navigate to chat page
        navigate("/chat");
      } else {
        setErrors({
          general: response.error || "Login failed. Please try again.",
        });
      }
    } catch (error) {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle guest login
  const handleGuestLogin = () => {
    const guestUser = {
      id: "guest-001",
      name: "Guest User",
      email: "guest@demo.com",
      role: "customer" as const,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("finagent_user", JSON.stringify(guestUser));
    navigate("/chat");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Column - Branding */}
          <div className="hidden lg:flex flex-col justify-center space-y-8 p-12">
            <div className="space-y-6">
              {/* Logo and Brand */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-success flex items-center justify-center shadow-lg">
                  <MessageSquare className="w-9 h-9 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 font-display">
                    FinAgent
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Sparkles className="w-4 h-4 text-primary-500" />
                    <span className="text-sm text-primary-600 font-medium">
                      AI-Powered Loan Platform
                    </span>
                  </div>
                </div>
              </div>

              {/* Tagline */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                  AI-Powered Financial Agent
                  <br />
                  <span className="text-primary-600">
                    Intelligent Loan Processing
                  </span>
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Get instant personal loan approval through our AI-powered
                  chatbot. Simple, fast, and secure.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4 pt-6">
                {[
                  "Instant approval in minutes",
                  "Automated KYC verification",
                  "Smart eligibility check",
                  "Downloadable sanction letter",
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-primary-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Login Form */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
              {/* Mobile Logo */}
              <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-success flex items-center justify-center shadow-lg">
                  <MessageSquare className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 font-display">
                  FinAgent
                </h1>
              </div>

              {/* Login Card */}
              <div className="bg-white rounded-2xl shadow-elevated border border-gray-100 p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Sign in to continue
                  </h2>
                  <p className="text-gray-600">
                    Welcome back! Please enter your credentials.
                  </p>
                </div>

                {/* General Error Alert */}
                {errors.general && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-fade-in">
                    <svg
                      className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-sm text-red-800">{errors.general}</p>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Input */}
                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    leftIcon={<Mail className="w-5 h-5" />}
                    required
                    autoComplete="email"
                  />

                  {/* Password Input */}
                  <Input
                    label="Password"
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    leftIcon={<Lock className="w-5 h-5" />}
                    required
                    autoComplete="current-password"
                  />

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleChange}
                        className="custom-checkbox"
                      />
                      <span className="text-sm text-gray-700">Remember me</span>
                    </label>
                    <button
                      type="button"
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Login Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    isLoading={isLoading}
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                  >
                    Login
                  </Button>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">or</span>
                    </div>
                  </div>

                  {/* Guest Login Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={handleGuestLogin}
                  >
                    Continue as Guest
                  </Button>
                </form>

                {/* Terms and Privacy */}
                <p className="mt-6 text-xs text-center text-gray-500">
                  By continuing, you agree to our{" "}
                  <button className="text-primary-600 hover:underline">
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button className="text-primary-600 hover:underline">
                    Privacy Policy
                  </button>
                  .
                </p>

                {/* Demo Credentials */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">
                    Demo Credentials:
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Email:</span>{" "}
                      demo@example.com
                    </p>
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Password:</span> demo123
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      (Use any email/password with 6+ characters)
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <p className="mt-6 text-sm text-center text-gray-600">
                Don't have an account?{" "}
                <button className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                  Sign up now
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
