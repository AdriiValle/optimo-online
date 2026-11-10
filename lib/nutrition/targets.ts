import type { DayType } from "./day-type";

/**
 * Objetivos diarios del deportista, calculados del perfil (peso, altura, edad) y del tipo de día.
 * Funciones puras, sin dependencias. Sin perfil completo → null (nunca se inventa un objetivo).
 *
 * Supuestos (documentados para revisión de la nutricionista):
 * - Energía: Mifflin-St Jeor, hombre: BMR = 10·kg + 6,25·cm − 5·edad + 5, × factor de actividad del día.
 *   Factores de futbolista: descanso 1,5 · entreno (MD±n) 1,75 · partido (MD) 1,9.
 * - Proteína: 1,6–2,0 g/kg (meta 1,8), igual todos los días.
 * - Hidratos por tipo de día (consenso UEFA / ISSN para fútbol): descanso 3–5 g/kg (meta 4),
 *   entreno 5–7 (meta 6), partido 6–10 (meta 8).
 * - Grasa: 25–30 % de la energía del día (meta 27,5 %), a 9 kcal/g.
 * - Micros, adulto varón (EFSA / IOM): fibra ≥ 30 g · sodio ≤ 2300 mg (tope) · hierro ≥ 11 mg ·
 *   calcio ≥ 1000 mg (1300 mg por debajo de 19 años) · vitamina D ≥ 15 µg.
 */

export type TargetKind = "min" | "range" | "max";

/** `target` = la cifra contra la que se rellena el anillo; `min`/`max` = banda aceptable cuando la hay. */
export type Target = { target: number; kind: TargetKind; min?: number; max?: number };

export type TargetKey =
  | "kcal"
  | "protein_g"
  | "carbs_g"
  | "fat_g"
  | "fiber_g"
  | "sodium_mg"
  | "iron_mg"
  | "calcium_mg"
  | "vit_d_ug";

export type DailyTargets = Record<TargetKey, Target>;

export type AthleteBody = { weightKg: number | null; heightCm: number | null; ageYears: number | null };

const ACTIVITY: Record<DayType, number> = { rest: 1.5, training: 1.75, match: 1.9 };
const CARBS_G_KG: Record<DayType, { min: number; target: number; max: number }> = {
  rest: { min: 3, target: 4, max: 5 },
  training: { min: 5, target: 6, max: 7 },
  match: { min: 6, target: 8, max: 10 }
};
const PROTEIN_G_KG = { min: 1.6, target: 1.8, max: 2.0 };
const FAT_PCT = { min: 0.25, target: 0.275, max: 0.3 };
const KCAL_PER_G_FAT = 9;

/** Perfil válido para calcular: peso, altura y edad presentes y positivos. */
function complete(b: AthleteBody | null | undefined): b is { weightKg: number; heightCm: number; ageYears: number } {
  return !!b && [b.weightKg, b.heightCm, b.ageYears].every((v) => typeof v === "number" && Number.isFinite(v) && v > 0);
}

export function dailyTargets(body: AthleteBody | null | undefined, dayType: DayType): DailyTargets | null {
  if (!complete(body)) return null;
  const { weightKg: kg, heightCm: cm, ageYears: age } = body;
  const bmr = 10 * kg + 6.25 * cm - 5 * age + 5;
  const kcal = bmr * ACTIVITY[dayType];
  const carbs = CARBS_G_KG[dayType];
  return {
    kcal: { target: kcal, kind: "range", min: kcal * 0.9, max: kcal * 1.1 },
    protein_g: { target: PROTEIN_G_KG.target * kg, kind: "range", min: PROTEIN_G_KG.min * kg, max: PROTEIN_G_KG.max * kg },
    carbs_g: { target: carbs.target * kg, kind: "range", min: carbs.min * kg, max: carbs.max * kg },
    fat_g: {
      target: (kcal * FAT_PCT.target) / KCAL_PER_G_FAT,
      kind: "range",
      min: (kcal * FAT_PCT.min) / KCAL_PER_G_FAT,
      max: (kcal * FAT_PCT.max) / KCAL_PER_G_FAT
    },
    fiber_g: { target: 30, kind: "min" },
    sodium_mg: { target: 2300, kind: "max" },
    iron_mg: { target: 11, kind: "min" },
    calcium_mg: { target: age < 19 ? 1300 : 1000, kind: "min" },
    vit_d_ug: { target: 15, kind: "min" }
  };
}

/** Objetivo medio de varios días (p. ej. semana con descanso, entrenos y partido). null si la lista está vacía. */
export function averageTargets(list: DailyTargets[]): DailyTargets | null {
  if (!list.length) return null;
  const out = {} as DailyTargets;
  for (const key of Object.keys(list[0]) as TargetKey[]) {
    const avg = (pick: (t: Target) => number | undefined) => {
      const vals = list.map((d) => pick(d[key]));
      return vals.every((v) => v !== undefined) ? vals.reduce<number>((a, v) => a + (v as number), 0) / vals.length : undefined;
    };
    const t: Target = { target: avg((t) => t.target) as number, kind: list[0][key].kind };
    const min = avg((t) => t.min);
    const max = avg((t) => t.max);
    if (min !== undefined) t.min = min;
    if (max !== undefined) t.max = max;
    out[key] = t;
  }
  return out;
}

/** Bajo (< 85 %), en rango (85–110 %), pasado (> 110 %). Tope: dentro o por encima. Incompleto = datos parciales. */
export type RingStatus = "low" | "ok" | "over" | "cap-ok" | "cap-over" | "partial";

export const LOW_PCT = 0.85;
export const OVER_PCT = 1.1;

/**
 * Estado del anillo. Con datos incompletos (`partial`: faltan platos o algún alimento sin el dato)
 * nunca se pinta «pasado» ni «bajo»: la cifra real puede ser otra.
 */
export function ringStatus(value: number, t: Target, partial: boolean): RingStatus {
  const pct = value / t.target;
  if (t.kind === "max") {
    if (pct <= 1) return "cap-ok";
    return partial ? "partial" : "cap-over";
  }
  if (pct < LOW_PCT) return partial ? "partial" : "low";
  if (t.kind === "min" || pct <= OVER_PCT) return "ok";
  return partial ? "partial" : "over";
}
