import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { canSeeAthleteNutrition } from "@/lib/access";
import { assignedAthletesForNutritionist, athleteById, athleteProfile } from "@/lib/queries";
import { todayKey } from "@/lib/dates";
import { measurementsFor, trackingCompliance } from "@/lib/nutrition/tracking-queries";
import { BrandHeader } from "@/app/components/brand-header";
import { HeaderBackButton } from "@/app/components/header-back-button";
import { LogoutButton } from "@/app/logout-button";
import { AccountSettingsLink } from "../account-settings-link";
import { NutAthleteNav } from "../../athlete-nav";
import { AthleteTabs } from "../athlete-tabs";
import { CompliancePanel } from "./compliance-panel";
import { MeasurementsPanel } from "./measurements-panel";

/**
 * Pestaña Seguimiento del panel de Amanda: cumplimiento del menú (checks del jugador, con su foto junto
 * a la del plan) y medidas corporales con su gráfica. Nunca se enseña al jugador.
 */
export default async function SeguimientoPage({ params }: { params: Promise<{ athleteId: string }> }) {
  const { athleteId } = await params;
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "nutritionist") notFound();
  if (!z.string().uuid().safeParse(athleteId).success) notFound();
  if (!(await canSeeAthleteNutrition(user, athleteId))) notFound();

  const today = todayKey();
  const data = await withRls(rlsFrom(user), async (tx) => {
    const athlete = await athleteById(tx, athleteId);
    if (!athlete) return null;
    const [athletes, compliance, measurements, profile] = await Promise.all([
      assignedAthletesForNutritionist(tx, user.id),
      trackingCompliance(tx, athleteId, today),
      measurementsFor(tx, athleteId),
      athleteProfile(tx, athleteId)
    ]);
    return { athlete, athletes, compliance, measurements, profileWeightKg: profile?.weightKg ?? null };
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
          <section className="nut-ws-index nut-section nut-trk-page" aria-labelledby="nut-trk-title">
            <div className="nut-trk-inner">
              <header className="nut-trk-head">
                <h2 id="nut-trk-title" className="nut-trk-title">
                  Seguimiento
                </h2>
                <p className="nut-trk-lead">Cumplimiento del menú y evolución de las medidas. Solo lo ves tú.</p>
              </header>
              <CompliancePanel compliance={data.compliance} />
              <MeasurementsPanel
                athleteId={data.athlete.id}
                today={today}
                initialMeasurements={data.measurements}
                initialProfileWeightKg={data.profileWeightKg}
              />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
