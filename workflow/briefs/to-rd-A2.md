# rd-A2 - Jugador: sesiones y vídeo

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Rediseñar session-list.tsx y video-embed-modal.tsx: lista de sesiones estilo Apple Fitness (tarjetas/filas con jerarquía clara) y el vídeo en sheet (clases .sheet* de F3).

## Archivos
- SI (solo estos): `app/a/[id]/session-list.tsx`, `app/a/[id]/video-embed-modal.tsx`, `app/styles/player.css`
- NO: todo lo demas. Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- La lista de sesiones del día es clara a 390; abrir un vídeo muestra un sheet que se cierra con X, scrim y Escape.
- Funciones intactas: ver sesión y abrir/cerrar vídeo.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-A2/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-A2`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-A2/`.

## Al terminar
Escribe `workflow/briefs/from-rd-A2.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
