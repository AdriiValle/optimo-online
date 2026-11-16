"use client";

import { useEffect, useState } from "react";
import type { MealItem } from "@/lib/queries";
import type { MealSlot } from "@/lib/types";
import { allergyMatcher, type AllergyKind } from "./allergy-match";
import { loadAllergyProfile } from "./allergy-client";

/** Alergia o intolerancia que casa con el plato, con los ingredientes que la delatan. */
type Hit = { term: string; kind: AllergyKind; sources: string[] };

const KIND_LABEL: Record<AllergyKind, string> = { allergy: "Alergia", intolerance: "Intolerancia" };

/**
 * Ingredientes que casan: por alimento asignado (`food_id` del catálogo que casa por nombre o alias)
 * o por el texto del ingrediente. Sin ingredientes, se mira el texto del plato.
 */
function findHits(
  meal: MealSlot,
  items: MealItem[],
  profile: NonNullable<Awaited<ReturnType<typeof loadAllergyProfile>>>
): Hit[] {
  const match = allergyMatcher(profile.terms);
  const byFood = new Map<string, { term: string; kind: AllergyKind }[]>();
  for (const f of profile.foods) byFood.set(f.foodId, [...(byFood.get(f.foodId) ?? []), { term: f.term, kind: f.kind }]);

  const hits = new Map<string, Hit>();
  const add = (t: { term: string; kind: AllergyKind }, source: string) => {
    const k = `${t.kind}:${t.term}`;
    const h = hits.get(k) ?? { ...t, sources: [] };
    if (!h.sources.includes(source)) h.sources.push(source);
    hits.set(k, h);
  };

  const live = items.filter((it) => !it.obsolete);
  if (live.length) {
    for (const it of live) {
      const found = [...(it.foodId ? byFood.get(it.foodId) ?? [] : []), ...match([it.rawText])];
      for (const t of found) add(t, it.rawText);
    }
  } else {
    for (const t of match([meal.title, meal.preparation ?? ""])) add(t, "el texto del plato");
  }
  // Alergias primero: son lo urgente.
  return [...hits.values()].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "allergy" ? -1 : 1));
}

function WarnGlyph() {
  return (
    <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.3 3.9 1.8 18.4A2 2 0 0 0 3.5 21.4h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

/**
 * Aviso de alergias e intolerancias en la ficha del plato (solo panel de Amanda).
 * `revision` cambia cuando se tocan los ingredientes, para volver a mirarlos.
 */
export function AllergyAlert({ athleteId, meal, revision }: { athleteId: string; meal: MealSlot; revision: unknown }) {
  const [hits, setHits] = useState<Hit[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const profile = await loadAllergyProfile(athleteId);
      if (cancelled) return;
      if (!profile || !profile.terms.length) {
        setHits([]);
        return;
      }
      const res = await fetch(`/api/nutrition/meal-items?mealSlotId=${meal.id}`).catch(() => null);
      const json = res?.ok ? await res.json().catch(() => null) : null;
      if (cancelled) return;
      setHits(findHits(meal, json?.data?.items ?? [], profile));
    })();
    return () => {
      cancelled = true;
    };
    // `meal` entero cambia de identidad en cada recarga del menú: basta con lo que altera el emparejado.
  }, [athleteId, meal.id, meal.title, meal.preparation, revision]);

  if (!hits.length) return null;
  const severe = hits.some((h) => h.kind === "allergy");
  return (
    <div className={`alert ${severe ? "alert--danger" : "alert--warn"} nut-allergy-alert`} role="alert">
      <WarnGlyph />
      <div className="nut-allergy-body">
        <strong className="alert-title">
          {severe ? "Ojo: este plato choca con una alergia" : "Ojo: este plato choca con una intolerancia"}
        </strong>
        <ul className="nut-allergy-list">
          {hits.map((h) => (
            <li key={`${h.kind}:${h.term}`}>
              <span className={`nut-allergy-kind nut-allergy-kind--${h.kind}`}>{KIND_LABEL[h.kind]}</span>{" "}
              <strong>{h.term}</strong>
              <span className="nut-allergy-src">: {h.sources.join(", ")}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
