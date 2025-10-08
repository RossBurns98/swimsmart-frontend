import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

/** data: [{ x: "S1 R1", rpe: 7 }, ...] */
export default function RpePerRepLine({ data = [], title = "RPE per Rep" }) {
  const width = Math.max(600, data.length * 28);
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
      <h2 className="font-medium mb-3">{title}</h2>
      <div className="overflow-x-auto">
        <div style={{ width, height: 260 }}>
          <LineChart width={width} height={260} data={data} key={`rpe-rep-line-${data?.length || 0}`}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Line type="monotone" dataKey="rpe" dot />
          </LineChart>
        </div>
      </div>
    </div>
  );
}
