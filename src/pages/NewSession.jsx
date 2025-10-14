import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createMySession, addSetToMySession } from "../api/sessions";

const STROKES = ["free", "fly", "back", "breast", "im"];

/**
 * Full page: Add Session (supports multiple sets)
 * - Inputs allow empty strings while typing (no auto "0")
 * - Validates on save; converts to numbers at that point
 * - Clean spacing + centered max width
 */
export default function NewSessionPage() {
  const navigate = useNavigate();

  // Session meta (allow empty while typing)
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  // Sets (array of objects; store numeric fields as strings to allow empty values)
  const [sets, setSets] = useState([makeBlankSet()]);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // ---------- helpers ----------

  function makeBlankSet() {
    return {
      name: "",
      distance_m: "100",
      reps: "10",
      interval_sec: "120",
      stroke: "free",
      rpeTemplate: "5",
      timeTemplate: "90",
      // arrays are strings too so user can clear & type
      rpe: Array.from({ length: 10 }, () => "5"),
      rep_times_sec: Array.from({ length: 10 }, () => "90"),
    };
  }

  function replaceSet(idx, newSet) {
    setSets((prev) => {
      const copy = [...prev];
      copy[idx] = newSet;
      return copy;
    });
  }

  function updateSet(idx, patch) {
    setSets((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  }

  function addSet() {
    setSets((prev) => [...prev, makeBlankSet()]);
  }

  function removeSet(idx) {
    setSets((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  }

  function strToIntOrNull(v) {
    if (v === "" || v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }

  function clamp(n, min, max) {
    if (n == null) return null;
    return Math.max(min, Math.min(max, n));
  }

  // When reps changes, resize arrays and seed with templates (as strings)
  function updateSetReps(idx, repsStr) {
    updateSet(idx, { reps: repsStr });
    const repsNum = strToIntOrNull(repsStr);
    if (!repsNum || repsNum < 1) return; // don't resize until it’s valid

    setSets((prev) => {
      const copy = [...prev];
      const s = { ...copy[idx] };

      const rpeDefault = s.rpeTemplate === "" ? "" : String(clamp(strToIntOrNull(s.rpeTemplate), 1, 10) ?? "");
      const timeDefault = s.timeTemplate === "" ? "" : String(clamp(strToIntOrNull(s.timeTemplate), 10, 3600) ?? "");

      const newRpe = Array.from({ length: repsNum }, (_, i) => (s.rpe[i] ?? rpeDefault));
      const newTimes = Array.from({ length: repsNum }, (_, i) => (s.rep_times_sec[i] ?? timeDefault));

      s.rpe = newRpe;
      s.rep_times_sec = newTimes;
      copy[idx] = s;
      return copy;
    });
  }

  function updateArrayValue(idx, key, i, val) {
    setSets((prev) => {
      const copy = [...prev];
      const s = { ...copy[idx] };
      const arr = [...s[key]];
      arr[i] = val; // keep as string; allow ""
      s[key] = arr;
      copy[idx] = s;
      return copy;
    });
  }

  function fillDefaults(idx, key) {
    setSets((prev) => {
      const copy = [...prev];
      const s = { ...copy[idx] };
      const repsNum = strToIntOrNull(s.reps) || 0;

      if (key === "rpe") {
        const seed = s.rpeTemplate === "" ? "" : String(clamp(strToIntOrNull(s.rpeTemplate), 1, 10) ?? "");
        s.rpe = Array.from({ length: repsNum }, () => seed);
      } else if (key === "rep_times_sec") {
        const seed = s.timeTemplate === "" ? "" : String(clamp(strToIntOrNull(s.timeTemplate), 10, 3600) ?? "");
        s.rep_times_sec = Array.from({ length: repsNum }, () => seed);
      }

      copy[idx] = s;
      return copy;
    });
  }

  // Validation (for Save button enabling)
  const canSave = useMemo(() => {
    if (!date) return false;

    return sets.every((s) => {
      const distance = strToIntOrNull(s.distance_m);
      const repsNum = strToIntOrNull(s.reps);
      const interval = strToIntOrNull(s.interval_sec);

      if (!distance || distance <= 0) return false;
      if (!repsNum || repsNum < 1) return false;
      if (!interval || interval < 10) return false;

      if (!Array.isArray(s.rpe) || s.rpe.length !== repsNum) return false;
      if (!Array.isArray(s.rep_times_sec) || s.rep_times_sec.length !== repsNum) return false;

      // check each value is a valid integer in its range
      for (const v of s.rpe) {
        const n = strToIntOrNull(v);
        if (n == null || n < 1 || n > 10) return false;
      }
      for (const v of s.rep_times_sec) {
        const n = strToIntOrNull(v);
        if (n == null || n < 10 || n > 3600) return false;
      }
      return true;
    });
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

      // sequentially add sets
      for (const s of sets) {
        await addSetToMySession(sess.id, {
          name: s.name || undefined,
          distance_m: strToIntOrNull(s.distance_m),
          reps: strToIntOrNull(s.reps),
          interval_sec: strToIntOrNull(s.interval_sec),
          stroke: s.stroke,
          rpe: s.rpe.map((v) => strToIntOrNull(v)),
          rep_times_sec: s.rep_times_sec.map((v) => strToIntOrNull(v)),
        });
      }
      navigate(`/sessions/${sess.id}`);
    } catch (e) {
      setErr(e?.response?.data?.detail || e.message || "Failed to create session");
    } finally {
      setSaving(false);
    }
  }

  // ---------- render ----------

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Add Session</h1>
          <button
            className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 cursor-pointer"
            onClick={() => history.back()}
          >
            Cancel
          </button>
        </header>

        {/* Meta card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
          {/* Session meta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                {/* Top row: name + essentials */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-3">
                  <TextInput
                    label="Name (optional)"
                    value={s.name}
                    onChange={(v) => updateSet(idx, { name: v })}
                    className="md:col-span-2"
                  />
                  <Num
                    label="Distance (m)"
                    value={s.distance_m}
                    onChange={(v) => updateSet(idx, { distance_m: v })}
                    min={1}
                  />
                  <Num
                    label="Reps"
                    value={s.reps}
                    onChange={(v) => updateSetReps(idx, v)}
                    min={1}
                  />
                  <Num
                    label="Interval (sec)"
                    value={s.interval_sec}
                    onChange={(v) => updateSet(idx, { interval_sec: v })}
                    min={10}
                  />
                  <SelectStroke
                    label="Stroke"
                    value={s.stroke}
                    onChange={(v) => updateSet(idx, { stroke: v })}
                  />
                  <Num
                    label="RPE default"
                    value={s.rpeTemplate}
                    onChange={(v) => updateSet(idx, { rpeTemplate: v })}
                    min={1}
                    max={10}
                  />
                  <Num
                    label="Time default (sec)"
                    value={s.timeTemplate}
                    onChange={(v) => updateSet(idx, { timeTemplate: v })}
                    min={10}
                    max={3600}
                  />
                </div>

                {/* Arrays row */}
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

          {/* Add set */}
          <div className="flex gap-3">
            <button
              className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm cursor-pointer"
              onClick={addSet}
              type="button"
            >
              + Add another set
            </button>
          </div>

          {err && <div className="text-sm text-red-600">{err}</div>}

          {/* Footer buttons */}
          <div className="flex gap-3 justify-end">
            <button
              className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm"
              onClick={() => history.back()}
              type="button"
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-sm font-medium disabled:opacity-50"
              onClick={handleCreate}
              disabled={!canSave || saving}
              type="button"
            >
              {saving ? "Saving…" : "Save session"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- small inputs ---------------- */

function TextInput({ label, value, onChange, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-sm mb-1">{label}</label>
      <input
        type="text"
        className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Num({ label, value, onChange, min, max }) {
  // Keep as string while editing; allow empty
  function handleChange(e) {
    const v = e.target.value;
    // Only allow digits; but allow "" (clearing)
    if (v === "" || /^[0-9]+$/.test(v)) onChange(v);
  }

  return (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
        value={value ?? ""}
        onChange={handleChange}
        placeholder={min != null ? String(min) : "0"}
        aria-label={label}
      />
      {/* optional min/max hint */}
      {(min != null || max != null) && (
        <div className="text-[11px] text-zinc-500 mt-1">
          {min != null ? `min ${min}` : ""}{min != null && max != null ? " · " : ""}{max != null ? `max ${max}` : ""}
        </div>
      )}
    </div>
  );
}

function SelectStroke({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <select
        className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm bg-transparent"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {STROKES.map((st) => (
          <option key={st} value={st}>
            {st}
          </option>
        ))}
      </select>
    </div>
  );
}

function ArrayEditor({ title, items, onChangeAt, fillAll, min, max, widthClass }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="block text-sm mb-1">{title}</label>
        <button
          className="text-xs px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700"
          type="button"
          onClick={fillAll}
        >
          Fill defaults
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((val, i) => (
          <input
            key={i}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className={`${widthClass} rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-sm`}
            value={val ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "" || /^[0-9]+$/.test(v)) onChangeAt(i, v);
            }}
            placeholder={min != null ? String(min) : ""}
            aria-label={`${title} ${i + 1}`}
          />
        ))}
      </div>
      {(min != null || max != null) && (
        <div className="text-[11px] text-zinc-500 mt-1">
          {min != null ? `min ${min}` : ""}{min != null && max != null ? " · " : ""}{max != null ? `max ${max}` : ""}
        </div>
      )}
    </div>
  );
}
