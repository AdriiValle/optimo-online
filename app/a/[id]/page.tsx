import { notFound } from "next/navigation";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { athleteHome, diaryHistory } from "@/lib/queries";
import { addDays, dateKey, parseDateLocal, todayKey } from "@/lib/dates";
import { parseIndexHtml } from "@/lib/html-parse";
import { LogoutButton } from "@/app/logout-button";
import { HeaderActions } from "@/app/components/header-actions";
import { BrandHeader } from "@/app/components/brand-header";
import { HeaderBackButton } from "@/app/components/header-back-button";
import { HomeClient } from "./home-client";

export default async function AthleteHome({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) notFound();
  if (user.role === "athlete" && user.athleteId !== id) notFound();

  const isAdmin = user.role === "admin";
  const historyTo = todayKey();
  const historyFrom = dateKey(addDays(parseDateLocal(historyTo), -59));

  const data = await withRls(rlsFrom(user), async (tx) => {
    const home = await athleteHome(tx, id, historyTo);
    if (!home) return null;
    const history = isAdmin ? await diaryHistory(tx, id, historyFrom, historyTo) : null;
    return { home, history };
  });
  if (!data) notFound();

  const parsed = parseIndexHtml();

  return (
    <>
      <BrandHeader
        leading={isAdmin ? <HeaderBackButton href="/panel" /> : null}
        trailing={isAdmin ? <LogoutButton /> : <HeaderActions settingsHref="/ajustes" />}
      />
      <main className="page">
        <HomeClient
          athlete={data.home.athlete}
          plans={data.home.plans}
          diary={data.home.diary}
          injuries={data.home.injuries}
          crests={parsed.crests}
          canEdit={isAdmin || user.athleteId === id}
          isAdmin={isAdmin}
          history={data.history}
          historyFrom={historyFrom}
          historyTo={historyTo}
        />
      </main>
    </>
  );
}
