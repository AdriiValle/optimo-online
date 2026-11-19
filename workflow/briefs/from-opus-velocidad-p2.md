# from-opus-velocidad-p2

- **Hecho:** sí. Todo el criterio de P2 se cumple: `workflow/briefs/dominio-movil.md` trae la causa demostrada con la salida de curl, Playwright (móvil y escritorio, con y sin caché) y la API de Vercel en lectura; el arreglo propuesto, con el sitio exacto donde se cambia; y los pasos de verificación tras el deploy. `git status` no muestra cambios en `app/` `lib/` `middleware.ts` `vercel.json`. Sin commit, como pide el brief.
- **Qué cambió (rutas):**
  - `workflow/briefs/dominio-movil.md` (nuevo): el informe.
  - `workflow/load/dominio-movil.cjs` (nuevo): script Playwright, solo GET, para repetir la prueba tras el deploy (P4).
  - `workflow/briefs/from-opus-velocidad-p2.md` (este archivo).
- **Hallazgo que corrige el plan:** `optimo-online.vercel.app` es un alias manual **congelado en el deploy del 5 nov** (`dpl_6SgtLAia…`, commit `8a23f63`, 74 commits por detrás). Ya no está en los dominios del proyecto. `app.optimosport.com` sí está en `7e79ecb`. Los build id del HTML son distintos (`QV8RSd…` frente a `G9cFkk…`). Como `AUTH_URL` de Production apunta a `optimo-online.vercel.app`, todo el que entra sin sesión (y tras cada login o logout) acaba en el build viejo. Ojo, P1/P4: **si la ronda 1 de k6 midió Vercel contra `optimo-online.vercel.app`, midió el código del 5 nov.** La ronda 2 debe medir `app.optimosport.com` (o `optimo-online-adriivalle.vercel.app`, que es el deploy actual).
- **Duda:** el arreglo es solo de configuración de Vercel en producción, y el brief no me deja aplicarlo:
  1. Añadir `optimo-online.vercel.app` como dominio del proyecto con redirect 308 a `app.optimosport.com`.
  2. Poner `AUTH_URL` (Production) = `https://app.optimosport.com` y redeploy.
  3. Comprobar que `POLAR_REDIRECT_URI` (Production) vale `https://app.optimosport.com/api/integrations/polar/callback`.
- **Recomendación:** que el master aplique 1 y 2 en P4, justo antes de mergear y redeployar, porque el redeploy de `main` recoge el cambio de env. No hace falta tocar el código: el redirect en `middleware.ts` es opcional y sobra si se hace el punto 1. Avisar a Visus y a Amanda de que tendrán que iniciar sesión una vez en `app.optimosport.com`. Los pasos para el móvil de Adrián están en el informe (borrar icono, borrar datos de los dos sitios, entrar por `app.optimosport.com`, añadir a inicio de nuevo). Decidí no aplicar nada porque el plan dice expresamente «no se cambian variables de entorno de Vercel sin avisar a Adrián».
- **Bloquea a Adrián:** no. Es configuración reversible, y el plan ya prevé que se le avise y que la aplique el master.
