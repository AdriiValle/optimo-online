# rd-C2 - Amanda: ficha del plato, ingredientes y modales

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Rediseñar meal-drawer.tsx, meal-items-editor.tsx, NutModal y MealSlotForm (en nutricion-athlete-client.tsx; adoptan las clases .sheet* de F3), subida de foto y 'platos iguales'. Ficha tipo Apple Health: héroe con foto, titular, macros de la comida, ingredientes editables.

## Archivos
- SI (solo estos): `app/nutricion/[athleteId]/meal-drawer.tsx`, `app/nutricion/[athleteId]/meal-items-editor.tsx`, `app/nutricion/[athleteId]/nutricion-athlete-client.tsx`, `app/styles/nutri.css`
- NO: las partes de nutricion-athlete-client ya hechas por C1 (toolbar, vistas) y las de C3 (anillos). Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- Abrir un plato muestra ficha (drawer a >=1280, sheet debajo) con foto, macros e ingredientes bien jerarquizados.
- Editar ingredientes (alimento, gramos, rol, confirmar), subir foto y 'platos iguales' siguen funcionando.
- Modales con scrim y cierre por X/Escape.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-C2/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-C2`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-C2/`.

## CORRECCION
Vuelves por un NO PASA. Lee workflow/briefs/from-audit-C2.md y corrige SOLO los bloqueantes. Nada mas. Reescribe from-rd-C2.md.

## Al terminar
Escribe `workflow/briefs/from-rd-C2.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
