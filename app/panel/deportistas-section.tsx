"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CreateAthleteForm } from "./create-form";

type Props = {
  count: number;
  children: ReactNode;
};

/** Margen para desmontar el sheet si animationend no llega (p. ej. animaciones desactivadas). */
const CLOSE_FALLBACK_MS = 600;

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function DeportistasSection({ count, children }: Props) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const titleId = useId();
  const headingId = useId();
  const opener = useRef<HTMLButtonElement | null>(null);
  const fallback = useRef<number | null>(null);

  const finishClose = useCallback(() => {
    if (fallback.current) {
      window.clearTimeout(fallback.current);
      fallback.current = null;
    }
    setOpen(false);
    setClosing(false);
    opener.current?.focus();
  }, []);

  const close = useCallback(() => {
    setClosing(true);
    if (fallback.current) window.clearTimeout(fallback.current);
    fallback.current = window.setTimeout(finishClose, CLOSE_FALLBACK_MS);
  }, [finishClose]);

  useEffect(() => {
    if (!open || closing) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closing, close]);

  useEffect(
    () => () => {
      if (fallback.current) window.clearTimeout(fallback.current);
    },
    []
  );

  function openSheet(e: React.MouseEvent<HTMLButtonElement>) {
    opener.current = e.currentTarget;
    setClosing(false);
    setOpen(true);
  }

  /** Tab y Mayús+Tab circulan dentro del sheet mientras está abierto. */
  function trapFocus(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab") return;
    const nodes = e.currentTarget.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );
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

  function onScrimAnimationEnd(e: React.AnimationEvent<HTMLDivElement>) {
    if (closing && e.target === e.currentTarget) finishClose();
  }

  const countLabel = count === 1 ? "1 deportista" : `${count} deportistas`;

  return (
    <section className="adm-section" aria-labelledby={headingId}>
      <div className="adm-titlebar">
        <div className="adm-titles">
          <h1 id={headingId} className="adm-title">
            Deportistas
          </h1>
          {count > 0 ? <p className="adm-count">{countLabel}</p> : null}
        </div>
        {count > 0 ? (
          <button
            type="button"
            className="btn adm-add"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={openSheet}
          >
            <PlusIcon />
            <span>
              Añadir<span className="adm-add-extra"> deportista</span>
            </span>
          </button>
        ) : null}
      </div>

      {count > 0 ? (
        children
      ) : (
        <div className="state adm-empty">
          <svg className="state-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle cx="16" cy="11" r="5" stroke="currentColor" strokeWidth="2" />
            <path d="M6 27c1.6-5 5.5-7.5 10-7.5s8.4 2.5 10 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <h2 className="state-title">Sin deportistas</h2>
          <p className="state-text">Da de alta al primero para planificar sus sesiones y seguir su recuperación.</p>
          <button type="button" className="btn btn--tinted" aria-haspopup="dialog" aria-expanded={open} onClick={openSheet}>
            <PlusIcon />
            Añadir deportista
          </button>
        </div>
      )}

      {open ? (
        <div
          className={`sheet-scrim adm-sheet-scrim${closing ? " is-closing" : ""}`}
          onClick={(e) => {
            if (e.target === e.currentTarget && !closing) close();
          }}
          onAnimationEnd={onScrimAnimationEnd}
        >
          <div
            className="sheet sheet--opaque adm-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onKeyDown={trapFocus}
          >
            <CreateAthleteForm onClose={close} titleId={titleId} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
