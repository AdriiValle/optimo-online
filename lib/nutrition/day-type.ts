export type DayType = "rest" | "training" | "match";

/** Tipo de día para las raciones: MD → partido; MD±n o entreno → entreno; libre / sin plan → descanso. */
export function dayTypeFromMdTag(mdTag: string | null | undefined): DayType {
  const tag = mdTag?.trim().toUpperCase().replace(/\s+/g, "") ?? "";
  if (tag === "MD") return "match";
  if (/^MD[+-]\d+$/.test(tag) || tag === "ENTRENO") return "training";
  return "rest";
}
