import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // <-- correct import

export default function Home() {
  const { token, role } = useAuth();

  // If logged in, redirect based on role
  if (token) {
    return <Navigate to={role === "coach" ? "/coach" : "/dashboard"} replace />;
  }

  // If not logged in, show landing page
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Welcome to SwimSmart</h1>
      <p className="text-sm text-zinc-600 mt-2">Day 1 scaffold ready.</p>
    </div>
  );
}
