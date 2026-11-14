# from-rd-N0 — Migraciones aditivas de nutrición

- Hecho: sí
- Qué cambió (rutas):
  - `db/schema.sql`: bloque nuevo al final, «Pista N: nutrición». Todo es aditivo e idempotente:
    - `foods` + `aisle`, `unit_name`, `unit_g` (>0), `pack_g` (>0), `staple` (bool, por defecto false).
    - `athletes` + `allergies text[]` y `intolerances text[]` (NOT NULL, por defecto `{}`), `show_numbers` (NOT NULL, por defecto false), `target_overrides jsonb`, `diet_goal text`.
    - Tablas nuevas: `shopping_checks` (PK athlete_id+week_start+food_key), `meal_checks` (PK meal_slot_id; status `done|half|missed`, nota ≤280, foto opcional), `body_measurements` (UNIQUE athlete_id+date), `menu_templates` / `menu_template_slots` (day_offset 0..6, slot) / `menu_template_items`, `dishes` / `dish_items`, `food_swaps` (ratio >0, UNIQUE food+swap, sin swap consigo mismo), `meal_day_notes` (PK athlete_id+date).
    - RLS activado y forzado en las 10 tablas, con `DROP POLICY IF EXISTS` + `CREATE POLICY`:
      - admin puede con todo;
      - nutricionista asignada: lee y escribe lo de sus deportistas;
      - el deportista solo lee lo suyo y escribe únicamente sus `meal_checks` y `shopping_checks`;
      - plantillas y platos: solo admin y nutricionista;
      - `food_swaps`: igual que `foods` (lo leen todos; escriben admin y nutricionista).
    - Trigger `athletes_keep_nutrition_fields`: con rol `athlete`, un UPDATE de su propia fila conserva los 5 campos nuevos. La política `athletes_update` ya existente deja al deportista editar su fila, y sin el trigger podría cambiarse `show_numbers` o los objetivos.
    - RPC nueva `nutritionist_set_athlete_diet_profile(athlete_id, allergies, intolerances, show_numbers, target_overrides, diet_goal DEFAULT null)`: SECURITY DEFINER, admin o nutricionista asignada. Devuelve false si `target_overrides` no es un objeto JSON.
    - `nutritionist_set_athlete_profile` queda intacta.
  - `lib/types.ts`: añadidos `MealCheckStatus`, `MealCheck`, `BodyMeasurement` y `AthleteDietProfile`.
- Verificación:
  - `npx tsc --noEmit` limpio.
  - En un Postgres 17 local y temporal (puerto 54329, ya parado y borrado; la BD compartida no se tocó):
    - esquema de HEAD con 2 deportistas sembrados, después el `schema.sql` nuevo dos veces: rc=0 y datos intactos;
    - BD vacía, dos veces con `-1` (una sola transacción, como `client.unsafe` de `db/migrate.ts`): rc=0;
    - BD existente con `-1`: rc=0.
  - Prueba de RLS con un rol no superusuario (`.tmp-verify/rd-N0/rls-test.sql`):
    - **Deportista A:** escribe su meal_check y su shopping_check. No puede escribirlos para B, ni insertar en body_measurements, notas, platos o swaps. Si cambia show_numbers o alergias, esos campos no cambian y `team` sí. La RPC le devuelve false.
    - **Nutricionista asignada a A:** escribe medidas, nota, plato, swap y plantilla de A. Las medidas de B se rechazan. La RPC devuelve true para A y false para B. La RPC antigua de 4 argumentos devuelve true.
    - **Deportista B:** ve 0 filas de A.
  - No hay capturas ni prueba a 390 px: no se tocó ninguna ruta de UI.
- Duda: ninguna que bloquee. Hay dos decisiones que el auditor debe ver:
  1. No amplié `nutritionist_set_athlete_profile` con parámetros DEFAULT. En Postgres eso crea una sobrecarga y la llamada de 4 argumentos de `lib/queries.ts:1227` daría «function is not unique». Por eso es una función aparte. Además incluye `diet_goal`, porque sin ella la nutricionista no podría guardarlo: `athletes_update` solo deja escribir al admin y al propio deportista.
  2. El deportista puede leer `body_measurements` (como pide el brief). El plan N7 dice «solo panel de Amanda»: eso queda en la UI, que no debe mostrárselo.
- Recomendación: el master aplica `npm run db:migrate` tras el PASA. No se hizo ningún commit, según el brief.
- Bloquea a Adrián: no.

Decidí la función RPC aparte porque ampliar la existente rompía la llamada actual de 4 argumentos.
Decidí el trigger de protección porque `athletes_update` deja al deportista editar su propia fila.
