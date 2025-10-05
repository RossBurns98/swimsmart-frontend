import { useEffect, useMemo, useState } from "react";
import { listMySessions } from "../api/sessions";   // <-- use my-sessions
import SessionsTable from "../components/tables/SessionsTable";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { role } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    // Swimmer dashboard = ONLY my sessions
    const fetcher = listMySessions;

    fetcher({ limit: 50, pace_per_m: 100 })
      .then((data) => mounted && setRows(Array.isArray(data) ? data : []))
      .catch((e) => setErr(e?.response?.data?.detail || e.message))
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, [role]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (q && !(r.notes || "").toLowerCase().includes(q.toLowerCase())) return false;
      if (dateFrom && new Date(r.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(r.date) > new Date(dateTo)) return false;
      return true;
    });
  }, [rows, q, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Swimmer Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Your recent sessions</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
          placeholder="Search notes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          type="date"
          className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <input
          type="date"
          className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
        <h2 className="font-medium mb-3">Sessions</h2>
        {loading ? (
          <div className="text-sm text-zinc-500">Loading…</div>
        ) : err ? (
          <div className="text-sm text-red-600">{err}</div>
        ) : (
          <SessionsTable rows={filtered} />
        )}
      </div>
    </div>
  );
}
