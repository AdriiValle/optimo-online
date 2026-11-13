# rd-F3 - Primitivos Apple (tokens, base, componentes, a11y) y /dev/ui

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Reestilo de app/styles/tokens.css, base.css, components.css y a11y.css con los tokens de design-system.md v2 (acento azul Apple, tipografía SF + Inter de respaldo vía next/font en app/layout.tsx, materiales, radios, sombras, movimiento). Primitivos: botones (primario/secundario/ghost/destructivo, pending/disabled), campos y etiquetas, selector segmentado, sheet/modal (clases comunes .sheet* para que C2/A2/B1 las adopten), alerta/error inline, toggle, lista agrupada inset, chips, estados vacío/carga/error, foco, press, avatar. Crea app/dev/ui/page.tsx con todos los estados; debe devolver notFound() si NODE_ENV === 'production'. Cambia el aspecto de toda la app de golpe: se acepta que las pantallas queden 'a medias' hasta su tarea, pero ninguna debe quedar rota ni ilegible.

## Archivos
- SI (solo estos): `app/styles/tokens.css`, `app/styles/base.css`, `app/styles/components.css`, `app/styles/a11y.css`, `app/layout.tsx`, `app/dev/ui/page.tsx`
- NO: el resto de hojas y componentes. Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- /dev/ui muestra todos los primitivos y estados (hover/press/focus/disabled/pending) con el estilo Apple del design-system v2; en producción da 404.
- Los tokens v2 están definidos en tokens.css y los primitivos solo usan tokens.
- Login, /a/<id>, /panel y /nutricion/<id> siguen siendo legibles y usables (sin romperse) con los nuevos primitivos.
- prefers-reduced-motion, prefers-reduced-transparency y prefers-contrast resueltos en a11y.css.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-F3/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-F3`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-F3/`.

## Al terminar
Escribe `workflow/briefs/from-rd-F3.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
