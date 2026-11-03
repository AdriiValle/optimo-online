import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseIndexHtml } from "../lib/html-parse";
import { blurbForSlug } from "../lib/knowledge-blurb";
import { setProtocolStringField } from "./protocol-html-field";

// Uso: npm run db:set-videos -- [subidos.csv] [--dry-run]
// Vuelca url (+ blurb desde Knowledge si hay slug) en PROTOCOLS de index.html
// (y plan-visus.html, copia espejo). El id es protocolId; si falta, slug cuando
// slug es una clave de PROTOCOLS; si no, la fila se ignora. Después: npm run db:sync-videos.

const DEFAULT_CSV = resolve(process.cwd(), "..", "..", "YouTube", "subidos", "subidos.csv");
const HTML_FILES = ["index.html", "plan-visus.html"].map((f) => resolve(process.cwd(), f));

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      cell = "";
      if (row.some((v) => v !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((v) => v !== "")) rows.push(row);
  return rows;
}

type RowWanted = { url: string; slug: string };

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const csvPath = resolve(args.find((a) => !a.startsWith("--")) ?? DEFAULT_CSV);
  if (!existsSync(csvPath)) throw new Error(`set-protocol-videos: no existe ${csvPath}`);

  const [header, ...data] = parseCsv(readFileSync(csvPath, "utf8"));
  const col = (name: string) => {
    const i = header?.indexOf(name) ?? -1;
    if (i < 0) throw new Error(`set-protocol-videos: falta la columna ${name} en ${csvPath}`);
    return i;
  };
  const iUrl = col("url");
  const iProtocol = col("protocolId");
  const iSlug = header.indexOf("slug");
  const known = parseIndexHtml().protocols;

  const wanted = new Map<string, RowWanted>();
  for (const r of data) {
    const slug = iSlug >= 0 ? r[iSlug]?.trim() : "";
    const id = r[iProtocol]?.trim() || (slug && known[slug] ? slug : "");
    const url = r[iUrl]?.trim();
    if (id && url) wanted.set(id, { url, slug });
  }
  if (wanted.size === 0) {
    console.log("set-protocol-videos: ninguna fila con protocolId ni slug de PROTOCOLS, nada que hacer");
    return;
  }

  const errors: string[] = [];
  const blurbs: string[] = [];
  for (const [id, { url, slug }] of wanted) {
    if (!known[id]) errors.push(`protocolId desconocido: ${id}`);
    if (!/^https:\/\//.test(url)) errors.push(`url no https para ${id}: ${url}`);
    if (slug) {
      const blurb = blurbForSlug(slug);
      if (blurb) blurbs.push(`${id} ← ${slug}`);
      else errors.push(`sin ## Descripción en Knowledge para slug ${slug} (${id})`);
    }
  }
  if (errors.length) throw new Error(`set-protocol-videos: ${errors.join("; ")} (no se escribió nada)`);

  const outputs = HTML_FILES.filter(existsSync).map((file) => {
    let html = readFileSync(file, "utf8");
    for (const [id, { url, slug }] of wanted) {
      html = setProtocolStringField(html, id, "video", url);
      if (slug) {
        const blurb = blurbForSlug(slug);
        if (blurb) html = setProtocolStringField(html, id, "blurb", blurb);
      }
    }
    return { file, html };
  });
  if (!dryRun) for (const o of outputs) writeFileSync(o.file, o.html);

  const blurbNote = blurbs.length ? ` · blurbs: ${blurbs.join(", ")}` : "";
  console.log(
    `set-protocol-videos ${dryRun ? "(dry-run) " : ""}ok · ${[...wanted.keys()].join(", ")} → ${outputs.map((o) => o.file.split(/[\\/]/).pop()).join(", ")}${blurbNote}`
  );
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
