import { notFound } from "next/navigation";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { athleteById, dayPlansForAthlete, diaryFor, openInjuries } from "@/lib/queries";
import { todayKey } from "@/lib/dates";
import { parseIndexHtml } from "@/lib/html-parse";
import { LogoutButton } from "@/app/logout-button";
import { BrandHeader } from "@/app/components/brand-header";
import { HomeClient } from "./home-client";

export default async function AthleteHome({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) notFound();
  if (user.role === "athlete" && user.athleteId !== id) notFound();

  const data = await withRls(rlsFrom(user), async (tx) => {
    const athlete = await athleteById(tx, id);
    if (!athlete) return null;
    const plans = await dayPlansForAthlete(tx, id);
    const diary = await diaryFor(tx, id, todayKey());
    const injuries = await openInjuries(tx, id);
    return { athlete, plans, diary, injuries };
  });
  if (!data) notFound();

  const parsed = parseIndexHtml();

  const shirtMeta = data.athlete.shirtNumber
    ? `#${data.athlete.shirtNumber} ${data.athlete.team ?? ""}`.trimEnd()
    : undefined;

  return (
    <main className="page">
      <BrandHeader
        player={data.athlete.name}
        meta={shirtMeta}
        trailing={<LogoutButton />}
      />
      <HomeClient
        athlete={data.athlete}
        plans={data.plans}
        diary={data.diary}
        injuries={data.injuries}
        crests={parsed.crests}
        canEdit={user.role === "admin" || user.athleteId === id}
      />
    </main>
  );
}
