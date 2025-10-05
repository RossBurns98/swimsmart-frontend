import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import TopNav from "./components/layout/TopNav";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Coach from "./pages/Coach";
import ExportPage from "./pages/Export";
import SessionDetailPage from "./pages/SessionDetail";

import ProtectedRoute from "./router/ProtectedRoute";
import CoachSwimmerSessions from "./pages/CoachSwimmerSessions";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <TopNav />
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/coach"
              element={
                <ProtectedRoute role="coach">
                  <Coach />
                </ProtectedRoute>
              }
            />

            <Route
              path="/export"
              element={
                <ProtectedRoute>
                  <ExportPage />
                </ProtectedRoute>
              }
            />

            {/* session detail page */}
            <Route
              path="/sessions/:id"
              element={
                <ProtectedRoute>
                  <SessionDetailPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/coach/swimmers/:id"
              element={
                <ProtectedRoute role="coach">
                  <CoachSwimmerSessions />
                </ProtectedRoute>
              }
            />

            {/* Unknown paths -> home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}
