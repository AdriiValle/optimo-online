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

/** Sidebar de deportistas asignados (workspace desktop ≥1280px): selección de macOS/iPadOS. */
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
          <div className="nut-ws-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              placeholder="Buscar"
              aria-label="Buscar deportista por nombre"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        ) : null}
        {athletes.length === 0 ? (
          <p className="nut-ws-list-note">Aún no tienes deportistas asignados.</p>
        ) : shown.length === 0 ? (
          <p className="nut-ws-list-note">Sin resultados para «{query.trim()}».</p>
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
                    <span className="nut-ws-list-sub">{sportLine(a)}</span>
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
