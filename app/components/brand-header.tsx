import type { ReactNode } from "react";

type Props = {
  player?: string;
  meta?: string;
  trailing?: ReactNode;
};

export function BrandHeader({ player, meta, trailing }: Props) {
  return (
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
  );
}
