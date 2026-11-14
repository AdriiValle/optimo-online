"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
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

/** ok: true verde, false rojo, sin definir neutro (aviso). */
type Msg = { text: string; ok?: boolean };

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "·";
}

function Chevron() {
  return <span className="adm-set-chevron" aria-hidden="true" />;
}

function StatusLine({ msg }: { msg: Msg | null | undefined }) {
  return (
    <p className={`adm-set-msg${msg?.ok === true ? " ok" : msg?.ok === false ? " error" : ""}`} role="status">
      {msg?.text ?? ""}
    </p>
  );
}

function SkeletonRows({ n }: { n: number }) {
  return (
    <ul className="adm-set-list" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <li key={i} className="adm-set-skel">
          <span className="skeleton skeleton--circle adm-set-skel-avatar" />
          <span className="adm-set-skel-lines">
            <span className="skeleton skeleton--line" />
            <span className="skeleton skeleton--line" />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function AdminAjustesClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadErr(null);
    const res = await fetch("/api/admin/accounts");
    if (!res.ok) {
      setLoadErr("No se pudo cargar las cuentas.");
      setLoaded(true);
      return;
    }
    const json = await res.json();
    setRows(json.data ?? []);
    setAdmin(json.admin ?? null);
    setLoaded(true);
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
    <div className="adm-set">
      <div className="adm-titlebar">
        <div className="adm-titles">
          <h1 className="adm-title">Ajustes</h1>
          <p className="adm-count">Cuentas, accesos y contraseñas.</p>
        </div>
      </div>

      {loadErr ? (
        <div className="alert alert--danger" role="alert">
          <p>{loadErr}</p>
        </div>
      ) : null}

      <section className="adm-set-section" aria-labelledby="adm-set-me">
        <div className="adm-set-head">
          <h2 id="adm-set-me" className="adm-set-title">
            Tu cuenta
          </h2>
          <p className="adm-set-desc">Tu acceso de administrador.</p>
        </div>
        <div className="adm-set-cols">
          <div className="card adm-set-card">
            {admin ? (
              <UsernameForm
                heading="Usuario de acceso"
                initialUsername={admin.email}
                onSaved={(u) => setAdmin((prev) => (prev ? { ...prev, email: u } : prev))}
              />
            ) : (
              <div aria-hidden="true">
                <span className="skeleton skeleton--title" />
                <span className="skeleton skeleton--line" />
                <span className="skeleton skeleton--line" />
              </div>
            )}
          </div>
          <div className="card adm-set-card">
            <PasswordForm heading="Contraseña" submitLabel="Cambiar mi contraseña" />
          </div>
        </div>
      </section>

      <section className="adm-set-section" aria-labelledby="adm-set-athletes">
        <div className="adm-set-head">
          <h2 id="adm-set-athletes" className="adm-set-title">
            Deportistas
          </h2>
          <p className="adm-set-desc">Usuario de acceso, nombre en la ficha, foto y contraseña de cada cuenta.</p>
        </div>
        <div className="adm-set-group">
          <div className="adm-set-thead" aria-hidden="true">
            <span className="adm-set-col-who">Deportista</span>
            <span className="adm-set-col-login">Usuario de acceso</span>
          </div>
          {!loaded ? (
            <SkeletonRows n={3} />
          ) : rows.length === 0 ? (
            <div className="state adm-set-empty">
              <h3 className="state-title">Sin deportistas</h3>
              <p className="state-text">Cuando des de alta a un deportista en el panel, su cuenta aparecerá aquí.</p>
            </div>
          ) : (
            <ul className="adm-set-list">
              {rows.map((row) => (
                <AthleteAccountRow
                  key={row.accountId}
                  row={row}
                  onSaveName={saveAthleteName}
                  onSaveUsername={saveUsername}
                  onResetPassword={resetPassword}
                  onPhoto={onPhoto}
                />
              ))}
            </ul>
          )}
        </div>
      </section>

      <NutritionistsSection athletes={rows} athletesLoaded={loaded} />
    </div>
  );
}

type Nutritionist = { accountId: string; email: string; athleteIds: string[] };

function NutritionistsSection({ athletes, athletesLoaded }: { athletes: Row[]; athletesLoaded: boolean }) {
  const [list, setList] = useState<Nutritionist[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [createMsg, setCreateMsg] = useState<Msg | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoadErr(null);
    const res = await fetch("/api/admin/nutritionists");
    if (!res.ok) {
      setLoadErr("No se pudo cargar las nutricionistas.");
      setLoaded(true);
      return;
    }
    const json = await res.json();
    setList(json.data ?? []);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    setCreateMsg(null);
    if (!username.trim() || password.length < 8) {
      setCreateMsg({ text: "Usuario obligatorio y contraseña de al menos 8 caracteres.", ok: false });
      return;
    }
    setCreating(true);
    const res = await fetch("/api/admin/nutritionists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password })
    });
    setCreating(false);
    if (res.status === 409) {
      setCreateMsg({ text: "Ese usuario ya existe.", ok: false });
      return;
    }
    if (!res.ok) {
      setCreateMsg({ text: "No se pudo crear la cuenta.", ok: false });
      return;
    }
    const json = await res.json();
    setList((prev) => [...prev, json.data].sort((a, b) => a.email.localeCompare(b.email)));
    setUsername("");
    setPassword("");
    setCreateMsg({ text: "Cuenta creada.", ok: true });
  }

  return (
    <section className="adm-set-section" aria-labelledby="adm-set-nut">
      <div className="adm-set-head">
        <h2 id="adm-set-nut" className="adm-set-title">
          Nutricionistas
        </h2>
        <p className="adm-set-desc">Cada nutricionista solo ve a los deportistas que actives.</p>
      </div>
      {loadErr ? (
        <div className="alert alert--danger" role="alert">
          <p>{loadErr}</p>
        </div>
      ) : null}
      <div className="adm-set-cols adm-set-cols--aside">
        <div className="adm-set-nut-list">
          {!loaded ? (
            <div className="adm-set-group">
              <SkeletonRows n={1} />
            </div>
          ) : list.length === 0 ? (
            <div className="state adm-set-empty">
              <h3 className="state-title">Sin nutricionistas</h3>
              <p className="state-text">Crea una cuenta para que pueda gestionar menús de los deportistas que le asignes.</p>
            </div>
          ) : (
            list.map((n) => (
              <NutritionistRow key={n.accountId} nutritionist={n} athletes={athletes} athletesLoaded={athletesLoaded} />
            ))
          )}
        </div>

        <form className="card adm-set-card adm-set-new" onSubmit={(e) => void create(e)} noValidate>
          <h3 className="adm-set-card-title">Nueva nutricionista</h3>
          <div className="field">
            <label htmlFor="nut-new-user">Nombre de usuario (login)</label>
            <input
              id="nut-new-user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={200}
            />
          </div>
          <div className="field">
            <label htmlFor="nut-new-pwd">Contraseña</label>
            <input
              id="nut-new-pwd"
              type="text"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mín. 8 caracteres"
            />
          </div>
          <StatusLine msg={createMsg} />
          <button type="submit" className="btn btn--tinted" aria-busy={creating || undefined} disabled={creating}>
            Crear nutricionista
          </button>
        </form>
      </div>
    </section>
  );
}

function NutritionistRow({
  nutritionist,
  athletes,
  athletesLoaded
}: {
  nutritionist: Nutritionist;
  athletes: Row[];
  athletesLoaded: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(nutritionist.athleteIds);
  const [saved, setSaved] = useState<string[]>(nutritionist.athleteIds);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [busy, setBusy] = useState(false);
  const headingId = useId();

  const visible = athletes.filter((a) => selected.includes(a.athleteId)).length;
  const dirty = selected.length !== saved.length || selected.some((id) => !saved.includes(id));

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/nutritionists/${nutritionist.accountId}/athletes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athleteIds: selected })
    });
    setBusy(false);
    if (res.ok) setSaved(selected);
    setMsg(res.ok ? { text: "Asignaciones guardadas.", ok: true } : { text: "No se pudo guardar.", ok: false });
  }

  return (
    <article className="adm-set-group adm-set-nut" aria-labelledby={headingId}>
      <div className="adm-set-nut-head">
        <span className="avatar adm-set-avatar" aria-hidden="true">
          {initials(nutritionist.email)}
        </span>
        <span className="adm-set-who">
          <span id={headingId} className="adm-set-name">
            {nutritionist.email}
          </span>
          <span className="adm-set-sub">
            {athletesLoaded
              ? `Ve ${visible} de ${athletes.length} ${athletes.length === 1 ? "deportista" : "deportistas"}`
              : "Nutricionista"}
          </span>
        </span>
      </div>
      <fieldset className="nut-assign">
        <legend className="sr-only">Deportistas que ve {nutritionist.email}</legend>
        {athletes.map((a) => (
          <label key={a.athleteId} className="nut-assign-item">
            <span className="nut-assign-name">{a.name}</span>
            <input
              type="checkbox"
              role="switch"
              className="toggle"
              checked={selected.includes(a.athleteId)}
              onChange={(e) =>
                setSelected((prev) =>
                  e.target.checked ? [...prev, a.athleteId] : prev.filter((id) => id !== a.athleteId)
                )
              }
            />
          </label>
        ))}
      </fieldset>
      <div className="adm-set-nut-foot">
        <StatusLine msg={dirty ? { text: "Cambios sin guardar." } : msg} />
        <button
          type="button"
          className="btn btn--tinted"
          aria-busy={busy || undefined}
          disabled={busy}
          onClick={() => void save()}
        >
          Guardar asignaciones
        </button>
      </div>
    </article>
  );
}

function AthleteAccountRow({
  row,
  onSaveName,
  onSaveUsername,
  onResetPassword,
  onPhoto
}: {
  row: Row;
  onSaveName: (athleteId: string, name: string) => Promise<boolean>;
  onSaveUsername: (accountId: string, username: string) => Promise<string | null>;
  onResetPassword: (accountId: string, password: string) => Promise<boolean>;
  onPhoto: (athleteId: string, file: File) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(row.name);
  const [shownName, setShownName] = useState(row.name);
  const [loginUser, setLoginUser] = useState(row.email);
  const [shownLogin, setShownLogin] = useState(row.email);
  const [newPwd, setNewPwd] = useState("");
  const [photoKey, setPhotoKey] = useState(0);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [busy, setBusy] = useState<"user" | "name" | "photo" | "pwd" | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const panelId = useId();
  const uid = row.accountId;

  const hasPhoto = row.hasPhoto || photoKey > 0;
  const photoSrc = `/api/athletes/${row.athleteId}/photo?v=${photoKey}`;

  async function submitUser(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy("user");
    const saved = await onSaveUsername(row.accountId, loginUser);
    setBusy(null);
    if (saved) {
      setLoginUser(saved);
      setShownLogin(saved);
      setMsg({ text: "Usuario de login guardado.", ok: true });
    } else setMsg({ text: "No se pudo guardar el usuario.", ok: false });
  }

  async function submitName(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy("name");
    const ok = await onSaveName(row.athleteId, name.trim());
    setBusy(null);
    if (ok) setShownName(name.trim());
    setMsg(ok ? { text: "Nombre guardado.", ok: true } : { text: "No se pudo guardar.", ok: false });
  }

  async function submitPwd(e: FormEvent) {
    e.preventDefault();
    if (newPwd.length < 8) {
      setMsg({ text: "La contraseña debe tener al menos 8 caracteres.", ok: false });
      return;
    }
    setMsg(null);
    setBusy("pwd");
    const ok = await onResetPassword(row.accountId, newPwd);
    setBusy(null);
    if (ok) {
      setNewPwd("");
      setMsg({ text: "Contraseña actualizada.", ok: true });
    } else setMsg({ text: "No se pudo resetear.", ok: false });
  }

  return (
    <li className={open ? "adm-set-item is-open" : "adm-set-item"}>
      <button
        type="button"
        className="adm-set-row"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {hasPhoto ? (
          <img className="avatar adm-set-avatar" src={photoSrc} alt="" width={40} height={40} />
        ) : (
          <span className="avatar adm-set-avatar" aria-hidden="true">
            {initials(shownName)}
          </span>
        )}
        <span className="adm-set-who">
          <span className="adm-set-name">{shownName}</span>
          <span className="adm-set-sub adm-set-sub--login">
            <span className="sr-only">Usuario de acceso: </span>
            {shownLogin}
          </span>
        </span>
        <span className="adm-set-login" aria-hidden="true">
          {shownLogin}
        </span>
        <span className="adm-set-action">
          <span className="adm-set-action-label">{open ? "Cerrar" : "Editar"}</span>
          <Chevron />
        </span>
      </button>

      <div id={panelId} className="adm-set-panel" hidden={!open}>
        <div className="adm-set-photo">
          {hasPhoto ? (
            <img className="avatar avatar--lg" src={photoSrc} alt={`Foto de ${shownName}`} width={72} height={72} />
          ) : (
            <span className="avatar avatar--lg" aria-hidden="true">
              {initials(shownName)}
            </span>
          )}
          <button
            type="button"
            className="btn secondary adm-set-photo-btn"
            aria-busy={busy === "photo" || undefined}
            disabled={busy === "photo"}
            onClick={() => fileRef.current?.click()}
          >
            Cambiar foto
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            tabIndex={-1}
            onChange={async (ev) => {
              const file = ev.target.files?.[0];
              ev.target.value = "";
              if (!file) return;
              setMsg(null);
              setBusy("photo");
              const ok = await onPhoto(row.athleteId, file);
              setBusy(null);
              if (ok) {
                setPhotoKey((n) => n + 1);
                setMsg({ text: "Foto actualizada.", ok: true });
              } else setMsg({ text: "No se pudo subir la foto.", ok: false });
            }}
          />
        </div>

        <div className="adm-set-fields">
          <form className="adm-set-inline" onSubmit={(e) => void submitUser(e)}>
            <label htmlFor={`user-${uid}`}>Nombre de usuario (login)</label>
            <div className="adm-set-inline-row">
              <input
                id={`user-${uid}`}
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={200}
              />
              <button
                type="submit"
                className="btn secondary"
                aria-busy={busy === "user" || undefined}
                disabled={busy === "user"}
              >
                Guardar usuario
              </button>
            </div>
          </form>

          <form className="adm-set-inline" onSubmit={(e) => void submitName(e)}>
            <label htmlFor={`name-${uid}`}>Nombre visible en la ficha</label>
            <div className="adm-set-inline-row">
              <input id={`name-${uid}`} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
              <button
                type="submit"
                className="btn secondary"
                aria-busy={busy === "name" || undefined}
                disabled={busy === "name"}
              >
                Guardar nombre
              </button>
            </div>
          </form>

          <form className="adm-set-inline" onSubmit={(e) => void submitPwd(e)} noValidate>
            <label htmlFor={`pwd-${uid}`}>Nueva contraseña (reset)</label>
            <div className="adm-set-inline-row">
              <input
                id={`pwd-${uid}`}
                type="text"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                minLength={8}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="Mín. 8 caracteres"
              />
              <button
                type="submit"
                className="btn btn--tinted"
                aria-busy={busy === "pwd" || undefined}
                disabled={busy === "pwd"}
              >
                Aplicar contraseña
              </button>
            </div>
          </form>

          <StatusLine msg={msg} />
        </div>
      </div>
    </li>
  );
}
