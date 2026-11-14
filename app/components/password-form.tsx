"use client";

import { useState } from "react";

export type FormMsg = { ok: boolean; text: string };

/** Alerta inline (design-system: tinte semántico + texto --label). Va dentro de una región aria-live. */
export function FormAlert({ msg, id }: { msg: FormMsg; id?: string }) {
  return (
    <p id={id} className={`alert ${msg.ok ? "alert--ok" : "alert--danger"}`}>
      <svg
        className="alert-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        {msg.ok ? <path d="M8 12.5l2.7 2.7L16 9.8" /> : <path d="M12 7.5v5.5M12 16.5v.01" />}
      </svg>
      <span>{msg.text}</span>
    </p>
  );
}

type Props = {
  heading?: string;
  submitLabel?: string;
  onSuccess?: () => void;
  /** "card": estructura clásica (admin y Amanda la estilan en su hoja). "grouped": lista agrupada de Ajustes (jugador). */
  variant?: "card" | "grouped";
};

export function PasswordForm({
  heading = "Contraseña",
  submitLabel = "Cambiar contraseña",
  onSuccess,
  variant = "card"
}: Props) {
  const [msg, setMsg] = useState<FormMsg | null>(null);
  const [pending, setPending] = useState(false);
  const [mismatch, setMismatch] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // currentTarget se anula al acabar el evento: guardarlo antes del await.
    const form = e.currentTarget;
    setMsg(null);
    const fd = new FormData(form);
    const currentPassword = String(fd.get("current") ?? "");
    const newPassword = String(fd.get("next") ?? "");
    const repeat = String(fd.get("repeat") ?? "");
    if (newPassword !== repeat) {
      setMismatch(true);
      setMsg({ ok: false, text: "La nueva contraseña no coincide." });
      return;
    }
    setMismatch(false);
    setPending(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (res.status === 422) {
        const json = await res.json().catch(() => null);
        const raw = json?.error?.message;
        setMsg({
          ok: false,
          text: raw && raw !== "Invalid password" ? raw : "Revisa las contraseñas (mínimo 8 caracteres)."
        });
        return;
      }
      if (!res.ok) {
        setMsg({ ok: false, text: "No se pudo cambiar." });
        return;
      }
      form.reset();
      setMsg({ ok: true, text: "Contraseña actualizada." });
      onSuccess?.();
    } catch {
      setMsg({ ok: false, text: "No se pudo cambiar. Revisa la conexión." });
    } finally {
      setPending(false);
    }
  }

  const repeatInvalid = mismatch || undefined;
  const clearMismatch = () => {
    if (mismatch) setMismatch(false);
  };

  if (variant === "grouped") {
    return (
      <form className="pset-section" onSubmit={onSubmit} aria-labelledby="pwd-heading">
        <h2 className="list-group-title" id="pwd-heading">
          {heading}
        </h2>
        <ul className="list-group">
          <li>
            <label className="list-row pset-field" htmlFor="pwd-current">
              <span className="pset-field-label">
                Actual<span className="sr-only"> contraseña</span>
              </span>
              <input
                id="pwd-current"
                className="pset-input"
                name="current"
                type="password"
                autoComplete="current-password"
                placeholder="Obligatoria"
                required
              />
            </label>
          </li>
          <li>
            <label className="list-row pset-field" htmlFor="pwd-next">
              <span className="pset-field-label">
                Nueva<span className="sr-only"> contraseña</span>
              </span>
              <input
                id="pwd-next"
                className="pset-input"
                name="next"
                type="password"
                autoComplete="new-password"
                placeholder="Mín. 8 caracteres"
                minLength={8}
                required
                aria-describedby="pwd-help"
                onChange={clearMismatch}
              />
            </label>
          </li>
          <li>
            <label className="list-row pset-field" htmlFor="pwd-repeat">
              <span className="pset-field-label">
                Repetir<span className="sr-only"> nueva contraseña</span>
              </span>
              <input
                id="pwd-repeat"
                className="pset-input"
                name="repeat"
                type="password"
                autoComplete="new-password"
                placeholder="Repite la nueva"
                minLength={8}
                required
                aria-invalid={repeatInvalid}
                aria-describedby={mismatch ? "pwd-msg" : undefined}
                onChange={clearMismatch}
              />
            </label>
          </li>
        </ul>
        <p className="list-group-footer" id="pwd-help">
          Mínimo 8 caracteres. Tendrás que usarla la próxima vez que entres.
        </p>
        <div className="pset-feedback" aria-live="polite">
          {msg ? <FormAlert msg={msg} id="pwd-msg" /> : null}
        </div>
        <button className="btn btn--tinted btn--block" type="submit" disabled={pending} aria-busy={pending || undefined}>
          {submitLabel}
        </button>
      </form>
    );
  }

  return (
    <>
      <h2>{heading}</h2>
      {msg ? (
        <p id="pwd-msg" className={msg.ok ? "ok" : "error"} role={msg.ok ? "status" : "alert"}>
          {msg.text}
        </p>
      ) : null}
      <form onSubmit={onSubmit}>
        <label htmlFor="pwd-current">Contraseña actual</label>
        <input id="pwd-current" name="current" type="password" autoComplete="current-password" required />
        <label htmlFor="pwd-next">Nueva contraseña (mín. 8)</label>
        <input
          id="pwd-next"
          name="next"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          onChange={clearMismatch}
        />
        <label htmlFor="pwd-repeat">Repetir nueva contraseña</label>
        <input
          id="pwd-repeat"
          name="repeat"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={repeatInvalid}
          aria-describedby={mismatch ? "pwd-msg" : undefined}
          onChange={clearMismatch}
        />
        <button className="btn" type="submit" disabled={pending} aria-busy={pending || undefined}>
          {submitLabel}
        </button>
      </form>
    </>
  );
}
