# Para Adrián: arreglo del dominio app.optimosport.com (2 minutos, en Vercel)

**Por qué en el móvil ves otra versión:** `optimo-online.vercel.app` sigue clavado en el deploy del **5 de noviembre** (74 commits por detrás). La variable `AUTH_URL` de producción apunta a ese host. Así que, cada vez que entras sin sesión, o al hacer login o logout, la app te manda a la versión vieja. En el ordenador seguramente ya tenías sesión en app.optimosport.com y por eso veías la buena.

## En Vercel → proyecto `optimo-online`
1. **Settings → Domains → Add** `optimo-online.vercel.app` → «Redirect to» `app.optimosport.com`, código **308**. Si dice que ya está en uso, primero haz **Remove** sobre ese alias y vuelve a añadirlo.
2. **Settings → Environment Variables → `AUTH_URL` (Production)** = `https://app.optimosport.com`.
3. Comprueba que `POLAR_REDIRECT_URI` (Production) = `https://app.optimosport.com/api/integrations/polar/callback`.
4. **Deployments → último de Production → Redeploy.** No hace falta si yo subo a `main` después de que hayas hecho 1-3: ese deploy ya recoge el cambio.

## En tu móvil (después)
1. Borra el icono de Óptimo de la pantalla de inicio.
2. Borra los datos de los sitios `vercel.app` y `optimosport.com`. En iPhone: Ajustes → Safari → Avanzado → Datos de sitios web.
3. Abre `https://app.optimosport.com`, inicia sesión y vuelve a añadirlo a la pantalla de inicio.

Visus y Amanda tendrán que iniciar sesión **una vez** en `app.optimosport.com`.
