"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { youtubeEmbedSrc, youtubeVideoId } from "@/lib/youtube-embed";

type Props = {
  videoUrl: string | null;
  /** Nombre del ejercicio: título del sheet. */
  title?: string | null;
  blurb: string | null;
  onClose: () => void;
};

/** Margen para desmontar el sheet si animationend no llega (p. ej. animaciones desactivadas). */
const CLOSE_FALLBACK_MS = 600;

const FOCUSABLE =
  'button:not([disabled]), iframe, a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function VideoEmbedModal({ videoUrl, title, blurb, onClose }: Props) {
  const videoId = videoUrl ? youtubeVideoId(videoUrl) : null;
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const titleId = useId();
  const closeBtn = useRef<HTMLButtonElement | null>(null);
  const fallback = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const finishClose = useCallback(() => {
    if (fallback.current) {
      window.clearTimeout(fallback.current);
      fallback.current = null;
    }
    setClosing(false);
    onClose();
  }, [onClose]);

  const requestClose = useCallback(() => {
    setClosing(true);
    if (fallback.current) window.clearTimeout(fallback.current);
    fallback.current = window.setTimeout(finishClose, CLOSE_FALLBACK_MS);
  }, [finishClose]);

  // Abierto: bloqueo de scroll iOS-safe (fixed en body; overflow:hidden solo no basta), foco en «Cerrar» y, al salir, vuelta al disparador.
  useEffect(() => {
    if (!videoId) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
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
    closeBtn.current?.focus({ preventScroll: true });

    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
      opener?.focus({ preventScroll: true });
    };
  }, [videoId, mounted]);

  useEffect(() => {
    if (!videoId || closing) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") requestClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [videoId, closing, requestClose]);

  useEffect(
    () => () => {
      if (fallback.current) window.clearTimeout(fallback.current);
    },
    []
  );

  /** Tab y Mayús+Tab circulan dentro del sheet mientras está abierto. */
  function trapFocus(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab") return;
    const nodes = e.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  if (!videoId || !mounted) return null;

  const heading = title?.trim() || "Vídeo del ejercicio";
  const text = blurb?.trim();

  return createPortal(
    <div
      className={`sheet-scrim video-sheet-scrim${closing ? " is-closing" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !closing) requestClose();
      }}
      onAnimationEnd={(e) => {
        if (closing && e.target === e.currentTarget) finishClose();
      }}
    >
      <div
        className="sheet video-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={trapFocus}
      >
        <div className="sheet-grabber" aria-hidden="true" />
        <div className="sheet-header">
          <h2 id={titleId} className="sheet-title">
            {heading}
          </h2>
          <button
            ref={closeBtn}
            type="button"
            className="icon-btn sheet-close"
            aria-label="Cerrar vídeo"
            onClick={() => {
              if (!closing) requestClose();
            }}
          >
            <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
              <path d="M2.5 2.5l9 9M11.5 2.5l-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="sheet-body">
          <div className="video-sheet-frame">
            <iframe
              key={videoId}
              src={youtubeEmbedSrc(videoId)}
              title={`Vídeo: ${heading}`}
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          {text ? <p className="video-sheet-blurb">{text}</p> : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
