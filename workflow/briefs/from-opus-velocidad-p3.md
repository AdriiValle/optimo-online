# from: P3 mejoras de velocidad (ronda 1)

- **Hecho: sí.** `npx tsc --noEmit` exit 0 · `npm run build` exit 0 · k6 local MODE=load (10 VUs, ~3 min) con checks **100 % (2174/2174)**: «200» y «contenido» (nuevo) · servidor de 3010 parado · sin commit (lo hace el master).

## Causa raíz medida (micro-bench de solo lectura contra Neon desde casa, viaje ≈ 33 ms)
Con `prepare: false` (lib/db.ts), postgres.js manda **cada consulta con parámetros en 2 viajes** (Parse/Describe y luego Bind/Execute) y **no la encadena** con la siguiente (`describeFirst`, node_modules/postgres/src/connection.js:238). Por eso `Promise.all` dentro de una misma tx no acelera nada.

| Caso | ms |
|---|---|
| `select 1` sin parámetros | 34 |
| `select $1` con parámetro | 66 |
| tx antigua: begin + set_config(param) + 1 consulta + commit | 201 |
| tx + 3 consultas en serie / con `Promise.all` | 323 / 317 (igual) |
| **tx nueva**: set_config simple encadenado + 1 consulta | **128** |
| **3 tx nuevas en paralelo** | **132** |

## Antes / después local (build de producción en 3010, misma sesión, mismo PC y red; ms; «antes» = worktree limpio de HEAD 7e79ecb)

| Rol | Ruta | Antes p50/p95 | Después p50/p95 | TTFB p95 después |
|---|---|---|---|---|
| nutri | /nutricion/{A}/compra | 837 / 878 | 422 / 459 | 18 |
| nutri | /nutricion/{A} | 618 / 826 | 201 / 221 | 18 |
| nutri | /nutricion/{A}/seguimiento | 732 / 779 | 170 / 236 | 18 |
| nutri | /nutricion/{A}/plantillas | 689 / 724 | 173 / 260 | 19 |
| nutri | /api/nutrition/totals | 570 / 605 | 285 / 322 | 321 |
| admin | /a/{A} | 523 / 550 | 238 / 259 | 19 |
| nutri | /nutricion/{A}/perfil | 504 / 530 | 168 / 196 | 23 |
| atleta | /a/{A} | 305 / 333 | 240 / 263 | 22 |
| atleta | /api/diaries | 298 / 316 | 159 / 223 | 222 |
| nutri | /nutricion/alimentos | 251 / 279 | 180 / 206 | 193 |
| admin | /panel | 227 / 253 | 159 / 204 | 202 |
| atleta | /ajustes | 228 / 250 | 161 / 187 | 185 |
| nutri | /nutricion | 224 / 245 | 160 / 190 | 187 |
| nutri | /api/nutrition/foods | 229 / 242 | 163 / 190 | 182 |
| atleta | /api/me | 224 / 240 | 150 / 169 | 168 |
| nutri | /api/nutrition/athletes | 222 / 238 | 149 / 167 | 164 |
| atleta | /api/meals | 222 / 237 | 153 / 188 | 187 |
| admin | /api/athletes | 187 / 201 | 117 / 139 | 139 |
| admin | /api/admin/accounts | 188 / 200 | 117 / 132 | 132 |
| nutri | /api/nutrition/templates | 187 / 195 | 114 / 131 | 130 |
| admin | /panel/ajustes | 15 / 25 | 18 / 27 | 25 |

**p95 de documento: 797 → 391 ms** (umbral < 800 ya se cumple con margen). Suelo de una API de 1 fila: 224 → 150 ms. En Vercel (iad1→Frankfurt, viaje ≈ 90 ms) el ahorro por viaje es mayor, y `fra1` lo recorta aún más; eso lo mide P4.
Cifras en bruto: `workflow/load/k6/results/p3-antes-load.json|txt` y `p3-despues-load.json|txt` (gitignored).

## Qué cambió (por archivo)
1. **`vercel.json`**: `"regions": ["fra1"]` (función junto a Neon `aws-eu-central-1`). No toqué AUTH_URL ni el dominio.
2. **`lib/rls.ts`**: `set_config` por el protocolo simple, con valores literales validados (`^[A-Za-z0-9_-]*$`: rol y uuid; si no casa, cae al camino con parámetros de antes), lanzado con `.execute()` sin esperar. Se encadena con la primera consulta de `fn`. Orden FIFO garantizado en la conexión de la tx, y postgres.js recoge y relanza el error de la consulta no esperada (`index.js:292`). Fijo por tx: de 4 viajes a 2. Comentario explicando por qué `Promise.all` dentro de una tx no sirve.
3. **Lecturas independientes en paralelo, una tx cada una** (el brief pedía «una tx por página», pero el número dice otra cosa: con `prepare:false`, juntar en 1 tx serializa; N tx en paralelo cuestan lo mismo que 1):
   - `app/a/[id]/page.tsx`: `athleteHome` + (admin) `diaryHistory`, `integrationFor`, `athleteProfile` con `Promise.all`.
   - `lib/access.ts`: nuevo `nutritionAthleteData(user, athleteId, extra?)`, que lanza en paralelo el permiso (`canSeeAthleteNutrition`), la ficha, la lista de asignados y la carga propia de la página. Si no hay permiso o no existe, devuelve null y lo leído de más se descarta sin pintarse.
   - Lo usan: `app/nutricion/[athleteId]/page.tsx`, `perfil/page.tsx`, `plantillas/page.tsx` (plantillas, platos, cambios y alimentos en 4 tx), `seguimiento/page.tsx` (3 tx), `seguimiento/section-shell.tsx`, `compra/page.tsx` y `informes/page.tsx`.
   - `app/api/diaries/route.ts` (GET): `diaryFor` y `dayBlocks` en 2 tx paralelas. El «3 tx» del informe eran GET+POST; el GET ya era 1 tx. El POST no se toca.
   - `app/api/nutrition/totals/route.ts`: permiso y totales en paralelo; sin permiso, 404 como antes.
   - `app/nutricion/alimentos/page.tsx`: `listFoods` y `orphanGroups` con `Promise.all` en la misma tx (sin parámetros sí se encadenan).
4. **Índice: no se crea.** EXPLAIN ANALYZE en prod (solo lectura): ya existen `meal_slots_athlete_date_idx`, la PK de `diaries (athlete_id, date)` y `day_plans_athlete_date_idx`. Las consultas de totales e historial tardan 0,27 ms y 0,05 ms (tablas pequeñas, seq scan elegido a propósito). Sin respaldo, así que no hay migración ni cambios en `db/schema.sql`.
5. **HTML más ligero: no se aplica.** Lo que viaja por la red va con gzip: `/nutricion/alimentos` pasa de 363 KB a **19 KB**, y `/a/{A}` y `/nutricion/{A}` de 78-92 KB a **9-10 KB**. Recortarlo exigiría paginar o virtualizar la lista, que cambia el look y el comportamiento, sin números que lo justifiquen.
6. **`lib/auth.ts`**: `currentUser = cache(...)` (React.cache, una lectura de sesión por petición). **`app/a/[id]/loading.tsx`** y **`app/nutricion/[athleteId]/loading.tsx`**: esqueleto neutro con las clases `.skeleton` que ya existen. TTFB de esas páginas: ~20 ms.
7. **`workflow/load/k6/run.js`**: check nuevo «contenido». Un documento debe tener `<main` y no traer renderizado `<h1 class="login-title">` (login o no encontrada); una API debe devolver JSON sin `"error"`. Validado contra el «antes», donde también da 100 %. Los tokens se volvieron a generar con `mint-tokens.mjs` (caducan a 1 h; solo un SELECT).

## Rondas
- Intensidad: G1
- Árbitros: 0 · bloqueantes: 1 cerrado (choque de nombre `base` en compra/informes, detectado por tsc) / 0 abiertos
- Listón: no hay Listón en el brief, así que mido contra el Criterio de hecho y contra la regla «sin cambiar el comportamiento ni el look». ✔ todas las rutas medidas dan 200 con su contenido clave · ✔ `nutritionist` ve sus deportistas (prueba de que el `set_config` encadenado llega antes de `app_nutritionist_assigned`) · ✔ un uuid ajeno da 404 en `/api/diaries` y `/api/nutrition/totals` · ✘ parcial: ver la nota de `loading.tsx` en Duda.
- Criterio de hecho: ✔ todo (tsc 0, build 0, k6 local 10 VUs con checks 100 % y contenido, tabla antes/después, 3010 parado). No había prueba de mutación en el brief. El check «contenido» sí falla cuando debe: con los tokens caducados del P1, las rutas daban 307 y no tenían `<main`.

## Duda
1. **`loading.tsx` cambia el código HTTP de «no encontrado»**: al ir en streaming, una página `/a/{id}` o `/nutricion/{id}` sin permiso responde **200 + `noindex`** con la pantalla de no encontrada (la pinta el cliente), en vez de 404. Lo que ve el usuario es lo mismo, y es el comportamiento estándar de Next 15. Se deshace borrando los 2 `loading.tsx`.
2. **Siguiente palanca grande (no aplicada, va contra «sin cambiar el comportamiento»)**: `prepare: true` en `lib/db.ts`. Medido contra el pooler de Neon, funciona sin errores. La consulta con parámetro baja de 66 a 32 ms, la tx de 128 a 96 ms y `Promise.all` dentro de una tx ya encadena (317 → 133 ms). Riesgo: tras una migración que cambie columnas, la primera tx de cada conexión caliente puede fallar con «cached plan must not change result type»: postgres.js reintenta fuera de una tx, pero dentro no.
3. Pendiente medible: `/nutricion/{A}/compra` (p95 459) son 4 consultas en serie dentro de `shoppingForRange` + `foodGapsForList`. Se podrían partir en tx paralelas (cambia la firma de `lib/nutrition/shopping-queries.ts`, que también usa la vista del deportista).
4. En local, `notFound()` da 500 porque el middleware reescribe a `AUTH_URL=http://localhost:3001` (`Failed to proxy http://localhost:3001/__not_found`). Ya pasaba antes y es el mismo origen que P2 (`reqWithEnvURL`). Solo afecta a local, no lo he tocado.

## Recomendación
- (1) Mantener los `loading.tsx`: pintan al instante al navegar, que es lo que se pidió, y el 200 en «no encontrado» no lo ve nadie.
- (2) Probar `prepare: true` en la ronda 2 (P5) con k6 en Vercel, pero solo si se acepta reiniciar el despliegue después de cada migración. Si no, dejarlo como está.
- (3) Atacar `compra` en P5 si la ronda 2 la sigue sacando en el top.
- (4) Nada: el arreglo de AUTH_URL de P2 lo resuelve.

Bloquea a Adrián: no.
