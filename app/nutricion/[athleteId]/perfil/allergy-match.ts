import { foodTokens } from "@/lib/nutrition/parse-dish";

/**
 * Emparejado de alergias e intolerancias con ingredientes (funciones puras: servidor y navegador).
 * Una alergia casa con un texto cuando sus palabras aparecen seguidas en él, con la misma raíz que usa
 * el emparejado de alimentos (sin acentos, plurales ni palabras de preparación: «Huevos» = «huevo»).
 * Los grupos habituales (los 14 alérgenos de la UE y sus nombres de uso) se amplían a sus alimentos:
 * «Lácteos» avisa con «queso» o «yogur»; «Gluten» con «pan» o «pasta».
 */

export type AllergyKind = "allergy" | "intolerance";

/** Palabra o expresión que delata un grupo; `notNext` = palabras que, justo detrás, la anulan («leche de coco»). */
type Keyword = { text: string; notNext?: string[] };

const PLANT_MILK = ["coco", "avena", "almendra", "almendras", "soja", "arroz", "vegetal", "cacahuete", "anacardo"];

const DAIRY: Keyword[] = [
  { text: "leche", notNext: PLANT_MILK },
  { text: "lácteo" },
  { text: "queso" },
  { text: "yogur" },
  { text: "yogurt" },
  { text: "nata" },
  { text: "mantequilla", notNext: PLANT_MILK },
  { text: "kéfir" },
  { text: "requesón" },
  { text: "cuajada" },
  { text: "natillas" },
  { text: "flan" },
  { text: "helado" },
  { text: "bechamel" },
  { text: "mozzarella" },
  { text: "parmesano" },
  { text: "ricotta" },
  { text: "skyr" },
  { text: "whey" },
  { text: "suero de leche" },
  { text: "proteína de suero" }
];

const GLUTEN: Keyword[] = [
  "trigo", "gluten", "pan", "pasta", "espagueti", "espaguetis", "macarrón", "fideo", "harina", "cebada", "centeno",
  "espelta", "avena", "cuscús", "bulgur", "seitán", "galleta", "tostada", "biscote", "pizza", "rebozado", "empanado",
  "bizcocho", "croissant", "magdalena", "sémola", "lasaña", "tortita de trigo", "wrap"
].map((text) => ({ text }));

const FISH: Keyword[] = [
  "pescado", "merluza", "salmón", "atún", "bacalao", "dorada", "lubina", "sardina", "boquerón", "anchoa", "caballa",
  "rape", "lenguado", "emperador", "pez espada", "trucha", "bonito", "gallo", "panga", "tilapia", "rodaballo", "corvina"
].map((text) => ({ text }));

const CRUSTACEANS: Keyword[] = [
  "crustáceo", "gamba", "langostino", "cangrejo", "bogavante", "langosta", "cigala", "carabinero", "centolla",
  "nécora", "surimi", "quisquilla"
].map((text) => ({ text }));

const MOLLUSCS: Keyword[] = [
  "molusco", "mejillón", "almeja", "berberecho", "calamar", "sepia", "pulpo", "chipirón", "vieira", "ostra", "navaja",
  "caracol", "zamburiña"
].map((text) => ({ text }));

const TREE_NUTS: Keyword[] = [
  "fruto seco", "almendra", "nuez", "nueces", "avellana", "anacardo", "pistacho", "macadamia", "pecana", "nuez de brasil"
].map((text) => ({ text }));

const PEANUT: Keyword[] = ["cacahuete", "maní", "crema de cacahuete"].map((text) => ({ text }));

const EGG: Keyword[] = ["huevo", "clara", "yema", "tortilla", "mayonesa", "merengue"].map((text) => ({ text }));

const SOY: Keyword[] = ["soja", "tofu", "tempeh", "edamame", "miso"].map((text) => ({ text }));

const SESAME: Keyword[] = ["sésamo", "tahini", "tahín", "hummus"].map((text) => ({ text }));

/** Nombre del grupo (como lo escribiría Amanda) → palabras que lo delatan. */
const GROUPS: [string[], Keyword[]][] = [
  [["lácteos", "lácteo", "leche", "lactosa", "proteína de leche", "proteína de la leche", "PLV", "APLV"], DAIRY],
  [["gluten", "celiaquía", "celíaco", "trigo", "cereales con gluten"], GLUTEN],
  [["pescado", "pescados"], FISH],
  [["crustáceos", "crustáceo"], CRUSTACEANS],
  [["moluscos", "molusco"], MOLLUSCS],
  [["marisco", "mariscos"], [...CRUSTACEANS, ...MOLLUSCS, { text: "marisco" }]],
  [["frutos de cáscara", "frutos secos", "fruto seco"], [...TREE_NUTS, ...PEANUT]],
  [["cacahuete", "cacahuetes", "maní"], PEANUT],
  [["huevo", "huevos"], EGG],
  [["soja"], SOY],
  [["sésamo"], SESAME],
  [["apio"], [{ text: "apio" }]],
  [["mostaza"], [{ text: "mostaza" }]],
  [["altramuces", "altramuz"], [{ text: "altramuz" }, { text: "altramuces" }]],
  [["sulfitos", "sulfito"], ["vino", "vinagre", "pasas", "orejón", "sulfito"].map((text) => ({ text }))]
];

/** Sugerencias para las listas del perfil (orden de la ficha de alérgenos de la UE). */
export const ALLERGY_SUGGESTIONS = [
  "Gluten",
  "Lácteos",
  "Huevo",
  "Pescado",
  "Marisco",
  "Frutos de cáscara",
  "Cacahuete",
  "Soja",
  "Sésamo",
  "Apio",
  "Mostaza",
  "Sulfitos",
  "Altramuces"
];
export const INTOLERANCE_SUGGESTIONS = ["Lactosa", "Gluten", "Fructosa", "Sorbitol", "Histamina", "Huevo"];

type Needle = { tokens: string[]; notNext: Set<string> };

const key = (s: string) => foodTokens(s).join(" ");
const groupIndex = new Map<string, Keyword[]>();
for (const [names, words] of GROUPS) for (const n of names) groupIndex.set(key(n), words);

function needlesFor(term: string): Needle[] {
  const own = foodTokens(term);
  const words = groupIndex.get(own.join(" ")) ?? [];
  const out: Needle[] = own.length ? [{ tokens: own, notNext: new Set() }] : [];
  for (const w of words) {
    const tokens = foodTokens(w.text);
    if (tokens.length) out.push({ tokens, notNext: new Set((w.notNext ?? []).flatMap(foodTokens)) });
  }
  return out;
}

function contains(hay: string[], n: Needle) {
  outer: for (let i = 0; i + n.tokens.length <= hay.length; i++) {
    for (let j = 0; j < n.tokens.length; j++) if (hay[i + j] !== n.tokens[j]) continue outer;
    const next = hay[i + n.tokens.length];
    if (next && n.notNext.has(next)) continue;
    return true;
  }
  return false;
}

export type AllergyTerm = { term: string; kind: AllergyKind };

/** Prepara el emparejador para las alergias e intolerancias del deportista. */
export function allergyMatcher(terms: AllergyTerm[]) {
  const prepared = terms.map((t) => ({ ...t, needles: needlesFor(t.term) })).filter((t) => t.needles.length);
  /** Alergias/intolerancias que casan con alguno de los textos (nombre del alimento, alias, texto del plato). */
  return (texts: string[]): AllergyTerm[] => {
    const hays = texts.map(foodTokens).filter((h) => h.length);
    return prepared
      .filter((t) => t.needles.some((n) => hays.some((h) => contains(h, n))))
      .map(({ term, kind }) => ({ term, kind }));
  };
}

/** Lista de términos del perfil a `AllergyTerm[]` (alergias primero: mandan sobre la intolerancia). */
export function profileTerms(allergies: string[], intolerances: string[]): AllergyTerm[] {
  const seen = new Set<string>();
  const out: AllergyTerm[] = [];
  for (const [list, kind] of [
    [allergies, "allergy"],
    [intolerances, "intolerance"]
  ] as const) {
    for (const term of list) {
      const k = key(term) || term.trim().toLowerCase();
      if (!term.trim() || seen.has(`${kind}:${k}`)) continue;
      seen.add(`${kind}:${k}`);
      out.push({ term: term.trim(), kind });
    }
  }
  return out;
}

/** Alimento del catálogo que casa con una alergia (por su nombre o por cualquiera de sus alias). */
export type AllergenFood = { foodId: string; term: string; kind: AllergyKind };

export function allergenFoods(
  foods: { id: string; name_es: string; aliases: string[] }[],
  terms: AllergyTerm[]
): AllergenFood[] {
  if (!terms.length) return [];
  const match = allergyMatcher(terms);
  return foods.flatMap((f) => match([f.name_es, ...f.aliases]).map((t) => ({ foodId: f.id, ...t })));
}
