import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signupRequest } from "../api/auth";

export default function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("swimmer"); // swimmer | coach
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setOkMsg("");
    setLoading(true);
    try {
      await signupRequest({ email, password, role, username: username || undefined });
      setOkMsg("Account created. You can now sign in.");
      // send them to login after a short moment
      setTimeout(() => navigate("/login"), 400);
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Sign up failed";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="text-sm text-zinc-500 mt-1">Choose swimmer or coach.</p>

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
            <label className="block text-sm mb-1" htmlFor="username">Username (optional)</label>
            <input
              id="username"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="e.g. swimtest"
            />
          </div>

          <div>
            <label className="block text-sm mb-1" htmlFor="role">Role</label>
            <select
              id="role"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="swimmer">Swimmer</option>
              <option value="coach">Coach</option>
            </select>
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
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm"
                onClick={() => setShowPw((s) => !s)}
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {errorMsg && <div className="text-sm text-red-600" role="alert">{errorMsg}</div>}
          {okMsg && <div className="text-sm text-emerald-600" role="status">{okMsg}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 text-sm font-medium shadow-sm disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create account"}
          </button>

          <div className="text-xs text-zinc-500 mt-2">
            Already have an account? <a className="underline" href="/login">Sign in</a>
          </div>
        </form>
      </div>
    </div>
  );
}
