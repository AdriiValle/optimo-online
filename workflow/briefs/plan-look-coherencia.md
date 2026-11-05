# Plan: look Óptimo + Apple (coherencia)

Cajón: app. Difícil (look de toda la app, decisión de marca ya tomada por Adrián).

Objetivo: un solo lenguaje visual en **todos** los apartados de Óptimo Online (admin, deportista, nutricionista). Tokens Óptimo. Tacto Apple (press, glass, sheets, reduced-motion). No inventar otra marca. Esta nota queda como patrón para el resto de apps Óptimo; este slice **no** pinta otros repos.

Rama: `dev`. Local: http://localhost:3001. Prod no se toca. Un commit por oleada. No `main`. No `vercel --prod`.

Estado: **visto bueno Opus 2026-11-05** (Paso 0 cerrado). Siguiente: Oleada 1.

## Decisión de look

**Óptimo + apple-design.** Ningún `DESIGN.md` de otra marca (Linear, Nike, Oura, Raycast, BMW M, Apple-catálogo) como paleta ni como sistema. Las otras apps Óptimo tienen que reconocerse en esta.

Hijos: `apple-design` (SKILL.md público de Emil: consultar raw, no clonar, no copiar al repo). `ui-ux-pro-max` **solo** en Oleada 1 para regenerar `workflow/context/design-system.md`. Cero `scroll-world`. Cero React Bits. Addy `frontend-ui-engineering` fuera de este corte.

## Hecho del código que manda el orden (anclado 2026-11-05)

- **Todo** el estilo vive en `app/globals.css` (1461 líneas). No hay `style={}`, ni CSS modules, ni Tailwind.
- Consecuencia: cada oleada de superficie edita `globals.css` → **no hay paralelo**. Todas las oleadas van **en serie**, en el mismo árbol, una tras otra.
- No se parte `globals.css` en varios archivos en este slice (riesgo de orden de cascada en el app router; no lo pide nadie).
- `:root` ya tiene los tokens Óptimo + `--glass*` + `--header-*`. Ya hay bloques `prefers-reduced-transparency`, `prefers-contrast: more` y `prefers-reduced-motion` (L668, L680, L1171, L1421, L1440, L1458). Solo 8 `:active` en todo el CSS → el press es el hueco grande.
- `workflow/context/design-system.md` está viejo (no nombra glass ni header).

## Supuestos

- Paleta, tipo y marca Óptimo se **conservan**: no cambia ningún valor de `--bg --surface --text --secondary --line --fill-secondary --accent --accent-hover --font`. El lavado es ritmo, jerarquía, glass, press, sheets, coherencia entre rutas.
- Auth, Neon, RLS, APIs, queries, Word import, Whoop/Polar: no tocar. Ningún cambio de lógica, props, fetch ni estado en los `.tsx`; solo `className` y marcado.
- Móvil primero (375 / 640). Desktop se mantiene donde ya existe: nutricionista ≥1280 (`.doc-header-viewport--wide`, `.nut-ws-*`), análisis ≥520, header ≥720.
- Otros gits Óptimo: fuera.

## Archivos SÍ / NO (global)

SÍ: `workflow/context/design-system.md`, `workflow/handshake.md` (una línea de look), `workflow/context/decisions.md` (cierre), `app/globals.css`, `app/**/*.tsx` de UI solo `className` / marcado.

NO: `lib/`, `db/`, `app/api/**`, `middleware.ts`, auth, Neon, `index.html`, `plan-visus.html`, `app/nutricion/athlete-nav-shared.ts`, otros repos.

## Reglas para todas las oleadas

1. **Selectores compartidos solo en Oleada 2.** `.page .card .stack .error .ok .icon-btn .btn* .btn-ghost label input/select/textarea .section-head-* .doc-header-viewport* .header-* .top-actions .avatar .sr-only` y los bloques `@media (prefers-*)`. Si una oleada de superficie necesita algo distinto, añade un modificador con el prefijo de su zona (`.an-…`, `.nut-…`, `.session-…`), no edita el compartido.
2. Cada oleada edita **solo** su bloque de `globals.css` (rangos abajo, aprox.; manda el comentario `/* —— … —— */`).
3. `git add` **solo** las rutas de la oleada. Nunca `git add -A` / `.` (hay `.gitignore`, `.tmp-verify/`, `workflow/inbox/` y briefs de otros sin commitear).
4. `npm run build` OK antes del commit. Revisión a 375 px en :3001 de las rutas de la oleada.
5. Nada de titular con degradado, iconos en baldosa, emojis decorativos, sombras nuevas fuera de `--shadow-sm/md`, colores nuevos fuera de tokens.

## Oleadas (todas en serie)

### Oleada 1 — design-system (opus, -Think)

Archivos SÍ: `workflow/context/design-system.md`, `workflow/handshake.md` (línea `Look`: Óptimo + apple-design, paleta intacta, patrón para otras apps Óptimo).

Lee `~/.claude/skills/workflow/ui.md` (anti-slop), el `design-system.md` actual y el `:root` real de `app/globals.css`. Consulta `apple-design` SKILL.md raw. `ui-ux-pro-max` solo para dar forma a la nota. No pinta CSS.

Criterio: la nota cabe en una pantalla; tokens copiados del `:root` real (incluye `--glass*`, `--header-*`); define glass / press (escala + duración) / sheet / foco / reduced-motion y reduced-transparency; lista de prohibidos (regla 5). Handshake alineado. Diff sin `app/`.

Commit: `docs(look): design-system Óptimo + tacto Apple, paleta intacta`.

### Oleada 2 — shell CSS compartido (opus, -Think)

Archivos SÍ: `app/globals.css` solo `:root` (añadir, no cambiar valores), base `html/body`, y selectores compartidos de la regla 1 (≈ L1–L290 + L591–L700 header/top-actions/logout + `.btn-ghost` ≈ L1137 + bloques `@media (prefers-*)`).

Hace: tokens nuevos de movimiento (`--ease`, `--dur-press`, `--press-scale`) y de foco; press `:active` + `:focus-visible` en `.icon-btn`, `.btn-ghost`, `.card` clicable (`.btn` ya tiene `scale(0.97)` en L180: pasarlo a los tokens); una sola salida `prefers-reduced-motion` que anule press/transiciones; unificar los bloques `prefers-reduced-transparency` / `prefers-contrast` duplicados sin perder selectores.

Criterio: ningún valor de color cambia (`git diff` en `:root` solo añade líneas); todas las rutas cargan igual o mejor; `npm run build` OK.

Commit: `style(look): tokens y utilidades glass/press sin cambiar paleta`.

### Oleada 3 — A: shell y login (opus o sonnet)

TSX: `app/layout.tsx`, `app/components/brand-header.tsx`, `header-actions.tsx`, `header-back-button.tsx`, `app/logout-button.tsx`, `app/login/page.tsx`, `app/not-found.tsx`, `app/page.tsx`.
CSS: bloque `/* —— Login —— */` (≈ L1411–L1461) y `.brand-row/.brand-logo/.brand-sep`.

Criterio: login a 375 se siente app; header portal sigue fijo y sobre el contenido; logout y back con press.

Commit: `style(look): shell y login`.

### Oleada 4 — B: panel admin y ajustes (sonnet)

TSX: `app/panel/page.tsx`, `create-form.tsx`, `deportistas-section.tsx`, `app/panel/ajustes/*`, `app/ajustes/*`, `app/components/username-form.tsx`, `password-form.tsx`.
CSS: `.settings-account-*`, `.create-overlay/.create-sheet/.create-form-head`, `.athlete-list/.athlete-card`, `.recovery-strip/.recovery-value`, `.form-grid`, `.photo-block`.

Nota: `username-form` / `password-form` también los usa `nutricion-athlete-client.tsx`; esta oleada es su única dueña. Revisar también la cuenta de Amanda en `/nutricion` tras el cambio.

Criterio: `create-sheet` es sheet usable a 375 (cierre, scroll, teclado); lista de deportistas con press.

Commit: `style(look): panel admin y ajustes`.

### Oleada 5 — C: casa deportista (opus, -Think)

TSX: `app/a/[id]/page.tsx`, `home-client.tsx`, `session-list.tsx`, `video-embed-modal.tsx`, `device-card.tsx`, `app/components/plan-calendar.tsx`.
CSS: `.cal-*`, `.week-tape/.tape-*`, `.venue-icon`, `.day-focus*`, `.video-embed-*`, `.dash*`, `.avatar-sm`, `.recovery-sm`, `.day-line`, `.device-*` (≈ L1144–L1183, sin `.btn-ghost`), `/* —— Sesión del día —— */`.

Criterio: `/a/[id]` a 375 sin scroll horizontal; tabs y cinta de semana con press; modal de vídeo usable y con reduced-motion; datos y tabs idénticos.

Commit: `style(look): casa del deportista`.

### Oleada 6 — D: análisis y molestias (sonnet)

TSX: `app/a/[id]/analisis.tsx` (las molestias viven aquí; no hay ruta `registro` aparte).
CSS: `/* —— Análisis (admin) —— */` (`.an-*`, ≈ L1184–L1345).

Criterio: gráficas legibles a 375; chips con press; ≥520 igual o mejor.

Commit: `style(look): análisis y molestias`.

### Oleada 7 — E: nutrición deportista + nutricionista (opus, -Think)

TSX: `app/a/[id]/nutrition-pane.tsx`, `app/nutricion/page.tsx`, `athlete-nav.tsx`, `nut-rail-logout.tsx`, `app/nutricion/[athleteId]/page.tsx`, `nutricion-athlete-client.tsx`, `menu-word-import.tsx` (solo marcado; la importación no se toca).
CSS: `/* —— Nutrición —— */` y `/* —— Nutricionista —— */` (`.nut-*`, `.meal-form`, ≈ L771–L1136), incluido ≥1280.

Criterio: Amanda (`amanda` → `/nutricion`) a 375 y a ≥1280 reconoce el mismo workspace (sin panel lateral, commit f08a673 se respeta); modal de comida es sheet usable; deportista ve su nutrición con el mismo lenguaje.

Commit: `style(look): nutrición y nutricionista`.

### Oleada 8 — cierre (sonnet)

`workflow/context/decisions.md`: 3 líneas (look = Óptimo + Apple; no Design.md ajeno; `design-system.md` es el patrón de familia). Recorrido local completo.

Commit: `docs(look): decisión de look de familia Óptimo`.

## Riesgos

- `globals.css` es un solo archivo: dos workers a la vez lo corrompen. Serie estricta.
- Header en portal a `document.body` (`.doc-header-viewport`): tocar `position`/`z-index` rompe todas las rutas. Solo Oleada 2.
- Nutricionista desktop recién reordenado (f08a673, 5ea22f4): Oleada 7 no reintroduce rail/panel.
- Forms compartidos con Amanda: Oleada 4 los toca, verificar `/nutricion`.
- `backdrop-filter` en muchas capas = jank en móvil viejo: no añadir capas de glass nuevas, reutilizar `--glass*`.
- Árbol sucio de otros: regla 3.

## Criterio de hecho del slice

Adrián recorre login → panel → Visus (día, análisis, nutrición, ajustes) → nutricionista y ve **una** app. Paleta Óptimo. Tacto Apple. Otras apps Óptimo no tocadas.
