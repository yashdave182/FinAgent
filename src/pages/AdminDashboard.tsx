import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  CheckCircle,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Users,
  Clock,
} from "lucide-react";
import MetricsCard from "../components/MetricsCard";
import DataTable from "../components/DataTable";
import Card from "../components/Card";
import type { DashboardMetric, LoanRequestRow, LoanStatus } from "../types";
import type { LoanApplication } from "../lib/api";
import { getAdminMetrics, getAllLoans, formatCurrency } from "../lib/api";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
      active
        ? "bg-primary-50 text-primary-700 font-semibold"
        : "text-gray-700 hover:bg-gray-50"
    }`}
  >
    <span className="flex-shrink-0">{icon}</span>
    <span>{label}</span>
  </button>
);

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [loanApplications, setLoanApplications] = useState<LoanRequestRow[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("overview");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [metricsResponse, applicationsResponse] = await Promise.all([
          getAdminMetrics(),
          getAllLoans(),
        ]);

        if (metricsResponse.success && metricsResponse.data) {
          // Transform AdminMetrics to DashboardMetric[]
          const metricsData = metricsResponse.data;
          const transformedMetrics: DashboardMetric[] = [
            {
              id: "total",
              title: "Total Applications",
              value: metricsData.total_applications,
              subtitle: "All time",
              icon: "FileText",
            },
            {
              id: "approved",
              title: "Approved",
              value: metricsData.approved_count,
              subtitle: "Total approved",
              icon: "CheckCircle",
            },
            {
              id: "rejected",
              title: "Rejected",
              value: metricsData.rejected_count,
              subtitle: "Total rejected",
              icon: "XCircle",
            },
            {
              id: "average",
              title: "Avg Loan Amount",
              value: formatCurrency(metricsData.avg_loan_amount),
              subtitle: "Average approved",
              icon: "DollarSign",
            },
          ];
          setMetrics(transformedMetrics);
        }

        if (applicationsResponse.success && applicationsResponse.data) {
          // Transform loan applications to LoanRequestRow[]
          const loans: LoanApplication[] = applicationsResponse.data.loans;
          const transformedLoans: LoanRequestRow[] = loans.map((loan) => {
            // Map decision to valid LoanStatus
            let status: LoanStatus = "under-review";
            if (loan.decision === "APPROVED") {
              status = "approved";
            } else if (loan.decision === "REJECTED") {
              status = "rejected";
            }

            return {
              id: loan.loan_id,
              customerName: loan.full_name || "N/A",
              loanAmount: loan.approved_amount || loan.requested_amount,
              status: status,
              applicationDate: loan.created_at,
              emi: loan.emi,
              tenure: loan.tenure_months || loan.requested_tenure_months,
            };
          });
          setLoanApplications(transformedLoans);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("finagent_user");
    navigate("/login");
  };

  const handleRowClick = (row: LoanRequestRow) => {
    console.log("Clicked row:", row);
    // In production, navigate to loan details page
    // navigate(`/admin/loans/${row.id}`);
  };

  // Daily applications data for chart
  const dailyApplicationsData = [
    { day: "Mon", count: 1100 },
    { day: "Tue", count: 1450 },
    { day: "Wed", count: 1200 },
    { day: "Thu", count: 1650 },
    { day: "Fri", count: 1800 },
    { day: "Sat", count: 900 },
    { day: "Sun", count: 750 },
  ];

  const maxCount = Math.max(...dailyApplicationsData.map((d) => d.count));

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out flex flex-col`}
      >
        {/* Logo/Brand */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-success flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 font-display">
                  LoanFlow AI
                </h2>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Dashboard"
            active={activeNav === "overview"}
            onClick={() => setActiveNav("overview")}
          />
          <NavItem
            icon={<MessageSquare className="w-5 h-5" />}
            label="Conversations"
            active={activeNav === "conversations"}
            onClick={() => setActiveNav("conversations")}
          />
          <NavItem
            icon={<CheckCircle className="w-5 h-5" />}
            label="Approvals"
            active={activeNav === "approvals"}
            onClick={() => setActiveNav("approvals")}
          />
          <NavItem
            icon={<FileText className="w-5 h-5" />}
            label="Reports"
            active={activeNav === "reports"}
            onClick={() => setActiveNav("reports")}
          />
        </nav>

        {/* User Profile & Settings */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                Admin User
              </p>
              <p className="text-xs text-gray-500 truncate">user@example.com</p>
            </div>
          </div>

          <div className="space-y-1">
            <NavItem
              icon={<Settings className="w-5 h-5" />}
              label="Settings"
              onClick={() => console.log("Settings clicked")}
            />
            <NavItem
              icon={<LogOut className="w-5 h-5" />}
              label="Logout"
              onClick={handleLogout}
            />
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-display">
                    Admin Dashboard
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Monitor and manage loan applications
                  </p>
                </div>
              </div>

              {/* User Avatar - Desktop */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    Admin User
                  </p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                  A
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Loading State */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600">Loading dashboard data...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {metrics.map((metric) => (
                    <MetricsCard key={metric.id} metric={metric} />
                  ))}
                </div>

                {/* Charts and Tables Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Daily Applications Chart */}
                  <div className="lg:col-span-2">
                    <Card
                      title="Daily Applications (Last 30 Days)"
                      padding="lg"
                    >
                      <div className="mb-4">
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-3xl font-bold text-gray-900">
                            15,678
                          </h3>
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
                            <TrendingUp className="w-4 h-4" />
                            +12.5%
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Total applications this month
                        </p>
                      </div>

                      {/* Simple Bar Chart */}
                      <div className="space-y-3">
                        {dailyApplicationsData.map((data, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <span className="text-xs font-medium text-gray-600 w-8">
                              {data.day}
                            </span>
                            <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-lg transition-all duration-500 flex items-center justify-end px-3"
                                style={{
                                  width: `${(data.count / maxCount) * 100}%`,
                                }}
                              >
                                <span className="text-xs font-semibold text-white">
                                  {data.count.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Loan Outcome Distribution */}
                  <div className="lg:col-span-1">
                    <Card
                      title="Loan Outcome Distribution"
                      subtitle="This Month"
                      padding="lg"
                    >
                      <div className="flex items-center justify-center py-8">
                        {/* Simple Donut Chart Representation */}
                        <div className="relative w-48 h-48">
                          <svg
                            className="w-full h-full transform -rotate-90"
                            viewBox="0 0 100 100"
                          >
                            {/* Approved - 65% */}
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="20"
                              strokeDasharray="163 251"
                              strokeDashoffset="0"
                            />
                            {/* Pending - 25% */}
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth="20"
                              strokeDasharray="63 251"
                              strokeDashoffset="-163"
                            />
                            {/* Rejected - 10% */}
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="#ef4444"
                              strokeWidth="20"
                              strokeDasharray="25 251"
                              strokeDashoffset="-226"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <p className="text-3xl font-bold text-gray-900">
                                4,812
                              </p>
                              <p className="text-xs text-gray-500">Total</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="space-y-3 mt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-sm text-gray-700">
                              Approved
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            65% (3,128)
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span className="text-sm text-gray-700">
                              Pending
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            25% (1,203)
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-sm text-gray-700">
                              Rejected
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            10% (481)
                          </span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* Recent Loan Applications Table */}
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 font-display">
                        Recent Loan Applications
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Latest applications from customers
                      </p>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors">
                      View All
                    </button>
                  </div>

                  <DataTable
                    data={loanApplications}
                    onRowClick={handleRowClick}
                  />
                </div>

                {/* Additional Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card padding="lg" hover>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Active Users</p>
                        <p className="text-2xl font-bold text-gray-900">
                          8,542
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card padding="lg" hover>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Approval Rate</p>
                        <p className="text-2xl font-bold text-gray-900">82%</p>
                      </div>
                    </div>
                  </Card>

                  <Card padding="lg" hover>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Avg. Processing</p>
                        <p className="text-2xl font-bold text-gray-900">
                          2h 15m
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
