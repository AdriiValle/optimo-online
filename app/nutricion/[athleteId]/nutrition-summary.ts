import type { MealNutrition, NutrientKey, NutrientSum, NutritionTotals } from "@/lib/queries";

export function fmt(v: number, digits = 0) {
  return v.toLocaleString("es-ES", { maximumFractionDigits: digits, useGrouping: "always" });
}

export type PeriodNutrition = {
  planned: number;
  quantified: number;
  /** Días con al menos un plato cuantificado: divisor de las medias por día. */
  daysCounted: number;
  sum: Partial<Record<NutrientKey, NutrientSum>>;
  weightKg: number | null;
};

/** Suma los días de la vista (día / semana / mes) a partir de los totales diarios del API. */
export function summarizeNutrition(totals: NutritionTotals, days: string[]): PeriodNutrition {
  const inView = new Set(days);
  const out: PeriodNutrition = { planned: 0, quantified: 0, daysCounted: 0, sum: {}, weightKg: totals.weightKg };
  for (const day of totals.days) {
    if (!inView.has(day.date)) continue;
    out.planned += day.planned;
    out.quantified += day.quantified;
    if (!day.quantified) continue;
    out.daysCounted += 1;
    for (const [k, v] of Object.entries(day.totals) as [NutrientKey, NutrientSum][]) {
      const acc = (out.sum[k] ??= { value: 0, incomplete: false });
      acc.value += v.value;
      acc.incomplete ||= v.incomplete;
    }
  }
  return out;
}

/** Total del periodo; null si no hay platos cuantificados o ningún alimento trae ese valor (nunca 0 inventado). */
export function periodTotal(p: PeriodNutrition, key: NutrientKey): { value: number; approx: boolean } | null {
  const s = p.sum[key];
  if (!p.daysCounted || !s) return null;
  if (s.incomplete && s.value === 0) return null;
  return { value: s.value, approx: s.incomplete };
}

/** Media por día con datos (no ÷ días del periodo). */
export function perDay(p: PeriodNutrition, key: NutrientKey) {
  const t = periodTotal(p, key);
  return t ? { value: t.value / p.daysCounted, approx: t.approx } : null;
}

/**
 * Macros de un plato para la ficha. «≈» = faltan ingredientes por confirmar (suma parcial);
 * «≥» = completo pero algún alimento no trae el dato. null = nada sumado todavía.
 */
export function mealMacros(m: MealNutrition) {
  const kcal = m.totals.kcal;
  if (!m.quantified && kcal.value === 0) return null;
  return {
    kcal: kcal.value,
    mark: m.missing > 0 ? "≈" : kcal.incomplete ? "≥" : "",
    grams: { p: m.totals.protein_g.value, c: m.totals.carbs_g.value, f: m.totals.fat_g.value }
  };
}
