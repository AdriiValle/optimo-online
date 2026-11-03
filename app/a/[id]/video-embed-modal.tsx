"use client";

import { useEffect } from "react";
import { youtubeEmbedSrc, youtubeVideoId } from "@/lib/youtube-embed";

type Props = {
  videoUrl: string | null;
  onClose: () => void;
};

export function VideoEmbedModal({ videoUrl, onClose }: Props) {
  const videoId = videoUrl ? youtubeVideoId(videoUrl) : null;

  useEffect(() => {
    if (!videoId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [videoId, onClose]);

  if (!videoId) return null;

  return (
    <div className="video-embed-overlay" role="presentation" onClick={onClose}>
      <div
        className="video-embed-shell card"
        role="dialog"
        aria-modal="true"
        aria-label="Vídeo del ejercicio"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="icon-btn video-embed-close" aria-label="Cerrar" onClick={onClose}>
          ×
        </button>
        <div className="video-embed-frame">
          <iframe
            key={videoId}
            src={youtubeEmbedSrc(videoId)}
            title="Vídeo del ejercicio"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
