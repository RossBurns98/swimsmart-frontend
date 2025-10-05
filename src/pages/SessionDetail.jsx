import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getSession, getSessionAnalytics } from "../api/sessions";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import RpeBar from "../components/charts/RpeBar";
import StrokeDonut from "../components/charts/StrokeDonut";
import { toStrokeDonutData, toRpeBuckets } from "../utils/analytics";
import api from "../api/client";

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

  // Rep line: tolerant of multiple field names
  const repSeries = useMemo(() => {
    const pts = [];
    (detail?.sets || []).forEach((s, si) => {
      const times =
        (Array.isArray(s.rep_times_sec) && s.rep_times_sec) ||
        (Array.isArray(s.rep_times) && s.rep_times) ||
        (Array.isArray(s.times_sec) && s.times_sec) ||
        (Array.isArray(s.times) && s.times) ||
        [];
      const rpes =
        (Array.isArray(s.rpe) && s.rpe) ||
        (Array.isArray(s.rpe_array) && s.rpe_array) ||
        [];
      times.forEach((t, ri) => {
        if (typeof t === "number") {
          pts.push({
            x: `S${si + 1} R${ri + 1}`,
            sec: t,
            rpe: typeof rpes[ri] === "number" ? rpes[ri] : null,
          });
        }
      });
    });
    return pts;
  }, [detail]);

  const rpeData = useMemo(() => toRpeBuckets(detail), [detail]);

  // stroke mix (analytics or fallback from sets)
  const strokeData = useMemo(() => {
    const primary = toStrokeDonutData(analytics?.by_stroke);
    if (primary && primary.length > 0) return primary;
    const totals = {};
    (detail?.sets || []).forEach((s) => {
      const stroke = (s.stroke || "unknown").toLowerCase();
      const distPerRep = typeof s.distance_m === "number" ? s.distance_m : 0;
      const reps =
        (typeof s.reps === "number" ? s.reps : null) ??
        (Array.isArray(s.rep_times_sec) ? s.rep_times_sec.length : null) ??
        (Array.isArray(s.rep_times) ? s.rep_times.length : null) ??
        0;
      const total = distPerRep * (reps || 0);
      if (total > 0) totals[stroke] = (totals[stroke] || 0) + total;
    });
    return Object.entries(totals).map(([stroke, distance_m]) => ({ stroke, distance_m }));
  }, [analytics, detail]);

  async function downloadCsv() {
    try {
      const res = await api.get(`/export/session/${id}.csv`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = detail?.date ? format(new Date(detail.date), "yyyy-MM-dd") : "session";
      a.href = url;
      a.download = `session-${id}-${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.detail || "CSV download failed");
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (err)     return <div className="p-6 text-red-600">{err}</div>;
  if (!detail) return <div className="p-6">Not found.</div>;

  const dateStr = detail.date ? format(new Date(detail.date), "EEE dd MMM yyyy") : "";
  const totalDistance =
    analytics?.summary?.total_distance_m ?? detail?.totals?.total_distance_m ?? 0;
  const avgPace = analytics?.summary?.avg_pace_formatted ?? "-";
  const avgRpe =
    typeof detail?.totals?.avg_rpe === "number"
      ? detail.totals.avg_rpe.toFixed(2)
      : detail?.totals?.avg_rpe ?? "-";
  const bestSet = analytics?.best_set?.name || analytics?.best_set?.label || "-";

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Session on {dateStr}</h1>
          <p className="text-sm text-zinc-500 mt-1">{detail.notes || "No notes"}</p>
        </div>
        <button
          className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm"
          onClick={downloadCsv}
        >
          Download CSV
        </button>
      </header>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <SummaryCard label="Total distance" value={`${totalDistance} m`} />
        <SummaryCard label="Avg pace" value={avgPace} />
        <SummaryCard label="Avg RPE" value={`${avgRpe}`} />
        <SummaryCard label="Best set" value={bestSet} />
      </div>

      {/* Rep times chart */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
        <h2 className="font-medium mb-3">Rep Times (sec)</h2>
        <div className="overflow-x-auto">
          <div style={{ width: 800, height: 260 }}>
            <LineChart width={800} height={260} data={repSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sec" dot={false} />
            </LineChart>
          </div>
        </div>
      </div>

      {/* Analytics charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ensure each chart has a measurable box */}
        <div className="h-64 w-full min-w-[320px]">
          <RpeBar data={rpeData} />
        </div>
        <div className="h-64 w-full min-w-[320px]">
          <StrokeDonut data={strokeData} />
        </div>
      </div>

      {/* TEMP: Chart debug (you can delete once you see charts) */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
        <h3 className="font-medium mb-2 text-sm">Chart debug</h3>
        <pre className="text-xs whitespace-pre-wrap break-words">
{JSON.stringify(
  {
    repSeries_len: (repSeries || []).length,
    first3RepPts: (repSeries || []).slice(0, 3),
    rpeData,
    strokeData
  },
  null,
  2
)}
        </pre>
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
