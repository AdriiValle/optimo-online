# to-opus-nutri-o2

Ejecuta **O2** de `workflow/briefs/plan-nutri-macros.md`. No O1/O3/O4 (el catálogo puede casar por nombre/alias; si foods aún no está en DB, el parser debe ser puro y el verify script puede usar una lista local o el seed si existe).

`lib/nutrition/parse-dish.ts`: texto plato → `{raw_text, role, food_id?}[]`. Parte por ` · `, `con`, `+`, `/`. Quita `[CATEGORÍA]`.

Script `scripts/verify-dish-parse.ts` sobre `workflow/inbox/EJEMPLO DE MENU.md`. Criterio: ≥90 % líneas casadas; no casadas por nombre.

Archivos SÍ: `lib/nutrition/**`, `scripts/`. NO: `db/schema.sql`, UI.

Cwd: este repo. ## Para Adrián: una línea + % match.
