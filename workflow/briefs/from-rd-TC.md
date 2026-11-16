# from-rd-TC — Transversal común (tokens, base, components, shell, a11y)

**Hecho:** sí (parcial solo en un punto: la sesión compartida de browse estuvo ocupada, ver «Duda»)

## Qué cambió (solo estas 5 hojas)
- `app/styles/tokens.css`
  - Tokens nuevos para lo que estaba suelto en literales: `--press-opacity`, `--sheet-pop-scale`, `--pulse-opacity`, `--disabled-opacity`.
  - Quitado `--header-block` (lo define shell.css).
  - Alias reducidos a `--secondary` y `--ease`, que `nutri.css` aún lee (~l. 955-960).
- `app/styles/base.css`: quitado el bloque `.brand-*` (vive entero en shell.css). Queda `.muted`.
- `app/styles/shell.css`
  - `.brand-logo` con radio y tamaño propios.
  - Press con `--press-opacity`.
  - Bloque de movimiento reducido al final de la hoja: sin transición y sin transform en el press.
  - Transparencia y contraste ya estaban al final.
- `app/styles/components.css` (~649 líneas)
  - CSS muerto eliminado (clases sin uso en tsx/css).
  - Opacidades, radios, escalas y duraciones sacadas a tokens (no quedan `0ms` ni literales sueltos).
  - `.btn` hover envuelto en `:where(:not(:disabled,[aria-disabled="true"]))`, así que un botón deshabilitado ya no cambia al pasar el ratón.
  - Segmentado con área táctil de 44 px vía `::after` solo con `pointer: coarse`.
  - Bloque de preferencias al final de la hoja:
    - Movimiento reducido: la hoja entra con fundido corto (`scrim-in`, 0,15 s); el spinner pasa a pulso lento en vez de girar; el segmentado y el toggle sin transición.
    - Contraste más: bordes de 1 px en card, sheet, inputs, listas, alert, botones, chip y toggle.
- `app/styles/a11y.css` (reescrita)
  - Solo redefine tokens por preferencia, deja la red de seguridad global de movimiento y mantiene los pocos parches de contraste para hojas ajenas (`.nut-week-cell.nut-cat`, `.nut-ficha-hero`, `.session-item/.nut-details`, `.session-section/.session-item-info`).
  - Las reglas por selector ya no viven aquí.
  - Se quitó el fundido de `.nut-drawer`, que contradecía el `animation: none` de nutri.css.
  - Se quitó la barra opaca de la navbar en transparencia reducida, que pisaba el `::before` de shell.

## Verificación
- `npx tsc --noEmit`: limpio.
- Se usó un Chromium propio con playwright-core y emulación CDP de reduced-motion, reduced-transparency y prefers-contrast (scripts y capturas en `.tmp-verify/rd-TC/`).
- A 390 px, `scrollWidth` es 390 en todas las rutas, los 4 modos y todos los perfiles (login, jugador, admin, Amanda).
- Tab: anillo visible en todas las paradas de login, jugador, admin y Amanda. Los «noRing» que salen en login y en el buscador de `/nutricion` son falsos positivos: el anillo está en el contenedor (`.login-field:focus-within` y el wrapper del buscador), no en el `input`.
- `/dev/ui` (sheet) en los 4 modos a 390 y 1280:
  - Base: `sheet-up` / `sheet-pop` de 0,36 s.
  - Movimiento reducido: fundido `scrim-in` de 0,15 s, sin deslizamiento. El spinner pulsa (`pulse 1.2s`) en lugar de girar.
  - Contraste más: borde de 1 px.
  - Transparencia reducida: sin `backdrop-filter`, fondo sólido.
  - La hoja cierra bien con Escape en todos los modos.
- Botón deshabilitado: el fondo no cambia al pasar el ratón. Segmentado en táctil: 32 px de alto más 6 px de `::after` por lado = 44 px.
- Admin a 1440 y Amanda a 1280: `scrollWidth` igual al ancho de ventana, sin desbordes.
- Consola: sin errores nuevos. Los 500 de `/favicon.ico` e `/icon.png` (servidor dev) y el aviso de React por falta de `key` ya estaban y no son de CSS.

## Duda
- La sesión compartida de browse estuvo bloqueada por otros (rd-TA, audit-TA, audit-TJ) más de 20 min, el máximo que daba el brief. Para no parar usé un Chromium aparte; **no creé ni borré `browse.lock`**.
- Los objetivos táctiles <44 que quedan están en hojas ajenas, o en puntero fino de escritorio, donde `--tap-min` no aplica a propósito:
  - `.pset-input` de 36 px (A6, player.css).
  - `.nut-tab` de 28 px y el buscador de `nutri.css`.
  - `.icon-btn` de 32 px en el calendario de Amanda.
- Comentario obsoleto en `admin.css` (~l. 748) que cita una regla de components.css ya eliminada. Solo es un comentario, no afecta al render.

## Recomendación
Que el master haga el commit de estas 5 hojas. Las pistas dueñas de `player.css`, `nutri.css` y `admin.css` pueden subir los objetivos pequeños a `var(--tap-min)` bajo `pointer: coarse` y retirar el comentario viejo cuando toquen su hoja. Cuando `nutri.css` deje de leer `--secondary` y `--ease`, se pueden borrar esos dos alias de tokens.css.

## Bloquea a Adrián: no

Decidí no esperar al browse compartido y verificar con un Chromium aparte porque el bloqueo pasó de 20 min y la emulación CDP da la misma información sin pisar a nadie. No hay commit, ni cambio de rama, ni datos de prueba que borrar (no creé ninguno).
