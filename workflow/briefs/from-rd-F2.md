# from-rd-F2 · Partir globals.css en hojas

- Hecho: sí
- Qué cambió (rutas):
  - `app/globals.css` → solo 10 líneas `@import "./styles/<hoja>.css";` en el orden de la tabla §4.
  - Nuevas: `app/styles/{tokens,base,components,shell,admin,player,nutri-shared,nutri,login,a11y}.css`, cortadas por los rangos de §4 de `plantillas-rediseno.md`. `globals.css` estaba igual que en `5c76153`, así que los rangos valían tal cual. Se mantienen los CRLF y no se ha cambiado ninguna regla ni borrado CSS muerto.
  - Sin commit y sin cambiar de rama (`feat/rediseno-apple`), como pedía el brief.
- Verificación:
  - Copia original en `.tmp-verify/f2/globals.orig.css`.
  - El multiconjunto de líneas no vacías es idéntico: 1980 = 1980 y el `diff` sale vacío. El original no tenía ningún `@import`, así que filtrarlos no quita ninguna línea. Tampoco queda ninguna línea no vacía sin asignar.
  - Capturas antes/después: los 34 pares tienen el mismo sha256 (`.tmp-verify/rd-F2/{antes,despues}-*.png`, script `.tmp-verify/rd-F2/shots.sh`, corte `.tmp-verify/rd-F2/split.py`). Rutas cubiertas:
    - login (vacío y con error), a 390 y 1440;
    - not-found sin sesión y como admin;
    - jugador (Entreno, Nutrición, Diario, `/ajustes`), a 390 y 1280;
    - admin (`/panel`, `/a/<id>`, `/panel/ajustes`), a 1440 y 390;
    - Amanda (`/nutricion` y `/nutricion/<id>` en vista por defecto, Semana y Mes), a 1440, 1280 y 390.

    En todas, `scrollWidth` es igual al ancho del viewport, así que no hay scroll horizontal a 390.
  - `npx tsc --noEmit` limpio. `next dev` recompila sin avisos de CSS.
  - En consola sale un aviso de React por falta de `key` en `HeaderMarkup`/`NutricionAthletePage`. Ya aparecía antes del corte (10:29 UTC, el corte fue a las 10:30), así que no es nuevo y no tiene que ver con CSS.
  - Táctiles y foco: no ha cambiado ninguna regla y las capturas son idénticas, así que siguen como estaban.
- Nota: localhost:3001 **no estaba levantado** al empezar (en 3002 estaba Play4Rank). Arranqué `npm run dev` de este repo en 3001 (log en `.tmp-verify/rd-F2/next-dev.log`). Al terminar la verificación se paró solo: llegó al límite de 2 h de los procesos en segundo plano. **Ahora 3001 está caído**; si hace falta, hay que levantarlo otra vez con `npm run dev`. No he creado datos de prueba. He borrado `browse.lock`.
- Duda:
- Recomendación:
- Bloquea a Adrián: no
