import { Fragment } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { nutritionAthleteData } from "@/lib/access";
import { addDays, dateKey, DOW_FULL, formatLongDate, MONTHS_ES, parseDateLocal, startOfWeekMonday, todayKey } from "@/lib/dates";
import { MEAL_SLOTS } from "@/lib/types";
import type { DayType } from "@/lib/nutrition/day-type";
import { shoppingRangeLabel } from "@/lib/nutrition/shopping";
import type { Target, TargetKey } from "@/lib/nutrition/targets";
import { BrandHeader } from "@/app/components/brand-header";
import { HeaderBackButton } from "@/app/components/header-back-button";
import { LogoutButton } from "@/app/logout-button";
import { AccountSettingsLink } from "../account-settings-link";
import { NutAthleteNav } from "../../athlete-nav";
import { AthleteTabs } from "../athlete-tabs";
import { ShoppingSections } from "../compra/shopping-sections";
import { PrintButton } from "./print-button";
import { weeklyReport, type ReportData } from "./report-data";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const DAY_TYPE_LABEL: Record<DayType, string> = { match: "Partido", training: "Entreno", rest: "Descanso" };
const DAY_TYPE_ORDER: DayType[] = ["training", "match", "rest"];

const MACRO_ROWS: { key: TargetKey; label: string; unit: string }[] = [
  { key: "kcal", label: "Energía", unit: "kcal" },
  { key: "protein_g", label: "Proteína", unit: "g" },
  { key: "carbs_g", label: "Hidratos", unit: "g" },
  { key: "fat_g", label: "Grasa", unit: "g" }
];

const MICRO_ROWS: { key: TargetKey; label: string; unit: string }[] = [
  { key: "fiber_g", label: "Fibra", unit: "g" },
  { key: "sodium_mg", label: "Sodio", unit: "mg" },
  { key: "iron_mg", label: "Hierro", unit: "mg" },
  { key: "calcium_mg", label: "Calcio", unit: "mg" },
  { key: "vit_d_ug", label: "Vitamina D", unit: "µg" }
];

function n(v: number) {
  return Math.round(v).toLocaleString("es-ES", { useGrouping: "always" });
}

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Pestaña Informes del panel de Amanda: informe semanal imprimible (menú lunes–domingo, objetivos por tipo
 * de día y lista de la compra). «Imprimir o guardar PDF» abre el diálogo del navegador; `@media print`
 * deja solo la hoja. Semana en la URL (`?semana=YYYY-MM-DD`, cualquier día de esa semana).
 */
export default async function InformesPage({ params, searchParams }: { params: Promise<{ athleteId: string }>; searchParams: SearchParams }) {
  const { athleteId } = await params;
  const sp = await searchParams;
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "nutritionist") notFound();
  if (!z.string().uuid().safeParse(athleteId).success) notFound();

  const today = todayKey();
  const raw = one(sp.semana);
  const anchor = raw && DATE_RE.test(raw) && !Number.isNaN(parseDateLocal(raw).getTime()) ? raw : today;
  const weekStart = startOfWeekMonday(anchor);

  const loaded = await nutritionAthleteData(user, athleteId, (ctx) => withRls(ctx, (tx) => weeklyReport(tx, athleteId, weekStart, today)));
  if (!loaded) notFound();
  const data = { athlete: loaded.athlete, athletes: loaded.athletes, report: loaded.extra };

  const { athlete, report } = data;
  const base = `/nutricion/${athlete.id}/informes`;
  const weekHref = (d: string) => `${base}?semana=${d}`;
  const prev = dateKey(addDays(parseDateLocal(weekStart), -7));
  const next = dateKey(addDays(parseDateLocal(weekStart), 7));
  const isCurrent = weekStart === startOfWeekMonday(today);
  const label = shoppingRangeLabel(report.weekStart, report.weekEnd);
  const mealsCount = report.days.reduce((a, d) => a + d.meals.filter(Boolean).length, 0);

  return (
    <>
      <BrandHeader
        wide
        player={athlete.name}
        leading={<HeaderBackButton href="/nutricion" />}
        trailing={
          <div className="top-actions nut-top-actions">
            <AccountSettingsLink athleteId={athlete.id} />
            <LogoutButton inline />
          </div>
        }
      />
      <main className="page nut-page nut-page--tabs">
        <AthleteTabs athleteId={athlete.id} />
        <div className="nut-desktop">
          <h1 className="nut-ws-title">{athlete.name}</h1>
          <NutAthleteNav athletes={data.athletes} activeId={athlete.id} />
          <section className="nut-ws-index nut-section nut-trk-page nut-rep-page" aria-labelledby="nut-rep-heading">
            <div className="nut-rep-inner">
              <header className="nut-trk-head nut-rep-screen-head">
                <h2 id="nut-rep-heading" className="nut-trk-title">
                  Informe semanal
                </h2>
                <p className="nut-trk-lead">Menú, objetivos y lista de la compra en una hoja para el deportista o el cuerpo técnico.</p>
              </header>

              <div className="nut-rep-toolbar">
                <div className="nut-buy-nav">
                  <Link className="icon-btn nut-buy-arrow" href={weekHref(prev)} aria-label="Semana anterior" replace scroll={false}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M14.5 6l-6 6 6 6" />
                    </svg>
                  </Link>
                  <div className="nut-buy-nav-head">
                    <p className="nut-buy-nav-title">{label}</p>
                    {isCurrent ? (
                      <span className="nut-buy-nav-rel">Esta semana</span>
                    ) : (
                      <Link className="nut-buy-nav-today" href={weekHref(startOfWeekMonday(today))} replace scroll={false}>
                        Ir a esta semana
                      </Link>
                    )}
                  </div>
                  <Link className="icon-btn nut-buy-arrow" href={weekHref(next)} aria-label="Semana siguiente" replace scroll={false}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9.5 6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
                <PrintButton />
              </div>

              <article className="nut-rep" aria-label={`Informe de ${athlete.name}, semana ${label}`}>
                <header className="nut-rep-head">
                  <p className="nut-rep-kicker">Óptimo · Informe nutricional</p>
                  <h2 className="nut-rep-name">{athlete.name}</h2>
                  <p className="nut-rep-week">Semana del {longRange(report.weekStart, report.weekEnd)}</p>
                  <p className="nut-rep-meta">Generado el {formatLongDate(parseDateLocal(today)).toLowerCase()}</p>
                </header>

                <TargetsBlock report={report} athleteId={athlete.id} />
                <MenuBlock report={report} mealsCount={mealsCount} />
                <ShoppingBlock report={report} />
              </article>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

/** «16 al 22 de noviembre de 2026», «30 de noviembre al 6 de diciembre de 2026». */
function longRange(from: string, to: string) {
  const a = parseDateLocal(from);
  const b = parseDateLocal(to);
  const m = (d: Date) => MONTHS_ES[d.getMonth()].toLowerCase();
  if (a.getFullYear() !== b.getFullYear()) return `${a.getDate()} de ${m(a)} de ${a.getFullYear()} al ${b.getDate()} de ${m(b)} de ${b.getFullYear()}`;
  if (a.getMonth() !== b.getMonth()) return `${a.getDate()} de ${m(a)} al ${b.getDate()} de ${m(b)} de ${b.getFullYear()}`;
  return `${a.getDate()} al ${b.getDate()} de ${m(b)} de ${b.getFullYear()}`;
}

function targetCell(t: Target | undefined, unit: string) {
  if (!t) return <span className="nut-rep-none">—</span>;
  const prefix = t.kind === "min" ? "≥ " : t.kind === "max" ? "≤ " : "";
  return (
    <>
      <span className="nut-rep-val">
        {prefix}
        {n(t.target)} <small>{unit}</small>
      </span>
      {t.kind === "range" && t.min !== undefined && t.max !== undefined ? (
        <span className="nut-rep-band">
          {n(t.min)}–{n(t.max)}
        </span>
      ) : null}
    </>
  );
}

function TargetsBlock({ report, athleteId }: { report: ReportData; athleteId: string }) {
  const { targets, profile } = report;
  const typesInWeek = new Map<DayType, number>();
  for (const d of report.days) typesInWeek.set(d.dayType, (typesInWeek.get(d.dayType) ?? 0) + 1);
  const cols = DAY_TYPE_ORDER.filter((dt) => targets.byType[dt]);
  const anyOverride = cols.some((dt) => Object.keys(targets.overridden[dt] ?? {}).length > 0);
  const micro = cols.length ? targets.byType[cols[0]] : undefined;
  const facts = [
    profile.weightKg ? `${profile.weightKg.toLocaleString("es-ES", { maximumFractionDigits: 1 })} kg` : null,
    profile.heightCm ? `${n(profile.heightCm)} cm` : null,
    profile.ageYears ? `${profile.ageYears} años` : null
  ].filter(Boolean);

  return (
    <section className="nut-rep-sec" aria-labelledby="nut-rep-targets">
      <h3 id="nut-rep-targets" className="nut-rep-sec-title">
        Objetivos diarios
      </h3>
      <dl className="nut-rep-facts">
        {facts.length ? (
          <div>
            <dt>Ficha</dt>
            <dd>{facts.join(" · ")}</dd>
          </div>
        ) : null}
        {profile.dietGoal ? (
          <div>
            <dt>Meta</dt>
            <dd>{profile.dietGoal}</dd>
          </div>
        ) : null}
        <div className={profile.allergies.length ? "is-alert" : undefined}>
          <dt>Alergias</dt>
          <dd>{profile.allergies.length ? profile.allergies.join(", ") : "Ninguna"}</dd>
        </div>
        <div className={profile.intolerances.length ? "is-alert" : undefined}>
          <dt>Intolerancias</dt>
          <dd>{profile.intolerances.length ? profile.intolerances.join(", ") : "Ninguna"}</dd>
        </div>
      </dl>

      {cols.length === 0 ? (
        <p className="nut-rep-empty">
          Sin objetivos: faltan peso, altura o fecha de nacimiento.{" "}
          <Link className="nut-rep-screen-only" href={`/nutricion/${athleteId}/perfil`}>
            Completar el perfil
          </Link>
        </p>
      ) : (
        <>
          <div className="nut-rep-table-wrap">
            <table className="nut-rep-table">
              <thead>
                <tr>
                  <th scope="col">
                    <span className="sr-only">Nutriente</span>
                  </th>
                  {cols.map((dt) => (
                    <th key={dt} scope="col" className={typesInWeek.has(dt) ? "is-in-week" : undefined}>
                      {DAY_TYPE_LABEL[dt]}
                      <span className="nut-rep-th-sub">
                        {typesInWeek.has(dt) ? `${typesInWeek.get(dt)} ${typesInWeek.get(dt) === 1 ? "día" : "días"} esta semana` : "Ninguno esta semana"}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MACRO_ROWS.map((r) => (
                  <tr key={r.key}>
                    <th scope="row">{r.label}</th>
                    {cols.map((dt) => (
                      <td key={dt} className={targets.overridden[dt]?.[r.key] ? "is-override" : undefined}>
                        {targetCell(targets.byType[dt]?.[r.key], r.unit)}
                        {targets.overridden[dt]?.[r.key] ? <span className="sr-only"> (fijado por la nutricionista)</span> : null}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {micro ? (
            <p className="nut-rep-micros">
              <span className="nut-rep-micros-label">Cada día:</span>{" "}
              {MICRO_ROWS.map((r, i) => {
                const t = micro[r.key];
                const prefix = t.kind === "max" ? "≤" : "≥";
                return (
                  <Fragment key={r.key}>
                    <span className="nut-rep-micro">
                      {r.label} {prefix} {n(t.target)} {r.unit}
                    </span>
                    {i < MICRO_ROWS.length - 1 ? " · " : ""}
                  </Fragment>
                );
              })}
            </p>
          ) : null}
          <p className="nut-rep-note">
            Cifra objetivo y, debajo, el margen aceptable.{anyOverride ? " En negrita con punto, las cifras que fija la nutricionista; el resto se calcula del perfil." : " Calculadas del perfil y del tipo de día."}
          </p>
        </>
      )}
    </section>
  );
}

function MenuBlock({ report, mealsCount }: { report: ReportData; mealsCount: number }) {
  return (
    <section className="nut-rep-sec nut-rep-sec--menu" aria-labelledby="nut-rep-menu">
      <h3 id="nut-rep-menu" className="nut-rep-sec-title">
        Menú de la semana
      </h3>
      {mealsCount === 0 ? (
        <p className="nut-rep-empty">Sin platos cargados en esta semana.</p>
      ) : (
        <div className="nut-rep-days">
          {report.days.map((d) => {
            const dt = parseDateLocal(d.date);
            const dow = DOW_FULL[dt.getDay()];
            return (
              <section key={d.date} className={`nut-rep-day nut-rep-day--${d.dayType}`} aria-label={`${dow} ${dt.getDate()}`}>
                <header className="nut-rep-day-head">
                  <h4 className="nut-rep-day-title">
                    {dow.charAt(0).toUpperCase() + dow.slice(1)} <span>{dt.getDate()}</span>
                  </h4>
                  <span className="nut-rep-day-type">
                    {d.mdTag && d.mdTag.toUpperCase() !== DAY_TYPE_LABEL[d.dayType].toUpperCase() ? `${d.mdTag} · ` : ""}
                    {DAY_TYPE_LABEL[d.dayType]}
                  </span>
                </header>
                <dl className="nut-rep-meals">
                  {MEAL_SLOTS.map((s, i) => {
                    const m = d.meals[i];
                    return (
                      <div key={s.slot} className={`nut-rep-meal${m ? ` nut-cat--${m.cat}` : " is-empty"}`}>
                        <dt>{s.label}</dt>
                        <dd>{m ? m.dish : "—"}</dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ShoppingBlock({ report }: { report: ReportData }) {
  const { shopping } = report;
  const list = shopping.list;
  return (
    <section className="nut-rep-sec nut-rep-sec--shop" aria-labelledby="nut-rep-shop">
      <h3 id="nut-rep-shop" className="nut-rep-sec-title">
        Lista de la compra
        {list.total ? <span className="nut-rep-sec-count"> · {list.total} productos</span> : null}
      </h3>
      {list.total === 0 ? (
        <p className="nut-rep-empty">
          {shopping.meals === 0 ? "Sin menú en esta semana." : "Los platos aún no tienen ingredientes confirmados."}
        </p>
      ) : (
        <>
          {shopping.mealsPending > 0 ? (
            <p className="nut-rep-note">
              {shopping.mealsPending === 1
                ? "1 plato sin ingredientes confirmados no entra en la lista."
                : `${shopping.mealsPending} platos sin ingredientes confirmados no entran en la lista.`}
            </p>
          ) : null}
          <ShoppingSections list={list} idPrefix="nut-rep-shop" compact />
        </>
      )}
    </section>
  );
}
