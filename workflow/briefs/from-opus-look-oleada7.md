# from-opus-look-oleada7

- Hecho: sí
- Commit: `7be463f style(look): nutrición y nutricionista` (rama `dev`, solo `app/globals.css`).

## Qué cambió (rutas)

- `app/globals.css`: solo los bloques `/* —— Nutrición —— */` y `/* —— Nutricionista —— */`, incluido el de ≥1280. No toqué `.btn-ghost` ni `.device-*`, que vienen justo después.
  - **Modal de comida y de cuenta (`.nut-modal*`) → sheet.** Por debajo de 720 queda anclado abajo, con las esquinas de arriba redondeadas y alto máximo `min(92svh, 720px)`. Entra con los keyframes que ya había (`scrim-in` y `sheet-up`), tiene scroll interno con `overscroll-behavior: contain` y respeta las zonas seguras (incluida la de abajo, para el teclado). La × (`icon-btn` de 36px) queda arriba a la derecha y no encoge. A partir de 720 se ve centrado con `sheet-pop` y 480px, como antes.
    - Superficie clínica opaca: `--surface` sin `backdrop-filter`.
    - `rgba(0,0,0,.28)` pasa a `var(--scrim)` (mismo valor). La sombra suelta `0 16px 48px` pasa a `--shadow-md` (regla 5).
    - Se quitó el doble padding de `.nut-body` dentro del modal. Los botones del formulario ocupan todo el ancho con 50px de alto, igual que `create-sheet`.
    - El bloqueo de scroll del fondo (`body.nut-modal-open`) y el cierre con Escape ya existían en el TSX; no los toqué.
  - **Nutrición del deportista (`/a/[id]` y menú móvil de Amanda):**
    - Los `summary` de `.nut-details` miden ≥44px, tienen press por opacidad, foco visible y el chevrón usa los tokens `--dur`/`--ease`.
    - Las rejillas usan `minmax(0,1fr)` y el texto lleva `overflow-wrap`, para que no haya desborde a 375. Las horas de suplementos van en `tabular-nums`.
    - `.nut-menu-slot` deja de ir en mayúsculas para hablar igual que `.dash-kicker`.
    - Los radios de foto pasan a `--radius-sm`.
  - **Workspace ≥1280:**
    - La rejilla semanal (`.nut-week-day` y `.nut-week-cell`) tiene press `--press-scale`, transiciones con tokens, `--radius-sm` y `--focus-ring`.
    - La cabecera de semana y los días van en `tabular-nums`.
    - Se quitaron las mayúsculas de `.nut-week-slot` y `.nut-ws-list h2`.
    - Se borró una regla duplicada de `.nut-week .cal-nav h2` dentro del mismo bloque.
    - En la lista de deportistas (`.nut-ws-list`) y en «Ajustes»/«Salir» (`.nut-rail-btn`) solo cambié el tacto: press, foco y radio con tokens. La estructura no cambia: el grid sigue en `240px | main` y el panel lateral derecho no se reintroduce, así que f08a673 se respeta.
- TSX: ninguno. Los 7 archivos permitidos no necesitaban cambiar el marcado. La importación Word no se tocó.

## Verificación

- `npm run build`: OK.
- Paleta intacta: `:root` no se toca y solo uso tokens existentes.
- reduced-motion: el sheet y el press leen `--dur*` y `--press-scale*`, que la salida compartida anula.
- :3001 **no estaba levantado** (curl devuelve 000), así que no hay revisión visual de Amanda a 375 ni a ≥1280.

## Duda

- El brief dice «NO: rail/panel lateral». Lo leí como «no reintroducir el panel quitado en f08a673 ni cambiar la estructura del workspace», porque `athlete-nav.tsx` y `nut-rail-logout.tsx` están en la lista de archivos SÍ. En la lista izquierda solo cambié press, foco, radio y quité las mayúsculas del h2.

## Recomendación

- Si «rail» significaba no tocar ni el tacto de la lista izquierda, se deshace con un revert parcial de las reglas `.nut-rail-btn` y `.nut-ws-list a`/`h2` (son unas 8 líneas). Si no, se deja así.
- En la Oleada 8 (recorrido local): mirar `amanda` → `/nutricion/[id]` a 375 (abrir y cerrar el sheet de comida con el teclado abierto) y a ≥1280 (rejilla semanal).

## Bloquea a Adrián

No.
