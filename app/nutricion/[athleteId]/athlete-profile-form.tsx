"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode
} from "react";
import { createPortal } from "react-dom";
import { FormAlert, type FormMsg } from "@/app/components/password-form";

type Profile = { birthDate: string | null; heightCm: number | null; weightKg: number | null };

/** Edad en años cumplidos a partir de `YYYY-MM-DD`. */
export function ageFrom(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  if (!y || !m || !d) return null;
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
  return age >= 0 ? age : null;
}

function toNum(v: string): number | null | undefined {
  const t = v.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

/** Ficha física del deportista (nacimiento, altura, peso). La editan admins y la nutricionista asignada. */
export function AthleteProfileForm({ athleteId, onSaved }: { athleteId: string; onSaved: () => void }) {
  const uid = useId();
  const [loaded, setLoaded] = useState(false);
  const [birth, setBirth] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<FormMsg | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/athletes/${athleteId}/profile`);
      const json = res.ok ? await res.json() : null;
      if (cancelled) return;
      const p: Profile | undefined = json?.data;
      setBirth(p?.birthDate ?? "");
      setHeight(p?.heightCm != null ? String(p.heightCm) : "");
      setWeight(p?.weightKg != null ? String(p.weightKg) : "");
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [athleteId]);

  async function save(e: FormEvent) {
    e.preventDefault();
    const heightCm = toNum(height);
    const weightKg = toNum(weight);
    if (heightCm === undefined || weightKg === undefined) {
      setMsg({ ok: false, text: "Altura o peso no válidos." });
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/athletes/${athleteId}/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ birthDate: birth || null, heightCm, weightKg })
    });
    const json = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      setMsg({ ok: false, text: json?.error?.message ?? "No se pudo guardar (altura 100–250 cm, peso 25–250 kg)." });
      return;
    }
    setMsg({ ok: true, text: "Perfil guardado." });
    onSaved();
  }

  if (!loaded) {
    return (
      <div className="nut-prof" role="status" aria-label="Cargando perfil…">
        <span className="skeleton skeleton--line nut-prof-skel-title" aria-hidden="true" />
        <ul className="list-group" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <li key={i}>
              <div className="list-row">
                <span className="skeleton skeleton--line nut-prof-skel" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const age = ageFrom(birth || null);
  // Validación en línea: solo lo que el servidor no puede interpretar (texto que no es número).
  const heightBad = toNum(height) === undefined;
  const weightBad = toNum(weight) === undefined;
  const ids = {
    group: `${uid}-group`,
    help: `${uid}-help`,
    birth: `${uid}-birth`,
    height: `${uid}-height`,
    weight: `${uid}-weight`,
    hErr: `${uid}-height-err`,
    wErr: `${uid}-weight-err`,
    msg: `${uid}-msg`
  };

  return (
    <form className="nut-prof" onSubmit={(e) => void save(e)} aria-labelledby={ids.group} noValidate>
      <h3 className="list-group-title" id={ids.group}>
        Datos físicos
      </h3>
      <ul className="list-group">
        <li>
          <label className="list-row nut-field-row" htmlFor={ids.birth}>
            <span className="nut-field-label">Nacimiento</span>
            <input
              id={ids.birth}
              className="nut-field-input"
              type="date"
              value={birth}
              disabled={busy}
              onChange={(e) => setBirth(e.target.value)}
            />
          </label>
        </li>
        <li>
          <div className="list-row nut-field-row nut-field-row--static">
            <span className="nut-field-label">Edad</span>
            <span className="nut-field-value" aria-live="polite">
              {age != null ? `${age} años` : "—"}
            </span>
          </div>
        </li>
        <li>
          <label className="list-row nut-field-row" htmlFor={ids.height}>
            <span className="nut-field-label">Altura</span>
            <input
              id={ids.height}
              className="nut-field-input"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={height}
              placeholder="178"
              disabled={busy}
              aria-invalid={heightBad || undefined}
              aria-describedby={heightBad ? `${ids.hErr} ${ids.help}` : ids.help}
              onChange={(e) => setHeight(e.target.value)}
            />
            <span className="nut-field-unit" aria-hidden="true">
              cm
            </span>
          </label>
        </li>
        <li>
          <label className="list-row nut-field-row" htmlFor={ids.weight}>
            <span className="nut-field-label">Peso</span>
            <input
              id={ids.weight}
              className="nut-field-input"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={weight}
              placeholder="72,5"
              disabled={busy}
              aria-invalid={weightBad || undefined}
              aria-describedby={weightBad ? `${ids.wErr} ${ids.help}` : ids.help}
              onChange={(e) => setWeight(e.target.value)}
            />
            <span className="nut-field-unit" aria-hidden="true">
              kg
            </span>
          </label>
        </li>
      </ul>
      {heightBad ? (
        <p className="field-error nut-prof-error" id={ids.hErr}>
          Escribe la altura en centímetros, solo números (p. ej. 178).
        </p>
      ) : null}
      {weightBad ? (
        <p className="field-error nut-prof-error" id={ids.wErr}>
          Escribe el peso en kilos, solo números (p. ej. 72,5).
        </p>
      ) : null}
      <p className="list-group-footer" id={ids.help}>
        Altura entre 100 y 250 cm y peso entre 25 y 250 kg. Con estos datos se calculan los objetivos del día.
      </p>
      <div className="nut-prof-feedback" aria-live="polite">
        {msg ? <FormAlert msg={msg} id={ids.msg} /> : null}
      </div>
      <button type="submit" className="btn btn--lg btn--block" disabled={busy} aria-busy={busy || undefined}>
        {busy ? "Guardando…" : "Guardar perfil"}
      </button>
    </form>
  );
}

/* —— Sheet de Amanda (primitivo `.sheet*`) para el perfil y el import de Word —— */

/** Margen para desmontar si `animationend` no llega (animaciones desactivadas). */
const SHEET_CLOSE_FALLBACK_MS = 600;
const SHEET_FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

export function SheetCloseGlyph() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
      <path d="M2.5 2.5l9 9M11.5 2.5l-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

type SheetPhase = "closed" | "open" | "closing";

/**
 * Sheet controlado: `open` lo abre; al pasar a `false` sale por donde entró y luego llama a `onExited`
 * (ahí se limpia el estado, para que el contenido no cambie a mitad de la salida).
 * Móvil anclado abajo con asa; ≥720 centrado. X, Escape y toque en el fondo piden cerrar
 * (`onRequestClose`) salvo con `dismissible={false}` (p. ej. mientras se envía). Tab queda dentro;
 * al cerrar, el foco vuelve a quien lo abrió. `grouped` = fondo agrupado (listas blancas sobre lienzo).
 */
export function NutSheet({
  open,
  title,
  onRequestClose,
  onExited,
  dismissible = true,
  grouped,
  footer,
  children
}: {
  open: boolean;
  title: string;
  onRequestClose: () => void;
  onExited?: () => void;
  dismissible?: boolean;
  grouped?: boolean;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const [phase, setPhase] = useState<SheetPhase>(open ? "open" : "closed");
  const titleId = useId();
  const closeBtn = useRef<HTMLButtonElement>(null);
  const downOnScrim = useRef(false);
  const onExitedRef = useRef(onExited);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    onExitedRef.current = onExited;
  }, [onExited]);

  useEffect(() => {
    setPhase((p) => (open ? "open" : p === "open" ? "closing" : p));
  }, [open]);

  const finish = useCallback(() => {
    if (phaseRef.current !== "closing") return;
    phaseRef.current = "closed";
    setPhase("closed");
    onExitedRef.current?.();
  }, []);

  useEffect(() => {
    if (phase !== "closing") return;
    const t = window.setTimeout(finish, SHEET_CLOSE_FALLBACK_MS);
    return () => window.clearTimeout(t);
  }, [phase, finish]);

  const visible = phase !== "closed";

  useEffect(() => {
    if (!visible) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeBtn.current?.focus({ preventScroll: true });
    document.body.classList.add("nut-modal-open");
    return () => {
      document.body.classList.remove("nut-modal-open");
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [visible]);

  useEffect(() => {
    if (phase !== "open" || !dismissible) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      // En `document`: no llega a los listeners de `window` que pueda haber debajo (drawer).
      e.stopPropagation();
      onRequestClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [phase, dismissible, onRequestClose]);

  function trapFocus(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab") return;
    const nodes = [...e.currentTarget.querySelectorAll<HTMLElement>(SHEET_FOCUSABLE)].filter((n) => n.getClientRects().length > 0);
    if (!nodes.length) return;
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

  if (!visible || typeof document === "undefined") return null;
  const closing = phase === "closing";

  return createPortal(
    <div
      className={`sheet-scrim nut-sheet-scrim${closing ? " is-closing" : ""}`}
      onPointerDown={(e) => {
        downOnScrim.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && downOnScrim.current && !closing && dismissible) onRequestClose();
        downOnScrim.current = false;
      }}
      onAnimationEnd={(e) => {
        if (closing && e.target === e.currentTarget) finish();
      }}
    >
      <div
        className={`sheet sheet--opaque nut-sheet${grouped ? " nut-sheet--grouped" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={trapFocus}
      >
        <div className="sheet-grabber" aria-hidden="true" />
        <div className="sheet-header">
          <h2 id={titleId} className="sheet-title">
            {title}
          </h2>
          <button
            ref={closeBtn}
            type="button"
            className="icon-btn sheet-close"
            aria-label="Cerrar"
            disabled={!dismissible}
            onClick={() => {
              if (!closing) onRequestClose();
            }}
          >
            <SheetCloseGlyph />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer ? <div className="sheet-footer">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}

/** Botón «Perfil» + sheet con la ficha física (lo reutiliza el admin en `/a/[id]`, B4). */
export function AthleteProfileButton({ athleteId, onSaved }: { athleteId: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button type="button" className="btn secondary" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        Perfil
      </button>
      <NutSheet open={open} title="Perfil del deportista" onRequestClose={close} grouped>
        <AthleteProfileForm athleteId={athleteId} onSaved={onSaved} />
      </NutSheet>
    </>
  );
}
