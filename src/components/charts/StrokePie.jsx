// src/components/charts/StrokePie.jsx
import { ResponsiveContainer, PieChart, Pie, Tooltip, Legend } from "recharts";

/**
 * Stroke pie chart (not donut).
 * - data: [{ stroke: "free", distance_m: 1200 }] OR [{ stroke: "free", percent: 42.5 }]
 * - valueKey: "distance_m" | "percent"
 */
export default function StrokePie({
  data = [],
  title = "Stroke Mix",
  valueKey = "distance_m",
}) {
  // Coerce values → numbers and drop non-positives
  const safe = Array.isArray(data)
    ? data
        .map((d) => ({
          stroke: d?.stroke ?? "unknown",
          [valueKey]: Number(d?.[valueKey]) || 0,
        }))
        .filter((d) => d[valueKey] > 0)
    : [];

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
      <h2 className="font-medium mb-3">{title}</h2>

      {/* Ensure the chart always has measurable width/height */}
      <div className="w-full" style={{ minWidth: 320 }}>
        <div style={{ width: "100%", height: 260 }}>
          {safe.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-zinc-500">
              No stroke data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart
                // Force rerender if dataset changes
                key={`${valueKey}-${safe.length}-${safe.map((d) => d.stroke).join(",")}`}
              >
                <Pie
                  data={safe}
                  dataKey={valueKey}
                  nameKey="stroke"
                  // Pie (not donut)
                  innerRadius={0}
                  outerRadius="85%"
                  isAnimationActive={false}
                />
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
