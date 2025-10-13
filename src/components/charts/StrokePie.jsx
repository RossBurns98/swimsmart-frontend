// src/components/charts/StrokePie.jsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = {
  free: "#EF4444",   // red
  back: "#3B82F6",   // blue
  breast: "#10B981", // green
  fly: "#F59E0B",    // amber
  im: "#8B5CF6",     // purple
  other: "#14B8A6",  // teal
  unknown: "#9CA3AF" // gray
};

function cap(s = "") {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export default function StrokePie({
  data = [],
  title = "Stroke Mix",
  height = 300,
  valueKey = "percent",    // "percent" or "distance_m"
  percentFormat = false,   // when true, append % with 1dp
}) {
  // Normalize data to ensure we always have a stroke string and number value
  const safe = Array.isArray(data)
    ? data
        .map((d) => {
          const stroke = String(d?.stroke || "unknown").toLowerCase();
          const val = Number(d?.[valueKey]);
          return { stroke, [valueKey]: Number.isFinite(val) ? val : 0 };
        })
        .filter((d) => d[valueKey] > 0)
    : [];

  // Recharts label callback receives { name, value, percent, payload, ... }
  const renderLabel = ({ name, value, percent, payload }) => {
    const strokeRaw = name || payload?.stroke || "unknown";
    const stroke = cap(String(strokeRaw).toLowerCase());
    let displayVal;

    if (valueKey === "percent" || percentFormat) {
      // Prefer payload[valueKey], then value/percent
      const pct =
        Number(payload?.[valueKey]) ||
        (typeof value === "number" && valueKey === "percent" ? value : undefined) ||
        (typeof percent === "number" ? percent * 100 : undefined);
      displayVal =
        typeof pct === "number" && Number.isFinite(pct) ? `${pct.toFixed(1)}%` : "";
    } else {
      displayVal = typeof value === "number" ? String(value) : "";
    }

    return displayVal ? `${stroke} (${displayVal})` : stroke;
  };

  return (
    <div className="h-full flex flex-col">
      {title && <h2 className="font-medium text-center mb-3">{title}</h2>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={safe}
            cx="50%"
            cy="50%"
            outerRadius="80%"
            dataKey={valueKey}
            nameKey="stroke"
            label={renderLabel}
            labelLine
            isAnimationActive={false}
          >
            {safe.map((entry, i) => {
              const key = entry.stroke || "unknown";
              return <Cell key={`cell-${i}`} fill={COLORS[key] || COLORS.unknown} />;
            })}
          </Pie>
          <Tooltip
            formatter={(val, _name, obj) => {
              if (valueKey === "percent" || percentFormat) {
                const n = Number(val);
                return Number.isFinite(n) ? `${n.toFixed(1)}%` : val;
              }
              return val;
            }}
            labelFormatter={(label) => cap(String(label))}
          />
        </PieChart>
      </ResponsiveContainer>
      {safe.length === 0 && (
        <div className="mt-2 text-sm text-zinc-500 text-center">No stroke data yet.</div>
      )}
    </div>
  );
}
