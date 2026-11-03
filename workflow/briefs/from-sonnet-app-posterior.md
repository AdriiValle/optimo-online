# From sonnet — app-posterior

- Hecho: sí
- Qué cambió (rutas): `index.html` y `plan-visus.html` (5 PROTOCOLS nuevos, const `POSTERIOR_FUERZA_V2 = ["2026-11-05","2026-11-18"]`, render con bifurcación), `lib/html-parse.ts` (campo `posteriorFuerzaV2`), `lib/plan.ts` (bifurcación), `db/update-posterior-blocks.ts` (nuevo), `package.json` (`db:update-posterior`). Commit en `dev`.
- Verificación: JSON de `buildDayPlans` antes/después → solo difieren 2026-11-05 y 2026-11-18 (bloque Fuerza = los 5 IDs nuevos en orden, sin la nota de «2 series del bloque»; 5-nov conserva Aceleración); 235 días, el resto idéntico (26-nov+ y 3/16-nov intactos). `npm run build` OK. Script inline de `index.html` parsea. `npm run db:update-posterior` ejecutado → `update-posterior ok · 2026-11-05, 2026-11-18`.
- No hecho: no abrí `npm run dev` con login para ver los días en el navegador (verificado por JSON de `buildDayPlans` y build).
- Duda:
- Recomendación:
- Bloquea a Adrián: no
