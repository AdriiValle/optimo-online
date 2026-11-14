"use client";

import { useEffect, useState } from "react";
import { MEAL_SLOTS, type MealSlot, type SupplementEntry } from "@/lib/types";
import { dishLines, splitCategory } from "@/lib/nutrition/protein-category";

type Props = {
  athleteId: string;
  initialDietNotes: string | null;
  initialSupplements: SupplementEntry[];
  /** Admin o nutricionista asignada: edita suplementos y dieta. */
  canEdit: boolean;
  /** Si llega, muestra el menú (platos) de ese día en solo lectura. */
  menuDate?: string;
};

function emptySupplement(): SupplementEntry {
  return { name: "", time: "", notes: null };
}

/** Nombre legible de la categoría del corchete («CARNE» → «Carne»). */
function categoryName(label: string | null) {
  if (!label) return null;
  const lower = label.toLocaleLowerCase("es");
  return lower.charAt(0).toLocaleUpperCase("es") + lower.slice(1);
}

export function NutritionPane({ athleteId, initialDietNotes, initialSupplements, canEdit, menuDate }: Props) {
  const [dietNotes, setDietNotes] = useState(initialDietNotes ?? "");
  const [supplements, setSupplements] = useState<SupplementEntry[]>(
    initialSupplements.length ? initialSupplements : []
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
  }

  const readOnly = (
    <>
      <section className="nut-group" aria-labelledby="nut-supp-title">
        <h2 id="nut-supp-title" className="nut-group-title">
          Suplementación
        </h2>
        {supplements.length > 0 ? (
          <ul className="nut-supp-list">
            {supplements.map((s, i) => (
              <li key={i}>
                <span className="nut-supp-main">
                  <span className="nut-supp-name">{s.name}</span>
                  {s.notes ? <span className="nut-supp-note">{s.notes}</span> : null}
                </span>
                <span className="nut-supp-time">{s.time}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="nut-group-empty">Sin suplementos indicados.</p>
        )}
      </section>

      <section className="nut-group" aria-labelledby="nut-diet-title">
        <h2 id="nut-diet-title" className="nut-group-title">
          Indicaciones de dieta
        </h2>
        {dietNotes.trim() ? (
          <div className="nut-diet-card">
            <p className="nut-diet-text">{dietNotes}</p>
          </div>
        ) : (
          <p className="nut-group-empty">Aún no hay indicaciones de dieta.</p>
        )}
      </section>
    </>
  );

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
      {menuDate ? <DayMenu athleteId={athleteId} date={menuDate} /> : null}
      {canEdit ? editor : readOnly}
    </div>
  );
}

function DayMenu({ athleteId, date }: { athleteId: string; date: string }) {
  const [meals, setMeals] = useState<MealSlot[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setMeals(null);
    setFailed(false);
    (async () => {
      const res = await fetch(`/api/meals?athleteId=${athleteId}&from=${date}&to=${date}`);
      if (cancelled) return;
      if (!res.ok) {
        setFailed(true);
        setMeals([]);
        return;
      }
      const json = await res.json();
      if (!cancelled) setMeals(json.data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [athleteId, date]);

  const rows = meals
    ? MEAL_SLOTS.flatMap(({ slot, label }) => {
        const meal = meals.find((m) => m.slot === slot);
        return meal ? [{ label, meal }] : [];
      })
    : [];

  return (
    <section className="card nut-menu" aria-labelledby="nut-menu-title" aria-busy={meals === null || undefined}>
      <h2 id="nut-menu-title" className="nut-title">
        Menú del día
      </h2>
      {meals === null ? (
        <ul className="nut-menu-list" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="nut-menu-item">
              <span className="skeleton nut-menu-thumb" />
              <span className="nut-menu-text">
                <span className="skeleton skeleton--line nut-skel-short" />
                <span className="skeleton skeleton--line" />
              </span>
            </li>
          ))}
        </ul>
      ) : failed ? (
        <div className="nut-empty nut-empty--error" role="alert">
          <strong>No se pudo cargar el menú</strong>
          <span>Comprueba la conexión y vuelve a abrir la pestaña.</span>
        </div>
      ) : rows.length === 0 ? (
        <div className="nut-empty" role="status">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="13" r="7.5" />
            <circle cx="12" cy="13" r="4" />
            <path d="M3 3.5v5a2 2 0 0 0 2 2M3 3.5v17M21 3.5c-1.5 1-2 3-2 5.5h2v11.5" />
          </svg>
          <strong>Sin menú para este día</strong>
          <span>Cuando Amanda cargue los platos de este día, aparecerán aquí por comidas.</span>
        </div>
      ) : (
        <ul className="nut-menu-list">
          {rows.map(({ label, meal }) => {
            const cat = splitCategory(meal.title);
            const { headline, rest } = dishLines(cat.body);
            const catName = categoryName(cat.label);
            return (
              <li key={meal.slot} className={`nut-menu-item nut-cat--${cat.key}`}>
                {meal.hasPhoto ? (
                  <img
                    className="nut-menu-photo nut-menu-thumb"
                    src={`/api/meals/${meal.id}/photo?v=${encodeURIComponent(meal.updatedAt)}`}
                    alt=""
                    width={64}
                    height={64}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="nut-menu-thumb nut-menu-ph" aria-hidden="true" />
                )}
                <div className="nut-menu-text">
                  <span className="nut-menu-slot">
                    {label}
                    {catName ? (
                      <>
                        <span className="nut-menu-sep" aria-hidden="true">
                          ·
                        </span>
                        <span className="nut-menu-cat">{catName}</span>
                      </>
                    ) : null}
                  </span>
                  <strong className="nut-menu-dish">{headline || cat.body}</strong>
                  {rest ? <span className="nut-menu-rest">{rest}</span> : null}
                  {meal.preparation ? (
                    <details className="nut-menu-prep">
                      <summary>Preparación</summary>
                      <p className="nut-diet-text">{meal.preparation}</p>
                    </details>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
