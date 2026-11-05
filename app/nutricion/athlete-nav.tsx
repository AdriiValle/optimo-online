"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { NutritionistAthleteCard } from "@/lib/queries";
import { athletePhoto, sportLine } from "./athlete-nav-shared";

type Props = {
  athletes: NutritionistAthleteCard[];
  activeId?: string;
  onOpenSettings?: () => void;
  /** Salir u otras acciones fijas al pie del rail (desktop). */
  footActions?: ReactNode;
};

/** Lista persistente de deportistas asignados (columna izquierda del workspace desktop ≥1280px). */
export function NutAthleteNav({ athletes, activeId, onOpenSettings, footActions }: Props) {
  return (
    <nav className="nut-ws-list" aria-label="Deportistas asignados">
      <div className="nut-ws-list-body">
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
      </div>
      {(onOpenSettings || footActions) && (
        <div className="nut-ws-list-foot">
          {onOpenSettings ? (
            <button type="button" className="nut-rail-btn" onClick={onOpenSettings}>
              Ajustes
            </button>
          ) : null}
          {footActions}
        </div>
      )}
    </nav>
  );
}
