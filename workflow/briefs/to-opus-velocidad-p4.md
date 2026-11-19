Eres un worker del metodo workflow. Trabaja en este directorio (repo Ricardo Visus), en `dev`, sin commit. No arranques otro servidor en el puerto 3001; usa 3010. No escribas en la BD de prod. Max 10 VUs contra Vercel.

# Brief: P4 + P5. k6 ronda 2 y mejoras de la ronda 2

Ya en produccion (main d5465c6, region fra1, AUTH_URL = app.optimosport.com). Lee `plan-velocidad-k6.md`, `k6-ronda1.md` y `from-opus-velocidad-p3.md`.
1. Ronda 2: mismo k6 (`workflow/load/k6`, MODE=base y MODE=load) en local (3010) y en Vercel contra **https://app.optimosport.com** (NO optimo-online.vercel.app, que sigue en el deploy viejo). Informe `k6-ronda2.md`: tabla ruta x rol con ronda 1 vs ronda 2, local y Vercel, y top de lo que aun se puede mejorar.
2. Aplica las mejoras que la ronda 2 respalde con numeros y que no cambien comportamiento ni look: p. ej. `compra` (shoppingForRange + foodGapsForList en tx paralelas), y lo que salga. `prepare: true` en `lib/db.ts` SOLO si lo mides en Vercel/local y anotas el riesgo de migraciones; si el riesgo no esta cubierto (p. ej. reintento o deshabilitarlo dentro de tx), no lo apliques.
3. Re-mide en local tras las mejoras.
Criterio de hecho: `npx tsc --noEmit` exit 0; `npm run build` exit 0; k6 local checks 100 % (200 + contenido); `k6-ronda2.md` con Vercel medido en app.optimosport.com y `x-vercel-id` fra1; `from-opus-velocidad-p4.md` con lista de cambios por archivo y antes/despues. Para el servidor de 3010 al acabar.
