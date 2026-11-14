"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { startOfWeekMonday, todayKey } from "@/lib/dates";
import { FormAlert } from "@/app/components/password-form";
import { NutSheet } from "./athlete-profile-form";

type Props = {
  athleteId: string;
  onImported: () => void;
};

/** Tiempo que se ve el resultado antes de cerrar solo (se puede cerrar antes con «Listo»). */
const RESULT_AUTO_CLOSE_MS = 1800;

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

function DocGlyph() {
  return (
    <svg className="nut-import-doc" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2.75h8.5L19.25 7.5V20a1.25 1.25 0 0 1-1.25 1.25H6A1.25 1.25 0 0 1 4.75 20V4A1.25 1.25 0 0 1 6 2.75Z" />
      <path d="M14.25 2.75V7.75h5" />
      <path d="M8 12.5h8M8 16h5.5" strokeLinecap="round" />
    </svg>
  );
}

function StateGlyph({ ok }: { ok: boolean }) {
  return (
    <svg className="state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9.25" />
      {ok ? <path d="M7.75 12.5l2.9 2.9 5.6-6" /> : <path d="M12 7.25v6M12 16.75v.01" />}
    </svg>
  );
}

/**
 * «Importar menú Word»: elegir .docx → sheet con opciones (lunes de inicio, ingredientes en borrador)
 * → importar → resultado (se cierra solo). Un archivo que no es .docx abre el sheet en estado de error.
 */
export function MenuWordImportButton({ athleteId, onImported }: Props) {
  const uid = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const autoClose = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [weekStart, setWeekStart] = useState(startOfWeekMonday(todayKey()));
  const [withItems, setWithItems] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const clearAutoClose = useCallback(() => {
    if (autoClose.current) window.clearTimeout(autoClose.current);
    autoClose.current = null;
  }, []);

  const close = useCallback(() => setOpen(false), []);

  /** Tras la salida del sheet: estado limpio para el próximo import. */
  const reset = useCallback(() => {
    clearAutoClose();
    setFile(null);
    setBusy(false);
    setMsg(null);
    setErr(null);
    setWeekStart(startOfWeekMonday(todayKey()));
    if (inputRef.current) inputRef.current.value = "";
  }, [clearAutoClose]);

  useEffect(() => clearAutoClose, [clearAutoClose]);

  function onPick(f: File | null) {
    setMsg(null);
    setErr(null);
    if (!f) return;
    const lower = f.name.toLowerCase();
    // El sheet se abre también con error: si no, un PDF elegido no daba ninguna señal.
    if (lower.endsWith(".pdf") || f.type === "application/pdf") {
      setFile(null);
      setErr("Solo Word (.docx) en esta versión. Exporta el menú como .docx, no PDF.");
    } else if (!lower.endsWith(".docx")) {
      setFile(null);
      setErr("Sube un archivo .docx (Word).");
    } else {
      setFile(f);
    }
    setOpen(true);
  }

  async function submit() {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    setErr(null);
    const fd = new FormData();
    fd.set("athleteId", athleteId);
    fd.set("weekStart", weekStart);
    fd.set("file", file);
    if (withItems) fd.set("withItems", "1");
    const res = await fetch("/api/nutrition/menu-import", { method: "POST", body: fd }).catch(() => null);
    const json = res ? await res.json().catch(() => null) : null;
    setBusy(false);
    if (!res || !res.ok) {
      setErr(json?.error?.message ?? (res ? "No se pudo importar el menú." : "No se pudo importar. Revisa la conexión."));
      return;
    }
    const { weeksImported, slotsWritten, drafts } = json.data ?? {};
    const base =
      weeksImported === 1
        ? `Importada 1 semana (${slotsWritten} comidas/cenas).`
        : `Importadas ${weeksImported} semanas (${slotsWritten} comidas/cenas).`;
    setMsg(drafts ? `${base} Ingredientes en borrador: ${drafts.slotsDrafted} platos.` : base);
    onImported();
    clearAutoClose();
    autoClose.current = window.setTimeout(close, RESULT_AUTO_CLOSE_MS);
  }

  function pickAgain() {
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.click();
  }

  const done = msg != null;
  const ids = { week: `${uid}-week`, weekHelp: `${uid}-week-help`, items: `${uid}-items`, itemsHelp: `${uid}-items-help`, err: `${uid}-err` };

  let footer;
  if (done) {
    footer = (
      <button type="button" className="btn btn--lg" onClick={close}>
        Listo
      </button>
    );
  } else if (file) {
    footer = (
      <>
        <button type="button" className="btn btn--lg secondary" disabled={busy} onClick={close}>
          Cancelar
        </button>
        <button type="button" className="btn btn--lg" disabled={busy} aria-busy={busy || undefined} onClick={() => void submit()}>
          {busy ? "Importando…" : "Importar"}
        </button>
      </>
    );
  } else {
    footer = (
      <>
        <button type="button" className="btn btn--lg secondary" onClick={close}>
          Cancelar
        </button>
        <button type="button" className="btn btn--lg" onClick={pickAgain}>
          Elegir otro archivo
        </button>
      </>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        hidden
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        className="btn secondary nut-menu-import"
        aria-haspopup="dialog"
        onClick={() => inputRef.current?.click()}
      >
        Importar menú Word
      </button>

      <NutSheet
        open={open}
        title="Importar menú"
        onRequestClose={close}
        onExited={reset}
        dismissible={!busy}
        grouped
        footer={footer}
      >
        {done ? (
          <div className="state nut-import-state nut-import-state--ok" role="status">
            <StateGlyph ok />
            <p className="state-title">Menú importado</p>
            <p className="state-text">{msg}</p>
          </div>
        ) : file ? (
          <div className="nut-import" aria-busy={busy || undefined}>
            <h3 className="list-group-title">Archivo</h3>
            <ul className="list-group">
              <li>
                <div className="list-row nut-import-file">
                  <DocGlyph />
                  <span className="list-row-main">
                    <span className="nut-import-name">{file.name}</span>
                    <span className="list-row-sub">Word · {fileSize(file.size)}</span>
                  </span>
                  <button type="button" className="btn btn--plain nut-import-change" disabled={busy} onClick={pickAgain}>
                    Cambiar
                  </button>
                </div>
              </li>
            </ul>

            <h3 className="list-group-title">Semana de inicio</h3>
            <ul className="list-group">
              <li>
                <label className="list-row nut-field-row" htmlFor={ids.week}>
                  <span className="nut-field-label">Lunes</span>
                  <input
                    id={ids.week}
                    className="nut-field-input"
                    type="date"
                    value={weekStart}
                    disabled={busy}
                    aria-describedby={ids.weekHelp}
                    onChange={(e) => {
                      const iso = e.target.value;
                      if (iso) setWeekStart(startOfWeekMonday(iso));
                    }}
                  />
                </label>
              </li>
            </ul>
            <p className="list-group-footer" id={ids.weekHelp}>
              El documento no trae fechas: elige el lunes de la primera semana que quieres rellenar. Solo se actualizan
              comida y cena; desayuno y meriendas no se borran.
            </p>

            <h3 className="list-group-title">Macros</h3>
            <ul className="list-group">
              <li>
                <label className="list-row nut-import-toggle" htmlFor={ids.items}>
                  <span className="list-row-main">
                    Ingredientes en borrador
                    <span className="list-row-sub" id={ids.itemsHelp}>
                      Para calcular macros. No toca los confirmados.
                    </span>
                  </span>
                  <input
                    id={ids.items}
                    className="toggle"
                    type="checkbox"
                    role="switch"
                    checked={withItems}
                    disabled={busy}
                    aria-describedby={ids.itemsHelp}
                    onChange={(e) => setWithItems(e.target.checked)}
                  />
                </label>
              </li>
            </ul>

            <div className="nut-import-feedback" aria-live="polite">
              {err ? <FormAlert msg={{ ok: false, text: err }} id={ids.err} /> : null}
            </div>
          </div>
        ) : (
          <div className="state state--error nut-import-state" role="alert">
            <StateGlyph ok={false} />
            <p className="state-title">No se puede importar este archivo</p>
            <p className="state-text">{err ?? "Sube un archivo .docx (Word)."}</p>
          </div>
        )}
      </NutSheet>
    </>
  );
}
