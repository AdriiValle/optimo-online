"use client";

import type { AllergenFood, AllergyTerm } from "./allergy-match";
import { profileTerms } from "./allergy-match";

/** Lo que la ficha del plato necesita del perfil para avisar de alergias. */
export type AllergyProfile = { terms: AllergyTerm[]; foods: AllergenFood[] };

/** Caché por deportista: la ficha se abre muchas veces seguidas; al guardar el perfil se olvida. */
const TTL_MS = 60_000;
const cache = new Map<string, { at: number; promise: Promise<AllergyProfile | null> }>();

export function loadAllergyProfile(athleteId: string): Promise<AllergyProfile | null> {
  const hit = cache.get(athleteId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.promise;
  const promise = fetch(`/api/athletes/${athleteId}/profile`)
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => {
      const d = json?.data;
      if (!d) return null;
      return { terms: profileTerms(d.allergies ?? [], d.intolerances ?? []), foods: d.allergenFoods ?? [] };
    })
    .catch(() => null);
  cache.set(athleteId, { at: Date.now(), promise });
  void promise.then((p) => {
    if (!p && cache.get(athleteId)?.promise === promise) cache.delete(athleteId);
  });
  return promise;
}

export function forgetAllergyProfile(athleteId: string) {
  cache.delete(athleteId);
}
