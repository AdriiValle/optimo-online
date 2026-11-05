# Session

Escrito: 2026-11-05 12:55

Objetivo: v2 workspace desktop nutricionista (Amanda) — grid semanal + panel clínico.

Rama: `dev`

Local: http://localhost:3001 · Prod: https://optimo-online.vercel.app · Neon: noisy-meadow-03777185

## Acceso

- Admin: `adriivalle` / `123456789` → `/panel` (ajustes: nutricionistas + asignación)
- Nutricionista: `amanda` / `123456789` → `/nutricion` (desktop ≥1280: sidebar + calendario + grid semana + panel plato)
- Ricardo: `ricardovisus` / `123456789` → pestaña Nutrición (menú del día, móvil sin cambios)

## Hecho

- v1 nutricionista (rol, meal_slots, RLS) + v2 desktop en `/nutricion/**` (lista persistente, calendario MD, grid Lun–Dom × D/C/Ce, panel plato/suplementos/notas).
- Briefs: `research-clinica-nutricion.md`, `to-opus-nutri-desktop.md`, `from-opus-nutri-desktop.md`.

## Siguiente

- Push `dev` → preview Vercel; OK Adrián antes de merge `main`.
- Futuro: copiar menú entre días, estado en lista pacientes (MD hoy, menú incompleto).
