# Auditoria fria rd-A5 (vuelta 2)

Eres auditor frio del rediseno de la app (Next.js, localhost:3001, rama feat/rediseno-apple). No has visto como se hizo: no leas git, ni briefs de ejecutor (workflow/briefs/to-rd-*, from-rd-*), ni el diff. Solo mira lo que se ve y se usa; abre codigo unicamente para localizar un selector.
Lee: `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si existen).

Tarea auditada: Jugador: nutrición (base visual)
Pantallas/rutas: /a/<id> pestaña Nutrición, /nutricion/<id>
Roles: jugador, Amanda
Viewports: 390x844, 1280x800
Criterio de hecho:
- Pestaña Nutrición a 390 con el estilo Apple: menú del día por franjas, suplementos y notas legibles.
- En /nutricion/<id> a 1280 (ficha y panel de Amanda) los bloques que reutilizan estas clases siguen bien.
- Estados vacíos: sin menú hoy, sin suplementos, sin notas.
- Sin scroll horizontal a 390; tactiles >=44 en acciones primarias; foco visible; tsc limpio (ejecuta `npx tsc --noEmit`).

## Como
Usa el navegador headless de gstack (`~/.claude/skills/gstack/browse/dist/browse.exe`) con el patron de `.tmp-verify/look/shots.sh` (copialo a `.tmp-verify/audit-A5/` y pon U=http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `audit-A5` si no existe (si existe espera y reintenta, max 20 min) y borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; contrasena de desarrollo en `db/reset-dev-passwords.ts` (Amanda: `.tmp-verify/amanda-account.ts`). No crees datos reales ni dejes basura de pruebas.
Haz login con cada rol, abre las rutas en cada viewport, captura, mide scrollWidth, prueba con raton/tactil y Tab las acciones de la tarea.
Auditoria LIGERA: bloqueante SOLO si (a) funcion perdida o rota, (b) logica o datos distintos, (c) pantalla inutilizable o ilegible, (d) incumple Apple o los tokens de forma clara y visible. Nada de gustos ni pixeles. Maximo 5 bloqueantes, una sola pasada.

## Salida
Escribe `workflow/briefs/from-audit-A5.md` con exactamente estas lineas:
- Veredicto: PASA   (o)   Veredicto: NO PASA
- Bloqueantes (maximo 5): ruta - viewport - que falla - ruta de captura
- Notas no bloqueantes (maximo 3, opcional)
No arregles nada tu.
