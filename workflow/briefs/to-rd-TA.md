# rd-TA - Transversal admin y Amanda: responsive y consistencia

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Revisión de admin.css, nutri.css, login.css y los archivos de pistas B/C/N-Amanda: admin y Amanda a 768 y 390 sin romperse, consistencia visual entre panel, análisis, ajustes y las pestañas de Amanda (Menú, Seguimiento, Perfil, Compra, Plantillas, Informes, Alimentos), y estados vacíos/carga/error homogéneos.

## Archivos
- SI (solo estos): `app/styles/admin.css`, `app/styles/nutri.css`, `app/styles/login.css`, `app/nutricion/*`, `app/panel/*`
- NO: todo lo demas. Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- Admin y Amanda a 1440, 768 y 390 sin scroll horizontal ni elementos solapados en todas sus pantallas.
- Las pestañas de Amanda comparten el mismo lenguaje visual y estados.
- Funciones intactas en panel y nutrición.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-TA/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-TA`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-TA/`.

## Al terminar
Escribe `workflow/briefs/from-rd-TA.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
