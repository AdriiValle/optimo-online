"use client";

import { useCallback, useEffect, useState } from "react";
import { PasswordForm } from "@/app/components/password-form";
import { UsernameForm } from "@/app/components/username-form";

type Row = {
  athleteId: string;
  accountId: string;
  email: string;
  name: string;
  hasPhoto: boolean;
};

type AdminInfo = { accountId: string; email: string };

export function AdminAjustesClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [rowMsg, setRowMsg] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoadErr(null);
    const res = await fetch("/api/admin/accounts");
    if (!res.ok) {
      setLoadErr("No se pudo cargar las cuentas.");
      return;
    }
    const json = await res.json();
    setRows(json.data ?? []);
    setAdmin(json.admin ?? null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function resetPassword(accountId: string, password: string) {
    const res = await fetch(`/api/admin/accounts/${accountId}/password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    return res.ok;
  }

  async function saveAthleteName(athleteId: string, name: string) {
    const res = await fetch(`/api/athletes/${athleteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() })
    });
    return res.ok;
  }

  async function onPhoto(athleteId: string, file: File) {
    const fd = new FormData();
    fd.set("photo", file);
    const res = await fetch(`/api/athletes/${athleteId}/photo`, { method: "POST", body: fd });
    return res.ok;
  }

  async function saveUsername(accountId: string, username: string) {
    const res = await fetch(`/api/admin/accounts/${accountId}/username`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim() })
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    return String(json?.data?.username ?? username.trim().toLowerCase());
  }

  return (
    <div className="stack settings-stack">
      {loadErr ? <p className="error">{loadErr}</p> : null}

      <section className="card">
        <h1>Ajustes</h1>
        <p className="muted">Gestión de accesos y tu cuenta de administrador.</p>
      </section>

      <section className="card">
        <h2>Tu cuenta</h2>
        {admin ? (
          <UsernameForm
            initialUsername={admin.email}
            onSaved={(u) => setAdmin((prev) => (prev ? { ...prev, email: u } : prev))}
          />
        ) : null}
        <PasswordForm heading="Tu contraseña" submitLabel="Cambiar mi contraseña" />
      </section>

      <section className="card">
        <h2>Deportistas</h2>
        <ul className="settings-account-list">
          {rows.map((row) => (
            <AthleteAccountRow
              key={row.accountId}
              row={row}
              msg={rowMsg[row.accountId]}
              onMsg={(m) => setRowMsg((prev) => ({ ...prev, [row.accountId]: m }))}
              onSaveName={saveAthleteName}
              onSaveUsername={saveUsername}
              onResetPassword={resetPassword}
              onPhoto={onPhoto}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function AthleteAccountRow({
  row,
  msg,
  onMsg,
  onSaveName,
  onSaveUsername,
  onResetPassword,
  onPhoto
}: {
  row: Row;
  msg?: string;
  onMsg: (m: string) => void;
  onSaveName: (athleteId: string, name: string) => Promise<boolean>;
  onSaveUsername: (accountId: string, username: string) => Promise<string | null>;
  onResetPassword: (accountId: string, password: string) => Promise<boolean>;
  onPhoto: (athleteId: string, file: File) => Promise<boolean>;
}) {
  const [name, setName] = useState(row.name);
  const [loginUser, setLoginUser] = useState(row.email);
  const [newPwd, setNewPwd] = useState("");
  const [photoKey, setPhotoKey] = useState(0);

  const photoSrc = row.hasPhoto || photoKey > 0 ? `/api/athletes/${row.athleteId}/photo?v=${photoKey}` : "/logo-optimo.png";

  return (
    <li className="settings-account-item card">
      <div className="settings-account-head">
        <img className="avatar" src={photoSrc} alt="" width={48} height={48} />
        <div>
          <strong>{loginUser}</strong>
          <div className="muted">{name}</div>
        </div>
      </div>
      {msg ? <p className={msg.includes("Guardado") || msg.includes("actualizada") ? "ok" : "error"}>{msg}</p> : null}
      <label htmlFor={`user-${row.accountId}`}>Nombre de usuario (login)</label>
      <input
        id={`user-${row.accountId}`}
        value={loginUser}
        onChange={(e) => setLoginUser(e.target.value)}
        autoComplete="username"
        maxLength={200}
      />
      <button
        type="button"
        className="btn secondary"
        onClick={async () => {
          onMsg("");
          const saved = await onSaveUsername(row.accountId, loginUser);
          if (saved) {
            setLoginUser(saved);
            onMsg("Usuario de login guardado.");
          } else onMsg("No se pudo guardar el usuario.");
        }}
      >
        Guardar usuario
      </button>
      <label htmlFor={`name-${row.accountId}`}>Nombre visible en la ficha</label>
      <input
        id={`name-${row.accountId}`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={120}
      />
      <button
        type="button"
        className="btn secondary"
        onClick={async () => {
          onMsg("");
          const ok = await onSaveName(row.athleteId, name.trim());
          onMsg(ok ? "Nombre guardado." : "No se pudo guardar.");
        }}
      >
        Guardar nombre
      </button>
      <label className="btn secondary">
        Cambiar foto
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={async (ev) => {
            const file = ev.target.files?.[0];
            ev.target.value = "";
            if (!file) return;
            onMsg("");
            const ok = await onPhoto(row.athleteId, file);
            if (ok) {
              setPhotoKey((n) => n + 1);
              onMsg("Foto actualizada.");
            } else onMsg("No se pudo subir la foto.");
          }}
        />
      </label>
      <label htmlFor={`pwd-${row.accountId}`}>Nueva contraseña (reset)</label>
      <input
        id={`pwd-${row.accountId}`}
        type="text"
        minLength={8}
        value={newPwd}
        onChange={(e) => setNewPwd(e.target.value)}
        placeholder="Mín. 8 caracteres"
      />
      <button
        type="button"
        className="btn"
        onClick={async () => {
          if (newPwd.length < 8) {
            onMsg("La contraseña debe tener al menos 8 caracteres.");
            return;
          }
          onMsg("");
          const ok = await onResetPassword(row.accountId, newPwd);
          if (ok) {
            setNewPwd("");
            onMsg("Contraseña actualizada.");
          } else onMsg("No se pudo resetear.");
        }}
      >
        Aplicar contraseña
      </button>
    </li>
  );
}
