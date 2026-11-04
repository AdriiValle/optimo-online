"use client";

import { useState } from "react";
import type { DayPlan } from "@/lib/types";
import { VideoEmbedModal } from "./video-embed-modal";

export function SessionList({ plan }: { plan?: DayPlan }) {
  const [openVideo, setOpenVideo] = useState<{ url: string; blurb: string | null } | null>(null);
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
                onClick={() => setOpenVideo({ url: row.video!, blurb: row.blurb ?? null })}
              >
                Vídeo
              </button>
            ) : null}
          </div>
        );
      })}
      <VideoEmbedModal
        videoUrl={openVideo?.url ?? null}
        blurb={openVideo?.blurb ?? null}
        onClose={() => setOpenVideo(null)}
      />
    </div>
  );
}
