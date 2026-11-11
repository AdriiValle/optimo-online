"use client";

import { dateKey, DOW_ES, MONTHS_ES } from "@/lib/dates";
import { LOAD_TINT_FROM, loadClassForDay } from "@/lib/plan";
import type { DayPlan } from "@/lib/types";

const VENUE_SVG = {
  casa: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1 1 7v7h5V9h4v5h5V7L8 1z" />
    </svg>
  ),
  fuera: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M14.8 8.1 11 7.8 9.6 5.2H7.4L6 7.8 2.2 8.1 1 9.4l1.6.7 2.3-.2.7 2.4H6l.6-1.8h2.8l.6 1.8h1.4l.7-2.4 2.3.2 1.6-.7-1.2-1.3z" />
    </svg>
  )
};

type Props = {
  byDate: Record<string, DayPlan>;
  crests: Record<string, string>;
  year: number;
  month: number;
  center: string;
  today: string;
  onMonthChange: (year: number, month: number) => void;
  onSelect: (iso: string) => void;
};

/** Calendario mensual MD/partidos/carga (ficha deportista y vista nutricionista). */
export function PlanCalendar({ byDate, crests, year, month, center, today, onMonthChange, onSelect }: Props) {
  return (
    <section className="card cal-compact" aria-label="Calendario">
      <div className="cal-nav">
        <button
          type="button"
          className="icon-btn"
          aria-label="Mes anterior"
          onClick={() => (month === 0 ? onMonthChange(year - 1, 11) : onMonthChange(year, month - 1))}
        >
          ‹
        </button>
        <h2>
          {MONTHS_ES[month]} {year}
        </h2>
        <button
          type="button"
          className="icon-btn"
          aria-label="Mes siguiente"
          onClick={() => (month === 11 ? onMonthChange(year + 1, 0) : onMonthChange(year, month + 1))}
        >
          ›
        </button>
      </div>
      <div className="cal-grid">
        {DOW_ES.map((d) => (
          <div key={d} className="cal-dow">
            {d}
          </div>
        ))}
      </div>
      <div className="cal-grid">
        {monthCells(year, month).map((cell, i) => {
          if (!cell) return <div key={`e-${i}`} className="cal-day empty" />;
          const iso = dateKey(cell);
          const p = byDate[iso];
          const cls = ["cal-day"];
          if (iso === today) cls.push("today");
          if (iso === center) cls.push("cal-highlight");
          if (p?.matchOpponent) cls.push("match");
          if (iso >= LOAD_TINT_FROM) {
            const load = loadClassForDay(iso, p?.mdTag ?? null);
            if (load) cls.push(load);
          }
          const crest = p?.matchOpponent ? crests[p.matchOpponent] : null;
          return (
            <button key={iso} type="button" className={cls.join(" ")} onClick={() => onSelect(iso)}>
              {p?.mdTag ? <span className="md-tag">{p.mdTag}</span> : null}
              <span className="day-num">{cell.getDate()}</span>
              {p?.matchVenue ? <span className="venue-icon">{VENUE_SVG[p.matchVenue]}</span> : null}
              {crest ? (
                <span className="crest-wrap">
                  <img className="crest" src={crest} alt={p?.matchOpponent ?? ""} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function monthCells(year: number, month: number) {
  const first = new Date(year, month, 1);
  let startPad = first.getDay() - 1;
  if (startPad < 0) startPad = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month, day));
  return cells;
}
