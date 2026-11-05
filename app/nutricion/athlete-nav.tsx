import Link from "next/link";
import type { NutritionistAthleteCard } from "@/lib/queries";

export function sportLine(a: NutritionistAthleteCard) {
  const sport = a.sport === "football" ? "Fútbol" : a.sport === "running" ? "Running" : "Otro";
  return `${sport}${a.team ? ` · ${a.team}` : ""}${a.shirtNumber ? ` #${a.shirtNumber}` : ""}`;
}

export function athletePhoto(a: NutritionistAthleteCard) {
  return a.hasPhoto ? `/api/athletes/${a.id}/photo` : "/logo-optimo.png";
}

/** Lista persistente de deportistas asignados (columna izquierda del workspace desktop ≥1280px). */
export function NutAthleteNav({ athletes, activeId }: { athletes: NutritionistAthleteCard[]; activeId?: string }) {
  return (
    <nav className="nut-ws-list" aria-label="Deportistas asignados">
      <h2>Deportistas</h2>
      {athletes.length === 0 ? (
        <p className="muted">Aún no tienes deportistas asignados.</p>
      ) : (
        <ul>
          {athletes.map((a) => (
            <li key={a.id}>
              <Link
                href={`/nutricion/${a.id}`}
                className={a.id === activeId ? "on" : undefined}
                aria-current={a.id === activeId ? "page" : undefined}
              >
                <img className="avatar" src={athletePhoto(a)} alt="" />
                <span>
                  <strong>{a.name}</strong>
                  <span className="muted">{sportLine(a)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
