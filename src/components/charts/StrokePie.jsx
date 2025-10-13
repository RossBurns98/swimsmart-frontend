import { ResponsiveContainer, PieChart, Pie, Tooltip, Legend, Cell } from "recharts";

// Red / orange club-themed stroke colors
const STROKE_COLORS = {
  free:   "#ef4444", // red-500
  fly:    "#f97316", // orange-500
  back:   "#fb923c", // orange-400
  breast: "#dc2626", // red-600
  im:     "#ea580c", // orange-600
  unknown:"#9ca3af", // gray-400 fallback
};

function colorForStroke(name) {
  const key = String(name || "").toLowerCase();
  return STROKE_COLORS[key] || STROKE_COLORS.unknown;
}

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
  const safe = Array.isArray(data)
    ? data
        .map((d) => {
          const raw = Number(d?.[valueKey]) || 0;
          const val =
            valueKey === "percent"
              ? Math.round(raw * 10) / 10 // 1 decimal place
              : raw;
          return {
            stroke: d?.stroke ?? "unknown",
            [valueKey]: val,
          };
        })
        .filter((d) => d[valueKey] > 0)
    : [];

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
      <h2 className="font-medium mb-3">{title}</h2>

      <div className="w-full" style={{ minWidth: 320 }}>
        <div style={{ width: "100%", height: 260 }}>
          {safe.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-zinc-500">
              No stroke data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart key={`${valueKey}-${safe.length}-${safe.map((d) => d.stroke).join(",")}`}>
                <Pie
                  data={safe}
                  dataKey={valueKey}
                  nameKey="stroke"
                  innerRadius={0}
                  outerRadius="85%"
                  isAnimationActive={false}
                >
                  {safe.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={colorForStroke(entry.stroke)} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => {
                    if (valueKey === "percent") {
                      const v = typeof value === "number" ? value : Number(value) || 0;
                      return [`${v.toFixed(1)}%`, "Distance"];
                    }
                    return [value, "Distance"];
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
