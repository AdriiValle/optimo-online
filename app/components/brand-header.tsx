"use client";

import { type ReactNode, useLayoutEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

type Props = {
  player?: string;
  meta?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Toolbar al ancho del workspace (nutricionista escritorio). */
  wide?: boolean;
};

/** Desplazamiento (px) a partir del cual la barra pasa de borde de scroll a material. */
const SCROLL_EDGE = 4;

function subscribeNoop() {
  return () => {};
}

/** false en el servidor y durante la hidratación; true en cualquier render de cliente posterior. */
function useIsClient() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

/** true cuando hay contenido pasando por debajo de la barra (scroll de ventana > SCROLL_EDGE). */
function useScrolledPastEdge() {
  const [scrolled, setScrolled] = useState(false);

  // Layout effect: la lectura inicial (p. ej. scroll restaurado al volver atrás) llega antes del
  // primer pintado, sin un frame de barra transparente sobre contenido.
  useLayoutEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      setScrolled(window.scrollY > SCROLL_EDGE);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return scrolled;
}

/**
 * Variante de barra:
 * - navbar: jugador (y todo <720): 44 px, título centrado, material solo al hacer scroll.
 * - toolbar: admin (/panel) y nutricionista (wide): ≥720 toolbar de 52 px, título a la izquierda,
 *   material fijo; <720 se comporta como navbar.
 */
function useVariant(wide?: boolean): "navbar" | "toolbar" {
  const pathname = usePathname() ?? "";
  if (wide) return "toolbar";
  return pathname === "/panel" || pathname.startsWith("/panel/") ? "toolbar" : "navbar";
}

function HeaderMarkup({ player, meta, leading, trailing, wide }: Props) {
  const scrolled = useScrolledPastEdge();
  const variant = useVariant(wide);
  const viewportCls = [
    "doc-header-viewport",
    variant === "toolbar" ? "doc-header-viewport--toolbar" : "",
    wide ? "doc-header-viewport--wide" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const headerCls = wide ? "doc-header doc-header--wide" : "doc-header";
  return (
    <div className={viewportCls} data-scrolled={scrolled ? "true" : "false"}>
      <header className={headerCls}>
        {leading ?? <span className="header-leading" aria-hidden="true" />}
        <div className="brand-row">
          <img className="brand-logo" src="/logo-optimo.png" width={28} height={28} alt="" />
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

const HOST_ID = "app-bar";

/** Contenedor de la barra como primer hijo de body: va antes del contenido en el orden de tabulación. */
function barHost() {
  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElement("div");
    host.id = HOST_ID;
    document.body.prepend(host);
  }
  return host;
}

/**
 * Barra superior fija al viewport. En el HTML del servidor va en línea (ya pintada en el primer
 * frame, sin hueco ni salto); tras hidratar se porta al inicio de body para que ningún ancestro con
 * transform/overflow la saque del viewport. En navegación de cliente se porta tras el layout effect
 * (antes del pintado): así el primer nodo del segmento sigue siendo el contenido y el router de
 * Next mantiene el scroll arriba al navegar. El hueco lo reserva body { padding-top } con
 * --header-block (shell.css).
 */
export function BrandHeader(props: Props) {
  const isClient = useIsClient();
  const [portalReady, setPortalReady] = useState(false);

  useLayoutEffect(() => {
    setPortalReady(true);
  }, []);

  if (!isClient) return <HeaderMarkup {...props} />;
  if (!portalReady) return null;
  return createPortal(<HeaderMarkup {...props} />, barHost());
}
