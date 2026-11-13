# rd-S2 - Cabecera y navegación superior (todas las variantes)

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Barra superior estilo Apple para jugador (large title / compacta al hacer scroll) y variante wide de admin y Amanda (toolbar con título grande, botón atrás, acciones y salir). La tab bar inferior del jugador NO es de esta tarea.

## Archivos
- SI (solo estos): `app/components/brand-header.tsx`, `app/components/header-actions.tsx`, `app/components/header-back-button.tsx`, `app/logout-button.tsx`, `app/styles/shell.css`
- NO: todo lo demas. Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- La cabecera se ve Apple en /a/<id> (jugador), /panel (admin) y /nutricion/<id> (Amanda), con material translúcido correcto y sin solaparse con el contenido.
- Botón atrás, ajustes y salir funcionan en los tres roles; el comportamiento al hacer scroll es suave y respeta reduced-motion.
- No hay saltos de layout al cargar.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-S2/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-S2`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-S2/`.

## Al terminar
Escribe `workflow/briefs/from-rd-S2.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
