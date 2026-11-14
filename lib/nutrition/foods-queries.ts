import type { Tx } from "@/lib/db";
import { foodsForDrafts } from "@/lib/queries";
import { catalogFromFoods } from "./drafts";
import type { CatalogFood } from "./food-catalog";
import { buildFoodMatcher, foodTokens, matchDishPart, normalizeFoodText, type DishItemRole } from "./parse-dish";

/** Fila de `foods` tal como la edita la nutricionista en «Alimentos». */
export type FoodRow = {
  id: string;
  name: string;
  aliases: string[];
  aisle: string | null;
  unitName: string | null;
  unitG: number | null;
  packG: number | null;
  staple: boolean;
  source: "fdc" | "bedca" | "manual";
  /** Items de plato (visibles para quien consulta) que usan este alimento. */
  itemCount: number;
};

export type FoodInput = {
  name: string;
  aliases: string[];
  aisle: string | null;
  unitName: string | null;
  unitG: number | null;
  packG: number | null;
  staple: boolean;
};

type FoodRowDb = {
  id: string;
  name_es: string;
  aliases: string[];
  aisle: string | null;
  unit_name: string | null;
  unit_g: string | null;
  pack_g: string | null;
  staple: boolean;
  source: FoodRow["source"];
  item_count: number;
};

const num = (v: string | null) => (v == null ? null : Number(v));

function mapFood(r: FoodRowDb): FoodRow {
  return {
    id: r.id,
    name: r.name_es,
    aliases: r.aliases,
    aisle: r.aisle,
    unitName: r.unit_name,
    unitG: num(r.unit_g),
    packG: num(r.pack_g),
    staple: r.staple,
    source: r.source,
    itemCount: r.item_count
  };
}

/** Alias tal como se guarda: normalizado (sin tildes, minúsculas), sin vacíos ni repetidos ni el propio nombre. */
export function cleanAliases(name: string, aliases: string[]) {
  const own = normalizeFoodText(name);
  return [...new Set(aliases.map(normalizeFoodText).filter((a) => a && a !== own))];
}

export async function listFoods(tx: Tx): Promise<FoodRow[]> {
  const rows = await tx<FoodRowDb[]>`
    select f.id, f.name_es, f.aliases, f.aisle, f.unit_name, f.unit_g::text, f.pack_g::text, f.staple, f.source,
      (select count(*)::int from meal_items mi where mi.food_id = f.id) as item_count
    from foods f
    order by f.name_es
  `;
  return rows.map(mapFood);
}

export async function foodById(tx: Tx, id: string): Promise<FoodRow | null> {
  const rows = await tx<FoodRowDb[]>`
    select f.id, f.name_es, f.aliases, f.aisle, f.unit_name, f.unit_g::text, f.pack_g::text, f.staple, f.source,
      (select count(*)::int from meal_items mi where mi.food_id = f.id) as item_count
    from foods f
    where f.id = ${id}
    limit 1
  `;
  return rows[0] ? mapFood(rows[0]) : null;
}

/** Alimento nuevo a mano (`source = 'manual'`, sin valores nutricionales hasta que se completen). */
export async function createFood(tx: Tx, input: FoodInput): Promise<string> {
  const rows = await tx<{ id: string }[]>`
    insert into foods (name_es, aliases, source, aisle, unit_name, unit_g, pack_g, staple)
    values (
      ${input.name}, ${cleanAliases(input.name, input.aliases)}, 'manual',
      ${input.aisle}, ${input.unitName}, ${input.unitG}, ${input.packG}, ${input.staple}
    )
    returning id
  `;
  return rows[0].id;
}

export async function updateFood(tx: Tx, id: string, patch: Partial<FoodInput>) {
  const current = await foodById(tx, id);
  if (!current) return false;
  const name = patch.name ?? current.name;
  const aliases = patch.aliases !== undefined ? cleanAliases(name, patch.aliases) : current.aliases;
  await tx`
    update foods set
      name_es = ${name},
      aliases = ${aliases},
      aisle = ${patch.aisle === undefined ? current.aisle : patch.aisle},
      unit_name = ${patch.unitName === undefined ? current.unitName : patch.unitName},
      unit_g = ${patch.unitG === undefined ? current.unitG : patch.unitG},
      pack_g = ${patch.packG === undefined ? current.packG : patch.packG},
      staple = ${patch.staple === undefined ? current.staple : patch.staple},
      updated_at = now()
    where id = ${id}
  `;
  return true;
}

export async function addFoodAlias(tx: Tx, id: string, alias: string) {
  const current = await foodById(tx, id);
  if (!current) return false;
  const aliases = cleanAliases(current.name, [...current.aliases, alias]);
  await tx`update foods set aliases = ${aliases}, updated_at = now() where id = ${id}`;
  return true;
}

/** Item de plato sin alimento: vigente (texto del plato sin cambiar) y no descartado (gramos ≠ 0). */
type OrphanItem = { id: string; rawText: string; role: DishItemRole; athleteId: string };

async function orphanMealItems(tx: Tx): Promise<OrphanItem[]> {
  const rows = await tx<{ id: string; raw_text: string; role: DishItemRole; athlete_id: string }[]>`
    select mi.id, mi.raw_text, mi.role, ms.athlete_id
    from meal_items mi
    join meal_slots ms on ms.id = mi.meal_slot_id
    where mi.food_id is null
      and mi.grams is distinct from 0
      and mi.text_hash is not distinct from md5(coalesce(nullif(ms.preparation, ''), ms.title))
  `;
  return rows.map((r) => ({ id: r.id, rawText: r.raw_text, role: r.role, athleteId: r.athlete_id }));
}

/** Clave de agrupación de la bandeja: el texto normalizado completo (con lo que diga el paréntesis). */
export function orphanKey(rawText: string) {
  return normalizeFoodText(rawText);
}

/** Alias que se guarda al decir «es alias de X»: el texto sin paréntesis, normalizado. */
export function aliasFromText(rawText: string) {
  return normalizeFoodText(rawText.replace(/\([^)]*\)/g, " "));
}

export type FoodRef = { id: string; name: string };

export type OrphanGroup = {
  key: string;
  /** Texto más frecuente del grupo, tal como aparece en el menú. */
  text: string;
  count: number;
  athletes: number;
  /** El emparejado automático ya lo resuelve sin ambigüedad (falta aplicarlo a estos items). */
  match: FoodRef | null;
  /** Candidatos: la nutricionista elige con un clic. */
  suggestions: FoodRef[];
};

function mostFrequent(values: string[]) {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

async function catalogNow(tx: Tx) {
  return catalogFromFoods(await foodsForDrafts(tx));
}

/** Bandeja «Sin alimento»: items huérfanos agrupados por texto, de más a menos frecuentes. */
export async function orphanGroups(tx: Tx): Promise<OrphanGroup[]> {
  const [items, catalog] = await Promise.all([orphanMealItems(tx), catalogNow(tx)]);
  const matcher = buildFoodMatcher(catalog);
  const groups = new Map<string, OrphanItem[]>();
  for (const it of items) {
    const key = orphanKey(it.rawText);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), it]);
  }
  const ref = (f: CatalogFood): FoodRef => ({ id: f.id, name: f.name_es });
  return [...groups.entries()]
    .map(([key, list]): OrphanGroup => {
      const text = mostFrequent(list.map((it) => it.rawText.trim()));
      const m = matchDishPart(text, matcher);
      return {
        key,
        text,
        count: list.length,
        athletes: new Set(list.map((it) => it.athleteId)).size,
        match: m.food ? ref(m.food) : null,
        suggestions: m.suggestions.map(ref)
      };
    })
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text, "es"));
}

/**
 * Asigna un alimento a items huérfanos. El rol pasa al del alimento si el item no tenía uno (`other`).
 * Quedan sin confirmar: faltan los gramos y la nutricionista los revisa en la ficha del plato.
 * Un plato con un item sin alimento ya no contaba en totales: no cambia nada de lo que ya sumaba.
 */
async function assignFood(tx: Tx, items: OrphanItem[], food: CatalogFood) {
  for (const it of items) {
    const role = it.role === "other" && food.role ? food.role : it.role;
    await tx`
      update meal_items set food_id = ${food.id}, role = ${role}, confirmed = false
      where id = ${it.id} and food_id is null
    `;
  }
  return items.length;
}

/** Grupo de la bandeja por su clave (null si ya no queda ningún item con ese texto). */
export async function orphanGroupByKey(tx: Tx, key: string) {
  return (await orphanGroups(tx)).find((g) => g.key === key) ?? null;
}

/** Re-empareja todos los huérfanos con ese texto (clave normalizada) al alimento dado. */
export async function matchOrphansByKey(tx: Tx, key: string, foodId: string) {
  const [items, catalog] = await Promise.all([orphanMealItems(tx), catalogNow(tx)]);
  const food = catalog.find((f) => f.id === foodId);
  if (!food) return null;
  return assignFood(
    tx,
    items.filter((it) => orphanKey(it.rawText) === key),
    food
  );
}

/** Aplica el emparejado automático (solo lo inequívoco) a todos los huérfanos. */
export async function autoMatchOrphans(tx: Tx) {
  const [items, catalog] = await Promise.all([orphanMealItems(tx), catalogNow(tx)]);
  const matcher = buildFoodMatcher(catalog);
  let assigned = 0;
  for (const it of items) {
    const { food } = matchDishPart(it.rawText, matcher);
    if (food) assigned += await assignFood(tx, [it], food);
  }
  return assigned;
}

/** Otro alimento que ya responde a ese alias (mismas palabras): darlo a dos alimentos los volvería ambiguos. */
export async function aliasOwner(tx: Tx, alias: string, exceptId?: string): Promise<FoodRef | null> {
  const key = foodTokens(alias).join(" ");
  if (!key) return null;
  for (const f of await catalogNow(tx)) {
    if (f.id === exceptId) continue;
    if ([f.name_es, ...f.aliases].some((a) => foodTokens(a).join(" ") === key)) return { id: f.id, name: f.name_es };
  }
  return null;
}
