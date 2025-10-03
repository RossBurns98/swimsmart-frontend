import { Navigate, UNSAFE_ErrorResponseImpl, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
    const { token, role: useRole } = useAuth();
    const location = useLocation();

    // Not logged in -> go to login
    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role gate
    if (role && useRole !== role) {
        const home = useRole === "coach" ? "/coach" : "/dashboard";
        return <Navigate to={home} replace />
    }
    return children;
}