import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import TopNav from "./components/layout/TopNav";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Coach from "./pages/Coach";
import ExportPage from "./pages/Export";
import SessionDetailPage from "./pages/SessionDetail";
import NewSessionPage from "./pages/NewSession";
import CoachSwimmerSessions from "./pages/CoachSwimmerSessions";
import CoachSessionDetail from "./pages/CoachSessionDetail";

import ProtectedRoute from "./router/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <TopNav />
        <main className="container mx-auto px-4 pt-16 pb-6 relative z-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/new-session"
              element={
                <ProtectedRoute>
                  <NewSessionPage />
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
              path="/coach/swimmers/:id"
              element={
                <ProtectedRoute role="coach">
                  <CoachSwimmerSessions />
                </ProtectedRoute>
              }
            />

            <Route
              path="/coach/swimmers/:id/sessions/:sid"
              element={
                <ProtectedRoute role="coach">
                  <CoachSessionDetail />
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

            <Route
              path="/sessions/:id"
              element={
                <ProtectedRoute>
                  <SessionDetailPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}
