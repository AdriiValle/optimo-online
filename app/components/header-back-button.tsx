"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  /** Enlace fijo (p. ej. admin en ficha → /panel). */
  href?: string;
  /** Navegación por historial; sin href. */
  onBack?: boolean;
  label?: string;
};

function BackChevron() {
  return (
    <svg className="header-back-chevron" width="12" height="20" viewBox="0 0 12 20" aria-hidden="true">
      <path
        d="M10 2 2 10l8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Botón atrás de barra (chevron + etiqueta, estilo iOS). */
export function HeaderBackButton({ href, onBack, label = "Atrás" }: Props) {
  const router = useRouter();

  if (href) {
    return (
      <div className="header-leading">
        <Link href={href} className="header-btn header-back">
          <BackChevron />
          <span className="header-back-label">{label}</span>
        </Link>
      </div>
    );
  }

  if (onBack) {
    return (
      <div className="header-leading">
        <button type="button" className="header-btn header-back" onClick={() => router.back()}>
          <BackChevron />
          <span className="header-back-label">{label}</span>
        </button>
      </div>
    );
  }

  return null;
}
