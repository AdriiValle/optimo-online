import fs from "fs";
import { importableWeeks, mealsFromImportWeeks, parseWordMenuTables } from "../lib/menu-import/parse-word-menu";

async function main() {
  const buf = fs.readFileSync("C:/Users/SISTELIN/Downloads/EJEMPLO DE MENU.docx");
  const blocks = await parseWordMenuTables(buf);
  const weeks = importableWeeks(blocks);
  console.log("blocks", blocks.length, "importable", weeks.length);
  blocks.forEach((b, i) => console.log(` block ${i + 1}: template=${b.isTemplate} slots=${b.slots.length}`));

  const weekStart = "2025-11-03";
  const rows = mealsFromImportWeeks(weeks, weekStart);
  console.log("rows", rows.length);
  const monday = rows.filter((r) => r.date === weekStart);
  console.log("Monday lunch:", monday.find((r) => r.slot === "lunch")?.title);
  console.log("Monday dinner:", monday.find((r) => r.slot === "dinner")?.title);
}

void main();
