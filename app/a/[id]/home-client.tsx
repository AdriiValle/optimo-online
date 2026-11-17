"use client";

import { type CSSProperties, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, dateKey, DOW_FULL, MONTHS_ES, parseDateLocal, todayKey } from "@/lib/dates";
import type { Athlete, DayPlan, Diary, Injury, IntegrationInfo } from "@/lib/types";
import { capabilitiesFor, isDeviceField } from "@/lib/integrations/capabilities";
import { Analisis, type AnalysisView } from "./analisis";
import { NutritionPane } from "./nutrition-pane";
import { SessionList, withoutSauna } from "./session-list";
import { DeviceCard, IntegrationAdminChip } from "./device-card";
import { hasSauna, PlanCalendar, SAUNA_SVG, type CalendarView } from "@/app/components/plan-calendar";
import { AthleteProfileForm, NutSheet, ageFrom } from "@/app/nutricion/[athleteId]/athlete-profile-form";

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

type DeviceMetric = "sleepHours" | "sleepQuality" | "recovery" | "hrv" | "restingHr";
type MetricSpec = {
  name: DeviceMetric | "rpe" | "km" | "avgHr";
  label: string;
  hint?: string;
  unit?: string;
  unitName?: string;
  min: number;
  max: number;
  step?: number;
  decimal?: boolean;
};

const isDeviceMetric = (name: MetricSpec["name"]): name is DeviceMetric =>
  name !== "rpe" && name !== "km" && name !== "avgHr";

/** Rangos = los que valida `/api/diaries`, para avisar en línea antes de enviar. */
const SLEEP_METRICS: MetricSpec[] = [
  { name: "sleepHours", label: "Sueño", unit: "h", unitName: "horas", min: 0, max: 24, step: 0.1, decimal: true },
  { name: "sleepQuality", label: "Calidad del sueño", hint: "De 1 a 100", min: 1, max: 100 },
  { name: "recovery", label: "Recuperación", hint: "De 0 a 100", min: 0, max: 100 },
  { name: "hrv", label: "HRV", unit: "ms", unitName: "milisegundos", min: 0, max: 400 },
  { name: "restingHr", label: "Pulso en reposo", unit: "lpm", unitName: "latidos por minuto", min: 20, max: 220 }
];
const RUN_METRICS: MetricSpec[] = [
  { name: "km", label: "Distancia", unit: "km", unitName: "kilómetros", min: 0, max: 400, step: 0.1, decimal: true },
  { name: "avgHr", label: "Pulso medio", unit: "lpm", unitName: "latidos por minuto", min: 20, max: 220 }
];
const RPE_METRIC: MetricSpec = { name: "rpe", label: "Esfuerzo (RPE)", hint: "De 1 a 10", min: 1, max: 10 };

/** Ficha física que ve el admin (B4). Solo lectura aquí; se edita en el sheet. */
export type AdminProfile = {
  birthDate: string | null;
  heightCm: number | null;
  weightKg: number | null;
  allergies: string[];
  intolerances: string[];
};

/** 72.5 → «72,5» (sin depender del ICU del servidor). */
const decimalEs = (n: number) => String(Math.round(n * 10) / 10).replace(".", ",");

/** `1992-03-12` → «12 mar 1992». */
function birthShort(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS_ES[m - 1].slice(0, 3).toLowerCase()} ${y}`;
}

function ProfileFact({ label, value, unit, wide }: { label: string; value: string | null; unit?: string; wide?: boolean }) {
  return (
    <div className={`adm-fis-fact${wide ? " adm-fis-fact--text" : ""}`}>
      <dt>{label}</dt>
      <dd>
        {value === null ? (
          <span className="adm-fis-none">
            <span aria-hidden="true">—</span>
            <span className="sr-only">Sin dato</span>
          </span>
        ) : (
          <>
            <span className="adm-fis-num">{value}</span>
            {unit ? <span className="adm-fis-unit">{unit}</span> : null}
          </>
        )}
      </dd>
    </div>
  );
}

/** Perfil físico del deportista en la cabecera del admin: cifras + alergias, y «Editar» abre la ficha. */
function AdminProfileCard({ athleteId, profile }: { athleteId: string; profile: AdminProfile }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const age = ageFrom(profile.birthDate);
  const empty = profile.birthDate === null && profile.heightCm === null && profile.weightKg === null;
  const diet = [
    { key: "allergies", title: "Alergias", tone: "danger", items: profile.allergies },
    { key: "intolerances", title: "Intolerancias", tone: "warn", items: profile.intolerances }
  ].filter((g) => g.items.length > 0);

  return (
    <div className="adm-fis" role="group" aria-labelledby="adm-fis-title">
      <div className="adm-fis-head">
        <h3 className="adm-fis-title" id="adm-fis-title">
          Perfil físico
        </h3>
        <button
          type="button"
          className="btn btn--tinted adm-fis-edit"
          aria-haspopup="dialog"
          aria-label={empty ? "Añadir perfil físico" : "Editar perfil físico"}
          onClick={() => setOpen(true)}
        >
          {empty ? "Añadir" : "Editar"}
        </button>
      </div>
      <dl className="adm-fis-grid">
        <ProfileFact label="Edad" value={age !== null ? String(age) : null} unit="años" />
        <ProfileFact label="Altura" value={profile.heightCm !== null ? decimalEs(profile.heightCm) : null} unit="cm" />
        <ProfileFact label="Peso" value={profile.weightKg !== null ? decimalEs(profile.weightKg) : null} unit="kg" />
        <ProfileFact label="Nacimiento" value={profile.birthDate ? birthShort(profile.birthDate) : null} wide />
      </dl>
      {empty ? <p className="adm-fis-hint">Sin datos físicos. Con nacimiento, altura y peso se calculan los objetivos del día.</p> : null}
      {diet.length ? (
        <dl className="adm-fis-diet">
          {diet.map((g) => (
            <div key={g.key} className="adm-fis-diet-row">
              <dt>{g.title}</dt>
              <dd>
                <ul className={`adm-fis-chips adm-fis-chips--${g.tone}`}>
                  {g.items.map((t) => (
                    <li key={t} className="adm-fis-chip">
                      {t}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      <NutSheet open={open} title="Perfil del deportista" onRequestClose={close} grouped>
        <AthleteProfileForm
          athleteId={athleteId}
          onSaved={() => {
            close();
            router.refresh();
          }}
        />
      </NutSheet>
    </div>
  );
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
  /** Solo admin: ficha física editable en la cabecera. */
  adminProfile?: AdminProfile | null;
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
  adminProfile,
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
  const [diaryMsg, setDiaryMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [diarySaving, setDiarySaving] = useState(false);
  const [photoKey, setPhotoKey] = useState(0);
  const [pane, setPane] = useState<Pane>("train");
  const [calView, setCalView] = useState<CalendarView>("week");
  const [analysisView, setAnalysisView] = useState<AnalysisView>("range");
  const [analysisRangeDays, setAnalysisRangeDays] = useState(30);
  const [polarIntegration, setPolarIntegration] = useState(initialPolar);

  const polarConnected = polarIntegration.status === "connected";
  const deviceCaps = capabilitiesFor(polarConnected ? "polar" : null);

  /** Fila de lista agrupada: etiqueta a la izquierda, cifra a la derecha con teclado numérico. */
  function metricRow(m: MetricSpec) {
    const value = dayDiary[m.name];
    if (isDeviceMetric(m.name) && polarConnected && deviceCaps[m.name]) {
      const fromPolar = isDeviceField("polar", m.name) && dayDiary.deviceSource === "polar";
      return (
        <li key={m.name}>
          <div className="list-row diary-row diary-row--device">
            <span className="list-row-main">
              {m.label}
              <span className="list-row-sub">{fromPolar ? "De Polar" : "Llega de Polar"}</span>
            </span>
            <span className="diary-value">{value ?? "—"}</span>
            <span className="diary-unit">{value !== null ? m.unit : null}</span>
          </div>
        </li>
      );
    }
    const id = `diary-${m.name}`;
    return (
      <li key={m.name}>
        <label className="list-row diary-row" htmlFor={id}>
          <span className="list-row-main">
            {m.label}
            {m.unitName ? <span className="sr-only">, en {m.unitName}</span> : null}
            {m.hint ? <span className="list-row-sub">{m.hint}</span> : null}
          </span>
          <input
            id={id}
            className="diary-input"
            name={m.name}
            type="number"
            inputMode={m.decimal ? "decimal" : "numeric"}
            min={m.min}
            max={m.max}
            step={m.step}
            placeholder="—"
            autoComplete="off"
            defaultValue={value ?? ""}
          />
          <span className="diary-unit" aria-hidden="true">
            {m.unit}
          </span>
        </label>
      </li>
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

  async function saveDiary(form: HTMLFormElement) {
    setDiaryMsg(null);
    const fd = new FormData(form);
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
    setDiarySaving(true);
    try {
      const res = await fetch("/api/diaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        setDiaryMsg({ ok: false, text: "No se pudo guardar. Revisa los datos e inténtalo de nuevo." });
        return;
      }
      const json = await res.json();
      setDayDiary(json.data);
      setDiaryMsg({ ok: true, text: "Guardado." });
    } catch {
      setDiaryMsg({ ok: false, text: "No se pudo guardar. Comprueba la conexión e inténtalo de nuevo." });
    } finally {
      setDiarySaving(false);
    }
  }

  const diaryForm = (
    <div className="diary">
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
      {dayDiary.date === center ? (
        <form
          key={center}
          className="diary-form"
          aria-label="Diario del día"
          onInput={() => {
            if (diaryMsg?.ok) setDiaryMsg(null);
          }}
          onSubmit={(e) => {
            e.preventDefault();
            if (!diarySaving) void saveDiary(e.currentTarget);
          }}
        >
          <h2 className="list-group-title" id="diary-sleep">
            Sueño y recuperación
          </h2>
          <ul className="list-group" aria-labelledby="diary-sleep">
            {SLEEP_METRICS.map(metricRow)}
          </ul>

          <h2 className="list-group-title" id="diary-session">
            Sesión
          </h2>
          <ul className="list-group" aria-labelledby="diary-session">
            {(running ? [...RUN_METRICS, RPE_METRIC] : [RPE_METRIC]).map(metricRow)}
          </ul>

          <label className="list-group-title" htmlFor="diary-molestias">
            Molestias
          </label>
          <div className="list-group diary-note">
            <textarea
              id="diary-molestias"
              name="molestias"
              rows={3}
              placeholder="Qué te duele o molesta…"
              defaultValue={dayDiary.dietNote ?? ""}
            />
          </div>

          <label className="list-group-title" htmlFor="diary-free-note">
            Nota
          </label>
          <div className="list-group diary-note">
            <textarea id="diary-free-note" name="freeNote" rows={3} placeholder="Cualquier otra cosa del día…" defaultValue={dayDiary.freeNote ?? ""} />
          </div>

          <div className="diary-feedback" aria-live="polite">
            {diaryMsg ? (
              <p className={`alert ${diaryMsg.ok ? "alert--ok" : "alert--danger"}`}>
                <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  {diaryMsg.ok ? <path d="M8 12.5l2.7 2.7L16 9.8" /> : <path d="M12 7.5v5.5M12 16.5v.01" />}
                </svg>
                <span>{diaryMsg.text}</span>
              </p>
            ) : null}
          </div>
          <button className="btn btn--lg btn--block" type="submit" disabled={diarySaving} aria-busy={diarySaving || undefined}>
            {diarySaving ? "Guardando…" : "Guardar diario"}
          </button>
        </form>
      ) : (
        <p className="diary-loading" role="status">
          <span className="spinner" aria-hidden="true" />
          Cargando el día…
        </p>
      )}
    </div>
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
  const hasSession = Boolean(plan && withoutSauna(plan.blocks).length);
  const saunaBlock = plan?.blocks.find((b) => b.kind === "protocol" && b.protocolId === "sauna-exposicion");
  const showSauna = hasSauna(plan);
  const saunaQty = saunaBlock && saunaBlock.kind === "protocol" ? saunaBlock.qty : null;
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
        {isAdmin && adminProfile ? <AdminProfileCard athleteId={athlete.id} profile={adminProfile} /> : null}
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

      {showSauna ? (
        <section className="card day-sauna" aria-label="Sauna del día">
          <span className="day-sauna-icon">{SAUNA_SVG}</span>
          <div className="day-sauna-text">
            <strong>Sauna</strong>
            <span>{saunaQty ?? "10 min · 1 vez"}</span>
          </div>
        </section>
      ) : null}

      {isAdmin ? (
        <div
          className="segmented segmented--block dash-seg"
          role="tablist"
          aria-label="Secciones"
          style={{ "--seg-count": tabs.length, "--seg-index": Math.max(0, tabs.findIndex((t) => t.id === pane)) } as CSSProperties}
        >
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
