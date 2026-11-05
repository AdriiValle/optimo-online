# Session

Escrito: 2026-11-05 14:05

Objetivo: import Word (.docx) → `meal_slots` lunch/dinner en workspace Amanda.

Rama: `dev`

Local: http://localhost:3001 · Prod: https://optimo-online.vercel.app · Neon: noisy-meadow-03777185

## Hecho

- Parser tablas Word (mammoth+cheerio): bloques, plantillas 3–4, dedupe semanas, ALMUERZO/CENA → lunch/dinner.
- `POST /api/nutrition/menu-import` (RLS nutricionista; PDF rechazado).
- Botón «Subir menú Word (.docx)» en grid semanal + lunes de inicio.
- Probado `EJEMPLO DE MENU.docx` → Visus (14 slots, semana anclada al lunes ISO elegido).

## Siguiente

- Preview Vercel `dev`; OK Adrián antes de merge `main`.

