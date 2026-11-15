# rd-N4 - Nutrición jugador: check de comidas

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
En Hoy, cada franja lleva un check de un toque: Hecho / A medias / No, con comentario corto opcional y foto opcional del plato real (reutiliza el patrón de subida y resize de lib/image-resize.ts), guardado en meal_checks. Sin rachas, sin puntuaciones, sin comparación. API en app/api/nutrition/checks/*; consultas en lib/nutrition/checks-queries.ts.

## Archivos
- SI (solo estos): `app/a/[id]/nutrition/*`, `app/a/[id]/nutrition-pane.tsx`, `app/api/nutrition/checks/*`, `lib/nutrition/checks-queries.ts`, `app/styles/nutri-shared.css`
- NO: lib/queries.ts, db/. Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- En Hoy a 390 se marca Hecho/A medias/No por franja en un toque, con comentario y foto opcionales; se mantiene al recargar.
- Un jugador solo puede marcar sus propias franjas.
- Sin gamificación ni números de cumplimiento visibles para el jugador.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-N4/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-N4`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-N4/`.

## Al terminar
Escribe `workflow/briefs/from-rd-N4.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
