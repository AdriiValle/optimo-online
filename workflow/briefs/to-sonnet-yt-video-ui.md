# Brief — yt-video-ui

- Destino: sonnet
- Slug: yt-video-ui
- Trabajo: app Óptimo Online
- Objetivo: paso 5 de `C:\Users\SISTELIN\.cursor\skills\workflow\workflow\briefs\plan-youtube-upload.md` (anclado): pintar `row.video` + sync Neon.
- SÍ: `app/a/[id]/home-client.tsx` (columna Vídeo = enlace si hay URL), `db/sync-videos.ts` + `package.json` (`db:sync-videos`), forma de volcar URL desde `subidos.csv`/`protocolId` a `PROTOCOLS.video` en `index.html` (+ `plan-visus.html` si se mantiene espejo). Commit `dev`. `workflow/briefs/from-sonnet-yt-video-ui.md`.
- NO: `db:seed`, Vercel, `main`, OAuth YouTube, secretos, fábrica workflow.
- Criterio: ver plan paso 5 (enlace visible en local con URL de prueba; sync reescribe `video` en day_plans).
- Rama: `dev`

Lee el plan anclado (paso 5 + anclas Óptimo Online). Escribe el `from`.
