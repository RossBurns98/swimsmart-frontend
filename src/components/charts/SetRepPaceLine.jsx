import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

/**
 * Per-set rep times line (club red)
 * setObj: { rep_times_sec: number[], rpe?: number[] }
 */
export default function SetRepPaceLine({ setObj }) {
  const times = Array.isArray(setObj?.rep_times_sec) ? setObj.rep_times_sec : [];
  const data = times.map((sec, i) => ({ rep: `#${i + 1}`, sec }));

  return (
    <div className="w-full">
      {/* fixed height so ResponsiveContainer can calculate */}
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} key={`set-pace-${data?.length || 0}`}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="rep" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="sec" dot={false} stroke="#dc2626" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
