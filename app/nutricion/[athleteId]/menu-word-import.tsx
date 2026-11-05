"use client";

import { useCallback, useRef, useState } from "react";
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

  function onPick(f: File | null) {
    setMsg(null);
    setErr(null);
    if (!f) return;
    const lower = f.name.toLowerCase();
    if (lower.endsWith(".pdf") || f.type === "application/pdf") {
      setErr("Solo Word (.docx) en esta versión. Exporta el menú como .docx, no PDF.");
      return;
    }
    if (!lower.endsWith(".docx")) {
      setErr("Sube un archivo .docx (Word).");
      return;
    }
    setFile(f);
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
        Subir menú Word (.docx)
      </button>

      {open && file ? (
        <div className="nut-import-dialog card" role="dialog" aria-labelledby="nut-import-title">
          <h3 id="nut-import-title">Importar menú</h3>
          <p className="muted">{file.name}</p>
          <p className="muted">
            El documento no trae fechas: elige el <strong>lunes</strong> de la primera semana que quieres rellenar.
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
          <div className="nut-actions">
            <button type="button" className="btn" disabled={busy} onClick={() => void submit()}>
              {busy ? "Importando…" : "Importar"}
            </button>
            <button type="button" className="btn secondary" disabled={busy} onClick={reset}>
              Cancelar
            </button>
          </div>
          {err ? <p className="error">{err}</p> : null}
          {msg ? <p className="ok">{msg}</p> : null}
        </div>
      ) : null}
    </>
  );
}
