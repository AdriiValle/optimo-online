"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Secciones del panel de un deportista (Amanda). «Menú» es la vista de calendario de siempre. */
export const ATHLETE_TABS = [
  { key: "menu", label: "Menú", path: "" },
  { key: "seguimiento", label: "Seguimiento", path: "/seguimiento" },
  { key: "perfil", label: "Perfil", path: "/perfil" },
  { key: "compra", label: "Compra", path: "/compra" },
  { key: "plantillas", label: "Plantillas y platos", path: "/plantillas" },
  { key: "informes", label: "Informes", path: "/informes" }
] as const;

export type AthleteTabKey = (typeof ATHLETE_TABS)[number]["key"];

function activeTab(pathname: string, athleteId: string): AthleteTabKey {
  const rest = pathname.slice(`/nutricion/${athleteId}`.length);
  return ATHLETE_TABS.find((t) => t.path && (rest === t.path || rest.startsWith(`${t.path}/`)))?.key ?? "menu";
}

/**
 * Pestañas bajo la cabecera. Aspecto de segmentado; en pantallas estrechas la pista se desliza en horizontal
 * por dentro (la página no) y la pestaña activa se trae a la vista al entrar.
 */
export function AthleteTabs({ athleteId }: { athleteId: string }) {
  const pathname = usePathname() ?? "";
  const active = activeTab(pathname, athleteId);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const tab = track?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!track || !tab || track.scrollWidth <= track.clientWidth) return;
    const left = tab.offsetLeft - (track.clientWidth - tab.offsetWidth) / 2;
    track.scrollLeft = Math.max(0, left);
  }, [active]);

  return (
    <nav className="nut-tabs" aria-label="Secciones del deportista">
      <div className="nut-tabs-track" ref={trackRef}>
        {ATHLETE_TABS.map((t) => (
          <Link
            key={t.key}
            className="nut-tab"
            href={`/nutricion/${athleteId}${t.path}`}
            aria-current={t.key === active ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </div>
      <Link className="nut-tabs-foods" href="/nutricion/alimentos">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h10" />
        </svg>
        Alimentos
      </Link>
    </nav>
  );
}
