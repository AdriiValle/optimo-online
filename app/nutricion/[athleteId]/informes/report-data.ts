import type { Tx } from "@/lib/db";
import { athleteProfile, mealsForAthleteRange } from "@/lib/queries";
import { addDays, dateKey, parseDateLocal } from "@/lib/dates";
import { MEAL_SLOTS, type MealSlotKind } from "@/lib/types";
import { dayTypeFromMdTag, type DayType } from "@/lib/nutrition/day-type";
import { splitCategory, type ProteinCategoryKey } from "@/lib/nutrition/protein-category";
import { DAY_TYPES, dailyTargets, overrideFor, type DailyTargets, type TargetKey } from "@/lib/nutrition/targets";
import { shoppingRange } from "@/lib/nutrition/shopping";
import { shoppingForRange, type ShoppingData } from "@/lib/nutrition/shopping-queries";

export type ReportMeal = { slot: MealSlotKind; dish: string; cat: ProteinCategoryKey } | null;

export type ReportDay = { date: string; mdTag: string | null; dayType: DayType; meals: ReportMeal[] };

export type ReportTargets = {
  byType: Partial<Record<DayType, DailyTargets>>;
  /** Cifras que fijó la nutricionista (sobre las calculadas), por tipo de día. */
  overridden: Partial<Record<DayType, Partial<Record<TargetKey, true>>>>;
};

export type ReportData = {
  weekStart: string;
  weekEnd: string;
  days: ReportDay[];
  targets: ReportTargets;
  profile: {
    weightKg: number | null;
    heightCm: number | null;
    ageYears: number | null;
    dietGoal: string | null;
    allergies: string[];
    intolerances: string[];
  };
  shopping: ShoppingData;
};

/** Edad cumplida a `today` desde `YYYY-MM-DD`; null si no hay fecha. */
function ageAt(birth: string | null, today: string) {
  if (!birth) return null;
  const [by, bm, bd] = birth.slice(0, 10).split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  if (![by, bm, bd].every(Number.isFinite)) return null;
  const age = ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
  return age > 0 ? age : null;
}

/**
 * Todo lo del informe semanal en una pasada (solo lectura): menú lunes–domingo con su MD, objetivos por tipo
 * de día (los de Amanda mandan sobre los calculados) y la lista de la compra de esa semana. El acceso lo decide la ruta.
 */
export async function weeklyReport(tx: Tx, athleteId: string, weekStart: string, today: string): Promise<ReportData> {
  const monday = parseDateLocal(weekStart);
  const dates = Array.from({ length: 7 }, (_, i) => dateKey(addDays(monday, i)));
  const from = dates[0];
  const to = dates[6];

  const [plans, meals, profile, shopping] = await Promise.all([
    tx<{ date: string; md_tag: string | null }[]>`
      select date::text, md_tag from day_plans
      where athlete_id = ${athleteId} and date between ${from}::date and ${to}::date
    `,
    mealsForAthleteRange(tx, athleteId, from, to),
    athleteProfile(tx, athleteId),
    shoppingForRange(tx, athleteId, shoppingRange("week", from))
  ]);

  const mdByDate = new Map(plans.map((p) => [p.date.slice(0, 10), p.md_tag?.trim() || null]));
  const days: ReportDay[] = dates.map((date) => {
    const mdTag = mdByDate.get(date) ?? null;
    return {
      date,
      mdTag,
      dayType: dayTypeFromMdTag(mdTag),
      meals: MEAL_SLOTS.map(({ slot }) => {
        const m = meals.find((x) => x.date === date && x.slot === slot);
        if (!m || !m.title.trim()) return null;
        const cat = splitCategory(m.title);
        return { slot, dish: cat.body, cat: cat.key };
      })
    };
  });

  const body = {
    weightKg: profile?.weightKg ?? null,
    heightCm: profile?.heightCm ?? null,
    ageYears: ageAt(profile?.birthDate ?? null, today),
    targetOverrides: profile?.targetOverrides ?? null
  };
  const targets: ReportTargets = { byType: {}, overridden: {} };
  for (const dt of DAY_TYPES) {
    const t = dailyTargets(body, dt);
    if (!t) continue;
    targets.byType[dt] = t;
    const ov: Partial<Record<TargetKey, true>> = {};
    for (const key of Object.keys(t) as TargetKey[]) if (overrideFor(body.targetOverrides, key, dt) !== null) ov[key] = true;
    targets.overridden[dt] = ov;
  }

  return {
    weekStart: from,
    weekEnd: to,
    days,
    targets,
    profile: {
      weightKg: body.weightKg,
      heightCm: body.heightCm,
      ageYears: body.ageYears,
      dietGoal: profile?.dietGoal?.trim() || null,
      allergies: profile?.allergies ?? [],
      intolerances: profile?.intolerances ?? []
    },
    shopping
  };
}
