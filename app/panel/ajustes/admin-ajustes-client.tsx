"use client";

import { useCallback, useEffect, useState } from "react";

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
  const [adminPwdMsg, setAdminPwdMsg] = useState<string | null>(null);
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

  async function saveAdminPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAdminPwdMsg(null);
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
      setAdminPwdMsg(json?.error?.message ?? "Revisa las contraseñas.");
      return;
    }
    if (!res.ok) {
      setAdminPwdMsg("No se pudo cambiar.");
      return;
    }
    e.currentTarget.reset();
    setAdminPwdMsg("Tu contraseña se actualizó.");
  }

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

  return (
    <div className="stack settings-stack">
      {loadErr ? <p className="error">{loadErr}</p> : null}

      <section className="card">
        <h1>Ajustes</h1>
        <p className="muted">Gestión de accesos y tu cuenta de administrador.</p>
      </section>

      <section className="card">
        <h2>Tu contraseña</h2>
        {admin ? <p className="muted">Usuario: {admin.email}</p> : null}
        {adminPwdMsg ? (
          <p className={adminPwdMsg.includes("actualizó") ? "ok" : "error"}>{adminPwdMsg}</p>
        ) : null}
        <form onSubmit={saveAdminPassword}>
          <label htmlFor="admin-pwd-current">Contraseña actual</label>
          <input id="admin-pwd-current" name="current" type="password" autoComplete="current-password" required />
          <label htmlFor="admin-pwd-next">Nueva contraseña</label>
          <input id="admin-pwd-next" name="next" type="password" autoComplete="new-password" minLength={8} required />
          <button className="btn" type="submit">
            Cambiar mi contraseña
          </button>
        </form>
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
  onResetPassword,
  onPhoto
}: {
  row: Row;
  msg?: string;
  onMsg: (m: string) => void;
  onSaveName: (athleteId: string, name: string) => Promise<boolean>;
  onResetPassword: (accountId: string, password: string) => Promise<boolean>;
  onPhoto: (athleteId: string, file: File) => Promise<boolean>;
}) {
  const [name, setName] = useState(row.name);
  const [newPwd, setNewPwd] = useState("");
  const [photoKey, setPhotoKey] = useState(0);

  const photoSrc = row.hasPhoto || photoKey > 0 ? `/api/athletes/${row.athleteId}/photo?v=${photoKey}` : "/logo-optimo.png";

  return (
    <li className="settings-account-item card">
      <div className="settings-account-head">
        <img className="avatar" src={photoSrc} alt="" width={48} height={48} />
        <div>
          <strong>{row.email}</strong>
          <div className="muted">{row.name}</div>
        </div>
      </div>
      {msg ? <p className={msg.includes("Guardado") || msg.includes("actualizada") ? "ok" : "error"}>{msg}</p> : null}
      <label htmlFor={`name-${row.accountId}`}>Nombre</label>
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
