import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User, IndianRupee, ArrowRight, MessageSquare, Sparkles } from "lucide-react";
import Button from "../components/Button";
import Input from "../components/Input";
import { register, validateEmail } from "../lib/api";

interface FormData {
  fullName: string;
  email: string;
  password: string;
  monthlyIncome: string;
  existingEmi: string;
  agree: boolean;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  monthlyIncome?: string;
  existingEmi?: string;
  agree?: string;
  general?: string;
}

const SignupPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    password: "",
    monthlyIncome: "",
    existingEmi: "",
    agree: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Please enter a valid name";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    const monthlyIncomeNum = Number(formData.monthlyIncome);
    if (formData.monthlyIncome === "") {
      newErrors.monthlyIncome = "Monthly income is required";
    } else if (Number.isNaN(monthlyIncomeNum) || monthlyIncomeNum <= 0) {
      newErrors.monthlyIncome = "Please enter a valid positive number";
    }

    const existingEmiNum = Number(formData.existingEmi || 0);
    if (formData.existingEmi && (Number.isNaN(existingEmiNum) || existingEmiNum < 0)) {
      newErrors.existingEmi = "Please enter a valid non-negative number";
    }

    if (!formData.agree) {
      newErrors.agree = "You must agree to the Terms and Privacy Policy";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors((prev) => ({ ...prev, general: undefined }));

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await register(
        formData.email,
        formData.password,
        formData.fullName.trim(),
        Number(formData.monthlyIncome),
        Number(formData.existingEmi || 0),
      );

      if (response.success && response.data) {
        localStorage.setItem("finagent_user", JSON.stringify(response.data));
        navigate("/chat");
      } else {
        setErrors({
          general: response.error || "Signup failed. Please try again.",
        });
      }
    } catch (error: any) {
      setErrors({
        general: error?.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Column - Branding */}
          <div className="hidden lg:flex flex-col justify-center space-y-8 p-12">
            <div className="space-y-6">
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

              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                  Create your account
                  <br />
                  <span className="text-primary-600">Get instant loan decisions</span>
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Sign up to start your AI-assisted loan application journey.
                </p>
              </div>

              <div className="space-y-4 pt-6">
                {[
                  "Secure Firebase authentication",
                  "Smart eligibility check",
                  "Instant loan offer recommendations",
                  "Downloadable sanction letter",
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
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

          {/* Right Column - Signup Form */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
              {/* Mobile Logo */}
              <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-success flex items-center justify-center shadow-lg">
                  <MessageSquare className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 font-display">FinAgent</h1>
              </div>

              {/* Signup Card */}
              <div className="bg-white rounded-2xl shadow-elevated border border-gray-100 p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h2>
                  <p className="text-gray-600">Join FinAgent and get started with your loan application.</p>
                </div>

                {/* General Error Alert */}
                {errors.general && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-fade-in">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-sm text-red-800">{errors.general}</p>
                  </div>
                )}

                {/* Signup Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <Input
                    label="Full Name"
                    type="text"
                    name="fullName"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    error={errors.fullName}
                    leftIcon={<User className="w-5 h-5" />}
                    required
                    autoComplete="name"
                  />

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

                  <Input
                    label="Password"
                    type="password"
                    name="password"
                    placeholder="Enter a secure password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    leftIcon={<Lock className="w-5 h-5" />}
                    required
                    autoComplete="new-password"
                  />

                  <Input
                    label="Monthly Income (INR)"
                    type="number"
                    name="monthlyIncome"
                    placeholder="50000"
                    value={formData.monthlyIncome}
                    onChange={handleChange}
                    error={errors.monthlyIncome}
                    leftIcon={<IndianRupee className="w-5 h-5" />}
                    required
                    min="0"
                    step="1000"
                  />

                  <Input
                    label="Existing EMI (INR)"
                    type="number"
                    name="existingEmi"
                    placeholder="0"
                    value={formData.existingEmi}
                    onChange={handleChange}
                    error={errors.existingEmi}
                    leftIcon={<IndianRupee className="w-5 h-5" />}
                    min="0"
                    step="500"
                  />

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="agree"
                      checked={formData.agree}
                      onChange={handleChange}
                      className="custom-checkbox"
                    />
                    <span className="text-sm text-gray-700">
                      I agree to the{" "}
                      <button type="button" className="text-primary-600 hover:underline">
                        Terms of Service
                      </button>{" "}
                      and{" "}
                      <button type="button" className="text-primary-600 hover:underline">
                        Privacy Policy
                      </button>
                      .
                    </span>
                  </label>
                  {errors.agree && <p className="text-xs text-red-600">{errors.agree}</p>}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    isLoading={isLoading}
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                  >
                    Create Account
                  </Button>
                </form>

                <p className="mt-6 text-xs text-center text-gray-500">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary-600 hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </div>

              {/* Footer Note */}
              <p className="mt-6 text-sm text-center text-gray-600">
                Continue exploring as a{" "}
                <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                  returning user
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
