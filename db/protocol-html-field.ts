/** Helpers para escribir campos string en entradas de PROTOCOLS dentro del HTML estático. */

export function matchingBrace(text: string, open: number) {
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
  throw new Error("protocol-html-field: llave sin cerrar");
}

export function setProtocolStringField(html: string, id: string, field: string, urlOrText: string) {
  const start = html.indexOf("const PROTOCOLS = ");
  if (start < 0) throw new Error("protocol-html-field: falta PROTOCOLS");
  const blockOpen = html.indexOf("{", start);
  const blockClose = matchingBrace(html, blockOpen);

  const key = `"${id}": {`;
  const k = html.indexOf(key, blockOpen);
  if (k < 0 || k > blockClose) throw new Error(`protocol-html-field: ${id} no está en PROTOCOLS`);
  const open = k + key.length - 1;
  const close = matchingBrace(html, open);
  const body = html.slice(open + 1, close);
  const value = JSON.stringify(urlOrText);
  const fieldRe = new RegExp(`\\b${field}:\\s*"(?:[^"\\\\]|\\\\.)*"`);

  let next: string;
  if (fieldRe.test(body)) {
    next = body.replace(new RegExp(`(\\b${field}:\\s*)"(?:[^"\\\\]|\\\\.)*"`), (_m, p1: string) => `${p1}${value}`);
  } else if (body.includes("\n")) {
    const indent = body.match(/\n([ \t]+)\S/)?.[1] ?? "        ";
    const tail = body.match(/\n([ \t]*)$/)?.[1] ?? "";
    next = `${body.replace(/[\s,]+$/, "")},\n${indent}${field}: ${value}\n${tail}`;
  } else {
    next = ` ${body.trim().replace(/,$/, "")}, ${field}: ${value} `;
  }
  return html.slice(0, open + 1) + next + html.slice(close);
}
