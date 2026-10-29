"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PasswordForm } from "@/app/components/password-form";

type Props = {
  athleteId: string;
  initialName: string;
  email: string;
  hasPhoto: boolean;
};

export function AjustesClient({ athleteId, initialName, email, hasPhoto }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [nameMsg, setNameMsg] = useState<string | null>(null);
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);
  const [photoKey, setPhotoKey] = useState(0);

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
    router.refresh();
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
    router.refresh();
  }

  const photoSrc = hasPhoto || photoKey > 0 ? `/api/athletes/${athleteId}/photo?v=${photoKey}` : "/logo-optimo.png";

  return (
    <div className="stack settings-stack">
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
        <PasswordForm />
      </section>
    </div>
  );
}
