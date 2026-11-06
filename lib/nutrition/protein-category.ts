export type ProteinCategoryKey = "carne" | "pescado" | "huevos" | "legumbres" | "none";

export type SplitCategory = {
  key: ProteinCategoryKey;
  /** Texto del corchete tal cual (`HUEVOS/PESCADO`), o null si no venía. */
  label: string | null;
  /** Plato sin el corchete. */
  body: string;
};

const CATEGORY_RE = /^\[([^\]]*)\]\s*/;

function categoryKey(label: string): ProteinCategoryKey {
  // Mixta («HUEVOS/PESCADO»): manda la primera.
  const first = label
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .split("/")[0]
    .trim();
  if (first.startsWith("carne")) return "carne";
  if (first.startsWith("pescado")) return "pescado";
  if (first.startsWith("huevo")) return "huevos";
  if (first.startsWith("legumbre") || first.includes("vegetal")) return "legumbres";
  return "none";
}

/** `[CARNE] Ensalada · Muslos · Arroz` → categoría + plato sin corchete (etiqueta del import Word). */
export function splitCategory(title: string): SplitCategory {
  let body = title.replace(/\s+/g, " ").trim();
  let label: string | null = null;
  const cat = CATEGORY_RE.exec(body);
  if (cat) {
    label = cat[1].trim() || null;
    body = body.slice(cat[0].length);
  }
  return { key: label ? categoryKey(label) : "none", label, body };
}

/** Quita el «con» colgante que deja el Word al partir líneas. */
function trimDangling(line: string) {
  return line.replace(/\s+con$/i, "").trim();
}

/**
 * Plato de 3 líneas (verdura · proteína · hidrato) → la proteína como titular y el resto debajo.
 * Cualquier otra forma: titular = todo.
 */
export function dishLines(body: string): { headline: string; rest: string | null } {
  const lines = body
    .split(/\s+·\s+/)
    .map((l) => trimDangling(l))
    .filter(Boolean);
  if (lines.length === 3) return { headline: lines[1], rest: `${lines[0]} · ${lines[2]}` };
  return { headline: trimDangling(body), rest: null };
}
