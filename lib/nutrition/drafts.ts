import { createHash } from "node:crypto";
import type { MealSlotKind } from "@/lib/types";
import { FOOD_CATALOG, type CatalogFood } from "./food-catalog";
import { normalizeFoodText, parseDish, type DishItemRole } from "./parse-dish";
import type { DayType } from "./day-type";
import { equivalentGrams, portionGrams, type FoodMacros, type PortionRole, type PortionTemplateRow } from "./portions";

/** Fila de `foods` que necesita el generador. */
export type DbFood = FoodMacros & { id: string; name_es: string; aliases: string[] };

export type DraftItem = {
  food_id: string | null;
  raw_text: string;
  role: DishItemRole;
  grams: number | null;
  position: number;
};

/** Texto con el que se generan los items; igual que `md5(coalesce(nullif(preparation, ''), title))` en SQL. */
export function dishText(title: string, preparation: string | null) {
  return preparation || title;
}

export function dishTextHash(title: string, preparation: string | null) {
  return createHash("md5").update(dishText(title, preparation), "utf8").digest("hex");
}

function keysOf(name: string, aliases: string[]) {
  return [name, ...aliases].map(normalizeFoodText).filter(Boolean);
}

/**
 * Catálogo del parser con ids de `foods`. Cada alimento del catálogo O2 (alias + rol) se cruza con su fila
 * por `name_es`, y si no, por alias. Los `foods` sin pareja entran con sus alias y sin rol (rol por posición).
 * Alimentos O2 sin fila en `foods` se quedan fuera: sus líneas salen sin `food_id` (pendientes).
 */
export function catalogFromFoods(foods: DbFood[]): CatalogFood[] {
  const byName = new Map(foods.map((f) => [normalizeFoodText(f.name_es), f]));
  const byAlias = new Map<string, DbFood>();
  for (const f of foods) for (const k of keysOf(f.name_es, f.aliases)) if (!byAlias.has(k)) byAlias.set(k, f);

  const used = new Map<string, CatalogFood>();
  for (const local of FOOD_CATALOG) {
    const keys = keysOf(local.name_es, local.aliases);
    const db = byName.get(keys[0]) ?? keys.map((k) => byAlias.get(k)).find(Boolean);
    if (!db) continue;
    const prev = used.get(db.id);
    const aliases = [...(prev?.aliases ?? [db.name_es, ...db.aliases]), ...local.aliases, local.name_es];
    used.set(db.id, { id: db.id, name_es: db.name_es, aliases, role: prev?.role ?? local.role });
  }
  const rest = foods
    .filter((f) => !used.has(f.id))
    .map((f): CatalogFood => ({ id: f.id, name_es: f.name_es, aliases: [f.name_es, ...f.aliases] }));
  return [...used.values(), ...rest];
}

const COOKING_OIL = "aceite de oliva";

/**
 * Borradores de un plato: parser O2 + gramos por plantilla del tipo de día.
 * Verdura: ración repartida entre sus líneas. Proteína / hidrato: ración repartida y convertida por equivalencia
 * de macro. Grasa: la ración es aceite de cocinado (se añade una línea si el plato no la trae); aguacate, nueces…
 * reparten la misma ración por equivalencia de grasa. `other` (sal, ajo, limón…) sin gramos.
 */
export function buildDraftItems(
  text: string,
  ctx: {
    catalog: CatalogFood[];
    foods: Map<string, DbFood>;
    templates: PortionTemplateRow[];
    athleteId: string;
    dayType: DayType;
    slot: MealSlotKind;
  }
): DraftItem[] {
  const parsed = parseDish(text, ctx.catalog).items.map((it) => ({
    food_id: it.food_id ?? null,
    raw_text: it.raw_text,
    role: it.role
  }));
  const oil = [...ctx.foods.values()].find((f) => normalizeFoodText(f.name_es) === COOKING_OIL);
  const isOil = (foodId: string | null) => Boolean(oil && foodId === oil.id);
  if (parsed.length && oil && !parsed.some((it) => isOil(it.food_id))) {
    parsed.push({ food_id: oil.id, raw_text: "Aceite de oliva (cocinado)", role: "fat" });
  }

  const share = (role: DishItemRole, pred: (foodId: string | null) => boolean = () => true) =>
    parsed.filter((it) => it.role === role && pred(it.food_id)).length;

  return parsed.map((it, position) => {
    let grams: number | null = null;
    if (it.role !== "other") {
      const role: PortionRole = it.role;
      const base = portionGrams(ctx.templates, ctx.athleteId, ctx.dayType, ctx.slot, role);
      if (base != null) {
        const food = it.food_id ? ctx.foods.get(it.food_id) : undefined;
        if (role === "veg") grams = Math.max(5, Math.round(base / share("veg") / 5) * 5);
        else if (role === "fat" && isOil(it.food_id)) grams = equivalentGrams("fat", base / share("fat", isOil), food);
        else if (role === "fat") grams = equivalentGrams("fat", base / share("fat", (id) => !isOil(id)), food);
        else grams = equivalentGrams(role, base / share(role), food);
        if (base <= 0) grams = 0;
      }
    }
    return { ...it, grams, position };
  });
}

export type QuantifiableItem = {
  food_id: string | null;
  role: DishItemRole;
  grams: number | null;
  confirmed: boolean;
  obsolete: boolean;
};

/**
 * Item que no impide cuantificar: alimento + gramos; o `other` con alimento y sin gramos (sal, ajo…);
 * o gramos = 0 (la nutricionista lo descarta). Siempre confirmado y del texto vigente.
 */
export function itemIsQuantified(it: QuantifiableItem) {
  if (!it.confirmed || it.obsolete) return false;
  if (it.grams === 0) return true;
  if (!it.food_id) return false;
  return it.grams != null || it.role === "other";
}

/** El plato cuenta en totales si tiene items vigentes y todos están cuantificados. Los obsoletos no cuentan. */
export function dishIsQuantified(items: QuantifiableItem[]) {
  const current = items.filter((it) => !it.obsolete);
  return current.length > 0 && current.every(itemIsQuantified);
}
