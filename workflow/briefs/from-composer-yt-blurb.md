# From composer — yt-blurb

- Hecho: sí
- Qué cambió (rutas):
  - `lib/types.ts` — campo `blurb` en `Protocol` y bloques `kind: "protocol"` (`blurb: string | null`).
  - `lib/plan.ts` — `pushProtocol` vuelca `blurb` desde PROTOCOLS.
  - `lib/knowledge-blurb.ts` — lee `## Descripción` del wiki (`OPTIMO_KNOWLEDGE_EJERCICIOS` o ruta G: por defecto) y comprime a ~280–400 caracteres.
  - `db/protocol-html-field.ts` — helper genérico para escribir campos string en PROTOCOLS del HTML.
  - `db/set-protocol-videos.ts` — además de `video`, escribe `blurb` cuando la fila del CSV trae `slug` con ficha en Knowledge.
  - `db/sync-videos.ts` — propaga `video` + `blurb` a `day_plans.blocks` en Neon.
  - `index.html` + `plan-visus.html` — `blurb` en los 6 protocolos con vídeo subido.
  - `app/a/[id]/video-embed-modal.tsx` + `home-client.tsx` — muestra el resumen bajo el iframe (oculto si vacío).
  - `app/globals.css` — `.video-embed-blurb`.
- Campo en datos: **`blurb`** (junto a `video` en PROTOCOLS y en cada bloque protocolo de `day_plans`).
- Ejemplo (`fuerza-isquios-salida-cajon-sagital-medball`): «Desde caballero, zancada hacia delante terminando con el pie delantero encima del cajón. Al llegar arriba, triple extensión lanzando la cadera y terminando de puntillas con la pierna trasera. Mantener estabilidad sobre la pierna delantera.»
- Verificación: `npm run db:set-videos` · `npm run db:sync-videos` (4 filas de plan actualizadas) · `tsc --noEmit` OK.
- Duda: ninguna.
- Recomendación: al subir nuevos vídeos, mantener `slug` en `subidos.csv` y ejecutar `db:set-videos` + `db:sync-videos` (o re-seed de planes si cambia la plantilla).
