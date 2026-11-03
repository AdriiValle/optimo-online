# From composer — yt-embed

- Hecho: sí
- Qué cambió (rutas):
  - `lib/youtube-embed.ts` — `youtubeVideoId()` (youtu.be, `/watch?v=`, `/embed/`, `/shorts/`) y `youtubeEmbedSrc()` para iframe estándar.
  - `app/a/[id]/video-embed-modal.tsx` — overlay con scrim oscuro, iframe embebido, cierre con X, Escape y clic fuera; al cerrar se desmonta el iframe (para el vídeo).
  - `app/a/[id]/home-client.tsx` — columna Vídeo: botón en lugar de `<a target=_blank>`; estado local abre el modal.
  - `app/globals.css` — estilos `.video-embed-*` (glass/card coherente) y `.content-table .video-link`.
- Duda: ninguna relevante. Probado en local (`localhost:3001`): clic «Vídeo» abre modal con botón Cerrar; cierre OK. No validé reproducción completa del stream unlisted (iframe presente; política embed depende de YouTube).
- Commit en `dev` + push `origin dev`.
