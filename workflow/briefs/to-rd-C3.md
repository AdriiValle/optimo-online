# rd-C3 - Amanda: resumen nutricional (anillos y panel)

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Rediseñar Ring, WeekPanel y micros de nutricion-athlete-client.tsx (nutrition-summary.ts solo si es formato) con el lenguaje de Apple Fitness/Health: anillos legibles, macros y micros con jerarquía, estados falta/parcial/en rango/pasado/tope con los tokens de estado de F1, panel lateral en día. Mantén los objetivos calculados del perfil.

## Archivos
- SI (solo estos): `app/nutricion/[athleteId]/nutricion-athlete-client.tsx`, `app/nutricion/[athleteId]/nutrition-summary.ts`, `app/styles/nutri.css`
- NO: lógica de lib/nutrition/targets.ts. Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- El resumen día/semana/mes se lee de un vistazo: energía y macros grandes, micros compactos, estado en texto y color, cobertura X/Y platos.
- Con perfil incompleto aparece 'Completar perfil' que abre el perfil; sin NaN.
- Animación de relleno respeta reduced-motion.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-C3/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-C3`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-C3/`.

## Al terminar
Escribe `workflow/briefs/from-rd-C3.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
