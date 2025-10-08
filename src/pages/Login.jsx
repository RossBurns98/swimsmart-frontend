import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginRequest } from "../api/auth";
import { decodeJwt } from "../utils/jwt";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await loginRequest(identifier, password);
      const token = res?.access_token;
      if (!token) throw new Error("No access_token returned from server.");
      let role = res?.user?.role || decodeJwt(token)?.role || "swimmer";
      const username = res?.user?.username || null;
      if (!role) role = decodeJwt(token)?.role || "swimmer";
      login(token, role, username);
      const from = location.state?.from?.pathname;
      navigate(from || (role === "coach" ? "/coach" : "/dashboard"), { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Login failed";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-zinc-500 mt-1">Use your username or email.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm mb-1" htmlFor="id">Username or Email</label>
            <input
              id="id"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="username or email"
              autoComplete="username"
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

          {errorMsg && <div className="text-sm text-red-600" role="alert">{errorMsg}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 text-sm font-medium shadow-sm disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div className="text-xs text-zinc-500 mt-3">
            No account? <a className="underline" href="/signup">Create one</a>
          </div>
        </form>
      </div>
    </div>
  );
}
