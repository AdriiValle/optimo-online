# from-opus-look-oleada5

- Hecho: sí
- Commit: `391d4e4 style(look): casa del deportista` (rama `dev`, solo `app/globals.css`).

## Qué cambió (rutas)

- `app/globals.css` (solo bloques de la oleada 5):
  - `.cal-grid` / `.tape-strip` / `.dash-tabs`: columnas `minmax(0, 1fr)` → sin desborde a 375.
  - `.cal-day`: press `scale(var(--press-scale))` con tokens, `:focus-visible` con `--focus-ring`, `font: inherit` y `color: var(--text)`.
  - `.tape-day`: press con tokens, que respeta las escalas `.side` (0.94) y `.active` (1.02) con `calc(... * var(--press-scale))`, más foco.
  - `.dash-tabs button`: press + transición con tokens, foco con `--focus-ring`, `nowrap` + ellipsis por si la pantalla es estrecha.
  - `.session-video`: press y foco con tokens (antes 0.96 fijo), alto mínimo 32 → 36px.
  - `.video-embed-*`: en móvil ahora es un sheet anclado abajo (`margin-top: auto`, así se puede hacer scroll si no cabe), con las esquinas de arriba redondeadas, safe-area abajo y las animaciones `scrim-in` / `sheet-up` que ya existían. A partir de 720px queda centrado con `sheet-pop`. Con reduced-motion no hay movimiento, porque los tokens `--dur-sheet` y `--press-scale` se anulan en la salida compartida y la animación ya se fuerza a 0.01ms. La transparencia reducida ya cubría el shell y el botón de cerrar.
  - Retoques: `.dash-id strong` y `.cal-compact .cal-nav h2` con tracking −0.02em; `overflow-wrap: anywhere` en el nombre, en la etiqueta del ejercicio y en el texto del vídeo; `.device-readonly` con flex y `tabular-nums`.
- TSX: ninguno. No hacía falta tocar marcado. Datos, props y tabs quedan idénticos.

## Verificación

- `npm run build` OK.
- :3001 no estaba levantado, así que no hay revisión visual a 375px. Lo que garantiza que no haya scroll horizontal es el CSS (`minmax(0,1fr)` y `overflow-wrap`).

## Duda

- `.week-tape` / `.tape-*` y `.day-focus` / `.day-focus-heading` / `.day-focus-duration` no los usa ningún TSX: la cinta de semana no se pinta en `/a/[id]` y quien elige el día es el calendario (`.cal-day`). Les di el press igualmente, pero no he borrado ese CSS que no se usa porque no lo creé yo.
- El scrim del vídeo se queda en `rgba(0,0,0,.72)` con blur 8px (ya estaba así) y no pasa a `--scrim`: para ver un vídeo conviene el fondo más oscuro.
- `.dash-injury` sigue con `#9a3412`, un color que ya existía y no es token. No lo he cambiado.

## Recomendación

- Que Oleada 8 (cierre) o una limpieza aparte decida si se borra el CSS que no se usa de `.week-tape/.tape-*/.day-focus*`.
- Mirar el sheet del vídeo a 375 cuando :3001 esté levantado.

## Bloquea a Adrián

No.
