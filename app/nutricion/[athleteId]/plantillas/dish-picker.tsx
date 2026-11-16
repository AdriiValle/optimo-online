"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { MealSlot, MealSlotKind } from "@/lib/types";
import type { Dish } from "@/lib/nutrition/templates-queries";

/**
 * «Buscar en mis platos» al crear un plato nuevo: elige uno de la biblioteca y se copia a la franja
 * con su foto y sus ingredientes (ya confirmados).
 */
export function DishPicker({
  athleteId,
  date,
  slot,
  onApplied
}: {
  athleteId: string;
  date: string;
  slot: MealSlotKind;
  onApplied: (meal: MealSlot) => void;
}) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Dish[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      const res = await fetch(`/api/nutrition/templates/dishes?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal }).catch(
        () => null
      );
      if (ctrl.signal.aborted) return;
      if (!res?.ok) {
        setResults([]);
        setMsg("No se han podido cargar tus platos.");
        return;
      }
      const list: Dish[] = (await res.json()).data;
      // Los de esta franja primero (un desayuno guardado encaja mejor en otro desayuno).
      setResults([...list.filter((d) => d.slot === slot), ...list.filter((d) => d.slot !== slot)].slice(0, 20));
      setMsg(null);
    }, 200);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [open, q, slot]);

  async function pick(d: Dish) {
    if (busyId) return;
    setBusyId(d.id);
    setMsg(null);
    const res = await fetch(`/api/nutrition/templates/dishes/${d.id}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athleteId, date, slot })
    }).catch(() => null);
    setBusyId(null);
    if (!res?.ok) return setMsg(res ? "No se ha podido poner el plato." : "Sin conexión. Prueba otra vez.");
    onApplied((await res.json()).data as MealSlot);
  }

  if (!open) {
    return (
      <button type="button" className="btn btn--tinted btn--block nut-dish-open" aria-expanded={false} onClick={() => setOpen(true)}>
        Buscar en mis platos
      </button>
    );
  }

  return (
    <div className="nut-dish-picker" role="group" aria-labelledby={`${uid}-l`}>
      <div className="nut-dish-head">
        <label id={`${uid}-l`} htmlFor={`${uid}-q`} className="nut-dish-label">
          Buscar en mis platos
        </label>
        <button type="button" className="btn btn--plain nut-dish-close" aria-expanded onClick={() => setOpen(false)}>
          Cerrar
        </button>
      </div>
      <input
        ref={inputRef}
        id={`${uid}-q`}
        type="search"
        value={q}
        placeholder="Nombre o ingrediente"
        autoComplete="off"
        aria-controls={`${uid}-r`}
        onChange={(e) => setQ(e.target.value)}
      />
      <div id={`${uid}-r`} aria-live="polite" aria-busy={results === null || undefined}>
        {results === null ? (
          <p className="nut-dish-none">Buscando…</p>
        ) : results.length ? (
          <ul className="nut-dish-list">
            {results.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  className="nut-dish-item"
                  disabled={Boolean(busyId)}
                  aria-busy={busyId === d.id || undefined}
                  onClick={() => void pick(d)}
                >
                  {d.hasPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="nut-dish-thumb" src={`/api/nutrition/templates/dishes/${d.id}/photo?v=${encodeURIComponent(d.updatedAt)}`} alt="" />
                  ) : (
                    <span className="nut-dish-thumb nut-dish-thumb--empty" aria-hidden="true" />
                  )}
                  <span className="nut-dish-text">
                    <span className="nut-dish-name">{d.name}</span>
                    <span className="nut-dish-meta">
                      {busyId === d.id
                        ? "Poniendo…"
                        : d.items.length
                          ? d.items.map((it) => it.text).join(", ")
                          : "Sin ingredientes"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="nut-dish-none">{q.trim() ? `Ningún plato coincide con «${q.trim()}».` : "Aún no hay platos guardados."}</p>
        )}
      </div>
      {msg ? (
        <p className="field-error" role="alert">
          {msg}
        </p>
      ) : null}
    </div>
  );
}

/** «Guardar en mis platos» desde la ficha: copia el plato (texto, foto, ingredientes) a la biblioteca. */
export function SaveDishButton({ mealId }: { mealId: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => setMsg(null), [mealId]);

  async function save() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/nutrition/templates/dishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mealSlotId: mealId })
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return setMsg({ text: res ? "No se ha podido guardar." : "Sin conexión. Prueba otra vez.", ok: false });
    const { data } = await res.json();
    setMsg({ text: data.updated ? "Actualizado en tus platos." : "Guardado en tus platos.", ok: true });
  }

  return (
    <div className="nut-dish-save">
      <button type="button" className="btn btn--plain btn--block" disabled={busy} aria-busy={busy || undefined} onClick={() => void save()}>
        {busy ? "Guardando…" : "Guardar en mis platos"}
      </button>
      <p className={`nut-ficha-msg ${msg?.ok ? "ok" : "error"}`} role="status">
        {msg?.text ?? ""}
      </p>
    </div>
  );
}
