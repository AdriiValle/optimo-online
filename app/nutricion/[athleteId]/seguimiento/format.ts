import { MONTHS_ES, DOW_SHORT, parseDateLocal } from "@/lib/dates";

const MON = MONTHS_ES.map((m) => m.slice(0, 3).toLowerCase());

/** «11 nov»; con `year`, «11 nov 2026». */
export function shortDate(iso: string, year = false) {
  const d = parseDateLocal(iso);
  return `${d.getDate()} ${MON[d.getMonth()]}${year ? ` ${d.getFullYear()}` : ""}`;
}

/** «mar 11 nov». */
export function dayDate(iso: string) {
  const d = parseDateLocal(iso);
  return `${DOW_SHORT[d.getDay()]} ${shortDate(iso)}`;
}

/** Cifras en español, como mucho un decimal: «72,4». */
export function fmtNum(v: number, digits = 1) {
  return v.toLocaleString("es-ES", { maximumFractionDigits: digits });
}

/** «85 %» (con espacio, como se escribe en español). */
export function fmtPct(score: number) {
  return `${Math.round(score * 100)} %`;
}
