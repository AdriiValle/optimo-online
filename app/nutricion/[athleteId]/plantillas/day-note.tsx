"use client";

import { useEffect, useId, useState, type FormEvent } from "react";

/** Nota de Amanda para un día: el jugador la ve en la tarjeta del día. Vacía la borra. */
export function DayNoteForm({ athleteId, date, compact }: { athleteId: string; date: string; compact?: boolean }) {
  const uid = useId();
  const [saved, setSaved] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setSaved(null);
    setText("");
    setMsg(null);
    fetch(`/api/nutrition/templates/day-notes?athleteId=${athleteId}&date=${date}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (ctrl.signal.aborted) return;
        const note = (j?.data?.note as string | undefined) ?? "";
        setSaved(note);
        setText(note);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setSaved("");
      });
    return () => ctrl.abort();
  }, [athleteId, date]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || saved === null) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/nutrition/templates/day-notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athleteId, date, note: text.trim() })
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return setMsg({ text: res ? "No se ha podido guardar." : "Sin conexión. Prueba otra vez.", ok: false });
    const note = ((await res.json()).data?.note as string | undefined) ?? "";
    setSaved(note);
    setText(note);
    setMsg({ text: note ? "Nota guardada. El jugador la verá en su día." : "Nota borrada.", ok: true });
  }

  const dirty = saved !== null && text.trim() !== saved;
  return (
    <form className={`nut-daynote-form${compact ? " nut-daynote-form--compact" : ""}`} onSubmit={submit} noValidate>
      <label htmlFor={`${uid}-n`} className="nut-daynote-form-label">
        Nota del día para el jugador
      </label>
      <textarea
        id={`${uid}-n`}
        rows={3}
        maxLength={2000}
        value={text}
        disabled={saved === null}
        placeholder={saved === null ? "Cargando…" : "Ej. Hoy bebe 500 ml más: entreno con calor."}
        onChange={(e) => {
          setText(e.target.value);
          setMsg(null);
        }}
      />
      <div className="nut-daynote-form-actions">
        {msg ? (
          <p className={`nut-ficha-msg ${msg.ok ? "ok" : "error"}`} role="status">
            {msg.text}
          </p>
        ) : (
          <span />
        )}
        <button type="submit" className="btn" disabled={busy || !dirty} aria-busy={busy || undefined}>
          {busy ? "Guardando…" : saved && !text.trim() ? "Borrar nota" : "Guardar nota"}
        </button>
      </div>
    </form>
  );
}
