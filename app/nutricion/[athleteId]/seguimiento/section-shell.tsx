import Link from "next/link";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { canSeeAthleteNutrition } from "@/lib/access";
import { assignedAthletesForNutritionist, athleteById } from "@/lib/queries";
import { BrandHeader } from "@/app/components/brand-header";
import { HeaderBackButton } from "@/app/components/header-back-button";
import { LogoutButton } from "@/app/logout-button";
import { AccountSettingsLink } from "../account-settings-link";
import { NutAthleteNav } from "../../athlete-nav";
import { AthleteTabs } from "../athlete-tabs";

type Props = {
  params: Promise<{ athleteId: string }>;
  /** Encabezado accesible de la sección (el título visible es el del deportista). */
  heading: string;
  icon: ReactNode;
  title: string;
  text: string;
  /** Enlace de salida; `href` puede depender del deportista. */
  action?: { href: string | ((athleteId: string) => string); label: string };
};

/**
 * Armazón de las secciones del panel del deportista (todas menos «Menú», que tiene su cliente propio):
 * misma cabecera, sidebar y pestañas que el menú, y un estado vacío mientras la sección no tiene contenido.
 */
export async function AthleteSectionPage({ params, heading, icon, title, text, action }: Props) {
  const { athleteId } = await params;
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "nutritionist") notFound();
  if (!z.string().uuid().safeParse(athleteId).success) notFound();
  if (!(await canSeeAthleteNutrition(user, athleteId))) notFound();

  const data = await withRls(rlsFrom(user), async (tx) => {
    const athlete = await athleteById(tx, athleteId);
    if (!athlete) return null;
    const athletes = await assignedAthletesForNutritionist(tx, user.id);
    return { athlete, athletes };
  });
  if (!data) notFound();

  return (
    <>
      <BrandHeader
        wide
        player={data.athlete.name}
        leading={<HeaderBackButton href="/nutricion" />}
        trailing={
          <div className="top-actions nut-top-actions">
            <AccountSettingsLink athleteId={data.athlete.id} />
            <LogoutButton inline />
          </div>
        }
      />
      <main className="page nut-page nut-page--tabs">
        <AthleteTabs athleteId={data.athlete.id} />
        <div className="nut-desktop">
          <h1 className="nut-ws-title">{data.athlete.name}</h1>
          <NutAthleteNav athletes={data.athletes} activeId={data.athlete.id} />
          <section className="nut-ws-index nut-section" aria-label={heading}>
            <div className="state nut-section-state">
              {icon}
              <h2 className="state-title">{title}</h2>
              <p className="state-text">{text}</p>
              {action ? (
                <Link className="btn btn--tinted nut-section-action" href={typeof action.href === "function" ? action.href(data.athlete.id) : action.href}>
                  {action.label}
                </Link>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

/** Trazo común de los iconos de las secciones (SF Symbols-like, 24×24). */
export function SectionIcon({ children }: { children: ReactNode }) {
  return (
    <svg className="state-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}
