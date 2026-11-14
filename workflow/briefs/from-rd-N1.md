# from-rd-N1 — Nutrición jugador: pestaña Hoy

**Hecho:** sí (sin commit, como pide el brief; lo hace el master).

## Qué cambió (rutas)

- `app/a/[id]/nutrition-pane.tsx`: segmentado Hoy · Semana · Compra (solo si llega `menuDate`, es decir, en la vista del jugador o admin) + panel. Se quita el antiguo `DayMenu` de solo lectura. El editor de suplementos y dieta (`canEdit`) queda igual, debajo; al guardar, la vista Hoy se recarga.
- `app/a/[id]/nutrition/segments.tsx` (nuevo): `NutritionSegmented` (patrón tablist: flechas, Inicio y Fin, roving tabindex, foco visible) y `NutritionSoon`, el estado vacío de Semana y Compra.
- `app/a/[id]/nutrition/today-view.tsx` (nuevo): vista Hoy.
  - **Tarjeta del día.** Tipo de día, chip MD y nivel de combustible carga/normal/suave con color y medidor de 3 barras, sin kcal. Incluye la nota de Amanda del día (`meal_day_notes`).
  - **Comidas.** Franjas en orden horario:
    - La siguiente se destaca con la insignia «Ahora»/«Siguiente», foto grande si la hay e ingredientes abiertos.
    - Las pasadas se pliegan en un `details`.
    - El resto muestra miniatura, ingredientes plegados y preparación plegable.
  - **Suplementos.** Cada uno va dentro de su franja; los que no encajan en ninguna, en «Otros suplementos».
  - **Indicaciones.** «Indicaciones de Amanda» (`diet_notes`) es plegable.
  - **Estados.** Carga, error, día sin menú y sin suplementos.
  - **Cifras.** Kcal y macros solo con `show_numbers=true`: del día (con «(parcial)» si faltan platos cuantificados) y de cada plato.
- `app/a/[id]/nutrition/actions.ts` (nuevo): Server Action `loadNutritionToday(athleteId, date)` (zod uuid + fecha) con `currentUser` → `canSeeAthleteNutrition` → `withRls` → `nutritionToday`.
- `lib/nutrition/today.ts` (nuevo, puro):
  - Tipos `TodayData`.
  - `fuelLevel` y textos del combustible.
  - `parseSupplements`: acepta el campo opcional `slot` y es compatible con las entradas antiguas sin él.
  - `supplementSlot`: usa el `slot` explícito; si no lo hay, lo deduce de `time` por palabras (desayuno, media mañana, comida, merienda, cena, noche…) o por la hora.
  - `roundedAmount`: unidades de compra en medias; aceite en cucharadas; gramos redondeados a 5, 10 o 25.
  - `slotPhases`: pasada, siguiente o después; solo aplica si la fecha es hoy.
- `lib/nutrition/today-queries.ts` (nuevo): `nutritionToday(tx, athleteId, date)`.
  - Lee el atleta, el `md_tag`, la nota del día, los platos e ingredientes vigentes (`text_hash`) con `foods`.
  - Si un alimento se repite en un plato, suma sus gramos en una sola línea.
  - Los ítems sin confirmar se muestran sin cantidad.
  - `nutritionTotals` solo se calcula si `show_numbers` está activo.
- `app/styles/nutri-shared.css`: bloque «Jugador: navegación interna Hoy · Semana · Compra (rd-N1)».
  - Todo con tokens.
  - Área táctil de 44 px en el segmentado (`::after`) y en los `summary`.
  - Reglas de reduced-motion y prefers-contrast al final de la hoja.

**No se tocaron** `lib/queries.ts`, `db/`, `middleware.ts` ni `nutricion-athlete-client.tsx`.

## Verificado (capturas en `.tmp-verify/rd-N1/`)

- **Como Ricardo a 390 px:** se ve el segmentado; Hoy muestra la tarjeta MD con combustible Carga, la nota del día, el desayuno pasado plegado (y desplegado), la comida «Ahora» destacada, ingredientes redondeados (100 g, 1 cucharada), los suplementos en su franja, «Otros suplementos» y las indicaciones plegables.
  - Capturas: `hoy-390.png`, `hoy-siguiente.png`, `hoy-pasado-abierto.png`, `indicaciones.png`.
- **Cifras:** sin kcal ni macros por defecto. Con `show_numbers=true` aparecen el total del día (parcial) y el de cada plato (`hoy-numeros-on.png`); después se restauró a false.
- **Estados:** sin suplementos (`hoy-sin-suplementos.png`) y día sin menú, el 24/11, con combustible Normal (`dia-sin-menu.png`).
- **Semana y Compra:** muestran su estado vacío; con flechas del teclado cambia de pestaña con anillo de foco visible (`semana-foco.png`, `compra.png`).
- **Medidas:** `scrollWidth` = 390 en todos los casos; el área táctil del segmentado mide 44 px.
- **Aislamiento:** otro jugador (Paco) recibe `null` al invocar la action con el id de Ricardo, y su propio id le devuelve sus datos. `/a/<Ricardo>` le da «Página no encontrada».
- **Admin:** ve Hoy y el editor debajo (`admin-390.png`).
- **Comprobaciones:** `npx tsc --noEmit` limpio; sin errores nuevos en consola.
- **Datos de prueba:** el desayuno y la merienda de prueba con foto e ítems, los suplementos, `diet_notes` y la nota del día se borraron y restauraron (supplements `[]`, diet_notes null, show_numbers false, 0 notas, 2 platos del 14/11 como estaban). `browse.lock` borrado.

## Duda

1. **El middleware** reescribe todo `/api/nutrition*` a 404 si el rol no es nutritionist, así que el jugador y el admin no pueden usar una ruta `app/api/nutrition/today`. Por eso la carga va por Server Action en `app/a/[id]/nutrition/actions.ts`, con la misma guarda y RLS. La ruta API que creé al principio la borré en este mismo diff, así que no queda huérfana.
2. **`slot` de suplementos:** la lectura ya lo respeta, pero hoy nadie puede guardarlo. El zod del PATCH `/api/athletes/[id]/nutrition` y `mapSupplements` en `lib/queries.ts` lo eliminan, y no son mis ficheros. Mientras tanto, la franja se deduce de `time`.
3. **Semana y Compra** son estados vacíos, a la espera de N2 y N3.

## Recomendación

- Para N2/N3, que el jugador cargue también por Server Action (o por una ruta fuera de `/api/nutrition`), o que el master abra `/api/nutrition/*` de solo lectura al jugador en `middleware.ts`.
- En el brief del editor de Amanda (N6/N8), añadir `slot` opcional (`breakfast|morning_snack|lunch|afternoon_snack|dinner`) al zod del PATCH y a `mapSupplements`.

**Bloquea a Adrián:** no.

Decidí la Server Action en vez de la ruta API porque el middleware cierra `/api/nutrition` a todo el que no sea nutricionista y `middleware.ts` no estaba en mi lista de ficheros.
