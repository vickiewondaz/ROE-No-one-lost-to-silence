"use client";
// Admin → Service days: the community calendar. Weekly services (every Sunday…)
// + one-off specials (vigil, Easter…). Shown on every dashboard as "what's on".
import { useEffect, useState } from "react";
import { Shell, Card, Field, PrimaryButton, inputCls } from "@/components/ui";

interface Service {
  id: string;
  name: string;
  kind: string;
  weekday: number | null;
  date: string | null;
  time: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function describe(s: Service): string {
  const when =
    s.kind === "weekly"
      ? `Every ${DAYS[s.weekday ?? 0]}`
      : s.date ?? "";
  return `${when}${s.time ? ` · ${s.time}` : ""}`;
}

// Next occurrence preview — same maths as the dashboard, so the admin sees
// exactly what members will see. Null when a special is already past.
function nextPreview(s: Service): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (s.kind === "special") {
    if (!s.date) return null;
    const d = new Date(s.date + "T00:00:00");
    if (isNaN(d.getTime()) || d < today) return null;
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    return diff === 0 ? "next: Today" : diff === 1 ? "next: Tomorrow" : `next: ${d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}`;
  }
  const d = new Date(today);
  d.setDate(d.getDate() + (((s.weekday ?? 0) - d.getDay() + 7) % 7));
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  return diff === 0 ? "next: Today" : diff === 1 ? "next: Tomorrow" : `next: ${DAYS[d.getDay()]}`;
}

function isPast(s: Service): boolean {
  if (s.kind !== "special" || !s.date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(s.date + "T00:00:00") < today;
}

export default function AdminServices() {
  const [denied, setDenied] = useState(false);
  const [list, setList] = useState<Service[]>([]);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"weekly" | "special">("weekly");
  const [weekday, setWeekday] = useState("0");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Service | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [loaded, setLoaded] = useState(false);

  async function refresh() {
    try {
      const r = await fetch("/api/services", { credentials: "same-origin" });
      if (r.status === 403 || r.status === 401) {
        setDenied(true);
        return;
      }
      const j = await r.json().catch(() => null);
      if (Array.isArray(j?.data)) setList(j.data as Service[]);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  function resetForm() {
    setName("");
    setKind("weekly");
    setWeekday("0");
    setDate("");
    setTime("");
    setEditing(null);
  }

  async function save() {
    setError("");
    setNote("");
    if (name.trim().length < 2) return setError("Give the service a name.");
    if (kind === "special" && !/^\d{4}-\d{2}-\d{2}$/.test(date))
      return setError("Pick the date for this special service.");
    try {
      const r = await fetch(editing ? `/api/services/${editing}` : "/api/services", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name: name.trim(),
          kind,
          weekday: kind === "weekly" ? Number(weekday) : undefined,
          date: kind === "special" ? date : undefined,
          time: time.trim(),
        }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok) {
        resetForm();
        setNote(editing ? "Updated ✓ — dashboards show it now." : "Added ✓ — dashboards show it now.");
        await refresh();
        return;
      }
      setError(j?.error ?? "Couldn't save it.");
    } catch {
      setError("Couldn't reach the server.");
    }
  }

  function startEdit(s: Service) {
    setEditing(s.id);
    setName(s.name);
    setKind(s.kind === "special" ? "special" : "weekly");
    setWeekday(String(s.weekday ?? 0));
    setDate(s.date ?? "");
    setTime(s.time ?? "");
    setError("");
    setNote("");
  }

  async function remove(id: string) {
    setError("");
    setNote("");
    setConfirming(null);
    try {
      const r = await fetch(`/api/services/${id}`, { method: "DELETE", credentials: "same-origin" });
      if (r.ok) {
        if (editing === id) resetForm();
        setNote("Removed — dashboards update right away.");
        await refresh();
        return;
      }
      setError("Couldn't remove it.");
    } catch {
      setError("Couldn't reach the server.");
    }
  }

  if (denied)
    return (
      <Shell title="Service days" back="/admin" tab="more">
        <Card>
          <p className="font-medium">Restricted.</p>
            <p className="text-[13px] text-[#6B7280]">Only admins manage the organisation calendar.</p>
        </Card>
      </Shell>
    );

  const weekly = list.filter((s) => s.kind !== "special");
  const specials = list.filter((s) => s.kind === "special");

  return (
    <Shell title="Service days" back="/admin" tab="more">
      {note && (
        <p className="mb-2 rounded-lg bg-[#DCFCE7] p-2 text-[13px] font-medium text-[#15803D]">{note}</p>
      )}
      {confirming && (
        <div className="mb-2 rounded-xl border border-[#D97706]/50 bg-[#FFFBEB] p-3">
          <p className="text-[14px] font-semibold">Remove “{confirming.name}”?</p>
          <p className="mt-0.5 text-[13px] text-[#92400E]">
            It disappears from every dashboard immediately. Past occurrences stay in history.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirming(null)}
              className="tap-target flex-1 rounded-lg border border-[#E5E7EB] bg-white text-[14px] font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => remove(confirming.id)}
              className="tap-target flex-1 rounded-lg bg-[#0D9488] text-[14px] font-semibold text-white"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
      <Card>
        <p className="font-display font-semibold">{editing ? "Edit service" : "Add a service"}</p>
        <div className="mt-3 flex flex-col gap-4">
          <Field label="Service name" error={error}>
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunday Celebration Service"
            />
          </Field>
          <Field label="Type">
            <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as "weekly" | "special")}>
              <option value="weekly">Repeats weekly</option>
              <option value="special">Special (one date)</option>
            </select>
          </Field>
          {kind === "weekly" ? (
            <Field label="Day of week">
              <select className={inputCls} value={weekday} onChange={(e) => setWeekday(e.target.value)}>
                {DAYS.map((d, i) => (
                  <option key={d} value={String(i)}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Date" hint="Specials live in the past — pick today or later.">
              <input
                type="date"
                className={inputCls}
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
          )}
          <Field label="Time (optional)" hint="e.g. 9:00 AM — typed as-is.">
            <input
              className={inputCls}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="9:00 AM"
            />
          </Field>
          <PrimaryButton onClick={save}>{editing ? "Save changes" : "Add service"}</PrimaryButton>
          {editing && (
            <button type="button" onClick={resetForm} className="text-[13px] text-[#6B7280]">
              Cancel editing
            </button>
          )}
        </div>
      </Card>

      <h2 className="font-display mt-4 text-[16px] font-semibold">Weekly ({weekly.length})</h2>
      <div className="mt-2 flex flex-col gap-1.5">
        {weekly.map((s) => (
          <Card key={s.id}>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium">{s.name}</p>
                <p className="font-mono2 text-[12px] text-[#6B7280]">{describe(s)}</p>
                {nextPreview(s) && (
                  <p className="text-[12px] font-medium text-[#0F766E]">→ {nextPreview(s)} — this is what members see</p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => startEdit(s)} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] font-medium">
                  Edit
                </button>
                <button type="button" onClick={() => setConfirming(s)} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] font-medium text-[#991B1B]">
                  Remove
                </button>
              </div>
            </div>
          </Card>
        ))}
        {!loaded && (
          <Card>
            <p className="text-[14px] text-[#6B7280]">Loading services…</p>
          </Card>
        )}
        {loaded && weekly.length === 0 && (
          <Card>
            <p className="text-[14px] text-[#6B7280]">None yet — add your Sunday service above to start.</p>
          </Card>
        )}
      </div>

      <h2 className="font-display mt-4 text-[16px] font-semibold">Specials ({specials.length})</h2>
      <div className="mt-2 flex flex-col gap-1.5">
        {specials.map((s) => (
          <Card key={s.id}>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium">
                  {s.name}
                  {isPast(s) && (
                    <span className="ml-2 rounded-full bg-[#E5E7EB] px-2 py-0.5 text-[11px] font-medium text-[#6B7280]">
                      past
                    </span>
                  )}
                </p>
                <p className="font-mono2 text-[12px] text-[#6B7280]">{describe(s)}</p>
                {nextPreview(s) && (
                  <p className="text-[12px] font-medium text-[#0F766E]">→ {nextPreview(s)} — this is what members see</p>
                )}
                {isPast(s) && (
                  <p className="text-[12px] text-[#6B7280]">Over — members no longer see it. Remove it when ready.</p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => startEdit(s)} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] font-medium">
                  Edit
                </button>
                <button type="button" onClick={() => setConfirming(s)} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] font-medium text-[#991B1B]">
                  Remove
                </button>
              </div>
            </div>
          </Card>
        ))}
        {loaded && specials.length === 0 && (
          <Card>
            <p className="text-[14px] text-[#6B7280]">No specials — vigils, Easter, carol nights go here.</p>
          </Card>
        )}
      </div>
    </Shell>
  );
}
