# rd-C4 - Amanda: perfil, importar Word y cuenta

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Rediseñar athlete-profile-form.tsx (modal Perfil), menu-word-import.tsx (flujo entero: elegir archivo, opciones, confirmar, resultado, error) y los ajustes de cuenta de Amanda (.nut-account-settings) con sheets y listas agrupadas.

## Archivos
- SI (solo estos): `app/nutricion/[athleteId]/athlete-profile-form.tsx`, `app/nutricion/[athleteId]/menu-word-import.tsx`, `app/styles/nutri.css`
- NO: todo lo demas. Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- Perfil, importar menú y cuenta se abren como sheets Apple a 1440 y 390.
- Importar un .docx de prueba (si no hay uno en el repo, valida solo el flujo hasta elegir archivo y el estado de error) y guardar perfil (mismos valores) siguen funcionando.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-C4/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-C4`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-C4/`.

## Al terminar
Escribe `workflow/briefs/from-rd-C4.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
