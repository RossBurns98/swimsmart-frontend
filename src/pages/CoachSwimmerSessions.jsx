import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { getSwimmerSessions, getSwimmers } from "../api/coach";
import SessionsTable from "../components/tables/SessionsTable";

export default function CoachSwimmerSessions() {
  const { id } = useParams();
  const location = useLocation();
  const fromState = location.state?.swimmer || null;

  const [swimmer, setSwimmer] = useState(fromState); // { id, username, email }
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  // If navigated directly without state, fetch swimmers and find this id
  useEffect(() => {
    let mounted = true;
    if (!swimmer) {
      getSwimmers()
        .then((list) => {
          if (!mounted) return;
          const found = (list || []).find((s) => String(s.id) === String(id));
          if (found) setSwimmer(found);
        })
        .catch(() => {});
    }
    return () => { mounted = false; };
  }, [id, swimmer]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getSwimmerSessions(id, { limit: 100, pace_per_m: 100 })
      .then((data) => mounted && setRows(Array.isArray(data) ? data : []))
      .catch((e) => setErr(e?.response?.data?.detail || e.message))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [id]);

  const filtered = useMemo(() => {
    return rows.filter(r => !q || (r.notes || "").toLowerCase().includes(q.toLowerCase()));
  }, [rows, q]);

  const displayName = swimmer?.username || swimmer?.email || `ID ${id}`;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Swimmer Sessions</h1>
        <p className="text-sm text-zinc-500 mt-1">Viewing swimmer: {displayName}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
          placeholder="Search notes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
        <h2 className="font-medium mb-3">Sessions</h2>
        {loading ? (
          <div className="text-sm text-zinc-500">Loading swimmer…</div>
        ) : err ? (
          <div className="text-sm text-red-600">{err}</div>
        ) : (
          <SessionsTable rows={filtered} />
        )}
      </div>
    </div>
  );
}
