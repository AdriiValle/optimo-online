import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { canSeeAthleteNutrition } from "@/lib/access";
import { assignedAthletesForNutritionist, athleteById } from "@/lib/queries";
import { BrandHeader } from "@/app/components/brand-header";
import { HeaderBackButton } from "@/app/components/header-back-button";
import { LogoutButton } from "@/app/logout-button";
import { NutAthleteNav } from "../../athlete-nav";
import { AthleteTabs } from "../athlete-tabs";
import { ProfilePanel } from "./profile-panel";

/**
 * Pestaña Perfil del panel de Amanda: ficha física, meta, alergias e intolerancias,
 * «mostrar números al jugador» y objetivos propios sobre los calculados. Misma cabecera,
 * sidebar y pestañas que el resto de secciones del deportista.
 */
export default async function PerfilPage({ params }: { params: Promise<{ athleteId: string }> }) {
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
            <LogoutButton inline />
          </div>
        }
      />
      <main className="page nut-page nut-page--tabs">
        <AthleteTabs athleteId={data.athlete.id} />
        <div className="nut-desktop">
          <h1 className="nut-ws-title">{data.athlete.name}</h1>
          <NutAthleteNav athletes={data.athletes} activeId={data.athlete.id} />
          <section className="nut-ws-index nut-section nut-prof-page" aria-labelledby="nut-prof-page-title">
            <div className="nut-prof-page-inner">
              <header className="nut-prof-page-head">
                <h2 id="nut-prof-page-title" className="nut-prof-page-title">
                  Perfil nutricional
                </h2>
                <p className="nut-prof-page-lead">
                  Datos, alergias y objetivos en una sola ficha. Se guarda todo junto.
                </p>
              </header>
              <ProfilePanel athleteId={data.athlete.id} />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
