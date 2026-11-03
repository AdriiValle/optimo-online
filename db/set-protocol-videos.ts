import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseIndexHtml } from "../lib/html-parse";

// Uso: npm run db:set-videos -- [subidos.csv] [--dry-run]
// Vuelca la URL de cada fila de subidos.csv en PROTOCOLS.video de index.html
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

function matchingBrace(text: string, open: number) {
  let depth = 0;
  let quote = "";
  for (let i = open; i < text.length; i += 1) {
    const c = text[i];
    if (quote) {
      if (c === "\\") i += 1;
      else if (c === quote) quote = "";
    } else if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === "{") depth += 1;
    else if (c === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  throw new Error("set-protocol-videos: llave sin cerrar");
}

function setVideo(html: string, id: string, url: string) {
  const start = html.indexOf("const PROTOCOLS = ");
  if (start < 0) throw new Error("set-protocol-videos: falta PROTOCOLS");
  const blockOpen = html.indexOf("{", start);
  const blockClose = matchingBrace(html, blockOpen);

  const key = `"${id}": {`;
  const k = html.indexOf(key, blockOpen);
  if (k < 0 || k > blockClose) throw new Error(`set-protocol-videos: ${id} no está en PROTOCOLS`);
  const open = k + key.length - 1;
  const close = matchingBrace(html, open);
  const body = html.slice(open + 1, close);
  const value = JSON.stringify(url);

  let next: string;
  if (/\bvideo:\s*"(?:[^"\\]|\\.)*"/.test(body)) {
    next = body.replace(/(\bvideo:\s*)"(?:[^"\\]|\\.)*"/, (_m, p1: string) => `${p1}${value}`);
  } else if (body.includes("\n")) {
    const indent = body.match(/\n([ \t]+)\S/)?.[1] ?? "        ";
    const tail = body.match(/\n([ \t]*)$/)?.[1] ?? "";
    next = `${body.replace(/[\s,]+$/, "")},\n${indent}video: ${value}\n${tail}`;
  } else {
    next = ` ${body.trim().replace(/,$/, "")}, video: ${value} `;
  }
  return html.slice(0, open + 1) + next + html.slice(close);
}

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

  // Última fila por protocolId gana (una re-subida reemplaza a la anterior).
  const wanted = new Map<string, string>();
  for (const r of data) {
    const slug = iSlug >= 0 ? r[iSlug]?.trim() : "";
    const id = r[iProtocol]?.trim() || (slug && known[slug] ? slug : "");
    const url = r[iUrl]?.trim();
    if (id && url) wanted.set(id, url);
  }
  if (wanted.size === 0) {
    console.log("set-protocol-videos: ninguna fila con protocolId ni slug de PROTOCOLS, nada que hacer");
    return;
  }

  const errors: string[] = [];
  for (const [id, url] of wanted) {
    if (!known[id]) errors.push(`protocolId desconocido: ${id}`);
    if (!/^https:\/\//.test(url)) errors.push(`url no https para ${id}: ${url}`);
  }
  if (errors.length) throw new Error(`set-protocol-videos: ${errors.join("; ")} (no se escribió nada)`);

  const outputs = HTML_FILES.filter(existsSync).map((file) => {
    let html = readFileSync(file, "utf8");
    for (const [id, url] of wanted) html = setVideo(html, id, url);
    return { file, html };
  });
  if (!dryRun) for (const o of outputs) writeFileSync(o.file, o.html);

  console.log(
    `set-protocol-videos ${dryRun ? "(dry-run) " : ""}ok · ${[...wanted.keys()].join(", ")} → ${outputs.map((o) => o.file.split(/[\\/]/).pop()).join(", ")}`
  );
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
