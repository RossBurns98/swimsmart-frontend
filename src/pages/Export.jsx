import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getSwimmers } from "../api/coach";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

export default function ExportPage() {
  const { role } = useAuth();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [swimmerId, setSwimmerId] = useState("");
  const [swimmers, setSwimmers] = useState([]);

  useEffect(() => {
    if (role === "coach") {
      getSwimmers().then(setSwimmers).catch(() => {});
    }
  }, [role]);

  const qs = new URLSearchParams();
  if (start) qs.set("start", start);
  if (end) qs.set("end", end);
  if (role === "coach" && swimmerId) qs.set("swimmer_id", swimmerId);
  const href = `${API_BASE}/export/range.csv?${qs.toString()}`;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Export CSV</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Choose a date range{role === "coach" ? " (and optionally a swimmer)" : ""}, then download.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <label className="text-sm">
          <span className="block mb-1">Start</span>
          <input type="date" className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
            value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="block mb-1">End</span>
          <input type="date" className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
            value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>

        {role === "coach" && (
          <label className="text-sm">
            <span className="block mb-1">Swimmer (optional)</span>
            <select
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
              value={swimmerId}
              onChange={(e) => setSwimmerId(e.target.value)}
            >
              <option value="">All swimmers</option>
              {swimmers.map(s => (
                <option key={s.id} value={s.id}>{s.username || s.email}</option>
              ))}
            </select>
          </label>
        )}

        <div className="flex items-end">
          <a
            className="w-full inline-flex items-center justify-center rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm"
            href={href}
          >
            Download CSV
          </a>
        </div>
      </div>
    </div>
  );
}
