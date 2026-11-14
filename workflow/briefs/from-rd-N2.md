# from-rd-N2 — Nutrición jugador: Semana

- Hecho: sí
- Qué cambió (rutas):
  - `app/a/[id]/nutrition/week-queries.ts` (nuevo): `nutritionWeek(tx, athleteId, weekStart)` lee lunes a domingo: MD de `day_plans` y platos de `meal_slots` (vía `mealsForAthleteRange`). Devuelve solo plato, categoría y si hay foto: nada de kcal ni gramos.
  - `app/a/[id]/nutrition/actions.ts`: nueva Server Action `loadNutritionWeek` con el mismo acceso que `loadNutritionToday` (zod + `canSeeAthleteNutrition` + `withRls`).
  - `app/a/[id]/nutrition/week-view.tsx` (nuevo): vista Semana con flechas de semana anterior/siguiente (44×44), rango «9 – 15 nov» y «Esta semana» o «La semana que viene · Ir a hoy». Debajo, una leyenda de franjas y una lista agrupada: una fila pulsable por día con día, número, «Hoy», chip MD y 5 miniaturas por franja en columnas fijas. Si hay foto se ve la foto; si no, el tinte de la categoría con su filete; si no hay plato, un hueco discontinuo. Un día sin platos pone «Sin menú». Una semana entera vacía muestra la tarjeta «Sin menú esta semana». También hay estados de carga (esqueleto) y de error. El lector de pantalla oye la fecha, el MD y los platos de cada franja.
  - `app/a/[id]/nutrition-pane.tsx`: conecta la vista Semana. Al tocar un día se abre «Hoy» de ese día con una línea «Jueves 12 de noviembre · Volver a hoy», y el foco pasa al panel. Si el jugador cambia de día en el calendario de arriba, «Hoy» vuelve a seguirlo. Semana se abre en la semana del día que se está viendo.
  - `app/a/[id]/nutrition/segments.tsx`: `NutritionSoon` queda solo para Compra. Quité la copia de Semana, que con este diff ya no se usaba.
  - `app/styles/nutri-shared.css`: bloque «Semana (rd-N2)» con las clases `.nut-wk*` y `.nut-dayctx*`, más sus reglas de reduced-motion y contrast al final de la hoja.
- Verificación (390×844, cuenta ricardovisus, sin crear datos): `scrollWidth` = 390 en Semana, en el día abierto y en la semana vacía (23–29 nov). Las filas de día miden 358×112, las flechas 44×44 y «Ir a hoy» 62×44. El foco con teclado se ve (anillo azul en la fila). Consola sin errores. `npx tsc --noEmit` limpio. Capturas y script en `.tmp-verify/rd-N2/`. `browse.lock` tomado y liberado.
- Duda: ninguna de producto. Aviso para el master: `app/a/[id]/nutrition/` sigue entero sin seguimiento en git. Eso incluye los archivos de N1 (`actions.ts`, `segments.tsx`, `today-view.tsx`), aunque `ad022ee` dice N1. El `git add` de esta tarea tiene que incluir la carpeta entera.
- Recomendación: commit con `git add app/a/[id]/nutrition/ app/a/[id]/nutrition-pane.tsx app/styles/nutri-shared.css`. Comprueba antes con `git show --stat ad022ee` si N1 quedó fuera de su commit.
- Bloquea a Adrián: no.

Decisiones:
- Puse filas verticales y no una tira horizontal de 7 columnas porque a 390 cada columna se quedaría en unos 46 px y el MD y las miniaturas no se leerían. Así cada día es una fila de lista iOS con miniaturas de 52 px.
- Renombré la raíz de `.nut-week` a `.nut-wk` porque `.nut-week` ya es de Amanda en `nutri.css` (`display: none` en móvil) y ocultaba la vista.
- No hice commit porque el brief lo prohíbe: lo hace el master.
