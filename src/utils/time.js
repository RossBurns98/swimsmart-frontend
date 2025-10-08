// Format seconds -> m:ss or h:mm:ss
export function formatSeconds(total) {
  if (typeof total !== "number" || !isFinite(total)) return "-";
  total = Math.max(0, Math.round(total));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
