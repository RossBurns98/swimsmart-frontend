import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getSwimmerSessions, getSwimmers } from "../api/coach";
import { getSession, getSessionAnalytics } from "../api/sessions";
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

  const [swimmer, setSwimmer] = useState(fromState);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  // stroke mix
  const [mix, setMix] = useState([]);
  const [mixLoading, setMixLoading] = useState(false);

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

  // build stroke mix % (with fixed-height container in the chart component)
  useEffect(() => {
    let cancelled = false;
    async function buildMix() {
      setMixLoading(true);
      try {
        const ids = (filtered || []).map(r => r.id).slice(0, 50);
        const totals = {};
        const analytics = await Promise.all(ids.map(i => getSessionAnalytics(i, 100).catch(() => null)));

        let hadAnalytics = false;
        analytics.forEach(a => {
          const by = a?.by_stroke;
          if (!by) return;
          hadAnalytics = true;
          if (Array.isArray(by)) {
            by.forEach(item => {
              const stroke = item.stroke || item.name || "unknown";
              const m = item.total_distance_m ?? item.distance_m_total ?? item.total_m ?? item.meters ?? item.distance ?? 0;
              totals[stroke] = (totals[stroke] || 0) + (Number(m) || 0);
            });
          } else {
            Object.entries(by).forEach(([stroke, info]) => {
              const m = info?.total_distance_m ?? info?.distance_m_total ?? info?.total_m ?? info?.meters ?? info?.distance ?? 0;
              totals[stroke] = (totals[stroke] || 0) + (Number(m) || 0);
            });
          }
        });

        if (!hadAnalytics) {
          const details = await Promise.all(ids.map(i => getSession(i).catch(() => null)));
          details.forEach(d => {
            (d?.sets || []).forEach(s => {
              const repsCount = typeof s.reps === "number" ? s.reps : (Array.isArray(s.rep_times_sec) ? s.rep_times_sec.length : 0);
              const m = Number(s.distance_m) * Number(repsCount || 0) || 0;
              const stroke = s.stroke || "unknown";
              totals[stroke] = (totals[stroke] || 0) + m;
            });
          });
        }

        const grand = Object.values(totals).reduce((a,b)=>a+b,0) || 0;
        const pct = grand ? Object.entries(totals).map(([stroke, m]) => ({ stroke, percent: (m/grand)*100 })) : [];
        if (!cancelled) setMix(pct.sort((a,b)=>b.percent-a.percent));
      } finally {
        if (!cancelled) setMixLoading(false);
      }
    }
    if (filtered.length) buildMix(); else setMix([]);
    return () => { cancelled = true; };
  }, [filtered]);

  const displayName = swimmer?.username || swimmer?.email || `ID ${id}`;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Swimmer Sessions</h1>
        <p className="text-sm text-zinc-500 mt-1">Viewing swimmer: {displayName}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
          placeholder="Search notes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-4">
        <div className="2xl:col-span-2 grid grid-cols-1 2xl:grid-cols-2 gap-4">
          <PaceLine data={paceData} title="Pace vs Date (swimmer)" />
          <RpeBar data={rpeBuckets} title="RPE Distribution (swimmer)" />
        </div>
        <div>
          <StrokePie data={mix} valueKey="percent" title="Stroke Mix (%)" />
          {mixLoading && <div className="mt-2 text-xs text-zinc-500">Calculating…</div>}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
        <h2 className="font-medium mb-3">Sessions</h2>
        {loading ? (
          <div className="text-sm text-zinc-500">Loading swimmer…</div>
        ) : err ? (
          <div className="text-sm text-red-600">{err}</div>
        ) : (
          <SessionsTable
            rows={filtered}
            onRowClick={(r) => navigate(`/coach/swimmers/${id}/sessions/${r.id}`)}
          />
        )}
      </div>
    </div>
  );
}
