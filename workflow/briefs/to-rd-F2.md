# rd-F2 - Partir globals.css en hojas sin cambio visual

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Seguir al pie de la letra la sección 4 (F2) de workflow/briefs/plantillas-rediseno.md: partir app/globals.css en app/styles/{tokens,base,components,shell,admin,player,nutri-shared,nutri,login,a11y}.css por los rangos de líneas indicados (a fecha de 5c76153; si globals.css cambió, corta por los comentarios-cabecera equivalentes), dejando globals.css solo con 10 líneas @import en el orden de la tabla. No cambies ni una regla ni borres CSS muerto. Antes de tocar: copia globals.css a .tmp-verify/f2/globals.orig.css y toma capturas 'antes' de las rutas de la tabla de viewports (viewport principal + 390; Amanda también 1280; espera 1 s por la animación de anillos).

## Archivos
- SI (solo estos): `app/globals.css`, `app/styles/tokens.css`, `app/styles/base.css`, `app/styles/components.css`, `app/styles/shell.css`, `app/styles/admin.css`, `app/styles/player.css`, `app/styles/nutri-shared.css`, `app/styles/nutri.css`, `app/styles/login.css`, `app/styles/a11y.css`
- NO: cualquier otro archivo; no cambies reglas. Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- Multiconjunto de líneas idéntico: grep -v '^\s*$' globals.orig.css | sort == cat de las 10 hojas (sin líneas vacías ni @import) | sort; diff vacío.
- Capturas antes/después con el mismo sha256 por par en las rutas de la lista; si un par difiere, se justifica (dato vivo/animación) o se corrige el orden.
- npx tsc --noEmit limpio y la página recarga sin aviso de CSS en next dev.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-F2/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-F2`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-F2/`.

## Al terminar
Escribe `workflow/briefs/from-rd-F2.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
