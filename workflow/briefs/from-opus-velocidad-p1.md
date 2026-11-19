# from-opus: velocidad P1 (k6 ronda 1)

- **Hecho:** sí, aunque una parte de la medida en Vercel es n/a porque producción no tiene esas rutas (ver Duda).
  - Informe con los 3 roles medidos: sí (deportista Visus, admin, nutricionista Amanda; sesión por JWT firmado, sin login).
  - Local y Vercel, 1 VU y 10 VUs durante ~3 min: sí. En Vercel, 9 de las 21 rutas dan 404 en prod: anotadas como n/a, con la causa.
  - Al menos 10 rutas: sí, 21 (12 con medida en Vercel).
  - Lista priorizada de mejoras con el archivo a tocar: sí.
  - `git status` limpio en `app/` `lib/` `middleware.ts` `vercel.json`: sí.
- **Qué cambió:** se creó `workflow/load/k6/` (`mint-tokens.mjs`, `routes.js`, `run.js`, `summarize.mjs`, `results/` gitignored), `workflow/briefs/k6-ronda1.md` y este archivo. En `.gitignore` se añadieron `workflow/load/k6/results/`, `config.env` y `tokens.json` (este último lleva cookies de sesión válidas 1 h). Sin commit (lo hace el master). El servidor 3010 está parado. Hubo un `next build` local que regeneró `.next`.
- **Resumen:** el suelo en Vercel es de unos 700 ms incluso para `/api/me` (región iad1 frente a Neon en Frankfurt, más ≥4 viajes por transacción RLS y 2 transacciones por página). El p95 de documento es de 1748 ms en Vercel y de 774-825 ms en local. Las más lentas: `/nutricion/{A}` (1.9 s), `/a/{A}` (1.5 s) y, en local, `compra`.
- **Duda:** producción no es 7e79ecb. `/panel/ajustes`, `/nutricion/alimentos` y las subrutas `/nutricion/{A}/*` dan 404 en `optimo-online.vercel.app`, pero existen en `origin/main`. No pude ver qué deployment es: el MCP de Vercel da 403 en el scope `adriivalle`.
- **Recomendación:** en P2/P4, comprobar con `vercel ls optimo-online` (CLI) qué commit está en producción y redesplegar `main`, por ejemplo con un push vacío o `vercel --prod` desde `main`. Hacerlo junto con `fra1`. La ronda 2 medirá entonces esas 9 rutas en Vercel por primera vez.
- **Bloquea a Adrián:** no (el deploy a main ya está ordenado en el plan, P4).
