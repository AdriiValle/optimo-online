# rd-N9 - Amanda: Compra e Informes (PDF/impresión)

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Pestaña Compra de Amanda (/nutricion/[athleteId]/compra): la misma lista de la compra del jugador (reutiliza lib/nutrition/shopping.ts y su API) para revisarla, con aviso de alimentos sin sección/unidad y enlace a /nutricion/alimentos. Pestaña Informes (/nutricion/[athleteId]/informes): vista imprimible (@media print) del menú semanal + lista de la compra + objetivos del deportista, con botón Imprimir/Guardar PDF y diseño de informe limpio estilo Apple.

## Archivos
- SI (solo estos): `app/nutricion/[athleteId]/compra/*`, `app/nutricion/[athleteId]/informes/*`, `app/styles/nutri.css`
- NO: lib/queries.ts, db/, lib/nutrition/shopping.ts (solo lectura). Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- La pestaña Compra de Amanda muestra la misma lista que ve el jugador y avisa de alimentos sin sección.
- Informes muestra el menú semanal, la lista y los objetivos; imprimir (emulando print) da una hoja limpia sin chrome de la app.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-N9/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-N9`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-N9/`.

## Al terminar
Escribe `workflow/briefs/from-rd-N9.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
