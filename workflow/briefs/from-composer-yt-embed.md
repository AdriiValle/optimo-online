# From composer — yt-embed

- Hecho: sí
- Qué cambió (rutas):
  - `lib/youtube-embed.ts` — `youtubeVideoId()` (youtu.be, `/watch?v=`, `/embed/`, `/shorts/`) y `youtubeEmbedSrc()` para iframe estándar.
  - `app/a/[id]/video-embed-modal.tsx` — overlay con scrim oscuro, iframe embebido, cierre con X, Escape y clic fuera; al cerrar se desmonta el iframe (para el vídeo).
  - `app/a/[id]/home-client.tsx` — columna Vídeo: botón en lugar de `<a target=_blank>`; estado local abre el modal.
  - `app/globals.css` — estilos `.video-embed-*` (glass/card coherente) y `.content-table .video-link`.
- Duda: no probé embed con un vídeo unlisted real en el navegador (requiere login app + URL en DB). Si YouTube bloquea embed por política del vídeo, el iframe mostrará el error de YouTube (comportamiento estándar); no hay fallback a pestaña nueva salvo que Adrián lo pida.
- Commit en `dev` + push `origin dev`.
