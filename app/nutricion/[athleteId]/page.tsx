import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { canSeeAthleteNutrition } from "@/lib/access";
import { assignedAthletesForNutritionist, athleteById, calendarPlansForAthlete } from "@/lib/queries";
import { planData } from "@/lib/plan-data";
import { BrandHeader } from "@/app/components/brand-header";
import { HeaderBackButton } from "@/app/components/header-back-button";
import { LogoutButton } from "@/app/logout-button";
import { NutAthleteNav } from "../athlete-nav";
import { NutricionAthleteClient } from "./nutricion-athlete-client";

export default async function NutricionAthletePage({ params }: { params: Promise<{ athleteId: string }> }) {
  const { athleteId } = await params;
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "nutritionist") notFound();
  if (!z.string().uuid().safeParse(athleteId).success) notFound();
  if (!(await canSeeAthleteNutrition(user, athleteId))) notFound();

  const data = await withRls(rlsFrom(user), async (tx) => {
    const athlete = await athleteById(tx, athleteId);
    if (!athlete) return null;
    const plans = await calendarPlansForAthlete(tx, athleteId);
    const athletes = await assignedAthletesForNutritionist(tx, user.id);
    return { athlete, plans, athletes };
  });
  if (!data) notFound();

  return (
    <>
      <BrandHeader
        player={data.athlete.name}
        leading={<HeaderBackButton href="/nutricion" />}
        trailing={<LogoutButton />}
      />
      <main className="page nut-page">
        <NutricionAthleteClient
          athleteId={data.athlete.id}
          dietNotes={data.athlete.dietNotes}
          supplements={data.athlete.supplements}
          plans={data.plans}
          crests={planData.crests}
          nav={<NutAthleteNav athletes={data.athletes} activeId={data.athlete.id} />}
        />
      </main>
    </>
  );
}
