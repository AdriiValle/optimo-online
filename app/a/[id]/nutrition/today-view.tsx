"use client";

import { useEffect, useId, useState } from "react";
import { todayKey } from "@/lib/dates";
import { MEAL_SLOTS, type MealCheck, type MealSlotKind } from "@/lib/types";
import { dishLines, splitCategory } from "@/lib/nutrition/protein-category";
import {
  DAY_TYPE_LABEL,
  FUEL_COPY,
  SLOT_WINDOWS,
  slotPhases,
  supplementSlot,
  type SlotPhase,
  type TodayData,
  type TodayMeal,
  type TodayNumbers,
  type TodaySupplement
} from "@/lib/nutrition/today";
import type { IngredientSwaps, SwapOption } from "@/lib/nutrition/templates-queries";
import { loadMealChecks, loadMealSwaps, loadNutritionToday } from "./actions";
import { MealCheckBar } from "./meal-check";

/** Nombre legible de la categoría del corchete («CARNE» → «Carne»). */
function categoryName(label: string | null) {
  if (!label) return null;
  const lower = label.toLocaleLowerCase("es");
  return lower.charAt(0).toLocaleUpperCase("es") + lower.slice(1);
}

function minutesNow() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function numbersText(n: TodayNumbers) {
  return `${n.kcal.toLocaleString("es-ES")} kcal · Proteína ${n.proteinG} g · Hidratos ${n.carbsG} g · Grasa ${n.fatG} g`;
}

type Row = { slot: MealSlotKind; label: string; meal: TodayMeal | null; supps: TodaySupplement[] };

/** Check de la franja (solo si el que mira es el jugador y el día no es futuro). */
type CheckSlot = {
  athleteId: string;
  check: MealCheck | null;
  onChange: (check: MealCheck | null) => void;
};

/** Vista «Hoy»: tarjeta del día + franjas en orden (la siguiente destacada, las pasadas plegadas) + indicaciones. */
export function TodayView({ athleteId, date, reloadKey = 0 }: { athleteId: string; date: string; reloadKey?: number }) {
  const [data, setData] = useState<TodayData | null>(null);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(minutesNow);
  const [today, setToday] = useState(todayKey);
  /** Checks del día por franja; `null` mientras cargan o si el que mira no es el jugador. */
  const [checks, setChecks] = useState<{ date: string; canCheck: boolean; bySlot: Map<string, MealCheck> } | null>(null);
  /** Sustituciones aprobadas por plato; si fallan, el menú se ve igual (sin «Cambiar»). */
  const [swaps, setSwaps] = useState<{ date: string; bySlot: Record<string, IngredientSwaps[]> } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    loadNutritionToday(athleteId, date)
      .catch(() => null)
      .then((d) => {
        if (cancelled) return;
        setFailed(!d);
        setData(d);
      });
    // Si los checks fallan, el menú se ve igual (sin los botones).
    loadMealChecks(athleteId, date)
      .catch(() => null)
      .then((c) => {
        if (cancelled) return;
        setChecks(c ? { date, canCheck: c.canCheck, bySlot: new Map(c.checks.map((x) => [x.mealSlotId, x])) } : null);
      });
    loadMealSwaps(athleteId, date)
      .catch(() => null)
      .then((sw) => {
        if (!cancelled) setSwaps(sw ? { date, bySlot: sw } : null);
      });
    return () => {
      cancelled = true;
    };
  }, [athleteId, date, reloadKey]);

  function setCheck(slotId: string, check: MealCheck | null) {
    setChecks((prev) => {
      if (!prev) return prev;
      const bySlot = new Map(prev.bySlot);
      if (check) bySlot.set(slotId, check);
      else bySlot.delete(slotId);
      return { ...prev, bySlot };
    });
  }

  // La franja que toca avanza sola mientras la pantalla está abierta.
  const isToday = date === today;
  useEffect(() => {
    if (!isToday) return;
    const id = window.setInterval(() => {
      setNow(minutesNow());
      setToday(todayKey());
    }, 60_000);
    return () => window.clearInterval(id);
  }, [isToday]);

  if (failed) {
    return (
      <div className="nut-empty nut-empty--error" role="alert">
        <strong>No se pudo cargar el menú</strong>
        <span>Comprueba la conexión y vuelve a abrir la pestaña.</span>
      </div>
    );
  }

  if (!data || data.date !== date) {
    return (
      <div className="nut-today" aria-busy="true">
        <span className="sr-only" role="status">
          Cargando el menú…
        </span>
        <div className="card nut-daycard" aria-hidden="true">
          <span className="skeleton skeleton--line nut-skel-short" />
          <span className="skeleton skeleton--line" />
        </div>
        {[0, 1].map((i) => (
          <div key={i} className="card nut-slot" aria-hidden="true">
            <div className="nut-slot-row">
              <span className="skeleton nut-menu-thumb" />
              <span className="nut-menu-text">
                <span className="skeleton skeleton--line nut-skel-short" />
                <span className="skeleton skeleton--line" />
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Suplementos: los que tienen franja van con ella; el resto, en «Otros suplementos».
  const suppsBySlot = new Map<MealSlotKind, TodaySupplement[]>();
  const looseSupps: TodaySupplement[] = [];
  for (const s of data.supplements) {
    const slot = supplementSlot(s);
    if (slot) suppsBySlot.set(slot, [...(suppsBySlot.get(slot) ?? []), s]);
    else looseSupps.push(s);
  }

  const rows: Row[] = MEAL_SLOTS.flatMap(({ slot, label }) => {
    const meal = data.meals.find((m) => m.slot === slot) ?? null;
    const supps = suppsBySlot.get(slot) ?? [];
    return meal || supps.length ? [{ slot, label, meal, supps }] : [];
  });
  const phases = slotPhases(
    rows.map((r) => r.slot),
    isToday,
    now
  );
  const hasMeals = data.meals.length > 0;
  // Se marca lo de hoy y lo pasado; un día futuro aún no se ha comido.
  const canCheck = checks?.date === date && checks.canCheck && date <= today;
  const checkFor = (meal: TodayMeal | null): CheckSlot | null =>
    canCheck && meal
      ? { athleteId, check: checks.bySlot.get(meal.id) ?? null, onChange: (c) => setCheck(meal.id, c) }
      : null;

  return (
    <div className="nut-today">
      <DayCard data={data} />

      {!hasMeals ? (
        <div className="card nut-empty" role="status">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="13" r="7.5" />
            <circle cx="12" cy="13" r="4" />
            <path d="M3 3.5v5a2 2 0 0 0 2 2M3 3.5v17M21 3.5c-1.5 1-2 3-2 5.5h2v11.5" />
          </svg>
          <strong>Sin menú para este día</strong>
          <span>Cuando Amanda cargue los platos de este día, aparecerán aquí por comidas.</span>
        </div>
      ) : null}

      {rows.length > 0 ? (
        <ol className="nut-slots" aria-label="Comidas del día">
          {rows.map((r) => (
            <li key={r.slot}>
              <SlotCard
                row={r}
                phase={phases.get(r.slot) ?? "later"}
                now={now}
                showNumbers={data.showNumbers}
                check={checkFor(r.meal)}
                swaps={r.meal && swaps?.date === date ? swaps.bySlot[r.meal.id] : undefined}
              />
            </li>
          ))}
        </ol>
      ) : null}

      {looseSupps.length > 0 ? (
        <section className="nut-group" aria-labelledby="nut-loose-supps">
          <h2 id="nut-loose-supps" className="nut-group-title">
            Otros suplementos
          </h2>
          <ul className="nut-supp-list">
            {looseSupps.map((s, i) => (
              <li key={i}>
                <span className="nut-supp-main">
                  <span className="nut-supp-name">{s.name}</span>
                  {s.notes ? <span className="nut-supp-note">{s.notes}</span> : null}
                </span>
                <span className="nut-supp-time">{s.time}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.dietNotes ? (
        <details className="nut-details nut-indic">
          <summary>
            <span className="nut-details-label">Indicaciones de Amanda</span>
          </summary>
          <div className="nut-body">
            <p className="nut-diet-text">{data.dietNotes}</p>
          </div>
        </details>
      ) : null}
    </div>
  );
}

function FuelGauge({ bars }: { bars: 1 | 2 | 3 }) {
  return (
    <svg className="nut-fuel-gauge" viewBox="0 0 20 20" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <rect key={i} x={2 + i * 6} y={12 - i * 4} width="4" height={6 + i * 4} rx="1.5" data-on={i < bars || undefined} />
      ))}
    </svg>
  );
}

function DayCard({ data }: { data: TodayData }) {
  const fuel = FUEL_COPY[data.fuel];
  return (
    <section className={`card nut-daycard nut-fuel--${data.fuel}`} aria-labelledby="nut-day-title">
      <div className="nut-daycard-head">
        <h2 id="nut-day-title" className="nut-daycard-title">
          {DAY_TYPE_LABEL[data.dayType]}
        </h2>
        {data.mdTag ? (
          <span className="nut-md">
            <span className="sr-only">Etiqueta </span>
            {data.mdTag}
          </span>
        ) : null}
      </div>
      <div className="nut-fuel">
        <FuelGauge bars={fuel.bars} />
        <span className="nut-fuel-text">
          <span className="nut-fuel-label">
            Combustible: <strong>{fuel.label}</strong>
          </span>
          <span className="nut-fuel-hint">{fuel.hint}</span>
        </span>
      </div>
      {data.showNumbers && data.dayNumbers ? (
        <p className="nut-numbers">
          {numbersText(data.dayNumbers)}
          {data.dayNumbers.partial ? " (parcial)" : ""}
        </p>
      ) : null}
      {data.note ? (
        <div className="nut-daynote">
          <span className="nut-daynote-label">Nota de Amanda</span>
          <p className="nut-diet-text">{data.note}</p>
        </div>
      ) : null}
    </section>
  );
}

/**
 * Ingrediente con sustituciones aprobadas por Amanda: «Cambiar» enseña las alternativas con los gramos
 * ya recalculados. Es una ayuda para ver la equivalencia en el momento: no cambia el menú guardado.
 */
function SwapLine({ name, amount, options }: { name: string; amount: string | null; options: SwapOption[] }) {
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<SwapOption | null>(null);
  const listId = useId();
  const shown = pick ?? { name, amount };
  return (
    <li className={`nut-ingr-swap${pick ? " is-swapped" : ""}`}>
      <span className="nut-ingr-swap-row">
        <span className="nut-ingr-name">
          {shown.name}
          {pick ? <span className="nut-ingr-was">en vez de {name.toLocaleLowerCase("es")}</span> : null}
        </span>
        {shown.amount ? <span className="nut-ingr-amount">{shown.amount}</span> : null}
        <button
          type="button"
          className="nut-ingr-change"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={`Cambiar ${shown.name.toLocaleLowerCase("es")}`}
          onClick={() => setOpen((o) => !o)}
        >
          Cambiar
        </button>
      </span>
      {open ? (
        <ul id={listId} className="nut-ingr-options" aria-label={`Alternativas a ${name.toLocaleLowerCase("es")} aprobadas por Amanda`}>
          {pick ? (
            <li>
              <button
                type="button"
                className="nut-ingr-option"
                onClick={() => {
                  setPick(null);
                  setOpen(false);
                }}
              >
                <span>{name}</span>
                {amount ? <span className="nut-ingr-amount">{amount}</span> : null}
              </button>
            </li>
          ) : null}
          {options
            .filter((o) => o.name !== pick?.name)
            .map((o) => (
              <li key={o.name}>
                <button
                  type="button"
                  className="nut-ingr-option"
                  onClick={() => {
                    setPick(o);
                    setOpen(false);
                  }}
                >
                  <span>{o.name}</span>
                  {o.amount ? <span className="nut-ingr-amount">{o.amount}</span> : null}
                </button>
              </li>
            ))}
        </ul>
      ) : null}
    </li>
  );
}

function SlotCard({
  row,
  phase,
  now,
  showNumbers,
  check,
  swaps
}: {
  row: Row;
  phase: SlotPhase;
  now: number;
  showNumbers: boolean;
  check: CheckSlot | null;
  swaps?: IngredientSwaps[];
}) {
  const { meal } = row;
  const cat = meal ? splitCategory(meal.title) : null;
  const lines = cat ? dishLines(cat.body) : null;
  const headline = lines?.headline || cat?.body || null;
  const catName = categoryName(cat?.label ?? null);
  const catClass = `nut-cat--${cat?.key ?? "none"}`;
  const isNext = phase === "next";
  const badge = isNext ? (now >= SLOT_WINDOWS[row.slot].start ? "Ahora" : "Siguiente") : null;
  const photoUrl = meal?.hasPhoto ? `/api/meals/${meal.id}/photo?v=${encodeURIComponent(meal.updatedAt)}` : null;

  const slotLine = (
    <span className="nut-menu-slot">
      {badge ? <span className="nut-slot-badge">{badge}</span> : null}
      <span className="nut-slot-label">{row.label}</span>
      {catName ? (
        <>
          <span className="nut-menu-sep" aria-hidden="true">
            ·
          </span>
          <span className="nut-menu-cat">{catName}</span>
        </>
      ) : null}
    </span>
  );

  const ingredients = meal?.ingredients.length ? (
    <ul className="nut-ingr" aria-label={`Ingredientes de ${row.label.toLocaleLowerCase("es")}`}>
      {meal.ingredients.map((it, i) => {
        const options = swaps?.find((s) => s.key === it.name.toLocaleLowerCase("es"))?.options;
        return options?.length ? (
          <SwapLine key={i} name={it.name} amount={it.amount} options={options} />
        ) : (
          <li key={i}>
            <span className="nut-ingr-name">{it.name}</span>
            {it.amount ? <span className="nut-ingr-amount">{it.amount}</span> : null}
          </li>
        );
      })}
    </ul>
  ) : null;

  const body = (
    <>
      {meal ? (
        <>
          {lines?.rest ? <span className="nut-menu-rest">{lines.rest}</span> : null}
          {showNumbers && meal.numbers ? <p className="nut-numbers">{numbersText(meal.numbers)}</p> : null}
        </>
      ) : null}
      {ingredients ? (
        isNext ? (
          ingredients
        ) : (
          <details className="nut-menu-prep nut-ingr-fold">
            <summary>Ingredientes ({meal?.ingredients.length})</summary>
            {ingredients}
          </details>
        )
      ) : null}
      {row.supps.length ? (
        <ul className="nut-slot-supps" aria-label={`Suplementos de ${row.label.toLocaleLowerCase("es")}`}>
          {row.supps.map((s, i) => (
            <li key={i}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3.5" y="8.5" width="17" height="7" rx="3.5" transform="rotate(-35 12 12)" />
                <path d="M9.6 8.6l4.8 6.8" />
              </svg>
              <span className="nut-supp-main">
                <span className="nut-slot-supp-name">
                  <span className="sr-only">Suplemento: </span>
                  {s.name}
                </span>
                {s.notes ? <span className="nut-supp-note">{s.notes}</span> : null}
              </span>
              <span className="nut-slot-supp-time">{s.time}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {meal?.preparation ? (
        <details className="nut-menu-prep">
          <summary>Preparación</summary>
          <p className="nut-diet-text">{meal.preparation}</p>
        </details>
      ) : null}
    </>
  );

  const checkBar =
    check && meal ? (
      <MealCheckBar
        athleteId={check.athleteId}
        slotId={meal.id}
        slotLabel={row.label}
        check={check.check}
        onChange={check.onChange}
        attached={phase === "past"}
      />
    ) : null;

  const dish = headline ? <strong className="nut-menu-dish">{headline}</strong> : null;
  const thumb = meal ? (
    photoUrl ? (
      <img className="nut-menu-photo nut-menu-thumb" src={photoUrl} alt="" width={64} height={64} loading="lazy" decoding="async" />
    ) : (
      <span className="nut-menu-thumb nut-menu-ph" aria-hidden="true" />
    )
  ) : null;

  if (phase === "past") {
    return (
      <>
        <details className={`card nut-slot nut-slot--past ${checkBar ? "nut-slot--attached" : ""} ${catClass}`}>
          <summary>
            <span className="nut-slot-past-text">
              <span className="nut-slot-label">{row.label}</span>
              <span className="nut-slot-past-dish">{headline ?? `${row.supps.length} suplemento${row.supps.length === 1 ? "" : "s"}`}</span>
            </span>
          </summary>
          <div className="nut-slot-past-body">
            {meal ? (
              <div className="nut-slot-row">
                {thumb}
                <div className="nut-menu-text">{dish}</div>
              </div>
            ) : null}
            {body}
          </div>
        </details>
        {checkBar}
      </>
    );
  }

  if (isNext && photoUrl) {
    return (
      <article className={`card nut-slot nut-slot--next ${catClass}`} aria-label={`${badge}: ${row.label}`}>
        <img className="nut-slot-hero" src={photoUrl} alt="" width={640} height={360} decoding="async" />
        <div className="nut-menu-text">
          {slotLine}
          {dish}
        </div>
        {body}
        {checkBar}
      </article>
    );
  }

  return (
    <article
      className={`card nut-slot ${isNext ? "nut-slot--next" : ""} ${catClass}`}
      aria-label={badge ? `${badge}: ${row.label}` : row.label}
    >
      <div className={meal ? "nut-slot-row" : undefined}>
        {thumb}
        <div className="nut-menu-text">
          {slotLine}
          {dish}
        </div>
      </div>
      {body}
      {checkBar}
    </article>
  );
}
