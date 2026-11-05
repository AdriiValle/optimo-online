/** Texto visible del plato importado desde Word (proteína + detalle). */
export function formatImportedMeal(protein: string, dishText: string): { title: string; preparation: string | null } {
  const prot = protein.replace(/\s+/g, " ").trim();
  const dish = dishText.replace(/\s+/g, " ").trim();
  const full = prot ? `[${prot}] ${dish}` : dish;
  if (full.length <= 200) {
    return { title: full, preparation: null };
  }
  return { title: full.slice(0, 200).trim(), preparation: full };
}
