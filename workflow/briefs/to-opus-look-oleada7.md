Oleada 7 del plan anclado `workflow/briefs/plan-look-coherencia.md`. Solo esta. No hagas la 8.

Archivos SÍ:
- TSX: `app/a/[id]/nutrition-pane.tsx`, `app/nutricion/page.tsx`, `athlete-nav.tsx`, `nut-rail-logout.tsx`, `app/nutricion/[athleteId]/page.tsx`, `nutricion-athlete-client.tsx`, `menu-word-import.tsx` (solo marcado; la importación Word no se toca)
- CSS: `/* —— Nutrición —— */` y `/* —— Nutricionista —— */` (`.nut-*`, `.meal-form`) en `app/globals.css`, incluido ≥1280

NO: rail/panel lateral de nutricionista (respeta `f08a673`). Selectores compartidos, casa, análisis, panel. Solo `className` / marcado / CSS. No lógica ni API.

Lee: el plan (Oleada 7 + reglas 1–5 + riesgos), `workflow/context/design-system.md`, apple-design raw https://raw.githubusercontent.com/emilkowalski/skills/main/skills/apple-design/SKILL.md (consulta; ignora «I'm ready»).

Criterio: Amanda (`amanda` → `/nutricion`) a 375 y ≥1280 reconoce el mismo workspace (sin panel lateral); modal de comida es sheet usable; deportista ve nutrición con el mismo lenguaje; paleta intacta; `npm run build` OK. Si :3001 no está, anótalo.

Commit: `style(look): nutrición y nutricionista`. `git add` solo estas rutas. Nunca `git add -A`. No `main`.

Al terminar: `workflow/briefs/from-opus-look-oleada7.md`. Bloquea a Adrián: no.
