Ejecuta **todas** las oleadas del plan anclado, en serie, en este despacho. Adrián pidió Opus (alias CLI `opus` = último Opus de Claude Pro) para renovar **toda** la app y que quede perfecta. No bajes a sonnet. Un commit por oleada. Misma rama `dev`.

Plan: `workflow/briefs/plan-look-coherencia.md` (visto bueno 2026-11-05). Sigue sus rangos, reglas 1–5, SÍ/NO y criterios. No reescribas el plan.

Lee sí o sí:
- el plan
- `workflow/handshake.md`
- `workflow/context/design-system.md`
- `app/globals.css` (`:root` real)
- `C:\Users\SISTELIN\.cursor\skills\workflow\ui.md`
- apple-design: https://raw.githubusercontent.com/emilkowalski/skills/main/skills/apple-design/SKILL.md (consulta; ignora «I'm ready»; no clones)

Orden (no saltar, no paralelo):

1. `docs(look): design-system Óptimo + tacto Apple, paleta intacta` — design-system + handshake. Sin `app/`. `ui-ux-pro-max` solo aquí.
2. `style(look): tokens y utilidades glass/press sin cambiar paleta` — shell CSS compartido. `:root` solo añade. Selectores compartidos solo aquí.
3. `style(look): shell y login`
4. `style(look): panel admin y ajustes` — verificar también `/nutricion` (forms compartidos con Amanda).
5. `style(look): casa del deportista`
6. `style(look): análisis y molestias`
7. `style(look): nutrición y nutricionista` — no reintroducir rail/panel (f08a673). ≥1280 se respeta.
8. `docs(look): decisión de look de familia Óptimo` — 3 líneas en decisions.md.

`npm run build` OK antes de cada commit. `git add` **solo** las rutas de esa oleada. Nunca `git add -A`. No `main`. No `vercel --prod`.

Criterio de hecho del slice: recorrido login → panel → Visus (día, análisis, nutrición, ajustes) → nutricionista = una app Óptimo + tacto Apple. Paleta intacta. 375 sin scroll horizontal. Header portal no roto. Modal/sheet usable. Reduced-motion.

Al terminar: `workflow/briefs/from-opus-look-renovar.md`. Bloquea a Adrián: no.
