import type { Tx } from "@/lib/db";
import { withRls, type RlsContext } from "@/lib/rls";
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

type MealRow = { id: string; has_items: boolean };

function mealsInRange(tx: Tx, athleteId: string, range: ShoppingRange) {
  return tx<MealRow[]>`
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
}

function itemsInRange(tx: Tx, athleteId: string, range: ShoppingRange) {
  return tx<ItemRow[]>`
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
  `;
}

function checksForWeek(tx: Tx, athleteId: string, range: ShoppingRange) {
  return tx<{ food_key: string }[]>`
    select food_key from shopping_checks
    where athlete_id = ${athleteId} and week_start = ${range.weekStart}::date and checked
  `;
}

function assemble(range: ShoppingRange, meals: MealRow[], items: ItemRow[], checks: { food_key: string }[]): ShoppingData {
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

/**
 * Lista de la compra de un deportista en un rango: ingredientes confirmados y vigentes (mismo texto del plato
 * con el que se generaron) + marcas «ya lo tengo» de la semana. El acceso lo decide quien llama.
 */
export async function shoppingForRange(tx: Tx, athleteId: string, range: ShoppingRange): Promise<ShoppingData> {
  const meals = await mealsInRange(tx, athleteId, range);
  const items = meals.some((m) => m.has_items) ? await itemsInRange(tx, athleteId, range) : [];
  const checks = await checksForWeek(tx, athleteId, range);
  return assemble(range, meals, items, checks);
}

/** Configuración de compra de un alimento del catálogo (`foods`), tal como la trae la lista. */
export type ShoppingFoodRow = { id: string; aisle: string | null; unit_name: string | null; unit_g: string | null; pack_g: string | null };

/**
 * Igual que `shoppingForRange`, pero las 3 lecturas van en 3 tx paralelas (con `prepare: false`, dentro de
 * una tx se serializan; ver `lib/rls.ts`). Devuelve también la configuración de los alimentos de la lista,
 * leída en el mismo join, para no gastar otra consulta.
 */
export async function shoppingForRangeParallel(
  ctx: RlsContext,
  athleteId: string,
  range: ShoppingRange
): Promise<{ shopping: ShoppingData; foods: ShoppingFoodRow[] }> {
  const [meals, allItems, checks] = await Promise.all([
    withRls(ctx, (tx) => mealsInRange(tx, athleteId, range)),
    withRls(ctx, (tx) => itemsInRange(tx, athleteId, range)),
    withRls(ctx, (tx) => checksForWeek(tx, athleteId, range))
  ]);
  // Mismo criterio que la versión en serie: sin platos con ingredientes, no hay ingredientes.
  const items = meals.some((m) => m.has_items) ? allItems : [];
  const foods = new Map<string, ShoppingFoodRow>();
  for (const r of items) {
    if (r.food_id && r.name_es && !foods.has(r.food_id)) {
      foods.set(r.food_id, { id: r.food_id, aisle: r.aisle, unit_name: r.unit_name, unit_g: r.unit_g, pack_g: r.pack_g });
    }
  }
  return { shopping: assemble(range, meals, items, checks), foods: [...foods.values()] };
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
