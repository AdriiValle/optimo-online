# rd-N7 - Amanda: seguimiento (cumplimiento y medidas)

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Pestaña Seguimiento (/nutricion/[athleteId]/seguimiento): (a) cumplimiento por semana y por tipo de día a partir de meal_checks (hecho/a medias/no), con la foto real junto a la del plan y el comentario del jugador; (b) medidas corporales (body_measurements): registrar peso, % graso, suma de pliegues, cintura y notas; gráfica de línea limpia estilo Apple Salud; el peso del perfil pasa a ser el último registro (sin romper athletes.weight_kg: al guardar una medida con peso, actualiza el perfil). Solo visible en el panel de Amanda/admin, nunca para el jugador. Consultas en lib/nutrition/tracking-queries.ts; API en app/api/nutrition/tracking/*.

## Archivos
- SI (solo estos): `app/nutricion/[athleteId]/seguimiento/*`, `app/api/nutrition/tracking/*`, `lib/nutrition/tracking-queries.ts`, `app/styles/nutri.css`
- NO: lib/queries.ts, db/. Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- Se registra una medida, aparece en la gráfica y el peso del perfil/anillos se actualiza (prueba y restaura).
- El cumplimiento semanal y por tipo de día se calcula de los checks existentes; con la foto real junto a la del plan.
- Estados vacíos sin datos.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-N7/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-N7`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-N7/`.

## Al terminar
Escribe `workflow/briefs/from-rd-N7.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
