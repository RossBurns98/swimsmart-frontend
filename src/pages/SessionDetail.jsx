import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getSession, getSessionAnalytics } from "../api/sessions";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function SessionDetailPage() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([getSession(id), getSessionAnalytics(id, 100)])
      .then(([d, a]) => {
        if (!mounted) return;
        setDetail(d);
        setAnalytics(a);
      })
      .catch((e) => setErr(e?.response?.data?.detail || e.message))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [id]);

  const repSeries = useMemo(() => {
    // If your detail.sets includes rep times like { reps: [{ time_sec: 75 }, ...] }
    const pts = [];
    (detail?.sets || []).forEach((s, si) => {
      (s.reps || []).forEach((r, ri) => {
        const val = r.time_sec ?? r.rep_time_sec ?? null;
        if (typeof val === "number") {
          pts.push({ x: `S${si+1} R${ri+1}`, sec: val });
        }
      });
    });
    return pts;
  }, [detail]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!detail) return <div className="p-6">Not found.</div>;

  const dateStr = detail.date ? format(new Date(detail.date), "EEE dd MMM yyyy") : "";
  const sum = analytics?.summary;

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Session on {dateStr}</h1>
          <p className="text-sm text-zinc-500 mt-1">{detail.notes || "No notes"}</p>
        </div>
        <a
          className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm"
          href={`${API_BASE}/export/session/${id}.csv`}
        >
          Download CSV
        </a>
      </header>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <SummaryCard label="Total distance" value={`${sum?.total_distance_m ?? detail?.totals?.total_distance_m ?? 0} m`} />
        <SummaryCard label="Avg pace" value={sum?.avg_pace_formatted ?? "-"} />
        <SummaryCard label="Avg RPE" value={`${detail?.totals?.avg_rpe ?? "-"}`} />
        <SummaryCard label="Best set" value={analytics?.best_set?.name || analytics?.best_set?.label || "-"} />
      </div>

      {/* Sets table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
        <h2 className="font-medium mb-3">Sets</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-2 px-3">#</th>
                <th className="py-2 px-3">Description</th>
                <th className="py-2 px-3">Distance</th>
                <th className="py-2 px-3">Reps</th>
                <th className="py-2 px-3">Stroke</th>
                <th className="py-2 px-3">RPE</th>
              </tr>
            </thead>
            <tbody>
              {(detail.sets || []).map((s, i) => (
                <tr key={i} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="py-2 px-3">{i + 1}</td>
                  <td className="py-2 px-3">{s.name || s.label || "-"}</td>
                  <td className="py-2 px-3">{s.distance_m ?? "-"}</td>
                  <td className="py-2 px-3">{s.reps?.length ?? s.reps ?? "-"}</td>
                  <td className="py-2 px-3">{s.stroke || "-"}</td>
                  <td className="py-2 px-3">{Array.isArray(s.rpe) ? avg(s.rpe).toFixed(1) : (s.rpe ?? "-")}</td>
                </tr>
              ))}
              {(!detail.sets || detail.sets.length === 0) && (
                <tr><td colSpan={6} className="py-6 text-center text-zinc-500">No sets.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rep times chart */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
        <h2 className="font-medium mb-3">Rep Times (sec)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={repSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sec" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-lg font-medium mt-1">{value}</div>
    </div>
  );
}

function avg(arr) {
  if (!arr?.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
