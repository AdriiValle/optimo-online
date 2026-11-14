# Auditoria fria rd-A1 (vuelta 1)

Eres auditor frio del rediseno de la app (Next.js, localhost:3001, rama feat/rediseno-apple). No has visto como se hizo: no leas git, ni briefs de ejecutor (workflow/briefs/to-rd-*, from-rd-*), ni el diff. Solo mira lo que se ve y se usa; abre codigo unicamente para localizar un selector.
Lee: `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si existen).

Tarea auditada: Jugador: inicio y plan (tab bar, calendario, cinta, foco del día)
Pantallas/rutas: /a/<id> (jugador y admin), pestañas Entreno/Nutrición/Diario
Roles: jugador, admin
Viewports: 390x844 (jugador), 1440x900 (admin), 1280x800 (jugador, presentable)
Criterio de hecho:
- /a/<id> como jugador a 390: tab bar inferior fija con Entreno/Nutrición/Diario (y las pestañas que ya existan), calendario y cinta semanal con estilo Apple, foco del día claro.
- Como admin (1440 y 390) la pantalla sigue funcionando: atrás, chip de integración, pestaña Análisis.
- Estados vacíos (día sin sesión, semana sin plan) con diseño.
- Sin scroll horizontal a 390; tactiles >=44 en acciones primarias; foco visible; tsc limpio (ejecuta `npx tsc --noEmit`).

## Como
Usa el navegador headless de gstack (`~/.claude/skills/gstack/browse/dist/browse.exe`) con el patron de `.tmp-verify/look/shots.sh` (copialo a `.tmp-verify/audit-A1/` y pon U=http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `audit-A1` si no existe (si existe espera y reintenta, max 20 min) y borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; contrasena de desarrollo en `db/reset-dev-passwords.ts` (Amanda: `.tmp-verify/amanda-account.ts`). No crees datos reales ni dejes basura de pruebas.
Haz login con cada rol, abre las rutas en cada viewport, captura, mide scrollWidth, prueba con raton/tactil y Tab las acciones de la tarea.
Auditoria LIGERA: bloqueante SOLO si (a) funcion perdida o rota, (b) logica o datos distintos, (c) pantalla inutilizable o ilegible, (d) incumple Apple o los tokens de forma clara y visible. Nada de gustos ni pixeles. Maximo 5 bloqueantes, una sola pasada.

## Salida
Escribe `workflow/briefs/from-audit-A1.md` con exactamente estas lineas:
- Veredicto: PASA   (o)   Veredicto: NO PASA
- Bloqueantes (maximo 5): ruta - viewport - que falla - ruta de captura
- Notas no bloqueantes (maximo 3, opcional)
No arregles nada tu.
