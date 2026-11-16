import type { Tx } from "@/lib/db";
import { aisleFromColumn, type ShoppingList } from "@/lib/nutrition/shopping";

/** Alimento de la lista al que le falta configuración en «Alimentos». */
export type FoodGap = {
  key: string;
  name: string;
  /** Sin `foods.aisle` reconocible: la lista lo coloca por su nombre. */
  noAisle: boolean;
  /** Sin unidad (`unit_name` + `unit_g`) ni paquete (`pack_g`): se compra en gramos redondeados. */
  noUnit: boolean;
};

export type FoodGaps = {
  /** Ingredientes sin alimento del catálogo (sección «Otros / revisar»). */
  unlinked: { key: string; name: string }[];
  foods: FoodGap[];
  noAisle: number;
  noUnit: number;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Qué falta por configurar en los alimentos de una lista ya calculada (solo lectura de `foods`).
 * La despensa no cuenta: va sin cantidad y no necesita unidad.
 */
export async function foodGapsForList(tx: Tx, list: ShoppingList): Promise<FoodGaps> {
  const lines = list.sections.filter((s) => s.key !== "despensa" && s.key !== "revisar").flatMap((s) => s.lines);
  const unlinked = (list.sections.find((s) => s.key === "revisar")?.lines ?? []).map((l) => ({ key: l.key, name: l.name }));
  const ids = lines.map((l) => l.key).filter((k) => UUID_RE.test(k));
  const rows = ids.length
    ? await tx<{ id: string; aisle: string | null; unit_name: string | null; unit_g: string | null; pack_g: string | null }[]>`
        select id::text, aisle, unit_name, unit_g::text, pack_g::text from foods where id = any(${ids}::uuid[])
      `
    : [];
  const byId = new Map(rows.map((r) => [r.id, r]));
  const foods: FoodGap[] = [];
  for (const l of lines) {
    const r = byId.get(l.key);
    if (!r) continue;
    const noAisle = aisleFromColumn(r.aisle) === null;
    const hasUnit = !!r.unit_name?.trim() && Number(r.unit_g) > 0;
    const noUnit = !hasUnit && !(Number(r.pack_g) > 0);
    if (noAisle || noUnit) foods.push({ key: l.key, name: l.name, noAisle, noUnit });
  }
  foods.sort((a, b) => a.name.localeCompare(b.name, "es"));
  return {
    unlinked,
    foods,
    noAisle: foods.filter((f) => f.noAisle).length,
    noUnit: foods.filter((f) => f.noUnit).length
  };
}
