"use client";

import { useMemo, useState, type ReactNode } from "react";
import { addDays, dateKey, daysBetween, formatLongDate, MONTHS_ES, parseDateLocal } from "@/lib/dates";
import type { Diary } from "@/lib/types";

export const ANALYSIS_PRESETS = [3, 7, 10, 15, 30, 60] as const;

export type AnalysisView = "range" | "day";

type Props = {
  diaries: Diary[];
  dataFrom: string;
  dataTo: string;
  view: AnalysisView;
  rangeDays: number;
  dayDate: string;
  dayRecord: Diary;
  onViewChange: (view: AnalysisView) => void;
  onRangeDaysChange: (days: number) => void;
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

function hasAnyMetric(d: Diary) {
  return (
    d.sleepHours !== null ||
    d.sleepQuality !== null ||
    d.recovery !== null ||
    d.hrv !== null ||
    d.restingHr !== null ||
    d.rpe !== null ||
    (d.dietNote ?? "").trim() !== ""
  );
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

function DayDetail({ diary }: { diary: Diary }) {
  const molestias = (diary.dietNote ?? "").trim();
  return (
    <section className="card an-day">
      <h3>{formatLongDate(parseDateLocal(diary.date))}</h3>
      {!hasAnyMetric(diary) ? (
        <p className="muted">Sin registro para este día.</p>
      ) : (
        <dl className="an-day-grid">
          <div>
            <dt>Sueño</dt>
            <dd>
              {formatNum(diary.sleepHours, 1)}
              {diary.sleepHours !== null ? " h" : ""}
            </dd>
          </div>
          <div>
            <dt>Calidad sueño</dt>
            <dd>{formatNum(diary.sleepQuality, 0)}</dd>
          </div>
          <div>
            <dt>Recuperación</dt>
            <dd>{formatNum(diary.recovery, 0)}</dd>
          </div>
          <div>
            <dt>HRV</dt>
            <dd>
              {formatNum(diary.hrv, 0)}
              {diary.hrv !== null ? " ms" : ""}
            </dd>
          </div>
          <div>
            <dt>Pulso reposo</dt>
            <dd>
              {formatNum(diary.restingHr, 0)}
              {diary.restingHr !== null ? " lpm" : ""}
            </dd>
          </div>
          <div>
            <dt>RPE</dt>
            <dd>{formatNum(diary.rpe, 0)}</dd>
          </div>
        </dl>
      )}
      <div className="an-day-mol">
        <h4>Molestias</h4>
        {molestias ? <p>{molestias}</p> : <p className="muted">Sin molestias registradas.</p>}
      </div>
    </section>
  );
}

type PeriodToolbarProps = {
  view: AnalysisView;
  rangeDays: number;
  rangeKind: "preset" | "custom";
  customFrom: string;
  customTo: string;
  dataFrom: string;
  dataTo: string;
  onPreset: (days: number) => void;
  onCustomApply: (from: string, to: string) => void;
  onShowTrends: () => void;
};

function PeriodToolbar({
  view,
  rangeDays,
  rangeKind,
  customFrom,
  customTo,
  dataFrom,
  dataTo,
  onPreset,
  onCustomApply,
  onShowTrends
}: PeriodToolbarProps) {
  const [draftFrom, setDraftFrom] = useState(customFrom);
  const [draftTo, setDraftTo] = useState(customTo);

  return (
    <div className="an-toolbar">
      <div className="an-chips" role="group" aria-label="Periodo de tendencias">
        {ANALYSIS_PRESETS.map((d) => (
          <button
            key={d}
            type="button"
            className={view === "range" && rangeKind === "preset" && rangeDays === d ? "on" : ""}
            onClick={() => onPreset(d)}
          >
            {d} d
          </button>
        ))}
      </div>
      <form
        className="an-custom"
        onSubmit={(e) => {
          e.preventDefault();
          let from = draftFrom;
          let to = draftTo;
          if (from > to) [from, to] = [to, from];
          if (from < dataFrom) from = dataFrom;
          if (to > dataTo) to = dataTo;
          onCustomApply(from, to);
        }}
      >
        <label>
          <span className="sr-only">Desde</span>
          <input type="date" value={draftFrom} min={dataFrom} max={dataTo} onChange={(e) => setDraftFrom(e.target.value)} />
        </label>
        <span className="an-custom-sep" aria-hidden="true">
          –
        </span>
        <label>
          <span className="sr-only">Hasta</span>
          <input type="date" value={draftTo} min={dataFrom} max={dataTo} onChange={(e) => setDraftTo(e.target.value)} />
        </label>
        <button type="submit" className={view === "range" && rangeKind === "custom" ? "on" : ""}>
          Aplicar
        </button>
      </form>
      {view === "day" ? (
        <p className="an-day-hint">
          Viendo el día del calendario.{" "}
          <button type="button" className="an-link" onClick={onShowTrends}>
            Ver tendencias
          </button>
        </p>
      ) : null}
    </div>
  );
}

export function Analisis({
  diaries,
  dataFrom,
  dataTo,
  view,
  rangeDays,
  dayDate,
  dayRecord,
  onViewChange,
  onRangeDaysChange
}: Props) {
  const [rangeKind, setRangeKind] = useState<"preset" | "custom">("preset");
  const [customFrom, setCustomFrom] = useState(dataFrom);
  const [customTo, setCustomTo] = useState(dataTo);

  const range = useMemo(() => {
    if (view === "day") return { from: dayDate, to: dayDate };
    if (rangeKind === "custom") return { from: customFrom, to: customTo };
    const end = parseDateLocal(dataTo);
    const start = addDays(end, -(rangeDays - 1));
    let from = dateKey(start);
    if (from < dataFrom) from = dataFrom;
    return { from, to: dataTo };
  }, [view, dayDate, rangeKind, customFrom, customTo, rangeDays, dataFrom, dataTo]);

  const keys = useMemo(() => calendarKeys(range.from, range.to), [range.from, range.to]);
  const byDate = useMemo(() => diaryByDate(diaries), [diaries]);

  const molestias = useMemo(() => {
    return diaries
      .filter((d) => d.date >= range.from && d.date <= range.to && (d.dietNote ?? "").trim())
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);
  }, [diaries, range.from, range.to]);

  function selectPreset(days: number) {
    onViewChange("range");
    setRangeKind("preset");
    onRangeDaysChange(days);
  }

  function applyCustom(from: string, to: string) {
    setCustomFrom(from);
    setCustomTo(to);
    setRangeKind("custom");
    onViewChange("range");
  }

  if (!diaries.length && view === "range") {
    return (
      <section className="card an-empty">
        <p>Aún no hay registros en los últimos 60 días.</p>
      </section>
    );
  }

  return (
    <div className="an-wrap">
      <PeriodToolbar
        view={view}
        rangeDays={rangeDays}
        rangeKind={rangeKind}
        customFrom={customFrom}
        customTo={customTo}
        dataFrom={dataFrom}
        dataTo={dataTo}
        onPreset={selectPreset}
        onCustomApply={applyCustom}
        onShowTrends={() => onViewChange("range")}
      />

      {view === "day" ? (
        <DayDetail diary={dayRecord.date === dayDate ? dayRecord : { ...dayRecord, date: dayDate }} />
      ) : (
        <>
          <p className="an-range muted">
            {formatShortDate(range.from)} – {formatShortDate(range.to)} · {keys.length} días
          </p>
          <RangeCharts keys={keys} byDate={byDate} molestias={molestias} rangeLabel={`${formatShortDate(range.from)} – ${formatShortDate(range.to)}`} />
        </>
      )}
    </div>
  );
}

type RangeChartsProps = {
  keys: string[];
  byDate: Record<string, Diary>;
  molestias: Diary[];
  rangeLabel: string;
};

function RangeCharts({ keys, byDate, molestias, rangeLabel }: RangeChartsProps) {
  const sleepH = pickSeries(keys, byDate, "sleepHours");
  const sleepQ = pickSeries(keys, byDate, "sleepQuality");
  const hrv = pickSeries(keys, byDate, "hrv");
  const resting = pickSeries(keys, byDate, "restingHr");
  const rpe = pickSeries(keys, byDate, "rpe");

  const hrvY = autoYRange(hrv);
  const restingY = autoYRange(resting);
  const sleepNums = sleepH.filter((v): v is number => v !== null);
  const sleepYMax = sleepNums.length ? Math.max(10, ...sleepNums) : 10;

  const anyData = keys.some((k) => hasAnyMetric(byDate[k] ?? emptyDiaryStub(k)));

  if (!anyData) {
    return (
      <section className="card an-empty">
        <p className="muted">No hay datos en este periodo.</p>
      </section>
    );
  }

  return (
    <>
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
          <p className="muted">Sin molestias registradas en {rangeLabel}.</p>
        )}
      </section>
    </>
  );
}

function emptyDiaryStub(date: string): Diary {
  return {
    athleteId: "",
    date,
    sleepHours: null,
    sleepQuality: null,
    recovery: null,
    hrv: null,
    restingHr: null,
    rpe: null,
    feeling: null,
    km: null,
    avgHr: null,
    dietNote: null,
    freeNote: null
  };
}
