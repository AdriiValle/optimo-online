"use client";

import { useState } from "react";
import { FormAlert, type FormMsg } from "@/app/components/password-form";

type Props = {
  initialUsername: string;
  heading?: string;
  submitLabel?: string;
  /** PATCH /api/me/username (own account) */
  mode?: "self";
  /** PATCH /api/admin/accounts/:id/username */
  accountId?: string;
  onSaved?: (username: string) => void;
  /** "card": estructura clásica (admin y Amanda la estilan en su hoja). "grouped": lista agrupada de Ajustes (jugador). */
  variant?: "card" | "grouped";
};

export function UsernameForm({
  initialUsername,
  heading = "Nombre de usuario (login)",
  submitLabel = "Guardar usuario",
  mode = "self",
  accountId,
  onSaved,
  variant = "card"
}: Props) {
  const [username, setUsername] = useState(initialUsername);
  const [msg, setMsg] = useState<FormMsg | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setPending(true);
    try {
      const url =
        mode === "self" ? "/api/me/username" : `/api/admin/accounts/${accountId}/username`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() })
      });
      if (res.status === 422) {
        const json = await res.json().catch(() => null);
        setMsg({ ok: false, text: json?.error?.message ?? "Usuario no válido." });
        return;
      }
      if (!res.ok) {
        setMsg({ ok: false, text: "No se pudo guardar." });
        return;
      }
      const json = await res.json().catch(() => null);
      const saved = String(json?.data?.username ?? username.trim().toLowerCase());
      setUsername(saved);
      setMsg({ ok: true, text: "Usuario de login actualizado." });
      onSaved?.(saved);
    } catch {
      setMsg({ ok: false, text: "No se pudo guardar. Revisa la conexión." });
    } finally {
      setPending(false);
    }
  }

  const key = accountId ?? "self";
  const inputId = `user-${key}`;
  const msgId = `user-msg-${key}`;
  const invalid = (msg && !msg.ok) || undefined;

  const input = (className?: string) => (
    <input
      id={inputId}
      className={className}
      value={username}
      onChange={(e) => {
        setUsername(e.target.value);
        if (msg && !msg.ok) setMsg(null);
      }}
      autoComplete="username"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      required
      maxLength={200}
      aria-invalid={invalid}
      aria-describedby={variant === "grouped" ? `user-help-${key}${invalid ? ` ${msgId}` : ""}` : invalid ? msgId : undefined}
    />
  );

  if (variant === "grouped") {
    return (
      <form className="pset-section" onSubmit={onSubmit} aria-labelledby={`user-heading-${key}`}>
        <h2 className="list-group-title" id={`user-heading-${key}`}>
          {heading}
        </h2>
        <ul className="list-group">
          <li>
            <label className="list-row pset-field" htmlFor={inputId}>
              <span className="pset-field-label">Usuario</span>
              {input("pset-input")}
            </label>
          </li>
        </ul>
        <p className="list-group-footer" id={`user-help-${key}`}>
          Es lo que escribes al entrar, no el nombre de la ficha.
        </p>
        <div className="pset-feedback" aria-live="polite">
          {msg ? <FormAlert msg={msg} id={msgId} /> : null}
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
      <p className="muted">Es lo que escribes al entrar, no el nombre de la ficha.</p>
      {msg ? (
        <p id={msgId} className={msg.ok ? "ok" : "error"} role={msg.ok ? "status" : "alert"}>
          {msg.text}
        </p>
      ) : null}
      <form onSubmit={onSubmit}>
        <label htmlFor={inputId}>Usuario</label>
        {input()}
        <button className="btn secondary" type="submit" disabled={pending} aria-busy={pending || undefined}>
          {submitLabel}
        </button>
      </form>
    </>
  );
}
