import type { Tx } from "@/lib/db";
import type { MealSlot, MealSlotKind } from "@/lib/types";
import { roundedAmount } from "./today";

/**
 * Pista N8: plantillas de menú, biblioteca de platos, sustituciones aprobadas y nota del día.
 * Plantillas, platos y sustituciones son catálogos globales de la nutricionista (sin deportista);
 * el acceso al deportista de origen o destino se comprueba en la ruta (canSeeAthleteNutrition).
 */

// Ingredientes vigentes = `meal_items.text_hash` igual a md5 del texto del plato (mismo criterio que drafts.ts).

export type TemplateKind = "day" | "week";

export type TemplateSlotPreview = { dayOffset: number; slot: MealSlotKind; title: string; items: number };

export type MenuTemplate = {
  id: string;
  name: string;
  kind: TemplateKind;
  mdTag: string | null;
  createdAt: string;
  slots: TemplateSlotPreview[];
};

export async function listTemplates(tx: Tx): Promise<MenuTemplate[]> {
  const rows = await tx<
    { id: string; name: string; kind: TemplateKind; md_tag: string | null; created_at: string; slots: TemplateSlotPreview[] | null }[]
  >`
    select t.id, t.name, t.kind, t.md_tag, t.created_at::text,
      (
        select json_agg(json_build_object(
          'dayOffset', s.day_offset, 'slot', s.slot, 'title', s.title,
          'items', (select count(*)::int from menu_template_items i where i.template_slot_id = s.id)
        ) order by s.day_offset, array_position(array['breakfast','morning_snack','lunch','afternoon_snack','dinner']::text[], s.slot::text))
        from menu_template_slots s where s.template_id = t.id
      ) as slots
    from menu_templates t
    order by t.updated_at desc, t.name
  `;
  return rows.map((r) => ({ id: r.id, name: r.name, kind: r.kind, mdTag: r.md_tag, createdAt: r.created_at, slots: r.slots ?? [] }));
}

/**
 * Copia los platos (texto, preparación, foto) y sus ingredientes vigentes del deportista desde `from`
 * (1 día o 7) a una plantilla nueva. null si en ese rango no hay ningún plato.
 */
export async function saveTemplateFromMenu(
  tx: Tx,
  input: { athleteId: string; from: string; kind: TemplateKind; name: string; mdTag: string | null; accountId: string | null }
): Promise<string | null> {
  const days = input.kind === "week" ? 6 : 0;
  const count = await tx<{ n: number }[]>`
    select count(*)::int as n from meal_slots
    where athlete_id = ${input.athleteId} and date between ${input.from}::date and ${input.from}::date + ${days}::int
  `;
  if (!count[0]?.n) return null;

  const t = await tx<{ id: string }[]>`
    insert into menu_templates (name, kind, md_tag, created_by)
    values (${input.name}, ${input.kind}, ${input.mdTag}, ${input.accountId})
    returning id
  `;
  const id = t[0].id;
  await tx`
    insert into menu_template_slots (template_id, day_offset, slot, title, preparation, photo_bytes, photo_mime)
    select ${id}, ms.date - ${input.from}::date, ms.slot, ms.title, ms.preparation,
      case when octet_length(ms.photo_bytes) > 0 then ms.photo_bytes end,
      case when octet_length(ms.photo_bytes) > 0 then ms.photo_mime end
    from meal_slots ms
    where ms.athlete_id = ${input.athleteId} and ms.date between ${input.from}::date and ${input.from}::date + ${days}::int
  `;
  await tx`
    insert into menu_template_items (template_slot_id, food_id, raw_text, role, grams, position)
    select ts.id, mi.food_id, mi.raw_text, mi.role, mi.grams, mi.position
    from menu_template_slots ts
    join meal_slots ms on ms.athlete_id = ${input.athleteId}
      and ms.date = ${input.from}::date + ts.day_offset and ms.slot = ts.slot
    join meal_items mi on mi.meal_slot_id = ms.id and mi.text_hash = md5(coalesce(nullif(ms.preparation, ''), ms.title))
    where ts.template_id = ${id}
  `;
  return id;
}

export async function deleteTemplate(tx: Tx, id: string) {
  const rows = await tx<{ id: string }[]>`delete from menu_templates where id = ${id} returning id`;
  return Boolean(rows[0]);
}

export async function templateKind(tx: Tx, id: string): Promise<TemplateKind | null> {
  const rows = await tx<{ kind: TemplateKind }[]>`select kind from menu_templates where id = ${id} limit 1`;
  return rows[0]?.kind ?? null;
}

/**
 * Deja los ingredientes de las franjas `ids` iguales a los de su origen: borra los que hubiera y copia
 * los nuevos confirmados con el hash del texto vigente (así el generador de borradores no los pisa).
 * Sin ingredientes en el origen, el hash queda vacío y el generador hará los borradores.
 */
async function finishCopiedSlots(tx: Tx, ids: string[]) {
  if (!ids.length) return;
  await tx`
    update meal_slots ms set items_text_hash = case
      when exists (select 1 from meal_items mi where mi.meal_slot_id = ms.id) then md5(coalesce(nullif(ms.preparation, ''), ms.title))
    end
    where ms.id = any(${ids}::uuid[])
  `;
}

export type ApplyResult = { created: number; replaced: number; skipped: number };

/**
 * Aplica una plantilla al deportista empezando en `start` (día de la plantilla de día; lunes para la de semana).
 * Por franja: si no hay plato, lo crea; si lo hay, lo sustituye solo con `overwrite` (si no, se salta).
 * Copia texto, preparación, foto e ingredientes (confirmados, `origin='manual'`).
 */
export async function applyTemplate(
  tx: Tx,
  input: { templateId: string; athleteId: string; start: string; overwrite: boolean }
): Promise<ApplyResult> {
  const src = await tx<{ id: string; date: string; slot: MealSlotKind; existing: boolean }[]>`
    select ts.id, (${input.start}::date + ts.day_offset)::text as date, ts.slot,
      exists (select 1 from meal_slots m where m.athlete_id = ${input.athleteId}
        and m.date = ${input.start}::date + ts.day_offset and m.slot = ts.slot) as existing
    from menu_template_slots ts where ts.template_id = ${input.templateId}
  `;
  const todo = src.filter((s) => input.overwrite || !s.existing);
  const result: ApplyResult = { created: 0, replaced: 0, skipped: src.length - todo.length };
  const targetIds: string[] = [];
  for (const s of todo) {
    const rows = await tx<{ id: string }[]>`
      insert into meal_slots (athlete_id, date, slot, title, preparation, photo_bytes, photo_mime)
      select ${input.athleteId}, ${s.date}::date, ts.slot, ts.title, ts.preparation, ts.photo_bytes, ts.photo_mime
      from menu_template_slots ts where ts.id = ${s.id}
      on conflict (athlete_id, date, slot) do update set
        title = excluded.title, preparation = excluded.preparation,
        photo_bytes = excluded.photo_bytes, photo_mime = excluded.photo_mime, updated_at = now()
      returning id
    `;
    const mealId = rows[0].id;
    await tx`delete from meal_items where meal_slot_id = ${mealId}`;
    await tx`
      insert into meal_items (meal_slot_id, food_id, raw_text, role, grams, origin, confirmed, position, text_hash)
      select ${mealId}, ti.food_id, ti.raw_text, ti.role, ti.grams, 'manual', true, ti.position,
        md5(coalesce(nullif(ts.preparation, ''), ts.title))
      from menu_template_items ti join menu_template_slots ts on ts.id = ti.template_slot_id
      where ti.template_slot_id = ${s.id}
    `;
    targetIds.push(mealId);
    if (s.existing) result.replaced++;
    else result.created++;
  }
  await finishCopiedSlots(tx, targetIds);
  return result;
}

// Biblioteca de platos.

export type Dish = {
  id: string;
  name: string;
  slot: MealSlotKind | null;
  preparation: string | null;
  hasPhoto: boolean;
  updatedAt: string;
  items: { text: string; grams: number | null }[];
};

export async function listDishes(tx: Tx, q?: string, limit = 300): Promise<Dish[]> {
  const term = q?.trim() ? `%${q.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null;
  const rows = await tx<
    {
      id: string;
      name: string;
      slot: MealSlotKind | null;
      preparation: string | null;
      has_photo: boolean;
      updated_at: string;
      items: { text: string; grams: number | null }[] | null;
    }[]
  >`
    select d.id, d.name, d.slot, d.preparation,
      (d.photo_bytes is not null and octet_length(d.photo_bytes) > 0) as has_photo,
      d.updated_at::text,
      (
        select json_agg(json_build_object('text', coalesce(f.name_es, di.raw_text), 'grams', di.grams) order by di.position)
        from dish_items di left join foods f on f.id = di.food_id where di.dish_id = d.id
      ) as items
    from dishes d
    where ${term}::text is null or d.name ilike ${term} or d.preparation ilike ${term}
    order by d.updated_at desc, d.name
    limit ${limit}
  `;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slot: r.slot,
    preparation: r.preparation,
    hasPhoto: r.has_photo,
    updatedAt: r.updated_at,
    items: (r.items ?? []).map((i) => ({ text: i.text, grams: i.grams == null ? null : Number(i.grams) }))
  }));
}

/**
 * Guarda un plato del menú en la biblioteca (texto, preparación, foto e ingredientes vigentes).
 * Si ya hay uno con el mismo nombre, lo actualiza en vez de duplicarlo. null si el plato no existe.
 */
export async function saveDishFromMeal(
  tx: Tx,
  mealSlotId: string,
  accountId: string | null
): Promise<{ id: string; updated: boolean } | null> {
  const meal = await tx<{ title: string }[]>`select title from meal_slots where id = ${mealSlotId} limit 1`;
  if (!meal[0]) return null;
  const name = meal[0].title.trim().slice(0, 160) || "Plato";
  const existing = await tx<{ id: string }[]>`
    select id from dishes where lower(name) = lower(${name}) order by updated_at desc limit 1
  `;
  let id: string;
  if (existing[0]) {
    id = existing[0].id;
    await tx`
      update dishes d set name = ${name}, slot = ms.slot, preparation = ms.preparation,
        photo_bytes = case when octet_length(ms.photo_bytes) > 0 then ms.photo_bytes else d.photo_bytes end,
        photo_mime = case when octet_length(ms.photo_bytes) > 0 then ms.photo_mime else d.photo_mime end,
        updated_at = now()
      from meal_slots ms where ms.id = ${mealSlotId} and d.id = ${id}
    `;
    await tx`delete from dish_items where dish_id = ${id}`;
  } else {
    const rows = await tx<{ id: string }[]>`
      insert into dishes (name, slot, preparation, photo_bytes, photo_mime, created_by)
      select ${name}, ms.slot, ms.preparation,
        case when octet_length(ms.photo_bytes) > 0 then ms.photo_bytes end,
        case when octet_length(ms.photo_bytes) > 0 then ms.photo_mime end,
        ${accountId}
      from meal_slots ms where ms.id = ${mealSlotId}
      returning id
    `;
    id = rows[0].id;
  }
  await tx`
    insert into dish_items (dish_id, food_id, raw_text, role, grams, position)
    select ${id}, mi.food_id, mi.raw_text, mi.role, mi.grams, mi.position
    from meal_items mi join meal_slots ms on ms.id = mi.meal_slot_id
    where mi.meal_slot_id = ${mealSlotId} and mi.text_hash = md5(coalesce(nullif(ms.preparation, ''), ms.title))
  `;
  return { id, updated: Boolean(existing[0]) };
}

export async function deleteDish(tx: Tx, id: string) {
  const rows = await tx<{ id: string }[]>`delete from dishes where id = ${id} returning id`;
  return Boolean(rows[0]);
}

export async function dishPhotoFor(tx: Tx, id: string) {
  const rows = await tx<{ photo_bytes: Buffer | Uint8Array | null; photo_mime: string | null }[]>`
    select photo_bytes, photo_mime from dishes where id = ${id} limit 1
  `;
  const row = rows[0];
  if (!row?.photo_bytes || !row.photo_bytes.length) return null;
  return { bytes: Buffer.from(row.photo_bytes), mime: row.photo_mime || "image/jpeg" };
}

/**
 * Pone un plato de la biblioteca en la franja del deportista (crea o sustituye): texto, preparación,
 * foto (si el plato tiene) e ingredientes confirmados. Devuelve el plato del menú; null si el plato no existe.
 */
export async function applyDish(
  tx: Tx,
  input: { dishId: string; athleteId: string; date: string; slot: MealSlotKind }
): Promise<MealSlot | null> {
  const rows = await tx<{ id: string }[]>`
    insert into meal_slots (athlete_id, date, slot, title, preparation, photo_bytes, photo_mime)
    select ${input.athleteId}, ${input.date}::date, ${input.slot}, d.name, d.preparation, d.photo_bytes, d.photo_mime
    from dishes d where d.id = ${input.dishId}
    on conflict (athlete_id, date, slot) do update set
      title = excluded.title, preparation = excluded.preparation,
      photo_bytes = excluded.photo_bytes, photo_mime = excluded.photo_mime,
      updated_at = now()
    returning id
  `;
  const mealId = rows[0]?.id;
  if (!mealId) return null;
  await tx`delete from meal_items where meal_slot_id = ${mealId}`;
  await tx`
    insert into meal_items (meal_slot_id, food_id, raw_text, role, grams, origin, confirmed, position, text_hash)
    select ${mealId}, di.food_id, di.raw_text, di.role, di.grams, 'manual', true, di.position, md5(coalesce(nullif(ms.preparation, ''), ms.title))
    from dish_items di join meal_slots ms on ms.id = ${mealId}
    where di.dish_id = ${input.dishId}
  `;
  await finishCopiedSlots(tx, [mealId]);
  const meal = await tx<
    { id: string; athlete_id: string; date: string; slot: MealSlotKind; title: string; preparation: string | null; has_photo: boolean; updated_at: string }[]
  >`
    select id, athlete_id, date::text, slot, title, preparation,
      (photo_bytes is not null and octet_length(photo_bytes) > 0) as has_photo, updated_at::text
    from meal_slots where id = ${mealId}
  `;
  const m = meal[0];
  return {
    id: m.id,
    athleteId: m.athlete_id,
    date: m.date,
    slot: m.slot,
    title: m.title,
    preparation: m.preparation,
    hasPhoto: m.has_photo,
    updatedAt: m.updated_at
  };
}

// Sustituciones aprobadas (food_swaps): gramos del sustituto = gramos del original × ratio.

export type FoodOption = { id: string; name: string };

export async function foodOptions(tx: Tx): Promise<FoodOption[]> {
  const rows = await tx<{ id: string; name_es: string }[]>`select id, name_es from foods order by name_es`;
  return rows.map((r) => ({ id: r.id, name: r.name_es }));
}

export type FoodSwap = { id: string; foodId: string; foodName: string; swapFoodId: string; swapFoodName: string; ratio: number };

export async function listSwaps(tx: Tx): Promise<FoodSwap[]> {
  const rows = await tx<{ id: string; food_id: string; food_name: string; swap_food_id: string; swap_name: string; ratio: string }[]>`
    select s.id, s.food_id, f.name_es as food_name, s.swap_food_id, sf.name_es as swap_name, s.ratio::text
    from food_swaps s join foods f on f.id = s.food_id join foods sf on sf.id = s.swap_food_id
    order by lower(f.name_es), lower(sf.name_es)
  `;
  return rows.map((r) => ({
    id: r.id,
    foodId: r.food_id,
    foodName: r.food_name,
    swapFoodId: r.swap_food_id,
    swapFoodName: r.swap_name,
    ratio: Number(r.ratio)
  }));
}

/** Aprueba (o corrige la razón de) una sustitución; con `reverse`, también la inversa (1/ratio). */
export async function upsertSwap(
  tx: Tx,
  input: { foodId: string; swapFoodId: string; ratio: number; reverse: boolean; accountId: string | null }
) {
  const pairs: [string, string, number][] = [[input.foodId, input.swapFoodId, input.ratio]];
  if (input.reverse) pairs.push([input.swapFoodId, input.foodId, Math.round((1 / input.ratio) * 10000) / 10000]);
  for (const [a, b, r] of pairs) {
    await tx`
      insert into food_swaps (food_id, swap_food_id, ratio, approved_by)
      values (${a}, ${b}, ${r}, ${input.accountId})
      on conflict (food_id, swap_food_id) do update set ratio = excluded.ratio, approved_by = excluded.approved_by
    `;
  }
}

export async function deleteSwap(tx: Tx, id: string) {
  const rows = await tx<{ id: string }[]>`delete from food_swaps where id = ${id} returning id`;
  return Boolean(rows[0]);
}

/** Alternativa aprobada para un ingrediente del día, con la cantidad ya recalculada y redondeada. */
export type SwapOption = { name: string; amount: string | null };

/** Ingrediente de un plato con sus sustituciones: `key` = nombre en minúsculas (como la línea de «Hoy»). */
export type IngredientSwaps = { key: string; options: SwapOption[] };

function capitalize(s: string) {
  const t = s.trim();
  return t ? t.charAt(0).toLocaleUpperCase("es") + t.slice(1) : t;
}

/**
 * Sustituciones aprobadas para los ingredientes de un día del deportista, por plato. Solo ingredientes
 * vigentes, confirmados y con alimento y gramos (los gramos del mismo alimento en un plato se suman,
 * como en «Hoy»). Un ingrediente sin sustitución aprobada no aparece.
 */
export async function swapsForDay(tx: Tx, athleteId: string, date: string): Promise<Record<string, IngredientSwaps[]>> {
  const rows = await tx<
    { meal_slot_id: string; food_id: string; name_es: string; grams: string; swap_name: string; ratio: string; unit_name: string | null; unit_g: string | null }[]
  >`
    with it as (
      select mi.meal_slot_id, mi.food_id, sum(mi.grams) as grams
      from meal_slots ms
      join meal_items mi on mi.meal_slot_id = ms.id and mi.text_hash = md5(coalesce(nullif(ms.preparation, ''), ms.title))
      where ms.athlete_id = ${athleteId} and ms.date = ${date}::date
        and mi.confirmed and mi.food_id is not null and mi.grams is not null and mi.grams > 0
      group by mi.meal_slot_id, mi.food_id
    )
    select it.meal_slot_id, it.food_id, f.name_es, it.grams::text, sf.name_es as swap_name, s.ratio::text,
      sf.unit_name, sf.unit_g::text
    from it
    join foods f on f.id = it.food_id
    join food_swaps s on s.food_id = it.food_id
    join foods sf on sf.id = s.swap_food_id
    order by it.meal_slot_id, lower(sf.name_es)
  `;
  const out: Record<string, IngredientSwaps[]> = {};
  for (const r of rows) {
    const list = (out[r.meal_slot_id] ??= []);
    const key = capitalize(r.name_es).toLocaleLowerCase("es");
    let entry = list.find((e) => e.key === key);
    if (!entry) list.push((entry = { key, options: [] }));
    const name = capitalize(r.swap_name);
    const grams = Number(r.grams) * Number(r.ratio);
    entry.options.push({
      name,
      amount: roundedAmount(grams, name, { name: r.unit_name, grams: r.unit_g == null ? null : Number(r.unit_g) })
    });
  }
  return out;
}

// Nota de la nutricionista por día (meal_day_notes).

export async function dayNote(tx: Tx, athleteId: string, date: string) {
  const rows = await tx<{ note: string; updated_at: string }[]>`
    select note, updated_at::text from meal_day_notes where athlete_id = ${athleteId} and date = ${date}::date limit 1
  `;
  return rows[0] ? { note: rows[0].note, updatedAt: rows[0].updated_at } : null;
}

/** Guarda la nota; texto vacío la borra. Devuelve la nota guardada (null si se borró). */
export async function setDayNote(tx: Tx, athleteId: string, date: string, note: string) {
  const text = note.trim();
  if (!text) {
    await tx`delete from meal_day_notes where athlete_id = ${athleteId} and date = ${date}::date`;
    return null;
  }
  const rows = await tx<{ note: string; updated_at: string }[]>`
    insert into meal_day_notes (athlete_id, date, note) values (${athleteId}, ${date}::date, ${text})
    on conflict (athlete_id, date) do update set note = excluded.note, updated_at = now()
    returning note, updated_at::text
  `;
  return rows[0] ? { note: rows[0].note, updatedAt: rows[0].updated_at } : null;
}
