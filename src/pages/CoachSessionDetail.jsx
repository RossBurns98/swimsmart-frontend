// src/pages/CoachSessionDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getSwimmerSession } from "../api/coach";
import { format } from "date-fns";
import RpePerRepLine from "../components/charts/RpePerRepLine";
import SetRepPaceLine from "../components/charts/SetRepPaceLine";
import StrokePie from "../components/charts/StrokePie";
import { formatSeconds } from "../utils/time";
import api from "../api/client";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

export default function CoachSessionDetail() {
  const { id, sid } = useParams(); // /coach/swimmers/:id/sessions/:sid
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [selectedSetIdx, setSelectedSetIdx] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getSwimmerSession(id, sid)
      .then((d) => { if (mounted) { setDetail(d); setSelectedSetIdx(0); } })
      .catch((e) => setErr(e?.response?.data?.detail || e.message))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [id, sid]);

  const rpePerRep = useMemo(() => {
    const pts = [];
    (detail?.sets || []).forEach((s, si) => {
      const rpes = Array.isArray(s.rpe) ? s.rpe : [];
      rpes.forEach((v, ri) => {
        if (typeof v === "number") pts.push({ x: `S${si + 1} R${ri + 1}`, rpe: v });
      });
    });
    return pts;
  }, [detail]);

  const strokeData = useMemo(() => {
    const totals = {};
    (detail?.sets || []).forEach((s) => {
      const repsCount = typeof s.reps === "number"
        ? s.reps
        : (Array.isArray(s.rep_times_sec) ? s.rep_times_sec.length : 0);
      const m = Number(s.distance_m) * Number(repsCount || 0) || 0;
      const stroke = s.stroke || "unknown";
      totals[stroke] = (totals[stroke] || 0) + m;
    });
    return Object.entries(totals).map(([stroke, distance_m]) => ({ stroke, distance_m }));
  }, [detail]);

  const selectedSet = useMemo(() => {
    const arr = detail?.sets || [];
    if (!arr.length) return null;
    const i = Math.min(Math.max(0, selectedSetIdx), arr.length - 1);
    return arr[i];
  }, [detail, selectedSetIdx]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!detail) return <div className="p-6">Not found.</div>;

  const dateStr = detail.date ? format(new Date(detail.date), "EEE dd MMM yyyy") : "";
  const total_m = detail?.totals?.total_distance_m ?? 0;
  const avg_rpe = detail?.totals?.avg_rpe ?? "-";

  async function downloadCsv() {
    try {
      const token = localStorage.getItem("token");
      const url = `${API_BASE}/export/session/${sid}.csv`;
      const resp = await api.get(url, {
        responseType: "blob",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const blob = new Blob([resp.data], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `session-${sid}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.detail || e.message || "Failed to download CSV");
    }
  }

  function avg(arr) {
    if (!arr?.length) return null;
    const nums = arr.filter((x) => typeof x === "number");
    if (!nums.length) return null;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }

  // fixed card height so the 2×2 grid lines up perfectly
  const CARD_HEIGHT = 360;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* FIX: explicit link to swimmer’s sessions list; replace to avoid the loop */}
          <Link
            to={`/coach/swimmers/${id}`}
            replace
            className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 cursor-pointer"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Session on {dateStr}</h1>
            <p className="text-sm text-zinc-500 mt-1">{detail.notes || "No notes"}</p>
          </div>
        </div>
        <button
          className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm cursor-pointer"
          onClick={downloadCsv}
        >
          Download CSV
        </button>
      </header>

      {/* Inline metrics */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label="Total distance" value={`${total_m} m`} />
        <SummaryCard label="Avg RPE" value={`${avg_rpe}`} />
      </div>

      {/* 2×2 equal grid of cards */}
      <div
        className="gap-6"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}
      >
        {/* Card 1: Session composition */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4" style={{ minHeight: CARD_HEIGHT }}>
          <h2 className="font-medium mb-3">Session composition</h2>
          <div className="overflow-x-auto" style={{ maxHeight: CARD_HEIGHT - 70 }}>
            <table className="w-full text-sm">
              <thead className="text-left border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-950">
                <tr>
                  <th className="py-2 px-3 w-10">#</th>
                  <th className="py-2 px-3">Set</th>
                  <th className="py-2 px-3">Avg pace /100m</th>
                  <th className="py-2 px-3">Avg RPE</th>
                </tr>
              </thead>
              <tbody>
                {(detail.sets || []).map((s, i) => {
                  const repsCount = typeof s.reps === "number"
                    ? s.reps
                    : (Array.isArray(s.rep_times_sec) ? s.rep_times_sec.length : 0);
                  const prescription = `${repsCount} × ${s.distance_m}m ${s.stroke}${s.interval_sec ? ` @ ${formatSeconds(s.interval_sec)}` : ""}`;

                  const times = Array.isArray(s.rep_times_sec) ? s.rep_times_sec.filter((n) => typeof n === "number") : [];
                  const a = avg(times);
                  const pace100Sec = a && s.distance_m ? (a / Number(s.distance_m)) * 100 : null;
                  const avgRpe = Array.isArray(s.rpe) && s.rpe.length
                    ? (s.rpe.reduce((x, y) => x + y, 0) / s.rpe.length).toFixed(1)
                    : s.rpe ?? "-";

                  return (
                    <tr key={i} className="border-b border-zinc-100 dark:border-zinc-900 align-top">
                      <td className="py-2 px-3">{i + 1}</td>
                      <td className="py-2 px-3">
                        <div className="font-medium">{prescription}</div>
                        {s.name && <div className="text-xs text-zinc-500">({s.name})</div>}
                      </td>
                      <td className="py-2 px-3">
                        {pace100Sec ? `${Math.floor(pace100Sec / 60)}:${String(Math.round(pace100Sec % 60)).padStart(2, "0")} /100m` : "-"}
                      </td>
                      <td className="py-2 px-3">{avgRpe}</td>
                    </tr>
                  );
                })}
                {(!detail.sets || detail.sets.length === 0) && (
                  <tr><td colSpan={4} className="py-6 text-center text-zinc-500">No sets.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 2: Per-set pace line */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4" style={{ minHeight: CARD_HEIGHT }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium">Set pace (sec per rep)</h2>
            <div className="flex items-center gap-2">
              <label className="text-sm">Choose set:</label>
              <select
                className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-sm bg-transparent cursor-pointer"
                value={selectedSetIdx}
                onChange={(e) => setSelectedSetIdx(Number(e.target.value))}
              >
                {(detail?.sets || []).map((s, i) => {
                  const repsCount = typeof s.reps === "number"
                    ? s.reps
                    : (Array.isArray(s.rep_times_sec) ? s.rep_times_sec.length : 0);
                  return (
                    <option key={i} value={i}>{repsCount}×{s.distance_m}m {s.stroke}</option>
                  );
                })}
              </select>
            </div>
          </div>
          <SetRepPaceLine setObj={selectedSet} height={CARD_HEIGHT - 90} xLabel="Rep" yLabel="Seconds" />
        </div>

        {/* Card 3: Stroke pie */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4" style={{ minHeight: CARD_HEIGHT }}>
          <StrokePie data={strokeData} title="Stroke Mix (session)" valueKey="distance_m" height={CARD_HEIGHT - 40} />
        </div>

        {/* Card 4: RPE per rep */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4" style={{ minHeight: CARD_HEIGHT }}>
          <h2 className="font-medium mb-3">RPE per rep</h2>
          <RpePerRepLine data={rpePerRep} height={CARD_HEIGHT - 60} xLabel="Rep" yLabel="RPE" />
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
