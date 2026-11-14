# rd-N1 - Nutrición jugador: pestaña Hoy

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Dentro de la pestaña Nutrición del jugador (app/a/[id]/nutrition-pane.tsx; crea subcomponentes en app/a/[id]/nutrition/), una navegación interna Hoy · Semana · Compra (segmentado) y la vista HOY: tarjeta del día con etiqueta MD y 'nivel de combustible' (carga / normal / suave según el tipo de día de lib/nutrition/day-type.ts) con color y sin kcal, nota de Amanda si existe (meal_day_notes), franjas en orden temporal con la siguiente destacada y las pasadas plegadas, foto, ingredientes redondeados (sin kcal ni gramos de macros salvo athletes.show_numbers=true), preparación plegable, suplementos en su franja (el jsonb supplements admite un campo slot opcional; compatibilidad con los existentes sin slot) y 'Indicaciones de Amanda' plegable con diet_notes. Las consultas nuevas van en archivos nuevos lib/nutrition/*-queries.ts, NO edites lib/queries.ts.

## Archivos
- SI (solo estos): `app/a/[id]/nutrition-pane.tsx`, `app/a/[id]/nutrition/*`, `app/api/nutrition/today/*`, `lib/nutrition/today.ts`, `lib/nutrition/today-queries.ts`, `app/styles/nutri-shared.css`, `app/styles/player.css`
- NO: lib/queries.ts, db/, nutricion-athlete-client.tsx. Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- Pestaña Nutrición a 390: segmentado Hoy/Semana/Compra; Hoy muestra la tarjeta del día con nivel de combustible, franjas con la siguiente destacada, foto, ingredientes, suplementos en su franja y las indicaciones plegables.
- El jugador no ve kcal ni gramos de macros por defecto; con show_numbers=true sí (prueba con una cuenta de desarrollo y restaura).
- Estados: día sin menú, sin suplementos.
- Un jugador solo ve su propio menú.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-N1/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-N1`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-N1/`.

## Al terminar
Escribe `workflow/briefs/from-rd-N1.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
