import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getSwimmerSessions, getSwimmers, getSwimmerSession } from "../api/coach";
import SessionsTable from "../components/tables/SessionsTable";
import { format } from "date-fns";
import PaceLine from "../components/charts/PaceLine";
import RpeBar from "../components/charts/RpeBar";
import StrokePie from "../components/charts/StrokePie";

export default function CoachSwimmerSessions() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const fromState = location.state?.swimmer || null;

  const [swimmer, setSwimmer] = useState(fromState); // { id, username, email }
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  // Stroke mix percent across this swimmer's visible sessions
  const [strokeMixPct, setStrokeMixPct] = useState([]);
  const [mixLoading, setMixLoading] = useState(false);

  // unified equal card height so grid rows align perfectly
  const CARD_HEIGHT = 360;

  // ---- fetch swimmer identity (if deep-linked) ----
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

  // ---- fetch swimmer's sessions ----
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

  // ---- filters ----
  const filtered = useMemo(() => {
    return (rows || []).filter(r => !q || (r.notes || "").toLowerCase().includes(q.toLowerCase()));
  }, [rows, q]);

  // ---- pace vs date for this swimmer ----
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

  // ---- RPE buckets using FLOOR (6.99 => 6) ----
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

  // ---- Build stroke mix % (derive from set details per session) ----
  useEffect(() => {
    let cancelled = false;

    async function buildStrokeMix() {
      setMixLoading(true);
      try {
        const ids = (filtered || []).map((r) => r.id).slice(0, 40); // cap to keep it light
        const totals = {}; // stroke -> meters

        // Fetch each session in coach context to access sets
        const details = await Promise.all(ids.map((sid) => getSwimmerSession(id, sid).catch(() => null)));

        details.forEach((d) => {
          (d?.sets || []).forEach((s) => {
            const repsCount =
              typeof s.reps === "number"
                ? s.reps
                : (Array.isArray(s.rep_times_sec) ? s.rep_times_sec.length : 0);
            const m = Number(s.distance_m) * Number(repsCount || 0) || 0;
            const stroke = s.stroke || "unknown";
            totals[stroke] = (totals[stroke] || 0) + m;
          });
        });

        const grand = Object.values(totals).reduce((a, b) => a + b, 0) || 0;
        const pctData =
          grand > 0
            ? Object.entries(totals)
                .map(([stroke, m]) => ({ stroke, percent: (m / grand) * 100 }))
                .sort((a, b) => b.percent - a.percent)
            : [];

        if (!cancelled) setStrokeMixPct(pctData);
      } finally {
        if (!cancelled) setMixLoading(false);
      }
    }

    if (filtered.length) buildStrokeMix();
    else setStrokeMixPct([]);

    return () => { cancelled = true; };
  }, [filtered, id]);

  const displayName = swimmer?.username || swimmer?.email || `ID ${id}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Swimmer Overview</h1>
          <p className="text-sm text-zinc-500 mt-1">Viewing swimmer: {displayName}</p>
        </div>

        {/* Back to coach list */}
        <button
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 cursor-pointer"
          onClick={() => window.history.back()}
        >
          ← Back
        </button>
      </header>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
          placeholder="Search notes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="sm:col-span-2" />
      </div>

      {/* 2×2 equal grid of cards (like swimmer dashboard) */}
      <div
        className="gap-6"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}
      >
        {/* LEFT column — top: Sessions (fixed height with inner scroll) */}
        <div
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4"
          style={{ minHeight: CARD_HEIGHT }}
        >
          <h2 className="font-medium mb-3">Sessions</h2>
          {loading ? (
            <div className="text-sm text-zinc-500">Loading swimmer…</div>
          ) : err ? (
            <div className="text-sm text-red-600">{err}</div>
          ) : (
            <div style={{ maxHeight: CARD_HEIGHT - 70, overflow: "auto" }}>
              <SessionsTable
                rows={filtered}
                onRowClick={(r) => navigate(`/coach/swimmers/${id}/sessions/${r.id}`)}
                pageSize={12}
              />
            </div>
          )}
        </div>

        {/* RIGHT column — top: Pace line */}
        <div
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4"
          style={{ minHeight: CARD_HEIGHT }}
        >
          <PaceLine
            title="Pace vs Date"
            data={paceData}
            height={CARD_HEIGHT - 40}
            xLabel="Date"
            yLabel="sec / 100m"
          />
        </div>

        {/* LEFT column — bottom: Stroke pie (%) */}
        <div
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4"
          style={{ minHeight: CARD_HEIGHT }}
        >
          <StrokePie
            data={strokeMixPct}
            valueKey="percent"
            title="Stroke Mix (all sessions)"
            height={CARD_HEIGHT - 40}
            percentFormat
          />
          {mixLoading && <div className="mt-2 text-xs text-zinc-500">Calculating…</div>}
        </div>

        {/* RIGHT column — bottom: RPE distribution */}
        <div
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4"
          style={{ minHeight: CARD_HEIGHT }}
        >
          <RpeBar
            title="RPE Distribution"
            data={rpeBuckets}
            height={CARD_HEIGHT - 40}
            xLabel="Bucket"
            yLabel="Sessions"
          />
        </div>
      </div>
    </div>
  );
}
