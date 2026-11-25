# from-opus-nutri-look-o1

- **Hecho:** sí (commit `45cde36` en `dev`)

## Qué cambió (rutas)

- `lib/nutrition/protein-category.ts` (nuevo, puro):
  - `splitCategory(title)` devuelve `{ key, label, body }`. Usa el mismo regex que antes. Mixta → manda la primera (`HUEVOS/PESCADO` y `PESCADO AZUL + HUEVOS` salen bien). `LEGUMBRES/…` → legumbres; sin corchete o desconocida → `none`.
  - `dishLines(body)` devuelve `{ headline, rest }`. Con 3 líneas, la proteína (línea 2) va de titular. Quita el «con» colgante.
- `lib/nutrition/parse-dish.ts`: ahora importa `splitCategory`. `scripts/verify-dish-parse.ts` da una salida idéntica (diff vacío antes/después).
- `app/nutricion/[athleteId]/nutricion-athlete-client.tsx`:
  - `DishCell` nuevo, compartido por las vistas Semana y Día. El `aria-label` queda así: «Comida, lunes 2: Muslos de pollo al airfrayer (carne)».
  - Miniatura de 36 px solo en las franjas principales.
  - `useThinSlots`: una franja sin platos en los días visibles pasa a una fila de 24 px. Mientras carga se mantiene la última decisión, para que la rejilla no salte.
  - `MonthCalendar`: los puntos de comida y cena llevan la clase `nut-cat--*`.
- `app/globals.css`:
  - Tokens `--cat-*` y `--cat-rule` en `:root`, más las clases `.nut-cat--*` (ink/tint), que O2 puede reutilizar.
  - Tarjeta: tint de fondo, filete inset en ink, `--press-scale-lg` y la línea secundaria en `--accent-hover`.
  - Fila fina, y puntos del mes teñidos.
  - `prefers-contrast: more`: tint → `--surface`, filete de 4 px y borde `--text`.
  - He quitado los tamaños de img de snack que se quedaron huérfanos con este diff.
- `workflow/context/design-system.md`: sección nueva «Categoría de proteína».

## Verificación

Hecha con la sesión de Amanda y Ricardo Visus, semana del 2 al 8 de noviembre. Capturas en `.tmp-verify/look-o1/`.

- **Sin scroll:** a 1280×800, 1440×900 y también 1280×600, `scrollHeight == innerHeight` en Semana, Día y Mes, y ni `.nut-week` ni la rejilla desbordan.
- **Corchetes:** 0 celdas con `[`.
- **Filas finas:** 21 celdas finas (desayuno, media mañana y merienda); comida y cena se quedan el alto.
- **Mes:** los puntos salen en los 4 inks más el gris de `none`.
- **375 px:** `scrollWidth` = 375.
- **`prefers-contrast`:** simulado inyectando las reglas de esa media query (el navegador headless no emula media). Se ve legible.
- **Scripts y build:** `verify-meal-drafts.ts` da una salida idéntica a la de antes. Ya traía un `FALLO` previo porque la semana ya tenía borradores; no lo ha causado este cambio. `tsc` limpio y `npm run build` verde.

## Notas

- Me he salido un poco de la spec: cuando la celda mide ≥96 px (container query), el titular llega a 3 líneas y el resto envuelve hasta 4. Lo hice porque con las franjas vacías colapsadas las celdas miden unos 150 px y el corte a 2+1 líneas dejaba medio hueco. En celdas bajas se mantiene el 2+1 del plan.
- Mi `npm run build` pisó el `.next` del `next dev` que estaba corriendo en :3001 y lo rompió. Lo reinicié limpio y vuelve a estar arriba en :3001 (proceso independiente).
- `.gitignore` (`+.gstack/`) estaba modificado de antes. No es mío y no lo he commiteado.
- El Word trae 2 platos con el corchete `[SALMON]`, que salen `none` (gris) según la regla del plan. También hay un «Salmón a la plancha» etiquetado `[CARNE]`: es un error del Word y no lo corrijo.
- El móvil (<1280) sigue mostrando `[PESCADO] …` en el summary de `MealSlotForm`. Eso no es celda y queda fuera de O1; O2 toca `MealSlotForm` (título sin corchete).

## Duda

## Recomendación

## Bloquea a Adrián

No.
