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
 * - Los objetivos que fija la nutricionista (`athletes.target_overrides`) mandan sobre estos cálculos.
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

export const TARGET_KEYS: readonly TargetKey[] = [
  "kcal",
  "protein_g",
  "carbs_g",
  "fat_g",
  "fiber_g",
  "sodium_mg",
  "iron_mg",
  "calcium_mg",
  "vit_d_ug"
];

export const DAY_TYPES: readonly DayType[] = ["rest", "training", "match"];

/**
 * Objetivos que fija la nutricionista (`athletes.target_overrides`): cifra por nutriente y tipo de día.
 * Lo que falta se calcula. La banda aceptable (min/max) se escala con la misma proporción que la calculada.
 */
export type TargetOverrides = Partial<Record<TargetKey, Partial<Record<DayType, number>>>>;

export type AthleteBody = {
  weightKg: number | null;
  heightCm: number | null;
  ageYears: number | null;
  targetOverrides?: TargetOverrides | null;
};

const ACTIVITY: Record<DayType, number> = { rest: 1.5, training: 1.75, match: 1.9 };
const CARBS_G_KG: Record<DayType, { min: number; target: number; max: number }> = {
  rest: { min: 3, target: 4, max: 5 },
  training: { min: 5, target: 6, max: 7 },
  match: { min: 6, target: 8, max: 10 }
};
const PROTEIN_G_KG = { min: 1.6, target: 1.8, max: 2.0 };
const FAT_PCT = { min: 0.25, target: 0.275, max: 0.3 };
const KCAL_PER_G_FAT = 9;
const MACROS: readonly TargetKey[] = ["kcal", "protein_g", "carbs_g", "fat_g"];

/** Tipo de objetivo y banda como proporción de la cifra (la misma para la calculada y la sobrescrita). */
function band(key: TargetKey, day: DayType): { kind: TargetKind; lo?: number; hi?: number } {
  switch (key) {
    case "kcal":
      return { kind: "range", lo: 0.9, hi: 1.1 };
    case "protein_g":
      return { kind: "range", lo: PROTEIN_G_KG.min / PROTEIN_G_KG.target, hi: PROTEIN_G_KG.max / PROTEIN_G_KG.target };
    case "carbs_g": {
      const c = CARBS_G_KG[day];
      return { kind: "range", lo: c.min / c.target, hi: c.max / c.target };
    }
    case "fat_g":
      return { kind: "range", lo: FAT_PCT.min / FAT_PCT.target, hi: FAT_PCT.max / FAT_PCT.target };
    case "sodium_mg":
      return { kind: "max" };
    default:
      return { kind: "min" };
  }
}

function makeTarget(key: TargetKey, day: DayType, target: number): Target {
  const b = band(key, day);
  return b.kind === "range" && b.lo !== undefined && b.hi !== undefined
    ? { target, kind: "range", min: target * b.lo, max: target * b.hi }
    : { target, kind: b.kind };
}

/** Perfil válido para calcular: peso, altura y edad presentes y positivos. */
function complete(b: AthleteBody | null | undefined): b is AthleteBody & { weightKg: number; heightCm: number; ageYears: number } {
  return !!b && [b.weightKg, b.heightCm, b.ageYears].every((v) => typeof v === "number" && Number.isFinite(v) && v > 0);
}

/** Micros de referencia (no dependen del peso; el calcio sube por debajo de 19 años). */
export function referenceTargetValue(key: TargetKey, age: number | null): number | null {
  switch (key) {
    case "fiber_g":
      return 30;
    case "sodium_mg":
      return 2300;
    case "iron_mg":
      return 11;
    case "calcium_mg":
      return age !== null && age > 0 && age < 19 ? 1300 : 1000;
    case "vit_d_ug":
      return 15;
    default:
      return null;
  }
}

/** Cifras calculadas del perfil, sin sobrescrituras. Sin perfil completo → null. */
export function calculatedTargetValues(body: AthleteBody | null | undefined, dayType: DayType): Record<TargetKey, number> | null {
  if (!complete(body)) return null;
  const { weightKg: kg, heightCm: cm, ageYears: age } = body;
  const kcal = (10 * kg + 6.25 * cm - 5 * age + 5) * ACTIVITY[dayType];
  const out = {
    kcal,
    protein_g: PROTEIN_G_KG.target * kg,
    carbs_g: CARBS_G_KG[dayType].target * kg,
    fat_g: (kcal * FAT_PCT.target) / KCAL_PER_G_FAT
  } as Record<TargetKey, number>;
  for (const k of TARGET_KEYS) if (!(k in out)) out[k] = referenceTargetValue(k, age) as number;
  return out;
}

/** Cifra sobrescrita válida de un nutriente en un tipo de día, o null. */
export function overrideFor(o: TargetOverrides | null | undefined, key: TargetKey, dayType: DayType): number | null {
  const v = o?.[key]?.[dayType];
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
}

/**
 * Objetivos del día: los de la nutricionista (`targetOverrides`) mandan sobre los calculados.
 * Sin perfil completo solo hay objetivo si ella fijó los cuatro macros de ese tipo de día
 * (los micros son de referencia); si no → null (nunca se inventa un objetivo).
 */
export function dailyTargets(body: AthleteBody | null | undefined, dayType: DayType): DailyTargets | null {
  const calc = calculatedTargetValues(body, dayType);
  const ov = body?.targetOverrides;
  if (!calc && MACROS.some((k) => overrideFor(ov, k, dayType) === null)) return null;
  const age = body?.ageYears ?? null;
  const out = {} as DailyTargets;
  for (const key of TARGET_KEYS) {
    const value = overrideFor(ov, key, dayType) ?? calc?.[key] ?? referenceTargetValue(key, age);
    if (value === null) return null;
    out[key] = makeTarget(key, dayType, value);
  }
  return out;
}

/** Topes de cordura por nutriente (lo que no encaja se descarta al leer o guardar). */
export const OVERRIDE_MAX: Record<TargetKey, number> = {
  kcal: 10000,
  protein_g: 1000,
  carbs_g: 2000,
  fat_g: 1000,
  fiber_g: 200,
  sodium_mg: 20000,
  iron_mg: 200,
  calcium_mg: 10000,
  vit_d_ug: 1000
};

/** Normaliza el jsonb de la base: solo claves conocidas y cifras positivas dentro del tope. Vacío → null. */
export function parseTargetOverrides(raw: unknown): TargetOverrides | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: TargetOverrides = {};
  for (const key of TARGET_KEYS) {
    const entry = (raw as Record<string, unknown>)[key];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const days: Partial<Record<DayType, number>> = {};
    for (const d of DAY_TYPES) {
      const v = (entry as Record<string, unknown>)[d];
      if (typeof v === "number" && Number.isFinite(v) && v > 0 && v <= OVERRIDE_MAX[key]) days[d] = v;
    }
    if (Object.keys(days).length) out[key] = days;
  }
  return Object.keys(out).length ? out : null;
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
