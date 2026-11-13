# Auditoria fria rd-F2 (vuelta 1)

Eres auditor frio del rediseno de la app (Next.js, localhost:3001, rama feat/rediseno-apple). No has visto como se hizo: no leas git, ni briefs de ejecutor (workflow/briefs/to-rd-*, from-rd-*), ni el diff. Solo mira lo que se ve y se usa; abre codigo unicamente para localizar un selector.
Lee: `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si existen).

Tarea auditada: Partir globals.css en hojas sin cambio visual
Pantallas/rutas: /login, /a/<id> jugador, /panel admin, /nutricion/<id> Amanda
Roles: los que apliquen
Viewports: 390x844 y 1440x900
Criterio de hecho:
- Multiconjunto de líneas idéntico: grep -v '^\s*$' globals.orig.css | sort == cat de las 10 hojas (sin líneas vacías ni @import) | sort; diff vacío.
- Capturas antes/después con el mismo sha256 por par en las rutas de la lista; si un par difiere, se justifica (dato vivo/animación) o se corrige el orden.
- npx tsc --noEmit limpio y la página recarga sin aviso de CSS en next dev.
- Sin scroll horizontal a 390; tactiles >=44 en acciones primarias; foco visible; tsc limpio (ejecuta `npx tsc --noEmit`).

## Comprobaciones propias de esta tarea
Verifica tú mismo: (1) diff de multiconjunto de líneas entre app/globals.css original (git show HEAD:app/globals.css) y la concatenación de app/styles/*.css, sin vacías ni @import; (2) que globals.css solo tiene 10 @import; (3) abre /login, el panel y /nutricion/<id> y confirma que se ven como antes (compara con las capturas en .tmp-verify/f2/ si existen). Aquí SÍ puedes leer git para el original.

## Como
Usa el navegador headless de gstack (`~/.claude/skills/gstack/browse/dist/browse.exe`) con el patron de `.tmp-verify/look/shots.sh` (copialo a `.tmp-verify/audit-F2/` y pon U=http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `audit-F2` si no existe (si existe espera y reintenta, max 20 min) y borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; contrasena de desarrollo en `db/reset-dev-passwords.ts` (Amanda: `.tmp-verify/amanda-account.ts`). No crees datos reales ni dejes basura de pruebas.
Haz login con cada rol, abre las rutas en cada viewport, captura, mide scrollWidth, prueba con raton/tactil y Tab las acciones de la tarea.
Auditoria LIGERA: bloqueante SOLO si (a) funcion perdida o rota, (b) logica o datos distintos, (c) pantalla inutilizable o ilegible, (d) incumple Apple o los tokens de forma clara y visible. Nada de gustos ni pixeles. Maximo 5 bloqueantes, una sola pasada.

## Salida
Escribe `workflow/briefs/from-audit-F2.md` con exactamente estas lineas:
- Veredicto: PASA   (o)   Veredicto: NO PASA
- Bloqueantes (maximo 5): ruta - viewport - que falla - ruta de captura
- Notas no bloqueantes (maximo 3, opcional)
No arregles nada tu.
