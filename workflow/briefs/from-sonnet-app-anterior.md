# from-sonnet — app-anterior

- Hecho: sí
- Qué cambió (rutas):
  - `index.html` y `plan-visus.html` (idénticos): 3 entradas nuevas en `PROTOCOLS` (`fuerza-cuadriceps-zancada-caballero-mancuernas`, `fuerza-cuadriceps-salto-cajon-carga`, `fuerza-cuadriceps-hop-jump-trx`), const `ANTERIOR_FUERZA_V2 = ["2026-11-03", "2026-11-16"]` y bifurcación en el render del día anterior.
  - `lib/html-parse.ts`: campo `anteriorFuerzaV2` en `ParsedPlan` + `extractBinding`.
  - `lib/plan.ts`: misma bifurcación en la rama `anterior`.
  - `db/update-anterior-blocks.ts` (nuevo) + script `db:update-anterior` en `package.json`. Solo `update` de `blocks` en las fechas de `ANTERIOR_FUERZA_V2`; sin delete, sin tocar `accounts`.
  - Commit en `dev`: «Cadena anterior: nuevo bloque de Fuerza solo el 3 y el 16 de nov.»
- Verificación:
  - `buildDayPlans` antes/después: de 235 días, cambian solo 2026-11-03 y 2026-11-16 (Fuerza = española 1 pierna → zancada → salto cajón carga → CEA TRX; sin española 2 piernas). 24-nov, 1-dic… idénticos.
  - `npm run build` OK.
  - `npm run db:update-anterior` ejecutado: 2 filas actualizadas. Después comparé las 235 filas de `day_plans` con `buildDayPlans`: 0 diferencias.
  - No arranqué `npm run dev`; la comprobación fue contra Neon y `buildDayPlans`, que es lo que lee la app.
- Duda: el texto de `info` de zancada y hop jump lo redacté yo a partir del plan y de la descripción de la ficha (el plan no daba `info` para esos dos). La dosis (8 reps/pierna, 10 reps) es la del plan, no dictada por Adrián.
- Recomendación: dejarlo así; si Adrián quiere otra redacción o dosis, se cambia en `PROTOCOLS` de los dos HTML y se vuelve a lanzar `npm run db:update-anterior`.
- Bloquea a Adrián: no.
- Nota: `workflow/session.md` aparece modificado en el working tree por algo ajeno a este diff; no lo toqué ni lo incluí en el commit.
