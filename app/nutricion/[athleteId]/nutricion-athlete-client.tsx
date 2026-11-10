"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { addDays, dateKey, DOW_ES, DOW_FULL, DOW_SHORT, formatLongDate, MONTHS_ES, parseDateLocal, startOfWeekMonday, todayKey } from "@/lib/dates";
import { MEAL_SLOTS, type DayPlan, type MealSlot, type MealSlotKind, type SupplementEntry } from "@/lib/types";
import type { NutrientKey, NutritionistAthleteCard, NutritionTotals } from "@/lib/queries";
import { BrandHeader } from "@/app/components/brand-header";
import { PlanCalendar } from "@/app/components/plan-calendar";
import { PasswordForm } from "@/app/components/password-form";
import { UsernameForm } from "@/app/components/username-form";
import { NutritionPane } from "@/app/a/[id]/nutrition-pane";
import { NutAthleteNav } from "../athlete-nav";
import { MenuWordImportButton } from "./menu-word-import";
import { MacroDonut, MealDrawer, MealFicha, type PhotoChange } from "./meal-drawer";
import { fmt, perDay, periodTotal, summarizeNutrition, type PeriodNutrition } from "./nutrition-summary";
import { dishLines, splitCategory } from "@/lib/nutrition/protein-category";
import { resizeImage } from "@/lib/image-resize";

type Props = {
  athleteId: string;
  accountLogin: string;
  dietNotes: string | null;
  supplements: SupplementEntry[];
  plans: DayPlan[];
  crests: Record<string, string>;
  athletes: NutritionistAthleteCard[];
  playerName: string;
  headerLeading: ReactNode;
  headerLogout: ReactNode;
};

type NutView = "day" | "week" | "month";

type EditorTarget = { date: string; slot: MealSlotKind };

export function NutricionAthleteClient({
  athleteId,
  accountLogin,
  dietNotes,
  supplements,
  plans,
  crests,
  athletes,
  playerName,
  headerLeading,
  headerLogout
}: Props) {
  const byDate = useMemo(() => Object.fromEntries(plans.map((p) => [p.date, p])), [plans]);
  const today = todayKey();
  const seed = parseDateLocal(today);
  const [year, setYear] = useState(seed.getFullYear());
  const [month, setMonth] = useState(seed.getMonth());
  const [center, setCenter] = useState(today);
  const [editor, setEditor] = useState<EditorTarget | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mealRefresh, setMealRefresh] = useState(0);
  /** Cambios de plato o de ingredientes: recalcula los totales sin recargar el menú. */
  const [totalsRefresh, setTotalsRefresh] = useState(0);

  const [view, setView] = useState<NutView>("week");

  const weekStart = startOfWeekMonday(center);
  const viewDays = useMemo(() => {
    if (view === "day") return [center];
    if (view === "month") {
      const c = parseDateLocal(center);
      const n = new Date(c.getFullYear(), c.getMonth() + 1, 0).getDate();
      return Array.from({ length: n }, (_, i) => dateKey(new Date(c.getFullYear(), c.getMonth(), i + 1)));
    }
    const monday = parseDateLocal(weekStart);
    return Array.from({ length: 7 }, (_, i) => dateKey(addDays(monday, i)));
  }, [view, center, weekStart]);
  const [meals, setMeals] = useWeekMeals(athleteId, viewDays[0], viewDays[viewDays.length - 1], mealRefresh);
  const totals = useNutritionTotals(athleteId, viewDays[0], viewDays[viewDays.length - 1], mealRefresh + totalsRefresh);

  const wide = useWideWorkspace();
  const editorRef = useRef(editor);
  editorRef.current = editor;
  /** Cierra la ficha y devuelve el foco a la celda que la abrió. */
  const closeEditor = useCallback(() => {
    const cur = editorRef.current;
    setEditor(null);
    if (cur) requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-cell="${cur.date}:${cur.slot}"]`)?.focus());
  }, []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  // Cambio de semana / mes / día: la ficha de un día que ya no se ve se cierra.
  useEffect(() => {
    if (editor && !viewDays.includes(editor.date)) setEditor(null);
  }, [editor, viewDays]);

  useEffect(() => {
    if (!editor && !settingsOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (editor) closeEditor();
        else closeSettings();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor, settingsOpen, closeEditor, closeSettings]);

  useEffect(() => {
    if (!editor && !settingsOpen) return;
    document.body.classList.add("nut-modal-open");
    return () => document.body.classList.remove("nut-modal-open");
  }, [editor, settingsOpen]);

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
    setTotalsRefresh((n) => n + 1);
  }

  /** Foto puesta o quitada (también en los platos iguales): miniaturas al momento, sin recargar la semana. */
  function patchMealPhotos(changes: PhotoChange[]) {
    const byId = new Map(changes.map((c) => [c.id, c]));
    setMeals((rows) =>
      rows?.map((m) => {
        const c = byId.get(m.id);
        return c ? { ...m, hasPhoto: c.hasPhoto, updatedAt: c.updatedAt } : m;
      }) ?? null
    );
  }

  function openCell(iso: string, kind: MealSlotKind) {
    if (iso !== center) selectDate(iso);
    setSettingsOpen(false);
    setEditor({ date: iso, slot: kind });
  }

  const plan = byDate[center];
  const editorMeal =
    editor && meals ? (meals.find((m) => m.date === editor.date && m.slot === editor.slot) ?? null) : null;
  const editorLabel = editor ? (MEAL_SLOTS.find((s) => s.slot === editor.slot)?.label ?? "") : "";
  const editorTitle = editor ? `${editorLabel} · ${formatLongDate(parseDateLocal(editor.date))}` : "";
  const ficha = editor ? (
    meals === null ? (
      <p className="muted">Cargando…</p>
    ) : (
      <MealFicha
        athleteId={athleteId}
        meal={editorMeal}
        nutrition={(editorMeal && totals?.meals.find((m) => m.mealSlotId === editorMeal.id)) || null}
        onItemsChanged={() => setTotalsRefresh((n) => n + 1)}
        onPhotoChanged={patchMealPhotos}
        editForm={
          <MealSlotForm
            athleteId={athleteId}
            date={editor.date}
            slot={editor.slot}
            label={editorLabel}
            meal={editorMeal}
            bare
            onChange={(next) => updateMeal(editor.date, editor.slot, next)}
          />
        }
      />
    )
  ) : null;

  const calBlock = (
    <>
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

          {plan?.matchOpponent ? (
            <p className="muted">
              Partido vs {plan.matchOpponent}
              {plan.matchTime ? ` · ${plan.matchTime}` : ""}
              {plan.matchVenue ? ` · ${plan.matchVenue === "casa" ? "en casa" : "fuera"}` : ""}
            </p>
          ) : plan?.title ? (
            <p className="muted">{plan.title}</p>
          ) : null}
    </>
  );

  return (
    <div className="dash nut-desktop">
      <BrandHeader
        wide
        player={playerName}
        leading={headerLeading}
        trailing={
          <div className="top-actions nut-top-actions">
            <button
              type="button"
              className="icon-btn"
              aria-label="Ajustes"
              onClick={() => {
                setEditor(null);
                setSettingsOpen(true);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
              </svg>
            </button>
            {headerLogout}
          </div>
        }
      />
      <NutAthleteNav
        athletes={athletes}
        activeId={athleteId}
        above={calBlock}
      />

      <div className="nut-ws-main">
        <div className="nut-ws-cal">{calBlock}</div>

        <WeekGrid
          days={viewDays}
          view={view}
          onView={setView}
          byDate={byDate}
          meals={meals}
          totals={totals}
          center={center}
          today={today}
          editor={editor}
          athleteId={athleteId}
          onMenuImported={() => setMealRefresh((n) => n + 1)}
          onStep={(delta) => {
            const c = parseDateLocal(center);
            selectDate(
              view === "day"
                ? dateKey(addDays(c, delta))
                : view === "week"
                  ? dateKey(addDays(c, delta * 7))
                  : dateKey(new Date(c.getFullYear(), c.getMonth() + delta, 1))
            );
          }}
          onDay={selectDate}
          onOpenDay={(iso) => {
            selectDate(iso);
            setView("day");
          }}
          onCell={openCell}
        />

        {editor && wide ? (
          <MealDrawer title={editorTitle} cellKey={`${editor.date}:${editor.slot}`} onClose={closeEditor}>
            {ficha}
          </MealDrawer>
        ) : null}
      </div>

      {/* Móvil: menú del día apilado (sin drawer obligatorio en pantallas estrechas). */}
      <div className="nut-ws-mobile-menu">
        <section className="card dash-pane nut-wrap">
          <h2>Menú del día</h2>
          <p className="muted">{formatLongDate(parseDateLocal(center))}</p>
          {meals === null ? (
            <p className="muted">Cargando menú…</p>
          ) : (
            MEAL_SLOTS.map(({ slot: kind, label }) => (
              <MealSlotForm
                key={`${center}-${kind}`}
                athleteId={athleteId}
                date={center}
                slot={kind}
                label={label}
                meal={meals.find((m) => m.date === center && m.slot === kind) ?? null}
                onChange={(next) => updateMeal(center, kind, next)}
              />
            ))
          )}
        </section>
        <NutritionPane athleteId={athleteId} initialDietNotes={dietNotes} initialSupplements={supplements} canEdit />
      </div>

      {editor && !wide ? (
        <NutModal title={editorTitle} onClose={closeEditor}>
          {ficha}
        </NutModal>
      ) : null}

      {settingsOpen ? (
        <NutModal title="Tu cuenta" onClose={closeSettings}>
          <section className="nut-account-settings">
            <UsernameForm initialUsername={accountLogin} />
            <PasswordForm heading="Contraseña" submitLabel="Cambiar contraseña" />
          </section>
        </NutModal>
      ) : null}
    </div>
  );
}

function useWeekMeals(athleteId: string, from: string, to: string, refresh = 0) {
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
  }, [athleteId, from, to, refresh, setMeals]);

  return state;
}

/** Totales del rango; al refrescar el mismo rango se mantiene el dato anterior (sin parpadeo). */
function useNutritionTotals(athleteId: string, from: string, to: string, refresh = 0) {
  const key = `${athleteId}:${from}:${to}`;
  const [state, setState] = useState<{ key: string; data: NutritionTotals } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Ingredientes automáticos: los platos del rango sin ingredientes vigentes se generan ya confirmados
      // (idempotente: los ya generados se saltan). Amanda corrige después en la ficha del plato.
      await fetch("/api/nutrition/meal-items/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athleteId, from, to })
      }).catch(() => null);
      if (cancelled) return;
      const res = await fetch(`/api/nutrition/totals?athleteId=${athleteId}&from=${from}&to=${to}`);
      const json = res.ok ? await res.json() : null;
      if (!cancelled && json?.data) setState({ key: `${athleteId}:${from}:${to}`, data: json.data });
    })();
    return () => {
      cancelled = true;
    };
  }, [athleteId, from, to, refresh]);

  return state?.key === key ? state.data : null;
}

const WIDE_QUERY = "(min-width: 1280px)";

/** ≥1280 (workspace con rail): la ficha va en drawer; debajo, en el sheet. */
function useWideWorkspace() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(WIDE_QUERY);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(WIDE_QUERY).matches,
    () => false
  );
}

function shortMonth(d: Date) {
  return MONTHS_ES[d.getMonth()].slice(0, 3).toLowerCase();
}

function WeekGrid({
  days,
  view,
  onView,
  byDate,
  meals,
  totals,
  center,
  today,
  editor,
  athleteId,
  onMenuImported,
  onStep,
  onDay,
  onOpenDay,
  onCell
}: {
  days: string[];
  view: NutView;
  onView: (v: NutView) => void;
  byDate: Record<string, DayPlan>;
  meals: MealSlot[] | null;
  totals: NutritionTotals | null;
  center: string;
  today: string;
  editor: EditorTarget | null;
  athleteId: string;
  onMenuImported: () => void;
  onStep: (delta: number) => void;
  onDay: (iso: string) => void;
  onOpenDay: (iso: string) => void;
  onCell: (iso: string, slot: MealSlotKind) => void;
}) {
  const first = parseDateLocal(days[0]);
  const last = parseDateLocal(days[days.length - 1]);
  const range =
    first.getMonth() === last.getMonth()
      ? `${first.getDate()}–${last.getDate()} ${shortMonth(last)}`
      : `${first.getDate()} ${shortMonth(first)} – ${last.getDate()} ${shortMonth(last)}`;
  const title =
    view === "day"
      ? formatLongDate(first)
      : view === "month"
        ? `${MONTHS_ES[first.getMonth()]} ${first.getFullYear()}`
        : `Semana ${range} ${last.getFullYear()}`;
  const unit = view === "day" ? "Día" : view === "month" ? "Mes" : "Semana";
  const thin = useThinSlots(days, meals);
  const VIEWS: { key: NutView; label: string }[] = [
    { key: "day", label: "Día" },
    { key: "week", label: "Semana" },
    { key: "month", label: "Mes" }
  ];

  return (
    <section className="card nut-week" aria-label="Menú semanal">
      {/* Toolbar: título | segmentado | paso + import (patrón Calendario de Apple). */}
      <div className="nut-toolbar">
        <h2>{title}</h2>
        <div className="nut-view-switch" role="group" aria-label="Vista">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              className={v.key === view ? "nut-view-btn on" : "nut-view-btn"}
              aria-pressed={v.key === view}
              onClick={() => onView(v.key)}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="nut-toolbar-end">
          <div className="nut-stepper">
            <button type="button" className="icon-btn" aria-label={`${unit} anterior`} onClick={() => onStep(-1)}>
              ‹
            </button>
            <button type="button" className="icon-btn" aria-label={`${unit} siguiente`} onClick={() => onStep(1)}>
              ›
            </button>
          </div>
          <MenuWordImportButton athleteId={athleteId} onImported={onMenuImported} />
        </div>
      </div>
      {view === "day" ? (
        /* Día: comidas en lista a la izquierda, resumen del día a la derecha. */
        <div className="nut-day-layout">
          <div className="nut-day-list">
            {MEAL_SLOTS.map(({ slot: kind, label, tier }) => {
              const iso = days[0];
              const rowCls = ["nut-day-row"];
              if (tier === "snack") rowCls.push("nut-day-row--snack");
              if (thin.has(kind)) rowCls.push("nut-day-row--thin");
              return (
                <div key={kind} className={rowCls.join(" ")}>
                  <div className={tier === "snack" ? "nut-week-slot nut-week-slot--snack" : "nut-week-slot"}>{label}</div>
                  <DishCell
                    iso={iso}
                    kind={kind}
                    label={label}
                    tier={tier}
                    meals={meals}
                    meal={meals?.find((m) => m.date === iso && m.slot === kind)}
                    on={editor?.date === iso && editor.slot === kind}
                    thin={thin.has(kind)}
                    onClick={() => onCell(iso, kind)}
                  />
                </div>
              );
            })}
          </div>
          <WeekPanel days={days} totals={totals} view={view} side />
        </div>
      ) : (
        <>
          {view === "month" ? (
            <MonthCalendar days={days} byDate={byDate} meals={meals} center={center} today={today} onOpen={onOpenDay} />
          ) : (
          <div
            className="nut-week-grid"
            style={{
              gridTemplateColumns: `76px repeat(${days.length}, minmax(0, 1fr))`,
              /* Filas elásticas: las franjas reparten el alto libre (principal 3 : snack 2); sin platos, fila fina. */
              gridTemplateRows: `auto ${MEAL_SLOTS.map((s) =>
                thin.has(s.slot) ? "24px" : s.tier === "snack" ? "minmax(32px, 2fr)" : "minmax(44px, 3fr)"
              ).join(" ")}`
            }}
          >
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
                    {DOW_SHORT[d.getDay()]} <span className="nut-dnum">{d.getDate()}</span>
                  </strong>
                  {p?.mdTag ? <span className="md-tag">{p.mdTag}</span> : null}
                  {p?.matchOpponent ? <span className="muted">vs {p.matchOpponent}</span> : null}
                </button>
              );
            })}
            {MEAL_SLOTS.map(({ slot: kind, label, tier }) => (
              <div key={kind} className={tier === "snack" ? "nut-week-row nut-week-row--snack" : "nut-week-row"}>
                <div className={tier === "snack" ? "nut-week-slot nut-week-slot--snack" : "nut-week-slot"}>{label}</div>
                {days.map((iso) => (
                  <DishCell
                    key={iso}
                    iso={iso}
                    kind={kind}
                    label={label}
                    tier={tier}
                    meals={meals}
                    meal={meals?.find((m) => m.date === iso && m.slot === kind)}
                    on={editor?.date === iso && editor.slot === kind}
                    colOn={iso === center}
                    thin={thin.has(kind)}
                    onClick={() => onCell(iso, kind)}
                  />
                ))}
              </div>
            ))}
          </div>
          )}
          <WeekPanel days={days} totals={totals} view={view} />
        </>
      )}
    </section>
  );
}

/**
 * Franjas sin ningún plato en los días visibles → fila fina. Mientras carga se mantiene
 * la última decisión para que la rejilla no salte al cambiar de semana.
 */
function useThinSlots(days: string[], meals: MealSlot[] | null) {
  const last = useRef<Set<MealSlotKind>>(new Set());
  if (meals === null) return last.current;
  const inRange = new Set(days);
  const used = new Set(meals.filter((m) => inRange.has(m.date)).map((m) => m.slot));
  last.current = new Set(MEAL_SLOTS.map((s) => s.slot).filter((k) => !used.has(k)));
  return last.current;
}

/** Plato como tarjeta: tinte de su proteína, filete en tinta, la proteína de titular y el resto debajo. */
function DishCell({
  iso,
  kind,
  label,
  tier,
  meals,
  meal,
  on,
  colOn,
  thin,
  onClick
}: {
  iso: string;
  kind: MealSlotKind;
  label: string;
  tier: "main" | "snack";
  meals: MealSlot[] | null;
  meal: MealSlot | undefined;
  on: boolean;
  colOn?: boolean;
  thin: boolean;
  onClick: () => void;
}) {
  const d = parseDateLocal(iso);
  const day = `${DOW_FULL[d.getDay()]} ${d.getDate()}`;
  const cat = meal ? splitCategory(meal.title) : null;
  const lines = cat ? dishLines(cat.body) : null;
  const cls = ["nut-week-cell"];
  if (tier === "snack") cls.push("nut-week-cell--snack");
  if (thin) cls.push("thin");
  if (meals !== null && !meal) cls.push("empty");
  if (cat) cls.push("nut-cat", `nut-cat--${cat.key}`);
  if (colOn) cls.push("col-on");
  if (on) cls.push("on");
  return (
    <button
      type="button"
      className={cls.join(" ")}
      data-cell={`${iso}:${kind}`}
      aria-label={
        cat && lines
          ? `${label}, ${day}: ${lines.headline}${cat.label ? ` (${cat.label.toLowerCase()})` : ""}`
          : `${label}, ${day}: sin plato`
      }
      aria-pressed={on}
      onClick={onClick}
    >
      {meals === null ? null : meal && lines ? (
        <>
          {meal.hasPhoto && tier === "main" ? (
            <img src={`/api/meals/${meal.id}/photo?v=${encodeURIComponent(meal.updatedAt)}`} alt="" />
          ) : null}
          <span className="nut-dish">
            <span className="nut-dish-head">{lines.headline}</span>
            {lines.rest ? <span className="nut-dish-rest">{lines.rest}</span> : null}
          </span>
        </>
      ) : (
        <span className="nut-week-add" aria-hidden="true">+</span>
      )}
    </button>
  );
}

/**
 * Mes: calendario a tamaño de la zona (mismo gesto que el mini del rail) con un
 * punto por franja; relleno = esa comida tiene plato. Clic → vista Día.
 */
function MonthCalendar({
  days,
  byDate,
  meals,
  center,
  today,
  onOpen
}: {
  days: string[];
  byDate: Record<string, DayPlan>;
  meals: MealSlot[] | null;
  center: string;
  today: string;
  onOpen: (iso: string) => void;
}) {
  const pad = (parseDateLocal(days[0]).getDay() + 6) % 7;
  return (
    <div className="nut-month">
      {DOW_ES.map((d) => (
        <div key={d} className="nut-month-dow" aria-hidden="true">
          {d}
        </div>
      ))}
      {Array.from({ length: pad }, (_, i) => (
        <div key={`e-${i}`} aria-hidden="true" />
      ))}
      {days.map((iso) => {
        const d = parseDateLocal(iso);
        const p = byDate[iso];
        const dayMeals = MEAL_SLOTS.map((s) => meals?.find((m) => m.date === iso && m.slot === s.slot));
        const count = dayMeals.filter(Boolean).length;
        const cls = ["nut-month-day"];
        if (meals !== null && count === 0) cls.push("empty");
        if (iso === center) cls.push("on");
        if (iso === today) cls.push("today");
        return (
          <button
            key={iso}
            type="button"
            className={cls.join(" ")}
            aria-label={`${formatLongDate(d)}: ${meals === null ? "cargando" : count ? `${count} de ${MEAL_SLOTS.length} platos` : "sin platos"}`}
            onClick={() => onOpen(iso)}
          >
            <span className="nut-month-top">
              <span className="nut-dnum">{d.getDate()}</span>
              {p?.mdTag ? <span className="md-tag">{p.mdTag}</span> : null}
            </span>
            {meals === null ? null : (
              <span className="nut-month-dots" aria-hidden="true">
                {MEAL_SLOTS.map((s, i) => {
                  const meal = dayMeals[i];
                  /* Comida y cena llevan el color de su proteína; desayuno y snacks, neutro. */
                  const cat = meal && (s.slot === "lunch" || s.slot === "dinner") ? ` nut-cat--${splitCategory(meal.title).key}` : "";
                  return <i key={s.slot} className={meal ? `on${cat}` : undefined} />;
                })}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Anillo KPI. `pct` 0–1 frente al objetivo; `value` null = sin datos todavía. */
function Ring({
  label,
  unit,
  value,
  pct,
  approx,
  digits = 0,
  size = 64
}: {
  label: string;
  unit: string;
  value: number | null;
  pct: number | null;
  /** Algún alimento no trae este valor: la cifra es un mínimo («≥»). */
  approx?: boolean;
  digits?: number;
  size?: number;
}) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const fill = value === null || pct === null ? 0 : Math.min(Math.max(pct, 0), 1);
  const shown = value === null ? null : `${approx ? "≥" : ""}${fmt(value, digits)}`;
  return (
    <figure className={value === null ? "nut-ring nut-ring--empty" : "nut-ring"}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        role="img"
        aria-label={`${label}: ${shown === null ? "pendiente" : `${shown} ${unit}`}`}
      >
        <circle className="nut-ring-track" cx="32" cy="32" r={r} />
        {fill > 0 ? (
          <circle className="nut-ring-bar" cx="32" cy="32" r={r} strokeDasharray={`${fill * c} ${c}`} transform="rotate(-90 32 32)" />
        ) : null}
        <text x="32" y="33" textAnchor="middle" dominantBaseline="middle" className="nut-ring-value">
          {shown ?? "—"}
        </text>
      </svg>
      <figcaption>
        <strong>{label}</strong>
        <span>{unit}</span>
      </figcaption>
    </figure>
  );
}

/**
 * Resumen nutricional del periodo visible (día / semana / mes), estimado del menú planificado.
 * Solo suman los platos cuantificados (ingredientes vigentes confirmados con alimento y gramos);
 * sin ninguno, los KPIs siguen pendientes en lugar de inventar cifras.
 */
function WeekPanel({ days, totals, view, side }: { days: string[]; totals: NutritionTotals | null; view: NutView; side?: boolean }) {
  if (totals === null) return null;
  const p = summarizeNutrition(totals, days);
  const has = p.quantified > 0;
  const kcal = periodTotal(p, "kcal");
  const prot = perDay(p, "protein_g");
  const carb = perDay(p, "carbs_g");
  const fat = perDay(p, "fat_g");
  const coverage = `${p.quantified}/${p.planned} platos`;
  return (
    <section className={side ? "nut-dash nut-dash--side" : "nut-dash"} aria-label="Resumen nutricional">
      <header className="nut-dash-head">
        <h3>{view === "day" ? "Resumen del día" : view === "month" ? "Resumen mensual" : "Resumen semanal"}</h3>
        <span className="muted">
          {!p.planned
            ? "Sin platos"
            : has && kcal
              ? `${kcal.approx ? "≥" : ""}${fmt(kcal.value)} kcal · ${coverage}`
              : `Pendiente · ${coverage}`}
        </span>
      </header>
      <div className="nut-dash-main">
        <Ring
          label="Energía"
          unit={view === "day" ? "kcal día" : view === "month" ? "kcal mes" : "kcal semana"}
          value={kcal?.value ?? null}
          approx={kcal?.approx}
          pct={null}
        />
        <MacroDonut grams={prot && carb && fat ? { p: prot.value, c: carb.value, f: fat.value } : null} />
        <div className="nut-dash-pair">
          <PerKgRing label="Proteína" v={prot} p={p} />
          <PerKgRing label="Hidratos" v={carb} p={p} />
        </div>
      </div>
      <div className="nut-dash-micros">
        {MICROS.map((m) => {
          const v = perDay(p, m.key);
          return (
            <Ring key={m.key} label={m.label} unit={m.unit} value={v?.value ?? null} approx={v?.approx} digits={m.digits} pct={null} size={48} />
          );
        })}
      </div>
      <p className="muted">
        {has
          ? "Estimado del menú planificado, solo platos con ingredientes confirmados. Sodio sin sal de mesa; «≥» = falta el dato en algún alimento."
          : "Pendiente: confirma alimento y gramos de los ingredientes de cada plato para calcular."}
      </p>
    </section>
  );
}

const MICROS: { key: NutrientKey; label: string; unit: string; digits: number }[] = [
  { key: "fiber_g", label: "Fibra", unit: "g/día", digits: 0 },
  { key: "sodium_mg", label: "Sodio", unit: "mg/día", digits: 0 },
  { key: "iron_mg", label: "Hierro", unit: "mg/día", digits: 1 },
  { key: "calcium_mg", label: "Calcio", unit: "mg/día", digits: 0 },
  { key: "vit_d_ug", label: "Vit. D", unit: "µg/día", digits: 1 }
];

/** g/kg/día: necesita platos cuantificados y el peso del deportista. */
function PerKgRing({ label, v, p }: { label: string; v: { value: number; approx: boolean } | null; p: PeriodNutrition }) {
  const kg = p.weightKg;
  return (
    <Ring
      label={label}
      unit={v && !kg ? "falta peso" : "g/kg/día"}
      value={v && kg ? v.value / kg : null}
      approx={v?.approx}
      digits={1}
      pct={null}
      size={56}
    />
  );
}

function NutModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="nut-modal-root" role="presentation" onClick={onClose}>
      <div
        className="nut-modal card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nut-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="nut-modal-head">
          <h2 id="nut-modal-title">{title}</h2>
          <button type="button" className="icon-btn" aria-label="Cerrar" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="nut-modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function MealSlotForm({
  athleteId,
  date,
  slot,
  label,
  meal,
  bare,
  onChange
}: {
  athleteId: string;
  date: string;
  slot: MealSlotKind;
  label: string;
  meal: MealSlot | null;
  bare?: boolean;
  onChange: (meal: MealSlot | null) => void;
}) {
  // La categoría viene del Word y no se edita aquí: el campo muestra el plato sin corchete.
  const cat = meal ? splitCategory(meal.title) : null;
  const [title, setTitle] = useState(cat?.body ?? "");
  const [preparation, setPreparation] = useState(meal?.preparation ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setTitle(meal ? splitCategory(meal.title).body : "");
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
    // Texto sin tocar → título original tal cual (el hash de ingredientes no cambia); si cambia, mismo corchete delante.
    const typed = title.trim();
    const fullTitle = meal && cat && typed === cat.body ? meal.title : cat?.label ? `[${cat.label}] ${typed}` : typed;
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/meals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athleteId, date, slot, title: fullTitle, preparation: preparation.trim() || null })
    });
    if (!res.ok) {
      setBusy(false);
      setMsg("No se pudo guardar.");
      return;
    }
    let saved: MealSlot = (await res.json()).data;
    if (file) {
      const small = await resizeImage(file).catch(() => null);
      const fd = new FormData();
      if (small) fd.set("photo", small);
      const up = small && (await fetch(`/api/meals/${saved.id}/photo`, { method: "POST", body: fd }).catch(() => null));
      if (!up?.ok) {
        onChange(saved);
        setBusy(false);
        setMsg(small ? "Plato guardado; la foto no se pudo subir." : "Plato guardado; la foto no se pudo leer.");
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

  const form = (
    <div className="nut-body meal-form">
      {meal?.hasPhoto && !bare ? (
        <img className="nut-menu-photo" src={`/api/meals/${meal.id}/photo?v=${encodeURIComponent(meal.updatedAt)}`} alt="" />
      ) : null}
      <label>
        Plato
        <input value={title} maxLength={200 - (cat?.label ? cat.label.length + 3 : 0)} placeholder="Ej. Arroz con pollo" onChange={(e) => setTitle(e.target.value)} />
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
      {/* En la ficha, la foto de un plato ya creado se gestiona en el héroe (con «platos iguales»). */}
      {bare && meal ? null : (
        <label>
          Foto
          <input
            key={fileKey}
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
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
  );

  if (bare) return form;

  return (
    <details className="nut-details meal-slot" open>
      <summary>
        {label}
        {meal ? ` · ${meal.title}` : ""}
      </summary>
      {form}
    </details>
  );
}
