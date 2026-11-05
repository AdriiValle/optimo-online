# from opus — nutricionista plan ok

- Hecho: sí
- Qué cambió (rutas):
  - `workflow/briefs/plan-nutricionista.md` (anclado; correcciones abajo)
  - `workflow/briefs/from-opus-nutricionista-plan-ok.md` (este)
  - Sin código en este paso (oleadas sonnet/opus aparte).

## Visto bueno

Sí, con correcciones ya reflejadas en el plan:

1. **BYPASSRLS en Neon:** las policies solas no bastan; `canSeeAthleteNutrition` y `mealForUser` deben chequear asignación en app (`isNutritionistAssigned`) además de RLS.
2. **`canSeeAthlete` sync** sigue solo admin/atleta; nutricionista **no** entra a `/a/[id]`, diario ni wearables. Rutas de menú/foto usan `canSeeAthleteNutrition`.
3. **Enum `nutritionist`:** `ADD VALUE` en `schema.sql` sin inserts con ese rol en el mismo script; seed en `db/seed-nutritionist.ts`.
4. **Suplementos/diet_notes:** función `nutritionist_set_athlete_nutrition` (SECURITY DEFINER) para no abrir UPDATE genérico de `athletes` a la nutricionista.
5. **Calendario:** componente compartido `PlanCalendar`; nutricionista usa `calendarPlansForNutritionist` (sin bloques de sesión).

## Oleadas

1. sonnet: schema + queries + APIs + middleware + seed Amanda.
2. sonnet: `/nutricion/**`, admin asignación, `NutritionPane` menú lectura.
3. opus: CSS glass menú + cards nutricionista.
4. verificar + commit `dev`.

## Riesgos

Enum irreversible · fotos bytea · middleware desactualizado bloquea login · olvidar chequeo app con BYPASSRLS.

## Bloquea a Adrián

No para v1 dev. Prod OK cuando pruebe Amanda en preview.
