// k6 ronda: solo GET. Uso:
//   k6 run -e BASE=http://localhost:3010 -e MODE=base|load -e TAG=local workflow/load/k6/run.js
// Sesión: cookies JWT de tokens.json (mint-tokens.mjs), sin login ni escrituras.
import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";
const bytes = new Trend("body_bytes");
import { ROUTES } from "./routes.js";

const BASE = __ENV.BASE || "http://localhost:3010";
const HTTPS = BASE.startsWith("https");
const TOK = JSON.parse(open("./tokens.json"));
const A = TOK.athleteIdForStaff;
const pad = (n) => String(n).padStart(2, "0");
const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = new Date();
const D = key(today), F = key(new Date(today.getTime() - 6 * 864e5));
const ROLES = Object.keys(ROUTES).filter((r) => TOK.roles[r]);

const MODE = __ENV.MODE || "base";
const scenarios = {};
for (const role of ROLES) {
  scenarios[role] = MODE === "base"
    ? { executor: "per-vu-iterations", vus: 1, iterations: Number(__ENV.ITER || 5), exec: "run", env: { ROLE: role }, maxDuration: "5m" }
    // 5→10 VUs en total (repartidos entre roles), ~3 min
    : { executor: "ramping-vus", startVUs: 1, exec: "run", env: { ROLE: role },
        stages: [{ duration: "30s", target: role === "nutritionist" ? 2 : 2 }, { duration: "60s", target: role === "nutritionist" ? 2 : 2 },
                 { duration: "20s", target: role === "nutritionist" ? 4 : 3 }, { duration: "60s", target: role === "nutritionist" ? 4 : 3 }, { duration: "10s", target: 0 }] };
}
// thresholds por ruta para que salgan en el resumen
const thresholds = { "http_req_duration{kind:doc}": ["p(95)<800"], checks: ["rate>0.99"] };
for (const role of ROLES) for (const [kind, p] of ROUTES[role]) {
  thresholds[`http_req_duration{route:${role} ${p}}`] = ["p(95)<99999"];
  thresholds[`http_req_waiting{route:${role} ${p}}`] = ["p(95)<99999"];
  thresholds[`body_bytes{route:${role} ${p}}`] = ["max>=0"];
}
export const options = { scenarios, thresholds, summaryTrendStats: ["avg", "med", "p(95)", "max", "count"], noConnectionReuse: false };

export function run() {
  const role = __ENV.ROLE;
  const cookie = `${HTTPS ? "__Secure-" : ""}authjs.session-token=${TOK.roles[role][HTTPS ? "https" : "http"]}`;
  for (const [kind, p] of ROUTES[role]) {
    const url = BASE + p.replace(/\{A\}/g, A).replace("{D}", D).replace("{F}", F);
    const res = http.get(url, { headers: { Cookie: cookie }, redirects: 0, tags: { route: `${role} ${p}`, kind, role } });
    bytes.add(res.body ? res.body.length : 0, { route: `${role} ${p}` });
    check(res, {
      "200": (r) => r.status === 200,
      // contenido clave: documento con <main> y sin la pantalla de login/no encontrada renderizada; API en JSON sin error
      contenido: (r) => {
        const b = r.body || "";
        return kind === "doc"
          ? b.includes("<main") && !b.includes('<h1 class="login-title">')
          : b.startsWith("{") && !b.includes('"error"');
      },
    }, { route: `${role} ${p}` });
    sleep(MODE === "base" ? 0.2 : 0.5 + Math.random());
  }
}
