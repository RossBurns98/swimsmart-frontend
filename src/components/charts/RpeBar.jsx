import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

/** Bar chart breaking up RPE into 3 groups (fixed size version) */
export default function RpeBar({ data = [], title = "RPE Distribution"}) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
      <h2 className="font-medium mb-3">{title}</h2>
      <div className="overflow-x-auto">
        {/* Fixed width/height so Recharts always renders */}
        <div style={{ width: 600, height: 260 }}>
          <BarChart width={600} height={260} data={data} key={`rpe-${data?.length || 0}`}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bucket" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" />
          </BarChart>
        </div>
      </div>
    </div>
  );
}
