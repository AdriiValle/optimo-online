import type { MealSlotKind } from "@/lib/types";
import type { DayType } from "./day-type";
import type { DishItemRole } from "./parse-dish";

export type PortionRole = Exclude<DishItemRole, "other">;

export type PortionTemplateRow = {
  athleteId: string | null;
  dayType: DayType;
  slot: MealSlotKind;
  role: DishItemRole;
  grams: number;
};

/**
 * Plantilla general por regla (origin='rule') mientras no haya tabla de Amanda en `portion_templates`.
 * Gramos de referencia, en crudo: verdura total del plato; proteína como carne/pescado (~20 g prot/100 g);
 * hidrato como cereal seco (~75 g HC/100 g); grasa = aceite de cocinado. Amanda confirma o corrige en O4.
 */
const RULE_PORTIONS: Record<DayType, Partial<Record<MealSlotKind, Record<PortionRole, number>>>> = {
  rest: {
    lunch: { veg: 150, protein: 150, carb: 50, fat: 10 },
    dinner: { veg: 150, protein: 130, carb: 40, fat: 10 }
  },
  training: {
    lunch: { veg: 150, protein: 150, carb: 80, fat: 10 },
    dinner: { veg: 150, protein: 130, carb: 60, fat: 10 }
  },
  match: {
    lunch: { veg: 150, protein: 150, carb: 100, fat: 10 },
    dinner: { veg: 150, protein: 130, carb: 80, fat: 10 }
  }
};

/** Gramos de una parte del plato: plantilla del deportista > general de la nutricionista > regla. */
export function portionGrams(
  rows: PortionTemplateRow[],
  athleteId: string,
  dayType: DayType,
  slot: MealSlotKind,
  role: PortionRole
): number | null {
  const pick = (aid: string | null) =>
    rows.find((r) => r.athleteId === aid && r.dayType === dayType && r.slot === slot && r.role === role);
  const row = pick(athleteId) ?? pick(null);
  if (row) return row.grams;
  return RULE_PORTIONS[dayType][slot]?.[role] ?? null;
}

/** Macro de referencia por 100 g con la que está expresada la plantilla de cada parte. */
const REFERENCE_PER_100G: Partial<Record<PortionRole, { key: "protein_g" | "carbs_g" | "fat_g"; value: number }>> = {
  protein: { key: "protein_g", value: 20 },
  carb: { key: "carbs_g", value: 75 },
  fat: { key: "fat_g", value: 100 }
};

export type FoodMacros = { protein_g: number | null; carbs_g: number | null; fat_g: number | null };

/**
 * Gramos del alimento equivalentes a la ración de referencia (misma proteína / hidrato / grasa):
 * 80 g de arroz ≈ 300 g de boniato. Factor acotado a [0,2 ; 5] para no disparar cifras; redondeo a 5 g.
 */
export function equivalentGrams(role: PortionRole, grams: number, food: FoodMacros | undefined): number {
  if (grams <= 0) return 0;
  const ref = REFERENCE_PER_100G[role];
  const value = ref && food ? food[ref.key] : null;
  const factor = ref && value && value > 0 ? Math.min(5, Math.max(0.2, ref.value / value)) : 1;
  return Math.max(5, Math.round((grams * factor) / 5) * 5);
}
