# Rebrief 2/2: Neon `day_plans` o la ficha no se entera

Cwd: este repo. Rama `dev`. Sonnet. Sin Think.

`DAY_OVERRIDES` + `buildDayPlans` ya están. **No valen para la ficha.** `athleteHome` lee Neon (`day_plans` vía `lib/queries.ts`). En localhost, el 12 nov sigue diciendo «Sin bloque asignado para este día.» y el calendario no pinta MD-4 en 10–15.

Patrón existente: `db/update-anterior-blocks.ts` + `npm run db:update-anterior`. Ese script **solo actualiza `blocks`** y exige que la fila ya exista.

## Qué hacer

1. Script (nuevo o ampliar el de anterior) que para Ricardo Visus **upsert** las fechas `2026-11-08` … `2026-11-15` con lo que ya saca `buildDayPlans` (md_tag, title, minutes, blocks). El 12 debe quedar anterior V2 (mismos bloques que el 3). El 16 no se toca salvo que `db:update-anterior` lo reescriba igual.
2. **Ejecútalo** (escribe Neon de esta app: `noisy-meadow`, no el de Óptimo Sport). Esto es el calendario que Adrián pidió ver.
3. No `db:seed` entero. No `db:sync-videos`. No HTML.
4. No cambies el motor MD ni `MATCHES`.
5. Comprueba que `buildDayPlans` del 12 sigue con los mismos ids que el 3. Si el upsert no encuentra fila, INSERT.

Tras correrlo, la ficha en `/a/<uuid Visus>` día 12 tiene Base/Específica/Activación/Fuerza, no «Sin bloque». Días 8 recovery, 9–10 libre, 11 pendiente, 13 club, 14 amistoso, 15 pendiente.

## Archivos SÍ

- `db/` script de este upsert + `package.json` solo si hace falta un npm script.
- `lib/plan.ts` / `lib/plan-data/calendar.ts` solo si el upsert necesita un campo que aún no sale en `DayPlan`.

## Criterio de hecho

- Script corrido, exit 0.
- En `from`: cuántas filas insert/update por fecha.
- Ids del 12 = ids del 3.

## Out

Sobrescribe `workflow/briefs/from-sonnet-semana-paron.md`
