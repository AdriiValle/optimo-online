"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, dateKey, DOW_ES, DOW_SHORT, formatLongDate, MONTHS_ES, parseDateLocal, todayKey } from "@/lib/dates";
import { LOAD_TINT_FROM, loadClassForMdTag } from "@/lib/plan";
import type { Athlete, DayPlan, Diary, Injury } from "@/lib/types";

const VENUE_SVG = {
  casa: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1 1 7v7h5V9h4v5h5V7L8 1z"/></svg>',
  fuera: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M14.8 8.1 11 7.8 9.6 5.2H7.4L6 7.8 2.2 8.1 1 9.4l1.6.7 2.3-.2.7 2.4H6l.6-1.8h2.8l.6 1.8h1.4l.7-2.4 2.3.2 1.6-.7-1.2-1.3z"/></svg>'
};

type Props = {
  athlete: Athlete;
  plans: DayPlan[];
  diary: Diary | null;
  injuries: Injury[];
  crests: Record<string, string>;
  canEdit: boolean;
};

function emptyDiary(athleteId: string, date: string): Diary {
  return {
    athleteId,
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

export function HomeClient({ athlete, plans, diary, injuries, crests, canEdit }: Props) {
  const [planRows, setPlanRows] = useState(plans);
  const byDate = useMemo(() => Object.fromEntries(planRows.map((p) => [p.date, p])), [planRows]);
  const today = todayKey();
  const firstMatch = plans.find((p) => p.matchOpponent)?.date ?? today;
  const initial = byDate[today] ? today : firstMatch;
  const seed = parseDateLocal(initial);
  const [year, setYear] = useState(seed.getFullYear());
  const [month, setMonth] = useState(seed.getMonth());
  const [center, setCenter] = useState(initial);
  const [dayDiary, setDayDiary] = useState<Diary>(diary ?? emptyDiary(athlete.id, initial));
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);
  const [diaryMsg, setDiaryMsg] = useState<string | null>(null);
  const [photoKey, setPhotoKey] = useState(0);

  const serverDate = diary?.date ?? initial;

  useEffect(() => {
    if (center === serverDate) {
      setDayDiary(diary ?? emptyDiary(athlete.id, center));
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/diaries?athleteId=${athlete.id}&date=${center}`);
      if (!res.ok || cancelled) return;
      const json = await res.json();
      if (cancelled) return;
      setDayDiary(json.data ?? emptyDiary(athlete.id, center));
      if (Array.isArray(json.blocks)) {
        setPlanRows((rows) => rows.map((p) => (p.date === center ? { ...p, blocks: json.blocks } : p)));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [athlete.id, center, diary, serverDate]);

  function selectDate(iso: string) {
    const d = parseDateLocal(iso);
    setCenter(iso);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setDiaryMsg(null);
  }

  const plan = byDate[center];
  const football = athlete.sport === "football";
  const running = athlete.sport === "running";

  const calendar = (
    <>
      <section className="card" aria-label="Calendario">
        <div className="cal-nav">
          <button
            type="button"
            className="icon-btn"
            aria-label="Mes anterior"
            onClick={() => {
              const next = month - 1;
              if (next < 0) {
                setMonth(11);
                setYear(year - 1);
              } else setMonth(next);
            }}
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
            onClick={() => {
              const next = month + 1;
              if (next > 11) {
                setMonth(0);
                setYear(year + 1);
              } else setMonth(next);
            }}
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
              const load = loadClassForMdTag(p?.mdTag ?? null);
              if (load) cls.push(load);
            }
            const crest = p?.matchOpponent ? crests[p.matchOpponent] : null;
            return (
              <button key={iso} type="button" className={cls.join(" ")} onClick={() => selectDate(iso)}>
                {p?.mdTag ? <span className="md-tag">{p.mdTag}</span> : null}
                <span className="day-num">{cell.getDate()}</span>
                {p?.matchVenue ? (
                  <span
                    className="venue-icon"
                    dangerouslySetInnerHTML={{ __html: VENUE_SVG[p.matchVenue] }}
                  />
                ) : null}
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

      <section className="card" aria-label="Semana en cinta">
        <div className="week-tape">
          <button type="button" className="icon-btn" onClick={() => selectDate(dateKey(addDays(parseDateLocal(center), -1)))}>
            ‹
          </button>
          <div className="tape-segmented">
            <div className="tape-strip">
              {tapeDays(center).map((d, idx) => {
                const iso = dateKey(d);
                const p = byDate[iso];
                const active = iso === center;
                const cls = ["tape-day", active ? "active" : "", idx === 0 || idx === 6 ? "side" : ""]
                  .filter(Boolean)
                  .join(" ");
                const crest = p?.matchOpponent ? crests[p.matchOpponent] : null;
                return (
                  <button key={iso} type="button" className={cls} onClick={() => selectDate(iso)}>
                    <span className="tape-dow">{DOW_SHORT[d.getDay()]}</span>
                    <span className="tape-num">{d.getDate()}</span>
                    {p?.mdTag ? <span className="md-tag">{p.mdTag}</span> : null}
                    {crest ? <img className="crest" src={crest} alt="" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={() => selectDate(dateKey(addDays(parseDateLocal(center), 1)))}>
            ›
          </button>
        </div>
        <div className="day-focus">
          <div className="day-focus-heading">
            <h3>{formatLongDate(parseDateLocal(center))}</h3>
            {plan?.mdTag ? <span className="day-focus-md">{plan.mdTag}</span> : null}
            {plan?.minutes ? <p className="day-focus-duration">Sesión ~{plan.minutes} min</p> : null}
          </div>
          <SessionTable plan={plan} />
        </div>
      </section>
    </>
  );

  const recovery = (
    <section className="card">
      <div className="recovery-strip">
        <div>
          <h2>Recuperación</h2>
          <p className="muted">Hoy · proveedor Whoop desconectado</p>
        </div>
        <div className="recovery-value">{dayDiary.date === today && dayDiary.recovery !== null ? dayDiary.recovery : "—"}</div>
      </div>
    </section>
  );

  const photo = (
    <section className="card">
      <h2>Foto</h2>
      <div className="photo-block">
        <img
          className="avatar"
          src={athlete.hasPhoto ? `/api/athletes/${athlete.id}/photo?t=${photoKey}` : "/logo-optimo.png"}
          alt={athlete.name}
        />
        {canEdit ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setPhotoMsg(null);
              const file = (e.currentTarget.elements.namedItem("photo") as HTMLInputElement).files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.set("photo", file);
              const res = await fetch(`/api/athletes/${athlete.id}/photo`, { method: "POST", body: fd });
              if (res.status === 422) {
                const json = await res.json().catch(() => null);
                setPhotoMsg(json?.error?.message ?? "La foto no es válida.");
                return;
              }
              if (!res.ok) {
                setPhotoMsg("No se pudo subir.");
                return;
              }
              setPhotoKey((n) => n + 1);
              setPhotoMsg("Foto actualizada.");
            }}
          >
            <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
            <button className="btn" type="submit">
              Subir (máx 400 KB)
            </button>
          </form>
        ) : null}
      </div>
      {photoMsg ? <p className={photoMsg.includes("400") || photoMsg.includes("válida") ? "error" : "ok"}>{photoMsg}</p> : null}
    </section>
  );

  const diaryForm = (
    <section className="card">
      <h2>Diario del día</h2>
      {diaryMsg ? <p className={diaryMsg === "Guardado." ? "ok" : "error"}>{diaryMsg}</p> : null}
      {dayDiary.date === center ? (
      <form
        key={center}
        className="form-grid"
        onSubmit={async (e) => {
          e.preventDefault();
          setDiaryMsg(null);
          const fd = new FormData(e.currentTarget);
          const num = (k: string) => {
            const v = String(fd.get(k) ?? "").trim();
            return v === "" ? null : Number(v);
          };
          const res = await fetch("/api/diaries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              athleteId: athlete.id,
              date: center,
              sleepHours: num("sleepHours"),
              sleepQuality: num("sleepQuality"),
              recovery: num("recovery"),
              hrv: num("hrv"),
              restingHr: num("restingHr"),
              rpe: num("rpe"),
              feeling: num("feeling"),
              km: running ? num("km") : null,
              avgHr: running ? num("avgHr") : null,
              dietNote: String(fd.get("dietNote") ?? "") || null,
              freeNote: String(fd.get("freeNote") ?? "") || null
            })
          });
          if (!res.ok) {
            setDiaryMsg("No se pudo guardar.");
            return;
          }
          const json = await res.json();
          setDayDiary(json.data);
          setDiaryMsg("Guardado.");
        }}
      >
        {running ? (
          <>
            <label className="span-2">
              Km
              <input name="km" type="number" step="0.1" defaultValue={dayDiary.km ?? ""} key={`km-${center}`} />
            </label>
            <label>
              Sensación 1–5
              <input name="feeling" type="number" min={1} max={5} defaultValue={dayDiary.feeling ?? ""} key={`feel-${center}`} />
            </label>
            <label>
              Pulso medio
              <input name="avgHr" type="number" defaultValue={dayDiary.avgHr ?? ""} key={`avg-${center}`} />
            </label>
          </>
        ) : null}
        <label>
          Sueño (h)
          <input name="sleepHours" type="number" step="0.1" defaultValue={dayDiary.sleepHours ?? ""} key={`sh-${center}`} />
        </label>
        <label>
          Calidad 1–5
          <input name="sleepQuality" type="number" min={1} max={5} defaultValue={dayDiary.sleepQuality ?? ""} key={`sq-${center}`} />
        </label>
        <label>
          Recuperación 0–100
          <input name="recovery" type="number" min={0} max={100} defaultValue={dayDiary.recovery ?? ""} key={`rc-${center}`} />
        </label>
        <label>
          HRV
          <input name="hrv" type="number" defaultValue={dayDiary.hrv ?? ""} key={`hrv-${center}`} />
        </label>
        <label>
          Pulso reposo
          <input name="restingHr" type="number" defaultValue={dayDiary.restingHr ?? ""} key={`rhr-${center}`} />
        </label>
        <label>
          RPE 1–10
          <input name="rpe" type="number" min={1} max={10} defaultValue={dayDiary.rpe ?? ""} key={`rpe-${center}`} />
        </label>
        {!running ? (
          <label>
            Sensación 1–5
            <input name="feeling" type="number" min={1} max={5} defaultValue={dayDiary.feeling ?? ""} key={`feel-${center}`} />
          </label>
        ) : null}
        <label className="span-2">
          Dieta
          <textarea name="dietNote" defaultValue={dayDiary.dietNote ?? ""} key={`dn-${center}`} />
        </label>
        <label className="span-2">
          Nota
          <textarea name="freeNote" defaultValue={dayDiary.freeNote ?? ""} key={`fn-${center}`} />
        </label>
        <div className="span-2">
          <button className="btn" type="submit">
            Guardar diario
          </button>
        </div>
      </form>
      ) : (
        <p className="muted">Cargando el día…</p>
      )}
    </section>
  );

  const extras = (
    <>
      <section className="card">
        <h2>Dieta vigente</h2>
        <p>{athlete.dietNotes || "Sin texto aún."}</p>
      </section>
      <section className="card">
        <h2>Rutina de sueño</h2>
        <p>{athlete.sleepRoutine || "Sin texto aún."}</p>
      </section>
      <section className="card">
        <h2>Lesiones</h2>
        {injuries.length ? (
          injuries.map((inj) => (
            <p key={inj.id}>
              {inj.zone} · {inj.status === "open" ? "abierta" : "cerrada"}
              {inj.note ? ` · ${inj.note}` : ""}
            </p>
          ))
        ) : (
          <p className="muted">Ninguna abierta.</p>
        )}
      </section>
    </>
  );

  return (
    <>
      {photo}
      {recovery}
      {football ? (
        <>
          {calendar}
          {diaryForm}
        </>
      ) : (
        <>
          {diaryForm}
          {calendar}
        </>
      )}
      {extras}
    </>
  );
}

function SessionTable({ plan }: { plan?: DayPlan }) {
  const rows = plan?.blocks ?? [{ kind: "note" as const, text: "Sin bloque asignado para este día." }];
  return (
    <div className="content-table-wrap">
      <table className="content-table">
        <thead>
          <tr>
            <th>Ejercicio</th>
            <th>Cantidad</th>
            <th>Vídeo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            if (row.kind === "section") {
              return (
                <tr key={i} className="section-head">
                  <td colSpan={3}>{row.title}</td>
                </tr>
              );
            }
            if (row.kind === "note" || row.kind === "match") {
              return (
                <tr key={i} className="day-note">
                  <td colSpan={3}>{row.text}</td>
                </tr>
              );
            }
            return (
              <tr key={i}>
                <td>{row.label}</td>
                <td className={row.qty ? "" : "empty"}>{row.qty || "—"}</td>
                <td className="empty">—</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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

function tapeDays(centerIso: string) {
  const center = parseDateLocal(centerIso);
  return Array.from({ length: 7 }, (_, i) => addDays(center, i - 3));
}
