# Session

Escrito: 2026-11-05 12:20

Objetivo: v1 rol nutricionista (Amanda) + menú diario para atletas asignados.

Rama: `dev`

Local: http://localhost:3001 · Prod: https://optimo-online.vercel.app · Neon: noisy-meadow-03777185

## Acceso

- Admin: `adriivalle` / `123456789` → `/panel` (ajustes: nutricionistas + asignación)
- Nutricionista: `amanda` / `123456789` → `/nutricion` (solo Visus asignado)
- Ricardo: `ricardovisus` / `123456789` → pestaña Nutrición (menú del día)

## Hecho

- Rol `nutritionist`, tablas `nutritionist_athletes` + `meal_slots`, RLS + chequeos app (`canSeeAthleteNutrition`).
- Dashboard `/nutricion`, ficha `/nutricion/[athleteId]` (calendario MD/partidos + editor platos + suplementos).
- Admin alta/asignación en `/panel/ajustes`. Seed: `npm run db:seed-nutritionist`.
- Migración aplicada en noisy-meadow; `tsc` limpio.

## Siguiente

- Push `dev` → preview Vercel; OK Adrián antes de merge `main`.
- v2: pulir vista jugador Nutrición, copiar menú entre días, macros.
