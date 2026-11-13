# Design system v2: Apple como base

Fuentes: `workflow/context/apple-DESIGN.md` (catálogo getdesign.md, marca Apple) + skill apple-design (Emil Kowalski, WWDC → web). **Primero Apple; lo que cambia está en la tabla de abajo, y eso es «el sistema Óptimo».** Sustituye la regla «paleta intacta» de v1. Se conservan el logo y la paleta de categorías de proteína. Todo vive en `app/styles/tokens.css` (`:root`); ningún color, sombra, radio ni duración fuera de tokens.

## Decisiones fijadas

1. **Acento = azul de sistema Apple, solo para lo interactivo.** Botón principal, enlaces, selección, foco, toggle encendido, pestaña activa. El texto sigue en negro Apple `--label` (#1D1D1F). Nada decorativo en azul (ni títulos, ni iconos sin acción, ni bordes de tarjeta).
2. **Tipografía = SF del sistema, Inter de respaldo.** Stack `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", var(--font-inter), system-ui, "Segoe UI", Roboto, sans-serif`. En Apple sale SF Pro real; en Windows/Android, Inter servido con `next/font/google` (`Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" })`, la clase va en `<html>` en `app/layout.tsx`). Inter va **antes** de `system-ui`, si no Windows pinta Segoe. SF no se sirve como webfont (licencia).
3. **Jugador: tab bar inferior** (móvil primero), a todos los anchos; el contenido nunca queda debajo.
4. **Admin: toolbar + large title, sin sidebar** (escritorio primero).
5. **Amanda: toolbar + sidebar de deportistas** (su columna actual) + área de trabajo (escritorio ≥1280).
6. **Categorías de proteína se conservan** tal cual (son función, no estilo).
7. **Modo oscuro no entra ahora.** Los tokens se nombran por rol (`--label`, `--surface`, `--fill`…), nunca por color (`--blue`, `--gray-200`), para añadir `prefers-color-scheme: dark` después redefiniendo solo `:root`.
8. **Logo Óptimo se conserva** (sin reteñir de azul).

## Apple → Óptimo

| Apple | Óptimo | Por qué |
|---|---|---|
| Tinta #1D1D1F en todo texto | **Tal cual** (`--label`) | |
| Lienzo parchment #F5F5F7 + superficies blancas | **Tal cual** (`--bg`, `--surface`): patrón «grouped» de iOS, tarjetas blancas sobre parchment | |
| Un solo azul interactivo (#0066CC web, #007AFF iOS) | **Cambia el tono**: relleno `--accent` #0071E3 y texto azul `--accent-text` #0066CC | #007AFF da 4.0:1 con texto blanco (no AA); #0071E3 da 4.7:1, #0066CC da 5.6:1 en blanco y 5.1:1 en parchment. Son los azules de apple.com |
| Secundario iOS `secondaryLabel` (gris al 60 %) | **Cambia**: `--label-secondary` #6E6E73 (gris de apple.com) | #86868B de v1 da 3.6:1: no llega a AA en texto pequeño |
| Escala marketing (56/40/34 px) | **Cambia**: escala Dynamic Type de iOS (Large Title…Caption) | Es una app, no una página de producto |
| Cuerpo a 17 px | **Tal cual** en jugador y en lectura. En tablas y sidebar de escritorio, Subhead 15 | Densidad de escritorio (macOS usa 13) |
| Pesos 300/400/600/700, sin 500 | **Sin 300 ni 500**: 400 / 600 / 700 | 300 es atmósfera de marketing; en datos pierde legibilidad |
| Tracking negativo en titulares | **Tal cual**, en `em` y un valor por tamaño válido para SF e Inter | CSS no sabe qué fuente resolvió; valores intermedios sirven para ambas |
| Botón pill azul + botón utilitario 8 px | **Tal cual**: acciones = cápsula; botones compactos de toolbar escritorio = 8 px | |
| Press `scale(0.95)` en botones | **Cambia**: 0.97 en botones/chips, 0.985 en tarjetas; filas de lista resaltan fondo, no escalan | Skill apple-design: menos brusco en superficies grandes; filas como iOS |
| Una sola sombra, solo bajo fotos de producto | **Cambia**: tarjetas **planas** (sin sombra, se separan por color de superficie); sombra solo en lo que flota (thumb, popover, sheet) | No hay producto que fotografiar; iOS sí eleva lo flotante |
| Sub-nav parchment 80 % + blur | **Amplía** a 3 materiales (thin/regular/thick) para toolbar, tab bar, sheet | Skill apple-design §12 |
| Nav global negra de 44 px | **No se toma**: toolbar claro de material con el logo | La negra es de la web de marketing |
| Bandas oscuras alternas, fotografía protagonista | **No se toma**: protagonistas = cifras, anillos, plan | App de datos; oscuro diferido |
| Radios 5/8/11/18/pill | **Ajusta**: 6/8/12/18/20/pill | 11 → 12 por la rejilla de 4; 20 para sheets |
| Espaciado base 8 con 17 px | **Ajusta**: rejilla estricta 4/8 (17 → 16) | |
| Foco 2 px #0071E3 | **Tal cual** (`--focus-ring`; antes negro) | |
| Sin degradados | **Tal cual** | |
| Error/validación no documentados | **Añade** rojo/verde/naranja de iOS en variantes accesibles (`--danger/--ok/--warn`) | Los de sistema (#FF3B30, #34C759, #FF9500) no llegan a 4.5:1 |
| Sin categorías de alimento | **Añade** `--cat-*` (sección propia) | Función de nutrición |
| No documenta hover | Hover solo en `@media (hover: hover)`: fondo `--fill-quaternary` o `--accent-hi` | Escritorio de admin/Amanda |

## Tokens (`:root`, copiables)

```css
:root {
  /* Superficies */
  --bg: #F5F5F7;                 /* lienzo (parchment) */
  --surface: #FFFFFF;            /* tarjetas, listas, sheets opacos */
  --surface-sidebar: #F5F5F7;    /* sidebar de Amanda: mismo lienzo, sin tarjeta */
  /* Texto */
  --label: #1D1D1F;              /* 16.8:1 en blanco */
  --label-secondary: #6E6E73;    /* 5.1:1 en blanco, 4.7:1 en --bg */
  --label-tertiary: #86868B;     /* 3.6:1: solo placeholder (nunca sustituye a la etiqueta), metadatos no esenciales, glifos */
  --label-quaternary: #AEAEB2;   /* deshabilitado (nunca texto que haya que leer) */
  --label-on-tint: #424245;      /* secundario sobre fondos teñidos (--cat-*-tint, --*-tint) */
  /* Rellenos (alfa iOS: se adaptan al fondo y preparan oscuro) */
  --fill: rgba(120,120,128,.20);
  --fill-secondary: rgba(120,120,128,.16);   /* pista del segmentado, chips grises */
  --fill-tertiary: rgba(118,118,128,.12);    /* campos de búsqueda, botón gris */
  --fill-quaternary: rgba(116,116,128,.08);  /* resalte de fila al pulsar, hover */
  /* Separadores */
  --separator: #D2D2D7;          /* entre filas, bordes de campo */
  --separator-soft: rgba(0,0,0,.08); /* filete de tarjeta blanca sobre blanco, borde de barra */
  /* Acento (solo interactivo) */
  --accent: #0071E3;             /* relleno de botón, foco, toggle, pestaña activa */
  --accent-hi: #0077ED;          /* hover de botón relleno (solo hover:hover) */
  --accent-text: #0066CC;        /* enlace y botón plain sobre blanco/--bg */
  --accent-tint: rgba(0,113,227,.12); /* fondo de chip/fila seleccionada; texto encima: --accent-text (4.7:1 sobre --surface; sobre --bg el chip lleva base --surface) */
  --on-accent: #FFFFFF;
  /* Semántica (variantes accesibles de iOS; todas ≥5:1 en blanco) */
  --danger: #D70015;   --danger-tint: rgba(215,0,21,.08);
  --ok: #1E7B34;       --ok-tint: rgba(30,123,52,.10);
  --warn: #B25000;     --warn-tint: rgba(178,80,0,.10);
  /* Anillos de nutrición (clase .nut-ring--{estado}) */
  --ring-track: var(--fill-secondary);
  --ring-low: var(--label-secondary);   /* «Falta»: neutro, aún en camino */
  --ring-ok: var(--ok);                 /* «En rango» */
  --ring-over: var(--warn);             /* «Pasado» del objetivo: aviso, no error */
  --ring-cap-ok: var(--ok);             /* «Bajo tope» */
  --ring-cap-over: var(--danger);       /* «Sobre tope»: el único rojo */
  --ring-partial: var(--label-tertiary);/* «Parcial»: día incompleto; pista discontinua */
  --macro-p: var(--label); --macro-c: #6E6E73; --macro-f: #AEAEB2; /* se conservan */

  /* Tipografía */
  --font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", var(--font-inter), system-ui, "Segoe UI", Roboto, sans-serif;
  --t-large-title: 700 2.125rem/1.2 var(--font);   --ls-large-title: -0.022em; /* 34/41 */
  --t-title-1: 700 1.75rem/1.214 var(--font);      --ls-title-1: -0.02em;      /* 28/34 */
  --t-title-2: 600 1.375rem/1.273 var(--font);     --ls-title-2: -0.016em;     /* 22/28 */
  --t-title-3: 600 1.25rem/1.25 var(--font);       --ls-title-3: -0.014em;     /* 20/25 */
  --t-headline: 600 1.0625rem/1.294 var(--font);   --ls-headline: -0.012em;    /* 17/22 */
  --t-body: 400 1.0625rem/1.47 var(--font);        --ls-body: -0.012em;        /* 17/25 párrafo */
  --t-body-row: 400 1.0625rem/1.294 var(--font);                               /* 17/22 filas y controles */
  --t-callout: 400 1rem/1.3125 var(--font);        --ls-callout: -0.01em;      /* 16/21 */
  --t-subhead: 400 0.9375rem/1.333 var(--font);    --ls-subhead: -0.008em;     /* 15/20 */
  --t-footnote: 400 0.8125rem/1.385 var(--font);   --ls-footnote: -0.004em;    /* 13/18 */
  --t-caption: 400 0.75rem/1.333 var(--font);      --ls-caption: 0;            /* 12/16 */
  --t-caption-2: 400 0.6875rem/1.182 var(--font);  --ls-caption-2: 0.006em;    /* 11/13: mínimo absoluto */

  /* Radios (concéntricos: radio interior = exterior − padding) */
  --radius-xs: 6px;     /* etiquetas, badges */
  --radius-sm: 8px;     /* botón compacto de toolbar, imagen dentro de tarjeta, thumb del segmentado */
  --radius-md: 12px;    /* campos, lista agrupada inset, pista del segmentado */
  --radius-lg: 18px;    /* tarjetas */
  --radius-sheet: 20px; /* esquinas superiores del sheet móvil; modal escritorio */
  --radius-pill: 9999px;/* botones de acción, chips, búsqueda, tab activa */

  /* Materiales (nunca uno claro sobre otro claro) */
  --material-thin: rgba(255,255,255,.55);     --blur-thin: blur(12px) saturate(180%);
  --material-regular: rgba(250,250,252,.72);  --blur-regular: blur(20px) saturate(180%);
  --material-thick: rgba(255,255,255,.88);    --blur-thick: blur(30px) saturate(180%);
  --material-edge: inset 0 1px 0 rgba(255,255,255,.7); /* luz en el borde superior */
  --scrim: rgba(0,0,0,.30);

  /* Elevación (solo lo que flota; tarjetas = --elev-0) */
  --elev-0: none;
  --elev-1: 0 3px 8px rgba(0,0,0,.12), 0 3px 1px rgba(0,0,0,.04);      /* thumb de segmentado/toggle */
  --elev-2: 0 8px 24px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.04);     /* popover, menú, toast */
  --elev-3: 0 24px 64px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.04);    /* modal escritorio, sheet */

  /* Espaciado (rejilla 4/8) */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px; --space-5: 20px;
  --space-6: 24px; --space-8: 32px; --space-10: 40px; --space-12: 48px; --space-16: 64px;
  --gutter: 16px;                 /* margen lateral móvil; 24px ≥720; 32px ≥1024 */
  --row-inset: 16px;              /* sangría del separador de fila */

  /* Movimiento (CSS; equivalentes de los springs de Apple) */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);     /* spring crítico (damping 1.0): por defecto */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);  /* reposicionar algo que ya está en pantalla */
  --ease-bounce: cubic-bezier(0.34, 1.3, 0.64, 1);/* damping ~0.8: SOLO tras un gesto con impulso */
  --dur-press: 100ms;   /* entrada del press */
  --dur-fast: 150ms;    /* color, opacidad, hover */
  --dur: 220ms;         /* salida del press, cambios de estado */
  --dur-sheet: 360ms;   /* sheet/modal (≈ response 0.3 s) */
  --dur-move: 400ms;    /* reposicionar (≈ response 0.4 s) */
  --press-scale: 0.97;  --press-scale-lg: 0.985;

  /* Táctil y foco */
  --tap-min: 44px;      /* acción primaria, fila, tab, icon-btn en táctil */
  --tap-compact: 32px;  /* solo pointer fino (toolbar escritorio), con ≥8px de aire */
  --focus-ring: 2px solid var(--accent);  --focus-offset: 2px;

  /* Barras */
  --navbar-h: 44px;     /* barra superior móvil */
  --toolbar-h: 52px;    /* toolbar escritorio */
  --tabbar-h: 49px;     /* + env(safe-area-inset-bottom) */
  --sidebar-w: 300px;   /* Amanda */
}
```

**Alias de transición** (en `tokens.css` hasta la Oleada 4, luego se borran): `--text: var(--label)`, `--secondary: var(--label-secondary)` (sube de #86868B a #6E6E73, a propósito), `--line: var(--separator)`, `--radius: var(--radius-md)`, `--shadow-sm: var(--elev-1)`, `--shadow-md: var(--elev-2)`, `--glass: var(--material-thin)`, `--glass-row: var(--material-regular)`, `--glass-strong: var(--material-thick)`, `--glass-blur: var(--blur-regular)`, `--glass-highlight: var(--material-edge)`, `--ease: var(--ease-out)`, `--accent-hover: var(--label-on-tint)` (en v1 era texto gris oscuro, no hover). `--radius-sm` pasa de 10 a 8. `--accent` **cambia de negro a azul**: F3 revisa sus usos y pasa a `--label` los que no sean interactivos.

## Uso de tipo

- Utilidades `.t-large-title … .t-caption-2` en `components.css` (`font: var(--t-x); letter-spacing: var(--ls-x)`). En rem: respeta el tamaño de letra del usuario.
- Large Title: uno por pantalla, alineado a la izquierda, arriba del contenido. Title 2/3: secciones. Headline: título de fila/tarjeta. Footnote: pie de grupo y ayuda. Caption 2: solo etiquetas de tab bar.
- Cifras: `font-variant-numeric: tabular-nums`. Jerarquía por peso + tamaño, nunca por un color nuevo. `-webkit-font-smoothing: antialiased`; `font-optical-sizing: auto`.

## Componentes (gramática que pinta F3)

- **Botones** (cápsula, `--radius-pill`; alto 50 grande, 44 normal, 32 solo pointer fino): *relleno* `--accent` + `--on-accent` (uno por vista: la acción principal); *tintado* `--accent-tint` + `--accent-text`; *gris* `--fill-tertiary` + `--label`; *plain* texto `--accent-text`; *destructivo* texto `--danger` (relleno `--danger` solo en la confirmación final). Pendiente: etiqueta se mantiene, spinner 16px a la izquierda, `aria-busy`. Deshabilitado: opacidad .4, sin press.
- **Campos**: `--surface`, borde 1px `--separator`, `--radius-md`, alto 44, texto `--t-body-row`; etiqueta encima en `--t-footnote` `--label-secondary`; foco = borde `--accent` + `--focus-ring`; error = borde `--danger` + mensaje Footnote `--danger` debajo (validar en línea, no al enviar).
- **Lista agrupada inset**: grupo `--surface` `--radius-md`, filas ≥44 (`--t-body-row`), separador 1px `--separator` con sangría `--row-inset`, sin separador tras la última. Título de grupo Footnote `--label-secondary`, pie Footnote. Pulsar = fondo `--fill-quaternary`. Disclosure: chevron `--label-tertiary` 13px.
- **Tarjeta**: `--surface`, `--radius-lg`, padding `--space-4` (móvil) / `--space-6` (escritorio), `--elev-0`. Si va sobre blanco, filete `--separator-soft`.
- **Segmentado**: pista `--fill-secondary` `--radius-md` alto 32 (36 en táctil, con el tap de la fila a 44); thumb `--surface` `--radius-sm` `--elev-1`; texto `--t-subhead` 600 activo / 400 inactivo. Se desliza con `--dur` `--ease-out`.
- **Toggle**: 51×31, encendido `--accent`, apagado `--fill`, knob blanco `--elev-1`. El estado también en texto o `aria-checked`.
- **Chips**: cápsula, alto 32 (fila táctil 44), `--fill-tertiary` / seleccionado `--accent-tint` + `--accent-text`.
- **Sheet/modal**: scrim `--scrim`. Móvil (<720): anclado abajo, `--radius-sheet` arriba, `--material-thick` + `--blur-thick` (o `--surface` en clínico), sube en `--dur-sheet --ease-out`, sale por el mismo camino, scroll interno, cerrar 44×44 arriba a la derecha, asa 36×5 `--fill`. ≥720: centrado, `--radius-sheet`, `--surface`, `--elev-3`, escala 0.96→1 desde el disparador. Fondo bloqueado mientras está abierto.
- **Estados vacío/carga/error**: Headline + Subhead `--label-secondary` + (si hay) un botón tintado. Carga = esqueleto `--fill-quaternary` con pulso de opacidad 1.2 s (no shimmer). Error = `--danger-tint` + texto `--danger`.
- **Alerta inline**: fondo `--{danger|ok|warn}-tint`, texto `--label`, icono/filete del color semántico, `role="alert"` o `status`.

## Categoría de proteína (se conserva)

```css
/* Ink = filete/punto/etiqueta sobre blanco; tint = fondo de la celda y placeholder. */
--cat-carne: #9A5B45;      --cat-carne-tint: #F4EAE5;      /* terracota */
--cat-pescado: #557083;    --cat-pescado-tint: #E7EDF1;    /* pizarra */
--cat-huevos: #8F7234;     --cat-huevos-tint: #F5EFE1;     /* ocre */
--cat-legumbres: #687A4E;  --cat-legumbres-tint: #ECEFE4;  /* oliva */
--cat-none: var(--label-tertiary); --cat-none-tint: var(--fill-quaternary);
--cat-rule: 3px;  /* filete izquierdo; 4px en prefers-contrast */
```

- `.nut-cat--{carne|pescado|huevos|legumbres|none}` expone `--cat-ink` / `--cat-tint`. Origen: corchete `[CARNE]` del import Word (`lib/nutrition/protein-category.ts`).
- Texto secundario en celda teñida: `--label-on-tint` (`--label-secondary` no llega a 4.5:1 sobre tint).
- El color nunca va solo (texto o `aria-label`). Mixta → color de la primera; `LEGUMBRES/P. VEGETAL` → legumbres; sin corchete → `none`. Placeholder: tint liso + nombre en texto, sin icono ni degradado.
- Las categorías no son acento: nunca azul, y el azul nunca marca una categoría.

## Tacto y movimiento

- **Press** en `:active` (al tocar, no al soltar): entra en `--dur-press ease-out`, vuelve en `--dur --ease-out`. Botones/chips/tabs `--press-scale`; tarjetas `--press-scale-lg`; filas de lista: fondo `--fill-quaternary`, sin escala.
- **Springs**: por defecto críticos (`--ease-out`, sin rebote). `--ease-bounce` solo cuando el usuario soltó algo con impulso (arrastrar un sheet). Un menú o sheet abierto con un toque no rebota. No se añade librería de animación en este rediseño.
- **Coherencia espacial**: sale por donde entró; popovers y modales escalan desde el disparador (`transform-origin`).
- Solo se animan `transform` y `opacity` (más `stroke-dasharray` de los anillos). Nada bloquea la entrada durante una transición.
- **Materiales**: toolbar, navbar y tab bar = `--material-regular` + `--blur-regular`; sheet y popover = `--material-thick` + `--blur-thick`; chips sobre foto = `--material-thin`. Borde de barra: 1px `--separator-soft` en el lado que toca el contenido. Sin `backdrop-filter`: `@supports not (backdrop-filter: blur(1px))` → `--surface`.

## Layout por dispositivo

Comprobar sin scroll horizontal a **390** (`scrollWidth <= 390`), 720, 1280.

- **Jugador (móvil primero)**: navbar 44 de material (logo / atrás + acciones) → Large Title en el contenido → columna `.page` max 640 centrada, margen `--gutter`. **Tab bar** fija abajo a todo ancho, `--material-regular`, alto `calc(var(--tabbar-h) + env(safe-area-inset-bottom))`, ítems repartidos (contenido interior max 640); icono 24 + etiqueta `--t-caption-2` 600; activo `--accent`, inactivo `--label-secondary`; cada ítem ≥44×44; `aria-current="page"`. El contenido reserva `padding-bottom` = alto de la barra + `--space-4`. Ítems = las secciones que hoy son `dash-tabs` (las define la pista A).
- **Admin (escritorio primero)**: toolbar sticky `--toolbar-h` de material (logo a la izquierda, acciones a la derecha, botones compactos `--radius-sm` permitidos con pointer fino) → Large Title alineado a la izquierda bajo el toolbar → contenido max 1080, `--gutter` 32 ≥1024. Sin sidebar. Tablas/listas densas en `--t-subhead`. <720 se comporta como móvil (navbar 44, gutter 16), sin tab bar.
- **Amanda (escritorio ≥1280)**: toolbar igual que admin + **sidebar** de deportistas `--sidebar-w` sobre `--surface-sidebar`, sticky bajo el toolbar, scroll propio; filas `--t-subhead` ≥44; seleccionada = relleno `--accent` + texto `--on-accent` (selección de sidebar de iPadOS/macOS). Área de trabajo a la derecha, fluida, tarjetas `--surface`. <1280: la sidebar es la pantalla de lista y la ficha se abre encima con botón atrás (pila de navegación).

## Accesibilidad

- Texto ≥4.5:1 (grande ≥3:1); glifos y bordes de control ≥3:1. Valores de arriba ya verificados en blanco y `--bg`.
- `:focus-visible` = `--focus-ring` + `--focus-offset` en todo lo tocable; nunca quitar foco sin sustituto. Orden de tab = orden visual.
- Táctil ≥44×44 en acciones primarias, filas y tabs; `--tap-compact` solo bajo `@media (pointer: fine)`.
- Color nunca solo (anillos, categorías, errores llevan texto). Tamaños en rem; nada por debajo de 11px.
- **Preferencias**: cada hoja pone sus reglas al final de sí misma (no en `a11y.css`, que es de F3/T-común):
  - `prefers-reduced-motion: reduce` → sin transform ni deslizamientos; press y sheets = fundido de opacidad `--dur-fast` o nada; sin `--ease-bounce`.
  - `prefers-reduced-transparency: reduce` → materiales a `--surface` opaco, sin `backdrop-filter`, borde `--separator`.
  - `prefers-contrast: more` → superficies sólidas, bordes `--label`, `--label-secondary` sube a `--label-on-tint`, filete de categoría 4px.

## Prohibido (anti-slop)

Degradados (fondo, texto o botón), índigo→violeta, glow, sombras en tarjetas o texto, sombras fuera de `--elev-*`, azul decorativo o segundo color de acento, iconos en baldosa de color, emoji decorativo, flecha en cada botón, etiquetas en MAYÚSCULAS con tracking, todo centrado (Large Title y listas van a la izquierda), peso 300 o 500, texto <11px, cristal sobre cristal, bordes de 2px en tarjetas, rebote en lo que no se arrastró, tiempos o curvas fuera de tokens, hex sueltos, banda o nav negra, otra marca, `scroll-world`, React Bits, librerías de UI nuevas.
