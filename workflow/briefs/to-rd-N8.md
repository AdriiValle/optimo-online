# rd-N8 - Amanda: plantillas, platos, sustituciones y nota del día

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Pestaña 'Plantillas y platos' (/nutricion/[athleteId]/plantillas) y su integración en el menú: (a) guardar un día o una semana como plantilla (nombre, tipo de día MD-1/MD/MD+1/libre) y aplicarla a unas fechas (copia meal_slots e items); (b) biblioteca de platos reutilizables con buscador, y en el cajón de un plato nuevo ofrecer 'buscar en mis platos' (reutiliza foto e ingredientes); (c) sustituciones aprobadas por Amanda con gramos recalculados por razón (food_swaps), visibles para el jugador como botón 'Cambiar' en Hoy solo con las equivalencias aprobadas; (d) nota por día (meal_day_notes) editable por Amanda y visible en la tarjeta del día del jugador. Consultas en lib/nutrition/templates-queries.ts; API en app/api/nutrition/templates/*. Edita nutricion-athlete-client.tsx solo lo imprescindible para enganchar 'buscar en mis platos' y la nota del día.

## Archivos
- SI (solo estos): `app/nutricion/[athleteId]/plantillas/*`, `app/nutricion/[athleteId]/nutricion-athlete-client.tsx`, `app/nutricion/[athleteId]/meal-drawer.tsx`, `app/api/nutrition/templates/*`, `lib/nutrition/templates-queries.ts`, `app/a/[id]/nutrition/*`, `app/styles/nutri.css`, `app/styles/nutri-shared.css`
- NO: lib/queries.ts, db/. Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- Guardar una semana como plantilla y aplicarla a otra semana de prueba crea los platos e ingredientes (prueba y restaura).
- Buscar en mis platos al rellenar una franja reutiliza foto e ingredientes.
- Una sustitución aprobada aparece como 'Cambiar' en Hoy del jugador con gramos recalculados; sin aprobar no aparece.
- La nota del día se edita en el panel de Amanda y aparece en el jugador.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-N8/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-N8`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-N8/`.

## Al terminar
Escribe `workflow/briefs/from-rd-N8.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
