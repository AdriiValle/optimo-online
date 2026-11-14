# Auditoria fria rd-N5 (vuelta 1)

Eres auditor frio del rediseno de la app (Next.js, localhost:3001, rama feat/rediseno-apple). No has visto como se hizo: no leas git, ni briefs de ejecutor (workflow/briefs/to-rd-*, from-rd-*), ni el diff. Solo mira lo que se ve y se usa; abre codigo unicamente para localizar un selector.
Lee: `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si existen).

Tarea auditada: Amanda: pestañas, pantalla Alimentos y emparejado
Pantallas/rutas: /nutricion/<id> y sus pestañas, /nutricion/alimentos
Roles: Amanda
Viewports: 1440x900, 1280x800, 390x844
Criterio de hecho:
- En /nutricion/<id> aparece la barra de pestañas Apple (segmentado/toolbar) y cada ruta carga; Menú sigue siendo la vista actual sin perder funciones.
- /nutricion/alimentos lista y edita foods; la bandeja 'Sin alimento' muestra los textos huérfanos agrupados y permite 'es alias de X' y 'alimento nuevo', y tras hacerlo esos items quedan emparejados (prueba con datos de desarrollo y restaura).
- El emparejado mejorado reduce los items sin food_id sin asignar nada ambiguo (el ejecutor deja las cifras antes/después en su from-rd).
- Sin scroll horizontal a 390; tactiles >=44 en acciones primarias; foco visible; tsc limpio (ejecuta `npx tsc --noEmit`).

## Como
Usa el navegador headless de gstack (`~/.claude/skills/gstack/browse/dist/browse.exe`) con el patron de `.tmp-verify/look/shots.sh` (copialo a `.tmp-verify/audit-N5/` y pon U=http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `audit-N5` si no existe (si existe espera y reintenta, max 20 min) y borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; contrasena de desarrollo en `db/reset-dev-passwords.ts` (Amanda: `.tmp-verify/amanda-account.ts`). No crees datos reales ni dejes basura de pruebas.
Haz login con cada rol, abre las rutas en cada viewport, captura, mide scrollWidth, prueba con raton/tactil y Tab las acciones de la tarea.
Auditoria LIGERA: bloqueante SOLO si (a) funcion perdida o rota, (b) logica o datos distintos, (c) pantalla inutilizable o ilegible, (d) incumple Apple o los tokens de forma clara y visible. Nada de gustos ni pixeles. Maximo 5 bloqueantes, una sola pasada.

## Salida
Escribe `workflow/briefs/from-audit-N5.md` con exactamente estas lineas:
- Veredicto: PASA   (o)   Veredicto: NO PASA
- Bloqueantes (maximo 5): ruta - viewport - que falla - ruta de captura
- Notas no bloqueantes (maximo 3, opcional)
No arregles nada tu.
