// node summarize.mjs results/x.json -> tabla ruta: p50 p95 ttfb_p95 bytes fail
import { readFileSync } from "node:fs";
const j = JSON.parse(readFileSync(process.argv[2], "utf8")).metrics;
const rows = {};
for (const [k, v] of Object.entries(j)) {
  const m = k.match(/^(http_req_duration|http_req_waiting|body_bytes)\{route:(.+)\}$/); if (!m) continue;
  (rows[m[2]] ??= {})[m[1]] = v;
}
const out = Object.entries(rows).map(([r, v]) => ({ r, p50: Math.round(v.http_req_duration.med), p95: Math.round(v.http_req_duration["p(95)"]), ttfb95: Math.round(v.http_req_waiting["p(95)"]), kb: Math.round((v.body_bytes?.max ?? 0) / 1024), n: v.http_req_duration.count }));
out.sort((a, b) => b.p95 - a.p95);
for (const o of out) console.log([o.r, o.p50, o.p95, o.ttfb95, o.kb, o.n].join("\t"));
console.log("checks", j.checks?.value ?? j.checks?.passes, "fails", j.checks?.fails, "doc p95", Math.round(j["http_req_duration{kind:doc}"]?.["p(95)"]));
