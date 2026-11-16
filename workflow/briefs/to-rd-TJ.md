# rd-TJ - Transversal jugador: tactilidad, transiciones y escritorio presentable

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Revisión de player.css, nutri-shared.css y los archivos de la pista A: objetivos táctiles >=44, transiciones de tab bar/sheet con press y springs de tokens, el jugador en escritorio (1280) centrado y presentable, y consistencia visual entre Entreno/Nutrición/Diario/Ajustes.

## Archivos
- SI (solo estos): `app/styles/player.css`, `app/styles/nutri-shared.css`, `app/a/[id]/home-client.tsx`, `app/a/[id]/nutrition-pane.tsx`, `app/a/[id]/nutrition/*`, `app/a/[id]/session-list.tsx`, `app/a/[id]/device-card.tsx`, `app/ajustes/ajustes-client.tsx`
- NO: todo lo demas. Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- Todas las pestañas del jugador a 390 coherentes entre sí, táctiles >=44 y transiciones suaves.
- A 1280 el jugador se ve centrado y presentable.
- Funciones del jugador intactas (ver sesión/vídeo, diario, nutrición Hoy/Semana/Compra/check, ajustes).
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-TJ/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-TJ`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-TJ/`.

## Al terminar
Escribe `workflow/briefs/from-rd-TJ.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
