Eres un worker del metodo workflow. Trabaja en este directorio (repo Ricardo Visus), en `dev`, sin commit. No arranques otro servidor en el puerto 3001; si hace falta, 3010. No escribas en la BD de prod (salvo un indice no destructivo justificado con EXPLAIN, anotado).

# Brief: P3 mejoras de velocidad (ronda 1)

Lee `plan-velocidad-k6.md` (P3) y `k6-ronda1.md`. Aplica las mejoras priorizadas 1-6 de `k6-ronda1.md` que tengan respaldo de numeros:
1. `vercel.json`: `"regions": ["fra1"]`.
2. Menos viajes por transaccion RLS (`lib/rls.ts`): una tx por pagina, `set_config` dentro de la primera consulta; `/api/diaries` de 3 tx a 1.
3. Consultas independientes de verdad en paralelo (o consulta unica/CTE) en `app/a/[id]/page.tsx`, `app/nutricion/[athleteId]/*`, `lib/queries.ts`.
4. Indice (athlete_id, fecha) solo si EXPLAIN lo confirma (`db/schema.sql` + migracion no destructiva).
5. HTML mas ligero: `/nutricion/alimentos` (363 KB) y los RSC de 75-90 KB.
6. `React.cache` en `currentUser()` y `loading.tsx` en `/a/[id]` y `/nutricion/[athleteId]`.
NO toques AUTH_URL ni el dominio (lo hace el master en Vercel). Sin cambiar el comportamiento ni el look.

Criterio de hecho: `npx tsc --noEmit` exit 0; `npm run build` exit 0; k6 local (workflow/load/k6, MODE=load, 10 VUs) con checks 100% y contenido clave (no /login); tabla antes/despues local en `from-opus-velocidad-p3.md` con la lista de cambios por archivo. Para el servidor de 3010 al acabar.
