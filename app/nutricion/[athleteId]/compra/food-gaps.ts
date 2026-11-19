import type { ShoppingFoodRow } from "@/lib/nutrition/shopping-queries";
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

/**
 * Qué falta por configurar en los alimentos de una lista ya calculada. `foods` es la configuración de esos
 * alimentos, leída en el mismo join que la lista (`shoppingForRangeParallel`), sin otra consulta.
 * La despensa no cuenta: va sin cantidad y no necesita unidad.
 */
export function foodGapsForList(list: ShoppingList, foods: ShoppingFoodRow[]): FoodGaps {
  const lines = list.sections.filter((s) => s.key !== "despensa" && s.key !== "revisar").flatMap((s) => s.lines);
  const unlinked = (list.sections.find((s) => s.key === "revisar")?.lines ?? []).map((l) => ({ key: l.key, name: l.name }));
  const byId = new Map(foods.map((r) => [r.id, r]));
  const gaps: FoodGap[] = [];
  for (const l of lines) {
    const r = byId.get(l.key);
    if (!r) continue;
    const noAisle = aisleFromColumn(r.aisle) === null;
    const hasUnit = !!r.unit_name?.trim() && Number(r.unit_g) > 0;
    const noUnit = !hasUnit && !(Number(r.pack_g) > 0);
    if (noAisle || noUnit) gaps.push({ key: l.key, name: l.name, noAisle, noUnit });
  }
  gaps.sort((a, b) => a.name.localeCompare(b.name, "es"));
  return {
    unlinked,
    foods: gaps,
    noAisle: gaps.filter((f) => f.noAisle).length,
    noUnit: gaps.filter((f) => f.noUnit).length
  };
}
