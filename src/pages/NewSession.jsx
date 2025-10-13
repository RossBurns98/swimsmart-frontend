import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createMySession, addSetToMySession } from "../api/sessions";

const STROKES = ["free", "fly", "back", "breast", "im"];

export default function NewSessionPage() {
  const navigate = useNavigate();

  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [sets, setSets] = useState([makeBlankSet()]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function makeBlankSet() {
    return {
      distance_m: 100,
      reps: 10,
      interval_sec: 120,
      stroke: "free",
      rpeTemplate: 5,
      timeTemplate: 90,
      rpe: Array.from({ length: 10 }, () => 5),
      rep_times_sec: Array.from({ length: 10 }, () => 90),
      name: "",
    };
  }

  function updateSet(idx, patch) {
    setSets((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  }

  function updateSetReps(idx, repsStr) {
    const repsNum = Number(repsStr);
    const reps = !repsStr ? "" : Number.isFinite(repsNum) ? Math.max(1, repsNum) : "";
    setSets((prev) => {
      const copy = [...prev];
      const s = { ...copy[idx] };
      s.reps = reps;

      const count = typeof reps === "number" ? reps : (s.rpe?.length ?? 0);
      if (typeof reps === "number") {
        s.rpe = Array.from({ length: count }, (_, i) => s.rpe?.[i] ?? s.rpeTemplate ?? 5);
        s.rep_times_sec = Array.from({ length: count }, (_, i) => s.rep_times_sec?.[i] ?? s.timeTemplate ?? 90);
      }
      copy[idx] = s;
      return copy;
    });
  }

  function updateArrayValue(idx, key, i, valStr) {
    setSets((prev) => {
      const copy = [...prev];
      const s = { ...copy[idx] };
      const arr = Array.isArray(s[key]) ? [...s[key]] : [];
      arr[i] = valStr === "" ? "" : Number(valStr);
      s[key] = arr;
      copy[idx] = s;
      return copy;
    });
  }

  function fillDefaults(idx, key) {
    setSets((prev) => {
      const copy = [...prev];
      const s = { ...copy[idx] };
      if (key === "rpe") {
        s.rpe = Array.from(
          { length: typeof s.reps === "number" ? s.reps : (s.rpe?.length || 0) },
          () => Number(s.rpeTemplate) || 5
        );
      } else if (key === "rep_times_sec") {
        s.rep_times_sec = Array.from(
          { length: typeof s.reps === "number" ? s.reps : (s.rep_times_sec?.length || 0) },
          () => Number(s.timeTemplate) || 90
        );
      }
      copy[idx] = s;
      return copy;
    });
  }

  function addSet() {
    setSets((prev) => [...prev, makeBlankSet()]);
  }

  function removeSet(idx) {
    setSets((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  }

  const isPosInt = (v, { min = 1, max } = {}) =>
    typeof v === "number" && Number.isInteger(v) && v >= min && (max == null || v <= max);

  const isBetween = (v, min, max) =>
    typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;

  const arraysValid = (arr, min, max) =>
    Array.isArray(arr) && arr.every((x) => isBetween(x, min, max));

  const canSave = useMemo(() => {
    if (!date) return false;
    return sets.every((s) => {
      const { distance_m, reps, interval_sec, rpe, rep_times_sec } = s;
      if (!isPosInt(distance_m, { min: 1, max: 1500 })) return false;
      if (!isPosInt(reps, { min: 1, max: 50 })) return false;
      if (!isPosInt(interval_sec, { min: 10, max: 3600 })) return false;
      if (!Array.isArray(rpe) || !Array.isArray(rep_times_sec)) return false;
      if (rpe.length !== reps || rep_times_sec.length !== reps) return false;
      if (!arraysValid(rpe, 1, 10)) return false;
      if (!arraysValid(rep_times_sec, 10, 3600)) return false;
      return true;
    });
  }, [date, sets]);

  function coerceOrThrow(n, label, min, max) {
    if (n === "" || !Number.isFinite(n)) throw new Error(`${label} is required`);
    if (n < min || n > max) throw new Error(`${label} must be between ${min} and ${max}`);
    return n;
  }

  async function handleCreate() {
    setErr("");
    try {
      const payloadSets = sets.map((s, si) => {
        const distance = coerceOrThrow(s.distance_m, `Set ${si + 1} distance`, 1, 1500);
        const reps = coerceOrThrow(s.reps, `Set ${si + 1} reps`, 1, 50);
        const interval = coerceOrThrow(s.interval_sec, `Set ${si + 1} interval`, 10, 3600);
        const rpe = s.rpe.map((v, i) => coerceOrThrow(v, `Set ${si + 1} RPE #${i + 1}`, 1, 10));
        const times = s.rep_times_sec.map((v, i) => coerceOrThrow(v, `Set ${si + 1} time #${i + 1}`, 10, 3600));
        return {
          distance_m: distance,
          reps,
          interval_sec: interval,
          rpe,
          stroke: s.stroke,
          rep_times_sec: times,
          name: s.name || undefined,
        };
      });

      setSaving(true);
      const sess = await createMySession({ date, notes });
      for (const s of payloadSets) {
        await addSetToMySession(sess.id, s);
      }
      navigate(`/sessions/${sess.id}`);
    } catch (e) {
      setErr(e?.response?.data?.detail || e.message || "Please complete all fields correctly.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
              onClick={() => history.back()}
            >
              ← Back
            </button>
            <h1 className="text-2xl font-semibold">Add Session</h1>
          </div>
        </header>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
          {/* Meta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">Date</label>
              <input
                type="date"
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm bg-transparent"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Notes (optional)</label>
              <input
                type="text"
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm bg-transparent"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Threshold free + drill, then aerobic back"
              />
            </div>
          </div>

          {/* Sets */}
          <div className="space-y-6">
            {sets.map((s, idx) => (
              <div key={idx} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium">Set {idx + 1}</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                      onClick={() => updateSet(idx, { name: s.name ? "" : `Set ${idx + 1}` })}
                      title="Toggle a default name"
                    >
                      {s.name ? "Clear name" : "Auto name"}
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer disabled:opacity-50"
                      onClick={() => removeSet(idx)}
                      disabled={sets.length === 1}
                      title="Remove set"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Basics */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-3">
                  <TextInput label="Name (optional)" value={s.name} onChange={(v) => updateSet(idx, { name: v })} />

                  <Num
                    label="Distance (m)"
                    value={s.distance_m}
                    onChange={(v) => updateSet(idx, { distance_m: v === "" ? "" : Number(v) })}
                    min={1}
                    max={1500}
                  />

                  <Num
                    label="Reps"
                    value={s.reps}
                    onChange={(v) => updateSetReps(idx, v)}
                    min={1}
                    max={50}
                  />

                  <Num
                    label="Interval (sec)"
                    value={s.interval_sec}
                    onChange={(v) => updateSet(idx, { interval_sec: v === "" ? "" : Number(v) })}
                    min={10}
                    max={3600}
                  />

                  <div>
                    <label className="block text-sm mb-1">Stroke</label>
                    <select
                      className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm bg-transparent"
                      value={s.stroke}
                      onChange={(e) => updateSet(idx, { stroke: e.target.value })}
                    >
                      {STROKES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <Num
                    label="RPE default"
                    value={s.rpeTemplate}
                    onChange={(v) => updateSet(idx, { rpeTemplate: v === "" ? "" : Number(v) })}
                    min={1}
                    max={10}
                  />

                  <Num
                    label="Time default (sec)"
                    value={s.timeTemplate}
                    onChange={(v) => updateSet(idx, { timeTemplate: v === "" ? "" : Number(v) })}
                    min={10}
                    max={3600}
                  />
                </div>

                {/* Editors (extra gap so nothing overlaps/clips) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <ArrayEditor
                    title="RPE per rep"
                    items={s.rpe}
                    onChangeAt={(i, val) => updateArrayValue(idx, "rpe", i, val)}
                    fillAll={() => fillDefaults(idx, "rpe")}
                    min={1}
                    max={10}
                    widthClass="w-16"
                  />
                  <ArrayEditor
                    title="Rep time (sec)"
                    items={s.rep_times_sec}
                    onChangeAt={(i, val) => updateArrayValue(idx, "rep_times_sec", i, val)}
                    fillAll={() => fillDefaults(idx, "rep_times_sec")}
                    min={10}
                    max={3600}
                    widthClass="w-20"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900 text-sm cursor-pointer"
              onClick={addSet}
            >
              + Add another set
            </button>
          </div>

          {err && <div className="text-sm text-red-600">{err}</div>}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900 text-sm"
              onClick={() => history.back()}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-sm font-medium disabled:opacity-50"
              onClick={handleCreate}
              disabled={!canSave || saving}
            >
              {saving ? "Saving…" : "Save session"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange }) {
  return (
    <div className="md:col-span-2 min-w-0">
      <label className="block text-sm mb-1">{label}</label>
      <input
        type="text"
        className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm bg-transparent"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Num({ label, value, onChange, min, max }) {
  const display = value === "" ? "" : String(value ?? "");
  return (
    <div className="min-w-0">
      <label className="block text-sm mb-1">{label}</label>
      <input
        type="number"
        className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm bg-transparent"
        value={display}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        inputMode="numeric"
      />
    </div>
  );
}

function ArrayEditor({ title, items, onChangeAt, fillAll, min, max, widthClass }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between">
        <label className="block text-sm mb-1">{title}</label>
        <button
          type="button"
          className="text-xs px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900"
          onClick={fillAll}
        >
          Fill defaults
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((val, i) => (
          <input
            key={i}
            type="number"
            min={min}
            max={max}
            inputMode="numeric"
            className={`${widthClass} rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-sm bg-transparent`}
            value={val === "" ? "" : (val ?? "")}
            onChange={(e) => onChangeAt(i, e.target.value)}
          />
        ))}
      </div>
    </div>
  );
}
