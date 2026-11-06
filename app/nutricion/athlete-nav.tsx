"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { NutritionistAthleteCard } from "@/lib/queries";
import { athletePhoto, sportLine } from "./athlete-nav-shared";

type Props = {
  athletes: NutritionistAthleteCard[];
  activeId?: string;
  /** Bloque sobre la lista (calendario), solo desktop. */
  above?: ReactNode;
};

/** Lista persistente de deportistas asignados (columna izquierda del workspace desktop ≥1280px). */
export function NutAthleteNav({ athletes, activeId, above }: Props) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? athletes.filter((a) => a.name.toLowerCase().includes(q)) : athletes;
  return (
    <nav className="nut-ws-list" aria-label="Deportistas asignados">
      {above ? <div className="nut-ws-list-above">{above}</div> : null}
      <div className="nut-ws-list-body">
        <h2>Deportistas</h2>
        {athletes.length > 0 ? (
          <input
            type="search"
            className="nut-ws-search"
            placeholder="Buscar deportista"
            aria-label="Buscar deportista por nombre"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        ) : null}
        {athletes.length === 0 ? (
          <p className="muted">Aún no tienes deportistas asignados.</p>
        ) : shown.length === 0 ? (
          <p className="muted">Sin resultados.</p>
        ) : (
          <ul>
            {shown.map((a) => (
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
      </div>
    </nav>
  );
}
