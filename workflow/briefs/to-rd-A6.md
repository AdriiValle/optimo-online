# rd-A6 - Ajustes del jugador y formularios de cuenta

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Rediseñar app/ajustes/* y los formularios compartidos password-form.tsx y username-form.tsx con lista agrupada de Ajustes de iOS. Comprueba también /panel/ajustes y la cuenta de Amanda, que usan los mismos formularios.

## Archivos
- SI (solo estos): `app/ajustes/page.tsx`, `app/ajustes/ajustes-client.tsx`, `app/components/password-form.tsx`, `app/components/username-form.tsx`, `app/styles/player.css`
- NO: todo lo demas. Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- /ajustes a 390 con listas agrupadas, mensajes de error/éxito y estados pending.
- Cambiar usuario y contraseña siguen funcionando (no cambies credenciales reales: prueba con error de validación o restaura).
- Los mismos formularios se ven bien en /panel/ajustes y en el modal de cuenta de Amanda.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-A6/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-A6`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-A6/`.

## Al terminar
Escribe `workflow/briefs/from-rd-A6.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
