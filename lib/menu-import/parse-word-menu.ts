import mammoth from "mammoth";
import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import { addDays, dateKey, parseDateLocal, startOfWeekMonday } from "@/lib/dates";
import type { MealSlotKind } from "@/lib/types";
import { formatImportedMeal } from "./format-meal";

export type ImportMealSlot = "lunch" | "dinner";

export type ParsedMenuSlot = {
  dayIndex: number;
  slot: ImportMealSlot;
  title: string;
  preparation: string | null;
};

export type ParsedMenuWeek = {
  blockNumber: number | null;
  slots: ParsedMenuSlot[];
  signature: string;
  isTemplate: boolean;
};

const DAY_KEYS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"] as const;

function stripAccents(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "");
}

function normCell(s: string) {
  return stripAccents(s).replace(/\s+/g, " ").trim().toUpperCase();
}

function cellText($: cheerio.CheerioAPI, td: Element): string {
  const parts: string[] = [];
  $(td)
    .find("p")
    .each((_, p) => {
      const t = $(p).text().replace(/\s+/g, " ").trim();
      if (t) parts.push(t);
    });
  if (!parts.length) {
    const t = $(td).text().replace(/\s+/g, " ").trim();
    if (t) parts.push(t);
  }
  return parts.join(" · ");
}

function isTemplateDish(text: string) {
  const n = normCell(text);
  return n.includes("ENSALADA / VERDURA") && n.includes("PROTEINA") && n.includes("HIDRATO");
}

function mealLabelKind(label: string): ImportMealSlot | null {
  const n = normCell(label);
  if (n.includes("ALMUERZO")) return "lunch";
  if (n.includes("CENA")) return "dinner";
  return null;
}

function isDayHeaderRow(cells: string[]) {
  if (cells.length < 8) return false;
  return DAY_KEYS.every((key, i) => normCell(cells[i + 1]).includes(key));
}

function weekSignature(slots: ParsedMenuSlot[]) {
  const ordered = [...slots].sort((a, b) => a.dayIndex - b.dayIndex || a.slot.localeCompare(b.slot));
  return JSON.stringify(ordered.map((s) => [s.dayIndex, s.slot, s.title, s.preparation]));
}

function parseTable($: cheerio.CheerioAPI, table: Element): ParsedMenuWeek | null {
  const rows: string[][] = [];
  $(table)
    .find("tr")
    .each((_, tr) => {
      const cells: string[] = [];
      $(tr)
        .find("td")
        .each((_, td) => {
          cells.push(cellText($, td));
        });
      if (cells.length) rows.push(cells);
    });

  if (!rows.length) return null;

  let blockNumber: number | null = null;
  const slots: ParsedMenuSlot[] = [];
  let templateHits = 0;
  let dishRows = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.length >= 8 && isDayHeaderRow(row)) {
      const n = parseInt(row[0], 10);
      blockNumber = Number.isFinite(n) ? n : blockNumber;
      continue;
    }

    if (row.length >= 8) {
      const kind = mealLabelKind(row[0]);
      if (!kind) continue;
      const proteins = row.slice(1, 8);
      const dishRow = rows[i + 1];
      if (!dishRow || dishRow.length < 7) continue;
      const dishes = dishRow.length >= 8 ? dishRow.slice(1, 8) : dishRow.slice(0, 7);
      for (let d = 0; d < 7; d++) {
        const dishText = dishes[d] ?? "";
        if (isTemplateDish(dishText)) templateHits++;
        dishRows++;
        const { title, preparation } = formatImportedMeal(proteins[d] ?? "", dishText);
        if (!title.trim()) continue;
        slots.push({ dayIndex: d, slot: kind, title, preparation });
      }
      i++;
    }
  }

  if (!slots.length) return null;
  const isTemplate = dishRows > 0 && templateHits === dishRows;
  return {
    blockNumber,
    slots,
    signature: weekSignature(slots),
    isTemplate
  };
}

export async function parseWordMenuTables(buffer: Buffer): Promise<ParsedMenuWeek[]> {
  const { value: html } = await mammoth.convertToHtml({ buffer });
  const $ = cheerio.load(html);
  const weeks: ParsedMenuWeek[] = [];
  $("table").each((_, table) => {
    const parsed = parseTable($, table);
    if (parsed) weeks.push(parsed);
  });
  return weeks;
}

/** Bloques con menú real, sin plantillas ni semanas duplicadas (mismo contenido). */
export function importableWeeks(blocks: ParsedMenuWeek[]): ParsedMenuWeek[] {
  const seen = new Set<string>();
  const out: ParsedMenuWeek[] = [];
  for (const block of blocks) {
    if (block.isTemplate) continue;
    if (seen.has(block.signature)) continue;
    seen.add(block.signature);
    out.push(block);
  }
  return out;
}

export function assertWeekStartMonday(iso: string) {
  if (startOfWeekMonday(iso) !== iso) {
    throw new Error("WEEK_START_NOT_MONDAY");
  }
}

export type MealImportRow = {
  date: string;
  slot: ImportMealSlot;
  title: string;
  preparation: string | null;
};

export function mealsFromImportWeeks(weeks: ParsedMenuWeek[], weekStartMonday: string): MealImportRow[] {
  assertWeekStartMonday(weekStartMonday);
  const monday = parseDateLocal(weekStartMonday);
  const rows: MealImportRow[] = [];
  for (let w = 0; w < weeks.length; w++) {
    const base = addDays(monday, w * 7);
    for (const s of weeks[w].slots) {
      rows.push({
        date: dateKey(addDays(base, s.dayIndex)),
        slot: s.slot,
        title: s.title,
        preparation: s.preparation
      });
    }
  }
  return rows;
}

export function isDocxUpload(file: File | { name: string; type: string }) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".docx")) return true;
  return file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}

export function isPdfUpload(file: File | { name: string; type: string }) {
  const name = file.name.toLowerCase();
  return name.endsWith(".pdf") || file.type === "application/pdf";
}

export const MENU_DOCX_MAX_BYTES = 5 * 1024 * 1024;

export type ImportMealSlotKind = Extract<MealSlotKind, "lunch" | "dinner">;
