# from-opus-nutri-o3

- **Hecho:** sí — commit `0ad1731` en `dev`.

## Qué cambió (rutas)

- `lib/nutrition/day-type.ts`: `dayTypeFromMdTag`. MD → match; MD±n o «entreno» → training; null/libre → rest.
- `lib/nutrition/portions.ts`: busca los gramos por (day_type, slot, role) en este orden: plantilla del deportista > plantilla general (`athlete_id` null) > **regla por defecto en código** (solo comida/cena; como `portion_templates` está vacía, los items salen con `origin='rule'`). Ajuste por macro con `equivalentGrams`: la ración de proteína va expresada como carne/pescado (~20 g de proteína/100 g), la de hidrato como cereal seco (~75 g/100 g) y la de grasa como aceite. Ejemplo: 80 g de arroz ≈ 300 g de boniato. El factor está limitado a [0,2; 5] y se redondea a 5 g.
- `lib/nutrition/drafts.ts`:
  - `catalogFromFoods`: cruza el catálogo O2 con `foods` por `name_es` y, si no hay coincidencia, por alias. Así cada línea recibe el `food_id` real de la DB y conserva el rol de O2 (aguacate/nueces = fat). Los `foods` que no están en O2 también se casan, con el rol que les toque por posición.
  - `buildDraftItems`: si el plato no trae línea de aceite, añade «Aceite de oliva (cocinado)». La verdura reparte su ración entre sus líneas. Las grasas extra (aguacate, nueces…) reparten la ración por equivalencia. Los `other` quedan sin gramos.
  - `dishTextHash` (md5, el mismo que calcula SQL).
  - `itemIsQuantified` / `dishIsQuantified`, para O4: un `other` con alimento y sin gramos no bloquea; `grams = 0` significa «descartado».
- `lib/nutrition/generate-drafts.ts`, `generateMealItemDrafts(tx, athleteId, rango | ids, {force})`:
  - Si el hash coincide con el de la última generación, no hace nada (no duplica).
  - Si no, borra los no confirmados y genera borradores, salvo que ya haya confirmados del texto vigente.
  - Los confirmados de un texto anterior no se tocan.
- `lib/queries.ts`: `foodsForDrafts`, `portionTemplatesFor`, `mealSlotsForDrafts` (con `md_tag` de `day_plans`), insert/delete de items, `mealItemsByIds` (calcula `obsolete` en SQL), `updateMealItem`.
- `app/api/nutrition/meal-items/draft/route.ts`: `POST {athleteId, from, to, force?}`, máximo 62 días, solo admin/nutricionista.
- `app/api/nutrition/meal-items/route.ts`: `PUT {items:[{id, foodId?, grams?, role?, confirmed?}]}`.
  - Si cambian alimento, gramos o rol, el item pasa a `origin='manual'`.
  - Confirmar un item obsoleto devuelve 409.
  - Comprueba el acceso al deportista de forma explícita, porque la conexión tiene BYPASSRLS.
- `app/api/nutrition/menu-import/route.ts`: con `withItems=1` en el form, tras el upsert corre `generateMealItemDrafts` sobre los slots escritos y devuelve `drafts` en la respuesta. Sin el flag, todo funciona igual que antes.
- `db/schema.sql`: `ALTER TABLE meal_items ADD COLUMN IF NOT EXISTS text_hash text`. Es aditiva y `db:migrate` ya se ha corrido 2 veces sin errores en la Neon de `.env.local`.
- `scripts/verify-meal-drafts.ts`: comprueba el criterio sobre la semana real 02–08/11, dentro de una transacción que se deshace al final.

## Verificación

- `tsc --noEmit` limpio.
- `verify-meal-drafts`:
  - 14 platos → 88 borradores.
  - Re-generar no duplica.
  - Al cambiar un plato confirmado, sus 7 confirmados quedan intactos y obsoletos, y se generan borradores nuevos.
  - Al cambiar un plato sin confirmar, sus borradores se sustituyen.
  - Quedan 5 de 90 líneas sin casar.
- La DB queda sin items (rollback comprobado).
- PUT: `updateMealItem` y `mealItemsByIds` probados en transacción, y un plato con todo confirmado cuenta (`dishIsQuantified`).

## Duda

- El brief pedía marcar los confirmados como obsoletos sin borrarlos y, a la vez, regenerar el plato. Con solo `meal_slots.items_text_hash` no se pueden distinguir los items viejos de los nuevos. Por eso añadí `meal_items.text_hash`, una columna aditiva en `db/schema.sql`, que estaba fuera de la lista de archivos del brief.
- La regla por defecto es mía, no de Amanda. Valores:
  - Verdura 150 g.
  - Proteína 150 g (comida) / 130 g (cena).
  - Hidrato seco: descanso 50/40, entreno 80/60, partido 100/80 (comida/cena).
  - Aceite 10 g.

## Recomendación

- Mantener `text_hash` (no borra nada y es idempotente).
- En O4, cargar la tabla de Amanda en `portion_templates`: tiene prioridad sobre la regla sin tocar código. Después, `POST draft` con `force: true` regenera los borradores no confirmados.
- La casilla `withItems` en el formulario del import es UI (O4); no la he tocado.

## Bloquea a Adrián

No.
