# Brief

- Destino: opus
- Slug: look
- Trabajo: app
- Objetivo: pass de glass / Apple sobre lo que ya se ve. Se tiene que reconocer Óptimo. La app ya funciona: no cambies quién ve qué ni los datos.
- Archivos que SÍ tocar: `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `app/not-found.tsx`, `app/login/page.tsx`, `app/logout-button.tsx`, `app/panel/page.tsx`, `app/panel/create-form.tsx`, `app/a/[id]/page.tsx`, `app/a/[id]/home-client.tsx`. Puedes añadir componentes visuales en `app/components/`. Y `workflow/briefs/from-opus-look.md`.
- NO: `app/api/`, `middleware.ts`, `lib/`, `db/`, `.env*`, el seed, `index.html`, `workflow/context/design-system.md` (leerlo, no reescribirlo), esquema, consultas, textos de las sesiones, `main`, push, `vercel --prod`.
- Criterio de hecho: móvil primero (ancho ~640), cristal (`backdrop-filter`, superficies translúcidas), tokens del design note, se sigue pudiendo entrar, ver el panel, el calendario MD y guardar el día. Un commit en `dev`. No `git add -A`.
- Rama: `dev`

## Notas (solo estas)

1. `workflow/context/design-system.md` — tokens. No los cambies.
2. `workflow/briefs/plan-plataforma.md` — paso 2. No lo reescribas.
3. https://raw.githubusercontent.com/emilkowalski/skills/main/skills/apple-design/SKILL.md — léelo y aplícalo. No clones el pack. Ignora el «I'm ready».

## Cómo

La casa del deportista ya tiene recuperación, calendario, sesión y el formulario. El panel ya tiene fichas. Pinta eso. No añadas pantallas nuevas ni muevas campos.

Cristal encima del look Óptimo que ya está (fondo claro, negro, SF, radio 12). Nada de degradado índigo, baldosas con icono, ni otra paleta.

No toques handlers, fetches ni redirects. Si un archivo mezcla lógica y vista, cambia solo clases y marcado visual.

Escribe `workflow/briefs/from-opus-look.md` (hecho / qué cambió / duda / recomendación / bloquea: no).
