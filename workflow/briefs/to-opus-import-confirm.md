# to-opus-import-confirm

## Objetivo

Al subir el Word del menú, los ingredientes de los ítems generados en import deben quedar **aceptados/confirmados por defecto** (`confirmed = true`). Amanda puede revisar y corregir después. **No** exigir confirmación manual plato a plato en el flujo normal de import.

## Contexto

- O3 `generateMealItemDrafts` (u homólogo) crea borradores **sin** confirmar.
- O4 UI muestra acción tipo «Confirmar ingredientes» y hoy obliga a confirmar cada plato; eso no vale para el caso de import con ítems.

## Cambio pedido

- Ajustar el flujo de **import con ítems** (`withItems` / `withItems=1`): los **ítems nuevos** creados en ese import deben persistirse con **`confirmed: true`** (o el flag equivalente en schema/API).
- Mantener coherencia con reglas existentes de reimport (hashes, borrar no confirmados, obsoletos, etc.): solo cambia el **valor por defecto de confirmación** para ítems generados en este import, no inventar gramos ni saltarse plantillas/roles existentes.
- **No inventar gramos** (ni rellenar cantidades ficticias).

## Criterio de hecho

- Import Word con ítems: los meal items nuevos aparecen ya confirmados; Amanda puede deshacer o editar en UI si hace falta.
- `pnpm exec tsc` / `npx tsc --noEmit` (lo que use el repo) **limpio**.
- **Commit en rama `dev`** con mensaje claro (sin force push; no tocar `main`).

## Archivos probables

Rutas relacionadas con nutrition/meal-items, API draft/import, y el caller de import `withItems`: `lib/nutrition/**`, `app/api/nutrition/**`, import Word. Cwd: este repo.
