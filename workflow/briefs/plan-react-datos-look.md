# Plan: datos TS + look React (sin HTML en el camino)

Cajón: app. Difícil (arquitectura, Neon, UI).

Objetivo: la fuente del plan deja de ser HTML; Visus se ve igual o mejor en móvil; look Óptimo + glass encima de Next. No reescribir la app desde cero (ya es Next/React).

Rama: `dev`. Local: http://localhost:3001. Prod: https://optimo-online.vercel.app. Un commit por oleada. No `main`. No `vercel --prod`. No borrar `index.html` / `plan-visus.html` en este corte.

Estado: anclado por Opus 2026-11-04. Listo para oleadas.

## Lo que hay hoy (verificado en código)

- `lib/html-parse.ts` → `parseIndexHtml()` lee `index.html` con `readFileSync` + `new Function` y devuelve `ParsedPlan` (9 bindings). Hoy: **235 días** (2026-07-25 → 2027-05-22), 40 protocolos, 35 partidos, 18 escudos.
- **Camino crítico en runtime:** `app/a/[id]/page.tsx:31` llama a `parseIndexHtml()` en cada request **solo para `crests`**. Es la única dependencia del HTML en producción. El resto (`day_plans.blocks`) ya sale de Neon vía `lib/queries.ts`.
- `lib/plan.ts` importa el tipo `ParsedPlan` de `html-parse`; `buildDayPlans(parsed)` es puro.
- Scripts que leen HTML: `db/seed.ts`, `db/sync-videos.ts`, `db/update-anterior-blocks.ts`, `db/update-posterior-blocks.ts`, `db/set-protocol-videos.ts`. Este último además **escribe** `video`/`blurb` dentro de `PROTOCOLS` de `index.html` y `plan-visus.html` vía `db/protocol-html-field.ts`.
- `index.html` y `plan-visus.html` son idénticos byte a byte.
- UI del plan: `SessionTable` en `app/a/[id]/home-client.tsx:430` es una `<table className="content-table">` (Ejercicio / Cantidad / Vídeo). El único `dangerouslySetInnerHTML` es `VENUE_SVG` (icono casa/fuera del calendario, `home-client.tsx:183`), no contenido del plan.
- Escudos: `public/escudos/*.png`; `CRESTS` guarda `escudos/x.png` y el parse antepone `/`.
- Glass ya existe parcialmente en `app/globals.css` (`backdrop-filter` en cabecera y overlays). Tokens en `workflow/context/design-system.md`.

## Supuestos

- Neon de esta app (`noisy-meadow`, EU). No `fancy-breeze`. **Sin esquema nuevo.**
- Neon es la misma base que usa prod: en este corte **no se escribe en Neon**. Solo lectura / `--dry-run`.
- Look: tokens de `design-system.md` + glass. No paleta nueva.
- Auth, cuentas, RLS, Whoop, otros deportistas, `lib/queries.ts`, `app/api/**`: no tocar.
- Paridad: los mismos 235 `DayPlan` (deep-equal) que el parse HTML actual.

## Oleada 1 — Datos (sonnet, sola)

Archivos SÍ:
- Nuevo `lib/plan-data/`:
  - `protocols.json` — `Record<string, Protocol>`, volcado tal cual del parse actual. JSON y no TS porque `db:set-videos` tiene que reescribirlo de forma mecánica (`JSON.stringify(…, null, 2)`), sin cirugía de regex.
  - `calendar.ts` — `MATCHES`, `CRESTS` (ya con `/` delante), `SHORT`, `BASE_ONLINE`, `MD_ONLINE_BLOCKS`, `STRENGTH_FROM`, `ANTERIOR_FUERZA_V2`, `POSTERIOR_FUERZA_V2`, tipados.
  - `index.ts` — exporta `planData: ParsedPlan` (misma forma que hoy) y el tipo `ParsedPlan` (se mueve aquí; `html-parse.ts` lo reimporta).
- `lib/plan.ts` — solo cambia el import del tipo.
- `lib/html-parse.ts` — se queda como loader de backup (solo lo usa el script de paridad). Sin cambios de lógica.
- `app/a/[id]/page.tsx` — `crests` desde `planData.crests`; fuera `parseIndexHtml`. (Única línea de app en esta oleada.)
- `db/seed.ts`, `db/sync-videos.ts`, `db/update-anterior-blocks.ts`, `db/update-posterior-blocks.ts` — `planData` en vez de `parseIndexHtml()`. Mensajes "from index.html" → "from plan-data".
- `db/sync-videos.ts` — añadir `--dry-run` (cuenta filas que cambiarían, no hace `update`).
- `db/set-protocol-videos.ts` — escribe `lib/plan-data/protocols.json`, deja de tocar los HTML.
- `db/protocol-html-field.ts` — borrar (queda huérfano por este mismo diff).
- Nuevo `scripts/plan-parity.ts` + script `plan:parity` en `package.json`: `buildDayPlans(planData)` vs `buildDayPlans(parseIndexHtml())`, deep-equal por fecha; sale con código ≠0 y la primera diferencia si no casan.

Cómo extraer: un script de un solo uso que llama a `parseIndexHtml()` y escribe los archivos; no se commitea (o se borra antes del commit).

Criterio:
- `npm run plan:parity` → 235/235 iguales.
- `npm run db:sync-videos -- --dry-run` → `0 de N filas cambiarían` (TS = Neon en campos de protocolo). Si sale >0: no escribir, apuntarlo en el from.
- `npm run db:set-videos -- --dry-run` corre sin abrir HTML.
- `npm run build` OK.
- `grep -rn "parseIndexHtml\|index.html" app db lib` → solo `lib/html-parse.ts` y `scripts/plan-parity.ts`.
- `index.html` / `plan-visus.html` sin cambios en el diff.
- Local: `/a/<visus>` muestra escudos en el calendario.

Commit: `feat(plan): datos del plan en lib/plan-data (TS/JSON), HTML queda de backup`.

## Oleada 2 — UI estructura (sonnet, después de 1)

Archivos SÍ:
- Nuevo `app/a/[id]/session-list.tsx` — sustituye a `SessionTable`: lista de bloques. `section` → encabezado; `match`/`note` → nota; `protocol` → fila con label, `qty` debajo o a la derecha, `info` si existe, botón Vídeo que abre `VideoEmbedModal` igual que ahora.
- `app/a/[id]/home-client.tsx` — quitar `SessionTable` y usar `SessionList`; `VENUE_SVG` pasa a JSX inline (sin `dangerouslySetInnerHTML`). Nada más.
- `app/globals.css` — solo clases nuevas de la lista (añadir al final), estructura mínima con tokens existentes. Quitar `.content-table*` si nadie más las usa (grep antes).

NO: `lib/`, `db/`, `video-embed-modal.tsx`, calendario (salvo el SVG), analisis, nutrición, marca.

Criterio: Visus en local reconoce el día (MD-3 anterior, MD-2 posterior, día de partido, MD+1); no hay `<table>` en la ficha de sesión; vídeo + blurb abren; a 375 px no hay scroll horizontal. `npm run build` OK.

Commit: `feat(ficha): sesión del día como lista React, sin tabla`.

## Oleada 3 — Look (opus, después de 2)

Archivos SÍ: `app/globals.css`, `app/**/*.tsx` visibles (login, panel, `/a/[id]` casa deportista, `session-list.tsx`, `video-embed-modal.tsx`, cabecera `app/components/brand-header.tsx`). Solo `className`/marcado y CSS.

Lee `workflow/context/design-system.md`. apple-design (raw) solo si está en el repo; si no, basta con design-system.md.

NO: `lib/`, `db/`, `app/api/**`, auth, middleware, Neon, lógica/props/fetch de componentes, quién ve qué.

Criterio: móvil primero (375 y 640), tokens Óptimo, glass en tarjetas/cabecera/tabs/modal; modal de vídeo usable en móvil (sin regresión del fix 153 / portal); contraste legible; `npm run build` OK; diff sin cambios de datos ni consultas.

Commit: `feat(look): Óptimo + glass móvil en login, panel y ficha`.

## Oleada 4 — Master

Push `dev`, preview Vercel, mirar Visus en móvil. No merge a `main`.

## NO en todas

Borrar `index.html` / `plan-visus.html`, `main`, prod, escribir en Neon (seed / update-* / sync sin `--dry-run`), Neon ajeno, Whoop API, paleta nueva, OAuth, esquema.

## Paralelo

Ninguno. 1 → 2 → 3 en serie: 2 y 3 tocan `home-client.tsx` y `globals.css`; 2 depende del import limpio de 1 en `page.tsx`.

## Riesgos

- **Neon = prod.** Cualquier `seed` borra y reinserta `day_plans` de Visus. Solo `--dry-run` en este corte.
- **HTML se congela.** Tras la oleada 1, `set-videos` ya no escribe en `index.html`; el HTML deja de ser fiel a partir del primer vídeo nuevo. Aceptado: es backup, y `plan:parity` solo vale el día del commit.
- **Escudos.** Si `CRESTS` pierde la `/` inicial, el calendario rompe en rutas anidadas. Paridad + mirar local.
- **Vercel tracing.** Hoy prod empaqueta `index.html` para el `readFileSync`; al quitarlo, la página deja de necesitarlo. No requiere config.
- **Editar un protocolo ≠ verlo.** `day_plans.blocks` es foto en Neon: cambios de label/qty/info/video/blurb necesitan `db:sync-videos` (sin dry-run, fuera de este corte); cambios de estructura (qué protocolo va qué día) necesitan `update-*`/`seed`.
- `home-client.tsx` tiene 500 líneas; la oleada 2 solo extrae la sesión, no refactoriza el resto.

## Criterio de hecho global

Editar un protocolo en `lib/plan-data/protocols.json` (label/video/blurb) → `db:sync-videos -- --dry-run` lo detecta → tras sync real (con Adrián) se ve en la ficha sin tocar `index.html`. Ninguna request de la app lee HTML. Ficha de sesión sin tabla. Look móvil no parece documento HTML. HTML seed sigue en el repo.
