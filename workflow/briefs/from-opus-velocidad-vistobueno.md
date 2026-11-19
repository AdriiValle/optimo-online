# Visto bueno — plan velocidad k6 + dominio/móvil

- **Hecho:** sí (revisión con 3 lentes, hallazgos 1-3 comprobados en código y en vivo, plan corregido donde fallaba). Sin tocar código y sin commit, como pide el brief.
- **Qué cambió (rutas):**
  - `workflow/briefs/plan-velocidad-k6.md`: en P2 se corrige el arreglo del dominio (el código solo no basta, el arreglo real es la env `AUTH_URL`, más `POLAR_REDIRECT_URI`); en P4 se añaden las comprobaciones exactas con curl (`x-vercel-id` con `fra1`, cookie callback-url) y el aviso sobre los tokens k6 de producción y de local.
  - `workflow/briefs/from-opus-velocidad-vistobueno.md` (este archivo).
- **Duda:** el arreglo del dominio necesita cambiar `AUTH_URL` (y seguramente `POLAR_REDIRECT_URI` y la URL dada de alta en Polar) en Vercel Production. El plan prohíbe tocar env sin avisar a Adrián.
- **Recomendación:** dejarlo preparado en `dominio-movil.md` con el valor exacto (`AUTH_URL=https://app.optimosport.com`) y avisar a Adrián. Mientras tanto P1, P3 (región `fra1` y consultas) y P4 siguen adelante: no dependen de ese cambio. En P4, si `AUTH_URL` sigue igual, el redirect se anota como pendiente de Adrián y no como fallo.
- **Bloquea a Adrián:** no. El merge a `main` ya lo ordenó él en el plan. Lo de la env se deja preparado y avisado, sin bloquear el resto.

## Comprobación de hallazgos (19-nov-2026)

| # | Hallazgo | ¿Cierto? | Prueba |
|---|---|---|---|
| 1 | Función en `iad1`, Neon Frankfurt, `vercel.json` sin región | **Sí** | `vercel.json` = `{"framework":"nextjs"}`. `curl -sI https://app.optimosport.com/login` → `X-Vercel-Id: cdg1::iad1::…`: entra por la edge de París y la función corre en Washington. El redirect de `/` sale de la edge (`cdg1::` a secas) porque es el middleware. |
| 2 | `app.optimosport.com` → 307 a `optimo-online.vercel.app` por `AUTH_URL` | **Sí, y va más allá** | `curl -sI https://app.optimosport.com/` → `307`, `Location: https://optimo-online.vercel.app/login?from=%2F`, `Set-Cookie: __Secure-authjs.callback-url=https%3A%2F%2Foptimo-online.vercel.app`. En código, `node_modules/next-auth/lib/env.js` `reqWithEnvURL` cambia el origen de `req.nextUrl.href` por el de `AUTH_URL` y crea un `NextRequest` nuevo, así que `req.url` y `req.nextUrl` salen los dos con el host de `AUTH_URL`. Además `@auth/core/lib/utils/env.js` `createActionURL` usa `AUTH_URL` para `signIn`/`signOut` (`app/login/page.tsx:10`, `app/logout-button.tsx:14`), y `app/api/integrations/polar/callback/route.ts:16` redirige a `process.env.AUTH_URL`. |
| 3 | `lib/db.ts` `max: 8`, `prepare: false`, URL pooled, `trustHost: true` | **Sí** | `lib/db.ts:15-19` (`DATABASE_URL`, `max: 8`, `ssl: "require"`, `prepare: false`), `lib/auth.ts:18` `trustHost: true`. |

Extra comprobado: ninguna página o layout escribe en la BD al hacer GET (no hay insert/upsert/ensure en `page.tsx` ni en `layout.tsx`). Los dos `route.ts` con escrituras (`api/athletes`, `api/diaries`) solo escriben en POST. Los escenarios GET de k6 son de solo lectura de verdad. `.gitignore` ya ignora `workflow/load/k6/{results/,config.env,tokens.json}`.

## Las 3 lentes

| Lente | Voto | Lo que lo mata (top 3) |
|---|---|---|
| **Alcance** | **OK SI** | 1) P2 prometía un arreglo «solo código» que no cierra: login, logout y Polar siguen yendo a `AUTH_URL`. **Corregido en el plan.** 2) P3 es una lista abierta (índices, Suspense, bundle, imágenes, pool…). Hay que aplicar solo lo que el informe de ronda 1 respalde con números, no la lista entera. 3) P5 puede no acabar nunca: cerrarlo con «una ronda de mejoras y fin», y lo demás a la lista de pendientes. |
| **Riesgo técnico/datos** | **OK SI** | 1) Tokens k6: hay que firmarlos con el `AUTH_SECRET` de prod y con el nombre de cookie de https como salt. Si no, todo da 307 a `/login` y se mide la página de login sin enterarse. **Añadido en P4.** Hay que poner un check de k6 sobre el contenido clave, no solo sobre el status, porque `/login` también da 200. 2) Pasar a `fra1` cambia la región de todas las funciones a la vez (Polar callback y APIs). No hay cron en `vercel.json` y Neon está en Frankfurt, así que el riesgo es bajo, pero se verifica con `x-vercel-id`. 3) Cambiar `AUTH_URL` sin cambiar a la vez `POLAR_REDIRECT_URI` y la URL dada de alta en Polar rompería la conexión de Polar: la cookie `polar_oauth` se guarda en un host y vuelve por otro. **Añadido en P2.** |
| **Usuario final** (Visus, Amanda, Adrián) | **OK SI** | 1) Mientras no cambie `AUTH_URL`, el móvil de Adrián seguirá saltando de host: el arreglo de código solo no se va a notar. 2) Después del cambio, las sesiones guardadas en `optimo-online.vercel.app` no pasan a `app.optimosport.com`: cada usuario tendrá que volver a entrar una vez (Visus, Amanda y Adrián). Hay que avisarles, y la PWA instalada desde el host viejo hay que reinstalarla. 3) Los k6 contra prod con 10 VUs, si coinciden con el rato en que Amanda trabaja, se le notarán. Mejor lanzarlos en horas valle y de forma corta, como ya dice el plan. |

## Decisiones

Decidí corregir el plan en el propio archivo en lugar de escribir uno nuevo, porque los fallos eran puntuales (P2 y P4) y el resto del plan se sostiene.
