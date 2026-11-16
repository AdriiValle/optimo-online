"use client";

import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import type { BodyMeasurement } from "@/lib/types";
import { parseDateLocal } from "@/lib/dates";
import { fmtNum, shortDate } from "./format";

type MetricKey = "weightKg" | "bodyFatPct" | "skinfoldSumMm" | "waistCm";

const METRICS: { key: MetricKey; label: string; field: string; unit: string; unitSpaced: string }[] = [
  { key: "weightKg", label: "Peso", field: "Peso", unit: "kg", unitSpaced: " kg" },
  { key: "bodyFatPct", label: "% graso", field: "% graso", unit: "%", unitSpaced: " %" },
  { key: "skinfoldSumMm", label: "Pliegues", field: "Suma de pliegues", unit: "mm", unitSpaced: " mm" },
  { key: "waistCm", label: "Cintura", field: "Cintura", unit: "cm", unitSpaced: " cm" }
];

type FormState = { date: string; notes: string } & Record<MetricKey, string>;

const blank = (date: string): FormState => ({ date, weightKg: "", bodyFatPct: "", skinfoldSumMm: "", waistCm: "", notes: "" });

function fromMeasurement(m: BodyMeasurement): FormState {
  const s = (v: number | null) => (v == null ? "" : fmtNum(v, 2));
  return {
    date: m.date,
    weightKg: s(m.weightKg),
    bodyFatPct: s(m.bodyFatPct),
    skinfoldSumMm: s(m.skinfoldSumMm),
    waistCm: s(m.waistCm),
    notes: m.notes ?? ""
  };
}

/** Formulario de una fecha: si ya hay registro, precargado (guardar lo sustituye entero); si no, vacío. */
function formFor(list: BodyMeasurement[], date: string): FormState {
  const rec = list.find((r) => r.date === date);
  return rec ? fromMeasurement(rec) : blank(date);
}

const sameForm = (a: FormState, b: FormState) => (Object.keys(a) as (keyof FormState)[]).every((k) => a[k] === b[k]);

/** «72,4» o «72.4» → 72.4; vacío → null; texto no numérico → NaN. */
function parseNum(v: string) {
  const t = v.trim().replace(",", ".");
  if (!t) return null;
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
}

function values(m: BodyMeasurement) {
  return METRICS.filter((x) => m[x.key] != null).map((x) => `${fmtNum(m[x.key]!)}${x.unitSpaced}`);
}

type Point = { date: string; value: number };

/** Paso «bonito» (1, 2, 5 × 10ⁿ) para unas 3 divisiones. */
function niceStep(range: number) {
  const raw = range / 3 || 1;
  const p = 10 ** Math.floor(Math.log10(raw));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

const CHART_H = 200;
const PAD = { top: 16, right: 48, bottom: 28, left: 8 };

/** Línea limpia estilo Salud: rejilla tenue, eje de valores a la derecha, el último punto destacado. */
function LineChart({ points, unit, label }: { points: Point[]; unit: string; label: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const descId = useId();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => {
    if (!width || !points.length) return null;
    const vs = points.map((p) => p.value);
    let min = Math.min(...vs);
    let max = Math.max(...vs);
    if (min === max) {
      const pad = Math.max(1, Math.abs(min) * 0.02);
      min -= pad;
      max += pad;
    }
    const step = niceStep(max - min);
    const lo = Math.floor(min / step) * step;
    const hi = Math.ceil(max / step) * step;
    const ticks: number[] = [];
    for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(6)));

    const t = points.map((p) => parseDateLocal(p.date).getTime());
    const t0 = t[0];
    const t1 = t[t.length - 1];
    const innerW = Math.max(1, width - PAD.left - PAD.right);
    const innerH = CHART_H - PAD.top - PAD.bottom;
    const x = (ti: number) => (t1 === t0 ? PAD.left + innerW / 2 : PAD.left + ((ti - t0) / (t1 - t0)) * innerW);
    const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo)) * innerH;
    const xy = points.map((p, i) => ({ x: x(t[i]), y: y(p.value) }));
    return { ticks, xy, y, innerW };
  }, [points, width]);

  const pick = (clientX: number) => {
    if (!geo || !wrapRef.current) return;
    const left = wrapRef.current.getBoundingClientRect().left;
    const px = clientX - left;
    let best = 0;
    geo.xy.forEach((p, i) => {
      if (Math.abs(p.x - px) < Math.abs(geo.xy[best].x - px)) best = i;
    });
    setActive(best);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!points.length) return;
    const last = points.length - 1;
    let next: number | null = null;
    const cur = active != null && active <= last ? active : null;
    if (e.key === "ArrowLeft") next = cur == null ? last : Math.max(0, cur - 1);
    else if (e.key === "ArrowRight") next = cur == null ? last : Math.min(last, cur + 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else if (e.key === "Escape") return setActive(null);
    if (next != null) {
      e.preventDefault();
      setActive(next);
    }
  };

  // Al cambiar de medida o borrar puntos, un índice fuera de rango deja de contar.
  const act = active != null && active < points.length ? active : null;
  const shown = act ?? points.length - 1;
  const sel = geo?.xy[shown];
  const summary = points.length
    ? `${label}: ${points.length} ${points.length === 1 ? "registro" : "registros"}, de ${fmtNum(points[0].value)} ${unit} el ${shortDate(points[0].date, true)} a ${fmtNum(points[points.length - 1].value)} ${unit} el ${shortDate(points[points.length - 1].date, true)}.`
    : "";
  const labelIdx = points.length > 2 ? [0, Math.floor((points.length - 1) / 2), points.length - 1] : points.map((_, i) => i);

  return (
    <div
      ref={wrapRef}
      className="nut-trk-chart"
      tabIndex={0}
      role="group"
      aria-roledescription="gráfica"
      aria-label={`Gráfica de ${label.toLowerCase()}`}
      aria-describedby={descId}
      onKeyDown={onKey}
      onPointerMove={(e: PointerEvent<HTMLDivElement>) => e.pointerType === "mouse" && pick(e.clientX)}
      onPointerDown={(e: PointerEvent<HTMLDivElement>) => pick(e.clientX)}
      onPointerLeave={(e: PointerEvent<HTMLDivElement>) => e.pointerType === "mouse" && setActive(null)}
      onBlur={() => setActive(null)}
    >
      <p id={descId} className="sr-only">
        {summary} Usa las flechas para recorrer los puntos.
      </p>
      {geo ? (
        <svg width={width} height={CHART_H} aria-hidden="true" className="nut-trk-chart-svg">
          {geo.ticks.map((v) => (
            <g key={v}>
              <line className="nut-trk-grid" x1={PAD.left} x2={PAD.left + geo.innerW} y1={geo.y(v)} y2={geo.y(v)} />
              <text className="nut-trk-axis" x={width - PAD.right + 8} y={geo.y(v)} dy="0.35em">
                {fmtNum(v)}
              </text>
            </g>
          ))}
          {geo.xy.length > 1 ? (
            <polyline className="nut-trk-line" points={geo.xy.map((p) => `${p.x},${p.y}`).join(" ")} />
          ) : null}
          {sel && act != null ? (
            <line className="nut-trk-cursor" x1={sel.x} x2={sel.x} y1={PAD.top - 4} y2={CHART_H - PAD.bottom} />
          ) : null}
          {geo.xy.map((p, i) => (
            <circle
              key={points[i].date}
              className={`nut-trk-pt${i === shown ? " is-active" : ""}`}
              cx={p.x}
              cy={p.y}
              r={i === shown ? 5 : 3.5}
            />
          ))}
          {labelIdx.map((i) => (
            <text
              key={`x-${points[i].date}`}
              className="nut-trk-axis"
              x={geo.xy[i].x}
              y={CHART_H - 8}
              textAnchor={geo.xy.length === 1 ? "middle" : i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
            >
              {shortDate(points[i].date)}
            </text>
          ))}
        </svg>
      ) : (
        <div style={{ height: CHART_H }} />
      )}
      {sel && act != null ? (
        <div
          className="nut-trk-tip"
          style={{ left: Math.min(Math.max(sel.x, 56), Math.max(56, width - 56)), top: Math.max(0, sel.y - 52) }}
          aria-live="polite"
        >
          <strong>
            {fmtNum(points[act].value)} {unit}
          </strong>
          <span>{shortDate(points[act].date, true)}</span>
        </div>
      ) : null}
    </div>
  );
}

/** Registro de medidas (peso, % graso, pliegues, cintura, notas), gráfica y lista. El último peso va al perfil. */
export function MeasurementsPanel({
  athleteId,
  today,
  initialMeasurements,
  initialProfileWeightKg
}: {
  athleteId: string;
  today: string;
  initialMeasurements: BodyMeasurement[];
  initialProfileWeightKg: number | null;
}) {
  const router = useRouter();
  const [list, setList] = useState(initialMeasurements);
  const [profileWeightKg, setProfileWeightKg] = useState(initialProfileWeightKg);
  const [form, setForm] = useState<FormState>(() => formFor(initialMeasurements, today));
  const [metric, setMetric] = useState<MetricKey>("weightKg");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const uid = useId();

  const existing = list.find((m) => m.date === form.date) ?? null;
  const pristine = sameForm(form, formFor(list, today));
  const m = METRICS.find((x) => x.key === metric)!;
  const points = useMemo(
    () => list.filter((r) => r[metric] != null).map((r) => ({ date: r.date, value: r[metric]! })),
    [list, metric]
  );
  const latest = points[points.length - 1];
  const delta = points.length > 1 ? latest.value - points[0].value : null;

  const set = (k: keyof FormState, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setError(null);
  };

  const changeDate = (date: string) => {
    const rec = list.find((r) => r.date === date);
    setForm(rec ? fromMeasurement(rec) : { ...form, date });
    setError(null);
  };

  const edit = (rec: BodyMeasurement) => {
    setForm(fromMeasurement(rec));
    setError(null);
    setStatus(null);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    formRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    formRef.current?.querySelector<HTMLInputElement>("input[name=weightKg]")?.focus({ preventScroll: true });
  };

  const applyResult = (data: { measurements: BodyMeasurement[]; profileWeightKg: number | null }) => {
    setList(data.measurements);
    setProfileWeightKg(data.profileWeightKg);
    router.refresh();
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    const nums = Object.fromEntries(METRICS.map((x) => [x.key, parseNum(form[x.key])])) as Record<MetricKey, number | null>;
    const bad = METRICS.find((x) => Number.isNaN(nums[x.key]));
    if (bad) return setError(`${bad.field}: escribe solo un número (p. ej. 72,4).`);
    if (!form.date || form.date > today) return setError("Elige una fecha de hoy o anterior.");
    if (METRICS.every((x) => nums[x.key] == null) && !form.notes.trim()) {
      return setError("Escribe al menos una medida o una nota.");
    }
    setSaving(true);
    setError(null);
    setStatus(null);
    const res = await fetch("/api/nutrition/tracking/measurements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athleteId, date: form.date, ...nums, notes: form.notes.trim() || null })
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) {
      const body = await res?.json().catch(() => null);
      const fields = body?.error?.details?.fieldErrors as Record<string, string[]> | undefined;
      const field = fields && METRICS.find((x) => fields[x.key]);
      return setError(
        field ? `${field.field}: fuera de rango.` : res ? "No se ha podido guardar. Revisa los datos." : "Sin conexión. Prueba otra vez."
      );
    }
    const { data } = await res.json();
    applyResult(data);
    setForm(formFor(data.measurements, today));
    setStatus(
      `Medida del ${shortDate(form.date)} guardada.` +
        (nums.weightKg != null && data.profileWeightKg != null ? ` Peso del perfil: ${fmtNum(data.profileWeightKg)} kg.` : "")
    );
  }

  async function remove(rec: BodyMeasurement) {
    setConfirmId(null);
    setError(null);
    const res = await fetch(`/api/nutrition/tracking/measurements/${rec.id}?athleteId=${athleteId}`, { method: "DELETE" }).catch(
      () => null
    );
    if (!res?.ok) return setStatus("No se ha podido borrar. Prueba otra vez.");
    const { data } = await res.json();
    applyResult(data);
    if (form.date === rec.date) setForm(formFor(data.measurements, today));
    setStatus(`Medida del ${shortDate(rec.date)} borrada.`);
  }

  return (
    <section className="nut-trk-block" aria-labelledby="nut-trk-meas-title">
      <div className="nut-trk-block-head">
        <h3 id="nut-trk-meas-title" className="nut-trk-block-title">
          Medidas
        </h3>
        <p className="nut-trk-block-sub">
          {profileWeightKg != null
            ? `Peso del perfil: ${fmtNum(profileWeightKg)} kg. Se actualiza con el último registro de peso.`
            : "El peso del perfil se actualiza con el último registro de peso."}
        </p>
      </div>

      <div className="nut-trk-card nut-trk-chart-card">
        {list.length ? (
          <>
            <div className="segmented segmented--block nut-trk-metrics" role="group" aria-label="Medida de la gráfica">
              {METRICS.map((x) => (
                <button key={x.key} type="button" aria-pressed={metric === x.key} onClick={() => setMetric(x.key)}>
                  {x.label}
                </button>
              ))}
            </div>
            {latest ? (
              <>
                <div className="nut-trk-latest">
                  <span className="nut-trk-latest-label">Último</span>
                  <span className="nut-trk-latest-value">
                    {fmtNum(latest.value)}
                    <span className="nut-trk-latest-unit">{m.unit}</span>
                  </span>
                  <span className="nut-trk-meta">
                    {shortDate(latest.date, true)}
                    {delta != null
                      ? ` · ${delta > 0 ? "+" : delta < 0 ? "−" : "±"}${fmtNum(Math.abs(delta))} ${m.unit} desde el ${shortDate(points[0].date)}`
                      : ""}
                  </span>
                </div>
                <LineChart points={points} unit={m.unit} label={m.field} />
              </>
            ) : (
              <p className="nut-trk-none nut-trk-none--chart">Aún no hay registros de {m.field.toLowerCase()}.</p>
            )}
          </>
        ) : (
          <div className="state nut-trk-empty nut-trk-empty--flat">
            <svg className="state-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3.5 19.5h17" />
              <path d="m5 15 4.5-4.5 3.5 3 6-6.5" />
            </svg>
            <h4 className="state-title">Aún no hay medidas</h4>
            <p className="state-text">Registra la primera abajo: aquí verás su evolución en una gráfica.</p>
          </div>
        )}
      </div>

      <form ref={formRef} className="nut-trk-card nut-trk-form" onSubmit={submit} noValidate aria-labelledby={`${uid}-ft`}>
        <h4 id={`${uid}-ft`} className="nut-trk-form-title">
          {existing ? `Editar medida del ${shortDate(existing.date)}` : "Nueva medida"}
        </h4>
        <div className="nut-trk-fields">
          <label className="nut-trk-field nut-trk-field--date">
            <span className="nut-trk-field-label">Fecha</span>
            <input type="date" name="date" value={form.date} max={today} required onChange={(e) => changeDate(e.target.value)} />
          </label>
          {METRICS.map((x) => (
            <label key={x.key} className="nut-trk-field">
              <span className="nut-trk-field-label">{x.field}</span>
              <span className="nut-trk-input-unit">
                <input
                  type="text"
                  inputMode="decimal"
                  name={x.key}
                  autoComplete="off"
                  value={form[x.key]}
                  onChange={(e) => set(x.key, e.target.value)}
                  aria-invalid={Number.isNaN(parseNum(form[x.key])) || undefined}
                />
                <span aria-hidden="true">{x.unit}</span>
              </span>
            </label>
          ))}
          <label className="nut-trk-field nut-trk-field--notes">
            <span className="nut-trk-field-label">Notas</span>
            <textarea name="notes" rows={2} maxLength={500} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </label>
        </div>
        {existing ? <p className="field-help nut-trk-form-help">Ya hay un registro de esa fecha: al guardar se sustituye.</p> : null}
        {error ? (
          <p className="field-error nut-trk-form-help" role="alert">
            {error}
          </p>
        ) : null}
        <div className="nut-trk-form-actions">
          {!pristine ? (
            <button
              type="button"
              className="btn btn--plain"
              onClick={() => {
                setForm(formFor(list, today));
                setError(null);
              }}
            >
              Cancelar
            </button>
          ) : null}
          <button type="submit" className="btn" aria-busy={saving || undefined} disabled={saving}>
            {saving ? "Guardando…" : "Guardar medida"}
          </button>
        </div>
        <p className="sr-only" role="status">
          {status ?? ""}
        </p>
        {status ? (
          <p className="nut-trk-saved" aria-hidden="true">
            {status}
          </p>
        ) : null}
      </form>

      {list.length ? (
        <>
          <h4 className="list-group-title nut-trk-records-title">Registros</h4>
          <ul className="list-group nut-trk-records">
            {[...list].reverse().map((r) => (
              <li key={r.id} className="nut-trk-record">
                <div className="nut-trk-record-body">
                  <span className="nut-trk-record-date">{shortDate(r.date, true)}</span>
                  <span className="nut-trk-record-values">{values(r).join(" · ") || "Solo nota"}</span>
                  {r.notes ? <span className="nut-trk-meta nut-trk-record-notes">{r.notes}</span> : null}
                </div>
                {confirmId === r.id ? (
                  <div className="nut-trk-record-actions">
                    <button type="button" className="btn btn--plain" onClick={() => setConfirmId(null)}>
                      Cancelar
                    </button>
                    <button type="button" className="btn btn--danger" onClick={() => remove(r)}>
                      Borrar
                    </button>
                  </div>
                ) : (
                  <div className="nut-trk-record-actions">
                    <button type="button" className="btn btn--plain" onClick={() => edit(r)} aria-label={`Editar medida del ${shortDate(r.date, true)}`}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn--plain nut-trk-delete"
                      onClick={() => setConfirmId(r.id)}
                      aria-label={`Borrar medida del ${shortDate(r.date, true)}`}
                    >
                      Borrar
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
