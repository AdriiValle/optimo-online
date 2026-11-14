import type { CatalogFood } from "./food-catalog";
import { splitCategory } from "./protein-category";

export type DishItemRole = "veg" | "protein" | "carb" | "fat" | "other";

export type ParsedDishItem = {
  /** Trozo original del plato (con alternativas «Lubina/Merluza» y notas entre paréntesis). */
  raw_text: string;
  role: DishItemRole;
  food_id?: string;
  /** Candidatos cuando el texto no basta para elegir uno (no se asignan). */
  suggestions?: string[];
};

export type ParsedDish = {
  /** Etiqueta `[CATEGORÍA]` del import Word (CARNE, PESCADO…), si venía. */
  category: string | null;
  items: ParsedDishItem[];
};

/** Resultado de casar un texto: alimento asignado, o candidatos para que la nutricionista elija. */
export type FoodMatch = {
  food?: CatalogFood;
  suggestions: CatalogFood[];
};

/** Rol por posición cuando el plato trae las 3 líneas típicas: verdura · proteína · hidrato. */
const POSITION_ROLES: DishItemRole[] = ["veg", "protein", "carb"];

/** Máximo de candidatos que se sugieren para un texto. */
const MAX_SUGGESTIONS = 4;

export function normalizeFoodText(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Raíz de una palabra normalizada: sin plural ni «e» final, igual en el texto y en el alias
 * (tomates → tomat ← tomate; champiñones → champinon ← champiñón; huevos → huevo).
 */
function stem(word: string) {
  if (word.length <= 3) return word;
  return word.replace(/s$/, "").replace(/e$/, "");
}

const stemAll = (words: string[]) => new Set(words.map(stem));

/** Artículos y enlaces que no distinguen alimentos («pechuga de pollo» = «pechuga pollo»). */
const STOP_WORDS = stemAll(["a", "al", "de", "del", "el", "la", "las", "lo", "los", "en", "o", "u", "un", "una", "unos", "unas", "para", "por", "tipo"]);

/** Preparación, corte y notas: no cambian el alimento («dorada a la plancha» = «dorada»). */
const PREP_WORDS = stemAll([
  "plancha", "parrilla", "brasa", "horno", "horneado", "horneada", "vapor", "micro", "microondas",
  "cocido", "cocida", "hervido", "hervida", "asado", "asada", "frito", "frita", "salteado", "salteada",
  "rehogado", "rehogada", "guisado", "guisada", "estofado", "estofada", "gratinado", "gratinada",
  "troceado", "troceada", "laminado", "laminada", "especiado", "especiada", "marinado", "marinada",
  "tiras", "tacos", "dados", "trozos", "rodajas",
  "opcional", "gusto", "casero", "casera", "fresco", "fresca"
]);

/** Palabras con contenido de un texto ya normalizado: raíz, sin enlaces, preparación ni cifras. */
export function foodTokens(text: string): string[] {
  return normalizeFoodText(text)
    .split(" ")
    .filter((w) => w && !/^\d+$/.test(w))
    .map(stem)
    .filter((w) => !STOP_WORDS.has(w) && !PREP_WORDS.has(w));
}

type AliasEntry = { food: CatalogFood; tokens: string[]; length: number };

export type FoodMatcher = (text: string) => FoodMatch;

function indexOfSeq(haystack: string[], needle: string[]) {
  outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
    for (let j = 0; j < needle.length; j++) if (haystack[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}

function uniqueFoods(foods: CatalogFood[]) {
  const seen = new Map<string, CatalogFood>();
  for (const f of foods) if (!seen.has(f.id)) seen.set(f.id, f);
  return [...seen.values()];
}

/**
 * Emparejado de un trozo de plato con el catálogo:
 * 1. Frase: un alias (en raíces, sin preparación) aparece seguido en el texto. Gana el que aparece antes y,
 *    a igual posición, el más largo («arroz integral» antes que «arroz»). Empate entre dos alimentos → sugerir.
 * 2. Palabra principal: la primera palabra con contenido del texto abre el alias de algún alimento.
 *    Un solo candidato y el texto no añade nada que el alimento no tenga → se asigna; si no → sugerir.
 * Nunca se asigna algo con más de un candidato.
 */
export function buildFoodMatcher(catalog: CatalogFood[]): FoodMatcher {
  const entries: AliasEntry[] = [];
  const headIndex = new Map<string, CatalogFood[]>();
  const vocabulary = new Map<string, Set<string>>();
  for (const food of catalog) {
    const words = new Set<string>();
    const seen = new Set<string>();
    for (const alias of [food.name_es, ...food.aliases]) {
      const tokens = foodTokens(alias);
      const key = tokens.join(" ");
      if (!tokens.length || seen.has(key)) continue;
      seen.add(key);
      entries.push({ food, tokens, length: key.length });
      for (const t of tokens) words.add(t);
      const list = headIndex.get(tokens[0]) ?? [];
      if (!list.includes(food)) list.push(food);
      headIndex.set(tokens[0], list);
    }
    vocabulary.set(food.id, words);
  }

  return (text: string): FoodMatch => {
    const tokens = foodTokens(text);
    if (!tokens.length) return { suggestions: [] };

    let best: { entry: AliasEntry; index: number } | undefined;
    const tied: CatalogFood[] = [];
    for (const entry of entries) {
      const index = indexOfSeq(tokens, entry.tokens);
      if (index < 0) continue;
      const better =
        !best ||
        index < best.index ||
        (index === best.index && entry.tokens.length > best.entry.tokens.length) ||
        (index === best.index && entry.tokens.length === best.entry.tokens.length && entry.length > best.entry.length);
      if (better) {
        best = { entry, index };
        tied.length = 0;
      } else if (
        best &&
        index === best.index &&
        entry.tokens.length === best.entry.tokens.length &&
        entry.length === best.entry.length &&
        entry.food.id !== best.entry.food.id
      ) {
        tied.push(entry.food);
      }
    }
    if (best) {
      if (!tied.length) return { food: best.entry.food, suggestions: [] };
      return { suggestions: uniqueFoods([best.entry.food, ...tied]).slice(0, MAX_SUGGESTIONS) };
    }

    const candidates = headIndex.get(tokens[0]) ?? [];
    if (candidates.length === 1) {
      const words = vocabulary.get(candidates[0].id)!;
      if (tokens.every((t) => words.has(t))) return { food: candidates[0], suggestions: [] };
    }
    return { suggestions: candidates.slice(0, MAX_SUGGESTIONS) };
  };
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
// Lista dentro de un paréntesis: comas, «y», «/».
const PAREN_LIST_SEP = /\s*,\s*|\s+y\s+|\s*\/\s*/;

function stripParens(s: string) {
  return s.replace(/\([^)]*\)/g, " ");
}

function parenContents(s: string) {
  return [...s.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]);
}

/**
 * Un trozo de plato (`raw_text`) → alimento. «A/B» son alternativas: se casa la primera opción que sea un
 * alimento. Si fuera del paréntesis no hay nada, lo que lista el paréntesis («verduras (calabacín, puerro)»)
 * solo se sugiere: el paréntesis aclara o enumera, no decide el alimento.
 */
export function matchDishPart(raw: string, matcher: FoodMatcher): FoodMatch {
  const plain = stripParens(raw);
  const suggestions: CatalogFood[] = [];
  for (const option of plain.split("/")) {
    const m = matcher(option);
    if (m.food) return m;
    suggestions.push(...m.suggestions);
  }
  if (!suggestions.length) {
    for (const inner of parenContents(raw)) {
      for (const piece of inner.split(PAREN_LIST_SEP)) {
        const m = matcher(piece);
        if (m.food) suggestions.push(m.food);
        else suggestions.push(...m.suggestions);
      }
    }
  }
  return { suggestions: uniqueFoods(suggestions).slice(0, MAX_SUGGESTIONS) };
}

/**
 * Texto del plato (`preparation ?? title` de `meal_slots`) → ingredientes.
 * Las líneas van separadas por ` · `; `raw_text` conserva el original para que la nutricionista corrija.
 */
export function parseDish(text: string, catalog: CatalogFood[]): ParsedDish {
  const matcher = buildFoodMatcher(catalog);
  const { label: category, body } = splitCategory(text);

  const lines = body
    .split(/\s+·\s+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const items: ParsedDishItem[] = [];
  lines.forEach((line, lineIndex) => {
    const positionRole: DishItemRole = lines.length === 3 ? POSITION_ROLES[lineIndex] : "other";
    for (const raw of splitOutsideParens(line, INGREDIENT_SEP)) {
      if (!normalizeFoodText(stripParens(raw))) continue;
      const { food, suggestions } = matchDishPart(raw, matcher);
      items.push({
        raw_text: raw,
        role: food?.role ?? positionRole,
        ...(food ? { food_id: food.id } : {}),
        ...(!food && suggestions.length ? { suggestions: suggestions.map((s) => s.id) } : {})
      });
    }
  });

  return { category, items };
}
