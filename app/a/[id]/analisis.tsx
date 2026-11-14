"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
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

/* Gráfico: se dibuja en píxeles reales (ancho medido), sin estirar el SVG,
   para que puntos, barras redondeadas y textos no se deformen. */
const CHART_H = 120;
const PLOT_TOP = 8;
const PLOT_BOTTOM = 8;
const AXIS_W = 32;
const DOTS_MAX = 31;

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
  return Number.isInteger(v) ? String(v) : v.toFixed(digits).replace(".", ",");
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

/* Escala «redonda» para las marcas del eje Y (1, 2, 2,5, 5 × 10^n). */
function niceStep(raw: number) {
  if (raw <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const f = raw / pow;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * pow;
}

type Scale = { yMin: number; yMax: number; ticks: number[] };

function fixedScale(yMin: number, yMax: number): Scale {
  return { yMin, yMax, ticks: [yMin, (yMin + yMax) / 2, yMax] };
}

function autoScale(points: (number | null)[]): Scale {
  const nums = points.filter((v): v is number => v !== null);
  if (!nums.length) return fixedScale(0, 1);
  let lo = Math.min(...nums);
  let hi = Math.max(...nums);
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const step = niceStep((hi - lo) / 2);
  const yMin = Math.floor(lo / step) * step;
  const yMax = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let t = yMin; t <= yMax + step / 2; t += step) ticks.push(Number(t.toFixed(6)));
  return { yMin, yMax, ticks };
}

function useMeasuredWidth<T extends Element>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0]?.contentRect.width ?? 0);
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

type ChartProps = {
  kind: "line" | "bar";
  points: (number | null)[];
  scale: Scale;
  avg: number | null;
  from: string;
  to: string;
};

function Chart({ kind, points, scale, avg, from, to }: ChartProps) {
  const [ref, width] = useMeasuredWidth<HTMLDivElement>(280);
  const n = points.length;
  const plotW = Math.max(40, width - AXIS_W);
  const plotH = CHART_H - PLOT_TOP - PLOT_BOTTOM;
  const span = scale.yMax - scale.yMin || 1;
  const hasData = points.some((v) => v !== null);

  const yAt = (v: number) => PLOT_TOP + plotH - ((v - scale.yMin) / span) * plotH;
  const slot = n > 0 ? plotW / n : plotW;
  const xAt = (i: number) => {
    if (kind === "bar") return i * slot + slot / 2;
    if (n <= 1) return plotW / 2;
    return 6 + (i / (n - 1)) * (plotW - 12);
  };

  const runs: { i: number; v: number }[][] = [];
  let current: { i: number; v: number }[] = [];
  points.forEach((v, i) => {
    if (v === null) {
      if (current.length) runs.push(current);
      current = [];
    } else {
      current.push({ i, v });
    }
  });
  if (current.length) runs.push(current);

  const baseY = PLOT_TOP + plotH;
  const lastIndex = (() => {
    for (let i = n - 1; i >= 0; i -= 1) if (points[i] !== null) return i;
    return -1;
  })();

  return (
    <div className="an-chart-wrap">
      <div className="an-chart-box" ref={ref}>
        <svg className="an-chart" height={CHART_H} viewBox={`0 0 ${width} ${CHART_H}`} aria-hidden="true" focusable="false">
          {!hasData ? <line x1={0} x2={plotW} y1={baseY} y2={baseY} className="an-axis" /> : null}
          {(hasData ? scale.ticks : []).map((t) => (
            <g key={t}>
              <line x1={0} x2={plotW} y1={yAt(t)} y2={yAt(t)} className={t === scale.yMin ? "an-axis" : "an-grid-line"} />
              <text x={width} y={yAt(t)} className="an-tick" textAnchor="end" dominantBaseline="middle">
                {formatNum(t, 1)}
              </text>
            </g>
          ))}
          {hasData && avg !== null ? <line x1={0} x2={plotW} y1={yAt(avg)} y2={yAt(avg)} className="an-avg" /> : null}
          {kind === "line"
            ? runs.map((run, r) => {
                const line = run.map(({ i, v }, k) => `${k ? "L" : "M"} ${xAt(i)} ${yAt(v)}`).join(" ");
                const area =
                  run.length > 1
                    ? `${line} L ${xAt(run[run.length - 1]!.i)} ${baseY} L ${xAt(run[0]!.i)} ${baseY} Z`
                    : null;
                return (
                  <g key={r}>
                    {area ? <path d={area} className="an-area" /> : null}
                    {run.length > 1 ? <path d={line} className="an-line" fill="none" /> : null}
                    {run.map(({ i, v }) =>
                      n <= DOTS_MAX || run.length === 1 || i === lastIndex ? (
                        <circle
                          key={i}
                          cx={xAt(i)}
                          cy={yAt(v)}
                          r={i === lastIndex ? 4 : 2.5}
                          className={i === lastIndex ? "an-dot an-dot--last" : "an-dot"}
                        />
                      ) : null
                    )}
                  </g>
                );
              })
            : points.map((v, i) => {
                if (v === null) return null;
                const barW = Math.min(18, Math.max(2, slot * 0.62));
                const y = yAt(Math.max(scale.yMin, v));
                const h = Math.max(2, baseY - y);
                return (
                  <rect
                    key={i}
                    x={xAt(i) - barW / 2}
                    y={baseY - h}
                    width={barW}
                    height={h}
                    rx={Math.min(3, barW / 2)}
                    className={i === lastIndex ? "an-bar an-bar--last" : "an-bar"}
                  />
                );
              })}
        </svg>
        {!hasData ? <p className="an-chart-empty">Sin datos en este periodo</p> : null}
      </div>
      <div className="an-xaxis" aria-hidden="true" style={{ paddingRight: AXIS_W }}>
        <span>{formatShortDate(from)}</span>
        {from !== to ? <span>{formatShortDate(to)}</span> : null}
      </div>
    </div>
  );
}

type StatProps = { label: string; value: number | null; unit: string; digits: number };

function Stat({ label, value, unit, digits }: StatProps) {
  return (
    <div className="an-stat">
      <dt>{label}</dt>
      <dd>
        <span className={value === null ? "an-num an-num--none" : "an-num"}>{formatNum(value, digits)}</span>
        {value !== null && unit ? <span className="an-unit">{unit}</span> : null}
      </dd>
    </div>
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
      <h3 className="an-card-title">{title}</h3>
      <dl className="an-stats">
        <Stat label="Último" value={last} unit={unit} digits={digits} />
        <Stat label="Media" value={avg} unit={unit} digits={digits} />
      </dl>
      {children}
    </article>
  );
}

type DayMetric = { label: string; value: number | null; unit: string; digits: number };

function DayDetail({ diary }: { diary: Diary }) {
  const molestias = (diary.dietNote ?? "").trim();
  const metrics: DayMetric[] = [
    { label: "Sueño", value: diary.sleepHours, unit: "h", digits: 1 },
    { label: "Calidad del sueño", value: diary.sleepQuality, unit: "/100", digits: 0 },
    { label: "Recuperación", value: diary.recovery, unit: "/100", digits: 0 },
    { label: "HRV", value: diary.hrv, unit: "ms", digits: 0 },
    { label: "Pulso en reposo", value: diary.restingHr, unit: "lpm", digits: 0 },
    { label: "RPE", value: diary.rpe, unit: "/10", digits: 0 }
  ];
  return (
    <section className="card an-day" aria-labelledby="an-day-title">
      <h3 className="an-day-title" id="an-day-title">
        {formatLongDate(parseDateLocal(diary.date))}
      </h3>
      {!hasAnyMetric(diary) ? (
        <p className="an-day-none">Sin registro para este día.</p>
      ) : (
        <dl className="an-day-grid">
          {metrics.map((m) => (
            <div key={m.label} className="an-tile">
              <dt>{m.label}</dt>
              <dd>
                <span className={m.value === null ? "an-num an-num--none" : "an-num"}>{formatNum(m.value, m.digits)}</span>
                {m.value !== null ? <span className="an-unit">{m.unit}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <div className="an-day-mol">
        <h4>Molestias</h4>
        {molestias ? <p>{molestias}</p> : <p className="an-day-none">Sin molestias registradas.</p>}
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

  const presetActive = view === "range" && rangeKind === "preset";
  const activeIndex = presetActive ? ANALYSIS_PRESETS.findIndex((d) => d === rangeDays) : -1;
  const customActive = view === "range" && rangeKind === "custom";
  const segStyle =
    activeIndex >= 0
      ? ({ "--seg-count": ANALYSIS_PRESETS.length, "--seg-index": activeIndex } as CSSProperties)
      : undefined;

  return (
    <div className="an-toolbar">
      <div className="segmented segmented--block an-seg" role="group" aria-label="Periodo de tendencias" style={segStyle}>
        {ANALYSIS_PRESETS.map((d, i) => (
          <button key={d} type="button" aria-pressed={i === activeIndex} onClick={() => onPreset(d)}>
            {d} d
          </button>
        ))}
      </div>
      <form
        className={customActive ? "an-custom is-active" : "an-custom"}
        aria-label="Periodo personalizado"
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
        <label className="an-date">
          <span className="sr-only">Desde</span>
          <input type="date" value={draftFrom} min={dataFrom} max={dataTo} onChange={(e) => setDraftFrom(e.target.value)} />
        </label>
        <span className="an-custom-sep" aria-hidden="true">
          –
        </span>
        <label className="an-date">
          <span className="sr-only">Hasta</span>
          <input type="date" value={draftTo} min={dataFrom} max={dataTo} onChange={(e) => setDraftTo(e.target.value)} />
        </label>
        <button type="submit" className={customActive ? "btn an-apply" : "btn btn--tinted an-apply"}>
          Aplicar
        </button>
      </form>
      {view === "day" ? (
        <div className="an-day-hint" role="status">
          <span>Viendo un solo día.</span>
          <button type="button" className="btn btn--plain an-link" onClick={onShowTrends}>
            Ver tendencias
          </button>
        </div>
      ) : null}
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <section className="card an-empty state" role="status">
      <svg className="state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3.5 4v16.5H20" />
        <path d="M7 15.5l4-4.5 3 2.5 5-6" />
      </svg>
      <p className="state-title">{title}</p>
      <p className="state-text">{text}</p>
    </section>
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
    return <EmptyState title="Sin registros todavía" text="Aún no hay registros en los últimos 60 días." />;
  }

  const rangeLabel = `${formatShortDate(range.from)} – ${formatShortDate(range.to)}`;

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
          <div className="an-range">
            <h3 className="an-range-title">{rangeLabel}</h3>
            <span className="an-range-days">{keys.length} días</span>
          </div>
          <RangeCharts keys={keys} byDate={byDate} molestias={molestias} rangeLabel={rangeLabel} />
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

  const sleepNums = sleepH.filter((v): v is number => v !== null);
  const sleepYMax = sleepNums.length ? Math.max(10, Math.ceil(Math.max(...sleepNums))) : 10;

  const anyData = keys.some((k) => hasAnyMetric(byDate[k] ?? emptyDiaryStub(k)));

  if (!anyData) {
    return <EmptyState title="Sin datos en este periodo" text={`No hay registros en ${rangeLabel}. Prueba con un periodo más largo.`} />;
  }

  const from = keys[0]!;
  const to = keys[keys.length - 1]!;
  const sleepStats = stats(sleepH);
  const sleepQStats = stats(sleepQ);
  const hrvStats = stats(hrv);
  const restingStats = stats(resting);
  const rpeStats = stats(rpe);

  return (
    <>
      <div className="an-grid">
        <MetricCard title="Sueño" unit="h" {...sleepStats} digits={1}>
          <Chart kind="line" points={sleepH} scale={fixedScale(0, sleepYMax)} avg={sleepStats.avg} from={from} to={to} />
        </MetricCard>
        <MetricCard title="Calidad del sueño" unit="/100" {...sleepQStats} digits={0}>
          <Chart kind="line" points={sleepQ} scale={fixedScale(0, 100)} avg={sleepQStats.avg} from={from} to={to} />
        </MetricCard>
        <MetricCard title="HRV" unit="ms" {...hrvStats} digits={0}>
          <Chart kind="line" points={hrv} scale={autoScale(hrv)} avg={hrvStats.avg} from={from} to={to} />
        </MetricCard>
        <MetricCard title="Pulso en reposo" unit="lpm" {...restingStats} digits={0}>
          <Chart kind="line" points={resting} scale={autoScale(resting)} avg={restingStats.avg} from={from} to={to} />
        </MetricCard>
        <MetricCard title="RPE" unit="/10" {...rpeStats} digits={1}>
          <Chart kind="bar" points={rpe} scale={fixedScale(0, 10)} avg={rpeStats.avg} from={from} to={to} />
        </MetricCard>
      </div>
      <section className="card an-molestias" aria-labelledby="an-mol-title">
        <div className="an-mol-head">
          <h3 id="an-mol-title">Molestias</h3>
          {molestias.length ? <span className="an-mol-count">{molestias.length}</span> : null}
        </div>
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
          <p className="an-mol-none">Sin molestias registradas en {rangeLabel}.</p>
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
