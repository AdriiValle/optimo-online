"use client";

import { useState } from "react";

type Props = {
  heading?: string;
  submitLabel?: string;
  onSuccess?: () => void;
};

export function PasswordForm({
  heading = "Contraseña",
  submitLabel = "Cambiar contraseña",
  onSuccess
}: Props) {
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const currentPassword = String(fd.get("current") ?? "");
    const newPassword = String(fd.get("next") ?? "");
    const repeat = String(fd.get("repeat") ?? "");
    if (newPassword !== repeat) {
      setMsg("La nueva contraseña no coincide.");
      return;
    }

    const res = await fetch("/api/me/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    if (res.status === 422) {
      const json = await res.json().catch(() => null);
      setMsg(json?.error?.message ?? "Revisa las contraseñas.");
      return;
    }
    if (!res.ok) {
      setMsg("No se pudo cambiar.");
      return;
    }
    e.currentTarget.reset();
    setMsg("Contraseña actualizada.");
    onSuccess?.();
  }

  return (
    <>
      <h2>{heading}</h2>
      {msg ? <p className={msg.includes("actualizada") ? "ok" : "error"}>{msg}</p> : null}
      <form onSubmit={onSubmit}>
        <label htmlFor="pwd-current">Contraseña actual</label>
        <input id="pwd-current" name="current" type="password" autoComplete="current-password" required />
        <label htmlFor="pwd-next">Nueva contraseña (mín. 8)</label>
        <input id="pwd-next" name="next" type="password" autoComplete="new-password" minLength={8} required />
        <label htmlFor="pwd-repeat">Repetir nueva contraseña</label>
        <input id="pwd-repeat" name="repeat" type="password" autoComplete="new-password" minLength={8} required />
        <button className="btn" type="submit">
          {submitLabel}
        </button>
      </form>
    </>
  );
}
