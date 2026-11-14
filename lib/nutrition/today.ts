import { MEAL_SLOT_KINDS, type MealSlotKind } from "@/lib/types";
import { normalizeFoodText } from "./parse-dish";
import type { DayType } from "./day-type";

/**
 * Vista «Hoy» del jugador (pista N1). Solo lógica pura y tipos: se usa en servidor (today-queries) y en cliente.
 */

/** «Nivel de combustible» del día: sale del tipo de día (MD → carga, entreno → normal, descanso → suave). */
export type FuelLevel = "carga" | "normal" | "suave";

export function fuelLevel(dayType: DayType): FuelLevel {
  if (dayType === "match") return "carga";
  if (dayType === "training") return "normal";
  return "suave";
}

export const FUEL_COPY: Record<FuelLevel, { label: string; hint: string; bars: 1 | 2 | 3 }> = {
  carga: { label: "Carga", hint: "Más hidratos para rendir en el partido.", bars: 3 },
  normal: { label: "Normal", hint: "Raciones de un día de entreno.", bars: 2 },
  suave: { label: "Suave", hint: "Día tranquilo: raciones más ligeras.", bars: 1 }
};

export const DAY_TYPE_LABEL: Record<DayType, string> = {
  match: "Día de partido",
  training: "Día de entreno",
  rest: "Día de descanso"
};

/** Kcal y gramos de macros: solo viajan si la nutricionista activó `athletes.show_numbers`. */
export type TodayNumbers = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  /** Falta algún plato por cuantificar: la cifra es parcial. */
  partial: boolean;
};

export type TodayIngredient = {
  name: string;
  /** Cantidad redondeada y legible («100 g», «1 cucharada», «2 huevos»); null = sin cantidad. */
  amount: string | null;
};

export type TodayMeal = {
  id: string;
  slot: MealSlotKind;
  title: string;
  preparation: string | null;
  hasPhoto: boolean;
  updatedAt: string;
  ingredients: TodayIngredient[];
  numbers: TodayNumbers | null;
};

/** Entrada de `athletes.supplements`: `slot` es opcional (las antiguas no lo traen y se deduce de `time`). */
export type TodaySupplement = {
  name: string;
  time: string;
  notes: string | null;
  slot: MealSlotKind | null;
};

export type TodayData = {
  date: string;
  mdTag: string | null;
  dayType: DayType;
  fuel: FuelLevel;
  /** Nota de la nutricionista para ese día (`meal_day_notes`). */
  note: string | null;
  meals: TodayMeal[];
  supplements: TodaySupplement[];
  dietNotes: string | null;
  showNumbers: boolean;
  dayNumbers: TodayNumbers | null;
};

function isSlotKind(v: unknown): v is MealSlotKind {
  return typeof v === "string" && (MEAL_SLOT_KINDS as readonly string[]).includes(v);
}

/** Lee el jsonb tal cual (conserva `slot` si es válido; ignora entradas sin nombre u hora). */
export function parseSupplements(raw: unknown): TodaySupplement[] {
  if (!Array.isArray(raw)) return [];
  const out: TodaySupplement[] = [];
  for (const s of raw) {
    if (!s || typeof s !== "object") continue;
    const r = s as Record<string, unknown>;
    const name = typeof r.name === "string" ? r.name.trim() : "";
    const time = typeof r.time === "string" ? r.time.trim() : "";
    if (!name || !time) continue;
    const notes = typeof r.notes === "string" && r.notes.trim() ? r.notes.trim() : null;
    out.push({ name, time, notes, slot: isSlotKind(r.slot) ? r.slot : null });
  }
  return out;
}

/** Franjas en minutos del día [inicio, fin): sirven para ordenar, deducir la franja de una hora y saber cuál toca. */
export const SLOT_WINDOWS: Record<MealSlotKind, { start: number; end: number }> = {
  breakfast: { start: 0, end: 10 * 60 + 30 },
  morning_snack: { start: 10 * 60 + 30, end: 13 * 60 },
  lunch: { start: 13 * 60, end: 16 * 60 + 30 },
  afternoon_snack: { start: 16 * 60 + 30, end: 19 * 60 + 30 },
  dinner: { start: 19 * 60 + 30, end: 24 * 60 }
};

const SLOT_WORDS: { slot: MealSlotKind; re: RegExp }[] = [
  { slot: "morning_snack", re: /\bmedia manana\b|\bmediamanana\b|\balmuerzo de media\b/ },
  { slot: "breakfast", re: /\bdesayun|\bayunas\b|\bal levantarse\b/ },
  { slot: "afternoon_snack", re: /\bmerienda/ },
  { slot: "dinner", re: /\bcena\b|\bcenar\b|\bnoche\b|\bdormir\b|\bacostarse\b/ },
  { slot: "lunch", re: /\bcomida\b|\bcomer\b|\balmuerzo\b/ }
];

function slotForMinutes(min: number): MealSlotKind {
  return MEAL_SLOT_KINDS.find((k) => min >= SLOT_WINDOWS[k].start && min < SLOT_WINDOWS[k].end) ?? "dinner";
}

/** Franja del suplemento: la explícita; si no, por palabra («desayuno», «cena»…) o por hora («08:00», «21h»). */
export function supplementSlot(s: Pick<TodaySupplement, "time" | "slot">): MealSlotKind | null {
  if (s.slot) return s.slot;
  const t = normalizeFoodText(s.time);
  for (const w of SLOT_WORDS) if (w.re.test(t)) return w.slot;
  // Hora con separador o «h»: «08:00», «8.30», «21h», «21 h 30». Un número suelto («2 cápsulas») no cuenta.
  const m = s.time.toLowerCase().match(/(?:^|[^\d])([01]?\d|2[0-3])\s*(?:[:.]([0-5]\d)|h(?![a-záéíóúñ])(?:\s*([0-5]\d))?)/);
  if (m) return slotForMinutes(Number(m[1]) * 60 + Number(m[2] ?? m[3] ?? 0));
  return null;
}

/** Plural sencillo en español («huevo» → «huevos», «unidad» → «unidades»). */
function plural(word: string, n: number) {
  if (n <= 1 || /s$/i.test(word)) return word;
  return /[aeiouáéíóú]$/i.test(word) ? `${word}s` : `${word}es`;
}

function halves(n: number) {
  const r = Math.max(0.5, Math.round(n * 2) / 2);
  const whole = Math.floor(r);
  const half = r - whole === 0.5;
  return { value: r, text: half ? (whole ? `${whole}½` : "½") : String(whole) };
}

function roundGrams(g: number) {
  if (g < 10) return Math.max(1, Math.round(g));
  if (g <= 50) return Math.round(g / 5) * 5;
  if (g <= 250) return Math.round(g / 10) * 10;
  return Math.round(g / 25) * 25;
}

/**
 * Cantidad de cocina, redondeada para leerla de un vistazo: unidad de compra si el alimento la tiene
 * (`foods.unit_name/unit_g`), cucharadas para el aceite y gramos redondeados para lo demás.
 */
export function roundedAmount(
  grams: number | null,
  name: string,
  unit?: { name: string | null; grams: number | null }
): string | null {
  if (grams == null || !Number.isFinite(grams) || grams <= 0) return null;
  if (unit?.name && unit.grams && unit.grams > 0) {
    const h = halves(grams / unit.grams);
    return `${h.text} ${plural(unit.name, h.value)}`;
  }
  if (/^aceite\b/.test(normalizeFoodText(name))) {
    const h = halves(grams / 10);
    return `${h.text} ${h.value > 1 ? "cucharadas" : "cucharada"}`;
  }
  return `${roundGrams(grams)} g`;
}

/** Fase de cada franja respecto a ahora: solo cuenta si el día es hoy (otros días no pliegan ni destacan). */
export type SlotPhase = "past" | "next" | "later";

export function slotPhases(slots: MealSlotKind[], isToday: boolean, nowMinutes: number): Map<MealSlotKind, SlotPhase> {
  const out = new Map<MealSlotKind, SlotPhase>();
  let nextTaken = false;
  for (const s of slots) {
    if (!isToday) {
      out.set(s, "later");
      continue;
    }
    if (nowMinutes >= SLOT_WINDOWS[s].end) out.set(s, "past");
    else if (!nextTaken) {
      out.set(s, "next");
      nextTaken = true;
    } else out.set(s, "later");
  }
  return out;
}
