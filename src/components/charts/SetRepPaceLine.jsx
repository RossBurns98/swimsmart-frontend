import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { formatSeconds } from "../../utils/time";

/**
 * setObj: { rep_times_sec:number[], reps, distance_m, stroke, interval_sec }
 * Renders rep time (actual seconds) per rep with mm:ss formatting.
 */
export default function SetRepPaceLine({ setObj, title = "Set pace (sec per rep)" }) {
  const data = useMemo(() => {
    const times = Array.isArray(setObj?.rep_times_sec) ? setObj.rep_times_sec : [];
    return times
      .map((sec, i) => (typeof sec === "number" ? { rep: i + 1, sec } : null))
      .filter(Boolean);
  }, [setObj]);

  const stats = useMemo(() => {
    if (!data.length) return null;
    const secs = data.map((d) => d.sec);
    const avg = secs.reduce((a, b) => a + b, 0) / secs.length;
    const fastest = Math.min(...secs);
    const slowest = Math.max(...secs);
    return { avg, fastest, slowest };
  }, [data]);

  const width = Math.max(600, data.length * 40);

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-medium">{title}</h2>
        {setObj?.distance_m && setObj?.stroke && (
          <div className="text-xs text-zinc-500">
            {setObj.reps}×{setObj.distance_m}m {setObj.stroke}
            {setObj.interval_sec ? ` @ ${formatSeconds(setObj.interval_sec)}` : ""}
          </div>
        )}
      </div>

      {stats && (
        <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
          <span className="mr-4">Avg: {formatSeconds(stats.avg)}</span>
          <span className="mr-4">Fastest: {formatSeconds(stats.fastest)}</span>
          <span>Slowest: {formatSeconds(stats.slowest)}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <div style={{ width, height: 260 }}>
          <LineChart width={width} height={260} data={data} key={`set-rep-pace-${data.length}`}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="rep" />
            <YAxis tickFormatter={formatSeconds} />
            <Tooltip
              formatter={(val) => [formatSeconds(val), "Time"]}
              labelFormatter={(label) => `Rep ${label}`}
            />
            <Line type="monotone" dataKey="sec" dot />
          </LineChart>
        </div>
      </div>
    </div>
  );
}
