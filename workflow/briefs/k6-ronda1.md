# k6 ronda 1: línea base (2026-11-19)

## Montaje
- `workflow/load/k6/`: `mint-tokens.mjs` (cookie JWT next-auth por rol, firmada con `AUTH_SECRET`; solo un SELECT, sin login ni escrituras; sirve también en Vercel porque el secreto coincide), `routes.js` (21 rutas GET), `run.js` (MODE=base: 1 VU × 5 iteraciones por rol; MODE=load: rampa 2→3/4 VUs por rol, **10 VUs en total**, unos 3 min), `summarize.mjs`. `tokens.json` y `results/` están en `.gitignore`.
- Roles: deportista (Visus), admin, nutricionista (Amanda). Los tres medidos.
- Local: `next build` + `next start -p 3010` en Windows, PC de 12 núcleos, contra Neon Frankfurt por la red de casa (España). Vercel: `https://optimo-online.vercel.app` (`app.optimosport.com` redirige allí con 307). Vercel responde desde `cdg1::iad1`, es decir, la función corre en Washington.

## Hallazgo nuevo (importante): producción NO es 7e79ecb
En Vercel dan **404** (con la plantilla de not-found) `/nutricion/[id]/perfil|seguimiento|compra|plantillas`, `/nutricion/alimentos`, `/api/nutrition/foods|templates|totals` y `/panel/ajustes`. En local devuelven 200, y existen en `origin/main` (7e79ecb). El deployment de producción es más antiguo que `main`, así que el supuesto «dev == main == prod» del plan es falso. Encaja con P2 (el móvil ve otra versión). No pude listar los deployments: el MCP de Vercel da 403 por el scope `adriivalle`. Esas rutas no tienen medida en Vercel (n/a).

## Tabla (ms; local = carga 10 VUs, Vercel = carga 10 VUs; base 1 VU entre paréntesis cuando difiere mucho)

| Rol | Ruta | Local p50/p95 | Vercel p50/p95 | KB HTML/JSON |
|---|---|---|---|---|
| nutri | /nutricion/{A}/compra | 811 / 864 | n/a (404) | 74 |
| nutri | /api/nutrition/totals | 566 / 842 | n/a (404) | 12 |
| nutri | /nutricion/{A}/seguimiento | 694 / 734 | n/a (404) | 22 |
| nutri | /nutricion/{A}/plantillas | 671 / 708 | n/a (404) | 39 |
| nutri | /nutricion/{A}/perfil | 489 / 635 | n/a (404) | 17 |
| nutri | /nutricion/{A} | 604 / 627 | **1764 / 1948** (base p95 2430) | 90 (66 en prod) |
| admin | /a/{A} | 512 / 544 | **1294 / 1521** | 75 |
| atleta | /a/{A} | 294 / 314 | **923 / 1575** | 76 |
| admin | /panel | 224 / 311 | 723 / 751 (base p95 2083: arranque en frío) | 18 |
| atleta | /api/diaries | 288 / 308 | 901 / 934 | 4 |
| nutri | /nutricion/alimentos | 242 / 275 | n/a (404) | **363** |
| nutri | /api/nutrition/foods | 224 / 259 | n/a (404) | 22 |
| nutri | /nutricion | 223 / 245 | 721 / 745 | 12 |
| atleta | /ajustes | 220 / 241 | 724 / 841 | 13 |
| atleta | /api/me | 218 / 233 | 721 / 794 | <1 |
| atleta | /api/meals | 221 / 231 | 721 / 773 | 6 |
| nutri | /api/nutrition/athletes | 216 / 230 | 710 / 729 | <1 |
| nutri | /api/nutrition/templates | 184 / 201 | n/a (404) | <1 |
| admin | /api/admin/accounts | 183 / 196 | 625 / 707 | 1 |
| admin | /api/athletes | 181 / 192 | 629 / 737 | 1 |
| admin | /panel/ajustes | 10 / 18 | n/a (404) | 13 |

Umbral p95 de documento < 800 ms: **lo supera** en local (p95 de documento 774 ms en carga, 825 ms en base; falla en `compra`) y en Vercel (**1748 ms**). Checks: local 100 % 200. En Vercel, 32 % de fallos, todos por los 404 de versión. Las cifras en bruto están en `workflow/load/k6/results/*.json`.

Lectura: el suelo es de unos **180 ms en local y unos 620-720 ms en Vercel**, incluso para una API de 1 fila (`/api/me`). Coste de cada viaje: casa→Frankfurt ~40 ms; iad1→Frankfurt ~90 ms. Cada `withRls` hace BEGIN + `set_config` + consultas + COMMIT, es decir, al menos 4 viajes en serie, y cada página hace 2 (`withRls` ×2). La carga apenas sube el p95, así que no es el pool (`max: 8`): es la latencia por viaje.

## Top 10 lentas y causa
1. **/nutricion/{A}** (Vercel 1.9 s): 8 `await` en serie, sin `Promise.all`, 2 transacciones RLS, 90 KB de HTML (RSC con todo el plan) y región iad1. Archivo: `app/nutricion/[athleteId]/page.tsx`.
2. **/a/{A} admin** (1.5 s): `athleteHome`, luego `diaryHistory` (60 días), luego `integrationFor`, luego `athleteProfile`, todo en serie dentro de la misma tx. Además, 75 KB de HTML. Archivo: `app/a/[id]/page.tsx`.
3. **/a/{A} atleta** (p95 1.6 s): `athleteHome` con varias consultas, `currentUser()` y 76 KB. Archivos: `app/a/[id]/page.tsx`, `lib/queries.ts` (`athleteHome`).
4. **/nutricion/{A}/compra** (local 864): 8 await y 2 tx. Archivo: `app/nutricion/[athleteId]/compra/page.tsx`.
5. **/api/nutrition/totals** (local 842, el p50 sube con la carga): agregación por rango de fechas, posible falta de índice (`athleteId`, fecha). Archivos: `app/api/nutrition/totals/route.ts`, `db/schema.sql`.
6. **/nutricion/{A}/seguimiento** (734): 2 tx y 6 await. Ojo: el `Promise.all` dentro de una misma tx de postgres.js va por una sola conexión, así que se serializa igual.
7. **/nutricion/{A}/plantillas** (708): mismo patrón.
8. **/api/diaries** (Vercel 934): 3 `withRls`, es decir, 3 transacciones (≥12 viajes). Archivo: `app/api/diaries/route.ts`.
9. **/ajustes, /nutricion, /panel, /api/me** (unos 720 en Vercel): sin trabajo pesado, el suelo es región + transacción RLS. Hay arranques en frío (`/panel` base p95 2 s).
10. **/nutricion/alimentos**: 363 KB de HTML (catálogo entero en el RSC). Rápido en local, pero pesa en móvil. Archivo: `app/nutricion/alimentos/page.tsx`.

Middleware/sesión: `auth()` corre en el middleware y otra vez en `currentUser()` en cada página. Es un JWT, sin BD, así que el coste es bajo, pero conviene `React.cache`.

## Mejoras priorizadas (para P3)
1. **Desplegar `main` de verdad a producción** (las rutas nuevas dan 404 en prod) y fijar `"regions": ["fra1"]` en `vercel.json`. Ahorro esperado: unos 500 ms por petición en todas las rutas de Vercel.
2. **Menos viajes por transacción**: fusionar los 2 `withRls` por página en 1 y meter `set_config` en la primera consulta. En `/api/diaries`, pasar de 3 tx a 1. Archivos: `lib/rls.ts`, `app/api/diaries/route.ts`, páginas de `app/nutricion/[athleteId]/*`.
3. **Consultas independientes en paralelo de verdad**: fuera de una sola tx, o con un CTE/consulta única. Prioridad en `app/a/[id]/page.tsx` (admin: history, integración y perfil) y `app/nutricion/[athleteId]/page.tsx`.
4. **Índice** para totales y diarios por (`athlete_id`, fecha), solo si `EXPLAIN` lo confirma. Archivo: `db/schema.sql` + migración no destructiva.
5. **HTML más ligero**: `/nutricion/alimentos` (363 KB, paginar o buscar en el cliente vía API), `/nutricion/{A}` y `/a/{A}` (unos 75-90 KB).
6. `React.cache` en `currentUser()` (`lib/auth.ts`) y `loading.tsx` en `/a/[id]` y `/nutricion/[athleteId]` para pintar antes.
7. Pool `max` de `lib/db.ts`: no es el cuello de botella ahora; revisarlo tras `fra1`.
