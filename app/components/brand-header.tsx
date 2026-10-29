"use client";

import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  player?: string;
  meta?: string;
  trailing?: ReactNode;
};

function HeaderMarkup({ player, meta, trailing }: Props) {
  return (
    <div className="doc-header-viewport">
      <header className="doc-header">
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

export function BrandHeader(props: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const markup = <HeaderMarkup {...props} />;

  if (!mounted) {
    return markup;
  }

  return createPortal(markup, document.body);
}
