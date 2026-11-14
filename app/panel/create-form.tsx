"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  onClose?: () => void;
  titleId?: string;
};

const SPORTS = [
  { value: "football", label: "Fútbol" },
  { value: "running", label: "Running" },
  { value: "other", label: "Otro" }
] as const;

export function CreateAthleteForm({ onClose, titleId }: Props) {
  const router = useRouter();
  const formId = useId();
  const sportLegendId = useId();
  const [err, setErr] = useState<string | null>(null);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setErr(null);
    setEmailErr(null);
    const data = new FormData(e.currentTarget);
    const body = {
      name: String(data.get("name") ?? "").trim(),
      sport: String(data.get("sport") ?? "football"),
      email: String(data.get("email") ?? "").trim(),
      password: String(data.get("password") ?? "")
    };
    setBusy(true);
    try {
      const res = await fetch("/api/athletes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.status === 409) {
        setEmailErr("Ya existe una cuenta con este email.");
        return;
      }
      if (!res.ok) {
        setErr(res.status === 422 ? "Revisa los datos: hay algún campo no válido." : "No se pudo crear. Inténtalo de nuevo.");
        return;
      }
      router.refresh();
      onClose?.();
    } catch {
      setErr("Sin conexión. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="sheet-grabber" aria-hidden="true" />
      <div className="sheet-header">
        <h2 id={titleId} className="sheet-title">
          Nuevo deportista
        </h2>
        {onClose ? (
          <button type="button" className="icon-btn sheet-close" aria-label="Cerrar" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}
      </div>

      <div className="sheet-body">
        {err ? (
          <p className="alert alert--danger adm-form-alert" role="alert">
            {err}
          </p>
        ) : null}
        <form id={formId} className="adm-form" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor={`${formId}-name`}>Nombre</label>
            <input
              id={`${formId}-name`}
              name="name"
              autoComplete="off"
              autoCapitalize="words"
              enterKeyHint="next"
              placeholder="Nombre y apellidos"
              maxLength={120}
              required
              autoFocus
            />
          </div>

          <fieldset className="field adm-fieldset">
            <legend id={sportLegendId}>Deporte</legend>
            <div className="segmented segmented--block" role="radiogroup" aria-labelledby={sportLegendId}>
              {SPORTS.map((s, i) => (
                <label key={s.value}>
                  <input type="radio" name="sport" value={s.value} defaultChecked={i === 0} />
                  {s.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="field">
            <label htmlFor={`${formId}-email`}>Email</label>
            <input
              id={`${formId}-email`}
              name="email"
              type="email"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="next"
              placeholder="nombre@club.es"
              maxLength={200}
              aria-invalid={emailErr ? true : undefined}
              aria-describedby={emailErr ? `${formId}-email-err` : undefined}
              onInput={() => setEmailErr(null)}
              required
            />
            {emailErr ? (
              <p id={`${formId}-email-err`} className="field-error" role="alert">
                {emailErr}
              </p>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor={`${formId}-password`}>Contraseña temporal</label>
            <input
              id={`${formId}-password`}
              name="password"
              type="text"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              minLength={8}
              maxLength={200}
              aria-describedby={`${formId}-password-help`}
              required
            />
            <p id={`${formId}-password-help`} className="field-help">
              Mínimo 8 caracteres. Pásasela al deportista para que entre.
            </p>
          </div>
        </form>
      </div>

      <div className="sheet-footer">
        {onClose ? (
          <button type="button" className="btn secondary" onClick={onClose}>
            Cancelar
          </button>
        ) : null}
        <button className="btn" type="submit" form={formId} aria-busy={busy || undefined}>
          Crear deportista
        </button>
      </div>
    </>
  );
}
