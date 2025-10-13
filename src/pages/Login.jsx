import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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

  const ghostBtn = "inline-flex items-center justify-center rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900";
  const primaryBtn = "inline-flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 text-sm font-medium shadow-sm hover:opacity-90 w-full";

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await loginRequest(identifier, password);
      const token = res?.access_token;
      if (!token) throw new Error("No access_token returned from server.");
      const role = res?.user?.role || decodeJwt(token)?.role || "swimmer";
      login(token, role, res?.user?.username || null);
      const from = location.state?.from?.pathname;
      navigate(from || (role === "coach" ? "/coach" : "/dashboard"), { replace: true });
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full" style={{ maxWidth: 480 }}>
        <div className="text-center mb-6">
          <div className="text-3xl font-bold">🏊‍♂️ SwimSmart</div>
          <div className="text-sm text-zinc-500 mt-1">Sign in to continue</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1" htmlFor="id">Username or Email</label>
              <input
                id="id"
                className="w-full min-w-0 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
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
                  className="flex-1 min-w-0 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className={`${ghostBtn} shrink-0`}
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {errorMsg && <div className="text-sm text-red-600" role="alert">{errorMsg}</div>}

            <button type="submit" disabled={loading} className={primaryBtn}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-4 text-center">
            New here?{" "}
            <Link to="/signup" className="underline hover:opacity-80">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
