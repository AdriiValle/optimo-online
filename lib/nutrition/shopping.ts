/**
 * Lista de la compra (lógica pura, sin BD): suma los ingredientes confirmados del menú por alimento,
 * los reparte por pasillo y pasa los gramos a cantidad de compra («6 huevos», «1,2 kg»).
 * Las consultas viven en `shopping-queries.ts`; la vista, en `app/a/[id]/nutrition/shopping-view.tsx`.
 */
import { addDays, dateKey, MONTHS_ES, parseDateLocal, startOfWeekMonday } from "@/lib/dates";
import { normalizeFoodText } from "./parse-dish";

// —— Pasillos ——

export type AisleKey =
  | "fruta_verdura"
  | "carne"
  | "pescado"
  | "huevos_lacteos"
  | "panaderia_cereales"
  | "legumbres_despensa"
  | "aceites_salsas"
  | "congelados"
  | "otros";

/** Secciones de la lista, en el orden del recorrido por el súper. */
export type ShoppingSectionKey = AisleKey | "revisar" | "despensa";

export const AISLES: { key: AisleKey; label: string }[] = [
  { key: "fruta_verdura", label: "Fruta y verdura" },
  { key: "carne", label: "Carne" },
  { key: "pescado", label: "Pescado" },
  { key: "huevos_lacteos", label: "Huevos y lácteos" },
  { key: "panaderia_cereales", label: "Panadería y cereales" },
  { key: "legumbres_despensa", label: "Legumbres y despensa" },
  { key: "aceites_salsas", label: "Aceites y salsas" },
  { key: "congelados", label: "Congelados" },
  { key: "otros", label: "Otros" }
];

export const SECTION_LABELS: Record<ShoppingSectionKey, string> = {
  ...(Object.fromEntries(AISLES.map((a) => [a.key, a.label])) as Record<AisleKey, string>),
  revisar: "Otros / revisar",
  despensa: "Despensa: revisa que tengas"
};

const SECTION_ORDER: ShoppingSectionKey[] = [...AISLES.map((a) => a.key), "revisar", "despensa"];

/** Palabra (o frase) normalizada al inicio de palabra, con plural opcional: «platano» casa con «platanos». */
function phraseRe(phrases: string[]) {
  return new RegExp(`(?:^| )(?:${phrases.join("|")})(?:s|es)?(?= |$)`);
}

/**
 * Reglas por nombre para cuando `foods.aisle` está vacío. Se evalúan en orden: lo más específico primero
 * (conservas antes que pescado, «judías verdes» antes que legumbres, bebida vegetal antes que frutos secos).
 */
const AISLE_RULES: { aisle: AisleKey; re: RegExp }[] = [
  { aisle: "congelados", re: phraseRe(["congelad[oa]", "ultracongelad[oa]"]) },
  { aisle: "legumbres_despensa", re: phraseRe(["lata", "conserva", "bote", "en aceite", "al natural", "escabeche"]) },
  { aisle: "aceites_salsas", re: phraseRe(["aceite", "vinagre", "salsa", "tomate frito", "mayonesa", "ketchup", "mostaza", "pesto", "tahini"]) },
  { aisle: "huevos_lacteos", re: phraseRe(["huevo", "clara", "leche", "yogur", "kefir", "queso", "nata", "mantequilla", "requeson", "cuajada", "skyr", "bebida"]) },
  {
    aisle: "panaderia_cereales",
    re: phraseRe(["pan", "tortilla de trigo", "tortilla de maiz", "wrap", "fajita", "tostada", "biscote", "avena", "copos", "cereal", "crema de arroz", "arroz", "pasta", "espagueti", "macarron", "fideo", "quinoa", "cuscus", "harina", "galleta", "tortita"])
  },
  { aisle: "fruta_verdura", re: phraseRe(["judia verde", "judias verde"]) },
  {
    aisle: "legumbres_despensa",
    re: phraseRe(["lenteja", "garbanzo", "alubia", "judia", "frijol", "soja", "edamame", "almendra", "nuez", "nuec", "avellana", "anacardo", "cacahuete", "pistacho", "pipa", "semilla", "chia", "lino", "sesamo", "miel", "mermelada", "cacao", "chocolate", "azucar", "proteina", "whey", "datil", "pasa", "orejon", "aceituna", "crema de cacahuete"])
  },
  {
    aisle: "pescado",
    re: phraseRe(["pescado", "salmon", "atun", "bacalao", "merluza", "lubina", "dorada", "caballa", "sardina", "boqueron", "anchoa", "trucha", "rape", "emperador", "pez espada", "lenguado", "gallo", "langostino", "gamba", "mejillon", "almeja", "calamar", "sepia", "pulpo", "marisco"])
  },
  {
    aisle: "carne",
    re: phraseRe(["carne", "pollo", "pavo", "ternera", "cerdo", "lomo", "solomillo", "cordero", "conejo", "jamon", "hamburguesa", "filete", "muslo", "contramuslo", "pechuga", "chuleta", "costilla", "buey", "vacuno", "picada", "secreto", "presa"])
  },
  {
    aisle: "fruta_verdura",
    re: phraseRe([
      "fruta", "verdura", "hortaliza", "ensalada", "tomate", "lechuga", "cebolla", "cebolleta", "ajo", "pimiento", "calabacin", "calabaza", "berenjena", "zanahoria",
      "brocoli", "coliflor", "col", "repollo", "lombarda", "espinaca", "acelga", "esparrago", "champinon", "seta", "pepino", "puerro", "apio", "rucula", "canonigo",
      "remolacha", "patata", "boniato", "batata", "aguacate", "perejil", "albahaca", "cilantro", "hierbabuena", "jengibre", "guisante", "maiz", "alcachofa",
      "platano", "manzana", "pera", "naranja", "mandarina", "limon", "lima", "kiwi", "fresa", "frambuesa", "arandano", "mora", "uva", "melon", "sandia", "pina",
      "mango", "papaya", "melocoton", "nectarina", "cereza", "ciruela", "higo", "granada", "zumo"
    ])
  }
];

/** Básicos que casi siempre hay en casa: van sin cantidad en «Despensa: revisa que tengas». */
const STAPLE_RE = phraseRe([
  "aceite", "sal", "pimienta", "curry", "curcuma", "comino", "oregano", "pimenton", "canela", "vinagre", "especia", "levadura", "bicarbonato",
  "laurel", "tomillo", "romero", "nuez moscada", "ajo en polvo", "edulcorante", "caldo"
]);

/** Sección por defecto deducida del nombre (para alimentos sin `foods.aisle`). */
export function aisleForName(name: string): AisleKey {
  const n = normalizeFoodText(name);
  if (!n) return "otros";
  for (const r of AISLE_RULES) if (r.re.test(n)) return r.aisle;
  return "otros";
}

/** ¿Básico de despensa por nombre? «Aceite de oliva», «Pimienta negra» sí; «Atún en aceite» no. */
export function isStapleName(name: string) {
  const n = normalizeFoodText(name);
  if (!n || /(?:^| )en aceite(?= |$)/.test(n)) return false;
  return STAPLE_RE.test(n);
}

/**
 * `foods.aisle` escrito a mano → su clave: el nombre exacto («Fruta y verdura»), la clave («fruta_verdura»)
 * o una de sus palabras («lácteos», «verdura», «despensa»). null si está vacío o no se reconoce (mandan las reglas).
 */
export function aisleFromColumn(aisle: string | null | undefined): AisleKey | null {
  const n = normalizeFoodText((aisle ?? "").replace(/_/g, " "));
  if (!n) return null;
  const words = n.split(" ").filter((w) => w.length > 2);
  for (const a of AISLES) {
    const label = normalizeFoodText(a.label);
    if (label === n || a.key.replace(/_/g, " ") === n) return a.key;
  }
  for (const a of AISLES) {
    const labelWords = normalizeFoodText(a.label).split(" ");
    if (words.some((w) => labelWords.includes(w))) return a.key;
  }
  return null;
}

// —— Unidades de compra ——

/**
 * Unidad de compra por defecto para los alimentos que se compran por pieza, mientras `foods.unit_name/unit_g`
 * estén vacíos. Pesos medios de una pieza (crudo, con piel).
 */
const DEFAULT_UNITS: { re: RegExp; name: string; grams: number }[] = [
  { re: phraseRe(["huevo"]), name: "huevo", grams: 60 },
  { re: phraseRe(["platano"]), name: "plátano", grams: 120 },
  { re: phraseRe(["manzana"]), name: "manzana", grams: 180 },
  { re: phraseRe(["pera"]), name: "pera", grams: 180 },
  { re: phraseRe(["naranja"]), name: "naranja", grams: 200 },
  { re: phraseRe(["kiwi"]), name: "kiwi", grams: 80 },
  { re: phraseRe(["aguacate"]), name: "aguacate", grams: 200 },
  { re: phraseRe(["tortilla de trigo", "tortilla de maiz", "wrap", "fajita"]), name: "tortilla", grams: 40 },
  { re: phraseRe(["yogur"]), name: "yogur", grams: 125 }
];

function defaultUnit(name: string) {
  const n = normalizeFoodText(name);
  // «Zumo de naranja», «yogur de plátano»: la pieza solo cuenta si el alimento empieza por ella.
  return DEFAULT_UNITS.find((u) => u.re.test(n) && n.search(u.re) <= 0) ?? null;
}

/** Plural sencillo en español («huevo» → «huevos», «yogur» → «yogures», «paquete» → «paquetes»). */
function plural(word: string, n: number) {
  if (n === 1 || /s$/i.test(word)) return word;
  return /[aeiouáéíóú]$/i.test(word) ? `${word}s` : `${word}es`;
}

/** Piezas a comprar: hacia arriba, con una décima de pieza de holgura (6,05 huevos → 6, no 7). */
export function unitsToBuy(grams: number, unitG: number) {
  return Math.max(1, Math.ceil(grams / unitG - 0.1));
}

/** Gramos de compra: hacia arriba al múltiplo de 50 g (100 g en carne y pescado), nunca menos de un paso. */
export function roundBuyGrams(grams: number, step: 50 | 100) {
  return Math.max(step, Math.ceil(grams / step) * step);
}

/** «350 g», «1 kg», «1,25 kg». */
export function formatGrams(g: number) {
  if (g < 1000) return `${g} g`;
  return `${(g / 1000).toLocaleString("es-ES", { maximumFractionDigits: 2 })} kg`;
}

export type FoodBuyInfo = {
  unitName: string | null;
  unitG: number | null;
  packG: number | null;
};

/**
 * Cantidad de compra de `grams` de un alimento: piezas si tiene unidad («6 huevos»), si no gramos redondeados;
 * con `packG`, además cuántos paquetes («2 paquetes de 500 g»).
 */
export function buyAmount(grams: number | null, name: string, aisle: ShoppingSectionKey, food: FoodBuyInfo): { amount: string | null; packs: string | null } {
  if (grams == null || !Number.isFinite(grams) || grams <= 0) return { amount: null, packs: null };
  const unit = food.unitName && food.unitG && food.unitG > 0 ? { name: food.unitName, grams: food.unitG } : defaultUnit(name);
  let amount: string;
  if (unit) {
    const n = unitsToBuy(grams, unit.grams);
    amount = `${n} ${plural(unit.name, n)}`;
  } else {
    amount = formatGrams(roundBuyGrams(grams, aisle === "carne" || aisle === "pescado" ? 100 : 50));
  }
  let packs: string | null = null;
  if (food.packG && food.packG > 0) {
    const p = unitsToBuy(grams, food.packG);
    packs = `${p} ${plural("paquete", p)} de ${formatGrams(Math.round(food.packG))}`;
  }
  return { amount, packs };
}

// —— Lista ——

/** Un ingrediente confirmado del menú (una fila de `meal_items` con su alimento, si lo tiene). */
export type ShoppingInput = {
  foodId: string | null;
  rawText: string;
  grams: number | null;
  mealSlotId: string;
  food: {
    name: string;
    aisle: string | null;
    unitName: string | null;
    unitG: number | null;
    packG: number | null;
    staple: boolean;
  } | null;
};

export type ShoppingLine = {
  /** Clave de «ya lo tengo» (`shopping_checks.food_key`): id del alimento o texto normalizado. */
  key: string;
  name: string;
  /** Cantidad de compra («6 huevos», «700 g»); null en despensa o si ningún plato trae gramos. */
  amount: string | null;
  /** «2 paquetes de 500 g» si el alimento tiene `pack_g`. */
  packs: string | null;
  /** Gramos sumados sin redondear (para comprobar a mano). */
  grams: number | null;
  /** Platos distintos en los que aparece. */
  dishes: number;
  checked: boolean;
};

export type ShoppingSection = { key: ShoppingSectionKey; label: string; lines: ShoppingLine[] };

export type ShoppingList = { sections: ShoppingSection[]; total: number; checked: number };

/** Clave estable de una línea: el alimento si existe, si no el texto normalizado (≤200, como pide la tabla). */
export function shoppingKey(input: Pick<ShoppingInput, "foodId" | "rawText">) {
  if (input.foodId) return input.foodId;
  return normalizeFoodText(input.rawText).slice(0, 200) || "sin nombre";
}

function capitalize(s: string) {
  const t = s.trim().replace(/\s+/g, " ");
  return t ? t.charAt(0).toLocaleUpperCase("es") + t.slice(1) : t;
}

/** Sección de un ingrediente: despensa si es básico, su pasillo (columna o reglas) si tiene alimento, «revisar» si no. */
export function sectionFor(input: ShoppingInput): ShoppingSectionKey {
  if (input.food) {
    const fromColumn = aisleFromColumn(input.food.aisle);
    // Con pasillo puesto a mano, manda `foods.staple`; sin configurar, se deduce por nombre.
    if (fromColumn) return input.food.staple ? "despensa" : fromColumn;
    if (input.food.staple || isStapleName(input.food.name)) return "despensa";
    return aisleForName(input.food.name);
  }
  return isStapleName(input.rawText) ? "despensa" : "revisar";
}

/**
 * Suma por alimento entre todos los platos del rango y agrupa por sección. Una línea sin gramos en un plato
 * no anula los gramos de los demás: se suma lo que hay.
 */
export function buildShoppingList(inputs: ShoppingInput[], checkedKeys: Iterable<string> = []): ShoppingList {
  const checked = new Set(checkedKeys);
  type Acc = { key: string; name: string; section: ShoppingSectionKey; grams: number | null; dishes: Set<string>; food: FoodBuyInfo };
  const acc = new Map<string, Acc>();

  for (const it of inputs) {
    const name = capitalize(it.food?.name ?? it.rawText);
    if (!name) continue;
    const key = shoppingKey(it);
    const grams = it.grams != null && Number.isFinite(it.grams) && it.grams > 0 ? it.grams : null;
    const prev = acc.get(key);
    if (prev) {
      if (grams != null) prev.grams = (prev.grams ?? 0) + grams;
      prev.dishes.add(it.mealSlotId);
      continue;
    }
    acc.set(key, {
      key,
      name,
      section: sectionFor(it),
      grams,
      dishes: new Set([it.mealSlotId]),
      food: { unitName: it.food?.unitName ?? null, unitG: it.food?.unitG ?? null, packG: it.food?.packG ?? null }
    });
  }

  const bySection = new Map<ShoppingSectionKey, ShoppingLine[]>();
  for (const a of acc.values()) {
    const buy = a.section === "despensa" ? { amount: null, packs: null } : buyAmount(a.grams, a.name, a.section, a.food);
    const lines = bySection.get(a.section) ?? [];
    bySection.set(a.section, lines);
    lines.push({
      key: a.key,
      name: a.name,
      amount: buy.amount,
      packs: buy.packs,
      grams: a.grams == null ? null : Math.round(a.grams * 10) / 10,
      dishes: a.dishes.size,
      checked: checked.has(a.key)
    });
  }

  const sections = SECTION_ORDER.flatMap((key) => {
    const lines = bySection.get(key);
    if (!lines?.length) return [];
    lines.sort((x, y) => x.name.localeCompare(y.name, "es"));
    return [{ key, label: SECTION_LABELS[key], lines }];
  });
  const all = sections.flatMap((s) => s.lines);
  return { sections, total: all.length, checked: all.filter((l) => l.checked).length };
}

// —— Rango ——

export type ShoppingRangeKind = "week" | "3d";

export type ShoppingRange = {
  kind: ShoppingRangeKind;
  from: string;
  to: string;
  /** Semana a la que van las marcas de «ya lo tengo» (`shopping_checks.week_start`): lunes del primer día. */
  weekStart: string;
};

/** «Semana»: lunes a domingo de la semana de `anchor`. «3 días»: `anchor` y los dos siguientes. */
export function shoppingRange(kind: ShoppingRangeKind, anchor: string): ShoppingRange {
  if (kind === "week") {
    const monday = startOfWeekMonday(anchor);
    return { kind, from: monday, to: dateKey(addDays(parseDateLocal(monday), 6)), weekStart: monday };
  }
  return { kind, from: anchor, to: dateKey(addDays(parseDateLocal(anchor), 2)), weekStart: startOfWeekMonday(anchor) };
}

const MONTH_SHORT = MONTHS_ES.map((m) => m.slice(0, 3).toLocaleLowerCase("es"));

/** «17 – 23 nov», «28 nov – 4 dic», «29 dic 2025 – 4 ene 2026». */
export function shoppingRangeLabel(from: string, to: string) {
  const a = parseDateLocal(from);
  const b = parseDateLocal(to);
  if (a.getFullYear() !== b.getFullYear()) {
    return `${a.getDate()} ${MONTH_SHORT[a.getMonth()]} ${a.getFullYear()} – ${b.getDate()} ${MONTH_SHORT[b.getMonth()]} ${b.getFullYear()}`;
  }
  if (a.getMonth() !== b.getMonth()) return `${a.getDate()} ${MONTH_SHORT[a.getMonth()]} – ${b.getDate()} ${MONTH_SHORT[b.getMonth()]}`;
  return `${a.getDate()} – ${b.getDate()} ${MONTH_SHORT[b.getMonth()]}`;
}

// —— Compartir ——

/**
 * Texto para WhatsApp/notas: por sección, solo lo que falta (sin lo marcado como «ya lo tengo»).
 * La despensa va en una línea para revisar de un vistazo.
 */
export function shoppingText(list: ShoppingList, rangeLabel: string) {
  const out: string[] = [`Lista de la compra · ${rangeLabel}`];
  for (const s of list.sections) {
    const pending = s.lines.filter((l) => !l.checked);
    if (!pending.length) continue;
    out.push("");
    if (s.key === "despensa") {
      out.push(s.label);
      out.push(pending.map((l) => l.name).join(", "));
      continue;
    }
    out.push(s.label);
    for (const l of pending) {
      const qty = [l.amount, l.packs].filter(Boolean).join(" · ");
      out.push(qty ? `• ${l.name}: ${qty}` : `• ${l.name}`);
    }
  }
  if (out.length === 1) out.push("", "Ya tienes todo en casa.");
  return out.join("\n");
}
