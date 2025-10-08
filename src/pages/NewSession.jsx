import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createMySession, addSetToMySession } from "../api/sessions";

const STROKES = ["free", "fly", "back", "breast", "im"];

export default function NewSessionPage() {
  const navigate = useNavigate();

  // Session meta
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  // Sets (array)
  const [sets, setSets] = useState([
    makeBlankSet(), // start with one
  ]);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // ---- helpers ----
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
      name: "", // optional label
    };
  }

  function updateSet(idx, patch) {
    setSets((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  }

  function updateSetReps(idx, reps) {
    reps = Math.max(1, Number(reps) || 1);
    setSets((prev) => {
      const copy = [...prev];
      const s = { ...copy[idx] };
      s.reps = reps;
      // resize arrays using templates as defaults
      s.rpe = Array.from({ length: reps }, (_, i) => s.rpe[i] ?? Number(s.rpeTemplate));
      s.rep_times_sec = Array.from({ length: reps }, (_, i) => s.rep_times_sec[i] ?? Number(s.timeTemplate));
      copy[idx] = s;
      return copy;
    });
  }

  function updateArrayValue(idx, key, i, val) {
    setSets((prev) => {
      const copy = [...prev];
      const s = { ...copy[idx] };
      const arr = [...s[key]];
      arr[i] = Number(val || 0);
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
        s.rpe = Array.from({ length: s.reps }, () => Number(s.rpeTemplate));
      } else if (key === "rep_times_sec") {
        s.rep_times_sec = Array.from({ length: s.reps }, () => Number(s.timeTemplate));
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

  const canSave = useMemo(() => {
    if (!date) return false;
    return sets.every((s) =>
      s.distance_m > 0 &&
      s.reps > 0 &&
      s.interval_sec > 0 &&
      Array.isArray(s.rpe) &&
      Array.isArray(s.rep_times_sec) &&
      s.rpe.length === s.reps &&
      s.rep_times_sec.length === s.reps
    );
  }, [date, sets]);

  async function handleCreate() {
    setErr("");
    if (!canSave) {
      setErr("Please complete all fields correctly (check each set’s reps/RPE/times).");
      return;
    }
    try {
      setSaving(true);
      const sess = await createMySession({ date, notes });
      // push sets sequentially (simpler error reporting)
      for (const s of sets) {
        await addSetToMySession(sess.id, {
          distance_m: Number(s.distance_m),
          reps: Number(s.reps),
          interval_sec: Number(s.interval_sec),
          rpe: s.rpe.map(Number),
          stroke: s.stroke,
          rep_times_sec: s.rep_times_sec.map(Number),
          name: s.name || undefined,
        });
      }
      navigate(`/sessions/${sess.id}`);
    } catch (e) {
      setErr(e?.response?.data?.detail || e.message || "Failed to create session");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Add Session</h1>
        <button
          className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 cursor-pointer"
          onClick={() => navigate(-1)}
        >
          Cancel
        </button>
      </header>

      {/* Session meta */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Date</label>
            <input
              type="date"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Notes (optional)</label>
            <input
              type="text"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Threshold free + drill, then aerobic back"
            />
          </div>
        </div>

        {/* Sets list */}
        <div className="space-y-6">
          {sets.map((s, idx) => (
            <div key={idx} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Set {idx + 1}</h3>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                    onClick={() => updateSet(idx, { name: s.name ? "" : `Set ${idx + 1}` })}
                    title="Toggle a default name"
                  >
                    {s.name ? "Clear name" : "Auto name"}
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                    onClick={() => removeSet(idx)}
                    disabled={sets.length === 1}
                    title="Remove set"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-3">
                <TextInput label="Name (optional)" value={s.name} onChange={(v) => updateSet(idx, { name: v })} />
                <Num label="Distance (m)" value={s.distance_m} onChange={(v) => updateSet(idx, { distance_m: Number(v) })} min={1} />
                <Num label="Reps" value={s.reps} onChange={(v) => updateSetReps(idx, v)} min={1} />
                <Num label="Interval (sec)" value={s.interval_sec} onChange={(v) => updateSet(idx, { interval_sec: Number(v) })} min={10} />
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
                <Num label="RPE default" value={s.rpeTemplate} onChange={(v) => updateSet(idx, { rpeTemplate: Number(v) })} min={1} max={10} />
                <Num label="Time default (sec)" value={s.timeTemplate} onChange={(v) => updateSet(idx, { timeTemplate: Number(v) })} min={10} max={3600} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
          <button className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm cursor-pointer" onClick={addSet}>
            + Add another set
          </button>
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <div className="flex gap-3 justify-end">
          <button className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm" onClick={() => navigate(-1)}>
            Cancel
          </button>
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

function TextInput({ label, value, onChange }) {
  return (
    <div className="md:col-span-2">
      <label className="block text-sm mb-1">{label}</label>
      <input
        type="text"
        className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
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
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
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
            min={min}
            max={max}
            className={`${widthClass} rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-sm`}
            value={val ?? ""}
            onChange={(e) => onChangeAt(i, e.target.value)}
          />
        ))}
      </div>
    </div>
  );
}
