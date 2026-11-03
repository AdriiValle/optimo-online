import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Wiki ejercicios (solo lectura en sync local; Vercel no monta G:). */
export const DEFAULT_KNOWLEDGE_EJERCICIOS = resolve(
  "G:",
  "Mi unidad",
  "Óptimo Sport",
  "ÓPTIMO_KNOWLEDGE_BASE",
  "01_WIKI_OBSIDIAN",
  "ejercicios"
);

export function knowledgeEjerciciosDir(): string {
  return process.env.OPTIMO_KNOWLEDGE_EJERCICIOS?.trim() || DEFAULT_KNOWLEDGE_EJERCICIOS;
}

export function readEjercicioMarkdown(slug: string): string | null {
  const file = resolve(knowledgeEjerciciosDir(), `${slug}.md`);
  if (!existsSync(file)) return null;
  return readFileSync(file, "utf8");
}

/** Contenido de `## Descripción` hasta el siguiente `##` de nivel 2. */
export function extractDescripcionSection(md: string): string {
  const lines = md.split(/\r?\n/);
  let i = lines.findIndex((l) => /^## Descripción\s*$/.test(l));
  if (i < 0) return "";
  i += 1;
  const out: string[] = [];
  for (; i < lines.length; i += 1) {
    if (/^## /.test(lines[i]!)) break;
    if (/^### /.test(lines[i]!)) break;
    out.push(lines[i]!);
  }
  return out.join("\n").trim();
}

function stripWikiAndMd(text: string): string {
  let s = text
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  s = s
    .replace(/\bpesa-libre\b/gi, "mancuernas")
    .replace(/\belastico\b/gi, "elástico")
    .replace(/\bcajon\b/gi, "cajón")
    .replace(/\btriple-extension\b/gi, "triple extensión")
    .replace(/\btrx\b/gi, "TRX")
    .replace(/,\s*con mancuernas \(mancuernas\)/gi, " con mancuernas")
    .replace(/\(\s*mancuernas\s*\)/gi, "");
  return s;
}

/** Comprime la descripción wiki (~280–400 caracteres) sin añadir clínica nueva. */
export function blurbFromDescripcion(raw: string): string {
  const plain = stripWikiAndMd(raw);
  if (!plain) return "";

  const allSentences = plain.split(/(?<=[.!?])\s+/).filter(Boolean);
  const skipRe =
    /^(Distinto de|No confundir|Hermana de|Misma familia|Tampoco es|Variante con|### |En el vídeo|Carga no dictada|Convención lado|Cómo se sujeta|El dictado no)/i;
  const sentences = allSentences.filter((s) => s && !skipRe.test(s) && !/: no especificado\.?$/i.test(s));
  let out = "";
  for (const s of sentences) {
    const next = out ? `${out} ${s}` : s;
    if (next.length > 400 && out) break;
    out = next;
    if (out.length >= 280) break;
  }
  if (out.length < 200) {
    for (const s of allSentences) {
      if (!s || out.includes(s.slice(0, 24))) continue;
      if (skipRe.test(s)) continue;
      const next = out ? `${out} ${s}` : s;
      if (next.length > 400) break;
      out = next;
      if (out.length >= 200) break;
    }
  }
  if (!out) {
    out = sentences[0] ?? plain.slice(0, 400).trim();
  }
  if (out.length > 400) {
    const cut = out.slice(0, 397);
    const last = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(" "));
    out = (last > 200 ? cut.slice(0, last) : cut).trim();
    if (!out.endsWith(".")) out += "…";
  }
  return out;
}

export function blurbForSlug(slug: string): string | null {
  const md = readEjercicioMarkdown(slug);
  if (!md) return null;
  const desc = extractDescripcionSection(md);
  if (!desc) return null;
  const blurb = blurbFromDescripcion(desc);
  return blurb || null;
}
