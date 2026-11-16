import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { canSeeAthleteNutrition } from "@/lib/access";
import { assignedAthletesForNutritionist, athleteById } from "@/lib/queries";
import { addDays, dateKey, parseDateLocal, startOfWeekMonday, todayKey } from "@/lib/dates";
import { foodOptions, listDishes, listSwaps, listTemplates } from "@/lib/nutrition/templates-queries";
import { BrandHeader } from "@/app/components/brand-header";
import { HeaderBackButton } from "@/app/components/header-back-button";
import { LogoutButton } from "@/app/logout-button";
import { NutAthleteNav } from "../../athlete-nav";
import { AthleteTabs } from "../athlete-tabs";
import { PlantillasPanel } from "./plantillas-panel";

/**
 * Pestaña Plantillas y platos del panel de Amanda: guardar un día o una semana del menú como plantilla y
 * aplicarla a otras fechas, la biblioteca de platos y las sustituciones de alimentos aprobadas.
 */
export default async function PlantillasPage({ params }: { params: Promise<{ athleteId: string }> }) {
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
    const [athletes, templates, dishes, swaps, foods] = await Promise.all([
      assignedAthletesForNutritionist(tx, user.id),
      listTemplates(tx),
      listDishes(tx),
      listSwaps(tx),
      foodOptions(tx)
    ]);
    return { athlete, athletes, templates, dishes, swaps, foods };
  });
  if (!data) notFound();

  const thisMonday = startOfWeekMonday(today);
  const nextMonday = dateKey(addDays(parseDateLocal(thisMonday), 7));

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
          <section className="nut-ws-index nut-section nut-trk-page nut-tpl-page" aria-labelledby="nut-tpl-title">
            <div className="nut-trk-inner">
              <header className="nut-trk-head">
                <h2 id="nut-tpl-title" className="nut-trk-title">
                  Plantillas y platos
                </h2>
                <p className="nut-trk-lead">
                  Guarda lo que repites y aplícalo a otras fechas. Las plantillas, los platos y las sustituciones sirven
                  para todos tus deportistas.
                </p>
              </header>
              <PlantillasPanel
                athleteId={data.athlete.id}
                athleteName={data.athlete.name}
                today={today}
                thisMonday={thisMonday}
                nextMonday={nextMonday}
                initialTemplates={data.templates}
                initialDishes={data.dishes}
                initialSwaps={data.swaps}
                foods={data.foods}
              />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
