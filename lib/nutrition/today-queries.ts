import type { Tx } from "@/lib/db";
import { mealsForAthleteRange, nutritionTotals, type NutrientKey, type NutrientSum } from "@/lib/queries";
import { dayTypeFromMdTag } from "./day-type";
import {
  fuelLevel,
  parseSupplements,
  roundedAmount,
  type TodayData,
  type TodayIngredient,
  type TodayNumbers
} from "./today";

type ItemRow = {
  meal_slot_id: string;
  raw_text: string;
  grams: string | null;
  confirmed: boolean;
  name_es: string | null;
  unit_name: string | null;
  unit_g: string | null;
};

function toNumber(v: string | null) {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function capitalize(s: string) {
  const t = s.trim();
  return t ? t.charAt(0).toLocaleUpperCase("es") + t.slice(1) : t;
}

function numbersFrom(totals: Record<NutrientKey, NutrientSum>, partial: boolean): TodayNumbers {
  return {
    kcal: Math.round(totals.kcal.value),
    proteinG: Math.round(totals.protein_g.value),
    carbsG: Math.round(totals.carbs_g.value),
    fatG: Math.round(totals.fat_g.value),
    partial
  };
}

/**
 * Datos de la vista «Hoy» de un deportista y un día. El acceso lo decide la ruta (canSeeAthleteNutrition);
 * kcal y macros solo se calculan y devuelven si `athletes.show_numbers` está activo.
 */
export async function nutritionToday(tx: Tx, athleteId: string, date: string): Promise<TodayData | null> {
  const athlete = await tx<{ diet_notes: string | null; supplements: unknown; show_numbers: boolean }[]>`
    select diet_notes, supplements, show_numbers from athletes where id = ${athleteId} limit 1
  `;
  if (!athlete[0]) return null;
  const showNumbers = athlete[0].show_numbers === true;

  const plan = await tx<{ md_tag: string | null }[]>`
    select md_tag from day_plans where athlete_id = ${athleteId} and date = ${date}::date limit 1
  `;
  const noteRows = await tx<{ note: string }[]>`
    select note from meal_day_notes where athlete_id = ${athleteId} and date = ${date}::date limit 1
  `;
  const meals = await mealsForAthleteRange(tx, athleteId, date, date);

  // Ingredientes vigentes (mismo texto del plato con el que se generaron), en su orden.
  const items = meals.length
    ? await tx<ItemRow[]>`
        select mi.meal_slot_id, mi.raw_text, mi.grams::text, mi.confirmed, f.name_es, f.unit_name, f.unit_g::text
        from meal_items mi
        join meal_slots ms on ms.id = mi.meal_slot_id
        left join foods f on f.id = mi.food_id
        where ms.athlete_id = ${athleteId} and ms.date = ${date}::date
          and mi.text_hash = md5(coalesce(nullif(ms.preparation, ''), ms.title))
        order by mi.meal_slot_id, mi.position
      `
    : [];

  // Mismo alimento dos veces en un plato (p. ej. aceite en dos elaboraciones): una línea con la suma.
  const bySlot = new Map<string, Map<string, { name: string; grams: number | null; unit: ItemRow }>>();
  for (const it of items) {
    const name = capitalize(it.name_es ?? it.raw_text);
    if (!name) continue;
    const key = name.toLocaleLowerCase("es");
    const slotMap = bySlot.get(it.meal_slot_id) ?? new Map();
    bySlot.set(it.meal_slot_id, slotMap);
    // Borradores sin confirmar: se ve el alimento, no una cantidad que la nutricionista aún no validó.
    const grams = it.confirmed ? toNumber(it.grams) : null;
    const prev = slotMap.get(key);
    if (prev) prev.grams = prev.grams == null ? grams : grams == null ? prev.grams : prev.grams + grams;
    else slotMap.set(key, { name, grams, unit: it });
  }

  const totals = showNumbers && meals.length ? await nutritionTotals(tx, athleteId, date, date) : null;
  const mealTotals = new Map(totals?.meals.map((m) => [m.mealSlotId, m]) ?? []);
  const day = totals?.days[0];

  return {
    date,
    mdTag: plan[0]?.md_tag?.trim() || null,
    dayType: dayTypeFromMdTag(plan[0]?.md_tag),
    fuel: fuelLevel(dayTypeFromMdTag(plan[0]?.md_tag)),
    note: noteRows[0]?.note?.trim() || null,
    meals: meals.map((m) => {
      const ingredients: TodayIngredient[] = [...(bySlot.get(m.id)?.values() ?? [])].map((i) => ({
        name: i.name,
        amount: roundedAmount(i.grams, i.name, { name: i.unit.unit_name, grams: toNumber(i.unit.unit_g) })
      }));
      const mt = mealTotals.get(m.id);
      return {
        id: m.id,
        slot: m.slot,
        title: m.title,
        preparation: m.preparation,
        hasPhoto: m.hasPhoto,
        updatedAt: m.updatedAt,
        ingredients,
        numbers: mt?.quantified ? numbersFrom(mt.totals, false) : null
      };
    }),
    supplements: parseSupplements(athlete[0].supplements),
    dietNotes: athlete[0].diet_notes?.trim() || null,
    showNumbers,
    dayNumbers: day && day.quantified > 0 ? numbersFrom(day.totals, day.quantified < day.planned) : null
  };
}
