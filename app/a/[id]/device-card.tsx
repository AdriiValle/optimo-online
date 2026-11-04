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

  return (
    <section className="card device-card" aria-label="Dispositivo">
      <h3 className="device-card-title">Pulsera</h3>
      {!configured ? (
        <p className="muted">Polar: pendiente de alta en el servidor.</p>
      ) : connected ? (
        <p className="device-card-status ok">
          Polar conectado · última actualización {formatSync(integration.lastSyncAt)}
        </p>
      ) : errored ? (
        <p className="device-card-status error">
          Polar: {integration.lastError?.slice(0, 120) ?? "error de conexión"}
        </p>
      ) : (
        <p className="muted">Conecta Polar para traer sueño y métricas de la noche.</p>
      )}

      {flash ? <p className="ok">{flash}</p> : null}
      {err ? <p className="error">{err}</p> : null}

      <div className="device-card-actions">
        {configured && !connected && !errored ? (
          <a className="btn" href={`/api/integrations/polar/connect?athleteId=${athleteId}`}>
            Conectar Polar
          </a>
        ) : null}
        {configured && connected ? (
          <button type="button" className="btn" disabled={busy !== null} onClick={() => void refreshNight()}>
            {busy === "refresh" ? "Actualizando…" : "Actualizar datos de esa noche"}
          </button>
        ) : null}
        {configured && (connected || errored) ? (
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy !== null}
            onClick={() => void (errored ? (window.location.href = `/api/integrations/polar/connect?athleteId=${athleteId}`) : disconnect())}
          >
            {errored ? "Volver a conectar" : busy === "disconnect" ? "…" : "Desconectar"}
          </button>
        ) : null}
        <button type="button" className="btn btn-ghost" disabled title="Próximamente">
          Whoop · Próximamente
        </button>
        <button type="button" className="btn btn-ghost" disabled title="Próximamente">
          Amazfit · Próximamente
        </button>
      </div>
    </section>
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
  return (
    <span className="device-admin-chip">
      {label} {integration.status === "connected" ? "conectado" : "error"}
      {sync ? ` · sync ${sync}` : ""}
    </span>
  );
}
