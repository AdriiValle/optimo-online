"use client";

import { addDays, dateKey, DOW_ES, DOW_FULL, MONTHS_ES, parseDateLocal } from "@/lib/dates";
import { LOAD_TINT_FROM, loadClassForDay } from "@/lib/plan";
import type { DayPlan } from "@/lib/types";

const SAUNA_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3.5 14c-2-2 2-3.5 0-5.5s2-3.5 0-5.5" />
    <path d="M8 14c-2-2 2-3.5 0-5.5s2-3.5 0-5.5" />
    <path d="M12.5 14c-2-2 2-3.5 0-5.5s2-3.5 0-5.5" />
  </svg>
);

function hasSauna(p: DayPlan | undefined) {
  return !!p?.sauna || !!p?.blocks.some((b) => b.kind === "protocol" && b.protocolId === "sauna-exposicion");
}

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

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

export type CalendarView = "week" | "month";

type Props = {
  byDate: Record<string, DayPlan>;
  crests: Record<string, string>;
  year: number;
  month: number;
  center: string;
  today: string;
  onMonthChange: (year: number, month: number) => void;
  onSelect: (iso: string) => void;
  /** Con `view` + `onViewChange` el calendario es una cinta semanal que se despliega a mes (jugador). Sin ellos, mes fijo (nutricionista). */
  view?: CalendarView;
  onViewChange?: (view: CalendarView) => void;
};

/** Calendario MD/partidos/carga (ficha deportista y vista nutricionista). */
export function PlanCalendar({ byDate, crests, year, month, center, today, onMonthChange, onSelect, view, onViewChange }: Props) {
  const collapsible = view !== undefined && onViewChange !== undefined;
  const mode: CalendarView = collapsible ? view : "month";
  const centerDate = parseDateLocal(center);
  const navYear = mode === "week" ? centerDate.getFullYear() : year;
  const navMonth = mode === "week" ? centerDate.getMonth() : month;
  const cells = mode === "week" ? weekCells(center) : monthCells(year, month);
  const title = `${MONTHS_ES[navMonth]} ${navYear}`;
  const hasPlan = cells.some((c) => c && byDate[dateKey(c)]);

  const step = (dir: -1 | 1) => {
    if (mode === "week") {
      onSelect(dateKey(addDays(centerDate, dir * 7)));
      return;
    }
    if (dir === -1) {
      if (month === 0) onMonthChange(year - 1, 11);
      else onMonthChange(year, month - 1);
    } else if (month === 11) onMonthChange(year + 1, 0);
    else onMonthChange(year, month + 1);
  };
  const stepLabel = mode === "week" ? ["Semana anterior", "Semana siguiente"] : ["Mes anterior", "Mes siguiente"];

  return (
    <section className={`card cal-compact cal-compact--${mode}`} aria-label="Calendario">
      <div className="cal-nav">
        {collapsible ? (
          <button
            type="button"
            className="cal-title"
            aria-expanded={mode === "month"}
            onClick={() => onViewChange(mode === "week" ? "month" : "week")}
          >
            <span className="cal-title-text">{title}</span>
            <span className="sr-only">{mode === "week" ? ", ver mes" : ", ver semana"}</span>
            <Chevron dir="right" />
          </button>
        ) : (
          <h2 className="cal-title">{title}</h2>
        )}
        <span className="cal-nav-spacer" />
        {collapsible && center !== today ? (
          <button type="button" className="cal-today" onClick={() => onSelect(today)}>
            Hoy
          </button>
        ) : null}
        <button type="button" className="icon-btn cal-step" aria-label={stepLabel[0]} onClick={() => step(-1)}>
          <Chevron dir="left" />
        </button>
        <button type="button" className="icon-btn cal-step" aria-label={stepLabel[1]} onClick={() => step(1)}>
          <Chevron dir="right" />
        </button>
      </div>
      <div className="cal-grid" aria-hidden="true">
        {DOW_ES.map((d) => (
          <div key={d} className="cal-dow">
            {d}
          </div>
        ))}
      </div>
      <div className="cal-grid cal-days" key={`${mode}-${mode === "week" ? dateKey(cells[0] as Date) : `${year}-${month}`}`}>
        {cells.map((cell, i) => {
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
          const label = [
            `${DOW_FULL[cell.getDay()]} ${cell.getDate()} de ${MONTHS_ES[cell.getMonth()].toLowerCase()}`,
            iso === today ? "hoy" : null,
            p?.mdTag ?? null,
            hasSauna(p) ? "sauna" : null,
            p?.matchOpponent ? `partido contra ${p.matchOpponent}${p.matchVenue ? (p.matchVenue === "casa" ? ", en casa" : ", fuera") : ""}` : null
          ]
            .filter(Boolean)
            .join(", ");
          return (
            <button
              key={iso}
              type="button"
              className={cls.join(" ")}
              aria-label={label}
              aria-pressed={iso === center}
              onClick={() => onSelect(iso)}
            >
              <span className="cal-num">{cell.getDate()}</span>
              <span className="cal-meta">
                {crest ? (
                  <img className="crest" src={crest} alt="" />
                ) : p?.mdTag ? (
                  <span className="md-tag">{p.mdTag}</span>
                ) : null}
              </span>
              {hasSauna(p) ? <span className="sauna-icon">{SAUNA_SVG}</span> : null}
              {p?.matchVenue ? <span className="venue-icon">{VENUE_SVG[p.matchVenue]}</span> : null}
            </button>
          );
        })}
      </div>
      {collapsible && !hasPlan ? (
        <p className="cal-empty" role="status">
          <strong>{mode === "week" ? "Semana sin plan" : "Mes sin plan"}</strong>
          <span>{mode === "week" ? "Aún no hay sesiones programadas para esta semana." : "Aún no hay sesiones programadas para este mes."}</span>
        </p>
      ) : null}
    </section>
  );
}

function weekCells(center: string) {
  const d = parseDateLocal(center);
  const monday = addDays(d, -((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
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
