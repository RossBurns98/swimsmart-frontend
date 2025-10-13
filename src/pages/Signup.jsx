import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupRequest } from "../api/auth";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("swimmer");
  const [inviteCode, setInviteCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const navigate = useNavigate();

  const ghostBtn = "inline-flex items-center justify-center rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900";
  const primaryBtn = "inline-flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 text-sm font-medium shadow-sm hover:opacity-90 w-full";

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg(""); setOkMsg("");
    setLoading(true);
    try {
      await signupRequest({ email, password, role, username: username || undefined, invite_code: inviteCode });
      setOkMsg("Account created. You can now sign in.");
      setTimeout(() => navigate("/login"), 800);
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || err?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full" style={{ maxWidth: 480 }}>
        <div className="text-center mb-6">
          <div className="text-3xl font-bold">🏊‍♂️ SwimSmart</div>
          <div className="text-sm text-zinc-500 mt-1">Create your account</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="w-full min-w-0 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1" htmlFor="username">Username (optional)</label>
              <input
                id="username"
                type="text"
                className="w-full min-w-0 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ross_swims"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Role</label>
                <select
                  className="w-full min-w-0 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="swimmer">Swimmer</option>
                  <option value="coach">Coach</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Invite code</label>
                <input
                  className="w-full min-w-0 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="enter code"
                  required
                />
              </div>
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
                  autoComplete="new-password"
                  required
                />
                <button type="button" className={`${ghostBtn} shrink-0`} onClick={() => setShowPw(s => !s)}>
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {errorMsg && <div className="text-sm text-red-600" role="alert">{errorMsg}</div>}
            {okMsg && <div className="text-sm text-green-600">{okMsg}</div>}

            <button type="submit" disabled={loading} className={primaryBtn}>
              {loading ? "Creating…" : "Create account"}
            </button>
          </form>

          <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-4 text-center">
            Already have an account?{" "}
            <Link to="/login" className="underline hover:opacity-80">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
