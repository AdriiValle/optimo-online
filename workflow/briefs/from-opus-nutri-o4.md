# from-opus-nutri-o4

- **Hecho:** sí — commit `8cdc588` en `dev`.

## Qué cambió (rutas)
- `app/nutricion/[athleteId]/meal-items-editor.tsx` (nuevo): editor de ingredientes en el modal del plato. Cada ingrediente tiene alimento, g, rol y una casilla «Confirmado». Botones: «Confirmar ingredientes» (confirma los que tienen alimento y g) y «Guardar sin confirmar». Usa el PUT de O3. Los condimentos `other` sin g no bloquean. Los obsoletos salen aparte, atenuados y sin poder confirmarse; si el API devuelve 409, avisa y recarga. Un plato sin ingredientes muestra «Generar borradores», que llama al POST draft de O3 para ese día. Arriba sale el estado del plato: «Cuenta en los totales» o «No cuenta todavía: N…».
- `app/nutricion/[athleteId]/nutrition-summary.ts` (nuevo): suma los días según la vista (día, semana o mes). Las medias por día se dividen solo entre los días que tienen algún plato cuantificado. Si falta un valor, devuelve null y nunca un 0.
- `app/nutricion/[athleteId]/nutricion-athlete-client.tsx`: `WeekPanel` usa ahora `nutritionTotals`:
  - Cabecera: «1.840 kcal · 3/5 platos», «Pendiente · 0/5 platos» o «Sin platos».
  - Anillos: kcal del periodo, proteína e hidratos en g/kg/día (si no hay `weight_kg`, pone «falta peso»), donut P/HC/G con g/día y % kcal, y micros por día.
  - «≥» cuando a algún alimento le falta ese valor.
  - Nota: «Estimado del menú planificado… sodio sin sal de mesa».
  - Los totales se recalculan al guardar un plato o sus ingredientes.
- `app/nutricion/[athleteId]/menu-word-import.tsx`: casilla «Generar ingredientes en borrador» (`withItems=1`, marcada por defecto). El mensaje final dice cuántos platos tienen borradores.
- `lib/queries.ts`: añadidos `mealItemsForSlot` y `nutritionTotals(tx, athleteId, from, to)`. Un plato cuenta si todos sus items vigentes (mismo `text_hash`) están confirmados y tienen `food_id` y g. Los `other` sin g no cuentan ni bloquean. Se usa `weight_kg`.
- `app/api/nutrition/meal-items/route.ts`: nuevo `GET ?mealSlotId=`, que devuelve los items y el catálogo de alimentos.
- `app/api/nutrition/totals/route.ts` (nuevo): `GET ?athleteId&from&to`, máximo 63 días.
- `app/globals.css`: estilos `nut-items*`, `nut-item*` y `nut-import-check`.

## Verificación
- `tsc --noEmit` limpio.
- Script de prueba contra la DB real dentro de una transacción con rollback (borrado al acabar, no está en el commit). Día 2026-11-02, comida:
  - Sin confirmar: 0/2, se ve «pendiente».
  - Con los ingredientes confirmados, el cálculo a mano da 701,6 kcal, P 40,9, HC 73,2 y G 27,4. La UI da exactamente lo mismo.
  - Cobertura: día 1/2, semana 1/14, mes 1/42, y en los tres la misma cifra de kcal.
  - Al cambiar el texto del plato, sus items quedan obsoletos y vuelve a pendiente.
- En el dev server (:3001) con la sesión de Amanda: `GET totals` y `GET meal-items` responden bien y `/nutricion/<id>` devuelve 200.
- No he hecho prueba visual en el navegador.

## Duda
- Fuera de la lista de archivos del brief: añadí 2 GET en `app/api/nutrition/**`. Hacían falta para leer los items y los totales desde el cliente.
- «Generar borradores» usa el POST draft de O3, que funciona por rango de fechas. Con el rango de un solo día, también regenera los otros platos de ese día cuyo texto cambió. Nunca toca los confirmados ni los platos sin cambios.
- Ricardo no tiene `weight_kg`, así que g/kg sale como «falta peso».

## Recomendación
- Dejar los GET como están, siguen el mismo patrón que los de O3.
- Cargar el peso de Ricardo para ver g/kg.
- Antes de O5/O6, una pasada visual del modal en desktop (480 px).

## Bloquea a Adrián
No.

## Para Adrián: cómo lo usa Amanda (corto)
1. Al importar el Word, deja marcada «Generar ingredientes en borrador».
2. Abre un plato: debajo del formulario están los ingredientes con alimento y gramos ya propuestos. Corrige lo que haga falta y pulsa «Confirmar ingredientes».
3. El resumen (día, semana o mes) suma solo los platos confirmados y muestra «kcal · x/y platos». Si no hay ninguno confirmado, sale «Pendiente».
4. Si cambia el texto de un plato, sus ingredientes anteriores dejan de contar. Pulsa «Generar borradores» y vuelve a confirmar.
