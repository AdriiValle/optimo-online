# from-sonnet — plan-ok (cadena posterior)

- Hecho: sí

- Qué cambió (rutas):
  - `workflow/briefs/plan-cadena-posterior.md` reescrito con anclas archivo:línea, IDs actuales del bloque, fechas, formato Knowledge, paralelo cerrado y criterio por paso. Sin código, sin Neon, sin tocar Knowledge. Rama `dev` sin cambiar, sin commit (los briefs están sin trackear).
  - Sustituye el `from-sonnet-plan-ok.md` anterior (era de cadena anterior; ya ejecutado en `3ed82af`).

- Hallazgos que cambian el plan original:
  1. **Fechas confirmadas:** los dos posteriores son **2026-11-05 (MD-2)** y **2026-11-18 (MD-3)** (`buildDayPlans` en local, solo lectura). Siguientes: 26-nov, 3-dic, 10-dic…
  2. **Sin gate por fecha:** el bloque posterior es común a todos los posteriores → hace falta `POSTERIOR_FUERZA_V2` (2 fechas) en HTML ×2 + parser + `lib/plan.ts`, igual que `ANTERIOR_FUERZA_V2`. No reutilizar los IDs viejos (los usan 26-nov y siguientes): 5 IDs nuevos.
  3. **Neon manual:** script nuevo `db/update-posterior-blocks.ts` (copia de `update-anterior-blocks.ts`). No usar `db:seed`.
  4. **Knowledge:** ya existe la ficha unilateral (`hip-thrust-unilateral-mancuernas-mini-banda`, misma dosis 8+8·2) y `hip-thrust-barra`; falta crear la **bilateral con mancuernas** y el apunte; las dos salidas a cajón mapean a fichas existentes (`zancada-cajon-triple-extension`, `caballero-lanzamiento-cadera-cajon-cambio-plano` var. 1 lado abierto) como variante con pelota medicinal.

- Duda:
  1. «Dejar hip thrust con mancuernas 2×8» + «añadir unilateral 2×8/pierna»: en disco solo existe un ejercicio con mancuernas, y ya es unilateral (8/pierna, 2×5 kg + mini-band). Lo he leído como que Adrián quiere una versión bilateral (8 reps) además de la unilateral.
  2. «Salida a cajón desde caballero» (sagital / frontal lado abierto): no hay ficha con ese nombre; las he mapeado a `zancada-cajon-triple-extension` y `caballero-lanzamiento-cadera-cajon-cambio-plano` (var. 1). Podría ser otro gesto (p. ej. un sprint de salida, `caballero-sprint-salida-lado-abierto`, que no sube al cajón).
  3. Carga/peso de mancuernas en la bilateral y peso de la med ball: no dictados (se mantiene 2×5 kg + mini-band; med ball «no especificado»). «6 / pierna» de la segunda salida se lee como 1×6.

- Recomendación:
  1. Ejecutar con bilateral = misma carga que la unilateral; si Adrián corrige, es una línea en `PROTOCOLS` + re-ejecutar `db:update-posterior`.
  2. Mapear a las dos fichas de cajón existentes (gesto con subida al cajón, que es lo que dice «salida a cajón»); mínimo cambio y reversible.
  3. Dejar la carga como está en disco y sin peso de pelota hasta que Adrián lo dicte.

- Bloquea a Adrián: no. (Ningún punto es producto nuevo, dinero, legal, borrado de datos ni merge a `main`; el update de Neon es el cambio pedido y no borra datos.)
