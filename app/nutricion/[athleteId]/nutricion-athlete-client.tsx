"use client";

import { useEffect, useMemo, useState } from "react";
import { formatLongDate, parseDateLocal, todayKey } from "@/lib/dates";
import { MEAL_SLOTS, type DayPlan, type MealSlot, type MealSlotKind, type SupplementEntry } from "@/lib/types";
import { PlanCalendar } from "@/app/components/plan-calendar";
import { NutritionPane } from "@/app/a/[id]/nutrition-pane";

type Props = {
  athleteId: string;
  dietNotes: string | null;
  supplements: SupplementEntry[];
  plans: DayPlan[];
  crests: Record<string, string>;
};

export function NutricionAthleteClient({ athleteId, dietNotes, supplements, plans, crests }: Props) {
  const byDate = useMemo(() => Object.fromEntries(plans.map((p) => [p.date, p])), [plans]);
  const today = todayKey();
  const seed = parseDateLocal(today);
  const [year, setYear] = useState(seed.getFullYear());
  const [month, setMonth] = useState(seed.getMonth());
  const [center, setCenter] = useState(today);

  function selectDate(iso: string) {
    const d = parseDateLocal(iso);
    setCenter(iso);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  const plan = byDate[center];

  return (
    <div className="dash">
      <PlanCalendar
        byDate={byDate}
        crests={crests}
        year={year}
        month={month}
        center={center}
        today={today}
        onMonthChange={(y, m) => {
          setYear(y);
          setMonth(m);
        }}
        onSelect={selectDate}
      />

      <div className="day-line">
        <strong>{formatLongDate(parseDateLocal(center))}</strong>
        {plan?.mdTag ? <span className="day-focus-md">{plan.mdTag}</span> : null}
        {plan?.minutes ? <span className="muted">~{plan.minutes} min</span> : null}
      </div>
      {plan?.matchOpponent ? (
        <p className="muted">
          Partido vs {plan.matchOpponent}
          {plan.matchTime ? ` · ${plan.matchTime}` : ""}
          {plan.matchVenue ? ` · ${plan.matchVenue === "casa" ? "en casa" : "fuera"}` : ""}
        </p>
      ) : plan?.title ? (
        <p className="muted">{plan.title}</p>
      ) : null}

      <MealDayEditor athleteId={athleteId} date={center} />

      <NutritionPane athleteId={athleteId} initialDietNotes={dietNotes} initialSupplements={supplements} canEdit />
    </div>
  );
}

function MealDayEditor({ athleteId, date }: { athleteId: string; date: string }) {
  const [meals, setMeals] = useState<MealSlot[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMeals(null);
    (async () => {
      const res = await fetch(`/api/meals?athleteId=${athleteId}&from=${date}&to=${date}`);
      if (cancelled) return;
      const json = res.ok ? await res.json() : null;
      if (!cancelled) setMeals(json?.data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [athleteId, date]);

  return (
    <section className="card dash-pane nut-wrap">
      <h2>Menú del día</h2>
      {meals === null ? (
        <p className="muted">Cargando menú…</p>
      ) : (
        MEAL_SLOTS.map(({ slot, label }) => (
          <MealSlotForm
            key={`${date}-${slot}`}
            athleteId={athleteId}
            date={date}
            slot={slot}
            label={label}
            meal={meals.find((m) => m.slot === slot) ?? null}
            onChange={(next) =>
              setMeals((rows) => [...(rows ?? []).filter((m) => m.slot !== slot), ...(next ? [next] : [])])
            }
          />
        ))
      )}
    </section>
  );
}

function MealSlotForm({
  athleteId,
  date,
  slot,
  label,
  meal,
  onChange
}: {
  athleteId: string;
  date: string;
  slot: MealSlotKind;
  label: string;
  meal: MealSlot | null;
  onChange: (meal: MealSlot | null) => void;
}) {
  const [title, setTitle] = useState(meal?.title ?? "");
  const [preparation, setPreparation] = useState(meal?.preparation ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setTitle(meal?.title ?? "");
    setPreparation(meal?.preparation ?? "");
    setFile(null);
    setFileKey((n) => n + 1);
    setMsg(null);
  }, [date, slot, meal?.id, meal?.title, meal?.preparation]);

  async function save() {
    if (!title.trim()) {
      setMsg("Pon el nombre del plato.");
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/meals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athleteId, date, slot, title: title.trim(), preparation: preparation.trim() || null })
    });
    if (!res.ok) {
      setBusy(false);
      setMsg("No se pudo guardar.");
      return;
    }
    let saved: MealSlot = (await res.json()).data;
    if (file) {
      const fd = new FormData();
      fd.set("photo", file);
      const up = await fetch(`/api/meals/${saved.id}/photo`, { method: "POST", body: fd });
      if (!up.ok) {
        const json = await up.json().catch(() => null);
        onChange(saved);
        setBusy(false);
        setMsg(json?.error?.message?.includes("400") ? "Plato guardado; la foto supera 400 KB." : "Plato guardado; la foto no se pudo subir.");
        return;
      }
      saved = { ...saved, hasPhoto: true, updatedAt: new Date().toISOString() };
      setFile(null);
      setFileKey((n) => n + 1);
    }
    onChange(saved);
    setBusy(false);
    setMsg("Guardado.");
  }

  async function remove() {
    if (!meal) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/meals/${meal.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setMsg("No se pudo borrar.");
      return;
    }
    setTitle("");
    setPreparation("");
    onChange(null);
  }

  return (
    <details className="nut-details" open>
      <summary>
        {label}
        {meal ? ` · ${meal.title}` : ""}
      </summary>
      <div className="nut-body meal-form">
        {meal?.hasPhoto ? (
          <img className="nut-menu-photo" src={`/api/meals/${meal.id}/photo?v=${encodeURIComponent(meal.updatedAt)}`} alt="" />
        ) : null}
        <label>
          Plato
          <input value={title} maxLength={200} placeholder="Ej. Arroz con pollo" onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          Preparación
          <textarea
            rows={4}
            value={preparation}
            placeholder="Ingredientes, cantidades, cómo cocinarlo…"
            onChange={(e) => setPreparation(e.target.value)}
          />
        </label>
        <label>
          Foto
          <input
            key={fileKey}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <div className="nut-actions">
          <button type="button" className="btn" disabled={busy} onClick={() => void save()}>
            {busy ? "Guardando…" : "Guardar plato"}
          </button>
          {meal ? (
            <button type="button" className="btn secondary" disabled={busy} onClick={() => void remove()}>
              Quitar
            </button>
          ) : null}
          {msg ? <p className={msg === "Guardado." ? "ok" : "error"}>{msg}</p> : null}
        </div>
      </div>
    </details>
  );
}
