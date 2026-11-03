# from-sonnet — plan-ok

- Hecho: sí

- Qué cambió (rutas):
  - `workflow/briefs/plan-cadena-anterior.md` reescrito con anclas archivo:línea, rutas Drive, fechas, IDs, paralelo cerrado y criterio por paso. Sin código, sin Neon, sin tocar Knowledge. Rama `dev` sin cambiar. Sin commit (los briefs de `workflow/briefs/` están sin trackear en este repo; no he cambiado esa convención).

- Hallazgos que cambian el plan original:
  1. **Fechas:** los dos días son **2026-11-03 (MD-4)** y **2026-11-16 (MD-5)**. 16-nov confirmado ejecutando `buildDayPlans` en local (solo lectura). Siguientes anterior: 24-nov, 1-dic, 8-dic…
  2. **Hoy no hay gate por fecha:** el bloque anterior es común a todos los días anterior. Hay que añadir una lista explícita de 2 fechas (HTML + parser + `lib/plan.ts`), si no cambiarían también 24-nov en adelante.
  3. **Doble sitio + Neon:** `index.html` y `plan-visus.html` son idénticos (editar ambos; el parser lee `index.html`); `lib/plan.ts:220-234` construye el JSON; la app lee `day_plans.blocks` de Neon, que no se recalcula solo.
  4. **No usar `db:seed`:** borra todos los `day_plans` del atleta y resetea contraseñas admin/atleta con `SEED_*`. El plan prevé un script mínimo `update` solo de esas dos fechas.
  5. **Knowledge:** ya existen `sentadilla-espanola-unilateral-cajon-45`, `salto-cajon-desde-sentado` y `hop-jump-trx`; solo falta **crear** la ficha de zancadas ida/vuelta caballero+mancuernas y el apunte del porqué; el resto es actualizar. CEA no tiene ficha: se trata como alias de `hop-jump-trx` + concepto en el apunte.

- Duda:
  1. Dosis de lo nuevo no dictada por Adrián (sobre todo zancadas: reps/series). El plan usa 8 reps/pierna · 2 series (misma dosis unilateral del bloque de posterior); salto cajón 6×2 y hop jump TRX 10×2 ya estaban documentados.
  2. «CEA / saltos en TRX»: lo he leído como un solo ejercicio (= `hop-jump-trx`, CEA como alias). Si Adrián quería dos ejercicios distintos (p. ej. un CEA sin TRX), el paso 2/3 añade uno más.
  3. Neon es una única base (dev y producción comparten datos según `handshake.md`): actualizar `day_plans` de 11-03/11-16 lo ve Visus en producción al instante, aunque no se haga merge a `main`. Es lo que se pidió, pero conviene que el worker del paso 2 lo sepa.

- Recomendación:
  1. Ejecutar con las dosis propuestas; si Adrián corrige después, es un cambio de una línea en `PROTOCOLS` + re-ejecutar el script de update.
  2. Un solo ejercicio (`hop-jump-trx` con alias CEA). Mínimo cambio y reversible.
  3. Aplicar el update de Neon al final del paso 2, tras verificar en local con `tsx` que 24-nov y posteriores no cambian; solo esas dos fechas, sin `delete`.

- Bloquea a Adrián: no. (Ningún punto es decisión de producto nueva, dinero, legal, borrado de datos ni merge a `main`; el update de Neon es el cambio pedido y no borra datos.)
