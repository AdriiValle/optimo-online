"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Profile = { birthDate: string | null; heightCm: number | null; weightKg: number | null };

/** Edad en años cumplidos a partir de `YYYY-MM-DD`. */
export function ageFrom(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  if (!y || !m || !d) return null;
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
  return age >= 0 ? age : null;
}

function toNum(v: string): number | null | undefined {
  const t = v.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

/** Ficha física del deportista (nacimiento, altura, peso). La editan admins y la nutricionista asignada. */
export function AthleteProfileForm({ athleteId, onSaved }: { athleteId: string; onSaved: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [birth, setBirth] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/athletes/${athleteId}/profile`);
      const json = res.ok ? await res.json() : null;
      if (cancelled) return;
      const p: Profile | undefined = json?.data;
      setBirth(p?.birthDate ?? "");
      setHeight(p?.heightCm != null ? String(p.heightCm) : "");
      setWeight(p?.weightKg != null ? String(p.weightKg) : "");
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [athleteId]);

  async function save() {
    const heightCm = toNum(height);
    const weightKg = toNum(weight);
    if (heightCm === undefined || weightKg === undefined) {
      setMsg({ ok: false, text: "Altura o peso no válidos." });
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/athletes/${athleteId}/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ birthDate: birth || null, heightCm, weightKg })
    });
    const json = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      setMsg({ ok: false, text: json?.error?.message ?? "No se pudo guardar (altura 100–250 cm, peso 25–250 kg)." });
      return;
    }
    setMsg({ ok: true, text: "Perfil guardado." });
    onSaved();
  }

  if (!loaded) return <p className="muted">Cargando perfil…</p>;
  const age = ageFrom(birth || null);

  return (
    <div className="nut-body">
      <label>
        Fecha de nacimiento{age != null ? ` · ${age} años` : ""}
        <input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} />
      </label>
      <label>
        Altura (cm)
        <input type="text" inputMode="decimal" value={height} placeholder="178" onChange={(e) => setHeight(e.target.value)} />
      </label>
      <label>
        Peso (kg)
        <input type="text" inputMode="decimal" value={weight} placeholder="72,5" onChange={(e) => setWeight(e.target.value)} />
      </label>
      <div className="nut-actions">
        <button type="button" className="btn" disabled={busy} onClick={() => void save()}>
          {busy ? "Guardando…" : "Guardar perfil"}
        </button>
        {msg ? <p className={msg.ok ? "ok" : "error"}>{msg.text}</p> : null}
      </div>
    </div>
  );
}

/** Botón «Perfil» + modal con la ficha física. */
export function AthleteProfileButton({ athleteId, onSaved }: { athleteId: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn secondary" onClick={() => setOpen(true)}>
        Perfil
      </button>
      {open
        ? createPortal(
            <div className="nut-modal-root" role="presentation" onClick={() => setOpen(false)}>
              <div
                className="nut-modal card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="nut-profile-title"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="nut-modal-head">
                  <h2 id="nut-profile-title">Perfil del deportista</h2>
                  <button type="button" className="icon-btn" aria-label="Cerrar" onClick={() => setOpen(false)}>
                    ×
                  </button>
                </div>
                <div className="nut-modal-body">
                  <AthleteProfileForm athleteId={athleteId} onSaved={onSaved} />
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
