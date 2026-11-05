"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { addDays, dateKey, DOW_SHORT, formatLongDate, MONTHS_ES, parseDateLocal, startOfWeekMonday, todayKey } from "@/lib/dates";
import { MEAL_SLOTS, type DayPlan, type MealSlot, type MealSlotKind, type SupplementEntry } from "@/lib/types";
import { PlanCalendar } from "@/app/components/plan-calendar";
import { NutritionPane } from "@/app/a/[id]/nutrition-pane";

/** Mismo corte que el workspace `.nut-desktop` en globals.css. */
const DESKTOP_MQ = "(min-width: 1280px)";

type Props = {
  athleteId: string;
  dietNotes: string | null;
  supplements: SupplementEntry[];
  plans: DayPlan[];
  crests: Record<string, string>;
  /** Lista de deportistas asignados (solo visible en desktop). */
  nav: ReactNode;
};

export function NutricionAthleteClient({ athleteId, dietNotes, supplements, plans, crests, nav }: Props) {
  const byDate = useMemo(() => Object.fromEntries(plans.map((p) => [p.date, p])), [plans]);
  const today = todayKey();
  const seed = parseDateLocal(today);
  const [year, setYear] = useState(seed.getFullYear());
  const [month, setMonth] = useState(seed.getMonth());
  const [center, setCenter] = useState(today);
  const [slot, setSlot] = useState<MealSlotKind>(MEAL_SLOTS[0].slot);
  const rootRef = useRef<HTMLDivElement>(null);

  const weekStart = startOfWeekMonday(center);
  const weekDays = useMemo(() => {
    const monday = parseDateLocal(weekStart);
    return Array.from({ length: 7 }, (_, i) => dateKey(addDays(monday, i)));
  }, [weekStart]);
  const [meals, setMeals] = useWeekMeals(athleteId, weekDays[0], weekDays[6]);

  // Desktop: ficha del plato, suplementos y dieta como bloques fijos (sin acordeón).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mq = window.matchMedia(DESKTOP_MQ);
    const openAll = () => {
      if (mq.matches) root.querySelectorAll("details").forEach((d) => (d.open = true));
    };
    const keepOpen = (e: Event) => {
      if (mq.matches && e.target instanceof HTMLDetailsElement && !e.target.open) e.target.open = true;
    };
    openAll();
    mq.addEventListener("change", openAll);
    root.addEventListener("toggle", keepOpen, true);
    return () => {
      mq.removeEventListener("change", openAll);
      root.removeEventListener("toggle", keepOpen, true);
    };
  }, []);

  function selectDate(iso: string) {
    const d = parseDateLocal(iso);
    setCenter(iso);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  function updateMeal(date: string, kind: MealSlotKind, next: MealSlot | null) {
    setMeals((rows) => [
      ...(rows ?? []).filter((m) => !(m.date === date && m.slot === kind)),
      ...(next ? [next] : [])
    ]);
  }

  const plan = byDate[center];
  const dayMeals = meals?.filter((m) => m.date === center) ?? null;

  return (
    <div className="dash nut-desktop" ref={rootRef}>
      {nav}

      <div className="nut-ws-cal">
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
      </div>

      <WeekGrid
        days={weekDays}
        byDate={byDate}
        meals={meals}
        center={center}
        today={today}
        slot={slot}
        onWeek={(delta) => selectDate(dateKey(addDays(parseDateLocal(center), delta * 7)))}
        onDay={selectDate}
        onCell={(iso, kind) => {
          setSlot(kind);
          if (iso !== center) selectDate(iso);
        }}
      />

      <div className="nut-ws-side">
        <section className="card dash-pane nut-wrap">
          <h2>Menú del día</h2>
          <p className="muted nut-side-date">{formatLongDate(parseDateLocal(center))}</p>
          {dayMeals === null ? (
            <p className="muted">Cargando menú…</p>
          ) : (
            MEAL_SLOTS.map(({ slot: kind, label }) => (
              <MealSlotForm
                key={`${center}-${kind}`}
                athleteId={athleteId}
                date={center}
                slot={kind}
                label={label}
                active={kind === slot}
                meal={dayMeals.find((m) => m.slot === kind) ?? null}
                onChange={(next) => updateMeal(center, kind, next)}
              />
            ))
          )}
        </section>

        <NutritionPane athleteId={athleteId} initialDietNotes={dietNotes} initialSupplements={supplements} canEdit />
      </div>
    </div>
  );
}

function useWeekMeals(athleteId: string, from: string, to: string) {
  const state = useState<MealSlot[] | null>(null);
  const setMeals = state[1];

  useEffect(() => {
    let cancelled = false;
    setMeals(null);
    (async () => {
      const res = await fetch(`/api/meals?athleteId=${athleteId}&from=${from}&to=${to}`);
      if (cancelled) return;
      const json = res.ok ? await res.json() : null;
      if (!cancelled) setMeals(json?.data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [athleteId, from, to, setMeals]);

  return state;
}

function shortMonth(d: Date) {
  return MONTHS_ES[d.getMonth()].slice(0, 3).toLowerCase();
}

function WeekGrid({
  days,
  byDate,
  meals,
  center,
  today,
  slot,
  onWeek,
  onDay,
  onCell
}: {
  days: string[];
  byDate: Record<string, DayPlan>;
  meals: MealSlot[] | null;
  center: string;
  today: string;
  slot: MealSlotKind;
  onWeek: (delta: number) => void;
  onDay: (iso: string) => void;
  onCell: (iso: string, slot: MealSlotKind) => void;
}) {
  const first = parseDateLocal(days[0]);
  const last = parseDateLocal(days[6]);
  const range =
    first.getMonth() === last.getMonth()
      ? `${first.getDate()}–${last.getDate()} ${shortMonth(last)}`
      : `${first.getDate()} ${shortMonth(first)} – ${last.getDate()} ${shortMonth(last)}`;

  return (
    <section className="card nut-week" aria-label="Menú semanal">
      <div className="cal-nav">
        <button type="button" className="icon-btn" aria-label="Semana anterior" onClick={() => onWeek(-1)}>
          ‹
        </button>
        <h2>
          Semana {range} {last.getFullYear()}
        </h2>
        <button type="button" className="icon-btn" aria-label="Semana siguiente" onClick={() => onWeek(1)}>
          ›
        </button>
      </div>
      <div className="nut-week-grid">
        <div />
        {days.map((iso) => {
          const d = parseDateLocal(iso);
          const p = byDate[iso];
          const cls = ["nut-week-day"];
          if (iso === center) cls.push("on");
          if (iso === today) cls.push("today");
          return (
            <button key={iso} type="button" className={cls.join(" ")} onClick={() => onDay(iso)}>
              <strong>
                {DOW_SHORT[d.getDay()]} {d.getDate()}
              </strong>
              {p?.mdTag ? <span className="md-tag">{p.mdTag}</span> : null}
              {p?.matchOpponent ? <span className="muted">vs {p.matchOpponent}</span> : null}
            </button>
          );
        })}
        {MEAL_SLOTS.map(({ slot: kind, label }) => (
          <div key={kind} className="nut-week-row">
            <div className="nut-week-slot">{label}</div>
            {days.map((iso) => {
              const meal = meals?.find((m) => m.date === iso && m.slot === kind);
              const cls = ["nut-week-cell"];
              if (iso === center) cls.push("col-on");
              if (iso === center && kind === slot) cls.push("on");
              return (
                <button
                  key={iso}
                  type="button"
                  className={cls.join(" ")}
                  aria-label={`${label} ${iso}${meal ? `: ${meal.title}` : ""}`}
                  onClick={() => onCell(iso, kind)}
                >
                  {meals === null ? null : meal ? (
                    <>
                      {meal.hasPhoto ? (
                        <img src={`/api/meals/${meal.id}/photo?v=${encodeURIComponent(meal.updatedAt)}`} alt="" />
                      ) : null}
                      <span>{meal.title}</span>
                    </>
                  ) : (
                    <span className="muted">+</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

function MealSlotForm({
  athleteId,
  date,
  slot,
  label,
  active,
  meal,
  onChange
}: {
  athleteId: string;
  date: string;
  slot: MealSlotKind;
  label: string;
  /** Slot elegido en el grid semanal: en desktop es la única ficha visible. */
  active: boolean;
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
    <details className={active ? "nut-details meal-slot on" : "nut-details meal-slot"} open>
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
