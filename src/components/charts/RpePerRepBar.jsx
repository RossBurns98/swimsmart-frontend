import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

/** data: [{ x: "S1 R1", rpe: 7 }, ...] */
export default function RpePerRepBar({ data = [], title = "RPE per Rep" }) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
      <h2 className="font-medium mb-3">{title}</h2>
      <div className="overflow-x-auto">
        <div style={{ width: Math.max(600, data.length * 28), height: 260 }}>
          <BarChart width={Math.max(600, data.length * 28)} height={260} data={data} key={`rpe-rep-${data?.length || 0}`}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Bar dataKey="rpe" />
          </BarChart>
        </div>
      </div>
    </div>
  );
}
