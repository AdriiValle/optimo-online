"use client";

import { useEffect, useState } from "react";
import type { IntegrationInfo } from "@/lib/types";

type Props = {
  athleteId: string;
  centerDate: string;
  integration: IntegrationInfo;
  configured: boolean;
  onIntegrationChange: (next: IntegrationInfo) => void;
  onDiarySynced: (diary: unknown) => void;
  callbackDevice?: string | null;
  callbackMsg?: string | null;
};

function formatSync(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/** «13/11» a partir de una fecha YYYY-MM-DD. */
function formatDay(iso: string): string {
  const [, m, d] = iso.split("-");
  return d && m ? `${d}/${m}` : "";
}

export function DeviceCard({
  athleteId,
  centerDate,
  integration,
  configured,
  onIntegrationChange,
  onDiarySynced,
  callbackDevice,
  callbackMsg
}: Props) {
  const [busy, setBusy] = useState<"refresh" | "disconnect" | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (callbackDevice === "ok") {
      setFlash("Polar conectado.");
      onIntegrationChange({
        provider: "polar",
        status: "connected",
        lastSyncAt: null,
        lastError: null
      });
    } else if (callbackDevice === "error") {
      setErr(callbackMsg ?? "No se pudo conectar Polar.");
    }
  }, [callbackDevice, callbackMsg, onIntegrationChange]);

  async function refreshNight() {
    setBusy("refresh");
    setErr(null);
    setFlash(null);
    const res = await fetch("/api/integrations/polar/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athleteId, date: centerDate })
    });
    setBusy(null);
    if (res.status === 503) {
      setErr("Conexión Polar pendiente de alta en el servidor.");
      return;
    }
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setErr(json?.error?.message ?? "No se pudieron actualizar los datos.");
      if (res.status === 409) {
        onIntegrationChange({ ...integration, status: "error", lastError: json?.error?.message ?? null });
      }
      return;
    }
    if (json?.data?.synced === false) {
      setFlash("Polar no tenía datos para esa noche.");
      onIntegrationChange({
        ...integration,
        status: "connected",
        lastSyncAt: new Date().toISOString(),
        lastError: null
      });
      return;
    }
    if (json?.data?.diary) onDiarySynced(json.data.diary);
    setFlash("Datos de Polar actualizados.");
    onIntegrationChange({
      ...integration,
      status: "connected",
      lastSyncAt: new Date().toISOString(),
      lastError: null
    });
  }

  async function disconnect() {
    if (!window.confirm("¿Desconectar Polar? Los datos ya guardados en el diario se mantienen.")) return;
    setBusy("disconnect");
    setErr(null);
    const res = await fetch("/api/integrations/polar/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athleteId })
    });
    setBusy(null);
    if (!res.ok) {
      setErr("No se pudo desconectar.");
      return;
    }
    onIntegrationChange({
      provider: "polar",
      status: "disconnected",
      lastSyncAt: null,
      lastError: null
    });
    setFlash("Polar desconectado.");
  }

  const connected = integration.status === "connected";
  const errored = integration.status === "error";
  const connectHref = `/api/integrations/polar/connect?athleteId=${athleteId}`;
  const status = !configured
    ? { tone: "off", text: "Pendiente de alta en el servidor" }
    : connected
      ? {
          tone: "ok",
          text: integration.lastSyncAt ? `Conectado · actualizado ${formatSync(integration.lastSyncAt)}` : "Conectado"
        }
      : errored
        ? { tone: "error", text: integration.lastError?.slice(0, 120) || "Error de conexión" }
        : { tone: "off", text: "No conectado" };

  return (
    <section className="device-card" aria-labelledby="device-card-title">
      <h2 id="device-card-title" className="list-group-title">
        Pulsera
      </h2>
      <ul className="list-group device-list">
        <li>
          <div className="list-row device-row">
            <WatchGlyph />
            <span className="list-row-main">
              Polar
              <span className={`list-row-sub device-status device-status--${status.tone}`}>{status.text}</span>
            </span>
          </div>
        </li>
        {configured && !connected && !errored ? (
          <li>
            <a className="list-row device-action" href={connectHref}>
              Conectar Polar
            </a>
          </li>
        ) : null}
        {configured && connected ? (
          <li>
            <button
              type="button"
              className="list-row device-action"
              disabled={busy !== null}
              aria-busy={busy === "refresh" || undefined}
              onClick={() => void refreshNight()}
            >
              {busy === "refresh" ? <span className="spinner" aria-hidden="true" /> : null}
              <span className="list-row-main">{busy === "refresh" ? "Actualizando…" : "Actualizar datos de la noche"}</span>
              <span className="list-row-detail">{formatDay(centerDate)}</span>
            </button>
          </li>
        ) : null}
        {configured && errored ? (
          <li>
            <a className="list-row device-action" href={connectHref}>
              Volver a conectar
            </a>
          </li>
        ) : null}
        {configured && connected ? (
          <li>
            <button
              type="button"
              className="list-row device-action list-row--danger"
              disabled={busy !== null}
              aria-busy={busy === "disconnect" || undefined}
              onClick={() => void disconnect()}
            >
              {busy === "disconnect" ? <span className="spinner" aria-hidden="true" /> : null}
              {busy === "disconnect" ? "Desconectando…" : "Desconectar"}
            </button>
          </li>
        ) : null}
        {(["Whoop", "Amazfit"] as const).map((name) => (
          <li key={name}>
            <div className="list-row device-row device-row--soon" aria-disabled="true">
              <WatchGlyph />
              <span className="list-row-main">{name}</span>
              <span className="list-row-detail">Próximamente</span>
            </div>
          </li>
        ))}
      </ul>
      <div className="device-feedback" aria-live="polite">
        {flash ? (
          <p className="alert alert--ok">
            {flash}
          </p>
        ) : null}
        {err && !(errored && err === integration.lastError) ? (
          <p className="alert alert--danger">
            {err}
          </p>
        ) : null}
      </div>
      <p className="list-group-footer">
        {connected
          ? "El sueño y las métricas de la noche llegan solos de Polar al diario."
          : errored
            ? "Mientras Polar tenga error, puedes meter el sueño a mano en el diario."
            : "Conecta Polar para traer el sueño y las métricas de la noche al diario."}
      </p>
    </section>
  );
}

/** Reloj de pulsera (trazo tipo SF Symbols, sin baldosa). */
function WatchGlyph() {
  return (
    <svg className="device-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="6.5" y="6" width="11" height="12" rx="3" />
      <path d="M9 6l.6-3h4.8L15 6M9 18l.6 3h4.8L15 18M12 9.5V12l1.5 1" />
    </svg>
  );
}

export function IntegrationAdminChip({ integration }: { integration: IntegrationInfo | null }) {
  if (!integration || integration.status === "disconnected") return null;
  const label =
    integration.provider === "polar"
      ? "Polar"
      : integration.provider === "amazfit"
        ? "Amazfit"
        : "Whoop";
  const sync =
    integration.lastSyncAt &&
    new Date(integration.lastSyncAt).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  const ok = integration.status === "connected";
  const text = `${label} ${ok ? "conectado" : "con error"}${sync ? ` · ${sync}` : ""}`;
  return (
    <span title={text} className={`device-admin-chip device-admin-chip--${ok ? "ok" : "error"}`}>
      <span className="device-admin-chip-dot" aria-hidden="true" />
      <span className="device-admin-chip-text">{text}</span>
    </span>
  );
}
