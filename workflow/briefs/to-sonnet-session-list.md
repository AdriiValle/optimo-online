Implementa la oleada 2 del plan anclado. Un commit. No `main`. No Neon.

Plan: `workflow/briefs/plan-react-datos-look.md` (Oleada 2 — UI estructura).
From datos: `workflow/briefs/from-sonnet-plan-data.md` (ya en `dev`, commit `1514c7c`).

Rama: `dev`.

## Hacer

1. Nuevo `app/a/[id]/session-list.tsx` (client): sustituye `SessionTable` de `home-client.tsx`.
   - `section` → encabezado
   - `match` / `note` → nota
   - `protocol` → fila: label, qty a la derecha o debajo, `info` si existe, botón Vídeo que abre `VideoEmbedModal` igual que ahora (url + blurb).
   - Vacío: «Sin bloque asignado para este día.»
   - Sin `<table>`.

2. `app/a/[id]/home-client.tsx`:
   - Quitar `SessionTable`; usar `SessionList`.
   - `VENUE_SVG` pasa a JSX inline (`<svg>…</svg>`), sin `dangerouslySetInnerHTML`.
   - Nada más (no refactor del resto).

3. `app/globals.css`: clases nuevas de la lista al final, tokens existentes. Grep `.content-table*`: si nadie más las usa, quitarlas (incluido `.dash .content-table`). Conservar `.video-link` si la lista lo reutiliza, o mover estilos a clases de la lista.

## NO

- `lib/`, `db/`, `video-embed-modal.tsx` (importar sí, no editar), analisis, nutrición, marca, Neon, auth, `index.html`.

## Criterio

- No hay `<table>` en la ficha de sesión.
- Vídeo + blurb abren el modal.
- `dangerouslySetInnerHTML` fuera de `home-client.tsx`.
- `npm run build` OK.
- Commit: `feat(ficha): sesión del día como lista React, sin tabla`

Al terminar: `workflow/briefs/from-sonnet-session-list.md`.
