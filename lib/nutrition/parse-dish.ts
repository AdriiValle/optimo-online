import type { CatalogFood } from "./food-catalog";

export type DishItemRole = "veg" | "protein" | "carb" | "fat" | "other";

export type ParsedDishItem = {
  /** Trozo original del plato (con alternativas «Lubina/Merluza» y notas entre paréntesis). */
  raw_text: string;
  role: DishItemRole;
  food_id?: string;
};

export type ParsedDish = {
  /** Etiqueta `[CATEGORÍA]` del import Word (CARNE, PESCADO…), si venía. */
  category: string | null;
  items: ParsedDishItem[];
};

/** Rol por posición cuando el plato trae las 3 líneas típicas: verdura · proteína · hidrato. */
const POSITION_ROLES: DishItemRole[] = ["veg", "protein", "carb"];

export function normalizeFoodText(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type AliasMatcher = { food: CatalogFood; re: RegExp; length: number };

function buildMatchers(catalog: CatalogFood[]): AliasMatcher[] {
  const out: AliasMatcher[] = [];
  for (const food of catalog) {
    for (const alias of new Set(food.aliases.map(normalizeFoodText).filter(Boolean))) {
      // Cada palabra admite plural simple (-s / -es).
      const body = alias
        .split(" ")
        .map((w) => `${escapeRegExp(w)}(?:e?s)?`)
        .join(" ");
      out.push({ food, re: new RegExp(`(?<![a-z0-9])${body}(?![a-z0-9])`), length: alias.length });
    }
  }
  return out;
}

/** Alimento cuyo alias aparece antes en el texto; a igual posición, el alias más largo. */
function matchFood(text: string, matchers: AliasMatcher[]): CatalogFood | undefined {
  const t = normalizeFoodText(text);
  if (!t) return undefined;
  let best: { food: CatalogFood; index: number; length: number } | undefined;
  for (const m of matchers) {
    const hit = m.re.exec(t);
    if (!hit) continue;
    if (!best || hit.index < best.index || (hit.index === best.index && m.length > best.length)) {
      best = { food: m.food, index: hit.index, length: m.length };
    }
  }
  return best?.food;
}

/** Parte por el separador sin cortar dentro de paréntesis. */
function splitOutsideParens(s: string, sep: RegExp): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else if (depth === 0) {
      sep.lastIndex = i;
      const m = sep.exec(s);
      if (m && m.index === i) {
        parts.push(s.slice(start, i));
        start = i + m[0].length;
        i = start - 1;
      }
    }
  }
  parts.push(s.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
}

// Ingredientes dentro de una línea: «con», «+», comas y «y».
const INGREDIENT_SEP = /\s+con\s+|\s+con$|^con\s+|\s*\+\s*|\s*,\s*|\s+y\s+/iy;

function stripParens(s: string) {
  return s.replace(/\([^)]*\)/g, " ");
}

/**
 * Texto del plato (`preparation ?? title` de `meal_slots`) → ingredientes.
 * Las líneas van separadas por ` · `; «A/B» son alternativas: se casa la primera opción
 * que sea un alimento y `raw_text` conserva el original para que la nutricionista corrija.
 */
export function parseDish(text: string, catalog: CatalogFood[]): ParsedDish {
  const matchers = buildMatchers(catalog);
  let body = text.replace(/\s+/g, " ").trim();
  let category: string | null = null;
  const cat = /^\[([^\]]*)\]\s*/.exec(body);
  if (cat) {
    category = cat[1].trim() || null;
    body = body.slice(cat[0].length);
  }

  const lines = body
    .split(/\s+·\s+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const items: ParsedDishItem[] = [];
  lines.forEach((line, lineIndex) => {
    const positionRole: DishItemRole = lines.length === 3 ? POSITION_ROLES[lineIndex] : "other";
    for (const raw of splitOutsideParens(line, INGREDIENT_SEP)) {
      const plain = stripParens(raw);
      if (!normalizeFoodText(plain)) continue;
      let food: CatalogFood | undefined;
      for (const option of plain.split("/")) {
        food = matchFood(option, matchers);
        if (food) break;
      }
      items.push({
        raw_text: raw,
        role: food?.role ?? positionRole,
        ...(food ? { food_id: food.id } : {}),
      });
    }
  });

  return { category, items };
}
