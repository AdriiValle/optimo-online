# rd-A5 - Jugador: nutrición (base visual)

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Rediseñar app/a/[id]/nutrition-pane.tsx y app/styles/nutri-shared.css: menú del día con foto, franja y plato; notas de dieta y suplementos como listas agrupadas. Este componente lo reutiliza la ficha de Amanda a 1280: no debe romperse ahí.

## Archivos
- SI (solo estos): `app/a/[id]/nutrition-pane.tsx`, `app/styles/nutri-shared.css`
- NO: todo lo demas. Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- Pestaña Nutrición a 390 con el estilo Apple: menú del día por franjas, suplementos y notas legibles.
- En /nutricion/<id> a 1280 (ficha y panel de Amanda) los bloques que reutilizan estas clases siguen bien.
- Estados vacíos: sin menú hoy, sin suplementos, sin notas.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-A5/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-A5`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-A5/`.

## CORRECCION
Vuelves por un NO PASA. Lee workflow/briefs/from-audit-A5.md y corrige SOLO los bloqueantes. Nada mas. Reescribe from-rd-A5.md.

## Al terminar
Escribe `workflow/briefs/from-rd-A5.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
