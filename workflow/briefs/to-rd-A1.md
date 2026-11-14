# rd-A1 - Jugador: inicio y plan (tab bar, calendario, cinta, foco del día)

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Rediseñar app/a/[id]/home-client.tsx (cabecera del deportista, pestañas dash-tabs -> tab bar inferior estilo iOS para el jugador con iconos SF-like en SVG simples y etiquetas, calendario, cinta semanal, foco del día) y plan-calendar.tsx. Quita el CSS muerto .recovery-strip. Estados: día sin sesión, semana sin plan. Esta pantalla la ve también el admin: no debe romperse (botón atrás, chip de integración, pestaña Análisis solo-admin).

## Archivos
- SI (solo estos): `app/a/[id]/home-client.tsx`, `app/a/[id]/page.tsx`, `app/components/plan-calendar.tsx`, `app/styles/player.css`
- NO: analisis.tsx, nutrition-pane.tsx, device-card.tsx, session-list.tsx, video-embed-modal.tsx; el formulario del diario solo se toca para no romperlo (lo rediseña A3). Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- /a/<id> como jugador a 390: tab bar inferior fija con Entreno/Nutrición/Diario (y las pestañas que ya existan), calendario y cinta semanal con estilo Apple, foco del día claro.
- Como admin (1440 y 390) la pantalla sigue funcionando: atrás, chip de integración, pestaña Análisis.
- Estados vacíos (día sin sesión, semana sin plan) con diseño.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-A1/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-A1`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-A1/`.

## Al terminar
Escribe `workflow/briefs/from-rd-A1.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
