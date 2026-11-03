# From sonnet — yt-video-ui

- Hecho: sí (código y pruebas locales; sync contra Neon NO ejecutado)
- Qué cambió (rutas):
  - `app/a/[id]/home-client.tsx` — columna Vídeo: enlace «Vídeo» (`target=_blank rel="noopener noreferrer"`) si `row.video`, «—» si null.
  - `db/sync-videos.ts` + `package.json` (`npm run db:sync-videos`) — lee `parseIndexHtml().protocols`; en TODAS las filas de `day_plans` reescribe `video` de cada bloque `protocol` según su `protocolId`; una transacción, `app.current_role='admin'`; solo actualiza filas que cambian; imprime «N de M filas cambiadas».
  - `db/set-protocol-videos.ts` + `package.json` (`npm run db:set-videos -- [subidos.csv] [--dry-run]`) — lee `subidos.csv` (por defecto `..\..\..\YouTube\subidos\subidos.csv`), valida `protocolId` contra `PROTOCOLS` y que la URL sea https, y escribe `video: "<url>"` en esa entrada de `index.html` y `plan-visus.html` (se mantiene el espejo, idénticos). Si hay un id desconocido no escribe nada (exit 1). Última fila por protocolId gana; re-ejecutar reemplaza el vídeo.
  - Flujo: `npm run db:set-videos` → `npm run db:sync-videos`.
- Comprobado: `tsc --noEmit` limpio; `set-protocol-videos` probado con CSV temporal (entrada de una línea y multilínea, reemplazo, id desconocido, dry-run) y `parseIndexHtml` lee los `video`; después `git checkout` de los dos HTML (ningún protocolo queda con vídeo de prueba) y CSV de prueba borrado. Commit en `dev`.
- Duda: no ejecuté `db:sync-videos` (escribe en Neon real y no hay URL real todavía) ni vi el enlace en el navegador (requiere login/DB).
- Recomendación: tras la primera subida real (paso 4), correr `npm run db:set-videos` y luego `npm run db:sync-videos`; el criterio «protocolo real con video no null en Neon» se cierra ahí. Ojo: `db:seed` no debe reutilizarse para esto.
- Bloquea a Adrián: no (merge a `main` de esta app sí es suyo, no hecho).
