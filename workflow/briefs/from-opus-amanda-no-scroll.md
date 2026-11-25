# from-opus-amanda-no-scroll

- **Hecho:** sí (commit `9ad953c` en `dev`)

## Qué cambió (rutas)

- `app/globals.css` (bloque `@media (min-width: 1280px)`, solo `nut-*`):
  - `.nut-desktop` pasa de `min-height` a alto fijo `calc(100dvh − header − 16px)` con fila `minmax(0,1fr)`; `.page.nut-page` con `padding-bottom: 16px` → la página mide justo el viewport.
  - El rail (`.nut-ws-list`) ya no es sticky ni tiene min/max-height propios: rellena la celda del grid.
  - La rejilla semanal, la lista del día y el mes (`.nut-week-grid`, `.nut-day-layout`, `.nut-month`) ocupan con `flex: 1` el alto que queda libre; las filas son elásticas (las del mes con `minmax(44px, 1fr)`, y las franjas del día en proporción 3:2 entre principal y snack).
  - El resumen (`.nut-dash`) queda en una franja: título y nota arriba, anillos principales a la izquierda y micros a la derecha. En la vista Día el resumen lateral sigue en columna y los micros pasan a 5 columnas.
- `app/nutricion/[athleteId]/nutricion-athlete-client.tsx`:
  - `gridTemplateRows` de la rejilla semanal se calcula a partir de `MEAL_SLOTS`: `minmax(44px,3fr)` para las comidas principales y `minmax(32px,2fr)` para las snack.
  - Anillos más pequeños: Energía y donut 96→64, P/HC 64→56, micros 56→48.
- `tsc --noEmit` limpio.

## Verificación (navegador headless, sesión de Amanda, deportista Ricardo Visus)

En las 3 vistas (Semana/Día/Mes) a 1280×600, 1366×657, 1440×789 y 1920×969:
- `document.scrollHeight == innerHeight`, así que no hay scroll de página.
- Ningún elemento con overflow-y en el workspace: en `.nut-week` scrollHeight = clientHeight, y la lista de deportistas no desborda.
- Ningún elemento por debajo del margen inferior.
- No se oculta contenido: los títulos de plato mantienen el corte a 2 líneas que ya tenían.
- La página índice `/nutricion` cabe en 657 px sin scroll.
- Móvil (<1280 px) sin cambios: sigue apilado, con scroll natural y sin overflow horizontal.
- Capturas en `.tmp-verify/look/noscroll_*.png`.

## Duda

La lista de deportistas del rail conserva su `overflow-y: auto` como válvula de seguridad. Hoy Amanda tiene 1 deportista y no se activa. Con muchos asignados en pantallas bajas (con 1280×600 caben unos 2) aparecería scroll solo dentro de esa lista.

## Recomendación

Dejarlo así: hay buscador y es una lista de navegación, no la zona de trabajo. Recortarla a ciegas ocultaría deportistas. Si molesta en el futuro, la solución es compactar más el mini-calendario del rail con un media query por altura.

## Bloquea a Adrián

No.
