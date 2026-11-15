# from-rd-N8: Plantillas y platos

Hecho: sí

## Qué cambió (rutas)

Nuevos:
- `lib/nutrition/templates-queries.ts`: plantillas (guardar día o semana desde el menú, listar, borrar, aplicar a fechas copiando meal_slots, foto e ingredientes vigentes con `items_text_hash`), biblioteca de platos (guardar desde un plato, buscar por nombre o preparación, aplicar a una franja con foto e ingredientes), sustituciones (`food_swaps`, inversa = 1/ratio, `swapsForDay` con gramos × ratio redondeados como en Hoy) y nota del día (`meal_day_notes`).
- `app/api/nutrition/templates/`:
  - `shared.ts`: solo admin o nutricionista, más `canSeeAthleteNutrition`.
  - `route.ts`: GET y POST.
  - `[id]/route.ts`: DELETE.
  - `[id]/apply/route.ts`: aplica la plantilla; una plantilla de semana exige que la fecha sea lunes.
  - `dishes/route.ts`: GET con `?q` y POST desde `mealSlotId`.
  - `dishes/[id]/route.ts`, `dishes/[id]/photo/route.ts` y `dishes/[id]/apply/route.ts`.
  - `swaps/route.ts` y `swaps/[id]/route.ts`.
  - `day-notes/route.ts`: GET y PUT; una nota vacía la borra.
- `app/nutricion/[athleteId]/plantillas/`:
  - `page.tsx` sustituye al placeholder.
  - `plantillas-panel.tsx` tiene tres bloques: Plantillas de menú (Día/Semana, nombre, MD-1/MD/MD+1/Libre, Aplicar con fecha y «Sustituir los platos que ya haya»), Mis platos (buscador) y Sustituciones aprobadas (100 g de A equivalen a X g de B, «También al revés»).
  - `dish-picker.tsx` tiene «Buscar en mis platos» y «Guardar en mis platos».
  - `day-note.tsx` es el formulario de la nota del día.

Modificados:
- `app/nutricion/[athleteId]/meal-drawer.tsx`: «Guardar en mis platos» en la ficha.
- `app/nutricion/[athleteId]/nutricion-athlete-client.tsx`:
  - «Buscar en mis platos» al crear un plato en una franja vacía, tanto en la ficha de escritorio como en la pila móvil.
  - En escritorio, botón «Nota del día» en la barra, que abre un modal.
  - En móvil, la nota del día va en línea, en la pila.
- `app/a/[id]/nutrition/actions.ts`: `loadMealSwaps`, con el mismo control de acceso que `loadNutritionToday`.
- `app/a/[id]/nutrition/today-view.tsx`: «Cambiar» por ingrediente, solo si hay una sustitución aprobada, con los gramos recalculados y la opción de volver al original. La «Nota de Amanda» aparece en la tarjeta del día.
- `app/styles/nutri.css`: bloque N8 (`nut-tpl-*`, `nut-dish-*`, `nut-daynote-form*`), con las reglas de preferencias al final.
- `app/styles/nutri-shared.css`: `nut-ingr-swap`, `nut-ingr-change` y `nut-ingr-option*`, con las reglas de preferencias al final.

## Verificación

Probado en 127.0.0.1:3001; las capturas están en `.tmp-verify/rd-N8/`.

- **Plantilla de semana** (desde la semana del 16-11, 14 platos y 83 ingredientes), aplicada a la semana del 30-11:
  - Se crearon 14 platos y 83 ingredientes vigentes, todos con hash.
  - Al aplicarla otra vez, se saltaron los 14.
  - Con «sustituir», se reemplazaron los 14 sin duplicados.
  - Guardar una semana vacía da 422, y aplicar una semana sin empezar en lunes también da 422.
- **Mis platos:**
  - Guardar un plato con foto y 5 ingredientes funciona, y volver a guardarlo lo actualiza.
  - La búsqueda funciona.
  - «Buscar en mis platos» en una franja vacía crea el plato con foto, 5 ingredientes y hash. La miniatura carga (naturalWidth 300).
- **Sustitución** «Arroz blanco (crudo) → Pasta (cruda)», ratio 1,2, con la inversa (83 g por cada 100 g):
  - En el Hoy de Ricardo aparece «Cambiar» solo en el arroz; la opción es Pasta (cruda) 90 g (75 g × 1,2).
  - Patata, langostinos y aceite no tienen botón.
  - Sin sustituciones aprobadas no aparece ningún «Cambiar» (`04_sin_aprobacion_390.png`).
  - El jugador recibe 404 en `/api/nutrition/templates/*`.
- **Nota del día:** Amanda la edita desde la interfaz, tanto en la pila móvil como en el modal de escritorio, y el jugador la ve en la tarjeta del día.
- **Ancho a 390 px:** scrollWidth es 390 en Plantillas, en el menú de Amanda y en el Hoy del jugador; en escritorio es 1440.
- **Táctil y foco:**
  - «Cambiar» mide 44 px de alto.
  - El segmentado Día/Semana medía 28 px; lo subí a 44 px solo dentro de `.nut-tpl-seg`.
  - La fila del interruptor mide 58 px.
  - El foco es visible: contorno sólido de 2 px.
- **Tipos y consola:**
  - `npx tsc --noEmit` pasa limpio.
  - No hay errores de consola nuevos. Solo hay un aviso de `key` en `HeaderMarkup` que viene de `page.tsx` de `/nutricion/[athleteId]`, que no he tocado y que ya estaba antes de este cambio.
- **Datos de prueba:** borrados todos.
  - Semanas 30-11 y 07-12: 0 platos.
  - Semana 16-11: sigue en 14/83, sin cambios.
  - Tablas de plantillas, platos, sustituciones y notas: vacías.
  - `browse.lock` está liberado.

## Decisiones tomadas

- «Cambiar» en Hoy solo cambia lo que ve el jugador, en el momento. No se guarda ni cambia el menú.
- Las plantillas, los platos y las sustituciones son globales: sirven para todos los deportistas de Amanda.
- Al aplicar una plantilla solo se rellenan las franjas vacías, salvo que se marque «Sustituir». Así no se pisa un menú ya hecho.
- Que exista una fila en `food_swaps` significa que está aprobada. «También al revés» aprueba la inversa con 1/ratio.
- Los nombres de plato llevan la etiqueta `[CATEGORÍA]` del título original; los dejé tal cual.

Duda:

Recomendación:

Bloquea a Adrián: no
