# from-opus-look-oleada6

- Hecho: sí
- Commit: `7a81b5d style(look): análisis y molestias` (rama `dev`, solo `app/globals.css`).

## Qué cambió (rutas)

- `app/globals.css`, solo el bloque `/* —— Análisis (admin) —— */` (`.an-*`). `.sr-only` cae dentro del rango pero es compartido y no lo toqué.
  - Chips de periodo y botón «Aplicar»: alto ≥36px y ancho mínimo 44px. Tienen press `scale(var(--press-scale))` que entra en `--dur-press` y vuelve en `--dur var(--ease)`, `:focus-visible` con `--focus-ring` y cifras `tabular-nums`. En `.on` el `#fff` pasa a ser `var(--surface)` (mismo valor).
  - Rango propio: `label` sin el margen del label compartido. Las dos fechas son flexibles (`flex: 1 1 112px`, `min-width: 0`) con alto 36px y `--radius-sm`, así que caben a 375 sin desbordar.
  - Gráficas: el eje usa `var(--line)` en vez de `rgba(0,0,0,.12)`, la línea es de 2px con extremos redondeados, y «Último»/«Media» van a 12–13px con `tabular-nums`. La rejilla usa `minmax(0,1fr)`. A partir de 520px: 2 columnas como antes, y la quinta tarjeta (RPE, barras) ocupa la fila entera, así que ya no queda hueco.
  - Molestias: la columna de fecha tiene ancho fijo, `overflow-wrap: anywhere` en el texto y `tabular-nums`.
  - Detalle del día: cifras `tabular-nums`. A partir de 520px son 3 columnas (2 filas de 3) y la parte de molestias queda separada por una línea `--line`.
  - `.an-link` («Ver tendencias»): press por opacidad, foco visible y subrayado separado del texto.
- TSX: ninguno. `analisis.tsx` no hacía falta tocarlo; datos, props y lógica quedan idénticos.

## Verificación

- `npm run build` OK.
- :3001 no estaba levantado (curl devuelve 000), así que no hay revisión visual a 375. Lo que garantiza que no haya desborde es el CSS (`minmax(0,1fr)`, `min-width: 0`, `overflow-wrap`).
- Paleta intacta: solo se usan tokens existentes y no hay sombras nuevas.
- Con reduced-motion no hay movimiento, porque el press lee los tokens que la salida compartida anula.

## Duda

- La salida compartida `prefers-reduced-transparency` cubre `.an-chips button` pero no `.an-custom button` («Aplicar»). Como ese botón no lleva `backdrop-filter`, solo pierde la opacidad parcial (`--glass-row`), y no lo añadí porque ese bloque es de la Oleada 2 (regla 1).

## Recomendación

- Si se quiere tapar, que la Oleada 8 (cierre) añada `.an-custom button` a la lista de la salida compartida `prefers-reduced-transparency` (es una línea).
- Mirar `/a/[id]` → Análisis a 375 cuando :3001 esté levantado.

## Bloquea a Adrián

No.
