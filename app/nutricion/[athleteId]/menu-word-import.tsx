"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { startOfWeekMonday, todayKey } from "@/lib/dates";

type Props = {
  athleteId: string;
  onImported: () => void;
};

export function MenuWordImportButton({ athleteId, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [weekStart, setWeekStart] = useState(startOfWeekMonday(todayKey()));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const reset = useCallback(() => {
    setOpen(false);
    setFile(null);
    setBusy(false);
    setMsg(null);
    setErr(null);
    setWeekStart(startOfWeekMonday(todayKey()));
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) reset();
    }
    window.addEventListener("keydown", onKey);
    document.body.classList.add("nut-modal-open");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("nut-modal-open");
    };
  }, [open, busy, reset]);

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
    const res = await fetch("/api/nutrition/menu-import", { method: "POST", body: fd });
    const json = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      setErr(json?.error?.message ?? "No se pudo importar el menú.");
      return;
    }
    const { weeksImported, slotsWritten } = json.data ?? {};
    setMsg(
      weeksImported === 1
        ? `Importada 1 semana (${slotsWritten} comidas/cenas).`
        : `Importadas ${weeksImported} semanas (${slotsWritten} comidas/cenas).`
    );
    onImported();
    window.setTimeout(reset, 1800);
  }

  function pickAgain() {
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.click();
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
      <button type="button" className="btn secondary nut-menu-import" onClick={() => inputRef.current?.click()}>
        Importar menú Word
      </button>

      {open
        ? createPortal(
            <div className="nut-modal-root" role="presentation" onClick={() => (busy ? null : reset())}>
              <div
                className="nut-modal card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="nut-import-title"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="nut-modal-head">
                  <h2 id="nut-import-title">Importar menú</h2>
                  <button type="button" className="icon-btn" aria-label="Cerrar" disabled={busy} onClick={reset}>
                    ×
                  </button>
                </div>
                <div className="nut-modal-body nut-import">
                  {file ? (
                    <>
                      <p className="nut-import-file">{file.name}</p>
                      <p className="muted">
                        El documento no trae fechas: elige el <strong>lunes</strong> de la primera semana que quieres
                        rellenar.
                      </p>
                      <label>
                        Semana de inicio (lunes)
                        <input
                          type="date"
                          value={weekStart}
                          onChange={(e) => {
                            const iso = e.target.value;
                            if (iso) setWeekStart(startOfWeekMonday(iso));
                          }}
                        />
                      </label>
                      <p className="muted">Solo se actualizan comida y cena; desayuno y meriendas no se borran.</p>
                    </>
                  ) : null}
                  {err ? <p className="error">{err}</p> : null}
                  {msg ? <p className="ok">{msg}</p> : null}
                  <div className="nut-actions">
                    {file ? (
                      <button type="button" className="btn" disabled={busy || !!msg} onClick={() => void submit()}>
                        {busy ? "Importando…" : "Importar"}
                      </button>
                    ) : (
                      <button type="button" className="btn" onClick={pickAgain}>
                        Elegir otro archivo
                      </button>
                    )}
                    <button type="button" className="btn secondary" disabled={busy} onClick={reset}>
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
