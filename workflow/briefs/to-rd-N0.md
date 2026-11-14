# rd-N0 - Migraciones aditivas de nutrición

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Escribe en db/schema.sql, SOLO de forma aditiva e idempotente (CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS, CREATE OR REPLACE FUNCTION, políticas RLS con DROP POLICY IF EXISTS + CREATE POLICY en tablas nuevas), lo que pide la Pista N de plan-rediseno-apple.md: foods.aisle/unit_name/unit_g/pack_g/staple; shopping_checks(athlete_id, week_start, food_key, checked); meal_checks(meal_slot_id, status, note, photo_bytes/photo_mime opcional, checked_at); athletes.allergies text[], intolerances text[], show_numbers boolean default false, target_overrides jsonb, diet_goal text; body_measurements(athlete_id, date, weight_kg, body_fat_pct, skinfold_sum_mm, waist_cm, notes); menu_templates + menu_template_slots + menu_template_items; dishes + dish_items; food_swaps(food_id, swap_food_id, ratio, approved_by); meal_day_notes(athlete_id, date, note). Todas con RLS habilitado y FORCE: admin todo; nutricionista asignada (app_nutritionist_assigned) lectura/escritura de las de sus deportistas; el deportista solo lee lo suyo y escribe únicamente sus meal_checks y shopping_checks; foods/dishes/templates/swaps globales editables por admin y nutricionista. Amplía la RPC nutritionist_set_athlete_profile (CREATE OR REPLACE con parámetros nuevos DEFAULT null o crea una nueva función aparte) para alergias, intolerancias, show_numbers y target_overrides, sin romper la firma que ya usa lib/queries.ts. Añade tipos TypeScript solo en lib/types.ts si hacen falta. NO ejecutes npm run db:migrate: lo hace el master tras la auditoría.

## Archivos
- SI (solo estos): `db/schema.sql`, `lib/types.ts`
- NO: todo lo demás; nada destructivo (ni DROP TABLE/COLUMN, ni ALTER TYPE, ni DELETE/UPDATE de datos). Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- Cada sentencia es aditiva e idempotente: relanzar db/schema.sql dos veces no falla ni cambia datos existentes.
- Todas las tablas nuevas tienen RLS habilitado y forzado, con políticas por rol como se describe (admin, nutricionista asignada, deportista solo lo suyo).
- La firma actual de nutritionist_set_athlete_profile que usa lib/queries.ts sigue funcionando.
- npx tsc --noEmit limpio.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-N0/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-N0`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-N0/`.

## Al terminar
Escribe `workflow/briefs/from-rd-N0.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
