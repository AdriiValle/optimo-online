# rd-S1 - Login y not-found estilo Apple

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Pantalla de entrada premium (patrón de pantallas de acceso de Apple: logo centrado, campos en lista agrupada, botón primario ancho, mensaje de error claro, estado 'enviando') en móvil y escritorio. not-found con el mismo lenguaje. Conserva el flujo de credenciales y la redirección por rol.

## Archivos
- SI (solo estos): `app/login/page.tsx`, `app/styles/login.css`, `app/not-found.tsx`
- NO: todo lo demas. Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- /login a 390 y 1440: logo, campos, botón con estados vacío/enviando/error de credenciales, todo con tokens v2.
- Entrar como jugador, admin y Amanda redirige igual que antes; error de credenciales muestra mensaje.
- /no-existe muestra not-found coherente.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-S1/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-S1`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-S1/`.

## Al terminar
Escribe `workflow/briefs/from-rd-S1.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
