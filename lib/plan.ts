import { addDays, dateKey, daysBetween, parseDateLocal } from "@/lib/dates";
import type { ParsedPlan } from "@/lib/html-parse";
import type { DayPlan, DayPlanBlock, HtmlMatch, MatchVenue } from "@/lib/types";

function sortedMatches(matches: HtmlMatch[]) {
  return [...matches].sort((a, b) => a.date.localeCompare(b.date));
}

export function rivalLabel(m: HtmlMatch) {
  return m.venue === "casa" ? m.away : m.home;
}

function mdLabelForDay(daysFromStart: number, daysToEnd: number) {
  if (daysFromStart === 0 || daysToEnd === 0) return "MD";
  if (daysFromStart === 1) return "MD+1";
  if (daysFromStart === 2) return "MD+2";
  if (daysToEnd === 1) return "MD-1";
  if (daysToEnd === 2) return "MD-2";
  if (daysToEnd === 3) return "MD-3";
  if (daysToEnd === 4) return "MD-4";
  if (daysToEnd === 5) return "MD-5";
  return null;
}

export function buildMdMap(matches: HtmlMatch[]) {
  const map: Record<string, string> = {};
  const sorted = sortedMatches(matches);
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const start = parseDateLocal(sorted[i].date);
    const end = parseDateLocal(sorted[i + 1].date);
    for (let d = start; d <= end; d = addDays(d, 1)) {
      const key = dateKey(d);
      const label = mdLabelForDay(daysBetween(start, d), daysBetween(d, end));
      if (label) map[key] = label;
    }
  }
  return map;
}

function buildStrengthDayMap(matches: HtmlMatch[], mdMap: Record<string, string>, strengthFrom: string) {
  const map: Record<string, "anterior" | "posterior"> = {};
  const sorted = sortedMatches(matches);

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const start = parseDateLocal(sorted[i].date);
    const end = parseDateLocal(sorted[i + 1].date);
    const workDays: { key: string; tag: string }[] = [];

    for (let d = addDays(start, 1); d < end; d = addDays(d, 1)) {
      const key = dateKey(d);
      if (key < strengthFrom) continue;
      const tag = mdMap[key];
      if (!tag || tag === "MD" || tag === "MD-1" || tag === "MD+1" || tag === "MD+2") continue;
      workDays.push({ key, tag });
    }
    if (!workDays.length) continue;

    const tags = new Set(workDays.map((w) => w.tag));
    let anteriorTag: string | null = null;
    if (tags.has("MD-5")) anteriorTag = "MD-5";
    else if (tags.has("MD-4")) anteriorTag = "MD-4";
    else if (tags.has("MD-3")) anteriorTag = "MD-3";

    let posteriorTag: string | null = null;
    if (anteriorTag === "MD-5") posteriorTag = "MD-3";
    else if (anteriorTag === "MD-4") posteriorTag = "MD-2";
    else if (anteriorTag === "MD-3") posteriorTag = "MD-1";
    if (posteriorTag === "MD-1") posteriorTag = null;

    const antDay = anteriorTag ? workDays.find((w) => w.tag === anteriorTag) : null;
    const postDay = posteriorTag ? workDays.find((w) => w.tag === posteriorTag) : null;

    if (antDay && postDay && daysBetween(parseDateLocal(antDay.key), parseDateLocal(postDay.key)) === 2) {
      map[antDay.key] = "anterior";
      map[postDay.key] = "posterior";
    } else if (antDay && (anteriorTag === "MD-4" || anteriorTag === "MD-3")) {
      map[antDay.key] = "anterior";
    }
  }
  return map;
}

function buildFieldDayMap(strengthMap: Record<string, "anterior" | "posterior">) {
  const map: Record<string, true> = {};
  for (const key of Object.keys(strengthMap)) {
    if (strengthMap[key] !== "anterior") continue;
    const antDate = parseDateLocal(key);
    const fieldKey = dateKey(addDays(antDate, 1));
    const postKey = dateKey(addDays(antDate, 2));
    if (strengthMap[postKey] === "posterior") map[fieldKey] = true;
  }
  return map;
}

function microcycleHasMd5(matches: HtmlMatch[], mdMap: Record<string, string>, iso: string) {
  const sorted = sortedMatches(matches);
  const d = parseDateLocal(iso);
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const start = parseDateLocal(sorted[i].date);
    const end = parseDateLocal(sorted[i + 1].date);
    if (d <= start || d >= end) continue;
    for (let cur = addDays(start, 1); cur < end; cur = addDays(cur, 1)) {
      if (mdMap[dateKey(cur)] === "MD-5") return true;
    }
    return false;
  }
  return false;
}

function isquioComplementariaForPosterior(md: string, _weekHasMd5: boolean) {
  if (md === "MD-3" || md === "MD-2") return "activacion-complementaria-isquios-2";
  return "activacion-complementaria-isquios-1";
}

function sessionDurationMinutes(
  md: string | null,
  iso: string,
  parsed: ParsedPlan,
  strengthMap: Record<string, "anterior" | "posterior">,
  fieldMap: Record<string, true>
) {
  if (!md || md === "MD" || md === "MD-1" || md === "MD+1") return null;
  const blocks = parsed.mdOnlineBlocks[md];
  if (!blocks) return null;
  const strengthRole = iso >= parsed.strengthFrom ? strengthMap[iso] : null;
  let min = 7;
  let max = 7;
  if (strengthRole === "posterior" || (blocks.specific && blocks.specific.length)) {
    min += 5;
    max += 5;
  }
  if (strengthRole === "anterior") {
    min += 5;
    max += 10;
  } else if (strengthRole === "posterior") {
    min += 5;
    max += 10;
  } else if (blocks.activation && blocks.activation.length) {
    min += 5;
    max += 10;
  }
  if (strengthRole) {
    min += 10;
    max += 10;
  }
  if (md === "MD-2") {
    min += 5;
    max += 5;
  }
  if (iso >= parsed.strengthFrom && fieldMap[iso]) {
    min += 8;
    max += 12;
  }
  return Math.round((min + max) / 2);
}

function pushProtocol(parsed: ParsedPlan, blocks: DayPlanBlock[], protocolId: string) {
  const p = parsed.protocols[protocolId];
  if (!p) return;
  blocks.push({
    kind: "protocol",
    protocolId,
    label: p.label,
    qty: p.qty ?? null,
    info: p.info ?? null,
    video: p.video ?? null
  });
}

function buildBlocks(
  parsed: ParsedPlan,
  iso: string,
  md: string | null,
  match: HtmlMatch | undefined,
  strengthMap: Record<string, "anterior" | "posterior">,
  fieldMap: Record<string, true>
): DayPlanBlock[] {
  const blocks: DayPlanBlock[] = [];
  if (match) {
    const rival = rivalLabel(match);
    const short = parsed.shortNames[rival] || rival;
    const venueText = match.venue === "casa" ? "casa" : "fuera";
    const timeText = match.time ? match.time : "—";
    blocks.push({ kind: "match", text: `Partido · ${short} (${venueText}) · ${timeText}` });
    if (md === "MD") blocks.push({ kind: "note", text: "Sin sesión de gimnasio Óptimo este día." });
  }

  if (md === "MD-1") {
    blocks.push({
      kind: "note",
      text: "Sesión previa al partido con el club (concentrados). Sin entrenamiento Óptimo."
    });
  } else if (md === "MD+1") {
    blocks.push({
      kind: "note",
      text: "Recuperación según minutos del partido; te concretamos la sesión cuando toque."
    });
  } else if (md && parsed.mdOnlineBlocks[md]) {
    const mdBlocks = parsed.mdOnlineBlocks[md];
    const strengthRole = iso >= parsed.strengthFrom ? strengthMap[iso] : null;
    blocks.push({ kind: "section", title: "Base" });
    for (const id of parsed.baseOnline) pushProtocol(parsed, blocks, id);

    if (strengthRole === "posterior") {
      blocks.push({ kind: "section", title: "Específica" });
      pushProtocol(parsed, blocks, "rutina-movilidad-4");
      blocks.push({ kind: "section", title: "Activación" });
      pushProtocol(parsed, blocks, "activacion-basica-isquios-1");
      pushProtocol(parsed, blocks, isquioComplementariaForPosterior(md, microcycleHasMd5(parsed.matches, buildMdMap(parsed.matches), iso)));
      blocks.push({ kind: "section", title: "Fuerza" });
      pushProtocol(parsed, blocks, "fuerza-isquios-bilateral");
      pushProtocol(parsed, blocks, "fuerza-isquios-isometrico-cuna");
      blocks.push({
        kind: "note",
        text: "2 series del bloque: hip thrust sin peso + isométrico de cuña."
      });
      pushProtocol(parsed, blocks, "fuerza-isquios-unilateral");
      pushProtocol(parsed, blocks, "fuerza-isquios-mancuernas-miniband");
      pushProtocol(parsed, blocks, "hip-thrust-barra");
    } else if (strengthRole === "anterior") {
      blocks.push({ kind: "section", title: "Específica" });
      pushProtocol(parsed, blocks, "movilidad-cadera-lumbar-1");
      blocks.push({ kind: "section", title: "Activación" });
      pushProtocol(parsed, blocks, "oso-isometrico");
      pushProtocol(parsed, blocks, "oso-pierna-atras-rodilla-pecho");
      pushProtocol(parsed, blocks, "oso-pierna-extendida-mano-contraria");
      pushProtocol(parsed, blocks, "bicho-muerto-elastico-empeines");
      pushProtocol(parsed, blocks, "caballero-isometrico-rodilla-cerca-suelo");
      pushProtocol(parsed, blocks, "caballero-subida-posicion-a");
      pushProtocol(parsed, blocks, "caballero-tandem");
      blocks.push({ kind: "section", title: "Fuerza" });
      pushProtocol(parsed, blocks, "fuerza-cuadriceps-bilateral");
      pushProtocol(parsed, blocks, "fuerza-cuadriceps-unilateral");
      pushProtocol(parsed, blocks, "fuerza-cuadriceps-salto-cajon");
    } else {
      if (mdBlocks.specific?.length) {
        blocks.push({ kind: "section", title: "Específica" });
        for (const id of mdBlocks.specific) pushProtocol(parsed, blocks, id);
      }
      if (mdBlocks.activation?.length) {
        blocks.push({ kind: "section", title: "Activación" });
        for (const id of mdBlocks.activation) pushProtocol(parsed, blocks, id);
      }
    }

    if (iso >= parsed.strengthFrom && fieldMap[iso]) {
      blocks.push({ kind: "section", title: "Campo" });
      pushProtocol(parsed, blocks, "campo-reloj-arena");
      blocks.push({
        kind: "note",
        text: "Diagonales del campo en progresión hasta ~90% Vmax; el ancho del campo en trote y luego la otra diagonal. 1 serie × 4 progresiones en diagonal. En semanas siguientes subiremos series/reps y cambiaremos ejercicios."
      });
    }

    if (md === "MD-2") {
      blocks.push({ kind: "section", title: "Aceleración" });
      pushProtocol(parsed, blocks, "aceleracion-sled-push");
      blocks.push({
        kind: "note",
        text: "5 m por salida, lo más rápido/fuerte posible (trineo ≥45–50 kg). Más adelante subiremos series y repeticiones y añadiremos pliometría; de momento sin plyo."
      });
    }
  } else if (!match) {
    blocks.push({ kind: "note", text: "Sin bloque asignado para este día." });
  }

  return blocks;
}

export function buildDayPlans(parsed: ParsedPlan): DayPlan[] {
  const mdMap = buildMdMap(parsed.matches);
  const strengthMap = buildStrengthDayMap(parsed.matches, mdMap, parsed.strengthFrom);
  const fieldMap = buildFieldDayMap(strengthMap);
  const byDate: Record<string, HtmlMatch> = {};
  for (const m of parsed.matches) {
    if (!byDate[m.date]) byDate[m.date] = m;
  }

  const dates = new Set([...Object.keys(mdMap), ...Object.keys(byDate)]);
  const plans: DayPlan[] = [];
  for (const iso of [...dates].sort()) {
    const md = mdMap[iso] ?? null;
    const match = byDate[iso];
    const minutes = sessionDurationMinutes(md, iso, parsed, strengthMap, fieldMap);
    const title = match
      ? `Partido · ${parsed.shortNames[rivalLabel(match)] || rivalLabel(match)}`
      : md ?? "Sesión";
    plans.push({
      date: iso,
      mdTag: md,
      title,
      minutes,
      blocks: buildBlocks(parsed, iso, md, match, strengthMap, fieldMap),
      matchOpponent: match ? rivalLabel(match) : null,
      matchVenue: (match?.venue as MatchVenue | undefined) ?? null,
      matchTime: match?.time ?? null,
      matchCompetition: match?.comp ?? null
    });
  }
  return plans;
}

export function loadClassForMdTag(tag: string | null) {
  if (!tag || tag === "MD" || tag === "MD-1") return null;
  const byTag: Record<string, string> = {
    "MD+2": "load-md-plus2",
    "MD-2": "load-md-minus2",
    "MD+1": "load-md-plus1",
    "MD-3": "load-md-minus3",
    "MD-4": "load-md-minus4",
    "MD-5": "load-md-minus5"
  };
  return byTag[tag] ?? null;
}

export const LOAD_TINT_FROM = "2026-10-19";
