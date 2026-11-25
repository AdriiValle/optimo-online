# to-opus-nutri-o4

Ejecuta **O4** de `workflow/briefs/plan-nutri-macros.md`. O1–O3 en `dev` (último O3 `0ad1731`).

UI Amanda:
- Editor de ingredientes en el **modal del plato**: alimento, g, rol, confirmar. Condimentos `other` sin g no bloquean. Items obsoletos visibles, no confirmar (409).
- `WeekPanel` con `nutritionTotals(athleteId, from, to)`: solo platos **cuantificados** (confirmados + food_id + grams, hash vigente). Cobertura «1.840 kcal · 3/5 platos». 0 platos → «pendiente». g/kg si hay `weight_kg`. Micros null → no pongas 0. Texto estimado del menú planificado. Día/semana/mes según vista actual.
- Import Word: casilla `withItems` (O3 ya soporta `withItems=1`).
- PUT/POST de O3. `meal_items.text_hash` existe.

Criterio: un día calculado a mano coincide ±1 kcal / ±0,5 g si hay datos confirmados; sin confirmar → pendiente; cobertura x/y en día/semana/mes.

Archivos: `app/nutricion/**`, `globals.css` nut-*, queries si falta leer totales. tsc limpio. No O5/O6. Cwd: este repo.

## Para Adrián: cómo lo usa Amanda (corto).
