"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { youtubeEmbedSrc, youtubeVideoId } from "@/lib/youtube-embed";

type Props = {
  videoUrl: string | null;
  blurb: string | null;
  onClose: () => void;
};

export function VideoEmbedModal({ videoUrl, blurb, onClose }: Props) {
  const videoId = videoUrl ? youtubeVideoId(videoUrl) : null;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!videoId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);

    // Bloqueo de scroll iOS-safe: fixed en body (overflow:hidden solo no basta).
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [videoId, onClose]);

  if (!videoId || !mounted) return null;

  return createPortal(
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
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        {blurb?.trim() ? <p className="video-embed-blurb">{blurb.trim()}</p> : null}
      </div>
    </div>,
    document.body
  );
}
