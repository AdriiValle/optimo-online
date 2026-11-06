import fs from "fs";
import path from "path";
import { formatImportedMeal } from "../lib/menu-import/format-meal";
import { FOOD_CATALOG } from "../lib/nutrition/food-catalog";
import { parseDish } from "../lib/nutrition/parse-dish";

/**
 * Pasa el parser de platos sobre `workflow/inbox/EJEMPLO DE MENU.md` (export del Word).
 * En el .md las líneas de cada celda van separadas por doble espacio; se convierten a ` · `
 * como hace el import Word, y se monta el mismo texto `[CATEGORÍA] …` que guarda `meal_slots`.
 */
const MIN_MATCH = 0.9;
const file = process.argv[2] ?? path.join(__dirname, "..", "workflow", "inbox", "EJEMPLO DE MENU.md");

function cells(row: string) {
  return row.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.replace(/\*\*/g, "").trim());
}

function isTemplateDish(text: string) {
  return /ensalada \/ verdura/i.test(text) && /hidrato/i.test(text);
}

const rows = fs.readFileSync(file, "utf8").split(/\r?\n/).filter((l) => l.trim().startsWith("|"));
const dishes = new Set<string>();
for (let i = 0; i < rows.length - 1; i++) {
  const head = cells(rows[i]);
  if (!/^(ALMUERZO|CENA)$/i.test(head[0])) continue;
  const proteins = head.slice(1);
  const dishCells = cells(rows[i + 1]);
  dishCells.forEach((raw, d) => {
    if (!raw || isTemplateDish(raw)) return;
    const dish = raw.split(/\s{2,}/).join(" · ");
    const { title, preparation } = formatImportedMeal(proteins[d] ?? "", dish);
    dishes.add(preparation ?? title);
  });
}

const byId = new Map(FOOD_CATALOG.map((f) => [f.id, f.name_es]));
let total = 0;
let matched = 0;
const unmatched: string[] = [];
for (const text of dishes) {
  const { items } = parseDish(text, FOOD_CATALOG);
  console.log(`\n${text}`);
  for (const it of items) {
    total++;
    if (it.food_id) {
      matched++;
      console.log(`  ✓ ${it.role.padEnd(7)} ${byId.get(it.food_id)}  ← ${it.raw_text}`);
    } else {
      unmatched.push(it.raw_text);
      console.log(`  ✗ ${it.role.padEnd(7)} ${it.raw_text}`);
    }
  }
}

const pct = total ? matched / total : 0;
console.log(`\nPlatos: ${dishes.size} · líneas: ${total} · casadas: ${matched} (${(pct * 100).toFixed(1)} %)`);
if (unmatched.length) console.log(`No casadas: ${[...new Set(unmatched)].join(" | ")}`);
process.exitCode = pct >= MIN_MATCH ? 0 : 1;
