import { PieChart, Pie, Tooltip, Legend } from "recharts";

/** Display for strokes (fixed size version) */
export default function StrokeDonut({ data = [], title = "Stroke Mix" }) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
      <h2 className="font-medium mb-3">{title}</h2>
      <div className="overflow-x-auto">
        <div style={{ width: 600, height: 260 }}>
          <PieChart width={600} height={260} key={`stroke-${data?.length || 0}`}>
            <Pie
              data={data}
              dataKey="distance_m"
              nameKey="stroke"
              innerRadius={110}
              outerRadius={130}
            />
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      </div>
    </div>
  );
}
