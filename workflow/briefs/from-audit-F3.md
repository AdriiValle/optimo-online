- Veredicto: PASA
- Bloqueantes (maximo 5): ninguno
- Notas no bloqueantes (maximo 3):
  1. Calendario del jugador (`/a/<id>`, 390): celdas de día 46x34 y flechas de mes 26x26, por debajo de 44 px. Es el calendario antiguo; el rediseño está en A1 (`player.css` / `plan-calendar.tsx`), fuera del alcance de F3. Captura: `.tmp-verify/audit-F3/ath_390x844_a_6de91513-0211-4e0d-b80a-d0d3fe830a49.png`
  2. `/nutricion/<id>` como Amanda: el overlay de Next dev marca «1 Issue»: warning de React «Each child in a list should have a unique "key"» en `HeaderMarkup` (pasado desde `NutricionAthletePage`). No rompe nada y no es de los primitivos. Captura: `.tmp-verify/audit-F3/nut_1440x900_nutricion_9d27d850-d328-4633-bc33-56198a0e4181.png`
  3. Nota de entorno: el dev server de :3001 tenía los workers de Next caídos (`/api/auth/csrf` daba 500 y el login fallaba). Lo reinicié con `next dev --port 3001` y quedó estable. No es un fallo del diff.

Verificado:
- `npx tsc --noEmit` limpio.
- Sin scroll horizontal en ninguna ruta: `scrollWidth` igual al ancho de ventana a 390 y a 1440 en `/login`, `/dev/ui`, `/panel`, `/a/<id>` y `/nutricion/<id>`.
- `/dev/ui` muestra tipografía, color, botones (6 variantes × reposo/hover/press/foco/deshabilitado/pendiente), campos, segmentado, toggle, lista inset, chips, alertas, vacío/carga/error, avatar, tarjetas y sheet. La página comprueba `NODE_ENV === "production"` y llama a `notFound()`; la comprobación del 404 es solo por código: no hice `next build` porque pisaría el `.next` del dev server.
- Tokens: `tokens.css` tiene los tokens v2 (superficies, label, fill, accent, semánticos, anillos, `--cat-*`, radios, materiales, elevación, movimiento, tap/foco). No hay hex ni `rgb()` sueltos en `components.css`, `base.css`, `a11y.css` ni en `app/dev/ui/page.tsx`.
- `a11y.css` resuelve `prefers-reduced-transparency`, `prefers-contrast: more` y `prefers-reduced-motion`, redefiniendo tokens en `:root` más reglas por selector.
- Botones primarios de `/dev/ui` a 44 px; los 43 px que mide son los estados `is-pressed` por el `scale(.97)`. El segmentado (28 px) y los chips (32 px) no son acciones primarias. El foco con Tab se ve: outline sólido 2 px azul `#0071E3`.
- Roles: jugador (`AdriiValle`) → `/a/<id>`; admin (`adriivalle`) → `/panel`, `/dev/ui`; Amanda → `/nutricion` y `/nutricion/<id de Ricardo>`. Las pantallas son legibles y usables. Admin y jugador reciben 404 en `/nutricion/<id>` por diseño (`role !== "nutritionist"`); Amanda también lo recibe para deportistas no asignados (por eso `/nutricion/<id de Adrián>` le da 404).

Capturas: `.tmp-verify/audit-F3/` (`adm_*`, `ath_*`, `nut_*`, `anon_*`; `results.txt` y `results2.txt` con las mediciones).
