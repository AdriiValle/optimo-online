"use client";

import { useState } from "react";
import type { Athlete, SupplementEntry } from "@/lib/types";

type Props = {
  athleteId: string;
  initialDietNotes: string | null;
  initialSupplements: SupplementEntry[];
  isAdmin: boolean;
};

function emptySupplement(): SupplementEntry {
  return { name: "", time: "", notes: null };
}

export function NutritionPane({ athleteId, initialDietNotes, initialSupplements, isAdmin }: Props) {
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

      <details className="nut-details">
        <summary>Suplementación</summary>
        <div className="nut-body">
          {isAdmin ? (
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
          {isAdmin ? (
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

      {isAdmin ? (
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
