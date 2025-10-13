import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function TopNav() {
  const { token, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide auth buttons on auth pages
  const onAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  function goHome() {
    const home = role === "coach" ? "/coach" : "/dashboard";
    navigate(home);
  }

  function linkClass(prefix) {
    const active = location.pathname.startsWith(prefix);
    return `px-3 py-1.5 rounded-xl ${active ? "bg-zinc-100 dark:bg-zinc-900" : ""}`;
  }

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button onClick={goHome} className="text-base font-semibold">🏊‍♂️ SwimSmart</button>
          {token && (
            <nav className="hidden sm:flex gap-3 text-sm">
              <Link className={linkClass("/dashboard")} to="/dashboard">Dashboard</Link>
              {role === "coach" && (
                <Link className={linkClass("/coach")} to="/coach">Coach</Link>
              )}
              <Link className={linkClass("/export")} to="/export">Export</Link>
            </nav>
          )}
        </div>

        {/* Hide right-side auth buttons on /login and /signup */}
        {!onAuthPage && (
          <div>
            {token ? (
              <button className="px-4 py-2 rounded-xl border" onClick={logout}>Logout</button>
            ) : (
              <button className="px-4 py-2 rounded-xl border" onClick={() => navigate("/login")}>Login</button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
