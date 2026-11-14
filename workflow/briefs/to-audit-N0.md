# Auditoria fria rd-N0 (vuelta 1)

Eres auditor frio del rediseno de la app (Next.js, localhost:3001, rama feat/rediseno-apple). No has visto como se hizo: no leas git, ni briefs de ejecutor (workflow/briefs/to-rd-*, from-rd-*), ni el diff. Solo mira lo que se ve y se usa; abre codigo unicamente para localizar un selector.
Lee: `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si existen).

Tarea auditada: Migraciones aditivas de nutrición
Pantallas/rutas: ninguna
Roles: los que apliquen
Viewports: 390x844 y 1440x900
Criterio de hecho:
- Cada sentencia es aditiva e idempotente: relanzar db/schema.sql dos veces no falla ni cambia datos existentes.
- Todas las tablas nuevas tienen RLS habilitado y forzado, con políticas por rol como se describe (admin, nutricionista asignada, deportista solo lo suyo).
- La firma actual de nutritionist_set_athlete_profile que usa lib/queries.ts sigue funcionando.
- npx tsc --noEmit limpio.
- Sin scroll horizontal a 390; tactiles >=44 en acciones primarias; foco visible; tsc limpio (ejecuta `npx tsc --noEmit`).

## Comprobaciones propias de esta tarea
Tarea de base de datos, sin navegador. Lee db/schema.sql (puedes usar git diff para ver lo añadido). Comprueba: solo sentencias aditivas e idempotentes (nada de DROP TABLE/COLUMN, ALTER TYPE, DELETE o UPDATE de datos existentes), RLS ENABLE + FORCE en cada tabla nueva con políticas por rol coherentes (el deportista nunca ve datos de otro; solo escribe meal_checks y shopping_checks propios), funciones SECURITY DEFINER con SET search_path y comprobación app_nutritionist_assigned, y que la firma antigua de nutritionist_set_athlete_profile sigue existiendo. Ejecuta npx tsc --noEmit.

## Como
Usa el navegador headless de gstack (`~/.claude/skills/gstack/browse/dist/browse.exe`) con el patron de `.tmp-verify/look/shots.sh` (copialo a `.tmp-verify/audit-N0/` y pon U=http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `audit-N0` si no existe (si existe espera y reintenta, max 20 min) y borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; contrasena de desarrollo en `db/reset-dev-passwords.ts` (Amanda: `.tmp-verify/amanda-account.ts`). No crees datos reales ni dejes basura de pruebas.
Haz login con cada rol, abre las rutas en cada viewport, captura, mide scrollWidth, prueba con raton/tactil y Tab las acciones de la tarea.
Auditoria LIGERA: bloqueante SOLO si (a) funcion perdida o rota, (b) logica o datos distintos, (c) pantalla inutilizable o ilegible, (d) incumple Apple o los tokens de forma clara y visible. Nada de gustos ni pixeles. Maximo 5 bloqueantes, una sola pasada.

## Salida
Escribe `workflow/briefs/from-audit-N0.md` con exactamente estas lineas:
- Veredicto: PASA   (o)   Veredicto: NO PASA
- Bloqueantes (maximo 5): ruta - viewport - que falla - ruta de captura
- Notas no bloqueantes (maximo 3, opcional)
No arregles nada tu.
