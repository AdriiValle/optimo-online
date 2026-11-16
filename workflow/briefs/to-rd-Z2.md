# rd-Z2 - Ejecutar arreglos finales e informe

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Sonnet ejecuta. Lee workflow/briefs/arreglos-finales.md y aplica los arreglos uno a uno, exactamente como estÃ¡n descritos, con el cambio mÃ­nimo y sin decidir diseÃ±o nuevo; verifica cada uno como indica la lista. Si un arreglo es ambiguo o arriesgado, no lo hagas y anÃ³talo. DespuÃ©s escribe workflow/briefs/informe-final-rediseno.md: lista de cambios por pista, quÃ© se verificÃ³, arreglos hechos y no hechos, y problemas conocidos.

## Archivos
- SI (solo estos): `app/`, `workflow/briefs/informe-final-rediseno.md`, `workflow/briefs/arreglos-finales.md`
- NO: lib/, db/ y cualquier cosa que la lista de arreglos no mencione. Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- Cada arreglo de la lista estÃ¡ hecho y verificado, o anotado como no hecho con el motivo.
- informe-final-rediseno.md existe y es honesto sobre lo pendiente.
- npx tsc --noEmit limpio.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-Z2/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-Z2`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-Z2/`.

## Al terminar
Escribe `workflow/briefs/from-rd-Z2.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
