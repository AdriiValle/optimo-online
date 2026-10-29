"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  athleteId: string;
  initialName: string;
  email: string;
  hasPhoto: boolean;
};

export function AjustesClient({ athleteId, initialName, email, hasPhoto }: Props) {
  const [name, setName] = useState(initialName);
  const [nameMsg, setNameMsg] = useState<string | null>(null);
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);
  const [photoKey, setPhotoKey] = useState(0);
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameMsg(null);
    const res = await fetch(`/api/athletes/${athleteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() })
    });
    if (!res.ok) {
      setNameMsg("No se pudo guardar el nombre.");
      return;
    }
    setNameMsg("Nombre guardado.");
  }

  async function onPhoto(file: File) {
    setPhotoMsg(null);
    const fd = new FormData();
    fd.set("photo", file);
    const res = await fetch(`/api/athletes/${athleteId}/photo`, { method: "POST", body: fd });
    if (res.status === 422) {
      const json = await res.json().catch(() => null);
      setPhotoMsg(json?.error?.message ?? "La foto no es válida.");
      return;
    }
    if (!res.ok) {
      setPhotoMsg("No se pudo subir.");
      return;
    }
    setPhotoKey((n) => n + 1);
    setPhotoMsg("Foto actualizada.");
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwdMsg(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/me/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: String(fd.get("current") ?? ""),
        newPassword: String(fd.get("next") ?? "")
      })
    });
    if (res.status === 422) {
      const json = await res.json().catch(() => null);
      setPwdMsg(json?.error?.message ?? "Revisa las contraseñas.");
      return;
    }
    if (!res.ok) {
      setPwdMsg("No se pudo cambiar.");
      return;
    }
    e.currentTarget.reset();
    setPwdMsg("Contraseña actualizada.");
  }

  const photoSrc = hasPhoto || photoKey > 0 ? `/api/athletes/${athleteId}/photo?v=${photoKey}` : "/logo-optimo.png";

  return (
    <div className="stack settings-stack">
      <p className="muted">
        <Link href={`/a/${athleteId}`}>← Volver al plan</Link>
      </p>
      <section className="card">
        <h1>Ajustes</h1>
        <p className="muted">Usuario: {email}</p>
      </section>

      <section className="card">
        <h2>Foto</h2>
        {photoMsg ? <p className={photoMsg.includes("actualizada") ? "ok" : "error"}>{photoMsg}</p> : null}
        <div className="photo-block">
          <img className="avatar" src={photoSrc} alt="" />
          <label className="btn secondary">
            Elegir foto
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(ev) => {
                const file = ev.target.files?.[0];
                if (file) void onPhoto(file);
                ev.target.value = "";
              }}
            />
          </label>
        </div>
      </section>

      <section className="card">
        <h2>Nombre</h2>
        {nameMsg ? <p className={nameMsg.includes("guardado") ? "ok" : "error"}>{nameMsg}</p> : null}
        <form onSubmit={saveName}>
          <label htmlFor="settings-name">Nombre en la ficha</label>
          <input
            id="settings-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={120}
          />
          <button className="btn" type="submit">
            Guardar nombre
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Contraseña</h2>
        {pwdMsg ? <p className={pwdMsg.includes("actualizada") ? "ok" : "error"}>{pwdMsg}</p> : null}
        <form onSubmit={changePassword}>
          <label htmlFor="pwd-current">Contraseña actual</label>
          <input id="pwd-current" name="current" type="password" autoComplete="current-password" required />
          <label htmlFor="pwd-next">Nueva contraseña (mín. 8)</label>
          <input id="pwd-next" name="next" type="password" autoComplete="new-password" minLength={8} required />
          <button className="btn" type="submit">
            Cambiar contraseña
          </button>
        </form>
      </section>
    </div>
  );
}
