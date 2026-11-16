import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { canSeeAthleteNutrition } from "@/lib/access";
import { assignedAthletesForNutritionist, athleteById } from "@/lib/queries";
import { addDays, dateKey, parseDateLocal, startOfWeekMonday, todayKey } from "@/lib/dates";
import { shoppingRange, shoppingRangeLabel, type ShoppingRangeKind } from "@/lib/nutrition/shopping";
import { shoppingForRange } from "@/lib/nutrition/shopping-queries";
import { BrandHeader } from "@/app/components/brand-header";
import { HeaderBackButton } from "@/app/components/header-back-button";
import { LogoutButton } from "@/app/logout-button";
import { NutAthleteNav } from "../../athlete-nav";
import { AthleteTabs } from "../athlete-tabs";
import { foodGapsForList, type FoodGaps } from "./food-gaps";
import { ShoppingSections } from "./shopping-sections";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const KINDS: { id: ShoppingRangeKind; label: string }[] = [
  { id: "week", label: "Semana" },
  { id: "3d", label: "Próximos 3 días" }
];

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Pestaña Compra del panel de Amanda: la misma lista que ve el jugador (`lib/nutrition/shopping.ts`),
 * en solo lectura, con aviso de lo que falta por configurar en Alimentos para que las cantidades cuadren.
 * Rango y semana van en la URL (`?rango=3d&desde=YYYY-MM-DD`).
 */
export default async function CompraPage({ params, searchParams }: { params: Promise<{ athleteId: string }>; searchParams: SearchParams }) {
  const { athleteId } = await params;
  const sp = await searchParams;
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "nutritionist") notFound();
  if (!z.string().uuid().safeParse(athleteId).success) notFound();
  if (!(await canSeeAthleteNutrition(user, athleteId))) notFound();

  const today = todayKey();
  const kind: ShoppingRangeKind = one(sp.rango) === "3d" ? "3d" : "week";
  const rawFrom = one(sp.desde);
  const anchor = rawFrom && DATE_RE.test(rawFrom) && !Number.isNaN(parseDateLocal(rawFrom).getTime()) ? rawFrom : today;
  const range = shoppingRange(kind, anchor);
  const label = shoppingRangeLabel(range.from, range.to);

  const data = await withRls(rlsFrom(user), async (tx) => {
    const athlete = await athleteById(tx, athleteId);
    if (!athlete) return null;
    const [athletes, shopping] = await Promise.all([assignedAthletesForNutritionist(tx, user.id), shoppingForRange(tx, athleteId, range)]);
    const gaps = await foodGapsForList(tx, shopping.list);
    return { athlete, athletes, shopping, gaps };
  });
  if (!data) notFound();

  const base = `/nutricion/${data.athlete.id}/compra`;
  const href = (k: ShoppingRangeKind, from: string) => `${base}?${new URLSearchParams(k === "3d" ? { rango: "3d", desde: from } : { desde: from })}`;
  const step = kind === "week" ? 7 : 3;
  const prev = dateKey(addDays(parseDateLocal(range.from), -step));
  const next = dateKey(addDays(parseDateLocal(range.from), step));
  const isCurrent = kind === "week" ? range.from === startOfWeekMonday(today) : range.from === today;
  // Al cambiar de rango: «3 días» desde hoy si se ve la semana actual; si no, desde el lunes de esa semana.
  const kindHref = (k: ShoppingRangeKind) =>
    k === kind ? href(k, range.from) : href(k, k === "3d" && startOfWeekMonday(range.from) === startOfWeekMonday(today) ? today : range.weekStart);
  const { shopping, gaps } = data;
  const list = shopping.list;

  return (
    <>
      <BrandHeader
        wide
        player={data.athlete.name}
        leading={<HeaderBackButton href="/nutricion" />}
        trailing={
          <div className="top-actions nut-top-actions">
            <LogoutButton inline />
          </div>
        }
      />
      <main className="page nut-page nut-page--tabs">
        <AthleteTabs athleteId={data.athlete.id} />
        <div className="nut-desktop">
          <h1 className="nut-ws-title">{data.athlete.name}</h1>
          <NutAthleteNav athletes={data.athletes} activeId={data.athlete.id} />
          <section className="nut-ws-index nut-section nut-trk-page nut-buy-page" aria-labelledby="nut-buy-title">
            <div className="nut-trk-inner nut-buy-inner">
              <header className="nut-trk-head">
                <h2 id="nut-buy-title" className="nut-trk-title">
                  Lista de la compra
                </h2>
                <p className="nut-trk-lead">La misma lista que ve {data.athlete.name.split(" ")[0]}, sumada del menú y ordenada por secciones del súper.</p>
              </header>

              <div className="nut-buy-bar">
                <nav className="nut-buy-range" aria-label="Rango de la compra">
                  {KINDS.map((k) => (
                    <Link key={k.id} className="nut-buy-range-opt" href={kindHref(k.id)} aria-current={k.id === kind ? "page" : undefined} replace scroll={false}>
                      {k.label}
                    </Link>
                  ))}
                </nav>
                <RangeNav
                  label={label}
                  current={isCurrent}
                  currentText={kind === "week" ? "Esta semana" : "Desde hoy"}
                  prevHref={href(kind, prev)}
                  nextHref={href(kind, next)}
                  todayHref={href(kind, kind === "week" ? startOfWeekMonday(today) : today)}
                  prevLabel={kind === "week" ? "Semana anterior" : "3 días antes"}
                  nextLabel={kind === "week" ? "Semana siguiente" : "3 días después"}
                />
              </div>

              {shopping.meals === 0 ? (
                <div className="state nut-section-state" role="status">
                  <CartIcon />
                  <h3 className="state-title">Sin menú en estos días</h3>
                  <p className="state-text">Cuando cargues platos en el menú, aquí verás la compra tal como le sale al deportista.</p>
                  <Link className="btn btn--tinted nut-section-action" href={`/nutricion/${data.athlete.id}`}>
                    Ir al menú
                  </Link>
                </div>
              ) : list.total === 0 ? (
                <div className="state nut-section-state" role="status">
                  <CartIcon />
                  <h3 className="state-title">Aún no hay ingredientes</h3>
                  <p className="state-text">
                    Hay {shopping.meals} {shopping.meals === 1 ? "plato" : "platos"} en el menú, pero ninguno tiene los ingredientes confirmados. Confírmalos en la ficha de cada plato.
                  </p>
                  <Link className="btn btn--tinted nut-section-action" href={`/nutricion/${data.athlete.id}`}>
                    Ir al menú
                  </Link>
                </div>
              ) : (
                <>
                  <div className="nut-buy-summary">
                    <p className="nut-buy-count">
                      {list.total} {list.total === 1 ? "producto" : "productos"}
                      {list.checked > 0 ? <span> · {list.checked} ya en casa</span> : null}
                    </p>
                    {shopping.mealsPending > 0 ? (
                      <p className="nut-buy-pending">
                        {shopping.mealsPending === 1
                          ? "1 plato aún no tiene ingredientes confirmados y no entra en la lista."
                          : `${shopping.mealsPending} platos aún no tienen ingredientes confirmados y no entran en la lista.`}
                      </p>
                    ) : null}
                  </div>

                  <GapsNotice gaps={gaps} />

                  <ShoppingSections list={list} idPrefix="nut-buy-sec" />

                  <p className="nut-buy-foot">
                    «Ya lo tiene en casa» lo marca el deportista desde su app. Para imprimir la lista junto al menú y los objetivos,{" "}
                    <Link href={`/nutricion/${data.athlete.id}/informes?semana=${range.weekStart}`}>abre Informes</Link>.
                  </p>
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function RangeNav(p: {
  label: string;
  current: boolean;
  currentText: string;
  prevHref: string;
  nextHref: string;
  todayHref: string;
  prevLabel: string;
  nextLabel: string;
}) {
  return (
    <div className="nut-buy-nav">
      <Link className="icon-btn nut-buy-arrow" href={p.prevHref} aria-label={p.prevLabel} replace scroll={false}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14.5 6l-6 6 6 6" />
        </svg>
      </Link>
      <div className="nut-buy-nav-head">
        <p className="nut-buy-nav-title">{p.label}</p>
        {p.current ? (
          <span className="nut-buy-nav-rel">{p.currentText}</span>
        ) : (
          <Link className="nut-buy-nav-today" href={p.todayHref} replace scroll={false}>
            Ir a hoy
          </Link>
        )}
      </div>
      <Link className="icon-btn nut-buy-arrow" href={p.nextHref} aria-label={p.nextLabel} replace scroll={false}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9.5 6l6 6-6 6" />
        </svg>
      </Link>
    </div>
  );
}

/** Aviso de lo que falta configurar: ingredientes sin alimento y alimentos sin sección o sin unidad. */
function GapsNotice({ gaps }: { gaps: FoodGaps }) {
  const total = gaps.unlinked.length + gaps.foods.length;
  if (!total) {
    return (
      <p className="nut-buy-ok" role="status">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12.5l2.6 2.6L16 9.5" />
        </svg>
        Todos los alimentos tienen sección y unidad.
      </p>
    );
  }
  const parts = [
    gaps.unlinked.length ? `${gaps.unlinked.length} sin alimento` : null,
    gaps.noAisle ? `${gaps.noAisle} sin sección` : null,
    gaps.noUnit ? `${gaps.noUnit} sin unidad de compra` : null
  ].filter(Boolean);
  return (
    <aside className="nut-buy-gaps" aria-labelledby="nut-buy-gaps-title">
      <div className="nut-buy-gaps-head">
        <svg className="nut-buy-gaps-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 4 2.8 19.5h18.4z" />
          <path d="M12 10v4.2" />
          <circle cx="12" cy="17" r="0.4" fill="currentColor" />
        </svg>
        <div className="nut-buy-gaps-text">
          <h3 id="nut-buy-gaps-title" className="nut-buy-gaps-title">
            Revisa {total} {total === 1 ? "alimento" : "alimentos"}
          </h3>
          <p className="nut-buy-gaps-sub">
            {parts.join(" · ")}. Sin sección se colocan por su nombre y sin unidad se compran en gramos redondeados.
          </p>
        </div>
        <Link className="btn btn--tinted nut-buy-gaps-cta" href="/nutricion/alimentos">
          Revisar alimentos
        </Link>
      </div>
      <details className="nut-buy-gaps-more">
        <summary>Ver cuáles</summary>
        <ul className="nut-buy-gaps-list">
          {gaps.unlinked.map((u) => (
            <li key={`u-${u.key}`}>
              <span className="nut-buy-gaps-name">{u.name}</span>
              <span className="nut-buy-tag nut-buy-tag--strong">Sin alimento</span>
            </li>
          ))}
          {gaps.foods.map((f) => (
            <li key={f.key}>
              <span className="nut-buy-gaps-name">{f.name}</span>
              {f.noAisle ? <span className="nut-buy-tag">Sin sección</span> : null}
              {f.noUnit ? <span className="nut-buy-tag">Sin unidad</span> : null}
            </li>
          ))}
        </ul>
      </details>
    </aside>
  );
}

function CartIcon() {
  return (
    <svg className="state-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4.5h2.2l2.3 10.5h10.3l2.2-7.5H6.6" />
      <circle cx="9.5" cy="19" r="1.4" />
      <circle cx="16.5" cy="19" r="1.4" />
    </svg>
  );
}
