"use client";

import { useEffect, useState } from "react";
import type { MealSlot } from "@/lib/types";
import type { MealItem } from "@/lib/queries";

type Food = { id: string; name: string };
type Role = MealItem["role"];
type Draft = { foodId: string; grams: string; role: Role; confirmed: boolean };
type Patch = { id: string; foodId?: string | null; grams?: number | null; role?: Role; confirmed?: boolean };

const ROLES: { key: Role; label: string }[] = [
  { key: "veg", label: "Verdura" },
  { key: "protein", label: "Proteína" },
  { key: "carb", label: "Hidrato" },
  { key: "fat", label: "Grasa" },
  { key: "other", label: "Condimento" }
];

const toDraft = (it: MealItem): Draft => ({
  foodId: it.foodId ?? "",
  grams: it.grams == null ? "" : String(it.grams).replace(".", ","),
  role: it.role,
  confirmed: it.confirmed
});

/** Condimento sin gramos: no bloquea ni suma (misma regla que `nutritionTotals`). */
const ignored = (d: Draft) => d.role === "other" && d.grams.trim() === "";
const complete = (d: Draft) => d.foodId !== "" && d.grams.trim() !== "";

/** "" → null; número fuera de 0–5000 o texto → undefined (inválido). */
function parseGrams(s: string): number | null | undefined {
  const t = s.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 && n <= 5000 ? n : undefined;
}

/**
 * Ingredientes del plato para el cálculo de macros: alimento, gramos, rol y confirmación.
 * El plato cuenta en los totales cuando todos sus ingredientes vigentes están confirmados con alimento y gramos.
 */
export function MealItemsEditor({ athleteId, meal, onChanged }: { athleteId: string; meal: MealSlot; onChanged: () => void }) {
  const [items, setItems] = useState<MealItem[] | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/nutrition/meal-items?mealSlotId=${meal.id}`);
      const json = res.ok ? await res.json() : null;
      if (cancelled) return;
      const list: MealItem[] = json?.data?.items ?? [];
      setItems(list);
      setFoods(json?.data?.foods ?? []);
      setDrafts(Object.fromEntries(list.map((it) => [it.id, toDraft(it)])));
    })();
    return () => {
      cancelled = true;
    };
  }, [meal.id, meal.title, meal.preparation, reload]);

  if (items === null) return <p className="muted nut-items">Cargando ingredientes…</p>;

  const current = items.filter((it) => !it.obsolete);
  const obsolete = items.filter((it) => it.obsolete);
  const foodName = new Map(foods.map((f) => [f.id, f.name]));
  const counting = current.filter((it) => !ignored(toDraft(it)));
  const pending = counting.filter((it) => !(it.confirmed && complete(toDraft(it)))).length;
  const counts = counting.length > 0 && pending === 0;
  const status = !current.length
    ? "Sin ingredientes: no cuenta en los totales."
    : !counting.length
      ? "Solo condimentos sin gramos: no cuenta en los totales."
      : pending
        ? `No cuenta todavía: ${pending} sin confirmar o sin alimento/gramos.`
        : "Cuenta en los totales.";

  function edit(id: string, patch: Partial<Draft>) {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));
    setMsg(null);
  }

  async function save(confirmAll: boolean) {
    const patches: Patch[] = [];
    for (const it of current) {
      const d = { ...drafts[it.id] };
      if (confirmAll && (complete(d) || ignored(d))) d.confirmed = true;
      const grams = parseGrams(d.grams);
      if (grams === undefined) {
        setMsg({ ok: false, text: `Gramos no válidos en «${it.rawText}».` });
        return;
      }
      const p: Patch = { id: it.id };
      if ((d.foodId || null) !== it.foodId) p.foodId = d.foodId || null;
      if (grams !== it.grams) p.grams = grams;
      if (d.role !== it.role) p.role = d.role;
      if (d.confirmed !== it.confirmed) p.confirmed = d.confirmed;
      if (Object.keys(p).length > 1) patches.push(p);
    }
    if (!patches.length) {
      setMsg({ ok: true, text: "Sin cambios." });
      return;
    }
    setBusy(true);
    const res = await fetch("/api/nutrition/meal-items", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: patches })
    });
    const json = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      setMsg({ ok: false, text: json?.error?.message ?? "No se pudieron guardar los ingredientes." });
      if (res.status === 409) setReload((n) => n + 1);
      return;
    }
    setMsg({ ok: true, text: "Ingredientes guardados." });
    setReload((n) => n + 1);
    onChanged();
  }

  /** El endpoint trabaja por rango: regenera los platos del día cuyo texto cambió; nunca toca confirmados. */
  async function generate() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/nutrition/meal-items/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athleteId, from: meal.date, to: meal.date })
    });
    const json = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      setMsg({ ok: false, text: json?.error?.message ?? "No se pudieron generar los borradores." });
      return;
    }
    setMsg(
      json?.data?.itemsCreated
        ? { ok: true, text: "Borradores generados: revisa alimento y gramos y confirma." }
        : { ok: false, text: "No hay borradores nuevos para este plato." }
    );
    setReload((n) => n + 1);
    onChanged();
  }

  return (
    <section className="nut-items" aria-label="Ingredientes">
      <header className="nut-items-head">
        <h3>Ingredientes</h3>
        <span className={counts ? "ok" : "muted"}>{status}</span>
      </header>

      {current.map((it) => {
        const d = drafts[it.id];
        if (!d) return null;
        const warn = !ignored(d) && !complete(d);
        return (
          <div key={it.id} className="nut-item">
            <p className="nut-item-raw">{it.rawText}</p>
            <select aria-label="Alimento" value={d.foodId} disabled={busy} onChange={(e) => edit(it.id, { foodId: e.target.value })}>
              <option value="">— Sin alimento —</option>
              {foods.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <label className="nut-item-grams">
              <input
                aria-label="Gramos"
                inputMode="decimal"
                value={d.grams}
                placeholder="—"
                disabled={busy}
                onChange={(e) => edit(it.id, { grams: e.target.value })}
              />
              <span>g</span>
            </label>
            <div className="nut-item-meta">
              <select aria-label="Rol" value={d.role} disabled={busy} onChange={(e) => edit(it.id, { role: e.target.value as Role })}>
                {ROLES.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
              <label className="nut-item-ok">
                <input
                  type="checkbox"
                  checked={d.confirmed}
                  disabled={busy}
                  onChange={(e) => edit(it.id, { confirmed: e.target.checked })}
                />
                Confirmado
              </label>
              {warn ? <span className="nut-item-warn">Falta {d.foodId ? "gramos" : "alimento"}</span> : null}
            </div>
          </div>
        );
      })}

      {obsolete.length ? (
        <div className="nut-items-obsolete">
          <p className="muted">El texto del plato cambió: estos ingredientes ya no cuentan. Genera borradores nuevos.</p>
          {obsolete.map((it) => (
            <p key={it.id} className="nut-item nut-item--obsolete">
              <span className="nut-item-raw">{it.rawText}</span>
              <span>
                {(it.foodId && foodName.get(it.foodId)) || "Sin alimento"} · {it.grams == null ? "—" : `${it.grams} g`}
                {it.confirmed ? " · confirmado" : ""}
              </span>
            </p>
          ))}
        </div>
      ) : null}

      <div className="nut-actions">
        {current.length ? (
          <>
            <button type="button" className="btn" disabled={busy} onClick={() => void save(true)}>
              {busy ? "Guardando…" : "Confirmar ingredientes"}
            </button>
            <button type="button" className="btn secondary" disabled={busy} onClick={() => void save(false)}>
              Guardar sin confirmar
            </button>
          </>
        ) : (
          <button type="button" className="btn secondary" disabled={busy} onClick={() => void generate()}>
            {busy ? "Generando…" : "Generar borradores"}
          </button>
        )}
        {msg ? <p className={msg.ok ? "ok" : "error"}>{msg.text}</p> : null}
      </div>
    </section>
  );
}
