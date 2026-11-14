"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FormAlert, PasswordForm, type FormMsg } from "@/app/components/password-form";
import { UsernameForm } from "@/app/components/username-form";

type Props = {
  athleteId: string;
  initialName: string;
  email: string;
  hasPhoto: boolean;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

function photoError(code: unknown) {
  if (code === "PAYLOAD_TOO_LARGE") return "La foto pesa más de 400 KB. Prueba con una más pequeña.";
  return "Usa una imagen JPG, PNG o WebP.";
}

export function AjustesClient({ athleteId, initialName, email, hasPhoto }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const [loginUser, setLoginUser] = useState(email);
  const [nameMsg, setNameMsg] = useState<FormMsg | null>(null);
  const [namePending, setNamePending] = useState(false);
  const [photoMsg, setPhotoMsg] = useState<FormMsg | null>(null);
  const [photoPending, setPhotoPending] = useState(false);
  const [photoKey, setPhotoKey] = useState(0);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameMsg(null);
    setNamePending(true);
    try {
      const res = await fetch(`/api/athletes/${athleteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() })
      });
      if (!res.ok) {
        setNameMsg({ ok: false, text: "No se pudo guardar el nombre." });
        return;
      }
      setSavedName(name.trim());
      setNameMsg({ ok: true, text: "Nombre guardado." });
      router.refresh();
    } catch {
      setNameMsg({ ok: false, text: "No se pudo guardar el nombre. Revisa la conexión." });
    } finally {
      setNamePending(false);
    }
  }

  async function onPhoto(file: File) {
    setPhotoMsg(null);
    setPhotoPending(true);
    try {
      const fd = new FormData();
      fd.set("photo", file);
      const res = await fetch(`/api/athletes/${athleteId}/photo`, { method: "POST", body: fd });
      if (res.status === 422) {
        const json = await res.json().catch(() => null);
        setPhotoMsg({ ok: false, text: photoError(json?.error?.code) });
        return;
      }
      if (!res.ok) {
        setPhotoMsg({ ok: false, text: "No se pudo subir la foto." });
        return;
      }
      setPhotoKey((n) => n + 1);
      setPhotoMsg({ ok: true, text: "Foto actualizada." });
      router.refresh();
    } catch {
      setPhotoMsg({ ok: false, text: "No se pudo subir la foto. Revisa la conexión." });
    } finally {
      setPhotoPending(false);
    }
  }

  const showPhoto = hasPhoto || photoKey > 0;
  const nameInvalid = (nameMsg && !nameMsg.ok) || undefined;

  return (
    <div className="pset">
      <h1 className="pset-title">Ajustes</h1>

      <section className="pset-section" aria-labelledby="pset-profile">
        <h2 className="sr-only" id="pset-profile">
          Perfil
        </h2>
        <ul className="list-group">
          <li className="list-row pset-id">
            {showPhoto ? (
              <img className="avatar avatar--lg" src={`/api/athletes/${athleteId}/photo?v=${photoKey}`} alt="" />
            ) : (
              <span className="avatar avatar--lg" aria-hidden="true">
                {initials(savedName)}
              </span>
            )}
            <span className="list-row-main">
              <span className="pset-name">{savedName}</span>
              <span className="list-row-sub pset-login">
                <span className="sr-only">Usuario de acceso: </span>
                {loginUser}
              </span>
            </span>
          </li>
          <li>
            <button
              type="button"
              className="list-row pset-action"
              onClick={() => fileRef.current?.click()}
              disabled={photoPending}
              aria-busy={photoPending || undefined}
              aria-describedby="pset-photo-help"
            >
              {photoPending ? <span className="spinner" aria-hidden="true" /> : null}
              <span className="list-row-main">
                {photoPending ? "Subiendo foto…" : showPhoto ? "Cambiar foto" : "Añadir foto"}
              </span>
            </button>
          </li>
        </ul>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          tabIndex={-1}
          onChange={(ev) => {
            const file = ev.target.files?.[0];
            if (file) void onPhoto(file);
            ev.target.value = "";
          }}
        />
        <p className="list-group-footer" id="pset-photo-help">
          JPG, PNG o WebP, hasta 400 KB.
        </p>
        <div className="pset-feedback" aria-live="polite">
          {photoMsg ? <FormAlert msg={photoMsg} /> : null}
        </div>
      </section>

      <form className="pset-section" onSubmit={saveName} aria-labelledby="pset-name-heading">
        <h2 className="list-group-title" id="pset-name-heading">
          Nombre
        </h2>
        <ul className="list-group">
          <li>
            <label className="list-row pset-field" htmlFor="settings-name">
              <span className="pset-field-label">Nombre</span>
              <input
                id="settings-name"
                className="pset-input"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameMsg && !nameMsg.ok) setNameMsg(null);
                }}
                autoComplete="name"
                required
                maxLength={120}
                aria-invalid={nameInvalid}
                aria-describedby="pset-name-help"
              />
            </label>
          </li>
        </ul>
        <p className="list-group-footer" id="pset-name-help">
          Es el nombre que se ve en tu ficha.
        </p>
        <div className="pset-feedback" aria-live="polite">
          {nameMsg ? <FormAlert msg={nameMsg} /> : null}
        </div>
        <button
          className="btn btn--tinted btn--block"
          type="submit"
          disabled={namePending}
          aria-busy={namePending || undefined}
        >
          Guardar nombre
        </button>
      </form>

      <UsernameForm
        variant="grouped"
        heading="Usuario de acceso"
        initialUsername={email}
        onSaved={(u) => setLoginUser(u)}
      />

      <PasswordForm variant="grouped" />
    </div>
  );
}
