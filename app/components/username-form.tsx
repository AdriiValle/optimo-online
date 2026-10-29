"use client";

import { useState } from "react";

type Props = {
  initialUsername: string;
  heading?: string;
  submitLabel?: string;
  /** PATCH /api/me/username (own account) */
  mode?: "self";
  /** PATCH /api/admin/accounts/:id/username */
  accountId?: string;
  onSaved?: (username: string) => void;
};

export function UsernameForm({
  initialUsername,
  heading = "Nombre de usuario (login)",
  submitLabel = "Guardar usuario",
  mode = "self",
  accountId,
  onSaved
}: Props) {
  const [username, setUsername] = useState(initialUsername);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const url =
      mode === "self" ? "/api/me/username" : `/api/admin/accounts/${accountId}/username`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim() })
    });
    if (res.status === 422) {
      const json = await res.json().catch(() => null);
      setMsg(json?.error?.message ?? "Usuario no válido.");
      return;
    }
    if (!res.ok) {
      setMsg("No se pudo guardar.");
      return;
    }
    const json = await res.json().catch(() => null);
    const saved = String(json?.data?.username ?? username.trim().toLowerCase());
    setUsername(saved);
    setMsg("Usuario de login actualizado.");
    onSaved?.(saved);
  }

  return (
    <>
      <h2>{heading}</h2>
      <p className="muted">Es lo que escribes al entrar, no el nombre de la ficha.</p>
      {msg ? <p className={msg.includes("actualizado") ? "ok" : "error"}>{msg}</p> : null}
      <form onSubmit={onSubmit}>
        <label htmlFor={`user-${accountId ?? "self"}`}>Usuario</label>
        <input
          id={`user-${accountId ?? "self"}`}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          maxLength={200}
        />
        <button className="btn secondary" type="submit">
          {submitLabel}
        </button>
      </form>
    </>
  );
}
