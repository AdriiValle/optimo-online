# to-opus-nutri-o1

Ejecuta **O1** de `workflow/briefs/plan-nutri-macros.md`. No O2/O3/O4.

Esquema aditivo en `db/schema.sql` (mismo patrón RLS, idempotente):
- `foods` (valores/100g, aliases, source fdc/bedca/manual, source_ref, kcal/P/HC/G/fibra/Na/Fe/Ca/vitD, null≠0)
- `meal_items` (fk meal_slots, food_id nullable, raw_text, role veg|protein|carb|fat|other, grams, origin rule|manual|llm, confirmed, position)
- `portion_templates` (athlete_id null=general, day_type rest|training|match, slot, role, grams)
- `meal_slots.items_text_hash`

Script `db:seed-foods` ~80 alimentos de menús reales (FDC, source_ref). Idempotente. `db:migrate` 2× sin error.

Archivos SÍ: `db/**`, `package.json` seed. NO: `lib/nutrition/**`, UI.

Criterio de hecho del plan O1. Cwd: este repo. Commit en dev si el repo lo hace el worker. ## Para Adrián: una línea.
