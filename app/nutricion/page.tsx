import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { assignedAthletesForNutritionist } from "@/lib/queries";
import { BrandHeader } from "@/app/components/brand-header";
import { LogoutButton } from "@/app/logout-button";
import { NutAthleteNav } from "./athlete-nav";
import { athletePhoto, sportLine } from "./athlete-nav-shared";

export default async function NutricionPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "nutritionist") notFound();

  const athletes = await withRls(rlsFrom(user), (tx) => assignedAthletesForNutritionist(tx, user.id));

  return (
    <>
      <BrandHeader wide meta="Nutrición" trailing={<div className="top-actions nut-top-actions"><LogoutButton inline /></div>} />
      <main className="page nut-page">
        <div className="nut-desktop nut-desktop-index">
          <NutAthleteNav athletes={athletes} />
          <div className="nut-ws-index">
            <h1 className="nut-index-title">Deportistas</h1>
            {athletes.length === 0 ? (
              <div className="state nut-index-empty">
                <svg className="state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="8" r="3.5" />
                  <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
                  <path d="M16 4.5a3.5 3.5 0 0 1 0 7" />
                  <path d="M18 14.2A6.5 6.5 0 0 1 21.5 20" />
                </svg>
                <p className="state-title">Aún no tienes deportistas asignados</p>
                <p className="state-text">Cuando el administrador te asigne deportistas, aparecerán aquí con su calendario y su menú.</p>
              </div>
            ) : (
              <>
                {/* <1280: la lista es la pantalla (pila de navegación); ≥1280 la lista vive en la sidebar. */}
                <p className="list-group-title nut-index-count">
                  {athletes.length === 1 ? "1 deportista asignado" : `${athletes.length} deportistas asignados`}
                </p>
                <ul className="list-group nut-index-list">
                  {athletes.map((a) => (
                    <li key={a.id}>
                      <Link className="list-row list-row--disclosure" href={`/nutricion/${a.id}`}>
                        <img className="avatar avatar--sm" src={athletePhoto(a)} alt="" />
                        <span className="list-row-main">
                          {a.name}
                          <span className="list-row-sub">{sportLine(a)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="state nut-index-placeholder">
                  <svg className="state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
                    <path d="M3.5 10h17M8 3v4M16 3v4" />
                  </svg>
                  <p className="state-title">Elige un deportista</p>
                  <p className="state-text">Verás su calendario y podrás preparar su menú de la semana.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
