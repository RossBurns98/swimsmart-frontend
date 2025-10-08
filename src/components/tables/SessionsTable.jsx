import { format } from "date-fns";
import { useMemo, useState } from "react";

export default function SessionsTable({ rows = [], onRowClick }) {
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  const sorted = useMemo(() => {
    const copy = Array.isArray(rows) ? [...rows] : [];
    copy.sort((a, b) => {
      let av = a?.[sortKey];
      let bv = b?.[sortKey];
      if (sortKey === "date") {
        av = new Date(a?.date || 0).getTime();
        bv = new Date(b?.date || 0).getTime();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  function setSort(key) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left border-b border-zinc-200 dark:border-zinc-800">
          <tr>
            <Th onClick={() => setSort("date")} label="Date" active={sortKey==="date"} dir={sortDir} />
            <Th onClick={() => setSort("total_distance_m")} label="Distance (m)" active={sortKey==="total_distance_m"} dir={sortDir} />
            <Th onClick={() => setSort("avg_pace_sec_per")} label="Avg Pace" active={sortKey==="avg_pace_sec_per"} dir={sortDir} />
            <Th onClick={() => setSort("avg_rpe")} label="Avg RPE" active={sortKey==="avg_rpe"} dir={sortDir} />
            <th className="py-2 px-3">Notes</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr
              key={r.id}
              className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/50"
              style={{ cursor: onRowClick ? "pointer" : "default" }}
              onClick={() => {
                if (onRowClick) {
                  console.info("[SessionsTable] row click →", r.id);
                  onRowClick(r);
                }
              }}
              role={onRowClick ? "button" : undefined}
            >
              <td className="py-2 px-3">{r?.date ? format(new Date(r.date), "dd MMM yyyy") : "-"}</td>
              <td className="py-2 px-3">{r?.total_distance_m?.toLocaleString?.() ?? "-"}</td>
              <td className="py-2 px-3">{r?.avg_pace_formatted || (r?.avg_pace_sec_per && r?.pace_basis_m ? `${r.avg_pace_sec_per}s / ${r.pace_basis_m}m` : "-")}</td>
              <td className="py-2 px-3">{r?.avg_rpe ?? "-"}</td>
              <td className="py-2 px-3 truncate max-w-[18rem]">{r?.notes || ""}</td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-zinc-500">No sessions found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Th({ label, onClick, active, dir }) {
  return (
    <th onClick={onClick} className="py-2 px-3 select-none cursor-pointer">
      <span className={`inline-flex items-center gap-1 ${active ? "font-medium" : ""}`}>
        {label}
        {active && <span>{dir === "asc" ? "▲" : "▼"}</span>}
      </span>
    </th>
  );
}
