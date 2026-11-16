import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { canSeeAthleteNutrition } from "@/lib/access";
import { assignedAthletesForNutritionist, athleteById, calendarPlansForAthlete } from "@/lib/queries";
import { planData } from "@/lib/plan-data";
import { HeaderBackButton } from "@/app/components/header-back-button";
import { LogoutButton } from "@/app/logout-button";
import { AthleteTabs } from "./athlete-tabs";
import { NutricionAthleteClient } from "./nutricion-athlete-client";

export default async function NutricionAthletePage({ params, searchParams }: { params: Promise<{ athleteId: string }>; searchParams: Promise<{ ajustes?: string }> }) {
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
      <main className="page nut-page nut-page--tabs">
        <AthleteTabs athleteId={data.athlete.id} />
        <NutricionAthleteClient
          accountLogin={user.email}
          athleteId={data.athlete.id}
          dietNotes={data.athlete.dietNotes}
          supplements={data.athlete.supplements}
          plans={data.plans}
          crests={planData.crests}
          athletes={data.athletes}
          playerName={data.athlete.name}
          headerLeading={<HeaderBackButton key="back" href="/nutricion" />}
          headerLogout={<LogoutButton key="logout" inline />}
          initialSettingsOpen={(await searchParams).ajustes === "1"}
        />
      </main>
    </>
  );
}
