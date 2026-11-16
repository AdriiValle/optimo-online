"use client";

import { type FormEvent, useActionState, useEffect, useRef, useState } from "react";

export type LoginState = { error: boolean; email: string } | null;

type Props = {
  action: (prev: LoginState, formData: FormData) => Promise<LoginState>;
  /** Error que llega por URL (?error=…), p. ej. desde el flujo propio de Auth.js. */
  initialError: boolean;
};

type Missing = "email" | "password" | null;

const MSG_ID = "login-msg";

export function LoginForm({ action, initialError }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  const [missing, setMissing] = useState<Missing>(null);
  const [edited, setEdited] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const credError = (state ? state.error : initialError) && !edited && !pending;

  // Credenciales incorrectas: sacudida del grupo (como macOS) y foco en la contraseña.
  useEffect(() => {
    if (!state?.error) return;
    passwordRef.current?.focus();
    const g = groupRef.current;
    if (!g) return;
    g.classList.remove("is-shaking");
    void g.offsetWidth;
    g.classList.add("is-shaking");
  }, [state]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    if (pending) {
      e.preventDefault();
      return;
    }
    const email = emailRef.current?.value.trim() ?? "";
    const password = passwordRef.current?.value ?? "";
    const miss: Missing = !email ? "email" : !password ? "password" : null;
    setMissing(miss);
    if (miss) {
      e.preventDefault();
      (miss === "email" ? emailRef : passwordRef).current?.focus();
      return;
    }
    setEdited(false);
  }

  function onInput() {
    if (missing) setMissing(null);
    if (!edited) setEdited(true);
  }

  const emailInvalid = missing === "email" || credError;
  const passwordInvalid = missing === "password" || credError;

  return (
    <form className="login-form" action={formAction} onSubmit={onSubmit} onInput={onInput} noValidate>
      <div className="login-group" ref={groupRef} onAnimationEnd={(e) => e.currentTarget.classList.remove("is-shaking")}>
        <div className="login-field">
          <input
            ref={emailRef}
            id="email"
            name="email"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder=" "
            defaultValue={state?.email ?? ""}
            readOnly={pending}
            required
            aria-invalid={emailInvalid || undefined}
            aria-describedby={emailInvalid ? MSG_ID : undefined}
          />
          <label htmlFor="email">Usuario</label>
        </div>
        <div className="login-field">
          <input
            ref={passwordRef}
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder=" "
            readOnly={pending}
            required
            aria-invalid={passwordInvalid || undefined}
            aria-describedby={passwordInvalid ? MSG_ID : undefined}
          />
          <label htmlFor="password">Contraseña</label>
        </div>
      </div>

      <div id={MSG_ID} className="login-msg" aria-live="assertive">
        {missing ? (
          <p className="field-error">{missing === "email" ? "Escribe tu usuario." : "Escribe tu contraseña."}</p>
        ) : credError ? (
          <div className="alert alert--danger" role="alert">
            <svg className="alert-icon" viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="10" cy="10" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10 5.75v5.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              <circle cx="10" cy="14.25" r="1.1" fill="currentColor" />
            </svg>
            <p>
              <span className="alert-title">Usuario o contraseña incorrectos</span>
              Revísalos e inténtalo de nuevo.
            </p>
          </div>
        ) : null}
      </div>

      <button className="btn btn--lg btn--block login-submit" type="submit" aria-busy={pending || undefined}>
        Entrar
      </button>
      <span className="sr-only" role="status">
        {pending ? "Entrando…" : ""}
      </span>
    </form>
  );
}
