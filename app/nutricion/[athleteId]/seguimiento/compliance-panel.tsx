import type { MealCheckStatus } from "@/lib/types";
import { MEAL_SLOTS } from "@/lib/types";
import { addDays, dateKey, parseDateLocal } from "@/lib/dates";
import type { DayType } from "@/lib/nutrition/day-type";
import {
  complianceScore,
  type CheckEntry,
  type ComplianceCount,
  type TrackingCompliance,
} from "@/lib/nutrition/tracking-queries";
import { dayDate, fmtPct, shortDate } from "./format";

const DAY_TYPE_LABEL: Record<DayType, string> = { training: "Entreno", match: "Partido", rest: "Descanso" };
const STATUS: Record<MealCheckStatus, { label: string; glyph: string }> = {
  done: { label: "Hecho", glyph: "✓" },
  half: { label: "A medias", glyph: "½" },
  missed: { label: "No", glyph: "✕" },
};
const SLOT_LABEL = Object.fromEntries(MEAL_SLOTS.map((s) => [s.slot, s.label])) as Record<string, string>;

const marked = (c: ComplianceCount) => c.done + c.half + c.missed;

function countLabel(c: ComplianceCount, short = false) {
  const n = marked(c);
  if (short) return `${n} de ${c.planned} ${n === 1 ? "marcada" : "marcadas"}`;
  return `${n} de ${c.planned} ${c.planned === 1 ? "comida marcada" : "comidas marcadas"}`;
}

function barLabel(c: ComplianceCount) {
  const unmarked = c.planned - marked(c);
  return `${c.done} hechas, ${c.half} a medias, ${c.missed} no, ${unmarked} sin marcar`;
}

/** Barra apilada: hecho · a medias · no · sin marcar (el resto de la pista). */
function ComplianceBar({ c }: { c: ComplianceCount }) {
  const pct = (n: number) => (c.planned ? `${(n / c.planned) * 100}%` : "0%");
  return (
    <span className="nut-trk-bar" role="img" aria-label={barLabel(c)}>
      <span className="nut-trk-bar-seg nut-trk-bar-seg--done" style={{ width: pct(c.done) }} />
      <span className="nut-trk-bar-seg nut-trk-bar-seg--half" style={{ width: pct(c.half) }} />
      <span className="nut-trk-bar-seg nut-trk-bar-seg--missed" style={{ width: pct(c.missed) }} />
    </span>
  );
}

function Score({ c }: { c: ComplianceCount }) {
  const s = complianceScore(c);
  return <span className="nut-trk-score">{s == null ? "—" : fmtPct(s)}</span>;
}

function weekLabel(weekStart: string, today: string) {
  const end = dateKey(addDays(parseDateLocal(weekStart), 6));
  if (today >= weekStart && today <= end) return "Esta semana";
  const [ds, de] = [shortDate(weekStart), shortDate(end)];
  // «3–9 nov» si es el mismo mes; «27 oct – 2 nov» si cruza.
  return ds.split(" ")[1] === de.split(" ")[1] ? `${ds.split(" ")[0]}–${de}` : `${ds} – ${de}`;
}

function CheckCard({ e }: { e: CheckEntry }) {
  const st = STATUS[e.status];
  return (
    <li className="nut-trk-check">
      <div className="nut-trk-check-head">
        <div className="nut-trk-check-when">
          <span className="nut-trk-check-slot">{SLOT_LABEL[e.slot] ?? e.slot}</span>
          <span className="nut-trk-check-date">
            {dayDate(e.date)} · {DAY_TYPE_LABEL[e.dayType]}
          </span>
        </div>
        <span className={`nut-trk-status nut-trk-status--${e.status}`}>
          <span aria-hidden="true">{st.glyph}</span> {st.label}
        </span>
      </div>
      {e.hasPlanPhoto || e.hasPhoto ? (
        <div className="nut-trk-photos">
          <figure className="nut-trk-photo">
            {e.hasPlanPhoto ? (
              <img src={`/api/meals/${e.mealSlotId}/photo`} alt={`Plato del plan: ${e.title || "sin título"}`} loading="lazy" />
            ) : (
              <span className="nut-trk-photo-empty">Sin foto</span>
            )}
            <figcaption>Plan</figcaption>
          </figure>
          <figure className="nut-trk-photo">
            {e.hasPhoto ? (
              <img src={`/api/nutrition/tracking/checks/${e.mealSlotId}/photo`} alt="Foto del jugador" loading="lazy" />
            ) : (
              <span className="nut-trk-photo-empty">Sin foto</span>
            )}
            <figcaption>Real</figcaption>
          </figure>
        </div>
      ) : null}
      {e.title ? <p className="nut-trk-check-title">{e.title}</p> : null}
      {e.note ? (
        <blockquote className="nut-trk-note">
          <span className="nut-trk-note-label">Comentario del jugador</span>
          <p>{e.note}</p>
        </blockquote>
      ) : null}
    </li>
  );
}

/** Cumplimiento por semana y por tipo de día, y las comidas con foto o comentario del jugador. */
export function CompliancePanel({ compliance }: { compliance: TrackingCompliance }) {
  const { byDayType, entries, to } = compliance;
  // Las semanas más antiguas sin menú no aportan nada: la lista empieza en la primera con comidas.
  const lastWithMenu = compliance.weeks.findLastIndex((w) => w.planned > 0);
  const weeks = compliance.weeks.slice(0, Math.max(1, lastWithMenu + 1));
  const total = weeks.reduce<ComplianceCount>(
    (a, w) => ({ planned: a.planned + w.planned, done: a.done + w.done, half: a.half + w.half, missed: a.missed + w.missed }),
    { planned: 0, done: 0, half: 0, missed: 0 },
  );
  const anyMarked = marked(total) > 0;

  return (
    <section className="nut-trk-block" aria-labelledby="nut-trk-comp-title">
      <div className="nut-trk-block-head">
        <h3 id="nut-trk-comp-title" className="nut-trk-block-title">
          Cumplimiento del menú
        </h3>
        <p className="nut-trk-block-sub">
          Últimas {compliance.weeks.length} semanas. ✓ cuenta entero, ½ la mitad, ✕ nada; solo sobre lo que ha marcado el jugador.
        </p>
      </div>

      {!anyMarked ? (
        <div className="state nut-section-state nut-trk-empty">
          <svg
            className="state-icon"
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="3.5" width="16" height="17" rx="3" />
            <path d="m8 9 1.5 1.5L12 8" />
            <path d="M14 9.5h2.5" />
            <path d="m8 15 1.5 1.5L12 14" />
            <path d="M14 15.5h2.5" />
          </svg>
          <h4 className="state-title">Aún no hay comidas marcadas</h4>
          <p className="state-text">
            {total.planned
              ? `Hay ${total.planned} comidas en el menú de estas semanas. Cuando el jugador las marque (hecho, a medias o no), verás aquí su cumplimiento.`
              : "Cuando haya menú y el jugador marque sus comidas (hecho, a medias o no), verás aquí su cumplimiento por semana y por tipo de día."}
          </p>
        </div>
      ) : (
        <>
          <ul className="nut-trk-types" aria-label="Por tipo de día">
            {byDayType.map((d) => (
              <li key={d.dayType} className="nut-trk-type">
                <span className="nut-trk-type-label">{DAY_TYPE_LABEL[d.dayType]}</span>
                <Score c={d} />
                <ComplianceBar c={d} />
                <span className="nut-trk-meta">{d.planned ? countLabel(d, true) : "Sin comidas"}</span>
              </li>
            ))}
          </ul>

          <p className="list-group-title nut-trk-legend">
            <span>
              <i className="nut-trk-dot nut-trk-dot--done" aria-hidden="true" />
              Hecho
            </span>
            <span>
              <i className="nut-trk-dot nut-trk-dot--half" aria-hidden="true" />A medias
            </span>
            <span>
              <i className="nut-trk-dot nut-trk-dot--missed" aria-hidden="true" />
              No
            </span>
            <span>
              <i className="nut-trk-dot" aria-hidden="true" />
              Sin marcar
            </span>
          </p>
          <ul className="list-group nut-trk-weeks" aria-label="Por semana">
            {weeks.map((w) => (
              <li key={w.weekStart} className="nut-trk-week">
                <span className="nut-trk-week-label">
                  <span className="nut-trk-week-name">{weekLabel(w.weekStart, to)}</span>
                  <span className="nut-trk-meta">{w.planned ? countLabel(w) : "Sin menú"}</span>
                </span>
                <ComplianceBar c={w} />
                <Score c={w} />
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="nut-trk-block-head nut-trk-block-head--sub">
        <h3 className="nut-trk-block-title nut-trk-block-title--sm">Fotos y comentarios</h3>
        <p className="nut-trk-block-sub">La foto del jugador junto a la del plan.</p>
      </div>
      {entries.length ? (
        <ul className="nut-trk-checks">
          {entries.slice(0, 24).map((e) => (
            <CheckCard key={e.mealSlotId} e={e} />
          ))}
        </ul>
      ) : (
        <p className="nut-trk-none">Aún no hay fotos ni comentarios del jugador.</p>
      )}
    </section>
  );
}
