import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

/** data: [{ dateLabel: "25 Sep", pace_per_100: 78.4 }] */
export default function PaceLine({ data = [], title = "Pace vs Date", height = 300, xLabel = "Date", yLabel = "sec / 100m" }) {
  return (
    <div className="w-full" style={{ minWidth: 320 }}>
      <h2 className="font-medium mb-3">{title}</h2>
      <div className="overflow-x-auto">
        <div style={{ width: 800, height }}>
          <LineChart width={800} height={height} data={data} key={`pace-${data?.length || 0}`}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dateLabel" label={{ value: xLabel, position: "insideBottom", offset: -5 }} />
            <YAxis label={{ value: yLabel, angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <Line type="monotone" dataKey="pace_per_100" dot={false} stroke="#dc2626" />
          </LineChart>
        </div>
      </div>
    </div>
  );
}
