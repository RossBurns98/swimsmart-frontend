import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { getSwimmers, getSwimmerSessions } from "../api/coach";

export default function Coach() {
  const [swimmers, setSwimmers] = useState([]);
  const [stats, setStats] = useState({}); // { [id]: { lastDate, vol14d } }
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    getSwimmers()
      .then(async (list) => {
        if (!mounted) return;
        setSwimmers(list || []);

        // For small lists this parallel fetch is fine.
        const entries = await Promise.all(
          (list || []).map(async (u) => {
            const sessions = await getSwimmerSessions(u.id, { limit: 100, pace_per_m: 100 });
            // last 14 days volume
            const since = new Date(); since.setDate(since.getDate() - 14);
            const recent = sessions.filter(s => new Date(s.date) >= since);
            const vol14d = recent.reduce((sum, s) => sum + (s.total_distance_m || 0), 0);
            const lastDate = sessions.sort((a,b) => new Date(b.date)-new Date(a.date))[0]?.date || null;
            return [u.id, { vol14d, lastDate }];
          })
        );

        if (mounted) setStats(Object.fromEntries(entries));
      })
      .catch((e) => setErr(e?.response?.data?.detail || e.message))
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, []);

  const displayName = (u) => u?.username || u?.email;

  if (loading) return <div className="p-6">Loading swimmers…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Coach Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Last 14 days snapshot.</p>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="text-left border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="py-2 px-3">Swimmer</th>
              <th className="py-2 px-3">Last session</th>
              <th className="py-2 px-3">Volume (14d)</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {swimmers.map((u) => {
              const st = stats[u.id] || {};
              const name = u?.username || u?.email; // username primary, email fallback
              return (
                <tr key={u.id} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="py-2 px-3">{name}</td>
                  <td className="py-2 px-3">{st.lastDate ? format(new Date(st.lastDate), "dd MMM yyyy") : "-"}</td>
                  <td className="py-2 px-3">{(st.vol14d || 0).toLocaleString()} m</td>
                  <td className="py-2 px-3">
                    <button
                      className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700"
                      onClick={() => navigate(`/coach/swimmers/${u.id}`, { state: { swimmer: u } })}
                    >
                      View sessions
                    </button>
                  </td>
                </tr>
              );
            })}
            {swimmers.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-zinc-500">No swimmers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
