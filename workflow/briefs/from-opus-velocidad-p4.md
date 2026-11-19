# from: P4 + P5. k6 ronda 2 y mejoras de la ronda 2

- **Hecho: sí.** `npx tsc --noEmit` exit 0 · `npm run build` exit 0 (después de los cambios) · k6 local MODE=load tras la mejora: checks **100 % (2214/2214, «200» y «contenido»)** · `workflow/briefs/k6-ronda2.md` con Vercel medido en **https://app.optimosport.com** y `x-vercel-id: cdg1::fra1::…` · servidor de 3010 parado (puerto libre) · sin commit, como pide el brief (lo hace el master).

## Ronda 2: resultado (detalle en `k6-ronda2.md`)
- **Vercel, p95 de documento: 1748 → 193 ms** en carga (10 VUs) y 1769 → 306 ms en base (1 VU, con arranques en frío). Checks: 567/839 (404 de versión) → **2310/2310**. `/nutricion/{A}`: 1764/1948 → 134/181 · `/a/{A}` admin: 1294/1521 → 130/183 · `/api/me`: 721/794 → 100/172.
- Dominio arreglado: `app.optimosport.com/` → `Location: /login?from=%2F` (mismo host) y la cookie `callback-url` = `app.optimosport.com`.
- Local, p95 de documento: 774 (R1) → 379 (R2) → **237** (R2 + P5).

## Qué cambió (por archivo), con antes/después
1. **`lib/nutrition/shopping-queries.ts`**: las 3 lecturas de la compra (platos, ingredientes, marcas «ya lo tengo») pasan a funciones internas, y el montaje de la lista va en `assemble`. `shoppingForRange(tx, …)` mantiene la firma y el comportamiento (en serie, la siguen usando la vista del deportista y los Informes). Nuevo `shoppingForRangeParallel(ctx, …)`: 3 tx en paralelo, con el mismo criterio de «sin platos con ingredientes no hay ingredientes». Devuelve además la configuración de los alimentos (sección, unidad, paquete), que sale del mismo join.
2. **`app/nutricion/[athleteId]/compra/food-gaps.ts`**: `foodGapsForList(list, foods)` ya no consulta la BD (antes hacía un `select … from foods where id = any(...)` en serie tras la lista). Usa las filas del join, que es la misma tabla bajo la misma RLS (`name_es` es NOT NULL, así que join con fila ⇔ alimento existe).
3. **`app/nutricion/[athleteId]/compra/page.tsx`**: usa `shoppingForRangeParallel` + `foodGapsForList`, y quita el import de `withRls` que ya no se usa.
   - **Antes/después local (10 VUs): `/nutricion/{A}/compra` 385/459 → 185/280 ms** (p50/p95). Resto de rutas sin cambios (ruido de ±10-20 ms).
   - Mismo comportamiento: el HTML es idéntico byte a byte salvo el `buildId` en 5 rangos (semana actual con avisos de «Revisa N alimentos», 2/11, 9/11, 23/11 sin menú y 3 días). Está en `workflow/load/k6/results/r2-cmp/old|new` (gitignored).
4. **`workflow/briefs/k6-ronda2.md`** (nuevo): la tabla de ruta × rol (R1 y R2, local y Vercel) y el top de lo que aún se puede mejorar. Los auxiliares, gitignored: `workflow/load/k6/results/r2-*.json|txt`, `r2-compare.mjs` (genera la tabla) y `r2-vercel-id.txt`.

**No aplicado, con números:** `prepare: true` en `lib/db.ts`. En fra1, `/login` (sin BD) y `/api/me` (1 tx) tienen el mismo TTFB desde casa, así que el ahorro en producción sería de pocos ms. Además, el riesgo no está cubierto: el reintento de postgres.js ante `RevalidateCachedQuery` (`node_modules/postgres/src/connection.js:540,821`) no sirve dentro de una tx, porque el primer error ya la aborta, y casi todo va por `withRls`.

## Rondas
- Intensidad: G1
- Árbitros: 0 · bloqueantes: 1 cerrado (escribí 3 scripts y la captura «antes» en `%TEMP%`, fuera del repo; los moví a `results/r2-cmp` y borré los de `%TEMP%`) / 0 abiertos
- Listón: no hay Listón en el brief, así que mido contra el Criterio y contra «sin cambiar comportamiento ni look». ✔ HTML de compra idéntico en 5 rangos · ✔ firmas usadas por la vista del deportista e Informes sin tocar · ✔ `prepare:true` medido y descartado con números y riesgo anotado · ✘ la mejora de `compra` no está medida en Vercel (no está desplegada; desplegar es del master).
- Criterio de hecho: ✔ todo (tsc 0, build 0, k6 local 100 % 200 + contenido, `k6-ronda2.md` con app.optimosport.com en fra1, este `from` con cambios por archivo y antes/después, 3010 parado). No había prueba de mutación en el brief.

## Duda
1. La mejora de `compra` solo está medida en local. En Vercel se espera unos 146 → ~110 ms de p50 (el margen en fra1 es pequeño). Lo verá la pasada corta de k6 del cierre del plan tras el merge.
2. `compra` abre ahora 6 tx a la vez por petición (permiso, ficha, asignados + 3), con el pool en `max: 8` por instancia. En carga (4 VUs de nutri) no hubo errores ni colas, y en Vercel cada instancia atiende pocas peticiones a la vez. Lo anoto por si se sube la carga.
3. Sin commit, como manda el brief (el envoltorio decía «un commit por unidad»; mandó el brief).

## Recomendación
- El master commitea en `dev` los 3 archivos, mergea a `main` y pasa `k6 run -e BASE=https://app.optimosport.com -e MODE=base workflow/load/k6/run.js` (con tokens nuevos: `node --env-file=.env.local workflow/load/k6/mint-tokens.mjs`) para cerrar P5.
- Lo siguiente en producción son los arranques en frío (primera petición de 600-780 ms), que es configuración de Vercel. Lo demás (`totals`, `alimentos`) ya no compensa en fra1.

Bloquea a Adrián: no.
