# from-opus-import-confirm

- Hecho: sí (commit `bb346d5` en `dev`, `npx tsc --noEmit` limpio; no probado contra BD real)
- Qué cambió (rutas):
  - `lib/queries.ts` — `insertDraftMealItems(..., confirmed = false)`: el flag se pasa al insert en vez del `false` fijo.
  - `lib/nutrition/generate-drafts.ts` — `opts.confirm?: boolean`, que se pasa al insert. Por defecto sigue siendo sin confirmar (no cambia `/api/nutrition/meal-items/draft` ni `scripts/verify-meal-drafts.ts`).
  - `app/api/nutrition/menu-import/route.ts` — con `withItems=1` llama a `generateMealItemDrafts(..., { confirm: true })`.
  - No cambian gramos, plantillas ni roles. Los ítems sin alimento o sin gramos se confirman igual, pero `itemIsQuantified` sigue pidiendo alimento + gramos, así que esos platos no cuentan en los totales hasta que se completen. Amanda puede desmarcar o editar en el editor de O4.
- Duda: como ahora los ítems del import nacen confirmados, se rigen por las reglas de reimport de los confirmados. Si se vuelve a importar un Word con el texto de un plato **cambiado**, `deleteUnconfirmedMealItems` ya no borra los ítems del import anterior: quedan como obsoletos (se ven en la lista de obsoletos del editor) y se generan ítems nuevos confirmados. Si el texto no cambia, el hash es el mismo y no se hace nada, como antes. Con `force` en el endpoint de borradores, el plato se mantiene (`slotsConfirmedKept`).
- Recomendación: dejarlo así. Encaja con la regla del brief (solo cambia el valor por defecto) y no se pierde nada de lo que Amanda haya revisado. Si molesta que se acumulen obsoletos en los reimports, hacer un brief aparte: distinguir lo confirmado automáticamente de lo confirmado a mano (por ejemplo `origin`/columna `auto_confirmed`) y borrar en el reimport los auto-confirmados que no se hayan tocado.
- Bloquea a Adrián: no.
