"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { addDays, dateKey, DOW_SHORT, formatLongDate, MONTHS_ES, parseDateLocal, startOfWeekMonday, todayKey } from "@/lib/dates";
import { MEAL_SLOTS, type DayPlan, type MealSlot, type MealSlotKind, type SupplementEntry } from "@/lib/types";
import type { NutritionistAthleteCard } from "@/lib/queries";
import { BrandHeader } from "@/app/components/brand-header";
import { PlanCalendar } from "@/app/components/plan-calendar";
import { PasswordForm } from "@/app/components/password-form";
import { UsernameForm } from "@/app/components/username-form";
import { NutritionPane } from "@/app/a/[id]/nutrition-pane";
import { NutAthleteNav } from "../athlete-nav";
import { MenuWordImportButton } from "./menu-word-import";

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

  const closeEditor = useCallback(() => setEditor(null), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

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
                closeEditor();
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
          onCell={openCell}
        />
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

      {editor ? (
        <NutModal title={`${editorLabel} · ${formatLongDate(parseDateLocal(editor.date))}`} onClose={closeEditor}>
          {meals === null ? (
            <p className="muted">Cargando…</p>
          ) : (
            <MealSlotForm
              athleteId={athleteId}
              date={editor.date}
              slot={editor.slot}
              label={editorLabel}
              meal={editorMeal}
              bare
              onChange={(next) => {
                updateMeal(editor.date, editor.slot, next);
              }}
            />
          )}
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

function shortMonth(d: Date) {
  return MONTHS_ES[d.getMonth()].slice(0, 3).toLowerCase();
}

function WeekGrid({
  days,
  view,
  onView,
  byDate,
  meals,
  center,
  today,
  editor,
  athleteId,
  onMenuImported,
  onStep,
  onDay,
  onCell
}: {
  days: string[];
  view: NutView;
  onView: (v: NutView) => void;
  byDate: Record<string, DayPlan>;
  meals: MealSlot[] | null;
  center: string;
  today: string;
  editor: EditorTarget | null;
  athleteId: string;
  onMenuImported: () => void;
  onStep: (delta: number) => void;
  onDay: (iso: string) => void;
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
      {view === "month" ? (
        <div className="nut-month-list">
          {days.map((iso) => {
            const d = parseDateLocal(iso);
            const titles = MEAL_SLOTS.map((s) => meals?.find((m) => m.date === iso && m.slot === s.slot)).filter(
              (m): m is MealSlot => !!m
            );
            const cls = ["nut-month-row"];
            if (iso === center) cls.push("on");
            if (iso === today) cls.push("today");
            return (
              <button key={iso} type="button" className={cls.join(" ")} onClick={() => onDay(iso)}>
                <strong>
                  {DOW_SHORT[d.getDay()]} <span className="nut-dnum">{d.getDate()}</span>
                </strong>
                <span className="muted">
                  {meals === null ? "…" : titles.length ? titles.map((m) => m.title).join(" · ") : "Sin platos"}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
      <div className="nut-week-grid" style={{ gridTemplateColumns: `76px repeat(${days.length}, minmax(0, 1fr))` }}>
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
            {days.map((iso) => {
              const meal = meals?.find((m) => m.date === iso && m.slot === kind);
              const cls = ["nut-week-cell"];
              if (tier === "snack") cls.push("nut-week-cell--snack");
              if (meals !== null && !meal) cls.push("empty");
              if (iso === center) cls.push("col-on");
              if (editor?.date === iso && editor.slot === kind) cls.push("on");
              return (
                <button
                  key={iso}
                  type="button"
                  className={cls.join(" ")}
                  aria-label={`${label} ${iso}${meal ? `: ${meal.title}` : ""}`}
                  aria-pressed={editor?.date === iso && editor.slot === kind}
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
                    <span className="nut-week-add" aria-hidden="true">+</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      )}
      <WeekPanel days={days} meals={meals} view={view} />
    </section>
  );
}

/** Anillo KPI. `pct` 0–1 frente al objetivo; `value` null = sin datos todavía. */
function Ring({
  label,
  unit,
  value,
  pct,
  size = 64
}: {
  label: string;
  unit: string;
  value: number | null;
  pct: number | null;
  size?: number;
}) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const fill = value === null || pct === null ? 0 : Math.min(Math.max(pct, 0), 1);
  return (
    <figure className={value === null ? "nut-ring nut-ring--empty" : "nut-ring"}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        role="img"
        aria-label={`${label}: ${value === null ? "pendiente" : `${value} ${unit}`}`}
      >
        <circle className="nut-ring-track" cx="32" cy="32" r={r} />
        {fill > 0 ? (
          <circle className="nut-ring-bar" cx="32" cy="32" r={r} strokeDasharray={`${fill * c} ${c}`} transform="rotate(-90 32 32)" />
        ) : null}
        <text x="32" y="33" textAnchor="middle" dominantBaseline="middle" className="nut-ring-value">
          {value === null ? "—" : value.toLocaleString("es-ES")}
        </text>
      </svg>
      <figcaption>
        <strong>{label}</strong>
        <span>{unit}</span>
      </figcaption>
    </figure>
  );
}

type MacroKcal = { p: number; c: number; f: number };

const MACROS = [
  { key: "p", label: "Proteína" },
  { key: "c", label: "Hidratos" },
  { key: "f", label: "Grasas" }
] as const;

/** Donut de reparto P/HC/G en % de kcal; null = sin cantidades. */
function MacroDonut({ kcal }: { kcal: MacroKcal | null }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const total = kcal ? kcal.p + kcal.c + kcal.f : 0;
  let offset = 0;
  return (
    <figure className="nut-macro">
      <svg width={96} height={96} viewBox="0 0 64 64" role="img" aria-label="Reparto de macronutrientes">
        <circle className="nut-ring-track" cx="32" cy="32" r={r} />
        {kcal && total > 0
          ? MACROS.map(({ key }) => {
              const len = (kcal[key] / total) * c;
              const seg = (
                <circle
                  key={key}
                  className={`nut-macro-seg nut-macro-seg--${key}`}
                  cx="32"
                  cy="32"
                  r={r}
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 32 32)"
                />
              );
              offset += len;
              return seg;
            })
          : null}
        <text x="32" y="33" textAnchor="middle" dominantBaseline="middle" className="nut-ring-value">
          {kcal && total > 0 ? "P·HC·G" : "—"}
        </text>
      </svg>
      <figcaption>
        <ul className="nut-macro-legend">
          {MACROS.map(({ key, label }) => (
            <li key={key}>
              <i className={`nut-macro-dot nut-macro-dot--${key}`} aria-hidden="true" />
              <strong>{label}</strong>
              <span>{kcal && total > 0 ? `${Math.round((kcal[key] / total) * 100)} % kcal` : "— g · — % kcal"}</span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}

/**
 * Resumen nutricional de la semana. Los platos (MealSlot) solo guardan título y
 * preparación en texto: no hay gramos ni nutrientes, así que los KPIs se muestran
 * pendientes en lugar de inventar cifras.
 */
function WeekPanel({ days, meals, view }: { days: string[]; meals: MealSlot[] | null; view: NutView }) {
  if (meals === null) return null;
  const planned = meals.filter((m) => days.includes(m.date)).length;
  return (
    <section className="nut-dash" aria-label="Resumen nutricional">
      <header className="nut-dash-head">
        <h3>{view === "day" ? "Resumen del día" : view === "month" ? "Resumen mensual" : "Resumen semanal"}</h3>
        <span className="muted">
          {planned}/{MEAL_SLOTS.length * days.length} platos
        </span>
      </header>
      <div className="nut-dash-main">
        <Ring label="Energía" unit={view === "day" ? "kcal día" : view === "month" ? "kcal mes" : "kcal semana"} value={null} pct={null} size={96} />
        <MacroDonut kcal={null} />
        <div className="nut-dash-pair">
          <Ring label="Proteína" unit="g/kg/día" value={null} pct={null} />
          <Ring label="Hidratos" unit="g/kg/día" value={null} pct={null} />
        </div>
      </div>
      <div className="nut-dash-micros">
        <Ring label="Fibra" unit="g/día" value={null} pct={null} size={56} />
        <Ring label="Sodio" unit="mg/día" value={null} pct={null} size={56} />
        <Ring label="Hierro" unit="mg/día" value={null} pct={null} size={56} />
        <Ring label="Calcio" unit="mg/día" value={null} pct={null} size={56} />
        <Ring label="Vit. D" unit="µg/día" value={null} pct={null} size={56} />
      </div>
      <p className="muted">Pendiente de cantidades: los platos aún no guardan gramos ni nutrientes.</p>
    </section>
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

  const form = (
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
