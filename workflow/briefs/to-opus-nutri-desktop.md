Implementa el workspace desktop v2 del nutricionista (Amanda). Un commit en `dev`. No `main`. No Neon. No cambiar RLS salvo bug obvio.

Lee antes:
- `workflow/briefs/research-clinica-nutricion.md` (layout 4 zonas)
- `workflow/context/design-system.md` (tokens; no paleta nueva)
- Código actual: `app/nutricion/page.tsx`, `app/nutricion/[athleteId]/page.tsx`, `app/nutricion/[athleteId]/nutricion-athlete-client.tsx`, `app/components/plan-calendar.tsx`, `app/a/[id]/nutrition-pane.tsx`, `app/globals.css` (`.nut-*`, `.page`)

## Objetivo

En viewport **≥1280px**, solo rutas `/nutricion` y `/nutricion/[athleteId]`, layout tipo clínica (densidad, surface sólida + `--line`, **menos glass** que el jugador). Bajo 1280px mantener el flujo v1 apilado (640px cap OK en móvil).

Login prueba: `amanda` / `123456789` · atleta asignado: Ricardo Visus.

## Workspace desktop (≥1280px)

Cuatro zonas en grid (clase contenedora p.ej. `nut-desktop`):

1. **Izquierda (~220–260px):** lista persistente de deportistas asignados (`assignedAthletesForNutritionist` — ya en server en list page; en `[athleteId]` pasar la misma lista desde server o reutilizar query). Item activo resaltado. Avatar + nombre + deporte/equipo. Link a `/nutricion/[id]`.

2. **Centro superior:** `PlanCalendar` existente (MD/partidos, solo lectura) + día `center` seleccionable como ahora.

3. **Centro principal:** **grid semanal** Lun–Dom × filas desayuno/comida/cena (`MEAL_SLOTS`). Navegación semana anterior/siguiente (lunes–domingo de la semana del `center` o semana visible). Cada celda: título corto + mini foto si `hasPhoto`. Clic celda → selecciona slot para panel derecho y alinea `center` a ese día si hace falta.

4. **Derecha fijo (~300–360px):** ficha del slot seleccionado — reutilizar lógica de `MealSlotForm` (PUT `/api/meals`, foto POST `/api/meals/[id]/photo`, DELETE). Foto grande, título, preparación. Debajo **suplementos + notas dieta** con `NutritionPane` (`canEdit`) **sin acordeones** en desktop (bloques visibles; en móvil puede seguir `<details>`).

Datos menú semana: `GET /api/meals?athleteId=&from=&to=` (7 días). Helpers en `lib/dates.ts` (`addDays`, `dateKey`) — añade `startOfWeekMonday(iso)` si simplifica.

## Rutas / archivos SÍ

- `app/nutricion/**` (pages + client; componentes nuevos bajo `app/nutricion/` si ayuda)
- `app/globals.css` — estilos scoped `.nut-desktop` y media `(min-width: 1280px)`; no romper estilos jugador
- `lib/dates.ts` solo helpers de semana si hace falta

## NO

- `/a/[id]/**` Nutrición del jugador (no rediseñar)
- `/panel/**`, admin, APIs nuevas, schema, middleware, macros, compras, IA
- Quitar funcionalidad v1 móvil del nutricionista
- Paleta nueva, morados/azules analytics

## Look

Tokens Óptimo. Sidebar lista: `--fill-secondary` o surface con borde. Área trabajo: `--surface`, `--shadow-sm`, tipografía 0.8125–0.875rem en grid. Filas grid ~36px mínimo. Mini fotos ~40px en celdas; preview grande en panel.

## Criterio de hecho

- `npm run build` OK
- Desktop 1440px: lista izquierda + calendario + grid semana + panel plato/suplementos/notas
- Editar celda, guardar plato y foto sigue funcionando
- Móvil <1280: comportamiento v1 razonable
- Diff acotado a nutricionista + CSS scoped

Commit: `feat(nutricion): workspace desktop clínico Amanda`

Al terminar: `workflow/briefs/from-opus-nutri-desktop.md` (hecho, archivos tocados, notas verificación, riesgos).
