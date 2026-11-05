Oleada 4 del plan anclado `workflow/briefs/plan-look-coherencia.md`. Solo esta. No hagas 5–8. Worker: opus (UI de producto; Adrián pidió Opus para el look).

Archivos SÍ:
- TSX: `app/panel/page.tsx`, `create-form.tsx`, `deportistas-section.tsx`, `app/panel/ajustes/*`, `app/ajustes/*`, `app/components/username-form.tsx`, `password-form.tsx`
- CSS: solo `.settings-account-*`, `.create-overlay/.create-sheet/.create-form-head`, `.athlete-list/.athlete-card`, `.recovery-strip/.recovery-value`, `.form-grid`, `.photo-block` en `app/globals.css`. Selectores compartidos (regla 1) no se tocan: ya los cerró la oleada 2 (`0d8b00d`).

Lee: el plan (Oleada 4 + reglas 1–5), `workflow/context/design-system.md`, apple-design raw https://raw.githubusercontent.com/emilkowalski/skills/main/skills/apple-design/SKILL.md (consulta; ignora «I'm ready»).

Nota: `username-form` / `password-form` también los usa Amanda. Tras el cambio, `/nutricion` tiene que seguir bien. Solo `className` / marcado / CSS. No lógica, no API.

Criterio: `create-sheet` usable a 375 (cierre, scroll, teclado); lista de deportistas con press; paleta intacta; `npm run build` OK.

Commit: `style(look): panel admin y ajustes`. `git add` solo las rutas de esta oleada. Nunca `git add -A`. No `main`.

Al terminar: `workflow/briefs/from-opus-look-oleada4.md`. Bloquea a Adrián: no.
