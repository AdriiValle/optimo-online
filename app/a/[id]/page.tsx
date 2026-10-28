import { notFound } from "next/navigation";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { athleteById, dayPlansForAthlete, diaryFor, openInjuries } from "@/lib/queries";
import { todayKey } from "@/lib/dates";
import { parseIndexHtml } from "@/lib/html-parse";
import { LogoutButton } from "@/app/logout-button";
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

  return (
    <main className="page">
      <header className="doc-header">
        <div className="brand-row">
          <img className="brand-logo" src="/logo-optimo.png" width={32} height={32} alt="" />
          <span className="brand-title">Óptimo</span>
          <span className="brand-sep">·</span>
          <span className="brand-player">{data.athlete.name}</span>
          {data.athlete.shirtNumber ? (
            <>
              <span className="brand-sep">·</span>
              <span className="brand-meta">
                #{data.athlete.shirtNumber} {data.athlete.team}
              </span>
            </>
          ) : null}
        </div>
      </header>
      <LogoutButton />
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
