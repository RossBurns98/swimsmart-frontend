import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginRequest } from "../api/auth";
import { decodeJwt } from "../utils/jwt";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { login } = useAuth(); // from AuthContext (Day 1)
  const navigate = useNavigate();
  const location = useLocation(); // used for redirecting back if we came from a protected route

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await loginRequest(email, password);
      const token = res?.access_token;
      if (!token) {
        throw new Error("No access_token returned from server.");
      }

      // Prefer explicit role from API response, otherwise try decode from JWT payload
      let role = res?.role || null;
      if (!role) {
        const payload = decodeJwt(token);
        role = payload?.role || "swimmer";
      }

      // Save token+role to context/localStorage
      login(token, role);

      // Decide where to go:
      // 1) If we came from a protected route, go back there
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
        return;
      }
      // 2) Else go to role home
      navigate(role === "coach" ? "/coach" : "/dashboard", { replace: true });
    } catch (err) {
      // Friendly message
      const msg = err?.response?.data?.message || err?.message || "Login failed";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-zinc-500 mt-1">Use your SwimSmart credentials.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1" htmlFor="password">Password</label>
            <div className="flex gap-2">
              <input
                id="password"
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="text-sm text-red-600" role="alert">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 text-sm font-medium shadow-sm disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Small helper for testing */}
        <details className="mt-4 text-xs text-zinc-500">
          <summary>Having trouble?</summary>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Make sure the backend is running at <code>VITE_API_BASE_URL</code>.</li>
            <li>Open DevTools → Network → check the <code>/auth/login</code> request and response.</li>
          </ul>
        </details>
      </div>
    </div>
  );
}
