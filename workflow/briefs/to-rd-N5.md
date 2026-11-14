# rd-N5 - Amanda: pestañas, pantalla Alimentos y emparejado

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
(1) Navegación por pestañas del panel de Amanda: Menú · Seguimiento · Perfil · Compra · Plantillas y platos · Informes, en un componente app/nutricion/[athleteId]/athlete-tabs.tsx integrado bajo la cabecera, con las rutas /nutricion/[athleteId]/(seguimiento|perfil|compra|plantillas|informes) creadas como páginas con un estado vacío bien diseñado hasta que sus tareas las rellenen; Menú es la actual. (2) Pantalla global Alimentos en /nutricion/alimentos: tabla de foods (nombre, sección/pasillo, unidad, g/unidad, alias, básico) editable, y bandeja 'Sin alimento' que agrupa los raw_text huérfanos de meal_items por texto normalizado con contador y un clic 'es alias de X' (añade a foods.aliases) o 'alimento nuevo' (fila manual); al guardar, re-empareja todos los items con ese texto. (3) Mejora del emparejado automático en lib/nutrition (parse-dish.ts/drafts.ts): quitar plurales y palabras de preparación (a la plancha, cocido, asado, al horno, troceado…), coincidir por la palabra principal y sugerir (no asignar) cuando haya varios candidatos. Consultas nuevas en lib/nutrition/foods-queries.ts. API en app/api/nutrition/foods/*.

## Archivos
- SI (solo estos): `app/nutricion/[athleteId]/athlete-tabs.tsx`, `app/nutricion/[athleteId]/page.tsx`, `app/nutricion/[athleteId]/seguimiento/*`, `app/nutricion/[athleteId]/perfil/*`, `app/nutricion/[athleteId]/compra/*`, `app/nutricion/[athleteId]/plantillas/*`, `app/nutricion/[athleteId]/informes/*`, `app/nutricion/alimentos/*`, `app/api/nutrition/foods/*`, `lib/nutrition/foods-queries.ts`, `lib/nutrition/parse-dish.ts`, `lib/nutrition/drafts.ts`, `app/styles/nutri.css`
- NO: lib/queries.ts, db/. Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- En /nutricion/<id> aparece la barra de pestañas Apple (segmentado/toolbar) y cada ruta carga; Menú sigue siendo la vista actual sin perder funciones.
- /nutricion/alimentos lista y edita foods; la bandeja 'Sin alimento' muestra los textos huérfanos agrupados y permite 'es alias de X' y 'alimento nuevo', y tras hacerlo esos items quedan emparejados (prueba con datos de desarrollo y restaura).
- El emparejado mejorado reduce los items sin food_id sin asignar nada ambiguo (el ejecutor deja las cifras antes/después en su from-rd).
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-N5/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-N5`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-N5/`.

## Al terminar
Escribe `workflow/briefs/from-rd-N5.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
