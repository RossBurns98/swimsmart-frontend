import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listMySessions, getSessionAnalytics, getSession } from "../api/sessions";
import SessionsTable from "../components/tables/SessionsTable";
import PaceLine from "../components/charts/PaceLine";
import RpeBar from "../components/charts/RpeBar";
import StrokePie from "../components/charts/StrokePie";
import Button from "../components/ui/Button";
import { format } from "date-fns";

export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [strokeMixPct, setStrokeMixPct] = useState([]);
  const [mixLoading, setMixLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    listMySessions({ limit: 200, pace_per_m: 100 })
      .then((data) => mounted && setRows(Array.isArray(data) ? data : []))
      .catch((e) => setErr(e?.response?.data?.detail || e.message))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    return (rows || []).filter((r) => {
      if (q && !(r.notes || "").toLowerCase().includes(q.toLowerCase())) return false;
      if (dateFrom && new Date(r.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(r.date) > new Date(dateTo)) return false;
      return true;
    });
  }, [rows, q, dateFrom, dateTo]);

  const paceData = useMemo(() => {
    return filtered
      .map((r) => {
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
      .filter((d) => typeof d.pace_per_100 === "number");
  }, [filtered]);

  const rpeBuckets = useMemo(() => {
    const buckets = { "1-3": 0, "4-6": 0, "7-10": 0 };
    filtered.forEach((r) => {
      const v = typeof r.avg_rpe === "number" ? Math.floor(r.avg_rpe) : null;
      if (v == null) return;
      if (v <= 3) buckets["1-3"] += 1;
      else if (v <= 6) buckets["4-6"] += 1;
      else buckets["7-10"] += 1;
    });
    return Object.entries(buckets).map(([bucket, count]) => ({ bucket, count }));
  }, [filtered]);

  // Build stroke mix % across visible sessions (fallback to session detail if analytics missing)
  useEffect(() => {
    let cancelled = false;

    async function buildStrokeMix() {
      try {
        setMixLoading(true);
        const ids = (filtered || []).map((r) => r.id).slice(0, 50);
        const totals = {};

        const analyticResults = await Promise.all(
          ids.map((id) => getSessionAnalytics(id, 100).catch(() => null))
        );

        let hadAnyAnalytics = false;
        analyticResults.forEach((a) => {
          const by = a?.by_stroke;
          if (!by) return;
          hadAnyAnalytics = true;
          if (Array.isArray(by)) {
            by.forEach((item) => {
              const stroke = item.stroke || item.name || "unknown";
              const m =
                item.total_distance_m ??
                item.distance_m_total ??
                item.total_m ??
                item.meters ??
                item.distance ??
                0;
              totals[stroke] = (totals[stroke] || 0) + (Number(m) || 0);
            });
          } else {
            Object.entries(by).forEach(([stroke, info]) => {
              const m =
                info?.total_distance_m ??
                info?.distance_m_total ??
                info?.total_m ??
                info?.meters ??
                info?.distance ??
                0;
              totals[stroke] = (totals[stroke] || 0) + (Number(m) || 0);
            });
          }
        });

        if (!hadAnyAnalytics) {
          const details = await Promise.all(ids.map((id) => getSession(id).catch(() => null)));
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
        }

        const grand = Object.values(totals).reduce((a, b) => a + b, 0) || 0;
        const pctData =
          grand > 0
            ? Object.entries(totals)
                .map(([stroke, m]) => ({ stroke, percent: (m / grand) * 100 }))
                .sort((a, b) => b.percent - a.percent)
            : [];

        if (!cancelled) setStrokeMixPct(pctData);
      } catch {
        if (!cancelled) setStrokeMixPct([]);
      } finally {
        if (!cancelled) setMixLoading(false);
      }
    }

    if (filtered.length) buildStrokeMix();
    else setStrokeMixPct([]);

    return () => { cancelled = true; };
  }, [filtered]);

  const CARD_HEIGHT = 360;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between relative z-20">
        <div>
          <h1 className="text-2xl font-semibold">Swimmer Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Your recent sessions</p>
        </div>
        <Button as={Link} to="/new-session">+ Add Session</Button>
      </header>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
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

      {/* 2×2 equal grid of cards */}
      <div className="gap-6" style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {/* Left / top: Sessions (fixed card height with inner scroll) */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4" style={{ minHeight: CARD_HEIGHT }}>
          <h2 className="font-medium mb-3">Sessions</h2>
          <div className="overflow-x-auto" style={{ maxHeight: CARD_HEIGHT - 70 }}>
            {loading ? (
              <div className="text-sm text-zinc-500">Loading…</div>
            ) : err ? (
              <div className="text-sm text-red-600">{err}</div>
            ) : (
              <SessionsTable
                rows={filtered}
                onRowClick={(r) => (window.location.href = `/sessions/${r.id}`)}
              />
            )}
          </div>
        </div>

        {/* Right / top: Pace line */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4" style={{ minHeight: CARD_HEIGHT }}>
          <PaceLine title="Pace vs Date" data={paceData} height={CARD_HEIGHT - 40} xLabel="Date" yLabel="sec / 100m" />
        </div>

        {/* Left / bottom: Stroke pie */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4" style={{ minHeight: CARD_HEIGHT }}>
          <StrokePie
            data={strokeMixPct}
            valueKey="percent"
            title="Stroke Mix (all sessions)"
            height={CARD_HEIGHT - 40}
            percentFormat
          />
          {mixLoading && <div className="mt-2 text-xs text-zinc-500">Calculating…</div>}
        </div>

        {/* Right / bottom: RPE bar */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4" style={{ minHeight: CARD_HEIGHT }}>
          <RpeBar title="RPE Distribution" data={rpeBuckets} height={CARD_HEIGHT - 40} xLabel="Bucket" yLabel="Sessions" />
        </div>
      </div>
    </div>
  );
}
