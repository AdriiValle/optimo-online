# Plan — velocidad de carga con k6 (2 rondas) + dominio/móvil
estado: hecho (2026-11-25)

Repo: `Optimo\Entrenamientos online\Ricardo Visus` (git `AdriiValle/optimo-online`, proyecto Vercel `optimo-online`, Neon `noisy-meadow-03777185` en `aws-eu-central-1`). Es la app de Ricardo Visus: deportista (`/a/[id]`), admin (`/panel`, Adrián), nutricionista Amanda (`/nutricion`), trabajadores/staff. Rama de trabajo `dev`; producción = `main`. Adrián pidió expresamente: aplicar todas las mejoras que salgan del k6 y pasarlas a `main`.

## Hallazgos del master (ya comprobados, no repetir)

1. **Región**: la función de Vercel corre en `iad1` (Washington) y Neon está en Frankfurt. Cada consulta cruza el Atlántico. `vercel.json` no fija región. Candidato nº 1: `"regions": ["fra1"]`.
2. **Dominio**: `app.optimosport.com` (alias del deployment de producción de `optimo-online`) responde `307 /` → `https://optimo-online.vercel.app/login?from=%2F`. Causa probable: env `AUTH_URL` (producción) apunta a `optimo-online.vercel.app`, y `middleware.ts` redirige con `new URL(..., req.url)`, cuyo origen next-auth reescribe a `AUTH_URL`. Resultado: el móvil y el escritorio acaban en hosts distintos con cookies/sesiones distintas. `dev` == `main` == último deploy de producción (7e79ecb), así que no es un desfase de versión de código.
3. `lib/db.ts`: cliente `postgres` con `max: 8`, `prepare: false`, URL pooled. Auth con `trustHost: true`.
4. Hay k6 2.3.0 instalado (`C:\Program Files\k6`).

## Reglas

- Trabaja en este directorio, en `dev`, sin commit (lo hace el master). No arranques servidor en el puerto 3001 (de Adrián); usa 3010 (`next build && next start -p 3010`, nunca `next dev` para medir).
- La BD es la de producción (Neon). Escenarios k6 **solo lectura**; nada de POST/PUT/DELETE de datos de deportistas. Máx. **10 VUs** y escalones cortos (hay personas reales: Visus y Amanda). Sin pico ni spike.
- Credenciales de prueba: `workflow/secrets.local.md` (no copiarlas a ningún archivo que se suba; los `config.env` de k6 en `.gitignore`). Login con cuenta de cada rol: deportista (Visus), admin, nutricionista (Amanda). Si falta alguna, medir las que haya y anotarlo.
- Medir **local** (build de producción en 3010) y **Vercel** (`https://app.optimosport.com` o, si redirige, `https://optimo-online.vercel.app`).
- Calibrar antes de medir si hace falta; anotar hardware/red (local contra Neon Frankfurt ≠ Vercel iad1).
- Resultados en `workflow/load/k6/results/` (gitignored) e informe en `workflow/briefs/`.

## Pasos

### P1 — k6 ronda 1 (línea base), sin tocar código  [Opus, sin pisar a nadie]
- Montar `workflow/load/k6/` (nuevo en este repo): lib de login (next-auth credentials → cookie de sesión), escenarios por rol: deportista (home `/a/[id]`, nutrición hoy/compra, ajustes), admin (`/panel`, ajustes, una ficha), nutricionista (`/nutricion`, `/nutricion/[athleteId]`, perfil, seguimiento, compra, plantillas, alimentos). Solo GET de páginas y APIs de lectura. Umbrales de partida: p95 documento < 800 ms.
- Ejecutar 1 VU (línea base) y 5→10 VUs durante ~3 min, **local y Vercel**. Medir TTFB y `http_req_duration` por ruta y por rol.
- Informe `workflow/briefs/k6-ronda1.md`: tabla ruta × rol × (local p50/p95, Vercel p50/p95), top 10 rutas lentas, y para cada una la causa (nº de consultas secuenciales, N+1, tamaño de HTML/JS, imágenes, región, sesión/auth en cada petición, middleware).
- **Criterio de hecho:** el informe existe con las 3 roles medidos (o la ausencia anotada), local y Vercel, ≥ 10 rutas, y lista priorizada de mejoras con el archivo a tocar. `git status` sin cambios en `app/` `lib/` `middleware.ts` `vercel.json`.

### P2 — Diagnóstico dominio/móvil  [Opus, solo lectura + curl/Playwright]
- Confirmar con `curl -I` y Playwright (emulación móvil y escritorio, sin caché y con ella) qué host termina viendo cada dispositivo desde `app.optimosport.com` y `optimo-online.vercel.app`, y si hay diferencias de versión (cabeceras, `x-vercel-id`, id de build en el HTML, cookies por host, caché `Cache-Control`, manifest/PWA/icono de pantalla de inicio, service worker).
- Proponer el arreglo mínimo y decir qué hay que hacer en el móvil de Adrián (quitar icono de inicio, cerrar sesión, borrar datos del sitio).
  - **Corrección del visto bueno (comprobado en código):** el código solo no basta. `next-auth/lib/env.js` `reqWithEnvURL` reescribe `req.url` **y** `req.nextUrl` al origen de `AUTH_URL`, así que en `middleware.ts` el host real solo está en las cabeceras `x-forwarded-host`/`host`. Además `signIn(... redirectTo: "/")` (`app/login/page.tsx`) y `signOut({ redirectTo: "/login" })` (`app/logout-button.tsx`) construyen la URL con `AUTH_URL` (`@auth/core` `createActionURL`), y `app/api/integrations/polar/callback/route.ts` también redirige a `AUTH_URL`. Con solo tocar el middleware, el login y el logout seguirían mandando a `optimo-online.vercel.app`.
  - **Arreglo real (env, se deja preparado y se avisa, no se aplica):** en Vercel Production `AUTH_URL=https://app.optimosport.com` (y revisar `POLAR_REDIRECT_URI` + la URL de redirección dada de alta en Polar para que estén en el mismo host, si no la cookie `polar_oauth` se pierde) y redeploy. Opcional en código: redirect 308 de `optimo-online.vercel.app` → `app.optimosport.com` en `middleware.ts`, leyendo `x-forwarded-host`, para que nadie vuelva a quedarse en el host viejo.
- **Criterio de hecho:** `workflow/briefs/dominio-movil.md` con la causa demostrada (salida de comandos), el arreglo propuesto con archivo, y la prueba de cómo verificarlo tras el deploy. Cero cambios de código.

### P3 — Mejoras (tras P1 y P2)  [Opus -Think, uno detrás de otro si se pisan]
- Aplicar las mejoras del informe de ronda 1, por orden de impacto: región `fra1`, consultas en paralelo (`Promise.all`) / reducir viajes a la BD, consultas con índices (`db/schema.sql` + migración solo si aporta; nunca destructiva), caché por petición (`React.cache`) de sesión y de datos repetidos, `loading.tsx`/Suspense para pintar antes, `next/image` y tamaños, cabeceras de caché de estáticos, bundle (dynamic import de componentes pesados), `max` del pool, etc. Más el arreglo de dominio de P2.
- Local: `tsc` limpio y `next build` ok; sin regresión funcional en las 3 vistas (probar con Playwright o k6 checks que cada ruta devuelve 200 y el contenido clave).
- **Criterio de hecho:** `npx tsc --noEmit` exit 0, `npm run build` exit 0, lista de cambios con archivo en `workflow/briefs/from-opus-velocidad-p3.md`, y los checks de k6 (status 200) siguen verdes en local.

### P4 — Subir a main y k6 ronda 2  [master + Opus]
- El master commitea en `dev`, mergea a `main` (orden de Adrián), espera el deploy READY en Vercel y comprueba que `app.optimosport.com` ya no redirige a otro host (`curl -sI https://app.optimosport.com/` → `Location` relativo o en el mismo host; cookie `__Secure-authjs.callback-url` = `app.optimosport.com`) y que la función corre en `fra1` (`curl -sI https://app.optimosport.com/login` → `x-vercel-id: …::fra1::…`; hoy da `cdg1::iad1::`). Si `AUTH_URL` no se ha cambiado aún, el dominio seguirá redirigiendo: anotarlo como pendiente de Adrián, no como fallo de P3.
- Tras el cambio de región, **el mismo k6** compara peras con peras solo si se usan los mismos tokens/escenarios; los tokens de `workflow/load/k6/tokens.json` deben firmarse con el `AUTH_SECRET` de producción y con el nombre de cookie de https (`__Secure-authjs.session-token`, que es también el salt del JWT); los de local (`authjs.session-token`) no valen contra Vercel.
- Mismo k6 que P1, local y Vercel → `workflow/briefs/k6-ronda2.md` con comparativa antes/después.
- **Criterio de hecho:** informe con delta por ruta; mejora de p95 documento medible en Vercel; lista de lo que aún se puede mejorar.

### P5 — Mejoras de la ronda 2 y cierre
- Aplicar lo que la ronda 2 señale, mismo criterio que P3, merge a `main`, verificación final con 1 pasada corta de k6 en Vercel.

## Supuestos
- No se cambian variables de entorno de Vercel sin avisar a Adrián (propuesta en `dominio-movil.md`).
- Sin escrituras en la BD de producción salvo una migración de índices no destructiva, solo si la ronda 1 la justifica.
