import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { panelCards } from "@/lib/queries";
import { todayKey } from "@/lib/dates";
import { HeaderActions } from "@/app/components/header-actions";
import { BrandHeader } from "@/app/components/brand-header";
import { DeportistasSection } from "./deportistas-section";

const SPORT_LABEL: Record<string, string> = { football: "Fútbol", running: "Running" };

const numEs = (n: number) => String(Math.round(n * 10) / 10).replace(".", ",");

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "·";
}

export default async function PanelPage() {
  const user = await currentUser();
  if (!user || user.role !== "admin") notFound();
  const today = todayKey();

  const cards = await withRls(rlsFrom(user), (tx) => panelCards(tx, today));

  return (
    <>
      <BrandHeader meta="Panel" trailing={<HeaderActions settingsHref="/panel/ajustes" />} />
      <main className="page adm-page">
        <DeportistasSection count={cards.length}>
          <div className="adm-table">
            <div className="adm-table-head" aria-hidden="true">
              <span className="adm-col-who">Deportista</span>
              <span className="adm-col-rec">Recuperación hoy</span>
              <span className="adm-col-injury">Lesión abierta</span>
            </div>
            <ul className="adm-list">
              {cards.map((a) => {
                const sport = SPORT_LABEL[a.sport] ?? "Otro";
                const sub = [sport, a.team, a.shirtNumber ? `#${a.shirtNumber}` : null].filter(Boolean).join(" · ");
                const fisico = [
                  a.ageYears !== null ? `${a.ageYears} años` : null,
                  a.heightCm !== null ? `${numEs(a.heightCm)} cm` : null,
                  a.weightKg !== null ? `${numEs(a.weightKg)} kg` : null
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <li key={a.id}>
                    <Link className="adm-row" href={`/a/${a.id}`}>
                      {a.hasPhoto ? (
                        <img className="avatar adm-avatar" src={`/api/athletes/${a.id}/photo`} alt="" />
                      ) : (
                        <span className="avatar adm-avatar" aria-hidden="true">
                          {initials(a.name)}
                        </span>
                      )}
                      <span className="adm-who">
                        <span className="adm-name">{a.name}</span>
                        <span className="adm-sub">{sub}</span>
                        {fisico ? <span className="adm-sub">{fisico}</span> : null}
                      </span>
                      <span className="adm-meta">
                        <span className="adm-rec">
                          <span className="adm-meta-label">Recuperación hoy</span>{" "}
                          {a.recovery === null ? (
                            <span className="adm-none">
                              <span aria-hidden="true">—</span>
                              <span className="sr-only">sin dato</span>
                            </span>
                          ) : (
                            <span className="adm-rec-value">
                              {a.recovery}
                              <span className="adm-rec-scale">/100</span>
                            </span>
                          )}
                        </span>
                        <span className={a.injury ? "adm-injury adm-injury--open" : "adm-injury"}>
                          <span className="adm-meta-label">Lesión abierta</span>{" "}
                          {a.injury ? (
                            <span className="adm-badge">
                              <span className="adm-badge-dot" aria-hidden="true" />
                              {a.injury.zone || "Sin zona"}
                            </span>
                          ) : (
                            <span className="adm-none">Ninguna</span>
                          )}
                        </span>
                      </span>
                      <span className="adm-chevron" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </DeportistasSection>
      </main>
    </>
  );
}
