# P2: diagnóstico dominio/móvil

Fecha: 2026-11-19 07:55 (CET). Solo lectura: `curl -I`, Playwright 1.49 (Chromium; perfiles `Desktop Chrome` e `iPhone 13`), API de Vercel en lectura (`vercel api`, GET). Cero cambios en `app/` `lib/` `middleware.ts` `vercel.json`.

## Resumen

Hay **dos problemas encadenados**, y el segundo es más grave de lo que suponía el plan:

1. **`optimo-online.vercel.app` está congelado en un deploy del 5 de noviembre.** Ese alias apunta a `dpl_6SgtLAia…` (commit `8a23f63`, «fix(auth): guardar el rol de nutricionista…», 2026-11-05), **74 commits por detrás** de producción. `app.optimosport.com` sí apunta al último deploy (`dpl_HyYq9tfM…`, commit `7e79ecb`, 2026-11-17). `optimo-online.vercel.app` ya **no está entre los dominios del proyecto**: es un alias suelto (creado el 29 oct, reasignado a mano el 5 nov), así que los deploys de `main` no lo mueven. **La premisa del plan «dev == main == prod, no es un desfase de versión» es falsa para quien acaba en `optimo-online.vercel.app`: ahí ve código del 5 nov.**
2. **`AUTH_URL` (Production) apunta a `https://optimo-online.vercel.app`**, y next-auth usa ese origen para todo: el middleware (`reqWithEnvURL` reescribe `req.url` y `req.nextUrl`), `signIn`/`signOut` (`createActionURL`) y el callback de Polar. Cualquiera **sin sesión** que entra por `app.optimosport.com` acaba en `optimo-online.vercel.app` (el build viejo), inicia sesión allí, y su cookie, su historial y el icono de inicio que guarde se quedan en ese host.

Por eso el móvil y el escritorio ven cosas distintas: el que tiene la cookie en `app.optimosport.com` ve la versión actual; el que la tiene en `optimo-online.vercel.app` (o sin sesión) ve la del 5 nov. No es caché, ni service worker, ni manifest: no hay ninguno (ver más abajo).

## Pruebas

### 1. Aliases: cada host sirve un deployment distinto

```
$ vercel api /v4/aliases/app.optimosport.com
  "alias": "app.optimosport.com",
  "deploymentId": "dpl_HyYq9tfMvSobA8Q6MvxLethMBh7D",   → commit 7e79ecb (main), 2026-11-17T17:35Z, READY, production
  "updatedAt": 1794937052304                              → 2026-11-17T17:37Z

$ vercel api /v4/aliases/optimo-online.vercel.app
  "alias": "optimo-online.vercel.app",
  "created": "2026-10-29T16:38:00.495Z",
  "deploymentId": "dpl_6SgtLAiaT38fiNjgusUVykUaQyyW",   → commit 8a23f63 (main), 2026-11-05T13:03Z, READY, production
  "updatedAt": 1793883967954                              → 2026-11-05T13:06Z

$ vercel api /v9/projects/prj_RtzPheKbUlI1Ea1k9JLKZepU5U7C/domains
  "name": "app.optimosport.com",          "redirect": null, "verified": true
  "name": "plan-ricardo-visus.vercel.app", "redirect": null, "verified": true
  (optimo-online.vercel.app NO aparece → alias manual, los deploys no lo actualizan)

$ git log --oneline 8a23f63..7e79ecb | wc -l
74
```

Los aliases automáticos del deploy actual son `app.optimosport.com`, `plan-ricardo-visus.vercel.app`, `optimo-online-adriivalle.vercel.app`, `optimo-online-git-main-adriivalle.vercel.app`. `optimo-online.vercel.app` no está.

### 2. Build id en el HTML (`/login`, 3 peticiones por host, sin cookies)

```
app.optimosport.com       "b":"G9cFkk24YsSFDrEHbYO5M"  webpack-a61590fb8d588510.js   (×3)
optimo-online.vercel.app  "b":"QV8RSd_HORwicolWkzg0F"  webpack-74c939c87fa0092a.js   (×3)
optimo-online-adriivalle.vercel.app  "b":"G9cFkk24YsSFDrEHbYO5M"                      (= actual)
```

### 3. `curl -I`: la redirección y la cookie `callback-url` delatan `AUTH_URL`

```
=== https://app.optimosport.com/
HTTP/1.1 307 Temporary Redirect
Location: https://optimo-online.vercel.app/login?from=%2F          ← cambia de host
Set-Cookie: __Secure-authjs.callback-url=https%3A%2F%2Foptimo-online.vercel.app; …
X-Vercel-Id: cdg1::s77dt-…

=== https://optimo-online.vercel.app/
HTTP/1.1 307 Temporary Redirect
Location: /login?from=%2F                                          ← relativa: su origen == AUTH_URL
Set-Cookie: __Secure-authjs.callback-url=https%3A%2F%2Foptimo-online.vercel.app; …

=== https://app.optimosport.com/login
HTTP/1.1 200 OK
Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate
Set-Cookie: __Secure-authjs.callback-url=https%3A%2F%2Foptimo-online.vercel.app; …
X-Vercel-Id: cdg1::iad1::sc9cw-…                                   ← función en iad1 (hallazgo 1 del plan)
```

`/manifest.webmanifest` y `/sw.js` en los dos hosts: `307 → /login?from=…` (no existen; el middleware los trata como rutas privadas). `/apple-icon.png`: `200`, `Cache-Control: public, max-age=0, must-revalidate`, mismo `Etag` `"6eaa9bf9…"` en los dos hosts.

Valores de env (solo metadatos; no se ha descifrado ningún valor):

```
AUTH_URL            sensitive  ["production"]   2026-10-29T16:38:16Z   ← mismo minuto en que se creó el alias optimo-online.vercel.app
AUTH_URL            sensitive  ["preview"]      2026-10-29T16:33:55Z
AUTH_URL            encrypted  ["development"]  2026-10-29T16:33:58Z
POLAR_REDIRECT_URI  sensitive  ["production"]   2026-11-04T12:15:23Z
POLAR_REDIRECT_URI  sensitive  ["preview"]      2026-11-04T12:15:29Z
serverlessFunctionRegion: iad1
```

El valor de `AUTH_URL` se deduce del comportamiento (la `Location` absoluta y la cookie `callback-url`), no de leerlo.

### 4. Playwright (móvil y escritorio, con y sin caché)

Script: `workflow/load/dominio-movil.cjs` (solo GET; las cookies de sesión salen de `workflow/load/k6/tokens.json`, el JWT firmado de P1). Mismo resultado en `desktop` y `mobile` (iPhone 13); en todos los casos la segunda carga (recarga, con la caché del navegador) devuelve `200 Cache-Control: private, no-cache, no-store…` `x-vercel-cache=MISS`, así que la caché no sirve HTML viejo.

| Entrada | Sesión | Cadena de documentos | Host final | Build |
|---|---|---|---|---|
| `app.optimosport.com/` | ninguna | 307 → `optimo-online.vercel.app/login?from=%2F` → 200 | **vercel.app** | **QV8R… (5 nov)** |
| `optimo-online.vercel.app/` | ninguna | 307 → `/login?from=%2F` → 200 | vercel.app | QV8R… (5 nov) |
| `app.optimosport.com/` | deportista en vercel.app | 307 → `vercel.app/login` → 307 → `/a/<id>` → 200 | **vercel.app** | **QV8R… (5 nov)** |
| `app.optimosport.com/` | deportista en app.optimosport.com | 307 → `/a/<id>` → 200 | app.optimosport.com | G9cF… (actual) |
| `app.optimosport.com/ajustes` | admin en app.optimosport.com | 307 → `vercel.app/panel/ajustes` → 307 → `vercel.app/login?from=…` → 200 | **vercel.app, sin sesión** | QV8R… (5 nov) |

Cookies tras la primera fila: `__Host-authjs.csrf-token` y `__Secure-authjs.callback-url` en **los dos** hosts; la de sesión solo existe en el host donde se inició sesión (las cookies `__Host-`/`__Secure-` van por host, no se comparten).

Otras comprobaciones en todas las filas: `link[rel=manifest]` = no hay; `apple-touch-icon` = `<host final>/apple-icon.png`; `navigator.serviceWorker.getRegistrations()` = 0.

**Consecuencias:**
- La última fila es un fallo visible: un admin con sesión en el dominio bueno que abre `/ajustes` pierde la sesión (middleware `NextResponse.redirect(new URL("/panel/ajustes", req.url))` sale con el origen de `AUTH_URL`).
- El login (`app/login/page.tsx`, `signIn(..., { redirectTo: "/" })`) y el logout (`app/logout-button.tsx`, `signOut({ redirectTo: "/login" })`) construyen la URL con `AUTH_URL` (`@auth/core` `createActionURL`), así que un login hecho en `app.optimosport.com/login` deja la cookie en `app.optimosport.com` y redirige a `optimo-online.vercel.app/`, donde no hay sesión (doble login). Esto se ha deducido del código de `next-auth@5.0.0-beta.29`; no se ha probado con contraseña real (no hay credenciales en `secrets.local.md` y no se hizo ningún POST).
- Polar: `app/api/integrations/polar/callback/route.ts` redirige a `${AUTH_URL}/a/<id>?pane=log…`, y la URI de redirección registrada en Polar es `https://app.optimosport.com/api/integrations/polar/callback`. Si el deportista conecta desde `optimo-online.vercel.app`, la cookie `polar_oauth` y la de sesión están en ese host, el callback llega a `app.optimosport.com` sin ellas y la conexión falla.
- El icono de pantalla de inicio en iOS guarda la URL de la página en la que se pulsó «Añadir a inicio» (no hay manifest con `start_url`). Si se guardó estando en `optimo-online.vercel.app`, abre siempre el build del 5 nov.

## Arreglo propuesto (sin tocar código)

Todo es configuración de Vercel. **Ninguno se ha aplicado.** Son cambios de configuración de producción y la mayoría se pueden deshacer.

1. **Quitar el alias congelado** (es lo urgente, porque es lo que sirve la versión vieja). Proyecto `optimo-online` → Settings → Domains → Add `optimo-online.vercel.app` → «Redirect to» `app.optimosport.com`, **308**. Así el host viejo queda como dominio del proyecto y redirige siempre al bueno. Alternativa mínima: reasignarlo al deploy actual (`vercel alias set optimo-online-6e6gkg6k7-adriivalle.vercel.app optimo-online.vercel.app`), pero volvería a congelarse en el siguiente deploy, así que no la recomiendo.
2. **`AUTH_URL` (Production) = `https://app.optimosport.com`**, y luego Redeploy de producción (las env vars solo se aplican en un deploy nuevo). Con esto, el middleware, el login, el logout y el callback de Polar se quedan en el dominio bueno sin cambiar código.
3. **`POLAR_REDIRECT_URI` (Production)**: comprobar que vale `https://app.optimosport.com/api/integrations/polar/callback`, igual que la URI dada de alta en Polar (según `secrets.local.md` ya es esa). No se ha leído porque es *sensitive*.
4. Opcional, solo si no se hace el punto 1: un redirect 308 en `middleware.ts` cuando `req.headers.get("x-forwarded-host") === "optimo-online.vercel.app"`. Hay que leer la cabecera: `req.url` y `req.nextUrl` ya vienen reescritos por next-auth. Con el punto 1 sobra, y además no serviría de nada mientras ese alias siga apuntando al deploy viejo, porque ese deploy no tendría el código nuevo.

Efecto al aplicarlo: quien tenga sesión en `optimo-online.vercel.app` (90 días) tendrá que iniciar sesión **una vez** en `app.optimosport.com`, porque la cookie va por host. Conviene avisar a Visus y a Amanda.

## Qué hacer en el móvil de Adrián (después de aplicar 1 y 2)

1. Borrar el icono de Óptimo de la pantalla de inicio.
2. iPhone: Ajustes → Safari → Avanzado → Datos de sitios web → buscar `vercel.app` y `optimosport.com` → borrar los dos. Android/Chrome: Ajustes del sitio → Todos los sitios → borrar `optimo-online.vercel.app` y `app.optimosport.com`.
3. Abrir `https://app.optimosport.com` a mano, iniciar sesión y comprobar que la barra de direcciones sigue en `app.optimosport.com`.
4. Compartir → «Añadir a pantalla de inicio» desde esa página.

No hay service worker ni manifest que limpiar.

## Cómo verificarlo tras el deploy

```bash
# a) El dominio ya no cambia de host (debe ser relativa y la cookie con optimosport)
curl -sI https://app.optimosport.com/ | grep -iE '^location|callback-url'
#   esperado: Location: /login?from=%2F
#             Set-Cookie: __Secure-authjs.callback-url=https%3A%2F%2Fapp.optimosport.com; …

# b) El host viejo redirige al bueno
curl -sI https://optimo-online.vercel.app/login | grep -iE '^HTTP|^location'
#   esperado: HTTP/1.1 308 …  Location: https://app.optimosport.com/login

# c) Alias de los dos hosts → mismo deployment (o el viejo ya es redirect del proyecto)
vercel api "/v4/aliases/app.optimosport.com?teamId=team_A0lOIdf5coL9x4Q2n4dheb31" | grep deploymentId
vercel api "/v9/projects/prj_RtzPheKbUlI1Ea1k9JLKZepU5U7C/domains?teamId=team_A0lOIdf5coL9x4Q2n4dheb31" | grep -E '"name"|"redirect"'
#   esperado: optimo-online.vercel.app con "redirect": "app.optimosport.com"

# d) Playwright: todas las filas acaban en app.optimosport.com con el mismo build id
node --env-file=.env.local workflow/load/k6/mint-tokens.mjs      # tokens frescos (1 h); requiere AUTH_SECRET local == prod
PW_PATH=<.../node_modules/playwright> node workflow/load/dominio-movil.cjs workflow/load/k6/tokens.json
#   esperado: finalUrl siempre https://app.optimosport.com/…; la fila /ajustes (admin) termina en /panel/ajustes 200, no en /login

# e) Si en P3 se fija "regions": ["fra1"]: x-vercel-id debe mostrar ::fra1:: en lugar de ::iad1::
curl -sI https://app.optimosport.com/login | grep -i x-vercel-id
```

Prueba manual: iniciar sesión en `https://app.optimosport.com/login` y comprobar que se aterriza en `https://app.optimosport.com/…` (no en `vercel.app`) y que Ajustes y Salir mantienen el host.
