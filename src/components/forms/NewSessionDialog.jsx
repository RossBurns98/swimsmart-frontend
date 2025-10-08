import { useEffect, useMemo, useState } from "react";
import { createMySession, addSetToMySession } from "../../api/sessions";

const STROKES = ["free", "fly", "back", "breast", "im"];

export default function NewSessionDialog({ open, onClose, onCreated }) {
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const [distance_m, setDistance] = useState(100);
  const [reps, setReps] = useState(10);
  const [interval_sec, setInterval] = useState(120);
  const [stroke, setStroke] = useState("free");
  const [rpeTemplate, setRpeTemplate] = useState(5);
  const [timeTemplate, setTimeTemplate] = useState(90);

  const [rpe, setRpe] = useState([]);
  const [rep_times_sec, setTimes] = useState([]);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setRpe(Array.from({ length: Number(reps) || 0 }, () => Number(rpeTemplate)));
    setTimes(Array.from({ length: Number(reps) || 0 }, () => Number(timeTemplate)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reps]);

  function updateRpeAt(i, val) {
    const arr = [...rpe]; arr[i] = Number(val || 0); setRpe(arr);
  }
  function updateTimeAt(i, val) {
    const arr = [...rep_times_sec]; arr[i] = Number(val || 0); setTimes(arr);
  }

  const canSave = useMemo(() => {
    return !!date && reps > 0 && distance_m > 0 && interval_sec > 0 &&
           rpe.length === reps && rep_times_sec.length === reps;
  }, [date, distance_m, reps, interval_sec, rpe, rep_times_sec]);

  async function handleCreate() {
    setErr("");
    if (!canSave) { setErr("Please complete all fields correctly."); return; }
    try {
      setSaving(true);
      const sess = await createMySession({ date, notes });
      await addSetToMySession(sess.id, {
        distance_m: Number(distance_m),
        reps: Number(reps),
        interval_sec: Number(interval_sec),
        rpe: rpe.map(Number),
        stroke,
        rep_times_sec: rep_times_sec.map(Number),
      });
      onCreated?.(sess.id);
      onClose?.();
      setDate(""); setNotes("");
    } catch (e) {
      setErr(e?.response?.data?.detail || e.message || "Failed to create session");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30">
      <div className="w-full max-w-3xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Session</h2>
          <button className="text-sm px-3 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700" onClick={onClose}>Close</button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Date</label>
            <input type="date" className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
              value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Notes (optional)</label>
            <input type="text" className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
              value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Threshold free + drills" />
          </div>
        </div>

        <h3 className="mt-6 font-medium">Set</h3>
        <div className="mt-2 grid grid-cols-2 md:grid-cols-6 gap-3">
          <Num label="Distance (m)" value={distance_m} onChange={setDistance} min={1} />
          <Num label="Reps" value={reps} onChange={setReps} min={1} />
          <Num label="Interval (sec)" value={interval_sec} onChange={setInterval} min={10} />
          <div>
            <label className="block text-sm mb-1">Stroke</label>
            <select className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm bg-transparent"
              value={stroke} onChange={(e) => setStroke(e.target.value)}>
              {STROKES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Num label="RPE default" value={rpeTemplate} onChange={setRpeTemplate} min={1} max={10} />
          <Num label="Time default (sec)" value={timeTemplate} onChange={setTimeTemplate} min={10} max={3600} />
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <ArrayEditor
            title="RPE per rep"
            items={rpe}
            onChangeAt={updateRpeAt}
            fillAll={() => setRpe(Array.from({ length: reps }, () => Number(rpeTemplate)))}
            min={1} max={10} widthClass="w-16"
          />
          <ArrayEditor
            title="Rep time (sec)"
            items={rep_times_sec}
            onChangeAt={updateTimeAt}
            fillAll={() => setTimes(Array.from({ length: reps }, () => Number(timeTemplate)))}
            min={10} max={3600} widthClass="w-20"
          />
        </div>

        {err && <div className="mt-4 text-sm text-red-600">{err}</div>}

        <div className="mt-6 flex gap-3 justify-end">
          <button className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm" onClick={onClose}>Cancel</button>
          <button
            className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-sm font-medium disabled:opacity-50"
            onClick={handleCreate}
            disabled={!canSave || saving}
          >
            {saving ? "Saving…" : "Save session"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Num({ label, value, onChange, min, max }) {
  return (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <input
        type="number"
        className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min} max={max}
      />
    </div>
  );
}

function ArrayEditor({ title, items, onChangeAt, fillAll, min, max, widthClass }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="block text-sm mb-1">{title}</label>
        <button className="text-xs px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700" onClick={fillAll}>
          Fill defaults
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((val, i) => (
          <input
            key={i}
            type="number"
            min={min} max={max}
            className={`${widthClass} rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-sm`}
            value={val ?? ""}
            onChange={(e) => onChangeAt(i, e.target.value)}
          />
        ))}
      </div>
    </div>
  );
}
