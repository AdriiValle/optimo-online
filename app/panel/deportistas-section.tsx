"use client";

import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { CreateAthleteForm } from "./create-form";

type Props = {
  children: ReactNode;
};

export function DeportistasSection({ children }: Props) {
  const [open, setOpen] = useState(false);
  const sheetTitleId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  return (
    <section className="stack">
      <div className="section-head-row">
        <h1>Deportistas</h1>
        <button
          type="button"
          className="btn secondary"
          aria-expanded={open}
          aria-controls="create-athlete-sheet"
          onClick={() => setOpen(true)}
        >
          Añadir
        </button>
      </div>
      {children}
      {open ? (
        <div className="create-overlay" role="presentation" onClick={close}>
          <div
            id="create-athlete-sheet"
            className="create-sheet card"
            role="dialog"
            aria-modal="true"
            aria-labelledby={sheetTitleId}
            onClick={(e) => e.stopPropagation()}
          >
            <CreateAthleteForm onClose={close} titleId={sheetTitleId} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
