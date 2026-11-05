# to opus — nutri layout2

## Objetivo

Experiencia gráfica del workspace `/nutricion/**` (Amanda): full-bleed, menos hueco muerto, sin columna derecha permanente; editor al clicar celda del grid.

## NO

- `/a/**` jugador
- `/panel` admin
- macros
- merge main

## SÍ

- `app/globals.css` — grid 2 cols, header nut wide, drawer, rail foot
- `app/components/brand-header.tsx` — prop `wide` nutricionista
- `app/nutricion/athlete-nav.tsx` — rail flex + Ajustes + Salir abajo
- `app/nutricion/[athleteId]/nutricion-athlete-client.tsx` — drawer comida + drawer ajustes (NutritionPane)
- `app/nutricion/[athleteId]/page.tsx`, `app/nutricion/page.tsx` — header wide

## Criterio de hecho

- 1440px: header alineado al contenido (sin max 640px), fondo sólido clínico
- Rail izquierdo llena altura útil; Ajustes abre suplementos/notas; Salir en rail (desktop)
- Centro: calendario + grid semana ocupan todo el ancho (sin 340px side)
- Clic celda grid → drawer editor ese slot; Escape/cerrar
- Móvil <1280: flujo apilado + sheet drawer
- `npm run build` OK
