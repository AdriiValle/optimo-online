import type { Tx } from "@/lib/db";
import { buildShoppingList, type ShoppingInput, type ShoppingList, type ShoppingRange } from "./shopping";

export type ShoppingData = {
  range: ShoppingRange;
  /** Platos del menú en el rango (franjas con título). */
  meals: number;
  /** De esos, cuántos aún no tienen ingredientes confirmados: no entran en la lista. */
  mealsPending: number;
  list: ShoppingList;
};

type ItemRow = {
  meal_slot_id: string;
  food_id: string | null;
  raw_text: string;
  grams: string | null;
  name_es: string | null;
  aisle: string | null;
  unit_name: string | null;
  unit_g: string | null;
  pack_g: string | null;
  staple: boolean | null;
};

function toNumber(v: string | null) {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Lista de la compra de un deportista en un rango: ingredientes confirmados y vigentes (mismo texto del plato
 * con el que se generaron) + marcas «ya lo tengo» de la semana. El acceso lo decide quien llama.
 */
export async function shoppingForRange(tx: Tx, athleteId: string, range: ShoppingRange): Promise<ShoppingData> {
  const meals = await tx<{ id: string; has_items: boolean }[]>`
    select ms.id,
      exists (
        select 1 from meal_items mi
        where mi.meal_slot_id = ms.id and mi.confirmed
          and mi.text_hash = md5(coalesce(nullif(ms.preparation, ''), ms.title))
      ) as has_items
    from meal_slots ms
    where ms.athlete_id = ${athleteId}
      and ms.date between ${range.from}::date and ${range.to}::date
      and btrim(ms.title) <> ''
  `;
  const items = meals.some((m) => m.has_items)
    ? await tx<ItemRow[]>`
        select mi.meal_slot_id, mi.food_id::text, mi.raw_text, mi.grams::text,
          f.name_es, f.aisle, f.unit_name, f.unit_g::text, f.pack_g::text, f.staple
        from meal_items mi
        join meal_slots ms on ms.id = mi.meal_slot_id
        left join foods f on f.id = mi.food_id
        where ms.athlete_id = ${athleteId}
          and ms.date between ${range.from}::date and ${range.to}::date
          and mi.confirmed
          and mi.text_hash = md5(coalesce(nullif(ms.preparation, ''), ms.title))
        order by ms.date, ms.slot, mi.position
      `
    : [];
  const checks = await tx<{ food_key: string }[]>`
    select food_key from shopping_checks
    where athlete_id = ${athleteId} and week_start = ${range.weekStart}::date and checked
  `;

  const inputs: ShoppingInput[] = items.map((r) => ({
    foodId: r.food_id,
    rawText: r.raw_text,
    grams: toNumber(r.grams),
    mealSlotId: r.meal_slot_id,
    food:
      r.food_id && r.name_es
        ? {
            name: r.name_es,
            aisle: r.aisle,
            unitName: r.unit_name?.trim() || null,
            unitG: toNumber(r.unit_g),
            packG: toNumber(r.pack_g),
            staple: r.staple === true
          }
        : null
  }));

  return {
    range,
    meals: meals.length,
    mealsPending: meals.filter((m) => !m.has_items).length,
    list: buildShoppingList(inputs, checks.map((c) => c.food_key))
  };
}

/** Marca o desmarca «ya lo tengo» de una línea en la semana `weekStart`. Desmarcar borra la fila. */
export async function setShoppingCheck(tx: Tx, athleteId: string, weekStart: string, foodKey: string, checked: boolean) {
  if (checked) {
    await tx`
      insert into shopping_checks (athlete_id, week_start, food_key, checked)
      values (${athleteId}, ${weekStart}::date, ${foodKey}, true)
      on conflict (athlete_id, week_start, food_key) do update set checked = true, updated_at = now()
    `;
  } else {
    await tx`
      delete from shopping_checks
      where athlete_id = ${athleteId} and week_start = ${weekStart}::date and food_key = ${foodKey}
    `;
  }
  return checked;
}
