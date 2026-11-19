# k6 ronda 2: después de fra1 y P3 (2026-11-19)

## Montaje (el mismo que en la ronda 1)
- Mismo k6 (`workflow/load/k6/run.js`, `routes.js`, 21 rutas GET, 3 roles), con `MODE=base` (1 VU × 5 iteraciones por rol) y `MODE=load` (rampa hasta 10 VUs en total, unos 3 min). Tokens nuevos con `mint-tokens.mjs` (`authjs.session-token` en local y `__Secure-authjs.session-token` en Vercel; el `AUTH_SECRET` coincide).
- Local: `next build` + `next start -p 3010`, el mismo PC y la misma red de casa contra Neon Frankfurt.
- Vercel: **https://app.optimosport.com** (main d5465c6). `x-vercel-id` con sesión: `cdg1::fra1::…` en `/api/me`, `/nutricion/{A}`, `/nutricion/{A}/compra` y `/api/nutrition/totals` (`results/r2-vercel-id.txt`). En la ronda 1 era `cdg1::iad1`.
- Dominio: `curl -sI https://app.optimosport.com/` → `Location: /login?from=%2F` (relativo, mismo host) y `__Secure-authjs.callback-url=https://app.optimosport.com`. Ya no salta a `optimo-online.vercel.app`.

## Tabla (ms, p50 / p95, carga de 10 VUs)
Leyenda: «R1» = ronda 1 (P1: código de 7e79ecb, Vercel en iad1 con el deploy viejo). «R2» = código de main d5465c6. «R2 + P5» = con la mejora de `compra` de este paso (solo en local: falta desplegarla). «n/a (404)»: en la R1 esa ruta no existía en el deploy de producción, así que no hay medida real.

| Rol | Ruta | Local R1 | Local R2 | Local R2 + P5 | Vercel R1 | Vercel R2 |
|---|---|---|---|---|---|---|
| nutri | /nutricion/alimentos | 242 / 275 | 175 / 213 | 162 / 184 | n/a (404) | 173 / 284 |
| nutri | /nutricion/{A}/compra | 811 / 864 | 385 / 459 | **185 / 280** | n/a (404) | 146 / 199 |
| nutri | /nutricion/{A}/perfil | 489 / 635 | 152 / 214 | 144 / 187 | n/a (404) | 111 / 190 |
| atleta | /a/{A} | 294 / 314 | 221 / 280 | 216 / 247 | 923 / 1575 | **129 / 184** |
| admin | /a/{A} | 512 / 544 | 221 / 249 | 214 / 253 | 1294 / 1521 | **130 / 183** |
| admin | /panel | 224 / 311 | 150 / 179 | 144 / 184 | 723 / 751 | 110 / 181 |
| nutri | /nutricion/{A} | 604 / 627 | 189 / 257 | 186 / 265 | 1764 / 1948 | **134 / 181** |
| nutri | /nutricion/{A}/plantillas | 671 / 708 | 158 / 239 | 150 / 238 | n/a (404) | 117 / 180 |
| atleta | /api/me | 218 / 233 | 141 / 174 | 138 / 158 | 721 / 794 | 100 / 172 |
| nutri | /nutricion/{A}/seguimiento | 694 / 734 | 154 / 231 | 151 / 249 | n/a (404) | 116 / 156 |
| atleta | /ajustes | 220 / 241 | 145 / 177 | 142 / 164 | 724 / 841 | 105 / 154 |
| admin | /panel/ajustes | 10 / 18 | 15 / 26 | 10 / 25 | n/a (404) | 102 / 147 |
| nutri | /nutricion | 223 / 245 | 146 / 166 | 142 / 190 | 721 / 745 | 108 / 142 |
| nutri | /api/nutrition/foods | 224 / 259 | 148 / 175 | 144 / 170 | n/a (404) | 114 / 141 |
| admin | /api/athletes | 181 / 192 | 107 / 125 | 105 / 125 | 629 / 737 | 99 / 141 |
| nutri | /api/nutrition/totals | 566 / 842 | 271 / 326 | 270 / 330 | n/a (404) | 108 / 137 |
| nutri | /api/nutrition/templates | 184 / 201 | 108 / 146 | 106 / 157 | n/a (404) | 99 / 134 |
| atleta | /api/meals | 221 / 231 | 142 / 166 | 138 / 176 | 721 / 773 | 100 / 128 |
| atleta | /api/diaries | 288 / 308 | 142 / 205 | 138 / 170 | 901 / 934 | 100 / 127 |
| admin | /api/admin/accounts | 183 / 196 | 107 / 127 | 104 / 114 | 625 / 707 | 97 / 124 |
| nutri | /api/nutrition/athletes | 216 / 230 | 142 / 172 | 136 / 147 | 710 / 729 | 102 / 120 |
| | **p95 de documento** | 774 | 379 | **237** | 1748 | **193** |
| | checks (200 + contenido) | 976/976 | 2204/2204 | **2214/2214** | 567/839 (404 de versión) | **2310/2310** |

Base de 1 VU en Vercel (R1 → R2): p95 de documento **1769 → 306 ms** y checks 65/105 → **210/210**. Los p95 altos de la base en R2 (`/api/me` 777, `/api/athletes` 716, `/nutricion` 706, `/api/nutrition/templates` 620) son arranques en frío de la primera petición de cada rol; en carga desaparecen (p95 120-172).

Lectura:
- **Vercel: p95 de documento de 1748 a 193 ms (−89 %)**, por debajo del umbral de 800 ms con mucho margen. Las páginas pesadas bajan de 1,5-1,9 s a unos 180 ms. El suelo de una API de 1 fila baja de unos 720 ms a unos 100 ms.
- En fra1, ir a la BD ya casi no cuesta. Con sesión, `/login` (sin BD) y `/api/me` (1 tx) tardan lo mismo desde casa (TTFB de 135-188 ms frente a 159-184 ms, 5 muestras de cada). Lo que queda en Vercel es casi todo la red de casa → cdg1 y el propio render.
- Local (casa → Frankfurt, unos 33 ms por viaje) sigue notando cada viaje. Por eso `compra` y `totals` encabezan la lista en local, pero en Vercel están en la media.

Cifras en bruto: `workflow/load/k6/results/r2-*.json|txt` (gitignored). La tabla sale de `results/r2-compare.mjs`.

## Qué se aplicó en P5 (con números)
1. **`compra` en 3 tx paralelas** (antes eran 4 consultas en serie en una sola tx): local **385/459 → 185/280 ms**. El HTML es idéntico byte a byte salvo el `buildId`, comprobado en 5 rangos (semana actual, 2/11, 9/11, 23/11 sin menú y 3 días): `results/r2-cmp/old|new`. En Vercel cabe esperar unos 146 → ~110 ms de p50; falta medirlo cuando se despliegue.
2. **`prepare: true`: no se aplica.** Los números de fra1 no lo justifican: en Vercel el viaje a la BD casi no cuenta (ver la lectura de arriba), así que el ahorro sería de pocos ms. Y el riesgo no está cubierto: postgres.js reintenta `RevalidateCachedQuery` («cached plan must not change result type», `node_modules/postgres/src/connection.js:25-28,540,821`), pero dentro de una tx el primer error ya aborta la transacción y el reintento falla. Casi todo pasa por `withRls`, que es una tx. Tras cada migración que cambie columnas, las conexiones calientes darían error hasta reciclarse.

## Lo que aún se puede mejorar (por orden de impacto en Vercel)
1. **Arranques en frío** (p95 de 600-780 ms en la primera petición de cada ruta). Es lo más grande que queda en producción. Opciones, de menos a más: dejarlo (ya es poco), activar Fluid compute en el proyecto (si no lo está) o hacer un ping periódico. Es configuración de Vercel, no código.
2. **`/nutricion/alimentos`** (Vercel 173/284, el p95 más alto en carga): 363 KB de HTML, 19 KB con gzip. Recortarlo exige paginar o buscar en el cliente, lo que cambia el comportamiento. Solo merece la pena si Amanda lo nota.
3. **`/api/nutrition/totals`** (local 270/330, el primero en local; Vercel 108/137): `nutritionTotals` (`lib/queries.ts:1160`) hace 3 consultas en serie en una tx. Con 3 tx paralelas, como en `compra`, en local bajaría a unos 150 ms, pero en Vercel apenas se gana (unos 10 ms). No aplicado por eso.
4. **`/a/{A}` y `/nutricion/{A}`** (Vercel unos 130/183): `athleteHome` y el menú siguen teniendo consultas en serie dentro de la tx. El margen es pequeño en fra1.
5. **Informes y la compra del deportista** (`app/nutricion/[athleteId]/informes/report-data.ts`, `app/a/[id]/nutrition/actions.ts`) siguen usando `shoppingForRange` en serie. No están en el k6, así que no hay números que lo respalden.
