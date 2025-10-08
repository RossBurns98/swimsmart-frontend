// Accept object or array forms for by_stroke and multiple total keys
function pickDistance(obj) {
  if (!obj || typeof obj !== "object") return 0;
  return (
    obj.total_distance_m ??
    obj.distance_m_total ??
    obj.total_m ??
    obj.meters ??
    obj.distance ??
    0
  );
}

export function toStrokeDonutData(by_stroke) {
  if (!by_stroke) return [];
  if (Array.isArray(by_stroke)) {
    return by_stroke.map((x) => ({
      stroke: x.stroke || x.name || "unknown",
      distance_m: pickDistance(x),
    }));
  }
  return Object.entries(by_stroke).map(([stroke, info]) => ({
    stroke,
    distance_m: pickDistance(info),
  }));
}

// RPE bucketing using FLOOR (6.99 => 6; 7.0+ => "7-10")
export function toRpeBuckets(detail) {
  const buckets = { "1-3": 0, "4-6": 0, "7-10": 0 };

  let avg = detail?.totals?.avg_rpe;
  if (typeof avg !== "number") {
    const all = [];
    (detail?.sets || []).forEach((s) => {
      if (Array.isArray(s.rpe)) all.push(...s.rpe.filter((n) => typeof n === "number"));
    });
    if (all.length) avg = all.reduce((a, b) => a + b, 0) / all.length;
  }

  if (typeof avg === "number") {
    const v = Math.floor(avg);
    if (v <= 3) buckets["1-3"] = 1;
    else if (v <= 6) buckets["4-6"] = 1;
    else buckets["7-10"] = 1;
  }
  return Object.entries(buckets).map(([bucket, count]) => ({ bucket, count }));
}
