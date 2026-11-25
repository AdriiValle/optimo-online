# to-opus-nutri-o3

Ejecuta **O3** de `workflow/briefs/plan-nutri-macros.md`. O1 y O2 ya están en `dev`:

- O1 `76e98e2`: `foods`, `meal_items`, `portion_templates`, `items_text_hash`, `db:seed-foods` (86 FDC). No hay `foods.default_role`.
- O2 `fc04efb`: `lib/nutrition/parse-dish.ts`, `food-catalog.ts` (slugs locales), verify 98,7 %.

Haz O3:
- `dayTypeFromMdTag` (MD=match, MD±1/entreno=training, libre=rest)
- Generador de borradores: parser + cruzar `food_id` **por name_es** con `foods` (no uses solo slugs locales)
- Rol desde catálogo O2 (aguacate/nueces = fat)
- Condimentos `other` (sal, ajo…) **sin gramos no impiden** cuantificar el plato
- `POST /api/nutrition/meal-items/draft` (rango fechas) y `PUT` editar/confirmar
- Paso opcional import Word `withItems=1`: hash cambió → borrar no confirmados, generar borradores; confirmados de plato cambiado quedan obsoletos, no borrar
- Plantillas `portion_templates` (gramos por day_type/slot/role). Si no hay tabla de Amanda, plantilla general razonable **marcada origin=rule**, Amanda confirma en O4

Criterio: semana importada genera borradores; re-import mismo Word no duplica; cambiar plato marca obsoletos; confirmados intactos.

Archivos: `lib/nutrition/**`, `app/api/nutrition/**`, `lib/queries.ts`, ruta import. No O4 UI (WeekPanel/modal). tsc limpio. Cwd: este repo.
