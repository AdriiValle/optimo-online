# from-opus-nutri-look-o2

- **Hecho:** sí (commit `7fecb04` en `dev`)

## Qué cambió (rutas)

- `app/nutricion/[athleteId]/meal-drawer.tsx` (nuevo):
  - `MealFicha` muestra, en este orden: héroe 16:10 (foto o placeholder tint + nombre de la categoría), etiqueta de categoría en ink, titular (proteína) + resto, **Macros** de esa comida (kcal grande, «≈» si faltan ingredientes, «Faltan N por confirmar»), `MacroDonut`, `MealItemsEditor` tal cual, y «Editar plato» plegado.
  - `MealDrawer` es un panel `role="dialog"`: el foco entra al abrir o al cambiar de celda, Tab queda atrapado dentro y la ✕ mide 36 px.
  - `MacroDonut` se ha movido aquí desde el cliente. Lleva `unit`/`mark` opcionales y el resumen semanal no cambia.
- `lib/queries.ts`: `nutritionTotals` devuelve además `meals: MealNutrition[]` (`mealSlotId`, `quantified`, `missing`, `totals`). Los totales del día son ahora la suma de los platos completos, así que comida + cena = día. El resto del contrato no cambia.
- `app/nutricion/[athleteId]/nutrition-summary.ts`: `fmt` se ha movido aquí y hay un helper nuevo, `mealMacros`.
- `app/nutricion/[athleteId]/nutricion-athlete-client.tsx`:
  - `useWideWorkspace` (matchMedia ≥1280) elige entre el drawer, que va dentro de `.nut-ws-main`, y `NutModal` para <1280, con el mismo contenido.
  - Esc y ✕ cierran y devuelven el foco a la celda (`data-cell`). La ficha se cierra sola si su día deja de estar visible.
  - `MealSlotForm` muestra el título **sin** corchete. Si el texto no se toca, al guardar envía el título original tal cual (el hash no cambia). Si se edita, vuelve a poner el mismo `[CATEGORÍA]` delante, y el `maxLength` descuenta el corchete.
  - En la ficha, el formulario ya no repite la foto.
- `app/globals.css`:
  - Estilos base de la ficha (héroe, placeholder, titular, kcal y el donut con ámbito `.nut-ficha`, para que también se vea en el sheet).
  - A partir de 1280: `.nut-ws-main { position: relative }` y `.nut-drawer`, un panel absoluto de 400 px a la derecha, opaco, con `--shadow-md`, scroll interno y animación `drawer-in`.
  - Reduced-motion: fundido de 160 ms. `prefers-contrast`: filete en ink + borde en el héroe.

## Verificación

Hecha con el build de producción en :3002, la sesión de Amanda y Ricardo Visus, semana del 2 al 8 de noviembre. Capturas en `.tmp-verify/look-o2/`.

- **1280×800 y 1440×900:** `scrollHeight == innerHeight`. Los rects del rail y de la rejilla son idénticos antes y después de abrir. El drawer queda en x=856 y mide 400 px.
- **Cambiar de celda:** con el drawer abierto, al pulsar el martes la ficha pasa al martes («Faltan 4 por confirmar», «— kcal») y sigue habiendo un solo drawer.
- **Cerrar:** Esc y ✕ cierran el drawer y el foco vuelve a la celda que lo abrió.
- **Macros:** lunes comida 702 kcal (41/73/27 g), que coincide con el total del día y de la semana (único plato completo, 1/14).
- **Confirmar un ingrediente:** quité la confirmación de un ingrediente y guardé. La ficha pasó a «Faltan 1 · ≈684 kcal» y el panel a «Pendiente · 0/14». Al volver a confirmarlo, 702 y 1/14. El dato queda como estaba.
- **Guardar sin tocar el texto:** responde «Guardado.», el plato sigue contando, no aparecen obsoletos y el `aria-label` sigue diciendo «(carne)».
- **375 px:** sale el sheet con la ficha y el donut, y `scrollWidth` = 375.
- `tsc` limpio y `npm run build` verde.

## Notas

- **Sin probar:** reduced-motion y `prefers-contrast` no los he probado en el navegador, porque el headless no emula media queries. Solo están en el CSS.
- **Sin probar en datos reales:** guardar con el texto editado (corchete delante), para no dejar ingredientes obsoletos en el menú real.
- **Origen del trabajo:** parte del trabajo venía a medias de un intento anterior en el working tree (drawer, `meals`, ficha). Lo he revisado y lo he cerrado: CSS, corchete y verificación.
- **Móvil:** en el menú apilado los campos «Plato» también salen ya sin corchete, porque es el mismo `MealSlotForm`. El `<summary>` de esa lista no lo he tocado (está fuera del alcance de O2).
- **No commiteado:** `.gitignore` (`+.gstack/`), `.tmp-verify/` y `workflow/inbox/` ya estaban así y no son míos.

- **Duda:**
- **Recomendación:**
- **Bloquea a Adrián:** no
