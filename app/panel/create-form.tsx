"use client";

import { useState } from "react";

type Props = {
  onClose?: () => void;
  titleId?: string;
};

export function CreateAthleteForm({ onClose, titleId }: Props) {
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    const form = e.currentTarget;
    const body = {
      name: String(new FormData(form).get("name") ?? ""),
      sport: String(new FormData(form).get("sport") ?? "football"),
      email: String(new FormData(form).get("email") ?? ""),
      password: String(new FormData(form).get("password") ?? "")
    };
    const res = await fetch("/api/athletes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      setErr("No se pudo crear.");
      return;
    }
    form.reset();
    setMsg("Deportista creado.");
    window.location.reload();
  }

  return (
    <>
      <div className="create-form-head">
        <h2 id={titleId}>Alta de deportista</h2>
        {onClose ? (
          <button type="button" className="icon-btn" aria-label="Cerrar" onClick={onClose}>
            ×
          </button>
        ) : null}
      </div>
      {err ? <p className="error">{err}</p> : null}
      {msg ? <p className="ok">{msg}</p> : null}
      <form onSubmit={onSubmit}>
        <label htmlFor="name">Nombre</label>
        <input id="name" name="name" required />
        <label htmlFor="sport">Deporte</label>
        <select id="sport" name="sport" defaultValue="football">
          <option value="football">Fútbol</option>
          <option value="running">Running</option>
          <option value="other">Otro</option>
        </select>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
        <label htmlFor="password">Contraseña temporal</label>
        <input id="password" name="password" type="text" minLength={8} required />
        <button className="btn" type="submit">
          Crear
        </button>
      </form>
    </>
  );
}
