# Session

Escrito: 2026-11-05 13:05

Objetivo: layout v2 nutricionista — full-bleed, rail con Ajustes, drawer al clicar celda (sin panel derecho).

Rama: `dev`

Local: http://localhost:3001 · Prod: https://optimo-online.vercel.app · Neon: noisy-meadow-03777185

## Acceso

- Admin: `adriivalle` / `123456789` → `/panel` (ajustes: nutricionistas + asignación)
- Nutricionista: `amanda` / `123456789` → `/nutricion` (desktop ≥1280: rail + calendario + grid; drawer comida/ajustes)
- Ricardo: `ricardovisus` / `123456789` → pestaña Nutrición (sin cambios)

## Hecho

- v2 desktop nutricionista (grid semanal, calendario MD).
- layout2: header `wide`, grid 2 cols, drawer slot + Ajustes (`NutritionPane`), Salir en rail desktop.
- Briefs: `to-opus-nutri-layout2.md`, `from-opus-nutri-layout2.md`.

## Siguiente

- Preview Vercel en `dev`; OK Adrián antes de merge `main`.
- Futuro: copiar menú entre días, estado en lista pacientes.
