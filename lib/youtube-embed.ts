/** Extrae el ID de vídeo de URLs youtu.be, watch, embed o shorts. */
export function youtubeVideoId(url: string): string | null {
  const raw = url.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id || null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname.startsWith("/embed/")) {
        const id = u.pathname.split("/")[2];
        return id || null;
      }
      if (u.pathname.startsWith("/shorts/")) {
        const id = u.pathname.split("/")[2];
        return id || null;
      }
      if (u.pathname === "/watch") {
        return u.searchParams.get("v");
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function youtubeEmbedSrc(videoId: string): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1"
  });
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params}`;
}
