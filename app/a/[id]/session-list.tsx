"use client";

import { useCallback, useState } from "react";
import type { DayPlan } from "@/lib/types";
import { VideoEmbedModal } from "./video-embed-modal";

type OpenVideo = { url: string; title: string; blurb: string | null };

function PlayGlyph() {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
      <path d="M3 1.8v8.4a.6.6 0 0 0 .9.52l7-4.2a.6.6 0 0 0 0-1.04l-7-4.2A.6.6 0 0 0 3 1.8z" fill="currentColor" />
    </svg>
  );
}

export function SessionList({ plan }: { plan?: DayPlan }) {
  const [openVideo, setOpenVideo] = useState<OpenVideo | null>(null);
  const closeVideo = useCallback(() => setOpenVideo(null), []);
  const rows = plan?.blocks ?? [{ kind: "note" as const, text: "Sin bloque asignado para este día." }];
  return (
    <div className="session-list">
      {rows.map((row, i) => {
        if (row.kind === "section") {
          return (
            <h3 key={i} className="session-section">
              {row.title}
            </h3>
          );
        }
        if (row.kind === "note" || row.kind === "match") {
          return (
            <p key={i} className="session-note">
              {row.text}
            </p>
          );
        }
        return (
          <div key={i} className="session-item">
            <div className="session-item-main">
              <span className="session-item-label">{row.label}</span>
              {row.qty ? <span className="session-item-qty">{row.qty}</span> : null}
              {row.info ? <span className="session-item-info">{row.info}</span> : null}
            </div>
            {row.video ? (
              <button
                type="button"
                className="session-video"
                aria-haspopup="dialog"
                aria-label={`Ver vídeo: ${row.label}`}
                onClick={() => setOpenVideo({ url: row.video!, title: row.label, blurb: row.blurb ?? null })}
              >
                <PlayGlyph />
                <span>Vídeo</span>
              </button>
            ) : null}
          </div>
        );
      })}
      <VideoEmbedModal
        videoUrl={openVideo?.url ?? null}
        title={openVideo?.title ?? null}
        blurb={openVideo?.blurb ?? null}
        onClose={closeVideo}
      />
    </div>
  );
}
