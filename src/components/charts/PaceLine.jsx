import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

/** data: [{ dateLabel: "25 Sep", pace_per_100: 78.4 }] */
export default function PaceLine({ data = [], title = "Pace vs Date" }) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
      <h2 className="font-medium mb-3">{title}</h2>
      <div className="overflow-x-auto">
        <div style={{ width: 800, height: 260 }}>
          <LineChart width={800} height={260} data={data} key={`pace-${data?.length || 0}`}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dateLabel" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="pace_per_100" dot={false} />
          </LineChart>
        </div>
      </div>
    </div>
  );
}
