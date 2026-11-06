# Design system — Óptimo + tacto Apple

Patrón de familia Óptimo. Paleta, tipo y marca Óptimo intactos; el tacto (press, glass, sheet, foco, movimiento) es apple-design. Ningún `DESIGN.md` de otra marca. Todo vive en `app/globals.css`.

## Tokens (`:root` real)

```css
/* Marca: no cambiar valores */
--bg: #F5F5F7;  --surface: #FFFFFF;  --text: #1D1D1F;  --secondary: #86868B;
--line: #D2D2D7;  --fill-secondary: #E8E8ED;  --accent: #1D1D1F;  --accent-hover: #424245;
--shadow-sm: 0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);  --shadow-md: 0 4px 14px rgba(0,0,0,.08);
--radius: 12px;  --font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, "Segoe UI", sans-serif;
/* Glass */
--glass: rgba(255,255,255,.62);  --glass-strong: rgba(255,255,255,.86);  --glass-row: rgba(255,255,255,.74);
--glass-border: rgba(255,255,255,.6);  --glass-blur: blur(20px) saturate(180%);  --glass-highlight: inset 0 1px 0 rgba(255,255,255,.82);
/* Header (portal a body, fijo) */
--header-offset: env(safe-area-inset-top, 0px);  --header-block: 58px;  --header-gap: 12px;
/* Tacto (Oleada 2, solo añadidos) */
--ease: cubic-bezier(0.23, 1, 0.32, 1);  --dur-press: 100ms;  --dur: 200ms;  --dur-sheet: 320ms;
--press-scale: 0.97;  --press-scale-lg: 0.985;  --focus-ring: 2px solid var(--text);  --focus-offset: 2px;
--radius-sm: 10px;  --scrim: rgba(0,0,0,.28);  --danger: #c41e3a;  --ok: #248a3d;
```

## Categoría de proteína

Única ampliación de paleta (la marca no cambia). Menú de nutrición: color por la proteína del plato, del corchete `[CARNE]` del import Word (`lib/nutrition/protein-category.ts`).

```css
/* Ink = filete/punto/etiqueta sobre blanco; tint = fondo de la celda y placeholder. */
--cat-carne: #9A5B45;      --cat-carne-tint: #F4EAE5;      /* terracota */
--cat-pescado: #557083;    --cat-pescado-tint: #E7EDF1;    /* pizarra */
--cat-huevos: #8F7234;     --cat-huevos-tint: #F5EFE1;     /* ocre */
--cat-legumbres: #687A4E;  --cat-legumbres-tint: #ECEFE4;  /* oliva */
--cat-none: var(--secondary); --cat-none-tint: var(--fill-secondary);
--cat-rule: 3px;  /* filete izquierdo; 4px en prefers-contrast */
```

- Clase `.nut-cat--{carne|pescado|huevos|legumbres|none}` expone `--cat-ink` / `--cat-tint` al elemento.
- Contraste: ink sobre blanco 4.5–5.3:1; `--text` sobre tint ≥14:1. `--secondary` sobre tint no llega: texto secundario en celda teñida va en `--accent-hover`.
- El color nunca va solo: la categoría también en texto o `aria-label`. Mixta (`HUEVOS/PESCADO`) → color de la primera. `LEGUMBRES/P. VEGETAL` → legumbres. Sin corchete o desconocida → `none`.
- `prefers-contrast: more`: tint → `--surface`, filete 4px.
- Placeholder: campo de tint liso + nombre de la categoría en texto. Sin icono, emoji ni degradado.

## Tacto

- **Press**: todo lo tocable encoge en `:active` (no al soltar). `scale(var(--press-scale))` botones/chips/tabs; `--press-scale-lg` en tarjetas y filas. Entra en `--dur-press` `ease-out`; vuelve en `--dur` `var(--ease)`.
- **Glass**: solo `--glass*`. Una capa de cristal por pila: nunca cristal claro sobre cristal claro. Superficies grandes = `--glass` + `--shadow-md`; filas/chips = `--glass-row` + `--shadow-sm`. Sin capas `backdrop-filter` nuevas.
- **Sheet**: modal = scrim `--scrim` + panel `--glass-strong` (o `--surface` en clínico). Móvil (<720): anclado abajo, esquinas superiores `--radius`, sube desde abajo en `--dur-sheet var(--ease)`, scroll interno, botón cerrar ≥36px arriba a la derecha. ≥720: centrado, escala 0.96→1. Fondo sin scroll mientras está abierto.
- **Foco**: `:focus-visible` = `--focus-ring` con `--focus-offset`. Inputs: fondo `--surface` + anillo interior 1.5px `--text`. Nunca quitar foco sin sustituto.
- **Objetivos táctiles**: ≥44px de alto en acciones primarias; ≥36px en icon-btn y chips (con aire alrededor).
- **Tipo**: tracking negativo en titulares (−0.02/−0.03em), cuerpo ~−0.01em, texto pequeño 0. Jerarquía por peso + tamaño, no por color nuevo. Cifras `tabular-nums`.

## Accesibilidad

- `prefers-reduced-motion`: sin transform ni deslizamientos; press y sheets pasan a fundido de opacidad o nada. Una sola salida en el CSS compartido.
- `prefers-reduced-transparency`: cristal → `--surface` opaco, sin `backdrop-filter`, borde `--line`; fondo de `body` liso.
- `prefers-contrast: more`: superficies sólidas, borde `--text`, `.muted` sube a `--accent-hover`.

## Layout

Móvil primero: `.page` 640px, revisar a 375 sin scroll horizontal. Desktop solo donde ya existe: header ≥720, análisis ≥520, nutricionista ≥1280 (`.doc-header-viewport--wide`, `.nut-ws-*`, sin rail ni panel lateral).

## Prohibido

Titular con degradado, índigo→violeta, iconos en baldosa, emoji decorativo, flecha en cada botón, labels en mayúsculas nuevas, todo centrado, sombras fuera de `--shadow-sm/md`, colores fuera de tokens, otra marca, `scroll-world`, React Bits.
