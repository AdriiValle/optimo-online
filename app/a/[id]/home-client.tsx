"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { addDays, dateKey, DOW_FULL, MONTHS_ES, parseDateLocal, todayKey } from "@/lib/dates";
import type { Athlete, DayPlan, Diary, Injury, IntegrationInfo } from "@/lib/types";
import { capabilitiesFor, isDeviceField } from "@/lib/integrations/capabilities";
import { Analisis, type AnalysisView } from "./analisis";
import { NutritionPane } from "./nutrition-pane";
import { SessionList } from "./session-list";
import { DeviceCard, IntegrationAdminChip } from "./device-card";
import { PlanCalendar, type CalendarView } from "@/app/components/plan-calendar";

type Pane = "train" | "food" | "log" | "stats";

/** Iconos de la tab bar (24 pt, trazo como SF Symbols). */
const TAB_ICONS: Record<"train" | "food" | "log", ReactNode> = {
  train: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11" />
    </svg>
  ),
  food: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3v5.5a2.5 2.5 0 0 0 5 0V3M8.5 3v18M17.5 21V3c-2 1.4-3 3.9-3 7v4h3" />
    </svg>
  ),
  log: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="3" width="14" height="18" rx="2.5" />
      <path d="M9 8h6M9 12h6M9 16h3.5" />
    </svg>
  )
};

/** «Hoy», «Mañana», «Ayer» o «Viernes 13». */
function dayTitle(iso: string, today: string) {
  const t = parseDateLocal(today);
  if (iso === today) return "Hoy";
  if (iso === dateKey(addDays(t, 1))) return "Mañana";
  if (iso === dateKey(addDays(t, -1))) return "Ayer";
  const d = parseDateLocal(iso);
  const dow = DOW_FULL[d.getDay()];
  return `${dow.charAt(0).toUpperCase()}${dow.slice(1)} ${d.getDate()}`;
}

/** «13 de noviembre de 2026» (o con día de la semana si el título es relativo). */
function daySubtitle(iso: string, relative: boolean) {
  const d = parseDateLocal(iso);
  const date = `${d.getDate()} de ${MONTHS_ES[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
  if (!relative) return date;
  const dow = DOW_FULL[d.getDay()];
  return `${dow.charAt(0).toUpperCase()}${dow.slice(1)}, ${date}`;
}

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
  const [pane, setPane] = useState<Pane>("train");
  const [calView, setCalView] = useState<CalendarView>("week");
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
    <PlanCalendar
      byDate={byDate}
      crests={crests}
      year={year}
      month={month}
      center={center}
      today={today}
      onMonthChange={(y, m) => {
        setYear(y);
        setMonth(m);
      }}
      onSelect={(iso) => {
        selectDate(iso);
        setCalView("week");
      }}
      view={calView}
      onViewChange={setCalView}
    />
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
      canEdit={isAdmin}
      menuDate={center}
    />
  );

  const recoveryNow = dayDiary.date === today && dayDiary.recovery !== null ? dayDiary.recovery : null;
  const focusTitle = dayTitle(center, today);
  const relative = focusTitle === "Hoy" || focusTitle === "Mañana" || focusTitle === "Ayer";
  const hasSession = Boolean(plan?.blocks?.length);
  const matchCrest = plan?.matchOpponent ? crests[plan.matchOpponent] : null;
  const planTitle = plan?.title && plan.title !== plan.mdTag ? plan.title : null;
  const tabs: { id: Pane; label: string }[] = isAdmin
    ? [
        { id: "train", label: "Entrenamiento" },
        { id: "food", label: "Nutrición" },
        { id: "stats", label: "Análisis" }
      ]
    : [
        { id: "train", label: "Entreno" },
        { id: "food", label: "Nutrición" },
        { id: "log", label: "Diario" }
      ];

  function openPane(id: Pane) {
    if (id === "stats" && pane !== "stats") setAnalysisView("range");
    setPane(id);
  }

  return (
    <div className={`dash ${isAdmin ? "dash--admin" : "dash--player"}`}>
      <section className="card dash-head" aria-label="Deportista">
        <label className={`dash-photo${canEdit ? " is-editable" : ""}`}>
          <img
            className="avatar"
            src={athlete.hasPhoto ? `/api/athletes/${athlete.id}/photo?t=${photoKey}` : "/logo-optimo.png"}
            alt=""
          />
          {canEdit ? (
            <>
              <span className="dash-photo-badge" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
                  <circle cx="12" cy="13" r="3.25" />
                </svg>
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Cambiar foto"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadPhoto(file);
                }}
              />
            </>
          ) : null}
        </label>
        <div className="dash-id">
          <h2 className="dash-name">{athlete.name}</h2>
          <span className="dash-meta">
            {football ? "Fútbol" : running ? "Running" : "Deporte"}
            {athlete.team ? ` · ${athlete.team}` : ""}
            {athlete.shirtNumber ? ` · #${athlete.shirtNumber}` : ""}
          </span>
          {injuries[0] ? <span className="dash-injury">Lesión: {injuries[0].zone}</span> : null}
          {isAdmin ? <IntegrationAdminChip integration={adminIntegration} /> : null}
        </div>
        <div className="dash-recovery" aria-label={recoveryNow === null ? "Recuperación de hoy sin dato" : `Recuperación de hoy: ${recoveryNow}`}>
          <span className="dash-recovery-value" aria-hidden="true">
            {recoveryNow ?? "—"}
          </span>
          <span className="dash-recovery-label" aria-hidden="true">
            Recup.
          </span>
        </div>
      </section>
      {photoMsg ? <p className={photoMsg.includes("400") || photoMsg.includes("válida") ? "error" : "ok"}>{photoMsg}</p> : null}

      {calendar}

      <header className="day-focus">
        <p className="day-focus-date">{daySubtitle(center, relative)}</p>
        <h1 className="day-focus-title">{focusTitle}</h1>
        {plan?.mdTag || plan?.minutes || plan?.matchOpponent || planTitle ? (
          <div className="day-focus-meta">
            {plan.mdTag ? <span className="day-focus-md">{plan.mdTag}</span> : null}
            {plan.matchOpponent ? (
              <span className="day-focus-match">
                {matchCrest ? <img src={matchCrest} alt="" /> : null}
                <span>
                  vs {plan.matchOpponent}
                  {plan.matchTime ? ` · ${plan.matchTime}` : ""}
                  {plan.matchVenue ? ` · ${plan.matchVenue === "casa" ? "En casa" : "Fuera"}` : ""}
                </span>
              </span>
            ) : planTitle ? (
              <span className="day-focus-plan">{planTitle}</span>
            ) : null}
            {plan.minutes ? <span className="day-focus-duration">~{plan.minutes} min</span> : null}
          </div>
        ) : null}
      </header>

      {isAdmin ? (
        <div className="segmented segmented--block dash-seg" role="tablist" aria-label="Secciones">
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={pane === t.id} onClick={() => openPane(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      ) : (
        <nav className="tab-bar" aria-label="Secciones">
          <div className="tab-bar-inner">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                className="tab-bar-item"
                aria-current={pane === t.id ? "page" : undefined}
                onClick={() => openPane(t.id)}
              >
                {TAB_ICONS[t.id as "train" | "food" | "log"]}
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      <div className="dash-panes" key={pane}>
        {pane === "train" ? (
          hasSession ? (
            <section className="card dash-pane" aria-label="Sesión del día">
              <SessionList plan={plan} />
            </section>
          ) : (
            <section className="card dash-pane day-empty" role="status">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
                <path d="M3.5 9.5h17M8 3v4M16 3v4M9.5 15h5" />
              </svg>
              <strong>Día sin sesión</strong>
              <span>
                {plan?.matchOpponent
                  ? "Día de partido: no hay bloques de trabajo asignados."
                  : "No hay entrenamiento asignado para este día. Elige otro día en el calendario."}
              </span>
            </section>
          )
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
    </div>
  );
}
