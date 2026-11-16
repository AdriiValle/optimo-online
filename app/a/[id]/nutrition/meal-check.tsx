"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { MealCheck, MealCheckStatus } from "@/lib/types";
import { resizeImage } from "@/lib/image-resize";
import { PHOTO_MAX_BYTES, PHOTO_MIME } from "@/lib/constants";
import { saveMealCheckDetails, saveMealCheckStatus } from "./actions";

const NOTE_MAX = 280;

const OPTIONS: { key: MealCheckStatus; label: string }[] = [
  { key: "done", label: "Hecho" },
  { key: "half", label: "A medias" },
  { key: "missed", label: "No" }
];

function StatusGlyph({ status }: { status: MealCheckStatus }) {
  return (
    <svg className="nut-check-glyph" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {status === "done" ? <path d="M4.5 10.5l3.5 3.5 7.5-8" /> : null}
      {status === "half" ? (
        <>
          <circle cx="10" cy="10" r="6.5" />
          <path d="M10 3.5a6.5 6.5 0 0 1 0 13z" fill="currentColor" stroke="none" />
        </>
      ) : null}
      {status === "missed" ? <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" /> : null}
    </svg>
  );
}

export function checkPhotoUrl(athleteId: string, check: MealCheck) {
  return `/a/${athleteId}/nutrition/check-photo/${check.mealSlotId}?v=${encodeURIComponent(check.checkedAt)}`;
}

type Props = {
  athleteId: string;
  slotId: string;
  /** «Desayuno», «Comida»…: nombra el grupo para lectores de pantalla. */
  slotLabel: string;
  check: MealCheck | null;
  onChange: (check: MealCheck | null) => void;
  /** Pegada bajo la fila plegada de una franja pasada (va fuera del <details>). */
  attached?: boolean;
};

/**
 * Check de una franja en «Hoy»: Hecho / A medias / No en un toque, y después, si quiere,
 * un comentario corto y la foto del plato real. Sin rachas, puntos ni comparaciones.
 */
export function MealCheckBar({ athleteId, slotId, slotLabel, check, onChange, attached }: Props) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const editBtnRef = useRef<HTMLButtonElement>(null);
  const optsRef = useRef<HTMLDivElement>(null);
  const groupId = useId();
  const status = check?.status ?? null;

  async function choose(next: MealCheckStatus) {
    if (saving) return;
    // Volver a tocar la marcada la quita, salvo que lleve comentario o foto (eso se quita desde «Editar»).
    const target = next === status ? (check?.note || check?.hasPhoto ? next : null) : next;
    if (target === status) return;
    const prev = check;
    onChange(target ? { mealSlotId: slotId, status: target, note: prev?.note ?? null, hasPhoto: prev?.hasPhoto ?? false, checkedAt: prev?.checkedAt ?? "" } : null);
    setSaving(true);
    setMsg(null);
    const res = await saveMealCheckStatus(athleteId, slotId, target).catch(() => ({ ok: false as const }));
    setSaving(false);
    if (!res.ok) {
      onChange(prev);
      setMsg({ kind: "error", text: "No se pudo guardar. Inténtalo de nuevo." });
      return;
    }
    onChange(res.check);
    if (!res.check) setEditing(false);
  }

  function closeEditor(next?: MealCheck | null) {
    setEditing(false);
    if (next !== undefined) onChange(next);
    requestAnimationFrame(() => editBtnRef.current?.focus());
  }

  return (
    <div className={`nut-check${attached ? " nut-check--attached" : ""}`}>
      <div ref={optsRef} className="nut-check-opts" role="group" aria-labelledby={groupId}>
        <span id={groupId} className="sr-only">
          {slotLabel}: ¿cómo fue?
        </span>
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            className={`nut-check-opt nut-check-opt--${o.key}`}
            aria-pressed={status === o.key}
            aria-disabled={saving || undefined}
            onClick={() => void choose(o.key)}
          >
            <StatusGlyph status={o.key} />
            <span>{o.label}</span>
          </button>
        ))}
      </div>

      {check && !editing ? (
        <div className="nut-check-extra">
          {check.hasPhoto && check.checkedAt ? (
            <img className="nut-check-photo" src={checkPhotoUrl(athleteId, check)} alt={`Tu foto del plato: ${slotLabel.toLocaleLowerCase("es")}`} width={72} height={72} loading="lazy" decoding="async" />
          ) : null}
          {check.note ? <p className="nut-check-note">{check.note}</p> : null}
          <button ref={editBtnRef} type="button" className="btn btn--plain nut-check-edit" onClick={() => setEditing(true)}>
            {check.note || check.hasPhoto ? "Editar comentario o foto" : "Añadir comentario o foto"}
          </button>
        </div>
      ) : null}

      {check && editing ? (
        <CheckEditor
          athleteId={athleteId}
          check={check}
          slotLabel={slotLabel}
          onCancel={() => closeEditor()}
          onSaved={(c) => {
            closeEditor(c);
            setMsg({ kind: "ok", text: "Guardado." });
          }}
          onRemoved={() => {
            setEditing(false);
            onChange(null);
            setMsg({ kind: "ok", text: "Marca quitada." });
            requestAnimationFrame(() => optsRef.current?.querySelector("button")?.focus());
          }}
        />
      ) : null}

      <p className={msg?.kind === "error" ? "nut-check-msg error" : "sr-only"} role="status" aria-live="polite">
        {msg?.text ?? ""}
      </p>
    </div>
  );
}

type EditorProps = {
  athleteId: string;
  check: MealCheck;
  slotLabel: string;
  onCancel: () => void;
  onSaved: (check: MealCheck) => void;
  onRemoved: () => void;
};

function CheckEditor({ athleteId, check, slotLabel, onCancel, onSaved, onRemoved }: EditorProps) {
  const [note, setNote] = useState(check.note ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [busy, setBusy] = useState<"save" | "photo" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const noteId = useId();
  const errorId = useId();

  useEffect(() => {
    noteRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const savedPhoto = check.hasPhoto && !removePhoto && !file ? checkPhotoUrl(athleteId, check) : null;
  const shown = file ? preview : savedPhoto;

  async function pick(input: HTMLInputElement) {
    const picked = input.files?.[0];
    input.value = "";
    if (!picked) return;
    setError(null);
    setBusy("photo");
    let ready: File | null = null;
    try {
      ready = await resizeImage(picked);
    } catch {
      // El navegador no la pudo leer: vale tal cual si ya es pequeña y de un tipo admitido.
      if (picked.size <= PHOTO_MAX_BYTES && PHOTO_MIME.has(picked.type)) ready = picked;
    }
    setBusy(null);
    if (!ready || ready.size > PHOTO_MAX_BYTES) {
      setError("No se pudo usar esa foto. Prueba con otra.");
      return;
    }
    setFile(ready);
    setRemovePhoto(false);
  }

  async function save() {
    setBusy("save");
    setError(null);
    const form = new FormData();
    form.set("athleteId", athleteId);
    form.set("slotId", check.mealSlotId);
    form.set("note", note.trim());
    if (file) form.set("photo", file);
    else if (removePhoto) form.set("removePhoto", "1");
    const res = await saveMealCheckDetails(form).catch(() => ({ ok: false as const, error: "save" as const }));
    setBusy(null);
    if (!res.ok) {
      setError(res.error === "photo" ? "La foto no es válida. Prueba con otra." : "No se pudo guardar. Inténtalo de nuevo.");
      return;
    }
    onSaved(res.check);
  }

  async function remove() {
    setBusy("remove");
    setError(null);
    const res = await saveMealCheckStatus(athleteId, check.mealSlotId, null).catch(() => ({ ok: false as const }));
    setBusy(null);
    if (!res.ok) {
      setError("No se pudo quitar la marca. Inténtalo de nuevo.");
      return;
    }
    onRemoved();
  }

  const left = NOTE_MAX - note.length;

  return (
    <div
      className="nut-check-form"
      onKeyDown={(e) => {
        if (e.key === "Escape" && !busy) {
          e.stopPropagation();
          onCancel();
        }
      }}
    >
      <label className="nut-check-label" htmlFor={noteId}>
        Comentario <span className="nut-check-optional">(opcional)</span>
      </label>
      <textarea
        id={noteId}
        ref={noteRef}
        className="nut-check-textarea"
        rows={2}
        maxLength={NOTE_MAX}
        value={note}
        placeholder="Ej.: cambié el arroz por patata"
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => setNote(e.target.value)}
      />
      {left <= 40 ? (
        <span className="nut-check-left" aria-live="polite">
          Quedan {left} caracteres
        </span>
      ) : null}

      <div className="nut-check-photo-row">
        {shown ? <img className="nut-check-photo" src={shown} alt={`Foto del plato: ${slotLabel.toLocaleLowerCase("es")}`} width={72} height={72} decoding="async" /> : null}
        <div className="nut-check-photo-actions">
          <label className={`btn btn--gray nut-check-pick${busy ? " is-disabled" : ""}`} aria-busy={busy === "photo" || undefined}>
            {busy === "photo" ? "Preparando foto…" : shown ? "Cambiar foto" : "Añadir foto del plato"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={busy !== null}
              onChange={(e) => void pick(e.currentTarget)}
            />
          </label>
          {shown ? (
            <button
              type="button"
              className="btn btn--plain nut-check-unphoto"
              disabled={busy !== null}
              onClick={() => {
                setFile(null);
                setPreview(null);
                setRemovePhoto(check.hasPhoto);
              }}
            >
              Quitar foto
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p id={errorId} className="nut-check-msg error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="nut-check-actions">
        <button type="button" className="btn btn--tinted" disabled={busy !== null} aria-busy={busy === "save" || undefined} onClick={() => void save()}>
          {busy === "save" ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" className="btn btn--plain" disabled={busy !== null} onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className="btn btn--plain nut-check-remove" disabled={busy !== null} aria-busy={busy === "remove" || undefined} onClick={() => void remove()}>
          {busy === "remove" ? "Quitando…" : "Quitar marca"}
        </button>
      </div>
    </div>
  );
}
