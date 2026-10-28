import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { HtmlMatch, MatchVenue, Protocol } from "@/lib/types";

function extractBinding(html: string, name: string): unknown {
  const needle = `const ${name} = `;
  const i = html.indexOf(needle);
  if (i < 0) throw new Error(`index.html: missing ${name}`);
  let j = i + needle.length;
  while (html[j] === " " || html[j] === "\n") j += 1;
  const open = html[j];
  if (open !== "[" && open !== "{") throw new Error(`index.html: ${name} is not an object/array`);
  const close = open === "[" ? "]" : "}";
  const start = j;
  let depth = 0;
  let inStr = false;
  let quote = "";
  let escaped = false;
  for (; j < html.length; j += 1) {
    const c = html[j];
    if (inStr) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (c === "\\") {
        escaped = true;
        continue;
      }
      if (c === quote) inStr = false;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inStr = true;
      quote = c;
      continue;
    }
    if (c === open) depth += 1;
    else if (c === close) {
      depth -= 1;
      if (depth === 0) {
        const text = html.slice(start, j + 1);
        return new Function(`return (${text})`)();
      }
    }
  }
  throw new Error(`index.html: unclosed ${name}`);
}

function extractString(html: string, name: string) {
  const m = html.match(new RegExp(`const ${name} = "([^"]+)"`));
  if (!m) throw new Error(`index.html: missing string ${name}`);
  return m[1];
}

export type ParsedPlan = {
  matches: HtmlMatch[];
  crests: Record<string, string>;
  shortNames: Record<string, string>;
  protocols: Record<string, Protocol>;
  baseOnline: string[];
  mdOnlineBlocks: Record<string, { specific?: string[]; activation?: string[]; post?: string[] }>;
  strengthFrom: string;
};

export function readIndexHtml() {
  return readFileSync(resolve(process.cwd(), "index.html"), "utf8");
}

export function parseIndexHtml(html = readIndexHtml()): ParsedPlan {
  const matches = extractBinding(html, "MATCHES") as HtmlMatch[];
  const crests = extractBinding(html, "CRESTS") as Record<string, string>;
  const shortNames = extractBinding(html, "SHORT") as Record<string, string>;
  const protocols = extractBinding(html, "PROTOCOLS") as Record<string, Protocol>;
  const baseOnline = extractBinding(html, "BASE_ONLINE") as string[];
  const mdOnlineBlocks = extractBinding(html, "MD_ONLINE_BLOCKS") as ParsedPlan["mdOnlineBlocks"];
  const strengthFrom = extractString(html, "STRENGTH_FROM");

  return {
    matches: matches.map((m) => ({
      ...m,
      venue: m.venue as MatchVenue
    })),
    crests: Object.fromEntries(
      Object.entries(crests).map(([k, v]) => [k, v.startsWith("/") ? v : `/${v}`])
    ),
    shortNames,
    protocols,
    baseOnline,
    mdOnlineBlocks,
    strengthFrom
  };
}
