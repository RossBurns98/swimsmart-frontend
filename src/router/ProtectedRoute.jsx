import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Logs decisions so we can see *why* a route didn’t render.
 */
export default function ProtectedRoute({ children, role }) {
  const { token, role: myRole } = useAuth();
  const location = useLocation();

  // Debug logging — remove after we stabilise.
  console.info("[ProtectedRoute] path=", location.pathname, {
    hasToken: !!token,
    myRole,
    requiredRole: role || null,
  });

  if (!token) {
    console.warn("[ProtectedRoute] no token → redirect to /login");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && myRole && myRole !== role) {
    const home = myRole === "coach" ? "/coach" : "/dashboard";
    console.warn("[ProtectedRoute] role mismatch:", { myRole, required: role, home });
    return <Navigate to={home} replace />;
  }

  console.info("[ProtectedRoute] access granted → render children");
  return children;
}
