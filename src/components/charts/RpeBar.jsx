import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

/**
 * RPE bucket chart with traffic-light colours:
 *  - 1–3  => green
 *  - 4–6  => amber
 *  - 7–10 => red
 * No X-axis label text (“Bucket”) per request.
 */
export default function RpeBar({
  data = [],
  title = "RPE Distribution",
  height = 300,
  xLabel = null, // intentionally unused to remove “Bucket” label
  yLabel = "Sessions",
}) {
  const COLORS_BY_BUCKET = {
    "1-3": "#16a34a",  // green
    "4-6": "#f59e0b",  // amber
    "7-10": "#dc2626", // red (hard)
  };

  const safe = Array.isArray(data) ? data.map(d => ({
    bucket: d?.bucket ?? "",
    count: Number(d?.count) || 0
  })) : [];

  return (
    <div className="w-full" style={{ minWidth: 320 }}>
      <h2 className="font-medium mb-3">{title}</h2>
      <div className="overflow-x-auto">
        <div style={{ width: 600, height }}>
          <BarChart width={600} height={height} data={safe} key={`rpe-${safe.length || 0}`}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bucket" />
            <YAxis allowDecimals={false} label={{ value: yLabel, angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <Bar dataKey="count">
              {safe.map((entry, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={COLORS_BY_BUCKET[entry.bucket] || "#6b7280"}
                />
              ))}
            </Bar>
          </BarChart>
        </div>
      </div>
    </div>
  );
}
