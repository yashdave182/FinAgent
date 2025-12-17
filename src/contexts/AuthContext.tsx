import React, { createContext, useContext, useEffect, useState } from "react";
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getCurrentUser,
} from "../lib/api";
import type { User } from "../lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    monthlyIncome: number,
    existingEmi: number,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing user in localStorage on mount
    const storedUser = getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiLogin(email, password);

      if (response.success && response.data) {
        setUser(response.data);
      } else {
        throw new Error(response.error || "Login failed");
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      throw new Error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    monthlyIncome: number,
    existingEmi: number,
  ) => {
    try {
      setLoading(true);
      const response = await apiRegister(
        email,
        password,
        fullName,
        monthlyIncome,
        existingEmi,
      );

      if (response.success && response.data) {
        setUser(response.data);
      } else {
        throw new Error(response.error || "Registration failed");
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      throw new Error(error.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await apiLogout();
      setUser(null);
    } catch (error) {
      console.error("Sign out error:", error);
      // Clear user even if logout API fails
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = () => {
    const storedUser = getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
