"use client";

import { useMemo, type ReactNode } from "react";
import { addDays, dateKey, daysBetween, MONTHS_ES, parseDateLocal } from "@/lib/dates";
import type { Diary } from "@/lib/types";

type Props = {
  diaries: Diary[];
  from: string;
  to: string;
};

const CHART_W = 320;
const CHART_H = 72;
const PAD_X = 4;
const PAD_Y = 6;

function formatShortDate(iso: string) {
  const d = parseDateLocal(iso);
  const mon = MONTHS_ES[d.getMonth()].slice(0, 3).toLowerCase();
  return `${d.getDate()} ${mon}`;
}

function calendarKeys(from: string, to: string) {
  const start = parseDateLocal(from);
  const count = daysBetween(start, parseDateLocal(to)) + 1;
  const keys: string[] = [];
  for (let i = 0; i < count; i += 1) keys.push(dateKey(addDays(start, i)));
  return keys;
}

function diaryByDate(diaries: Diary[]) {
  return Object.fromEntries(diaries.map((d) => [d.date, d])) as Record<string, Diary>;
}

function pickSeries(keys: string[], byDate: Record<string, Diary>, field: keyof Diary): (number | null)[] {
  return keys.map((k) => {
    const v = byDate[k]?.[field];
    return typeof v === "number" && !Number.isNaN(v) ? v : null;
  });
}

function stats(values: (number | null)[]) {
  const nums = values.filter((v): v is number => v !== null);
  if (!nums.length) return { last: null as number | null, avg: null as number | null };
  const last = nums[nums.length - 1]!;
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  return { last, avg };
}

function formatNum(v: number | null, digits = 1) {
  if (v === null) return "—";
  return Number.isInteger(v) ? String(v) : v.toFixed(digits);
}

type SerieProps = {
  points: (number | null)[];
  yMin: number;
  yMax: number;
};

function Serie({ points, yMin, yMax }: SerieProps) {
  const n = points.length;
  const span = yMax - yMin || 1;
  const innerW = CHART_W - PAD_X * 2;
  const innerH = CHART_H - PAD_Y * 2;

  function xAt(i: number) {
    if (n <= 1) return PAD_X + innerW / 2;
    return PAD_X + (i / (n - 1)) * innerW;
  }

  function yAt(v: number) {
    const t = (v - yMin) / span;
    return PAD_Y + innerH - t * innerH;
  }

  const segments: string[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    if (a === null || b === null) continue;
    segments.push(`M ${xAt(i)} ${yAt(a)} L ${xAt(i + 1)} ${yAt(b)}`);
  }

  const dots = points
    .map((v, i) => (v === null ? null : { i, v }))
    .filter((d): d is { i: number; v: number } => d !== null);

  return (
    <svg className="an-chart" viewBox={`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="none" aria-hidden="true">
      <line x1={PAD_X} y1={PAD_Y + innerH} x2={CHART_W - PAD_X} y2={PAD_Y + innerH} className="an-axis" />
      {segments.map((d, i) => (
        <path key={i} d={d} className="an-line" fill="none" />
      ))}
      {dots.map(({ i, v }) => (
        <circle key={i} cx={xAt(i)} cy={yAt(v)} r={2.2} className="an-dot" />
      ))}
    </svg>
  );
}

function autoYRange(points: (number | null)[]) {
  const nums = points.filter((v): v is number => v !== null);
  if (!nums.length) return { yMin: 0, yMax: 1 };
  let lo = Math.min(...nums);
  let hi = Math.max(...nums);
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  } else {
    const pad = (hi - lo) * 0.08;
    lo -= pad;
    hi += pad;
  }
  return { yMin: lo, yMax: hi };
}

type BarrasProps = {
  points: (number | null)[];
  yMax: number;
};

function Barras({ points, yMax }: BarrasProps) {
  const n = points.length;
  const innerW = CHART_W - PAD_X * 2;
  const innerH = CHART_H - PAD_Y * 2;
  const slot = n > 0 ? innerW / n : innerW;
  const barW = Math.max(1.5, slot * 0.65);

  return (
    <svg className="an-chart" viewBox={`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="none" aria-hidden="true">
      <line x1={PAD_X} y1={PAD_Y + innerH} x2={CHART_W - PAD_X} y2={PAD_Y + innerH} className="an-axis" />
      {points.map((v, i) => {
        if (v === null) return null;
        const h = (v / yMax) * innerH;
        const x = PAD_X + i * slot + (slot - barW) / 2;
        const y = PAD_Y + innerH - h;
        return <rect key={i} x={x} y={y} width={barW} height={h} className="an-bar" rx={1} />;
      })}
    </svg>
  );
}

type MetricCardProps = {
  title: string;
  unit: string;
  last: number | null;
  avg: number | null;
  digits?: number;
  children: ReactNode;
};

function MetricCard({ title, unit, last, avg, digits = 1, children }: MetricCardProps) {
  return (
    <article className="card an-card">
      <header className="an-card-head">
        <h3>{title}</h3>
        <p className="an-meta">
          <span>
            Último: <strong>{formatNum(last, digits)}</strong>
            {last !== null ? ` ${unit}` : ""}
          </span>
          <span>
            Media: <strong>{formatNum(avg, digits)}</strong>
            {avg !== null ? ` ${unit}` : ""}
          </span>
        </p>
      </header>
      {children}
    </article>
  );
}

export function Analisis({ diaries, from, to }: Props) {
  const keys = useMemo(() => calendarKeys(from, to), [from, to]);
  const byDate = useMemo(() => diaryByDate(diaries), [diaries]);

  const molestias = useMemo(() => {
    return diaries
      .filter((d) => (d.dietNote ?? "").trim())
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);
  }, [diaries]);

  if (!diaries.length) {
    return (
      <section className="card an-empty">
        <p>Aún no hay registros en los últimos 60 días.</p>
      </section>
    );
  }

  const sleepH = pickSeries(keys, byDate, "sleepHours");
  const sleepQ = pickSeries(keys, byDate, "sleepQuality");
  const hrv = pickSeries(keys, byDate, "hrv");
  const resting = pickSeries(keys, byDate, "restingHr");
  const rpe = pickSeries(keys, byDate, "rpe");

  const hrvY = autoYRange(hrv);
  const restingY = autoYRange(resting);
  const sleepNums = sleepH.filter((v): v is number => v !== null);
  const sleepYMax = sleepNums.length ? Math.max(10, ...sleepNums) : 10;

  return (
    <div className="an-wrap">
      <p className="an-range muted">
        {formatShortDate(from)} – {formatShortDate(to)} · {keys.length} días
      </p>
      <div className="an-grid">
        <MetricCard title="Sueño" unit="h" {...stats(sleepH)} digits={1}>
          <Serie points={sleepH} yMin={0} yMax={sleepYMax} />
        </MetricCard>
        <MetricCard title="Calidad sueño" unit="" {...stats(sleepQ)} digits={0}>
          <Serie points={sleepQ} yMin={0} yMax={100} />
        </MetricCard>
        <MetricCard title="HRV" unit="ms" {...stats(hrv)} digits={0}>
          <Serie points={hrv} yMin={hrvY.yMin} yMax={hrvY.yMax} />
        </MetricCard>
        <MetricCard title="Pulso reposo" unit="lpm" {...stats(resting)} digits={0}>
          <Serie points={resting} yMin={restingY.yMin} yMax={restingY.yMax} />
        </MetricCard>
        <MetricCard title="RPE" unit="" {...stats(rpe)} digits={0}>
          <Barras points={rpe} yMax={10} />
        </MetricCard>
      </div>
      <section className="card an-molestias">
        <h3>Molestias</h3>
        {molestias.length ? (
          <ul className="an-mol-list">
            {molestias.map((d) => (
              <li key={d.date}>
                <time dateTime={d.date}>{formatShortDate(d.date)}</time>
                <span>{d.dietNote!.trim()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Sin molestias registradas en 60 días.</p>
        )}
      </section>
    </div>
  );
}
