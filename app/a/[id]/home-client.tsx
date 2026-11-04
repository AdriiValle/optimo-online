"use client";

import { useEffect, useMemo, useState } from "react";
import { dateKey, DOW_ES, formatLongDate, MONTHS_ES, parseDateLocal, todayKey } from "@/lib/dates";
import { LOAD_TINT_FROM, loadClassForMdTag } from "@/lib/plan";
import type { Athlete, DayPlan, Diary, Injury, IntegrationInfo } from "@/lib/types";
import { capabilitiesFor, isDeviceField } from "@/lib/integrations/capabilities";
import { Analisis, type AnalysisView } from "./analisis";
import { NutritionPane } from "./nutrition-pane";
import { SessionList } from "./session-list";
import { DeviceCard, IntegrationAdminChip } from "./device-card";

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
  athlete: Athlete;
  plans: DayPlan[];
  diary: Diary | null;
  injuries: Injury[];
  crests: Record<string, string>;
  canEdit: boolean;
  isAdmin: boolean;
  history: Diary[] | null;
  historyFrom: string;
  historyTo: string;
  polarIntegration: IntegrationInfo;
  polarConfigured: boolean;
  adminIntegration: IntegrationInfo | null;
  callbackDevice?: string | null;
  callbackMsg?: string | null;
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
    freeNote: null,
    deviceSource: null,
    deviceSyncedAt: null
  };
}

export function HomeClient({
  athlete,
  plans,
  diary,
  injuries,
  crests,
  canEdit,
  isAdmin,
  history,
  historyFrom,
  historyTo,
  polarIntegration: initialPolar,
  polarConfigured,
  adminIntegration,
  callbackDevice,
  callbackMsg
}: Props) {
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
  const [pane, setPane] = useState<"train" | "food" | "log" | "stats">("train");
  const [analysisView, setAnalysisView] = useState<AnalysisView>("range");
  const [analysisRangeDays, setAnalysisRangeDays] = useState(30);
  const [polarIntegration, setPolarIntegration] = useState(initialPolar);

  const polarConnected = polarIntegration.status === "connected";
  const deviceCaps = capabilitiesFor(polarConnected ? "polar" : null);

  const deviceLabel = (field: "sleepHours" | "sleepQuality" | "recovery" | "hrv" | "restingHr") => {
    if (polarConnected && isDeviceField("polar", field) && dayDiary.deviceSource === "polar") {
      return " (Polar)";
    }
    return "";
  };

  function readonlyMetric(label: string, value: string | number | null) {
    return (
      <label>
        {label}
        <div className="device-readonly" aria-readonly="true">
          {value ?? "—"}
        </div>
      </label>
    );
  }

  const serverDate = diary?.date ?? initial;

  const analysisDayRecord = useMemo(() => {
    const fromHistory = history?.find((d) => d.date === center);
    if (fromHistory) return fromHistory;
    if (dayDiary.date === center) return dayDiary;
    return emptyDiary(athlete.id, center);
  }, [history, center, dayDiary, athlete.id]);

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
    if (pane === "stats") setAnalysisView("day");
  }

  const plan = byDate[center];
  const football = athlete.sport === "football";
  const running = athlete.sport === "running";

  const calendar = (
    <>
      <section className="card cal-compact" aria-label="Calendario">
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
                  <span className="venue-icon">{VENUE_SVG[p.matchVenue]}</span>
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
    </>
  );

  async function uploadPhoto(file: File) {
    setPhotoMsg(null);
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
  }

  const diaryForm = (
    <>
      <DeviceCard
        athleteId={athlete.id}
        centerDate={center}
        integration={polarIntegration}
        configured={polarConfigured}
        onIntegrationChange={setPolarIntegration}
        onDiarySynced={(d) => setDayDiary(d as Diary)}
        callbackDevice={callbackDevice}
        callbackMsg={callbackMsg}
      />
      <section className="card">
        <h2>Registro</h2>
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
            const body: Record<string, unknown> = {
              athleteId: athlete.id,
              date: center,
              rpe: num("rpe"),
              dietNote: String(fd.get("molestias") ?? "").trim() || null,
              freeNote: String(fd.get("freeNote") ?? "") || null
            };
            if (running) {
              body.km = num("km");
              body.avgHr = num("avgHr");
            }
            if (!polarConnected || !deviceCaps.sleepHours) body.sleepHours = num("sleepHours");
            if (!polarConnected || !deviceCaps.sleepQuality) body.sleepQuality = num("sleepQuality");
            if (!polarConnected || !deviceCaps.recovery) body.recovery = num("recovery");
            if (!polarConnected || !deviceCaps.hrv) body.hrv = num("hrv");
            if (!polarConnected || !deviceCaps.restingHr) body.restingHr = num("restingHr");
            const res = await fetch("/api/diaries", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body)
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
                Pulso medio
                <input name="avgHr" type="number" defaultValue={dayDiary.avgHr ?? ""} key={`avg-${center}`} />
              </label>
            </>
          ) : null}
          {polarConnected && deviceCaps.sleepHours ? (
            readonlyMetric(`Sueño (h)${deviceLabel("sleepHours")}`, dayDiary.sleepHours)
          ) : (
            <label>
              Sueño (h)
              <input name="sleepHours" type="number" step="0.1" defaultValue={dayDiary.sleepHours ?? ""} key={`sh-${center}`} />
            </label>
          )}
          {polarConnected && deviceCaps.sleepQuality ? (
            readonlyMetric(`Calidad 1–100${deviceLabel("sleepQuality")}`, dayDiary.sleepQuality)
          ) : (
            <label>
              Calidad 1–100
              <input name="sleepQuality" type="number" min={1} max={100} defaultValue={dayDiary.sleepQuality ?? ""} key={`sq-${center}`} />
            </label>
          )}
          {polarConnected && deviceCaps.recovery ? (
            readonlyMetric(`Recuperación 0–100${deviceLabel("recovery")}`, dayDiary.recovery)
          ) : (
            <label>
              Recuperación 0–100
              <input name="recovery" type="number" min={0} max={100} defaultValue={dayDiary.recovery ?? ""} key={`rc-${center}`} />
            </label>
          )}
          {polarConnected && deviceCaps.hrv ? (
            readonlyMetric(`HRV${deviceLabel("hrv")}`, dayDiary.hrv)
          ) : (
            <label>
              HRV
              <input name="hrv" type="number" defaultValue={dayDiary.hrv ?? ""} key={`hrv-${center}`} />
            </label>
          )}
          {polarConnected && deviceCaps.restingHr ? (
            readonlyMetric(`Pulso reposo${deviceLabel("restingHr")}`, dayDiary.restingHr)
          ) : (
            <label>
              Pulso reposo
              <input name="restingHr" type="number" defaultValue={dayDiary.restingHr ?? ""} key={`rhr-${center}`} />
            </label>
          )}
          <label>
            RPE 1–10
            <input name="rpe" type="number" min={1} max={10} defaultValue={dayDiary.rpe ?? ""} key={`rpe-${center}`} />
          </label>
          <label className="span-2">
            Molestias
            <textarea
              name="molestias"
              rows={3}
              placeholder="Qué te duele o molesta…"
              defaultValue={dayDiary.dietNote ?? ""}
              key={`mol-${center}`}
            />
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
    </>
  );

  const nutrition = (
    <NutritionPane
      athleteId={athlete.id}
      initialDietNotes={athlete.dietNotes}
      initialSupplements={athlete.supplements}
      isAdmin={isAdmin}
    />
  );

  const recoveryNow = dayDiary.date === today && dayDiary.recovery !== null ? dayDiary.recovery : null;

  return (
    <div className="dash">
      <section className="card dash-head">
        <label className="dash-photo">
          <img
            className="avatar avatar-sm"
            src={athlete.hasPhoto ? `/api/athletes/${athlete.id}/photo?t=${photoKey}` : "/logo-optimo.png"}
            alt=""
          />
          {canEdit ? (
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Cambiar foto"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadPhoto(file);
              }}
            />
          ) : null}
        </label>
        <div className="dash-id">
          <strong>{athlete.name}</strong>
          <span className="muted">
            {football ? "Fútbol" : running ? "Running" : "Deporte"}
            {athlete.team ? ` · ${athlete.team}` : ""}
            {athlete.shirtNumber ? ` #${athlete.shirtNumber}` : ""}
          </span>
          {injuries[0] ? <span className="dash-injury">Lesión: {injuries[0].zone}</span> : null}
          {isAdmin ? <IntegrationAdminChip integration={adminIntegration} /> : null}
        </div>
        <div className="recovery-value recovery-sm" title="Recuperación de hoy">
          {recoveryNow ?? "—"}
        </div>
      </section>
      {photoMsg ? <p className={photoMsg.includes("400") || photoMsg.includes("válida") ? "error" : "ok"}>{photoMsg}</p> : null}

      {calendar}

      <div className="day-line">
        <strong>{formatLongDate(parseDateLocal(center))}</strong>
        {plan?.mdTag ? <span className="day-focus-md">{plan.mdTag}</span> : null}
        {plan?.minutes ? <span className="muted">~{plan.minutes} min</span> : null}
      </div>

      <div className="dash-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={pane === "train"} className={pane === "train" ? "on" : ""} onClick={() => setPane("train")}>
          Entrenamiento
        </button>
        <button type="button" role="tab" aria-selected={pane === "food"} className={pane === "food" ? "on" : ""} onClick={() => setPane("food")}>
          Nutrición
        </button>
        {isAdmin ? (
          <button
            type="button"
            role="tab"
            aria-selected={pane === "stats"}
            className={pane === "stats" ? "on" : ""}
            onClick={() => {
              setPane("stats");
              setAnalysisView("range");
            }}
          >
            Análisis
          </button>
        ) : (
          <button type="button" role="tab" aria-selected={pane === "log"} className={pane === "log" ? "on" : ""} onClick={() => setPane("log")}>
            Registro
          </button>
        )}
      </div>

      {pane === "train" ? (
        <section className="card dash-pane">
          <SessionList plan={plan} />
        </section>
      ) : null}
      {pane === "food" ? nutrition : null}
      {pane === "log" && !isAdmin ? diaryForm : null}
      {pane === "stats" && isAdmin && history ? (
        <section className="dash-pane">
          <Analisis
            diaries={history}
            dataFrom={historyFrom}
            dataTo={historyTo}
            view={analysisView}
            rangeDays={analysisRangeDays}
            dayDate={center}
            dayRecord={analysisDayRecord}
            onViewChange={setAnalysisView}
            onRangeDaysChange={setAnalysisRangeDays}
          />
        </section>
      ) : null}
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

