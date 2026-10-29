export const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
];

export const DOW_ES = ["L", "M", "X", "J", "V", "S", "D"];
export const DOW_SHORT = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
export const DOW_FULL = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function parseDateLocal(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function dateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey() {
  return dateKey(new Date());
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function daysBetween(a: Date, b: Date) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
}

export function formatLongDate(d: Date) {
  const dow = DOW_FULL[d.getDay()];
  const mon = MONTHS_ES[d.getMonth()].toLowerCase();
  const dowCap = dow.charAt(0).toUpperCase() + dow.slice(1);
  return `${dowCap} ${d.getDate()} de ${mon} de ${d.getFullYear()}`;
}

export function isoDate(value: Date | string) {
  if (typeof value === "string") return value.slice(0, 10);
  return dateKey(value);
}
