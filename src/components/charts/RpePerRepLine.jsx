import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

/**
 * RPE per rep line (club red)
 * data: [{ x: "S1 R1", rpe: 6 }, ...]
 */
export default function RpePerRepLine({ data = [] }) {
  return (
    <div className="w-full">
      {/* fixed height so ResponsiveContainer can calculate */}
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} key={`rpe-line-${data?.length || 0}`}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Line type="monotone" dataKey="rpe" dot={false} stroke="#dc2626" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
