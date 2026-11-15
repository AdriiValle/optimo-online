"use client";

import { useRef, useState } from "react";
import { startOfWeekMonday, todayKey } from "@/lib/dates";
import type { SupplementEntry } from "@/lib/types";
import { NutritionSegmented, panelId, tabId, type NutritionView } from "./nutrition/segments";
import { ShoppingView } from "./nutrition/shopping-view";
import { TodayView } from "./nutrition/today-view";
import { longDayLabel, WeekView } from "./nutrition/week-view";

type Props = {
  athleteId: string;
  initialDietNotes: string | null;
  initialSupplements: SupplementEntry[];
  /** Admin o nutricionista asignada: edita suplementos y dieta. */
  canEdit: boolean;
  /** Si llega, vista del jugador: segmentado Hoy · Semana · Compra con el menú de ese día. */
  menuDate?: string;
};

function emptySupplement(): SupplementEntry {
  return { name: "", time: "", notes: null };
}

export function NutritionPane({ athleteId, initialDietNotes, initialSupplements, canEdit, menuDate }: Props) {
  const [dietNotes, setDietNotes] = useState(initialDietNotes ?? "");
  const [supplements, setSupplements] = useState<SupplementEntry[]>(
    initialSupplements.length ? initialSupplements : []
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<NutritionView>("today");
  /** Sube al guardar en el editor (admin): la vista «Hoy» vuelve a pedir suplementos e indicaciones. */
  const [reloadKey, setReloadKey] = useState(0);
  /** Día abierto desde «Semana» (null = el día del calendario, `menuDate`). */
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(menuDate ?? todayKey()));
  const [today] = useState(todayKey);
  const panelRef = useRef<HTMLDivElement>(null);
  // Si el jugador cambia de día en el calendario de arriba, «Hoy» vuelve a seguirlo.
  const [seenMenuDate, setSeenMenuDate] = useState(menuDate);
  if (menuDate !== seenMenuDate) {
    setSeenMenuDate(menuDate);
    setOpenDate(null);
    if (menuDate) setWeekStart(startOfWeekMonday(menuDate));
  }
  const dayDate = openDate ?? menuDate;

  function changeView(next: NutritionView) {
    // «Semana» se abre en la semana del día que se está viendo.
    if (next === "week" && dayDate) setWeekStart(startOfWeekMonday(dayDate));
    setView(next);
  }

  function openDay(date: string) {
    setOpenDate(date === menuDate ? null : date);
    setView("today");
    // El botón pulsado desaparece con la vista: el foco pasa al panel de «Hoy».
    requestAnimationFrame(() => panelRef.current?.focus());
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    const payload = {
      dietNotes: dietNotes.trim() || null,
      supplements: supplements
        .map((s) => ({
          name: s.name.trim(),
          time: s.time.trim(),
          notes: s.notes?.trim() || null
        }))
        .filter((s) => s.name && s.time)
    };
    const res = await fetch(`/api/athletes/${athleteId}/nutrition`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setBusy(false);
    if (!res.ok) {
      setMsg("No se pudo guardar.");
      return;
    }
    const json = await res.json();
    setDietNotes(json.data?.dietNotes ?? "");
    setSupplements(json.data?.supplements ?? []);
    setMsg("Guardado.");
    setReloadKey((k) => k + 1);
  }

  const editor = (
    <section className="card nut-wrap nut-edit" aria-labelledby="nut-edit-title">
      <h2 id="nut-edit-title" className="nut-title">
        Suplementos y dieta
      </h2>

      <details className="nut-details">
        <summary>
          <span className="nut-details-label">Suplementación</span>
          <span className="nut-details-meta">{supplements.length > 0 ? supplements.length : "Ninguno"}</span>
        </summary>
        <div className="nut-body">
          {supplements.length > 0 ? (
            <div className="nut-supp-edit">
              {supplements.map((row, i) => (
                <div className="nut-supp-row" key={i}>
                  <label className="nut-supp-name-field">
                    Suplemento
                    <input
                      value={row.name}
                      placeholder="Ej. Creatina"
                      onChange={(e) => {
                        const next = [...supplements];
                        next[i] = { ...next[i], name: e.target.value };
                        setSupplements(next);
                      }}
                    />
                  </label>
                  <label className="nut-supp-time-field">
                    Hora
                    <input
                      value={row.time}
                      placeholder="08:00 o desayuno"
                      onChange={(e) => {
                        const next = [...supplements];
                        next[i] = { ...next[i], time: e.target.value };
                        setSupplements(next);
                      }}
                    />
                  </label>
                  <label className="nut-supp-notes">
                    Notas
                    <input
                      value={row.notes ?? ""}
                      placeholder="Opcional"
                      onChange={(e) => {
                        const next = [...supplements];
                        next[i] = { ...next[i], notes: e.target.value || null };
                        setSupplements(next);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="icon-btn nut-supp-rm"
                    aria-label={row.name.trim() ? `Quitar ${row.name.trim()}` : "Quitar suplemento"}
                    onClick={() => setSupplements(supplements.filter((_, j) => j !== i))}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="nut-body-empty">Sin suplementos. Añade el primero con su hora o comida.</p>
          )}
          <button type="button" className="btn btn--tinted nut-supp-add" onClick={() => setSupplements([...supplements, emptySupplement()])}>
            Añadir suplemento
          </button>
        </div>
      </details>

      <details className="nut-details">
        <summary>
          <span className="nut-details-label">Dieta</span>
          <span className="nut-details-meta">{dietNotes.trim() ? "Con indicaciones" : "Vacía"}</span>
        </summary>
        <div className="nut-body">
          <label className="nut-diet-label">
            Plan diario
            <textarea
              rows={8}
              value={dietNotes}
              placeholder="Pauta de comidas, macros, recordatorios…"
              onChange={(e) => setDietNotes(e.target.value)}
            />
          </label>
        </div>
      </details>

      <div className="nut-actions">
        <button type="button" className="btn btn--block" disabled={busy} aria-busy={busy || undefined} onClick={() => void save()}>
          {busy ? "Guardando…" : "Guardar nutrición"}
        </button>
        {msg ? (
          <p className={msg.includes("No") ? "error" : "ok"} role="status">
            {msg}
          </p>
        ) : null}
      </div>
    </section>
  );

  return (
    <div className="dash-pane nut-pane">
      {menuDate && dayDate ? (
        <>
          <NutritionSegmented value={view} onChange={changeView} />
          <div className="nut-view" role="tabpanel" id={panelId(view)} aria-labelledby={tabId(view)} ref={panelRef} tabIndex={-1}>
            {view === "today" ? (
              <>
                {openDate ? (
                  <div className="nut-dayctx">
                    <span className="nut-dayctx-date">{longDayLabel(openDate)}</span>
                    <button type="button" className="btn btn--plain nut-dayctx-back" onClick={() => {
                        setOpenDate(null);
                        panelRef.current?.focus();
                      }}>
                      {menuDate === today ? "Volver a hoy" : `Volver al ${longDayLabel(menuDate).toLocaleLowerCase("es")}`}
                    </button>
                  </div>
                ) : null}
                <TodayView athleteId={athleteId} date={dayDate} reloadKey={reloadKey} />
              </>
            ) : view === "week" ? (
              <WeekView
                athleteId={athleteId}
                weekStart={weekStart}
                today={today}
                openDate={dayDate}
                reloadKey={reloadKey}
                onWeekChange={setWeekStart}
                onOpenDay={openDay}
              />
            ) : (
              <ShoppingView athleteId={athleteId} date={dayDate} today={today} />
            )}
          </div>
        </>
      ) : null}
      {canEdit ? editor : null}
    </div>
  );
}
