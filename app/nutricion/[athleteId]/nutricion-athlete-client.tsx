"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { addDays, dateKey, DOW_SHORT, formatLongDate, MONTHS_ES, parseDateLocal, startOfWeekMonday, todayKey } from "@/lib/dates";
import { MEAL_SLOTS, type DayPlan, type MealSlot, type MealSlotKind, type SupplementEntry } from "@/lib/types";
import type { NutritionistAthleteCard } from "@/lib/queries";
import { PlanCalendar } from "@/app/components/plan-calendar";
import { PasswordForm } from "@/app/components/password-form";
import { UsernameForm } from "@/app/components/username-form";
import { NutritionPane } from "@/app/a/[id]/nutrition-pane";
import { NutAthleteNav } from "../athlete-nav";

type Props = {
  athleteId: string;
  accountLogin: string;
  dietNotes: string | null;
  supplements: SupplementEntry[];
  plans: DayPlan[];
  crests: Record<string, string>;
  athletes: NutritionistAthleteCard[];
  railFoot?: ReactNode;
};

type EditorTarget = { date: string; slot: MealSlotKind };

export function NutricionAthleteClient({
  athleteId,
  accountLogin,
  dietNotes,
  supplements,
  plans,
  crests,
  athletes,
  railFoot
}: Props) {
  const byDate = useMemo(() => Object.fromEntries(plans.map((p) => [p.date, p])), [plans]);
  const today = todayKey();
  const seed = parseDateLocal(today);
  const [year, setYear] = useState(seed.getFullYear());
  const [month, setMonth] = useState(seed.getMonth());
  const [center, setCenter] = useState(today);
  const [editor, setEditor] = useState<EditorTarget | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const weekStart = startOfWeekMonday(center);
  const weekDays = useMemo(() => {
    const monday = parseDateLocal(weekStart);
    return Array.from({ length: 7 }, (_, i) => dateKey(addDays(monday, i)));
  }, [weekStart]);
  const [meals, setMeals] = useWeekMeals(athleteId, weekDays[0], weekDays[6]);

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

  return (
    <div className="dash nut-desktop">
      <NutAthleteNav
        athletes={athletes}
        activeId={athleteId}
        onOpenSettings={() => {
          closeEditor();
          setSettingsOpen(true);
        }}
        footActions={railFoot}
      />

      <div className="nut-ws-main">
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
          editor={editor}
          onWeek={(delta) => selectDate(dateKey(addDays(parseDateLocal(center), delta * 7)))}
          onDay={selectDate}
          onCell={openCell}
        />
      </div>

      <aside className="nut-ws-side card dash-pane" aria-label="Suplementación">
        <NutritionPane
          athleteId={athleteId}
          initialDietNotes={dietNotes}
          initialSupplements={supplements}
          canEdit
        />
      </aside>

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
  editor,
  onWeek,
  onDay,
  onCell
}: {
  days: string[];
  byDate: Record<string, DayPlan>;
  meals: MealSlot[] | null;
  center: string;
  today: string;
  editor: EditorTarget | null;
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
        {MEAL_SLOTS.map(({ slot: kind, label, tier }) => (
          <div key={kind} className={tier === "snack" ? "nut-week-row nut-week-row--snack" : "nut-week-row"}>
            <div className={tier === "snack" ? "nut-week-slot nut-week-slot--snack" : "nut-week-slot"}>{label}</div>
            {days.map((iso) => {
              const meal = meals?.find((m) => m.date === iso && m.slot === kind);
              const cls = ["nut-week-cell"];
              if (tier === "snack") cls.push("nut-week-cell--snack");
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
