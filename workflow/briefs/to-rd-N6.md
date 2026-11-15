# rd-N6 - Amanda: perfil ampliado (alergias, números, objetivos)

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Pestaña Perfil de Amanda (/nutricion/[athleteId]/perfil): nacimiento/altura/peso (lo actual), alergias e intolerancias (listas editables), meta de dieta, interruptor 'Mostrar números al jugador' (show_numbers), y objetivos sobrescribibles sobre los calculados de lib/nutrition/targets.ts (target_overrides jsonb; targets.ts debe leerlos con prioridad). Alerta de alergias en la ficha del plato cuando un ingrediente casa con una alergia o intolerancia (por food_id o alias). Amplía la API /api/athletes/[id]/profile y las funciones de lib/queries.ts necesarias (este es el único sitio donde se permite editar lib/queries.ts en la Pista N y solo las funciones del perfil).

## Archivos
- SI (solo estos): `app/nutricion/[athleteId]/perfil/*`, `app/nutricion/[athleteId]/athlete-profile-form.tsx`, `app/nutricion/[athleteId]/meal-drawer.tsx`, `app/api/athletes/[id]/profile/route.ts`, `lib/queries.ts`, `lib/nutrition/targets.ts`, `app/styles/nutri.css`
- NO: db/ (ya migrado por N0); otras funciones de lib/queries.ts. Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- En la pestaña Perfil se guardan altura/peso/nacimiento, alergias/intolerancias, meta, show_numbers y objetivos sobrescritos; recargar los mantiene (prueba con datos de desarrollo y restaura).
- Con una alergia que casa con un ingrediente, la ficha del plato muestra el aviso.
- Los anillos usan los objetivos sobrescritos cuando existen.
- Un admin también puede usar estos endpoints.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-N6/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-N6`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-N6/`.

## Al terminar
Escribe `workflow/briefs/from-rd-N6.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
