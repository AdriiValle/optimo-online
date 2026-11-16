"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
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
import { AthleteProfileForm } from "./athlete-profile-form";
import { CloseGlyph, MealDrawer, MealFicha, type PhotoChange } from "./meal-drawer";
import { DishPicker } from "./plantillas/dish-picker";
import { DayNoteForm } from "./plantillas/day-note";
import { fmt, perDay, periodTotal, summarizeNutrition } from "./nutrition-summary";
import { dayTypeFromMdTag } from "@/lib/nutrition/day-type";
import { averageTargets, dailyTargets, ringStatus, type DailyTargets, type RingStatus, type Target, type TargetKey } from "@/lib/nutrition/targets";
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
  initialSettingsOpen?: boolean;
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
  headerLogout,
  initialSettingsOpen
}: Props) {
  const byDate = useMemo(() => Object.fromEntries(plans.map((p) => [p.date, p])), [plans]);
  const today = todayKey();
  const seed = parseDateLocal(today);
  const [year, setYear] = useState(seed.getFullYear());
  const [month, setMonth] = useState(seed.getMonth());
  const [center, setCenter] = useState(today);
  const [editor, setEditor] = useState<EditorTarget | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(initialSettingsOpen ?? false);
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
  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    if (window.location.search.includes("ajustes=1")) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  // Cambio de semana / mes / día: la ficha de un día que ya no se ve se cierra.
  useEffect(() => {
    if (editor && !viewDays.includes(editor.date)) setEditor(null);
  }, [editor, viewDays]);

  // Escape cierra el drawer (≥1280). Los sheets (NutModal) se cierran solos con su animación y paran
  // el evento en `document`, así que con un sheet encima del drawer solo se cierra el sheet.
  useEffect(() => {
    if (!editor || !wide) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeEditor();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor, wide, closeEditor]);

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
            picker={
              <DishPicker
                athleteId={athleteId}
                date={editor.date}
                slot={editor.slot}
                onApplied={(next) => updateMeal(editor.date, editor.slot, next)}
              />
            }
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
        <p className="nut-ws-cal-note">
          Partido vs {plan.matchOpponent}
          {plan.matchTime ? ` · ${plan.matchTime}` : ""}
          {plan.matchVenue ? ` · ${plan.matchVenue === "casa" ? "en casa" : "fuera"}` : ""}
        </p>
      ) : plan?.title ? (
        <p className="nut-ws-cal-note">{plan.title}</p>
      ) : null}
    </>
  );

  return (
    <div className="nut-desktop nut-desktop-athlete">
      {/* Título de la pantalla: Large Title en la pila (<1280); en el workspace lo lleva el toolbar. */}
      <h1 className="nut-ws-title">{playerName}</h1>
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
          onProfileSaved={() => setTotalsRefresh((n) => n + 1)}
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
        <section className="card nut-wrap nut-day-stack" aria-labelledby="nut-day-stack-title">
          <header className="nut-day-stack-head">
            <h2 id="nut-day-stack-title">Menú del día</h2>
            <p>{formatLongDate(parseDateLocal(center))}</p>
          </header>
          <DayNoteForm athleteId={athleteId} date={center} compact />
          {meals === null ? (
            <p className="muted" role="status">Cargando menú…</p>
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
                onOpenFicha={() => openCell(center, kind)}
                picker={<DishPicker athleteId={athleteId} date={center} slot={kind} onApplied={(next) => updateMeal(center, kind, next)} />}
              />
            ))
          )}
        </section>
        <NutritionPane athleteId={athleteId} initialDietNotes={dietNotes} initialSupplements={supplements} canEdit />
      </div>

      {editor && !wide ? (
        <NutModal title={editorTitle} onClose={closeEditor} ficha>
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
  onProfileSaved,
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
  onProfileSaved: () => void;
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
  const viewIndex = VIEWS.findIndex((v) => v.key === view);

  return (
    <section className="card nut-week" aria-label={view === "day" ? "Menú del día" : view === "month" ? "Menú del mes" : "Menú semanal"}>
      {/* Toolbar: paso + título | segmentado | acciones (patrón Calendario de Apple). */}
      <div className="nut-toolbar">
        <div className="nut-toolbar-start">
          <div className="nut-stepper" role="group" aria-label={`Cambiar de ${unit.toLowerCase()}`}>
            <button type="button" className="nut-step-btn" aria-label={`${unit} anterior`} onClick={() => onStep(-1)}>
              <svg width="9" height="15" viewBox="0 0 9 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7.5 1.5 1.5 7.5l6 6" />
              </svg>
            </button>
            <button type="button" className="nut-step-btn" aria-label={`${unit} siguiente`} onClick={() => onStep(1)}>
              <svg width="9" height="15" viewBox="0 0 9 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m1.5 1.5 6 6-6 6" />
              </svg>
            </button>
          </div>
          <h2 aria-live="polite">{title}</h2>
        </div>
        <div
          className="segmented nut-view-switch"
          role="group"
          aria-label="Vista"
          style={{ "--seg-count": VIEWS.length, "--seg-index": viewIndex } as CSSProperties}
        >
          {VIEWS.map((v) => (
            <button key={v.key} type="button" aria-pressed={v.key === view} onClick={() => onView(v.key)}>
              {v.label}
            </button>
          ))}
        </div>
        <div className="nut-toolbar-end">
          <DayNoteButton athleteId={athleteId} date={center} />
          <ProfileSheetButton athleteId={athleteId} onSaved={onProfileSaved} />
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
          <WeekPanel days={days} totals={totals} view={view} byDate={byDate} athleteId={athleteId} onProfileSaved={onProfileSaved} side />
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
                thin.has(s.slot) ? "28px" : s.tier === "snack" ? "minmax(32px, 2fr)" : "minmax(44px, 3fr)"
              ).join(" ")}`
            }}
          >
            <div aria-hidden="true" />
            {days.map((iso) => {
              const d = parseDateLocal(iso);
              const p = byDate[iso];
              const cls = ["nut-week-day"];
              if (iso === center) cls.push("on");
              if (iso === today) cls.push("today");
              return (
                <button
                  key={iso}
                  type="button"
                  className={cls.join(" ")}
                  aria-pressed={iso === center}
                  aria-current={iso === today ? "date" : undefined}
                  onClick={() => onDay(iso)}
                >
                  <strong>
                    {DOW_SHORT[d.getDay()]} <span className="nut-dnum">{d.getDate()}</span>
                  </strong>
                  {p?.mdTag ? <span className="md-tag">{p.mdTag}</span> : null}
                  {p?.matchOpponent ? <span className="nut-week-vs">vs {p.matchOpponent}</span> : null}
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
          <WeekPanel days={days} totals={totals} view={view} byDate={byDate} athleteId={athleteId} onProfileSaved={onProfileSaved} />
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
        <span className="nut-week-add" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M7 2v10M2 7h10" />
          </svg>
        </span>
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
            aria-current={iso === today ? "date" : undefined}
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

const STATUS_TEXT: Record<RingStatus, string> = {
  low: "Falta",
  ok: "En rango",
  over: "Pasado",
  "cap-ok": "Bajo tope",
  "cap-over": "Sobre tope",
  partial: "Parcial"
};

/**
 * Estado de un KPI frente a su objetivo diario: estado (color + texto), % de relleno y cifra formateada.
 * Sin objetivo válido (perfil incompleto) no hay estado ni relleno; sin valor finito, «pendiente». Nunca NaN.
 */
function kpiState({
  value,
  goal,
  partial,
  approx,
  digits,
  emptyText,
  partialText
}: {
  value: number | null;
  goal: Target | null;
  partial: boolean;
  approx: boolean;
  digits: number;
  emptyText: string;
  partialText?: string;
}) {
  const v = value !== null && Number.isFinite(value) ? value : null;
  const g = goal && Number.isFinite(goal.target) && goal.target > 0 ? goal : null;
  const status = v !== null && g ? ringStatus(v, g, partial || approx) : null;
  const pct = v !== null && g ? v / g.target : 0;
  const fill = Math.min(Math.max(pct, 0), 1);
  let state = "";
  if (v === null) state = emptyText;
  else if (status === "partial") state = partialText ?? STATUS_TEXT.partial;
  else if (status === "low" && g) state = `${STATUS_TEXT.low} ${fmt(g.target - v, digits)}`;
  else if (status === "over" || status === "cap-over") state = `${STATUS_TEXT[status]} +${fmt((pct - 1) * 100)} %`;
  else if (status) state = STATUS_TEXT[status];
  const shown = v === null ? null : `${approx ? "≥" : ""}${fmt(v, digits)}`;
  return { value: v, goal: g, status, pct, fill, state, shown };
}

const RING_R = 27;
const RING_C = 2 * Math.PI * RING_R;

/**
 * Anillo KPI (lenguaje Actividad/Salud): el anillo se rellena `valor / objetivo` (tope visual al 100 %, marca a las 12
 * si se pasa o si es un tope) y la cifra, el objetivo y el estado van al lado en texto: el color nunca va solo.
 * `hero` = energía (anillo grande con % dentro). Sin objetivo (perfil incompleto) solo muestra la cifra.
 */
function Ring({
  label,
  unit,
  value,
  goal,
  partial,
  partialText,
  emptyText = "Pendiente",
  approx,
  digits = 0,
  detail,
  hero
}: {
  label: string;
  unit: string;
  /** null = sin datos todavía. */
  value: number | null;
  /** Objetivo en la misma unidad que `value`; null = sin perfil. */
  goal: Target | null;
  /** Faltan platos por cuantificar en el periodo: no se pinta «pasado» ni «bajo». */
  partial?: boolean;
  partialText?: string;
  /** Texto cuando `value` es null (p. ej. «Falta peso»). */
  emptyText?: string;
  /** Algún alimento no trae este valor: la cifra es un mínimo («≥»). */
  approx?: boolean;
  digits?: number;
  /** Línea secundaria (p. ej. «47 g/día · 18 % kcal»). */
  detail?: string;
  hero?: boolean;
}) {
  const k = kpiState({ value, goal, partial: !!partial, approx: !!approx, digits, emptyText, partialText });
  const cls = ["nut-ring", hero ? "nut-ring--hero" : "nut-ring--tile"];
  cls.push(k.value === null ? "nut-ring--empty" : k.status ? `nut-ring--${k.status}` : "nut-ring--none");
  return (
    <figure className={cls.join(" ")}>
      <svg className="nut-ring-svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <circle className="nut-ring-track" cx="32" cy="32" r={RING_R} />
        {k.fill > 0 ? (
          <circle
            className="nut-ring-bar"
            cx="32"
            cy="32"
            r={RING_R}
            strokeDasharray={`${k.fill * RING_C} ${RING_C}`}
            transform="rotate(-90 32 32)"
          />
        ) : null}
        {/* Marca del objetivo a las 12: visible cuando se pasa o cuando es un tope. */}
        {k.goal && (k.pct > 1 || k.goal.kind === "max") ? <line className="nut-ring-mark" x1="32" y1="0.5" x2="32" y2="9.5" /> : null}
        {hero && k.goal && k.value !== null ? (
          <text x="32" y="33" textAnchor="middle" dominantBaseline="middle" className="nut-ring-pct">
            {fmt(k.pct * 100)} %
          </text>
        ) : null}
      </svg>
      <figcaption>
        <span className="nut-ring-label">{label}</span>
        {/* «931 / 3.408 kcal/día» (patrón Actividad); un tope se lee «tope 2.300». */}
        <span className="nut-ring-figure">
          <strong>{k.shown ?? "—"}</strong>{" "}
          <span>
            {k.goal ? `${k.goal.kind === "max" ? "tope" : "/"} ${fmt(k.goal.target, digits)} ` : ""}
            {unit}
          </span>
        </span>
        {detail ? <span className="nut-ring-detail">{detail}</span> : null}
        {k.state ? <span className="nut-ring-state">{k.state}</span> : null}
      </figcaption>
    </figure>
  );
}

/** Micronutriente: fila compacta con barra de progreso (patrón Salud), mismo estado y textos que los anillos. */
function MicroMeter({
  label,
  unit,
  value,
  goal,
  partial,
  approx,
  digits
}: {
  label: string;
  unit: string;
  value: number | null;
  goal: Target | null;
  partial: boolean;
  approx: boolean;
  digits: number;
}) {
  const k = kpiState({ value, goal, partial, approx, digits, emptyText: "Pendiente" });
  const tone = k.value === null ? "empty" : (k.status ?? "none");
  return (
    <li className={`nut-micro nut-micro--${tone}`}>
      <span className="nut-micro-label">{label}</span>
      <span className="nut-micro-value">
        <strong>{k.shown ?? "—"}</strong>
        {k.goal ? ` ${k.goal.kind === "max" ? "tope" : "/"} ${fmt(k.goal.target, digits)}` : ""} {unit}
      </span>
      <span className="nut-micro-meter" aria-hidden="true">
        <i style={{ "--fill": k.fill } as CSSProperties} />
      </span>
      <span className="nut-micro-state">{k.state}</span>
    </li>
  );
}

const MACRO_KCAL_PER_G = { p: 4, c: 4, f: 9 } as const;

/**
 * Resumen nutricional del periodo visible (día / semana / mes), estimado del menú planificado.
 * Solo suman los platos cuantificados (ingredientes vigentes confirmados con alimento y gramos);
 * sin ninguno, los KPIs siguen pendientes en lugar de inventar cifras. Cada anillo mide la media por día con datos
 * frente al objetivo diario medio de esos días (`lib/nutrition/targets.ts`, tipo de día MD / MD±n / descanso).
 * Jerarquía: energía (grande) → macros (anillos) → micros (filas con barra). En «Día» va como panel lateral.
 */
function WeekPanel({
  days,
  totals,
  view,
  side,
  byDate,
  athleteId,
  onProfileSaved
}: {
  days: string[];
  totals: NutritionTotals | null;
  view: NutView;
  side?: boolean;
  byDate: Record<string, DayPlan>;
  athleteId: string;
  onProfileSaved: () => void;
}) {
  const titleId = useId();
  const [profileOpen, setProfileOpen] = useState(false);
  useEffect(() => {
    if (!profileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.classList.add("nut-modal-open");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("nut-modal-open");
    };
  }, [profileOpen]);

  if (totals === null) return null;
  const p = summarizeNutrition(totals, days);
  const has = p.quantified > 0;
  const total = periodTotal(p, "kcal");
  const kcal = perDay(p, "kcal");
  const prot = perDay(p, "protein_g");
  const carb = perDay(p, "carbs_g");
  const fat = perDay(p, "fat_g");
  const coverage = `${p.quantified}/${p.planned} platos`;
  const partial = p.quantified < p.planned;
  // Objetivo medio de los días con datos (o de todo el periodo si aún no hay ninguno).
  const goalDays = p.countedDates.length ? p.countedDates : days;
  const goals = averageTargets(
    goalDays
      .map((d) => dailyTargets(totals.profile, dayTypeFromMdTag(byDate[d]?.mdTag)))
      .filter((t): t is DailyTargets => t !== null)
  );
  const kg = totals.profile.weightKg && totals.profile.weightKg > 0 ? totals.profile.weightKg : null;
  const perKg = (t: Target | undefined): Target | null =>
    t && kg ? { kind: t.kind, target: t.target / kg, min: t.min && t.min / kg, max: t.max && t.max / kg } : null;
  // Reparto de energía por macro (4/4/9 kcal por g); solo con los tres valores.
  const macroKcal = prot && carb && fat ? prot.value * MACRO_KCAL_PER_G.p + carb.value * MACRO_KCAL_PER_G.c + fat.value * MACRO_KCAL_PER_G.f : 0;
  const share = (g: number, perG: number) => (macroKcal > 0 ? `${fmt(((g * perG) / macroKcal) * 100)} % kcal` : null);
  const macroDetail = (g: number, perG: number) => [`${fmt(g)} g/día`, share(g, perG)].filter(Boolean).join(" · ");
  const title = view === "day" ? "Resumen del día" : view === "month" ? "Resumen mensual" : "Resumen semanal";
  const periodWord = view === "month" ? "en el mes" : "en la semana";
  return (
    <section className={side ? "nut-dash nut-dash--side" : "nut-dash"} aria-labelledby={titleId}>
      <header className="nut-dash-head">
        <h3 id={titleId}>{title}</h3>
        <p className="nut-dash-meta">
          {view !== "day" && has && total ? (
            <span>
              {total.approx ? "≥" : ""}
              {fmt(total.value)} kcal {periodWord}
            </span>
          ) : null}
          <span className={!p.planned ? "nut-dash-cover" : partial ? "nut-dash-cover nut-dash-cover--partial" : "nut-dash-cover nut-dash-cover--full"}>
            {!p.planned ? "Sin platos" : `${coverage} con datos`}
          </span>
        </p>
      </header>
      <div className="nut-dash-body">
        <div className="nut-dash-energy">
          <Ring
            label="Energía"
            unit="kcal/día"
            value={kcal?.value ?? null}
            approx={kcal?.approx}
            goal={goals?.kcal ?? null}
            partial={partial}
            partialText={`Parcial · ${coverage}`}
            hero
          />
        </div>
        <div className="nut-dash-group nut-dash-macros" role="group" aria-label="Macronutrientes">
          <h4 className="nut-dash-sub" aria-hidden="true">Macronutrientes</h4>
          <Ring
            label="Proteína"
            unit="g/kg"
            value={prot && kg ? prot.value / kg : null}
            approx={prot?.approx}
            goal={perKg(goals?.protein_g)}
            partial={partial}
            emptyText={prot && !kg ? "Falta peso" : undefined}
            detail={prot ? macroDetail(prot.value, MACRO_KCAL_PER_G.p) : undefined}
            digits={1}
          />
          <Ring
            label="Hidratos"
            unit="g/kg"
            value={carb && kg ? carb.value / kg : null}
            approx={carb?.approx}
            goal={perKg(goals?.carbs_g)}
            partial={partial}
            emptyText={carb && !kg ? "Falta peso" : undefined}
            detail={carb ? macroDetail(carb.value, MACRO_KCAL_PER_G.c) : undefined}
            digits={1}
          />
          <Ring
            label="Grasa"
            unit="g/día"
            value={fat?.value ?? null}
            approx={fat?.approx}
            goal={goals?.fat_g ?? null}
            partial={partial}
            detail={fat ? (share(fat.value, MACRO_KCAL_PER_G.f) ?? undefined) : undefined}
          />
        </div>
        <div className="nut-dash-group nut-dash-micro-group" role="group" aria-label="Micronutrientes">
          <h4 className="nut-dash-sub" aria-hidden="true">Micronutrientes</h4>
          <ul className="nut-dash-micros">
            {MICROS.map((m) => {
              const v = perDay(p, m.key);
              return (
                <MicroMeter
                  key={m.key}
                  label={m.label}
                  unit={m.unit}
                  value={v?.value ?? null}
                  approx={!!v?.approx}
                  goal={goals?.[m.key] ?? null}
                  partial={partial}
                  digits={m.digits}
                />
              );
            })}
          </ul>
        </div>
      </div>
      {goals ? (
        <p className="nut-dash-note">
          {has
            ? "Media por día con datos frente al objetivo del perfil y del tipo de día. Sodio sin sal de mesa; «≥» = falta el dato en algún alimento."
            : "Pendiente: confirma alimento y gramos de los ingredientes de cada plato para calcular."}
        </p>
      ) : (
        <div className="nut-dash-goal" role="status">
          <p>Completa el perfil (nacimiento, altura y peso) para ver los objetivos.</p>
          <button type="button" className="btn secondary" onClick={() => setProfileOpen(true)}>
            Completar perfil
          </button>
        </div>
      )}
      {profileOpen ? (
        <NutModal title="Perfil del deportista" onClose={() => setProfileOpen(false)}>
          <AthleteProfileForm athleteId={athleteId} onSaved={onProfileSaved} />
        </NutModal>
      ) : null}
    </section>
  );
}

const MICROS: { key: NutrientKey & TargetKey; label: string; unit: string; digits: number }[] = [
  { key: "fiber_g", label: "Fibra", unit: "g", digits: 0 },
  { key: "sodium_mg", label: "Sodio", unit: "mg", digits: 0 },
  { key: "iron_mg", label: "Hierro", unit: "mg", digits: 1 },
  { key: "calcium_mg", label: "Calcio", unit: "mg", digits: 0 },
  { key: "vit_d_ug", label: "Vit. D", unit: "µg", digits: 1 }
];

/** Botón «Perfil» del toolbar: la ficha física en el sheet de Amanda (scrim, X, Escape, foco). */
/** Nota del día seleccionado (la ve el jugador en la tarjeta del día). */
function DayNoteButton({ athleteId, date }: { athleteId: string; date: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("nut-modal-open");
    return () => document.body.classList.remove("nut-modal-open");
  }, [open]);
  return (
    <>
      <button type="button" className="btn secondary" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        Nota del día
      </button>
      {open ? (
        <NutModal title={`Nota · ${formatLongDate(parseDateLocal(date))}`} onClose={close}>
          <DayNoteForm athleteId={athleteId} date={date} />
        </NutModal>
      ) : null}
    </>
  );
}

function ProfileSheetButton({ athleteId, onSaved }: { athleteId: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("nut-modal-open");
    return () => document.body.classList.remove("nut-modal-open");
  }, [open]);
  return (
    <>
      <button type="button" className="btn secondary" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        Perfil
      </button>
      {open ? (
        <NutModal title="Perfil del deportista" onClose={close}>
          <AthleteProfileForm athleteId={athleteId} onSaved={onSaved} />
        </NutModal>
      ) : null}
    </>
  );
}

/** Margen para desmontar el sheet si `animationend` no llega (animaciones desactivadas). */
const SHEET_CLOSE_FALLBACK_MS = 600;
const SHEET_FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/**
 * Sheet de Amanda (primitivo `.sheet*`, superficie opaca): ficha <1280, cuenta y perfil.
 * Móvil anclado abajo con asa; ≥720 centrado. Cierra con la X, Escape o tocando el fondo, y sale
 * por donde entró. Tab queda dentro; al cerrar, el foco vuelve a quien lo abrió.
 */
function NutModal({ title, onClose, ficha, children }: { title: string; onClose: () => void; ficha?: boolean; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const titleId = useId();
  const closeBtn = useRef<HTMLButtonElement>(null);
  const fallback = useRef<number | null>(null);
  /** El clic cierra solo si empezó en el fondo (arrastrar una selección fuera no cierra). */
  const downOnScrim = useRef(false);

  useEffect(() => setMounted(true), []);

  const finishClose = useCallback(() => {
    if (fallback.current) window.clearTimeout(fallback.current);
    fallback.current = null;
    onClose();
  }, [onClose]);

  const requestClose = useCallback(() => {
    setClosing(true);
    if (fallback.current) window.clearTimeout(fallback.current);
    fallback.current = window.setTimeout(finishClose, SHEET_CLOSE_FALLBACK_MS);
  }, [finishClose]);

  useEffect(() => {
    if (!mounted) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeBtn.current?.focus({ preventScroll: true });
    return () => {
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || closing) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      // En `document`: no llega al listener de `window` del drawer que pueda haber debajo.
      e.stopPropagation();
      requestClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mounted, closing, requestClose]);

  useEffect(
    () => () => {
      if (fallback.current) window.clearTimeout(fallback.current);
    },
    []
  );

  function trapFocus(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab") return;
    const nodes = [...e.currentTarget.querySelectorAll<HTMLElement>(SHEET_FOCUSABLE)].filter((n) => n.getClientRects().length > 0);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className={`sheet-scrim nut-sheet-scrim${closing ? " is-closing" : ""}`}
      onPointerDown={(e) => {
        downOnScrim.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && downOnScrim.current && !closing) requestClose();
        downOnScrim.current = false;
      }}
      onAnimationEnd={(e) => {
        if (closing && e.target === e.currentTarget) finishClose();
      }}
    >
      <div
        className={`sheet sheet--opaque nut-sheet${ficha ? " nut-sheet--ficha" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={trapFocus}
      >
        <div className="sheet-grabber" aria-hidden="true" />
        <div className="sheet-header">
          <h2 id={titleId} className="sheet-title">
            {title}
          </h2>
          <button
            ref={closeBtn}
            type="button"
            className="icon-btn sheet-close"
            aria-label="Cerrar"
            onClick={() => {
              if (!closing) requestClose();
            }}
          >
            <CloseGlyph />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
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
  onChange,
  onOpenFicha,
  picker
}: {
  athleteId: string;
  date: string;
  slot: MealSlotKind;
  label: string;
  meal: MealSlot | null;
  bare?: boolean;
  /** Franja vacía: «Buscar en mis platos» (copia un plato de la biblioteca con foto e ingredientes). */
  picker?: ReactNode;
  onChange: (meal: MealSlot | null) => void;
  /** Menú del día (<1280): abre la ficha del plato (macros, ingredientes, foto, platos iguales) en sheet. */
  onOpenFicha?: () => void;
}) {
  // La categoría viene del Word y no se edita aquí: el campo muestra el plato sin corchete.
  const cat = meal ? splitCategory(meal.title) : null;
  const [title, setTitle] = useState(cat?.body ?? "");
  const [preparation, setPreparation] = useState(meal?.preparation ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
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
    <div className={`nut-body meal-form${bare ? " meal-form--bare" : ""}`}>
      {meal?.hasPhoto && !bare ? (
        <img className="nut-menu-photo" src={`/api/meals/${meal.id}/photo?v=${encodeURIComponent(meal.updatedAt)}`} alt="" />
      ) : null}
      {!meal && picker ? picker : null}
      {meal && !bare && onOpenFicha ? (
        <button type="button" className="btn btn--tinted btn--block meal-slot-ficha" aria-haspopup="dialog" onClick={onOpenFicha}>
          Ficha del plato · macros e ingredientes
        </button>
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
        <div className="meal-form-file">
          <span className="meal-form-file-label" id={`${date}-${slot}-photo`}>
            Foto
          </span>
          <div className="meal-form-file-row">
            <button
              type="button"
              className="btn btn--tinted"
              aria-describedby={`${date}-${slot}-photo`}
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              {file ? "Cambiar foto" : "Elegir foto"}
            </button>
            <span className="meal-form-file-name">{file ? file.name : "Sin foto"}</span>
          </div>
          <input
            key={fileKey}
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
      )}
      <div className="nut-actions meal-form-actions">
        <button type="button" className="btn btn--block" disabled={busy} aria-busy={busy || undefined} onClick={() => void save()}>
          {busy ? "Guardando…" : "Guardar plato"}
        </button>
        {meal ? (
          <button type="button" className="btn btn--plain btn--block meal-form-remove" disabled={busy} onClick={() => void remove()}>
            Quitar plato
          </button>
        ) : null}
        {msg ? (
          <p className={`nut-ficha-msg ${msg === "Guardado." ? "ok" : "error"}`} role="status">
            {msg}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (bare) return form;

  const dish = meal ? dishLines(splitCategory(meal.title).body).headline : null;
  return (
    <details className="nut-details meal-slot" open>
      <summary>
        <span className="nut-details-label">
          {label}
          {dish ? <span className="meal-slot-dish">{dish}</span> : null}
        </span>
      </summary>
      {form}
    </details>
  );
}
