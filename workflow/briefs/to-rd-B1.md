# rd-B1 - Admin: panel de deportistas y shell de escritorio

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Rediseñar app/panel/page.tsx, deportistas-section.tsx y create-form.tsx para escritorio 1440: toolbar + large title, lista/tabla densa de deportistas (avatar, nombre, estado, acciones) y alta de deportista en sheet. Estado vacío 'sin deportistas'. Sin sidebar (solo hay 2 secciones).

## Archivos
- SI (solo estos): `app/panel/page.tsx`, `app/panel/deportistas-section.tsx`, `app/panel/create-form.tsx`, `app/styles/admin.css`
- NO: analisis.tsx y app/panel/ajustes/* (otras tareas). Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- /panel a 1440 con diseño de escritorio Apple (tabla/lista densa, acciones claras); a 768 y 390 no se rompe.
- Alta de deportista en sheet funciona; estado vacío diseñado.
- Abrir un deportista lleva a /a/<id> como antes.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-B1/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-B1`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-B1/`.

## Al terminar
Escribe `workflow/briefs/from-rd-B1.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
