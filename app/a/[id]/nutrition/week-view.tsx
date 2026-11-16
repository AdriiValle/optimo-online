"use client";

import { useEffect, useState } from "react";
import { addDays, dateKey, DOW_FULL, MONTHS_ES, parseDateLocal, startOfWeekMonday } from "@/lib/dates";
import { MEAL_SLOTS, type MealSlotKind } from "@/lib/types";
import { loadNutritionWeek } from "./actions";
import type { WeekData, WeekDay, WeekMeal } from "./week-queries";

/** Rótulo corto de cada columna de miniaturas (la franja completa va en texto para lector de pantalla). */
const SLOT_SHORT: Record<MealSlotKind, string> = {
  breakfast: "Desayuno",
  morning_snack: "Media m.",
  lunch: "Comida",
  afternoon_snack: "Merienda",
  dinner: "Cena"
};

const MONTH_SHORT = MONTHS_ES.map((m) => m.slice(0, 3).toLocaleLowerCase("es"));

function capitalize(s: string) {
  return s.charAt(0).toLocaleUpperCase("es") + s.slice(1);
}

/** «17 – 23 nov», «28 nov – 4 dic», «29 dic 2025 – 4 ene 2026». */
function rangeLabel(weekStart: string) {
  const a = parseDateLocal(weekStart);
  const b = addDays(a, 6);
  if (a.getFullYear() !== b.getFullYear()) {
    return `${a.getDate()} ${MONTH_SHORT[a.getMonth()]} ${a.getFullYear()} – ${b.getDate()} ${MONTH_SHORT[b.getMonth()]} ${b.getFullYear()}`;
  }
  if (a.getMonth() !== b.getMonth()) {
    return `${a.getDate()} ${MONTH_SHORT[a.getMonth()]} – ${b.getDate()} ${MONTH_SHORT[b.getMonth()]}`;
  }
  return `${a.getDate()} – ${b.getDate()} ${MONTH_SHORT[b.getMonth()]}`;
}

/** Semana relativa a la actual («Esta semana», «La semana que viene»…), o null si queda lejos. */
function relativeWeek(weekStart: string, today: string) {
  const diff = Math.round((parseDateLocal(weekStart).getTime() - parseDateLocal(startOfWeekMonday(today)).getTime()) / (7 * 86400000));
  if (diff === 0) return "Esta semana";
  if (diff === 1) return "La semana que viene";
  if (diff === -1) return "La semana pasada";
  return null;
}

/** «Lunes 17 de noviembre» para lectores de pantalla y la vista «Hoy» abierta desde aquí. */
export function longDayLabel(date: string) {
  const d = parseDateLocal(date);
  return `${capitalize(DOW_FULL[d.getDay()])} ${d.getDate()} de ${MONTHS_ES[d.getMonth()].toLocaleLowerCase("es")}`;
}

function photoUrl(m: WeekMeal) {
  return `/api/meals/${m.id}/photo?v=${encodeURIComponent(m.updatedAt)}`;
}

type Props = {
  athleteId: string;
  weekStart: string;
  today: string;
  /** Día que está abierto en «Hoy» (se marca en la lista). */
  openDate: string;
  reloadKey?: number;
  onWeekChange: (weekStart: string) => void;
  onOpenDay: (date: string) => void;
};

/** Vista «Semana»: lunes a domingo con MD y una miniatura por franja; tocar un día abre su «Hoy». */
export function WeekView({ athleteId, weekStart, today, openDate, reloadKey = 0, onWeekChange, onOpenDay }: Props) {
  const [data, setData] = useState<WeekData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    loadNutritionWeek(athleteId, weekStart)
      .catch(() => null)
      .then((d) => {
        if (cancelled) return;
        setFailed(!d);
        setData(d);
      });
    return () => {
      cancelled = true;
    };
  }, [athleteId, weekStart, reloadKey]);

  const monday = parseDateLocal(weekStart);
  const relative = relativeWeek(weekStart, today);
  const isCurrent = relative === "Esta semana";
  const loading = !failed && (!data || data.weekStart !== weekStart);
  const hasMeals = Boolean(data?.days.some((d) => d.meals.length > 0));

  return (
    <section className="nut-wk" aria-labelledby="nut-week-title" aria-busy={loading || undefined}>
      <div className="nut-wk-nav">
        <button
          type="button"
          className="icon-btn nut-wk-arrow"
          aria-label="Semana anterior"
          onClick={() => onWeekChange(dateKey(addDays(monday, -7)))}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14.5 6l-6 6 6 6" />
          </svg>
        </button>
        <div className="nut-wk-head">
          <h2 id="nut-week-title" className="nut-wk-title">
            {rangeLabel(weekStart)}
          </h2>
          {isCurrent ? (
            <span className="nut-wk-rel">{relative}</span>
          ) : (
            <span className="nut-wk-sub">
              {relative ? <span className="nut-wk-rel">{relative} ·</span> : null}
              <button type="button" className="nut-wk-today" onClick={() => onWeekChange(startOfWeekMonday(today))}>
                Ir a hoy
              </button>
            </span>
          )}
        </div>
        <button
          type="button"
          className="icon-btn nut-wk-arrow"
          aria-label="Semana siguiente"
          onClick={() => onWeekChange(dateKey(addDays(monday, 7)))}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9.5 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      {failed ? (
        <div className="nut-empty nut-empty--error" role="alert">
          <strong>No se pudo cargar la semana</strong>
          <span>Comprueba la conexión y vuelve a abrir la pestaña.</span>
        </div>
      ) : loading ? (
        <>
          <span className="sr-only" role="status">
            Cargando la semana…
          </span>
          <ol className="nut-wk-days" aria-hidden="true">
            {Array.from({ length: 7 }, (_, i) => (
              <li key={i}>
                <div className="nut-wk-day nut-wk-day--skel">
                  <span className="nut-wk-line">
                    <span className="skeleton skeleton--line nut-wk-skel-date" />
                  </span>
                  <span className="nut-wk-thumbs">
                    {MEAL_SLOTS.map(({ slot }) => (
                      <span key={slot} className="skeleton nut-wk-thumb" />
                    ))}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </>
      ) : data ? (
        <>
          {!hasMeals ? (
            <div className="card nut-empty" role="status">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
                <path d="M3.5 9.5h17M8 3v4M16 3v4" />
              </svg>
              <strong>Sin menú esta semana</strong>
              <span>Cuando Amanda cargue los platos, verás aquí cada día con sus comidas.</span>
            </div>
          ) : (
            <p className="nut-wk-legend" aria-hidden="true">
              {MEAL_SLOTS.map(({ slot }) => (
                <span key={slot}>{SLOT_SHORT[slot]}</span>
              ))}
            </p>
          )}
          <ol className="nut-wk-days" aria-label={`Días del ${rangeLabel(weekStart)}`}>
            {data.days.map((d) => (
              <li key={d.date}>
                <DayRow day={d} isToday={d.date === today} isOpen={d.date === openDate} onOpen={() => onOpenDay(d.date)} />
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </section>
  );
}

function DayRow({ day, isToday, isOpen, onOpen }: { day: WeekDay; isToday: boolean; isOpen: boolean; onOpen: () => void }) {
  const d = parseDateLocal(day.date);
  const bySlot = new Map(day.meals.map((m) => [m.slot, m]));
  const spoken = MEAL_SLOTS.flatMap(({ slot, label }) => {
    const m = bySlot.get(slot);
    return m ? [`${label}: ${m.dish}`] : [];
  });

  return (
    <button
      type="button"
      className={`nut-wk-day nut-fuel--${day.fuel}${isToday ? " is-today" : ""}${isOpen ? " is-open" : ""}`}
      aria-current={isToday ? "date" : undefined}
      onClick={onOpen}
    >
      <span className="nut-wk-line">
        <span className="nut-wk-date">
          <span className="nut-wk-dow">{capitalize(DOW_FULL[d.getDay()])}</span>
          <span className="nut-wk-num">{d.getDate()}</span>
          <span className="sr-only"> de {MONTHS_ES[d.getMonth()].toLocaleLowerCase("es")}</span>
        </span>
        {isToday ? <span className="nut-wk-badge">Hoy</span> : null}
        {day.mdTag ? (
          <span className="nut-md nut-wk-md">
            <span className="sr-only">, etiqueta </span>
            {day.mdTag}
          </span>
        ) : null}
      </span>
      {day.meals.length ? (
        <span className="nut-wk-thumbs" aria-hidden="true">
          {MEAL_SLOTS.map(({ slot }) => {
            const m = bySlot.get(slot);
            if (!m) return <span key={slot} className="nut-wk-thumb nut-wk-thumb--none" />;
            return m.hasPhoto ? (
              <img
                key={slot}
                className={`nut-wk-thumb nut-cat--${m.cat}`}
                src={photoUrl(m)}
                alt=""
                width={48}
                height={48}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span key={slot} className={`nut-wk-thumb nut-wk-thumb--ph nut-cat--${m.cat}`} />
            );
          })}
        </span>
      ) : (
        <span className="nut-wk-nomenu">Sin menú</span>
      )}
      {spoken.length ? <span className="sr-only">. {spoken.join(". ")}.</span> : null}
      <span className="nut-wk-chev" aria-hidden="true" />
    </button>
  );
}
