import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";

import LoginPage from "./pages/LoginPage";

import ChatPage from "./pages/ChatPage";

import PdfPage from "./pages/PdfPage";

import AdminDashboard from "./pages/AdminDashboard";
import SignupPage from "./pages/SignupPage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Redirect root to login */}

          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Main routes */}

          <Route path="/login" element={<LoginPage />} />

          <Route path="/signup" element={<SignupPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/sanction/:loanId" element={<PdfPage />} />

          <Route path="/admin" element={<AdminDashboard />} />

          {/* Catch-all route - redirect to login */}

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
