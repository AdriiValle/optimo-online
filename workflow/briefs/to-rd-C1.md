# rd-C1 - Amanda: shell y menú (día / semana / mes)

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Rediseñar app/nutricion/page.tsx (lista de deportistas, vacío 'sin asignados'), athlete-nav.tsx y, en nutricion-athlete-client.tsx, la toolbar, el segmentado Día/Semana/Mes, WeekGrid, DishCell, MonthCalendar y el apilado <1280, en escritorio 1440 con columna de deportistas como sidebar. Mantén las tarjetas por categoría de proteína. Override del calendario compartido vía nutri.css.

## Archivos
- SI (solo estos): `app/nutricion/page.tsx`, `app/nutricion/athlete-nav.tsx`, `app/nutricion/athlete-nav-shared.ts`, `app/nutricion/[athleteId]/nutricion-athlete-client.tsx`, `app/styles/nutri.css`
- NO: meal-drawer, meal-items-editor, Ring/WeekPanel (C3), NutModal/MealSlotForm (C2), athlete-profile-form y menu-word-import (C4). Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- /nutricion y /nutricion/<id> a 1440 y 1280: sidebar de deportistas, toolbar, vistas Día/Semana/Mes con estilo Apple y las categorías de proteína visibles.
- A 768 y 390 se apila sin romperse.
- Funciones intactas: cambiar de deportista, de vista, de semana, abrir plato, añadir plato con +.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-C1/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-C1`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-C1/`.

## Al terminar
Escribe `workflow/briefs/from-rd-C1.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
