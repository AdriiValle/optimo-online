import type { Tx } from "@/lib/db";
import { mealsForAthleteRange } from "@/lib/queries";
import { addDays, dateKey, parseDateLocal, startOfWeekMonday } from "@/lib/dates";
import type { MealSlotKind } from "@/lib/types";
import { dayTypeFromMdTag } from "@/lib/nutrition/day-type";
import { dishLines, splitCategory, type ProteinCategoryKey } from "@/lib/nutrition/protein-category";
import { fuelLevel, type FuelLevel } from "@/lib/nutrition/today";

/** Miniatura de una franja en la vista «Semana»: solo plato y foto (nunca kcal ni gramos). */
export type WeekMeal = {
  id: string;
  slot: MealSlotKind;
  /** Primera línea del plato, sin el corchete de categoría. */
  dish: string;
  cat: ProteinCategoryKey;
  hasPhoto: boolean;
  updatedAt: string;
};

export type WeekDay = {
  date: string;
  mdTag: string | null;
  fuel: FuelLevel;
  meals: WeekMeal[];
};

export type WeekData = {
  /** Lunes de la semana (YYYY-MM-DD). */
  weekStart: string;
  days: WeekDay[];
};

/** Siete días (lunes a domingo de la semana de `weekStart`) de un deportista: MD de `day_plans` y platos de `meal_slots`. El acceso lo decide la ruta. */
export async function nutritionWeek(tx: Tx, athleteId: string, weekStart: string): Promise<WeekData> {
  const monday = parseDateLocal(startOfWeekMonday(weekStart));
  const dates = Array.from({ length: 7 }, (_, i) => dateKey(addDays(monday, i)));
  const from = dates[0];
  const to = dates[6];

  const plans = await tx<{ date: string; md_tag: string | null }[]>`
    select date::text, md_tag from day_plans
    where athlete_id = ${athleteId} and date between ${from}::date and ${to}::date
  `;
  const meals = await mealsForAthleteRange(tx, athleteId, from, to);

  const mdByDate = new Map(plans.map((p) => [p.date, p.md_tag?.trim() || null]));
  return {
    weekStart: from,
    days: dates.map((date) => {
      const mdTag = mdByDate.get(date) ?? null;
      return {
        date,
        mdTag,
        fuel: fuelLevel(dayTypeFromMdTag(mdTag)),
        meals: meals
          .filter((m) => m.date === date)
          .map((m) => {
            const cat = splitCategory(m.title);
            return {
              id: m.id,
              slot: m.slot,
              dish: dishLines(cat.body).headline || cat.body,
              cat: cat.key,
              hasPhoto: m.hasPhoto,
              updatedAt: m.updatedAt
            };
          })
      };
    })
  };
}
