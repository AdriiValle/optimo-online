// Genera cookies de sesión next-auth (JWT) por rol, sin login ni escrituras en BD.
// Uso: node --env-file=.env.local workflow/load/k6/mint-tokens.mjs  -> workflow/load/k6/tokens.json (gitignored)
import { encode } from "@auth/core/jwt";
import postgres from "postgres";
import { writeFileSync } from "node:fs";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
const rows = await sql`
  select a.id, a.email, a.role::text as role, at.id as athlete_id
  from accounts a left join athletes at on at.account_id = a.id
  order by a.created_at`;
await sql.end();
const pick = (role, pred = () => true) => rows.find((r) => r.role === role && pred(r));
const users = {
  athlete: pick("athlete", (r) => /visus/i.test(r.email)) ?? pick("athlete"),
  admin: pick("admin"),
  nutritionist: pick("nutritionist"),
};
const anyAthlete = users.athlete?.athlete_id;
const out = { athleteIdForStaff: anyAthlete, roles: {} };
for (const [role, u] of Object.entries(users)) {
  if (!u) { out.roles[role] = null; continue; }
  const token = { sub: u.id, id: u.id, email: u.email, role: u.role, athleteId: u.athlete_id ?? null };
  const mk = (salt) => encode({ token, secret: process.env.AUTH_SECRET, salt, maxAge: 3600 });
  out.roles[role] = {
    athleteId: u.athlete_id ?? null,
    http: await mk("authjs.session-token"),
    https: await mk("__Secure-authjs.session-token"),
  };
}
writeFileSync(new URL("./tokens.json", import.meta.url), JSON.stringify(out, null, 2));
console.log(Object.fromEntries(Object.entries(out.roles).map(([k, v]) => [k, !!v])), "athlete:", anyAthlete);
