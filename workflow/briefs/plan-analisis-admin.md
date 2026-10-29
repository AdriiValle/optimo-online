# Plan: pestaña Análisis (admin) vs Registro (jugador) — ANCLADO

Estado: **plan-ok (Opus, 2026-10-29)**. Listo para oleadas.

## Objetivo

La casa `/a/[id]` es la vista del **jugador** (entrenar / nutrición / registrar el día). El admin entra a la ficha pero **no** rellena sueño ni RPE del deportista.

Cuando entra el **admin**, la tercera pestaña es **Análisis**: historial de solo lectura con gráficas de lo que el jugador registra. El jugador sigue con **Registro**. Ratios y carga avanzada, fuera.

## Cajón

Producto / UI + lectura de `diaries`. Rama `dev`. Sin schema nuevo, sin API nueva, sin Whoop, sin auth. No `main`.

## Hechos del código (anclas)

- `app/a/[id]/page.tsx` es server component; ya tiene `user.role`. Hoy pasa `canEdit = admin || dueño` → **no sirve para distinguir rol** (el jugador también es `canEdit`). Hace falta prop nueva `isAdmin`.
- `app/a/[id]/home-client.tsx`: estado `pane: "train" | "food" | "log"` (l.54), tabs en l.354-363, render l.366-371. `diaryForm` es una const dentro del componente.
- `lib/queries.ts`: `athleteHome()` carga solo el diario del día; no hay serie. Mapeo listo: `mapDiaryJson()` y tipo `Diary` en `lib/types.ts` (ya trae todos los campos). Molestias = `Diary.dietNote` (columna legacy `diet_note`).
- RLS `diaries_all`: admin lee todo, atleta solo lo suyo → la lectura nueva no necesita permisos extra.
- `lib/dates.ts` ya tiene `todayKey`, `addDays`, `dateKey`, `parseDateLocal`, `daysBetween`.
- No hay librería de gráficas en `package.json`. `.page` mide máx. 640px.

## Decisiones fijadas

1. **Gráficas: SVG inline propio, cero dependencias.** Nada de recharts/chart.js.
2. **Rango: últimos 60 días hasta hoy** (`todayKey()`), fijo, sin selector.
3. **Carga en servidor**, no por fetch: `page.tsx` llama a la query **solo si `user.role === "admin"`** y pasa `history` al client. El jugador no paga la consulta extra.
4. **Contrato (no cambiar sin avisar):**
   - `lib/queries.ts` → `export async function diaryHistory(tx: Tx, athleteId: string, from: string, to: string): Promise<Diary[]>` — ordenado por `date` asc, `from`/`to` inclusivos, formato `YYYY-MM-DD`. Reutiliza el tipo `Diary` existente (no tocar `lib/types.ts`).
   - `app/a/[id]/analisis.tsx` → `"use client"`, `export function Analisis({ diaries, from, to }: { diaries: Diary[]; from: string; to: string })`.
   - `home-client.tsx` → props nuevas `isAdmin: boolean` y `history: Diary[] | null` (+ `historyFrom`, `historyTo`: string). Pane nuevo `"stats"`.
5. **Métricas v1** (una tarjeta por serie): Sueño (h), Calidad sueño (eje 0–100), HRV (ms, eje auto), Pulso reposo (lpm, eje auto), RPE (barras, eje 0–10). Cada tarjeta: título, último valor, media del rango, gráfica.
6. **Eje X por día de calendario** (60 posiciones), no por índice de registro: el día sin dato queda **hueco** (la línea se corta). No interpolar ni inventar.
7. **Molestias**: lista de los días con `dietNote` no vacío, más reciente primero, máx. 10, `fecha corta — texto`. Si no hay: «Sin molestias registradas en 60 días.»
8. **Vacío total** (0 diarios en rango): un solo mensaje «Aún no hay registros en los últimos 60 días.», sin tarjetas.
9. RPE solo serie diaria; **sin acumulado** (eso es carga → fuera de este slice).
10. Look: tarjetas `.card` existentes; CSS nuevo con prefijo `.an-` en `globals.css`. 1 columna en móvil, 2 columnas desde 520px.

## Archivos SÍ

| Trozo | Archivos |
|---|---|
| A | `lib/queries.ts` (solo añadir `diaryHistory`) |
| B | `app/a/[id]/analisis.tsx` (nuevo), `app/globals.css` (solo bloque `.an-*` al final) |
| C | `app/a/[id]/page.tsx`, `app/a/[id]/home-client.tsx` |

## Archivos NO

- `lib/types.ts`, `app/api/**`, `db/**`, auth, `/panel`, Whoop.
- Form Registro del jugador (calidad 1–100, molestias…): no reabrir. En C solo se condiciona si se muestra.
- `main` / Vercel production.

## Precondición (antes de la oleada 1)

El árbol de `dev` tiene **diff sin commitear de otro trabajo** (molestias / calidad 1–100 / quitar sensación / header fijo) en `home-client.tsx`, `globals.css`, `lib/queries.ts`, `lib/types.ts`, `app/api/diaries/route.ts`, `app/panel/*`. Ese trabajo se commitea por su dueño **antes** de lanzar este plan. Las oleadas parten de árbol limpio en esos archivos.

## Oleadas

### Oleada 1 — A ∥ B (no se pisan)

**A — Query historial** (`lib/queries.ts`)
- Añadir `diaryHistory` según contrato. SQL: `select ... from diaries where athlete_id = $1 and date between $from::date and $to::date order by date`. Mapear con el mismo patrón que `diaryFor` (numeric → `Number`).
- Criterio: tipa con `Diary[]`; no toca `athleteHome` ni otras funciones.

**B — UI Análisis** (`app/a/[id]/analisis.tsx` + `.an-*` en `globals.css`)
- Componente según contrato y decisiones 5–10. Un subcomponente local `Serie` (línea SVG con puntos, cortes en huecos) y `Barras` (RPE). `viewBox` fijo, `width: 100%`, sin texto dentro del SVG salvo lo imprescindible.
- Fechas con helpers de `lib/dates.ts`.
- Criterio: compila aislado contra el tipo `Diary`; sin form, sin fetch, solo props.

### Oleada 2 — C + verificación

**C — Cableado por rol** (`page.tsx`, `home-client.tsx`)
- `page.tsx`: `isAdmin = user.role === "admin"`; si admin, `to = todayKey()`, `from = dateKey(addDays(parseDateLocal(to), -59))`, `history = await withRls(..., tx => diaryHistory(tx, id, from, to))` (puede ir en la misma `withRls` que `athleteHome`). Si no admin, `history = null`.
- `home-client.tsx`: tercera tab = `isAdmin ? "Análisis" (pane "stats") : "Registro" (pane "log")`. Admin nunca renderiza `diaryForm`. `canEdit` sigue igual (foto).
- Criterio: un solo `home-client`, sin duplicar página. `next build` pasa.

**Smoke manual** (orquestador)
- Admin → ficha Visus → tab «Análisis» con series y huecos; no aparece «Registro».
- Ricardo (jugador) → tab «Registro» → guarda el día como antes; no aparece «Análisis».

## Riesgos

1. **Choque con el diff en vuelo** (ver Precondición). Si se lanza sin commitearlo, C pisa `home-client.tsx` a medio cambiar.
2. **Calidad de sueño con escala mezclada**: el form pasó de 1–5 a 1–100; si hay diarios viejos 1–5 en BD, saldrán pegados al suelo en el eje 0–100. No se convierte nada en este slice (sería tocar datos). Si molesta, slice aparte.
3. **Fecha de hoy en servidor**: `todayKey()` usa la hora del servidor (Vercel = UTC). Cerca de medianoche el rango puede desplazarse un día. Aceptable en v1; es el mismo criterio que ya usa la carga actual.
4. Admin sin form: si el admin necesitaba corregir un diario, ya no puede desde la UI (la API lo sigue permitiendo). Coherente con «Fuera».

## Criterio de hecho (slice)

Admin en la ficha tiene **Análisis** (historial 60 días + gráficas + molestias), no Registro. El jugador sigue registrando en **Registro**. `next build` OK. Sin merge a `main`.

## Fuera

Ratios, carga/acumulados, comparación entre atletas, export CSV, selector de rango, edición admin de diarios ajenos, recuperación/km/pulso medio en gráficas, conversión de datos 1–5.
