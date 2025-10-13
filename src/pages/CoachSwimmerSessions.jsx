import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { getSwimmerSessions, getSwimmers } from "../api/coach";
import SessionsTable from "../components/tables/SessionsTable";
import { format } from "date-fns";
import PaceLine from "../components/charts/PaceLine";
import RpeBar from "../components/charts/RpeBar";
import StrokePie from "../components/charts/StrokePie";

export default function CoachSwimmerSessions() {
  const { id } = useParams();
  const location = useLocation();
  const fromState = location.state?.swimmer || null;

  const [swimmer, setSwimmer] = useState(fromState);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

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
    setErr("");
    getSwimmerSessions(id, { limit: 200, pace_per_m: 100 })
      .then((data) => mounted && setRows(Array.isArray(data) ? data : []))
      .catch((e) => setErr(e?.response?.data?.detail || e.message))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [id]);

  const filtered = useMemo(() => {
    return (rows || []).filter(r => !q || (r.notes || "").toLowerCase().includes(q.toLowerCase()));
  }, [rows, q]);

  const paceData = useMemo(() => {
    return filtered
      .map(r => {
        const per100 =
          typeof r.avg_pace_sec_per === "number" &&
          typeof r.pace_basis_m === "number" &&
          r.pace_basis_m > 0
            ? (r.avg_pace_sec_per * 100) / r.pace_basis_m
            : null;
        return {
          dateLabel: format(new Date(r.date), "dd MMM"),
          pace_per_100: per100,
        };
      })
      .filter(d => typeof d.pace_per_100 === "number");
  }, [filtered]);

  const rpeBuckets = useMemo(() => {
    const buckets = { "1-3": 0, "4-6": 0, "7-10": 0 };
    filtered.forEach(r => {
      const v = typeof r.avg_rpe === "number" ? Math.floor(r.avg_rpe) : null;
      if (v == null) return;
      if (v <= 3) buckets["1-3"] += 1;
      else if (v <= 6) buckets["4-6"] += 1;
      else buckets["7-10"] += 1;
    });
    return Object.entries(buckets).map(([bucket, count]) => ({ bucket, count }));
  }, [filtered]);

  // Stroke mix % across this swimmer’s visible sessions
  const strokeMixPct = useMemo(() => {
    const totals = {};
    (filtered || []).forEach((r) => {
      (r.sets || []).forEach((s) => {
        const repsCount = typeof s.reps === "number"
          ? s.reps
          : (Array.isArray(s.rep_times_sec) ? s.rep_times_sec.length : 0);
        const m = Number(s.distance_m) * Number(repsCount || 0) || 0;
        const stroke = s.stroke || "unknown";
        totals[stroke] = (totals[stroke] || 0) + m;
      });
    });
    const grand = Object.values(totals).reduce((a, b) => a + b, 0) || 0;
    return grand > 0
      ? Object.entries(totals).map(([stroke, m]) => ({ stroke, percent: (m / grand) * 100 }))
      : [];
  }, [filtered]);

  const displayName = swimmer?.username || swimmer?.email || `ID ${id}`;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Swimmer Overview</h1>
        <p className="text-sm text-zinc-500 mt-1">Viewing swimmer: {displayName}</p>
      </header>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
          placeholder="Search notes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Two equal columns: LEFT sessions+pie, RIGHT pace+RPE */}
      <div className="gap-6 items-start" style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {/* LEFT column */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 relative z-10">
            <h2 className="font-medium mb-3">Sessions</h2>
            {loading ? (
              <div className="text-sm text-zinc-500">Loading swimmer…</div>
            ) : err ? (
              <div className="text-sm text-red-600">{err}</div>
            ) : (
              <SessionsTable rows={filtered} pageSize={12} />
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
            <StrokePie
              data={strokeMixPct}
              valueKey="percent"
              title="Stroke Mix (all sessions)"
              height={300}
              percentFormat
            />
          </div>
        </div>

        {/* RIGHT column */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
            <PaceLine title="Pace vs Date" data={paceData} height={300} xLabel="Date" yLabel="sec / 100m" />
          </div>
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
            <RpeBar title="RPE Distribution" data={rpeBuckets} height={300} xLabel="Bucket" yLabel="Sessions" />
          </div>
        </div>
      </div>
    </div>
  );
}
