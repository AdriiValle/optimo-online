Implementa la oleada 1 del plan anclado. Un commit. No `main`. No Neon write.

Plan: `workflow/briefs/plan-react-datos-look.md` (Oleada 1 — Datos).
From: `workflow/briefs/from-opus-plan-ok.md`.

Rama: `dev`. Cwd = este repo.

## Objetivo

La fuente del plan pasa a `lib/plan-data/`. Runtime y scripts `db:*` dejan de leer `index.html`. HTML se conserva idéntico (backup). **No escribir en Neon.**

## Hacer

1. Volcar el parse actual a:
   - `lib/plan-data/protocols.json` — `Record<string, Protocol>` tal cual.
   - `lib/plan-data/calendar.ts` — MATCHES, CRESTS (con `/` delante), SHORT, BASE_ONLINE, MD_ONLINE_BLOCKS, STRENGTH_FROM, ANTERIOR_FUERZA_V2, POSTERIOR_FUERZA_V2, tipados.
   - `lib/plan-data/index.ts` — `planData: ParsedPlan` (misma forma) y tipo `ParsedPlan` (moverlo aquí; `html-parse.ts` reimporta el tipo).
   Extrae con un script de un solo uso que llama `parseIndexHtml()`; no lo dejes commiteado.

2. `lib/plan.ts` — solo el import del tipo (desde plan-data).

3. `lib/html-parse.ts` — loader de backup para paridad. Sin cambiar la lógica de extract.

4. `app/a/[id]/page.tsx` — `crests` desde `planData.crests`; fuera `parseIndexHtml`.

5. `db/seed.ts`, `db/sync-videos.ts`, `db/update-anterior-blocks.ts`, `db/update-posterior-blocks.ts` — `planData` en vez de parse. Mensajes "from index.html" → "from plan-data".

6. `db/sync-videos.ts` — `--dry-run`: cuenta filas que cambiarían, no `update`.

7. `db/set-protocol-videos.ts` — escribe `lib/plan-data/protocols.json` (`JSON.stringify` pretty). Deja de tocar HTML y de usar `protocol-html-field`. `--dry-run` sigue existiendo.

8. Borrar `db/protocol-html-field.ts`.

9. `scripts/plan-parity.ts` + `plan:parity` en `package.json`: `buildDayPlans(planData)` vs `buildDayPlans(parseIndexHtml())`, deep-equal por fecha; exit ≠0 + primera diferencia si fallan.

10. `resolveJsonModule` en tsconfig si hace falta.

## NO

- No `npm run db:seed` ni `db:update-*` ni `db:sync-videos` sin `--dry-run`.
- No tocar `index.html` / `plan-visus.html`.
- No `main`, no Vercel prod, no auth, no UI salvo `page.tsx` crests.
- No paleta, no look.

## Criterio

- `npm run plan:parity` → 235/235.
- `npm run db:sync-videos -- --dry-run` → 0 filas cambiarían (si >0: no escribir Neon; anótalo en el from).
- `npm run db:set-videos -- --dry-run` corre sin abrir HTML (si no hay CSV, no inventes datos; el código debe estar listo).
- `npm run build` OK.
- Grep `parseIndexHtml` / `index.html` en `app` `db` `lib`: solo `lib/html-parse.ts` y `scripts/plan-parity.ts` (y comentarios/tipos).
- HTML sin cambios en el diff.
- Commit: `feat(plan): datos del plan en lib/plan-data (TS/JSON), HTML queda de backup`

Al terminar: `workflow/briefs/from-sonnet-plan-data.md` (rutas, paridad, dry-run sync, hash commit).
