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

export function HeaderBackButton({ href, onBack, label = "Atrás" }: Props) {
  const router = useRouter();

  if (href) {
    return (
      <div className="header-leading">
        <Link href={href} className="icon-btn header-back" aria-label={label}>
          ←
        </Link>
      </div>
    );
  }

  if (onBack) {
    return (
      <div className="header-leading">
        <button
          type="button"
          className="icon-btn header-back"
          aria-label={label}
          onClick={() => router.back()}
        >
          ←
        </button>
      </div>
    );
  }

  return null;
}
