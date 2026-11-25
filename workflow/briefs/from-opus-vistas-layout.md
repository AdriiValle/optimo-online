# from-opus-vistas-layout

- Hecho: sí
- Commit: `75ac7dd` en `dev` — feat(nutricion): vistas Día (lista + resumen) y Mes (calendario) en el menú

## Qué cambió (rutas)
- `app/nutricion/[athleteId]/nutricion-athlete-client.tsx`
  - **Semana:** sin cambios (grid de comidas arriba, dashboard abajo).
  - **Día:** `nut-day-layout` en dos columnas. Izquierda: las 5 franjas en lista (Desayuno, Media mañana, Comida, Merienda, Cena). Reutilizan las celdas de la semana: foto, título, «+» si están vacías y clic → modal de edición. Derecha: `WeekPanel` con `side` («Resumen del día»: mismos anillos, donut y micros).
  - **Mes:** nuevo `MonthCalendar` en lugar de la lista hacia abajo. Calendario L–D a ancho de zona, con el número del día, la etiqueta MD si la hay y 5 puntos (uno por franja; relleno = esa comida tiene plato). Un día sin ningún plato sale en gris. Hoy va con el número en cápsula y el día elegido con borde. El aria-label dice «N de 5 platos» o «sin platos». Clic → `selectDate` + `setView("day")`. Dashboard abajo.
  - Se mantienen el selector Día/Semana/Mes, las flechas, el import Word y el rail.
- `app/globals.css` (solo `nut-*`, dentro de `@media (min-width: 1280px)`): añadidos `.nut-day-*`, `.nut-dash--side`, `.nut-month`, `.nut-month-dow`, `.nut-month-day`, `.nut-month-top` y `.nut-month-dots`, todos con tokens existentes (`--surface`, `--bg`, `--line`, `--fill-secondary`, `--radius-sm`, `--press-scale`, `--focus-ring`…). Quitados `.nut-month-list` y `.nut-month-row`, que se quedaban sin uso con este diff.
- No se inventan gramos: el dashboard sigue mostrando «pendiente».

## Verificación
- `npx tsc --noEmit` limpio.
- No hay config de ESLint en el repo (ESLint 10 sin `eslint.config.*`), así que no se ha pasado lint.
- No lo he comprobado en el navegador: la página necesita login de nutricionista.

## Duda

## Recomendación

## Bloquea a Adrián: no

## Para Adrián al cerrar
Mira en escritorio (≥1280px) `/nutricion/<atleta>` → Día y Mes. En Mes, haz clic en un día y comprueba que salta a Día con esa fecha. El `.gitignore` ya venía modificado y no lo he incluido en el commit.
