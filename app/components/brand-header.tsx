"use client";

import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  player?: string;
  meta?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
};

function HeaderMarkup({ player, meta, leading, trailing }: Props) {
  return (
    <div className="doc-header-viewport">
      <header className="doc-header">
        {leading ?? <span className="header-leading" aria-hidden="true" />}
        <div className="brand-row">
          <img className="brand-logo" src="/logo-optimo.png" width={32} height={32} alt="" />
          <span className="brand-title">Óptimo</span>
          {player ? (
            <>
              <span className="brand-sep" aria-hidden="true">
                ·
              </span>
              <span className="brand-player">{player}</span>
            </>
          ) : null}
          {meta ? (
            <>
              <span className="brand-sep" aria-hidden="true">
                ·
              </span>
              <span className="brand-meta">{meta}</span>
            </>
          ) : null}
        </div>
        {trailing}
      </header>
    </div>
  );
}

/** Cabecera fija al viewport vía portal a body (nunca en el flujo del scroll). */
export function BrandHeader(props: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // No renderizar el header en el flujo del documento: solo portal a body.
  // El hueco lo da body { padding-top } en globals.css.
  if (!mounted) return null;

  return createPortal(<HeaderMarkup {...props} />, document.body);
}
