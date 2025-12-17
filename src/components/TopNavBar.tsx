import React from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, LogOut, User, Menu } from "lucide-react";

interface TopNavBarProps {
  userName?: string;
  userEmail?: string;
  showUserInfo?: boolean;
  onMenuClick?: () => void;
  variant?: "default" | "chat";
}

const TopNavBar: React.FC<TopNavBarProps> = ({
  userName = "User",
  userEmail,
  showUserInfo = true,
  onMenuClick,
  variant = "default",
}) => {
  const navigate = useNavigate();

  const [showDropdown, setShowDropdown] = React.useState(false);

  const handleLogout = () => {
    localStorage.removeItem("finagent_user");
    navigate("/login");
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and Title */}
          <div className="flex items-center gap-4">
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-success flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 font-display">
                  FinAgent
                </h1>
                {variant === "chat" && (
                  <p className="text-xs text-gray-500 hidden sm:block">
                    Loan Assistant
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right side - User Info */}
          {showUserInfo && (
            <div className="flex items-center gap-3">
              {/* Online Status (for chat variant) */}
              {variant === "chat" && (
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <span className="text-gray-600 font-medium">Online</span>
                </div>
              )}

              {/* User Avatar and Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    {getUserInitials(userName)}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {userName}
                    </p>
                    {userEmail && (
                      <p className="text-xs text-gray-500">{userEmail}</p>
                    )}
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-400 hidden md:block"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-elevated border border-gray-100 py-2 z-50 animate-fade-in">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">
                          {userName}
                        </p>
                        {userEmail && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {userEmail}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          navigate("/chat");
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        Chat
                      </button>

                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          navigate("/admin");
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        Admin Dashboard
                      </button>

                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            handleLogout();
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default TopNavBar;
