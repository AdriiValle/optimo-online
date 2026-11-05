"use client";

import { useEffect, useState } from "react";
import { MEAL_SLOTS, type MealSlot, type SupplementEntry } from "@/lib/types";

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

  const supplementList =
    supplements.length > 0 ? (
      <ul className="nut-supp-list">
        {supplements.map((s, i) => (
          <li key={i}>
            <span className="nut-supp-time">{s.time}</span>
            <span>
              <strong>{s.name}</strong>
              {s.notes ? <span className="muted"> · {s.notes}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="muted">Sin suplementos indicados.</p>
    );

  return (
    <section className="card dash-pane nut-wrap">
      <h2>Nutrición</h2>

      {menuDate ? <DayMenu athleteId={athleteId} date={menuDate} /> : null}

      <details className="nut-details">
        <summary>Suplementación</summary>
        <div className="nut-body">
          {canEdit ? (
            <>
              <div className="nut-supp-edit">
                {supplements.map((row, i) => (
                  <div className="nut-supp-row" key={i}>
                    <label>
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
                    <label>
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
                      aria-label="Quitar suplemento"
                      onClick={() => setSupplements(supplements.filter((_, j) => j !== i))}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => setSupplements([...supplements, emptySupplement()])}>
                Añadir suplemento
              </button>
            </>
          ) : (
            supplementList
          )}
        </div>
      </details>

      <details className="nut-details">
        <summary>Dieta</summary>
        <div className="nut-body">
          {canEdit ? (
            <label className="nut-diet-label">
              Plan diario
              <textarea
                rows={8}
                value={dietNotes}
                placeholder="Pauta de comidas, macros, recordatorios…"
                onChange={(e) => setDietNotes(e.target.value)}
              />
            </label>
          ) : dietNotes.trim() ? (
            <p className="nut-diet-text">{dietNotes}</p>
          ) : (
            <p className="muted">Aún no hay plan de dieta.</p>
          )}
        </div>
      </details>

      {canEdit ? (
        <div className="nut-actions">
          <button type="button" className="btn" disabled={busy} onClick={() => void save()}>
            {busy ? "Guardando…" : "Guardar nutrición"}
          </button>
          {msg ? <p className={msg.includes("No") ? "error" : "ok"}>{msg}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

function DayMenu({ athleteId, date }: { athleteId: string; date: string }) {
  const [meals, setMeals] = useState<MealSlot[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMeals(null);
    (async () => {
      const res = await fetch(`/api/meals?athleteId=${athleteId}&from=${date}&to=${date}`);
      if (cancelled) return;
      if (!res.ok) {
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

  return (
    <div className="nut-menu">
      <h3>Menú del día</h3>
      {meals === null ? (
        <p className="muted">Cargando menú…</p>
      ) : meals.length === 0 ? (
        <p className="muted">Sin platos para este día.</p>
      ) : (
        <ul className="nut-menu-list">
          {MEAL_SLOTS.map(({ slot, label }) => {
            const meal = meals.find((m) => m.slot === slot);
            if (!meal) return null;
            return (
              <li key={slot} className="nut-menu-item">
                {meal.hasPhoto ? (
                  <img className="nut-menu-photo" src={`/api/meals/${meal.id}/photo?v=${encodeURIComponent(meal.updatedAt)}`} alt="" />
                ) : null}
                <div>
                  <span className="nut-menu-slot">{label}</span>
                  <strong>{meal.title}</strong>
                  {meal.preparation ? <p className="nut-diet-text">{meal.preparation}</p> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
